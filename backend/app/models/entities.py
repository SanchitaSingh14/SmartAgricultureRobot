from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, Text
from app.database.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=utcnow, index=True)
    soil_moisture = Column(Float, nullable=True) # 0 - 4095
    temperature = Column(Float, nullable=True)   # Celsius
    humidity = Column(Float, nullable=True)      # %
    left_distance = Column(Float, nullable=True)  # cm
    center_distance = Column(Float, nullable=True)# cm
    right_distance = Column(Float, nullable=True) # cm
    is_simulated = Column(Boolean, default=True)
    source = Column(String(50), default="simulation") # simulation, wokwi, mqtt, manual

class AgentDecision(Base):
    __tablename__ = "agent_decisions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=utcnow, index=True)
    agent_name = Column(String(50), index=True) # Irrigation, Navigation, Environment, FarmManager, CropMonitoring
    decision = Column(String(100))
    priority = Column(String(20), default="NORMAL") # LOW, NORMAL, HIGH, CRITICAL, NONE
    reason = Column(Text)
    action_taken = Column(String(100), nullable=True)
    metadata_json = Column(Text, nullable=True)

class IrrigationEvent(Base):
    __tablename__ = "irrigation_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=utcnow, index=True)
    action = Column(String(20)) # PUMP_ON, PUMP_OFF
    mode = Column(String(20), default="AUTO") # AUTO, MANUAL_OVERRIDE
    trigger_reason = Column(String(255))
    soil_value = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=utcnow, index=True)
    level = Column(String(20), default="INFO") # INFO, WARNING, CRITICAL
    category = Column(String(50)) # IRRIGATION, NAVIGATION, ENVIRONMENT, CROP, SYSTEM
    message = Column(Text)
    is_active = Column(Boolean, default=True)

class RobotState(Base):
    __tablename__ = "robot_state"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utcnow)
    pos_x = Column(Float, default=0.0) # grid position in meters or arbitrary farm units
    pos_y = Column(Float, default=0.0)
    heading = Column(Float, default=0.0) # degrees (0 = North, 90 = East, 180 = South, 270 = West)
    current_action = Column(String(50), default="STOP") # MOVE_FORWARD, TURN_LEFT, TURN_RIGHT, STOP
    pump_active = Column(Boolean, default=False)
    manual_mode = Column(Boolean, default=False)
    simulation_running = Column(Boolean, default=True)

class CropAnalysis(Base):
    __tablename__ = "crop_analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=utcnow, index=True)
    filename = Column(String(255))
    health_status = Column(String(50)) # Healthy, Chlorosis/Yellowing, High Green Index, Needs Inspection
    greenness_index = Column(Float, nullable=True) # Normalized Excess Green index (ExG)
    yellowing_ratio = Column(Float, nullable=True) # Ratio of yellow/chlorotic pixels
    notes = Column(Text)
    model_used = Column(String(100), default="OpenCV Color/ExG Feature Extractor (Fallback)")

