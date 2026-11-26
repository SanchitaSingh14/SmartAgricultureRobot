# AI-Powered Smart Agriculture Robot with IoT Digital Twin and Multi-Agent Intelligence

A comprehensive, modular, professional software prototype for an autonomous agricultural robot. Engineered for precision farming research, virtual simulation, and real-time agronomic decision-making.

---

## 1. Project Introduction & Key Features

This project delivers a complete, locally runnable precision agriculture system designed for research and final-year engineering defense. It features:

- **100% Hardware-Independent Virtual Simulation:** Operates on your Windows laptop without requiring physical electronics, sensors, cloud accounts, or paid API keys.
- **IoT Digital Twin:** Live 2D farm arena visualization displaying the robot's heading, position, furrow lines, obstacle radar beams, and virtual water pump spray.
- **5 Specialized Autonomous AI Agents:**
  1. *Irrigation Agent:* Soil moisture and heat stress governance with safe hysteresis.
  2. *Navigation Agent:* Tri-directional ultrasonic range analysis (Left 30°, Center 90°, Right 150°) and collision avoidance.
  3. *Environment Agent:* Microclimate monitoring (temperature and humidity) from DHT22.
  4. *Crop Monitoring Agent:* Native OpenCV vegetation feature extractor (Excess Green Index $ExG$ and chlorosis ratio) without fake diagnostic claims.
  5. *Farm Manager Agent:* Multi-agent consensus synthesizer enforcing hard safety STOP invariants.
- **Modern Responsive Dashboard:** 8 dedicated pages built with React + Vite + Recharts + Lucide Icons.
- **Local Persistence & Data Export:** SQLite database storing all telemetry frames, agent decisions, alerts, and one-click CSV report exports.
- **Existing Wokwi ESP32 Prototype Preserved:** Complete pin compatibility preserved in `firmware/` with full documentation for future physical deployment.

---

## 2. Architecture & Multi-Agent Workflow

```
[Virtual Simulator / ESP32 Wokwi] ---> [FastAPI Backend] ---> [SQLite Database]
                                               |
             +---------------------------------+---------------------------------+
             |                                 |                                 |
     [Irrigation Agent]               [Navigation Agent]               [Environment Agent]
             |                                 |                                 |
             +---------------------------------+---------------------------------+
                                               |
                                     [Farm Manager Agent]
                                               |
                                     [Agent Coordinator]
                                               |
                                     [React Web Dashboard]
```

---

## 3. Quick Start Guide for Windows (Beginner Friendly)

### Prerequisites Check
Open PowerShell and verify Python and Node are installed:
```powershell
python --version    # Tested on Python 3.11+
node --version      # Tested on Node.js v24+
```

---

### Step 1: Start the FastAPI Backend

Open a PowerShell terminal and run:
```powershell
cd C:\SmartAgricultureRobot\backend
$env:PYTHONPATH = "C:\SmartAgricultureRobot\backend"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*You will see:* `INFO: Application startup complete. Uvicorn running on http://127.0.0.1:8000`

---

### Step 2: Start the React Dashboard

Open a **second** PowerShell window and run:
```powershell
cd C:\SmartAgricultureRobot\frontend
npm run dev
```
*You will see:*
```
  VITE v8.3.7  ready in 250 ms
  ➜  Local:   http://localhost:5173/
```

Open your browser and navigate to: **`http://localhost:5173`**

---

### One-Click Launch Script (Alternative)
You can also start both servers automatically with the included PowerShell script:
```powershell
cd C:\SmartAgricultureRobot
.\start_all.ps1
```

---

## 4. Running Automated Tests

To run the complete automated test suite (17 unit and integration tests):
```powershell
cd C:\SmartAgricultureRobot\backend
$env:PYTHONPATH = "C:\SmartAgricultureRobot\backend"
$env:MQTT_DISABLED = "true"
python -m pytest "C:\SmartAgricultureRobot\backend\tests" -v
```

---

## 5. Dashboard Pages Walkthrough

1. **Overview:** High-level farm telemetry, microclimate readings, live pump status, navigation decision, and recent system alerts.
2. **Live Monitoring:** Real-time time-series charts, simulation speed controls, one-click benchmark scenarios, and manual sensor injection form.
3. **Robot Digital Twin:** 2D graphical virtual farm arena showing robot position, ultrasonic radar sweep angles, and irrigation spray.
4. **AI Agents:** Detailed inspection of all 5 agents with an auditable decision table showing inputs, decisions, and reasoning rationales.
5. **Irrigation Control:** Toggle between autonomous agent governance and manual operator overrides; full switching event history.
6. **Crop Scouting Vision:** Upload leaf photographs for local OpenCV Excess Green Index ($ExG$) and chlorosis yellowing detection.
7. **Analytics & Export:** Session statistics, sensor history & navigation decision charts, alerts by category, date-range filtering, printable report, and direct CSV download buttons for sensors, decisions, and irrigation datasets.
8. **Settings:** Live-synced dry soil boundaries, obstacle distance thresholds, simulation interval, and local system architecture health.

---

## 6. Predefined Benchmark Scenarios

From the **Live Monitoring** page, click any of these scenarios to observe immediate multi-agent responses:
- **Normal Farm Conditions:** Moisture optimal (>2000 ADC), center corridor clear (>70cm). Robot advances forward, pump remains OFF.
- **Dry Soil Requiring Irrigation:** Moisture depleted (<1000 ADC). Irrigation Agent triggers `PUMP_ON`.
- **Dry Soil + High Temp + Low Humidity:** Severe heat stress condition. Escalates to HIGH priority with alert.
- **Obstacle Ahead with Clear Left:** Center blocked (12cm <= 20cm), left side clear. Navigation Agent issues `TURN_LEFT`.
- **Obstacle Ahead with Clear Right:** Center blocked (10cm <= 20cm), right side clear. Navigation Agent issues `TURN_RIGHT`.
- **Obstacles in All Directions:** Center, left, and right all restricted (<=20cm). Emergency `STOP` enforced.
- **Invalid / Missing Sensor Data:** Negative or null values injected. Safety fail-safe triggers `STOP` and locks pump OFF.

---

## 7. Wokwi ESP32 Prototype Integration

Your existing Wokwi ESP32 prototype files are preserved in `firmware/`:
- `SmartAgricultureRobot.ino`
- `diagram.json`
- `wokwi.toml`

### Pin Mapping Reference
- **Ultrasonic Trigger:** GPIO 5
- **Ultrasonic Echo:** GPIO 18
- **Servo Motor PWM:** GPIO 13
- **Soil Moisture Potentiometer:** GPIO 34
- **Pump Indicator LED:** GPIO 26
- **DHT22 Sensor:** GPIO 27

The web dashboard is fully decoupled and functional without Wokwi running, allowing research presentations anywhere.

---

## 8. Physical Hardware Transition Roadmap (Future Scope)

When transitioning from software prototype to physical hardware:
1. **Microcontroller:** Flash the existing firmware onto a physical ESP32 DevKit C V4 board using Arduino IDE.
2. **Motor Drivers:** Connect an L298N or TB6612FNG dual H-bridge motor driver to ESP32 PWM pins for DC drive motors.
3. **Actuator:** Replace the simulated GPIO 26 LED with a 5V relay module driving a 12V submersible diaphragm water pump.
4. **Sensors:** Connect physical capacitive soil moisture sensor (v1.2), HC-SR04 ultrasonic sensor, and DHT22 sensor to the documented pins.
5. **IoT Gateway:** Configure Wi-Fi credentials in firmware to publish JSON telemetry packets over MQTT to the FastAPI backend.

