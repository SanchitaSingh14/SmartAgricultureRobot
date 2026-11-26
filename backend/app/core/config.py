from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Agriculture Robot API"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./smart_agri_robot.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1883
    MQTT_TOPIC_TELEMETRY: str = "agrirobot/telemetry"
    MQTT_TOPIC_COMMANDS: str = "agrirobot/commands"
    DEFAULT_SOIL_THRESHOLD: int = 1300
    SIMULATION_INTERVAL_SECONDS: float = 2.0
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

