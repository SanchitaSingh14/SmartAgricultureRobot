"""
MQTT Service:
Optional IoT communication adapter using paho-mqtt.
Provides simulated fallback when MQTT broker is unavailable.
"""
import json
import logging
from typing import Optional, Callable
from app.core.config import settings

logger = logging.getLogger("MQTTService")

class MQTTService:
    def __init__(self):
        self.client = None
        self.is_connected = False
        self.on_telemetry_callback: Optional[Callable[[dict], None]] = None

    def connect(self):
        import os
        if os.environ.get("MQTT_DISABLED") == "true":
            logger.info("MQTT_DISABLED=true: skipping broker connection (test/offline mode).")
            return
        try:
            import paho.mqtt.client as mqtt
            self.client = mqtt.Client(client_id="SmartAgriBackend", protocol=mqtt.MQTTv311)
            
            def on_connect(client, userdata, flags, rc):
                if rc == 0:
                    self.is_connected = True
                    logger.info("Successfully connected to MQTT Broker.")
                    client.subscribe(settings.MQTT_TOPIC_TELEMETRY)
                else:
                    self.is_connected = False
                    logger.warning(f"MQTT Broker connection failed with code {rc}. Using fallback mode.")

            def on_message(client, userdata, msg):
                try:
                    payload = json.loads(msg.payload.decode())
                    if self.on_telemetry_callback:
                        self.on_telemetry_callback(payload)
                except Exception as e:
                    logger.error(f"Error parsing incoming MQTT message: {e}")

            self.client.on_connect = on_connect
            self.client.on_message = on_message

            # Non-blocking attempt to connect
            self.client.connect_async(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, 60)
            self.client.loop_start()
        except Exception as e:
            logger.info(f"MQTT Broker not reachable ({e}). Proceeding seamlessly in simulated REST/WebSocket mode.")
            self.is_connected = False

    def publish_command(self, command: dict):
        if self.is_connected and self.client:
            try:
                self.client.publish(settings.MQTT_TOPIC_COMMANDS, json.dumps(command))
            except Exception as e:
                logger.error(f"Failed to publish MQTT command: {e}")

    def disconnect(self):
        if self.client:
            try:
                self.client.loop_stop()
                self.client.disconnect()
            except Exception:
                pass

mqtt_service = MQTTService()

