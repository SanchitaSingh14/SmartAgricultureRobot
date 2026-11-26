"""
FastAPI Routes: Complete API endpoints for the Smart Agriculture Robot platform.
"""
import io
import csv
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.entities import (
    SensorReading, AgentDecision, IrrigationEvent, Alert, RobotState, CropAnalysis
)
from app.schemas.farm_schema import (
    SensorReadingOut, SensorReadingCreate, AgentDecisionOut, AlertOut,
    IrrigationEventOut, RobotStateOut, ManualIrrigationRequest,
    SimulationControlRequest, CropAnalysisOut, SystemStatusOut,
    SettingsUpdate, SettingsOut
)
from app.core.config import settings
from app.services.sensor_simulator import simulator, SCENARIOS
from app.services.crop_service import process_crop_image
from app.agents.coordinator import AgentCoordinator
from app.services.mqtt_service import mqtt_service

router = APIRouter()
coordinator = AgentCoordinator()

def get_or_create_robot_state(db: Session) -> RobotState:
    state = db.query(RobotState).first()
    if not state:
        state = RobotState(
            pos_x=0.0,
            pos_y=0.0,
            heading=0.0,
            current_action="STOP",
            pump_active=False,
            manual_mode=False,
            simulation_running=True,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(state)
        db.commit()
        db.refresh(state)
    return state

# 1. Health & Status
@router.get("/health")
def check_health():
    return {
        "status": "healthy",
        "service": "Smart Agriculture Robot Backend",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/status", response_model=SystemStatusOut)
def get_system_status(db: Session = Depends(get_db)):
    robot = get_or_create_robot_state(db)
    latest = db.query(SensorReading).order_by(desc(SensorReading.id)).first()
    active_alerts = db.query(Alert).filter(Alert.is_active == True).count()
    
    return {
        "status": "OPERATIONAL",
        "simulation_running": robot.simulation_running,
        "robot_state": robot,
        "latest_reading": latest,
        "active_alerts_count": active_alerts,
        "mqtt_connected": mqtt_service.is_connected
    }

# 2. Sensors
@router.get("/sensors/latest", response_model=Optional[SensorReadingOut])
def get_latest_sensor_reading(db: Session = Depends(get_db)):
    reading = db.query(SensorReading).order_by(desc(SensorReading.id)).first()
    return reading

@router.get("/sensors/history", response_model=List[SensorReadingOut])
def get_sensor_history(limit: int = 50, db: Session = Depends(get_db)):
    readings = db.query(SensorReading).order_by(desc(SensorReading.id)).limit(limit).all()
    return list(reversed(readings))

@router.post("/sensors/simulate", response_model=SensorReadingOut)
def post_simulated_sensor(reading_in: SensorReadingCreate, db: Session = Depends(get_db)):
    """Manually inject custom or test scenario sensor readings."""
    reading = SensorReading(
        timestamp=datetime.now(timezone.utc),
        soil_moisture=reading_in.soil_moisture,
        temperature=reading_in.temperature,
        humidity=reading_in.humidity,
        left_distance=reading_in.left_distance,
        center_distance=reading_in.center_distance,
        right_distance=reading_in.right_distance,
        is_simulated=True,
        source=reading_in.source or "manual_post"
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    robot = get_or_create_robot_state(db)
    # Trigger multi-agent pipeline immediately on fresh data
    coordinator.run_cycle(db, reading, robot)

    return reading

@router.get("/simulation/scenarios")
def list_scenarios():
    return {k: {"name": v["name"], "description": v["description"]} for k, v in SCENARIOS.items()}

@router.post("/simulation/scenario/{scenario_key}")
def apply_scenario(scenario_key: str, db: Session = Depends(get_db)):
    if scenario_key not in SCENARIOS:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_key}' not found.")
    
    simulator.set_scenario(scenario_key)
    reading_data = simulator.generate_reading()
    
    reading = SensorReading(
        timestamp=datetime.now(timezone.utc),
        soil_moisture=reading_data["soil_moisture"],
        temperature=reading_data["temperature"],
        humidity=reading_data["humidity"],
        left_distance=reading_data["left_distance"],
        center_distance=reading_data["center_distance"],
        right_distance=reading_data["right_distance"],
        is_simulated=True,
        source=f"scenario_{scenario_key}"
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    robot = get_or_create_robot_state(db)
    coordinator.run_cycle(db, reading, robot)

    return {"message": f"Applied scenario: {SCENARIOS[scenario_key]['name']}", "reading": reading_data}

# 3. Simulation Controls
@router.post("/simulation/start")
def start_simulation(db: Session = Depends(get_db)):
    robot = get_or_create_robot_state(db)
    robot.simulation_running = True
    db.commit()
    return {"message": "Simulation started", "running": True}

@router.post("/simulation/pause")
def pause_simulation(db: Session = Depends(get_db)):
    robot = get_or_create_robot_state(db)
    robot.simulation_running = False
    db.commit()
    return {"message": "Simulation paused", "running": False}

@router.post("/simulation/reset")
def reset_simulation(db: Session = Depends(get_db)):
    robot = get_or_create_robot_state(db)
    robot.pos_x = 0.0
    robot.pos_y = 0.0
    robot.heading = 0.0
    robot.current_action = "STOP"
    robot.pump_active = False
    robot.manual_mode = False
    robot.simulation_running = True
    db.commit()
    
    simulator.set_scenario("normal")
    return {"message": "Simulation environment reset to defaults", "robot": robot}

# 4. Agent Execution & Decisions
@router.get("/agents")
def list_agents():
    return {
        "agents": [
            {"name": "Irrigation Agent", "type": "Rule-Based Expert", "role": "Governs soil moisture & irrigation activation"},
            {"name": "Navigation Agent", "type": "Obstacle Avoidance Heuristic", "role": "Analyzes 3-point range scan and plans path"},
            {"name": "Environment Agent", "type": "Microclimate Monitor", "role": "Detects heat stress & humidity extremes"},
            {"name": "Crop Monitoring Agent", "type": "OpenCV / Vegetation Index", "role": "Calculates Excess Green Index (ExG) & chlorosis"},
            {"name": "Farm Manager Agent", "type": "Multi-Agent Coordinator", "role": "Synthesizes agent directives and enforces safety locks"}
        ]
    }

@router.post("/agents/run")
def trigger_agent_run(db: Session = Depends(get_db)):
    """Generates the next simulation cycle and runs the full multi-agent pipeline."""
    robot = get_or_create_robot_state(db)
    data = simulator.generate_reading()
    
    reading = SensorReading(
        timestamp=datetime.now(timezone.utc),
        soil_moisture=data["soil_moisture"],
        temperature=data["temperature"],
        humidity=data["humidity"],
        left_distance=data["left_distance"],
        center_distance=data["center_distance"],
        right_distance=data["right_distance"],
        is_simulated=True,
        source=data.get("source", "simulation_step")
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    results = coordinator.run_cycle(db, reading, robot)
    return {"reading": reading, "cycle_results": results}

@router.get("/decisions", response_model=List[AgentDecisionOut])
def get_decisions(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(AgentDecision).order_by(desc(AgentDecision.id)).limit(limit).all()

# 5. Alerts
@router.get("/alerts", response_model=List[AlertOut])
def get_alerts(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Alert).order_by(desc(Alert.id)).limit(limit).all()

@router.post("/alerts/clear")
def clear_alerts(db: Session = Depends(get_db)):
    db.query(Alert).update({Alert.is_active: False})
    db.commit()
    return {"message": "All active alerts acknowledged."}

# 6. Irrigation Control
@router.post("/irrigation/manual")
def set_manual_irrigation(request: ManualIrrigationRequest, db: Session = Depends(get_db)):
    robot = get_or_create_robot_state(db)
    robot.manual_mode = True
    new_state = (request.action.upper() == "PUMP_ON")
    robot.pump_active = new_state
    
    event = IrrigationEvent(
        timestamp=datetime.now(timezone.utc),
        action="PUMP_ON" if new_state else "PUMP_OFF",
        mode="MANUAL_OVERRIDE",
        trigger_reason=request.reason or "Manual dashboard operator trigger"
    )
    db.add(event)
    db.commit()

    return {"message": f"Virtual pump set to {'ON' if new_state else 'OFF'}", "manual_mode": True, "pump_active": new_state}

@router.post("/irrigation/auto")
def set_auto_irrigation(db: Session = Depends(get_db)):
    robot = get_or_create_robot_state(db)
    robot.manual_mode = False
    db.commit()
    return {"message": "Automated irrigation mode restored.", "manual_mode": False}

@router.get("/irrigation/events", response_model=List[IrrigationEventOut])
def get_irrigation_events(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(IrrigationEvent).order_by(desc(IrrigationEvent.id)).limit(limit).all()

# 7. Robot State
@router.get("/robot/state", response_model=RobotStateOut)
def get_robot_state(db: Session = Depends(get_db)):
    return get_or_create_robot_state(db)

# 8. Crop Monitoring Vision
@router.post("/crop/analyze", response_model=CropAnalysisOut)
async def analyze_crop(file: UploadFile = File(...), db: Session = Depends(get_db)):
    res = await process_crop_image(file)
    
    entry = CropAnalysis(
        timestamp=datetime.now(timezone.utc),
        filename=res["filename"],
        health_status=res["health_status"],
        greenness_index=res.get("greenness_index"),
        yellowing_ratio=res.get("yellowing_ratio"),
        notes=res["notes"],
        model_used=res["model_used"]
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.get("/crop/history", response_model=List[CropAnalysisOut])
def get_crop_history(limit: int = 20, db: Session = Depends(get_db)):
    return db.query(CropAnalysis).order_by(desc(CropAnalysis.id)).limit(limit).all()

# 9. Reports & CSV Export
@router.get("/reports/export")
def export_csv(dataset: str = "sensors", db: Session = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)

    if dataset == "sensors":
        writer.writerow(["ID", "Timestamp", "SoilMoisture", "Temperature", "Humidity", "LeftDist", "CenterDist", "RightDist", "IsSimulated", "Source"])
        rows = db.query(SensorReading).order_by(SensorReading.id).all()
        for r in rows:
            writer.writerow([r.id, r.timestamp.isoformat() if r.timestamp else "", r.soil_moisture, r.temperature, r.humidity, r.left_distance, r.center_distance, r.right_distance, r.is_simulated, r.source])
    elif dataset == "decisions":
        writer.writerow(["ID", "Timestamp", "AgentName", "Decision", "Priority", "Reason", "ActionTaken"])
        rows = db.query(AgentDecision).order_by(AgentDecision.id).all()
        for r in rows:
            writer.writerow([r.id, r.timestamp.isoformat() if r.timestamp else "", r.agent_name, r.decision, r.priority, r.reason, r.action_taken])
    elif dataset == "irrigation":
        writer.writerow(["ID", "Timestamp", "Action", "Mode", "TriggerReason", "SoilValue", "Temperature", "Humidity"])
        rows = db.query(IrrigationEvent).order_by(IrrigationEvent.id).all()
        for r in rows:
            writer.writerow([r.id, r.timestamp.isoformat() if r.timestamp else "", r.action, r.mode, r.trigger_reason, r.soil_value, r.temperature, r.humidity])
    else:
        raise HTTPException(status_code=400, detail="Unknown dataset type. Choose 'sensors', 'decisions', or 'irrigation'.")

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=agri_robot_{dataset}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

# 10. Settings Management
@router.get("/settings", response_model=SettingsOut)
def get_settings():
    return SettingsOut(
        dry_soil_threshold=coordinator.irrigation_agent.dry_soil_threshold,
        obstacle_threshold_cm=coordinator.navigation_agent.obstacle_threshold_cm,
        simulation_interval_seconds=settings.SIMULATION_INTERVAL_SECONDS,
        mqtt_broker_host=settings.MQTT_BROKER_HOST,
        mqtt_broker_port=settings.MQTT_BROKER_PORT,
        database_url=settings.DATABASE_URL
    )

@router.post("/settings", response_model=SettingsOut)
def update_settings(payload: SettingsUpdate):
    coordinator.irrigation_agent.dry_soil_threshold = payload.dry_soil_threshold
    coordinator.navigation_agent.obstacle_threshold_cm = payload.obstacle_threshold_cm
    settings.SIMULATION_INTERVAL_SECONDS = payload.simulation_interval_seconds
    return get_settings()

