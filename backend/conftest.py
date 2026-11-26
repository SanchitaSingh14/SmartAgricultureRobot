"""
conftest.py — pytest configuration for Smart Agriculture Robot backend tests.
Ensures MQTT is disabled before any module-level imports run.
"""
import os

# Must be set before any app modules are imported
os.environ["MQTT_DISABLED"] = "true"

