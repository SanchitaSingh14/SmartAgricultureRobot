"""
Sensor Simulator Service:
Generates configurable telemetry for soil moisture, temperature, humidity,
and 3-point obstacle distances (Left, Center, Right).
Includes predefined test scenarios and manual override inputs.
"""
import random
from typing import Dict, Any, Optional

SCENARIOS = {
    "normal": {
        "name": "Normal Farm Conditions",
        "soil_moisture": 2100.0,
        "temperature": 27.5,
        "humidity": 62.0,
        "left_distance": 65.0,
        "center_distance": 80.0,
        "right_distance": 70.0,
        "description": "Healthy soil moisture, comfortable microclimate, unobstructed furrow line."
    },
    "dry_soil": {
        "name": "Dry Soil Requiring Irrigation",
        "soil_moisture": 950.0,
        "temperature": 28.0,
        "humidity": 55.0,
        "left_distance": 60.0,
        "center_distance": 75.0,
        "right_distance": 65.0,
        "description": "Soil moisture depleted below 1300 threshold. Triggers automated irrigation."
    },
    "heat_stress": {
        "name": "Dry Soil + High Temp + Low Humidity",
        "soil_moisture": 820.0,
        "temperature": 38.5,
        "humidity": 32.0,
        "left_distance": 50.0,
        "center_distance": 60.0,
        "right_distance": 55.0,
        "description": "Severe evapotranspiration stress! Soil dry (<1300), Temp >35°C, Humidity <40%. High priority alert."
    },
    "obstacle_ahead_clear_left": {
        "name": "Obstacle Ahead with Clear Left Side",
        "soil_moisture": 2000.0,
        "temperature": 26.0,
        "humidity": 60.0,
        "left_distance": 85.0,
        "center_distance": 12.0,
        "right_distance": 15.0,
        "description": "Center path blocked (12cm <= 20cm). Left side is wide open (85cm > 15cm). Triggers TURN_LEFT."
    },
    "obstacle_ahead_clear_right": {
        "name": "Obstacle Ahead with Clear Right Side",
        "soil_moisture": 2000.0,
        "temperature": 26.0,
        "humidity": 60.0,
        "left_distance": 14.0,
        "center_distance": 10.0,
        "right_distance": 92.0,
        "description": "Center path blocked (10cm <= 20cm). Right side offers maximum room (92cm > 14cm). Triggers TURN_RIGHT."
    },
    "all_blocked": {
        "name": "Obstacles in All Directions",
        "soil_moisture": 1900.0,
        "temperature": 26.0,
        "humidity": 60.0,
        "left_distance": 11.0,
        "center_distance": 9.0,
        "right_distance": 12.0,
        "description": "Center and both flanking pathways blocked. Enforces immediate emergency STOP."
    },
    "invalid_data": {
        "name": "Invalid or Missing Sensor Data",
        "soil_moisture": -99.0,
        "temperature": None,
        "humidity": 150.0,
        "left_distance": -5.0,
        "center_distance": 999.0,
        "right_distance": None,
        "description": "Out-of-range sensor readings. Triggers safety fail-safe STOP and holds pump OFF."
    }
}

class SensorSimulator:
    def __init__(self):
        self.current_scenario: str = "normal"
        self.manual_values: Optional[Dict[str, Any]] = None
        self.noise_enabled: bool = True

    def set_scenario(self, scenario_key: str):
        if scenario_key in SCENARIOS:
            self.current_scenario = scenario_key
            self.manual_values = None

    def set_manual_reading(self, reading_dict: Dict[str, Any]):
        self.manual_values = reading_dict

    def generate_reading(self) -> Dict[str, Any]:
        """
        Generate sensor reading based on active scenario or manual input,
        with subtle realistic jitter if noise is enabled.
        """
        if self.manual_values:
            return dict(self.manual_values)

        base = dict(SCENARIOS.get(self.current_scenario, SCENARIOS["normal"]))

        # Add small realistic fluctuations if not the invalid test case
        if self.current_scenario != "invalid_data" and self.noise_enabled:
            soil = max(0.0, min(4095.0, base["soil_moisture"] + random.uniform(-15.0, 15.0)))
            temp = round(base["temperature"] + random.uniform(-0.2, 0.2), 1)
            hum = round(max(10.0, min(99.0, base["humidity"] + random.uniform(-0.5, 0.5))), 1)
            c_dist = max(2.0, round(base["center_distance"] + random.uniform(-1.0, 1.0), 1))
            l_dist = max(2.0, round(base["left_distance"] + random.uniform(-1.0, 1.0), 1))
            r_dist = max(2.0, round(base["right_distance"] + random.uniform(-1.0, 1.0), 1))
        else:
            soil = base["soil_moisture"]
            temp = base["temperature"]
            hum = base["humidity"]
            c_dist = base["center_distance"]
            l_dist = base["left_distance"]
            r_dist = base["right_distance"]

        return {
            "soil_moisture": soil,
            "temperature": temp,
            "humidity": hum,
            "left_distance": l_dist,
            "center_distance": c_dist,
            "right_distance": r_dist,
            "is_simulated": True,
            "source": f"scenario_{self.current_scenario}"
        }

simulator = SensorSimulator()

