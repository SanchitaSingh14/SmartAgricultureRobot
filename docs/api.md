# REST API Specification

Base URL: `http://localhost:8000/api`

## Health & System Status
- `GET /health` : Verifies backend uptime and service health.
- `GET /status` : Returns holistic status, active alerts count, robot kinematics, and MQTT broker connectivity.

## Sensor Telemetry & Simulation
- `GET /sensors/latest` : Retrieves the most recent sensor reading.
- `GET /sensors/history?limit=30` : Retrieves time-series historical sensor records.
- `POST /sensors/simulate` : Injects custom or manual sensor data to evaluate the pipeline.
- `GET /simulation/scenarios` : Lists predefined benchmark scenarios (e.g., dry soil, heat stress, path blocked).
- `POST /simulation/scenario/{scenario_key}` : Applies a specific deterministic test scenario.
- `POST /simulation/start` : Resumes the automated background simulation loop.
- `POST /simulation/pause` : Freezes the automated background simulation loop.
- `POST /simulation/reset` : Restores robot kinematics to (0,0) and clears custom scenario overrides.

## Autonomous Agents & Decisions
- `GET /agents` : Lists the 5 registered agents with their algorithmic architectures.
- `POST /agents/run` : Generates the next telemetry step and executes the agent coordination sequence.
- `GET /decisions?limit=50` : Retrieves historical agent decisions, priorities, and rationales.

## Alerts & Irrigation
- `GET /alerts` : Retrieves active and acknowledged alert messages.
- `POST /alerts/clear` : Acknowledges all active alerts.
- `POST /irrigation/manual` : Manually forces virtual irrigation pump ON or OFF.
- `POST /irrigation/auto` : Relinquishes manual override and returns pump control to the Irrigation Agent.
- `GET /irrigation/events` : Retrieves audit log of all pump state changes.

## Robot Digital Twin
- `GET /robot/state` : Retrieves coordinates (X, Y), heading in degrees, action, and pump status.

## Crop Vision & Scouting
- `POST /crop/analyze` : Accepts multipart image upload, performs OpenCV ExG feature extraction, and logs results.
- `GET /crop/history` : Retrieves historical crop scouting image inspections.

## Data Export
- `GET /reports/export?dataset={sensors|decisions|irrigation}` : Exports CSV formatted audit logs.

