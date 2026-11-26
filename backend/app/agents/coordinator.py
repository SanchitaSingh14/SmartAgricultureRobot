"""
Agent Coordinator:
Coordinates execution of all specialized agents in sequence,
updates database records, manages state transitions, and enforces safety bounds.
"""
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.agents.irrigation_agent import IrrigationAgent
from app.agents.navigation_agent import NavigationAgent
from app.agents.environment_agent import EnvironmentAgent
from app.agents.crop_monitoring_agent import CropMonitoringAgent
from app.agents.farm_manager_agent import FarmManagerAgent
from app.models.entities import AgentDecision, Alert, IrrigationEvent, RobotState, SensorReading

class AgentCoordinator:
    def __init__(self, dry_soil_threshold: int = 1300):
        self.irrigation_agent = IrrigationAgent(dry_soil_threshold=dry_soil_threshold)
        self.navigation_agent = NavigationAgent(obstacle_threshold_cm=20.0)
        self.environment_agent = EnvironmentAgent()
        self.crop_agent = CropMonitoringAgent()
        self.farm_manager = FarmManagerAgent()

    def run_cycle(
        self,
        db: Session,
        reading: SensorReading,
        robot_state: RobotState,
        latest_crop_decision: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute one full multi-agent cycle given the latest sensor reading and robot state.
        Persists decisions and state transitions in SQLite.
        """
        now = datetime.now(timezone.utc)

        # 1. Run Irrigation Agent
        irrigation_res = self.irrigation_agent.evaluate(
            soil_value=reading.soil_moisture,
            temperature=reading.temperature,
            humidity=reading.humidity,
            current_pump_state=robot_state.pump_active,
            manual_override=robot_state.manual_mode
        )

        # Update pump state if not manual override
        if not robot_state.manual_mode:
            new_pump_state = irrigation_res["pump_state"]
            if new_pump_state != robot_state.pump_active:
                robot_state.pump_active = new_pump_state
                # Record irrigation event
                event = IrrigationEvent(
                    timestamp=now,
                    action="PUMP_ON" if new_pump_state else "PUMP_OFF",
                    mode="AUTO",
                    trigger_reason=irrigation_res["reason"],
                    soil_value=reading.soil_moisture,
                    temperature=reading.temperature,
                    humidity=reading.humidity
                )
                db.add(event)

        # 2. Run Navigation Agent
        navigation_res = self.navigation_agent.evaluate(
            left_dist=reading.left_distance,
            center_dist=reading.center_distance,
            right_dist=reading.right_distance
        )

        # Update simulated robot action & kinematics
        robot_state.current_action = navigation_res["action"]
        self._update_robot_kinematics(robot_state, navigation_res["action"])

        # 3. Run Environment Agent
        environment_res = self.environment_agent.evaluate(
            temperature=reading.temperature,
            humidity=reading.humidity
        )

        # 4. Run Farm Manager Agent (Synthesis)
        manager_res = self.farm_manager.evaluate(
            irrigation_decision=irrigation_res,
            navigation_decision=navigation_res,
            environment_decision=environment_res,
            crop_decision=latest_crop_decision
        )

        robot_state.timestamp = now

        # Persist Agent Decisions
        all_agent_results = [irrigation_res, navigation_res, environment_res, manager_res]
        for res in all_agent_results:
            decision_entry = AgentDecision(
                timestamp=now,
                agent_name=res["agent_name"],
                decision=res["decision"],
                priority=res["priority"],
                reason=res["reason"],
                action_taken=res.get("action"),
                metadata_json=json.dumps({k: v for k, v in res.items() if k not in ["agent_name", "decision", "priority", "reason", "action"]})
            )
            db.add(decision_entry)

            # Create Alert if flagged by agent
            alert_msg = res.get("alert")
            if alert_msg:
                alert = Alert(
                    timestamp=now,
                    level="CRITICAL" if res["priority"] in ["HIGH", "CRITICAL"] else "WARNING",
                    category=res["agent_name"].split()[0].upper(),
                    message=alert_msg,
                    is_active=True
                )
                db.add(alert)

        db.commit()

        return {
            "irrigation": irrigation_res,
            "navigation": navigation_res,
            "environment": environment_res,
            "farm_manager": manager_res,
            "robot_state": {
                "pos_x": robot_state.pos_x,
                "pos_y": robot_state.pos_y,
                "heading": robot_state.heading,
                "current_action": robot_state.current_action,
                "pump_active": robot_state.pump_active
            }
        }

    def _update_robot_kinematics(self, state: RobotState, action: str):
        """Simulate kinematic movement on the 2D virtual farm grid."""
        import math
        step_distance = 0.5 # 0.5 meters forward step
        turn_angle = 30.0   # 30 degrees turn per cycle

        if action == "MOVE_FORWARD":
            rad = math.radians(state.heading)
            # 0 deg = North (+Y), 90 deg = East (+X)
            state.pos_x += step_distance * math.sin(rad)
            state.pos_y += step_distance * math.cos(rad)
        elif action == "TURN_LEFT":
            state.heading = (state.heading - turn_angle) % 360.0
        elif action == "TURN_RIGHT":
            state.heading = (state.heading + turn_angle) % 360.0
        elif action == "STOP":
            pass # Keep current coordinates and heading

