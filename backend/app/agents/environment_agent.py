"""
Environment Agent:
Monitors ambient microclimate parameters (temperature and relative humidity).
Classifies heat stress, frost risk, dehydration conditions, and optimal plant growth zones.
Avoids treating general weather as definitive crop pathology.
"""
from typing import Dict, Any, Optional

class EnvironmentAgent:
    def __init__(self, temp_high: float = 35.0, temp_low: float = 10.0, humidity_low: float = 40.0, humidity_high: float = 85.0):
        self.temp_high = temp_high
        self.temp_low = temp_low
        self.humidity_low = humidity_low
        self.humidity_high = humidity_high

    def evaluate(
        self,
        temperature: Optional[float],
        humidity: Optional[float]
    ) -> Dict[str, Any]:
        """
        Evaluate microclimate conditions.
        """
        if temperature is None or humidity is None or temperature < -40 or temperature > 80 or humidity < 0 or humidity > 100:
            return {
                "agent_name": "Environment Agent",
                "decision": "DATA_UNAVAILABLE",
                "priority": "HIGH",
                "reason": f"Invalid or absent DHT22 microclimate data (Temp: {temperature}, Humidity: {humidity}).",
                "action": "FLAG_SENSOR_FAULT",
                "alert": "Environment sensor communication fault: Unable to read accurate temperature/humidity."
            }

        alerts = []
        status_tags = []

        if temperature > self.temp_high:
            status_tags.append("HIGH_TEMPERATURE")
            alerts.append(f"Ambient temperature ({temperature:.1f}°C) exceeds heat stress threshold ({self.temp_high}°C).")
        elif temperature < self.temp_low:
            status_tags.append("LOW_TEMPERATURE")
            alerts.append(f"Ambient temperature ({temperature:.1f}°C) is below optimal plant metabolism threshold ({self.temp_low}°C).")
        else:
            status_tags.append("TEMPERATURE_NORMAL")

        if humidity < self.humidity_low:
            status_tags.append("LOW_HUMIDITY")
            alerts.append(f"Relative humidity ({humidity:.1f}%) is critically dry (< {self.humidity_low}%). Increased crop transpiration risk.")
        elif humidity > self.humidity_high:
            status_tags.append("HIGH_HUMIDITY")
            alerts.append(f"Relative humidity ({humidity:.1f}%) is elevated (> {self.humidity_high}%). Conducive environment for fungal spore germination.")
        else:
            status_tags.append("HUMIDITY_NORMAL")

        priority = "NORMAL" if alerts else "LOW"
        decision_str = " | ".join(status_tags)
        reason_str = " ".join(alerts) if alerts else f"Microclimate parameters within healthy developmental range (Temp: {temperature:.1f}°C, Humidity: {humidity:.1f}%)."

        return {
            "agent_name": "Environment Agent",
            "decision": decision_str,
            "priority": priority,
            "reason": reason_str,
            "action": "LOG_ENVIRONMENT",
            "alert": alerts[0] if alerts else None,
            "temperature": temperature,
            "humidity": humidity
        }

