import pytest
from app.agents.irrigation_agent import IrrigationAgent
from app.agents.navigation_agent import NavigationAgent
from app.agents.environment_agent import EnvironmentAgent

def test_dry_soil_turns_irrigation_on():
    agent = IrrigationAgent(dry_soil_threshold=1300)
    # Soil < 1300 is dry
    result = agent.evaluate(soil_value=900, temperature=28.0, humidity=50.0, current_pump_state=False)
    assert result["decision"] == "PUMP_ON"
    assert result["pump_state"] is True
    assert result["action"] == "PUMP_ON"

def test_moist_soil_turns_irrigation_off():
    agent = IrrigationAgent(dry_soil_threshold=1300)
    # Soil >= 1300 is moist
    result = agent.evaluate(soil_value=2100, temperature=25.0, humidity=60.0, current_pump_state=True)
    assert result["decision"] == "PUMP_OFF"
    assert result["pump_state"] is False
    assert result["action"] == "PUMP_OFF"

def test_high_priority_heat_stress_condition():
    agent = IrrigationAgent(dry_soil_threshold=1300)
    # Dry soil (< 1300) + Temp > 35 + Humidity < 40
    result = agent.evaluate(soil_value=850, temperature=38.0, humidity=30.0, current_pump_state=False)
    assert result["decision"] == "PUMP_ON"
    assert result["priority"] == "HIGH"
    assert "heat stress" in result["reason"].lower()
    assert result["alert"] is not None

def test_invalid_soil_reading_failsafe():
    agent = IrrigationAgent(dry_soil_threshold=1300)
    # Invalid reading (-100 or None)
    result = agent.evaluate(soil_value=None, temperature=25.0, humidity=50.0, current_pump_state=True)
    assert result["decision"] == "PUMP_OFF"
    assert result["pump_state"] is False
    assert result["priority"] == "HIGH"
    assert "fail-safe" in result["reason"].lower()

def test_navigation_clear_center_moves_forward():
    agent = NavigationAgent(obstacle_threshold_cm=20.0)
    result = agent.evaluate(left_dist=60.0, center_dist=75.0, right_dist=60.0)
    assert result["decision"] == "MOVE_FORWARD"
    assert result["action"] == "MOVE_FORWARD"

def test_navigation_blocked_center_clearer_left_turns_left():
    agent = NavigationAgent(obstacle_threshold_cm=20.0)
    # Center <= 20, Left > Right
    result = agent.evaluate(left_dist=80.0, center_dist=12.0, right_dist=15.0)
    assert result["decision"] == "TURN_LEFT"
    assert result["action"] == "TURN_LEFT"

def test_navigation_blocked_center_clearer_right_turns_right():
    agent = NavigationAgent(obstacle_threshold_cm=20.0)
    # Center <= 20, Right > Left
    result = agent.evaluate(left_dist=15.0, center_dist=10.0, right_dist=85.0)
    assert result["decision"] == "TURN_RIGHT"
    assert result["action"] == "TURN_RIGHT"

def test_navigation_all_blocked_stops():
    agent = NavigationAgent(obstacle_threshold_cm=20.0)
    # Center <= 20, Left <= 20, Right <= 20
    result = agent.evaluate(left_dist=10.0, center_dist=12.0, right_dist=11.0)
    assert result["decision"] == "STOP"
    assert result["action"] == "STOP"
    assert result["priority"] == "HIGH"

def test_navigation_invalid_readings_stops():
    agent = NavigationAgent(obstacle_threshold_cm=20.0)
    result = agent.evaluate(left_dist=-5.0, center_dist=50.0, right_dist=None)
    assert result["decision"] == "STOP"
    assert result["priority"] == "HIGH"
    assert "anomaly" in result["reason"].lower()

def test_environment_agent_evaluation():
    agent = EnvironmentAgent()
    # High temp (> 35) and low humidity (< 40)
    res = agent.evaluate(temperature=39.0, humidity=30.0)
    assert "HIGH_TEMPERATURE" in res["decision"]
    assert "LOW_HUMIDITY" in res["decision"]
    assert res["priority"] == "NORMAL"

