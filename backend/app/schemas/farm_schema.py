from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SensorReadingBase(BaseModel):
    soil_moisture: Optional[float] = Field(None, description="Analog soil moisture sensor reading (0-4095)")
    temperature: Optional[float] = Field(None, description="DHT22 ambient temperature in Celsius")
    humidity: Optional[float] = Field(None, description="DHT22 ambient relative humidity %")
    left_distance: Optional[float] = Field(None, description="HC-SR04 obstacle distance on left in cm")
    center_distance: Optional[float] = Field(None, description="HC-SR04 obstacle distance on center in cm")
    right_distance: Optional[float] = Field(None, description="HC-SR04 obstacle distance on right in cm")
    is_simulated: bool = True
    source: str = "simulation"

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReadingOut(SensorReadingBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class AgentDecisionOut(BaseModel):
    id: int
    timestamp: datetime
    agent_name: str
    decision: str
    priority: str
    reason: str
    action_taken: Optional[str] = None
    metadata_json: Optional[str] = None

    class Config:
        from_attributes = True

class AlertOut(BaseModel):
    id: int
    timestamp: datetime
    level: str
    category: str
    message: str
    is_active: bool

    class Config:
        from_attributes = True

class IrrigationEventOut(BaseModel):
    id: int
    timestamp: datetime
    action: str
    mode: str
    trigger_reason: str
    soil_value: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None

    class Config:
        from_attributes = True

class RobotStateOut(BaseModel):
    pos_x: float
    pos_y: float
    heading: float
    current_action: str
    pump_active: bool
    manual_mode: bool
    simulation_running: bool
    timestamp: datetime

    class Config:
        from_attributes = True

class ManualIrrigationRequest(BaseModel):
    action: str = Field(..., description="'PUMP_ON' or 'PUMP_OFF'")
    reason: Optional[str] = "Manual operator override"

class SimulationControlRequest(BaseModel):
    action: str = Field(..., description="'start', 'pause', 'reset'")

class CropAnalysisOut(BaseModel):
    id: int
    timestamp: datetime
    filename: str
    health_status: str
    greenness_index: Optional[float] = None
    yellowing_ratio: Optional[float] = None
    notes: str
    model_used: str

    class Config:
        from_attributes = True

class SystemStatusOut(BaseModel):
    status: str
    simulation_running: bool
    robot_state: RobotStateOut
    latest_reading: Optional[SensorReadingOut] = None
    active_alerts_count: int
    mqtt_connected: bool

class SettingsUpdate(BaseModel):
    dry_soil_threshold: int = Field(1300, ge=0, le=4095)
    obstacle_threshold_cm: float = Field(20.0, ge=2.0, le=200.0)
    simulation_interval_seconds: float = Field(2.0, ge=0.5, le=60.0)

class SettingsOut(SettingsUpdate):
    mqtt_broker_host: str
    mqtt_broker_port: int
    database_url: str

