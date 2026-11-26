"""
Irrigation Agent:
Specialized in evaluating soil moisture, ambient temperature, and humidity
to govern simulated irrigation pumps with hysteresis and priority alerting.
"""
from typing import Dict, Any, Optional

class IrrigationAgent:
    def __init__(self, dry_soil_threshold: int = 1300):
        self.dry_soil_threshold = dry_soil_threshold

    def evaluate(
        self,
        soil_value: Optional[float],
        temperature: Optional[float],
        humidity: Optional[float],
        current_pump_state: bool,
        manual_override: bool = False
    ) -> Dict[str, Any]:
        """
        Evaluate irrigation requirements.
        Returns:
            dict containing:
                decision: 'PUMP_ON' | 'PUMP_OFF' | 'NO_CHANGE'
                priority: 'LOW' | 'NORMAL' | 'HIGH' | 'NONE'
                reason: Detailed explanatory rationale
                action: Simulated hardware command executed
                alert: Optional alert message
        """
        # If under manual override, agent defers automated changes
        if manual_override:
            return {
                "agent_name": "Irrigation Agent",
                "decision": "MANUAL_OVERRIDE_ACTIVE",
                "priority": "LOW",
                "reason": "System is in manual override mode. Automatic irrigation logic is suspended.",
                "action": "MAINTAIN_MANUAL_STATE",
                "pump_state": current_pump_state,
                "alert": None
            }

        # Safe behavior on missing or invalid sensor data
        if soil_value is None or soil_value < 0 or soil_value > 4095:
            return {
                "agent_name": "Irrigation Agent",
                "decision": "PUMP_OFF",
                "priority": "HIGH",
                "reason": "Invalid or missing soil moisture reading. Enforcing fail-safe: pump set to OFF.",
                "action": "PUMP_OFF",
                "pump_state": False,
                "alert": "Fail-safe activated: Soil sensor reading is missing or out of valid range (0-4095)."
            }

        # Check soil condition
        # Lower analog reading = drier soil in the existing Wokwi ESP32 prototype (< 1300 is DRY)
        is_dry = soil_value < self.dry_soil_threshold

        if is_dry:
            # High Priority Condition: Dry soil + high temp (> 35C) + low humidity (< 40%)
            has_heat_stress = (
                temperature is not None and temperature > 35.0 and
                humidity is not None and humidity < 40.0
            )

            if has_heat_stress:
                priority = "HIGH"
                reason = "Dry soil (< 1300) combined with severe heat stress (Temp > 35°C, Humidity < 40%). Immediate irrigation required."
                alert = "HEAT STRESS IRRIGATION: High temperature and low humidity are accelerating crop evapotranspiration!"
            else:
                priority = "NORMAL"
                reason = f"Soil moisture ({soil_value:.1f}) is below dry threshold ({self.dry_soil_threshold}). Irrigation required."
                alert = None

            # Prevent unnecessary repeated pump commands if already ON
            action = "PUMP_ON" if not current_pump_state else "MAINTAIN_PUMP_ON"

            return {
                "agent_name": "Irrigation Agent",
                "decision": "PUMP_ON",
                "priority": priority,
                "reason": reason,
                "action": action,
                "pump_state": True,
                "alert": alert
            }
        else:
            # Soil is sufficiently moist (>= 1300)
            priority = "NONE"
            reason = f"Soil moisture ({soil_value:.1f}) is sufficient (>= {self.dry_soil_threshold}). Pump kept OFF to conserve water."
            action = "PUMP_OFF" if current_pump_state else "MAINTAIN_PUMP_OFF"

            return {
                "agent_name": "Irrigation Agent",
                "decision": "PUMP_OFF",
                "priority": priority,
                "reason": reason,
                "action": action,
                "pump_state": False,
                "alert": None
            }

