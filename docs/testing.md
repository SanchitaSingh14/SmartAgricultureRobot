# Automated Testing Specification & Verification

## Running the Automated Test Suite

From the project root:

```powershell
$env:PYTHONPATH = "C:\SmartAgricultureRobot\backend"
python -m pytest "C:\SmartAgricultureRobot\backend\tests" -v
```

## Implemented Automated Test Cases

1. **`test_dry_soil_turns_irrigation_on`**:
   - Confirms that analog soil reading < 1300 triggers `PUMP_ON` with `pump_state = True`.
2. **`test_moist_soil_turns_irrigation_off`**:
   - Confirms that analog soil reading >= 1300 triggers `PUMP_OFF` to conserve water.
3. **`test_high_priority_heat_stress_condition`**:
   - Validates that dry soil combined with temp > 35°C and humidity < 40% escalates to `HIGH` priority with a heat stress alert.
4. **`test_invalid_soil_reading_failsafe`**:
   - Asserts that null or out-of-bounds soil values force fail-safe `PUMP_OFF`.
5. **`test_navigation_clear_center_moves_forward`**:
   - Asserts center obstacle distance > 20 cm produces `MOVE_FORWARD`.
6. **`test_navigation_blocked_center_clearer_left_turns_left`**:
   - Asserts center <= 20 cm and Left > Right produces `TURN_LEFT`.
7. **`test_navigation_blocked_center_clearer_right_turns_right`**:
   - Asserts center <= 20 cm and Right > Left produces `TURN_RIGHT`.
8. **`test_navigation_all_blocked_stops`**:
   - Asserts that when center and flanks are obstructed <= 20 cm, emergency `STOP` is ordered.
9. **`test_navigation_invalid_readings_stops`**:
   - Validates that negative or out-of-range ultrasonic readings halt locomotion with `STOP`.
10. **`test_environment_agent_evaluation`**:
    - Validates microclimate classification for extreme heat and dry air.
11. **`test_health_check`**:
    - Asserts HTTP 200 and healthy status response from `/api/health`.
12. **`test_system_status`**:
    - Asserts that `/api/status` returns operational state and robot kinematic coordinates.
13. **`test_simulate_sensors_and_coordinator`**:
    - Asserts that custom telemetry injection updates SQLite models and executes coordinator logic.
14. **`test_manual_irrigation_override`**:
    - Asserts that manual control overrides autonomous logic, and `/api/irrigation/auto` restores autonomous governance.
15. **`test_csv_export`**:
    - Asserts that CSV export downloads properly formatted headers and data rows.

