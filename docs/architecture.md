# System Architecture: Smart Agriculture Robot with IoT Digital Twin & Multi-Agent Intelligence

## 1. System Overview

```
                      +---------------------------------------+
                      |     React + Vite Web Dashboard        |
                      |   (Overview, Twin, Agents, Reports)   |
                      +-------------------+-------------------+
                                          | REST APIs & Axios
                                          v
                      +---------------------------------------+
                      |       FastAPI Backend Server          |
                      |       (Port 8000, Uvicorn)            |
                      +-------------------+-------------------+
                                          |
                +-------------------------+-------------------------+
                |                         |                         |
                v                         v                         v
     +--------------------+     +--------------------+    +--------------------+
     | SQLite3 Database   |     | Multi-Agent Engine |    | Sensor Simulator   |
     | (Entities, Logs)   |     | (5 Python Agents)  |    | & Scenario Engine  |
     +--------------------+     +--------------------+    +--------------------+
                                          |
                        +-----------------+-----------------+
                        |                 |                 |
                        v                 v                 v
                 [Irrigation]       [Navigation]      [Environment]
                        |                 |                 |
                        +-----------------+-----------------+
                                          |
                                          v
                                   [Farm Manager]
                                          |
                                          v
                                    [Coordinator]
```

## 2. Specialized Multi-Agent Intelligence Pipeline

1. **Irrigation Agent:**
   - **Inputs:** Soil moisture potentiometer value (0-4095), temperature (°C), humidity (%).
   - **Rule Engine:** If soil < 1300, sets pump to ON. If temperature > 35°C and humidity < 40%, escalates to HIGH priority heat stress alert. Fails safe to pump OFF on invalid data.

2. **Navigation Agent:**
   - **Inputs:** Tri-directional ultrasonic distance scan (Left 30°, Center 90°, Right 150°).
   - **Heuristic:**
     - If Center > 20 cm → `MOVE_FORWARD`.
     - If Center <= 20 cm and Left > Right → `TURN_LEFT`.
     - If Center <= 20 cm and Right > Left → `TURN_RIGHT`.
     - If both sides <= 20 cm or sensor data invalid → `STOP`.

3. **Environment Agent:**
   - **Inputs:** DHT22 temperature and humidity readings.
   - **Diagnosis:** Flags extreme temperature stress, frost risk, dehydration conditions, and high-humidity fungal risk.

4. **Crop Monitoring Agent:**
   - **Inputs:** Leaf or canopy image uploads.
   - **Computer Vision:** Calculates Excess Green Index ($ExG = 2G - R - B$) and HSV color segmentation to quantify yellowing/chlorosis percentages honestly without hallucinating disease diagnosis.

5. **Farm Manager Agent:**
   - **Consensus:** Aggregates outputs from the four domain agents, prioritizes urgent safety warnings, and issues the unified farm status directive. Enforces hard STOP locks for robot safety.

