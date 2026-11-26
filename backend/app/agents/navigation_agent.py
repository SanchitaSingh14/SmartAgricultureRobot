"""
Navigation Agent:
Processes ultrasonic range readings from left (30 deg), center (90 deg), and right (150 deg).
Decides movement commands: MOVE_FORWARD, TURN_LEFT, TURN_RIGHT, STOP.
Includes safety checks for invalid/out-of-range sensor data.
"""
from typing import Dict, Any, Optional

class NavigationAgent:
    def __init__(self, obstacle_threshold_cm: float = 20.0):
        self.obstacle_threshold_cm = obstacle_threshold_cm

    def evaluate(
        self,
        left_dist: Optional[float],
        center_dist: Optional[float],
        right_dist: Optional[float]
    ) -> Dict[str, Any]:
        """
        Evaluate navigation path based on ultrasonic scan readings.
        """
        # Validate sensor readings
        for dist_name, val in [("Left", left_dist), ("Center", center_dist), ("Right", right_dist)]:
            if val is None or val < 0 or val > 500:
                return {
                    "agent_name": "Navigation Agent",
                    "decision": "STOP",
                    "priority": "HIGH",
                    "reason": f"Sensor anomaly: {dist_name} ultrasonic reading ({val}) is invalid or out-of-range (0-500cm). Enforcing emergency STOP.",
                    "action": "STOP",
                    "alert": f"Navigation sensor anomaly on {dist_name} sensor."
                }

        # Clear path ahead (Center distance > obstacle threshold)
        if center_dist > self.obstacle_threshold_cm:
            return {
                "agent_name": "Navigation Agent",
                "decision": "MOVE_FORWARD",
                "priority": "LOW",
                "reason": f"Center path is clear ({center_dist:.1f} cm > {self.obstacle_threshold_cm} cm threshold). Proceeding along furrow line.",
                "action": "MOVE_FORWARD",
                "alert": None
            }

        # Obstacle detected ahead in center path
        # Evaluate side clearances to steer around obstacle
        if left_dist > self.obstacle_threshold_cm and left_dist > right_dist:
            return {
                "agent_name": "Navigation Agent",
                "decision": "TURN_LEFT",
                "priority": "NORMAL",
                "reason": f"Center obstructed ({center_dist:.1f} cm <= {self.obstacle_threshold_cm} cm). Left flank offers greater clearance ({left_dist:.1f} cm vs Right {right_dist:.1f} cm).",
                "action": "TURN_LEFT",
                "alert": f"Obstacle encountered ahead at {center_dist:.1f} cm. Initiating left avoidance."
            }

        elif right_dist > self.obstacle_threshold_cm and right_dist > left_dist:
            return {
                "agent_name": "Navigation Agent",
                "decision": "TURN_RIGHT",
                "priority": "NORMAL",
                "reason": f"Center obstructed ({center_dist:.1f} cm <= {self.obstacle_threshold_cm} cm). Right flank offers greater clearance ({right_dist:.1f} cm vs Left {left_dist:.1f} cm).",
                "action": "TURN_RIGHT",
                "alert": f"Obstacle encountered ahead at {center_dist:.1f} cm. Initiating right avoidance."
            }

        else:
            # Both sides blocked or equidistant obstacles
            return {
                "agent_name": "Navigation Agent",
                "decision": "STOP",
                "priority": "HIGH",
                "reason": f"Obstacle dead ahead ({center_dist:.1f} cm) and both flanking directions are restricted (Left {left_dist:.1f} cm, Right {right_dist:.1f} cm). Halting for operator safety.",
                "action": "STOP",
                "alert": "COLLISION RISK: Robot path fully obstructed in center and flanks. Full stop executed."
            }

