"""
API Logic Tests (without HTTP transport).
Tests the endpoint functions directly using SQLite in-memory database.
Avoids TestClient which hangs due to sandbox socket restrictions.
All 6 tests verify real API logic.
"""
import os
os.environ.setdefault("MQTT_DISABLED", "true")

import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# --- In-memory isolated test database ---
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

from app.database.session import Base
from app.models.entities import SensorReading, RobotState, AgentDecision, IrrigationEvent, Alert
from app.api.endpoints.farm import (
    check_health,
    get_system_status,
    post_simulated_sensor,
    set_manual_irrigation,
    set_auto_irrigation,
    get_sensor_history,
    get_robot_state,
    get_settings,
    update_settings,
)
from app.schemas.farm_schema import SensorReadingCreate, ManualIrrigationRequest, SettingsUpdate
from app.services.mqtt_service import mqtt_service

Base.metadata.create_all(bind=test_engine)


@pytest.fixture
def db():
    """Provide a fresh in-memory database session for each test."""
    db = TestSessionLocal()
    yield db
    db.close()


def test_health_check():
    """Health endpoint returns healthy status."""
    result = check_health()
    assert result["status"] == "healthy"
    assert "service" in result
    assert "timestamp" in result


def test_system_status_returns_robot_state(db):
    """Status endpoint returns a valid system status with robot_state."""
    result = get_system_status(db=db)
    assert result["status"] == "OPERATIONAL"
    assert "robot_state" in result
    assert result["robot_state"].pos_x is not None


def test_simulate_sensors_activates_pump(db):
    """Posting dry soil data must result in pump ON via agent coordinator."""
    reading_in = SensorReadingCreate(
        soil_moisture=800.0,      # < 1300 (DRY)
        temperature=28.0,
        humidity=50.0,
        left_distance=50.0,
        center_distance=80.0,     # Clear → MOVE_FORWARD
        right_distance=50.0,
        is_simulated=True,
        source="api_test"
    )
    result = post_simulated_sensor(reading_in=reading_in, db=db)
    assert result.soil_moisture == 800.0

    # Robot state should reflect pump ON and MOVE_FORWARD
    robot = get_robot_state(db=db)
    assert robot.pump_active is True
    assert robot.current_action == "MOVE_FORWARD"


def test_manual_irrigation_override(db):
    """Manual override sets pump OFF and enables manual_mode."""
    request = ManualIrrigationRequest(action="PUMP_OFF", reason="Test override")
    result = set_manual_irrigation(request=request, db=db)
    assert result["pump_active"] is False
    assert result["manual_mode"] is True

    # Restore AUTO
    auto_result = set_auto_irrigation(db=db)
    assert auto_result["manual_mode"] is False


def test_sensor_history_persistence(db):
    """Multiple sensor postings must appear in history."""
    for i in range(3):
        r = SensorReadingCreate(
            soil_moisture=2000.0 + i,
            temperature=25.0,
            humidity=55.0,
            left_distance=60.0,
            center_distance=70.0,
            right_distance=65.0,
            is_simulated=True,
            source="persistence_test"
        )
        post_simulated_sensor(reading_in=r, db=db)

    history = get_sensor_history(limit=10, db=db)
    assert isinstance(history, list)
    assert len(history) >= 3


def test_invalid_soil_reading_does_not_activate_pump(db):
    """Invalid soil reading (-99) must NOT activate the pump (fail-safe)."""
    reading_in = SensorReadingCreate(
        soil_moisture=-99.0,     # Invalid — out of [0, 4095] range
        temperature=28.0,
        humidity=50.0,
        left_distance=50.0,
        center_distance=80.0,
        right_distance=50.0,
        is_simulated=True,
        source="invalid_test"
    )
    post_simulated_sensor(reading_in=reading_in, db=db)
    robot = get_robot_state(db=db)
    assert robot.pump_active is False, "Pump must stay OFF for invalid sensor data (fail-safe)"


def test_settings_get_and_update():
    """Settings endpoint reads and updates agent thresholds."""
    initial = get_settings()
    assert initial.dry_soil_threshold == 1300
    updated = update_settings(SettingsUpdate(
        dry_soil_threshold=1400,
        obstacle_threshold_cm=25.0,
        simulation_interval_seconds=3.0
    ))
    assert updated.dry_soil_threshold == 1400
    assert updated.obstacle_threshold_cm == 25.0
    # Restore defaults
    update_settings(SettingsUpdate(
        dry_soil_threshold=1300,
        obstacle_threshold_cm=20.0,
        simulation_interval_seconds=2.0
    ))
