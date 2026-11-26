# Smart Agriculture Robot - ESP32 Virtual Firmware (Wokwi)

This directory contains the ESP32 simulation firmware for the Smart Agriculture Robot.

## Hardware & Pin Mapping (Simulated in Wokwi)

| Sensor / Actuator | ESP32 Pin | Function / Logic |
|---|---|---|
| **HC-SR04 Ultrasonic Trigger** | GPIO 5 | 10µs trigger pulse |
| **HC-SR04 Ultrasonic Echo** | GPIO 18 | High pulse timing to measure obstacle distance |
| **Servo Motor PWM** | GPIO 13 | Angular directional scanning: 30° (Left), 90° (Center), 150° (Right) |
| **Soil Moisture Potentiometer** | GPIO 34 | Analog soil moisture level (ADC 0 - 4095, `< 1300` is DRY) |
| **Pump Indicator LED** | GPIO 26 | HIGH = Virtual Pump ON, LOW = Virtual Pump OFF |
| **DHT22 Microclimate Data** | GPIO 27 | Temperature (°C) and Relative Humidity (%) |

## Running in Wokwi

1. Open [Wokwi.com](https://wokwi.com) or use the Wokwi VS Code / Antigravity extension.
2. Load `diagram.json` and `SmartAgricultureRobot.ino`.
3. Start simulation to observe:
   - Analog soil moisture readings and pump activation logic.
   - Servo scanning at 30°, 90°, and 150°.
   - Serial monitor outputs showing agent decisions: `MOVE_FORWARD`, `TURN_LEFT`, `TURN_RIGHT`, and `STOP`.

## Relationship Between Firmware and Web Platform

- **Web Platform Independence:** The React + FastAPI platform runs 100% independently with high-fidelity simulated telemetry and pre-configured test scenarios.
- **Physical ESP32 Flashing:** When you purchase physical ESP32 hardware in the future, this exact firmware can be flashed via Arduino IDE or `arduino-cli` directly without refactoring pin numbers.

