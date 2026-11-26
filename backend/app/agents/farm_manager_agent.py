"""
Farm Manager Agent:
Synthesizes conclusions from Irrigation, Navigation, Environment, and Crop agents.
Prioritizes urgent safety interventions, alerts the farmer, and establishes
the holistic next operational directive for the robot.
Never overrides a safety-critical STOP condition.
"""
from typing import Dict, Any, List, Optional

class FarmManagerAgent:
    def evaluate(
        self,
        irrigation_decision: Dict[str, Any],
        navigation_decision: Dict[str, Any],
        environment_decision: Dict[str, Any],
        crop_decision: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Synthesize multi-agent decisions into a single auditable farm directive.
        """
        priority_levels = {"CRITICAL": 4, "HIGH": 3, "NORMAL": 2, "LOW": 1, "NONE": 0}
        
        decisions = [irrigation_decision, navigation_decision, environment_decision]
        if crop_decision:
            decisions.append(crop_decision)

        # Collect active alerts
        active_alerts = []
        for d in decisions:
            if d.get("alert"):
                active_alerts.append(f"[{d.get('agent_name')}]: {d.get('alert')}")

        # Check safety invariants:
        # Rule 1: If navigation says STOP, safety lock must prevent robot movement
        nav_action = navigation_decision.get("action")
        nav_decision = navigation_decision.get("decision")
        
        is_stopped = (nav_decision == "STOP" or nav_action == "STOP")
        irrigation_active = (irrigation_decision.get("pump_state") is True)

        # Determine overall farm system status
        max_priority = "LOW"
        highest_p_val = 1
        for d in decisions:
            p = d.get("priority", "LOW")
            val = priority_levels.get(p, 1)
            if val > highest_p_val:
                highest_p_val = val
                max_priority = p

        # Synthesize strategic operational recommendation
        recommendations = []
        if is_stopped:
            recommendations.append("Halt locomotion: Navigation route blocked or sensor fault detected.")
        else:
            recommendations.append(f"Maintain autonomous navigation: {nav_decision}.")

        if irrigation_active:
            recommendations.append(f"Irrigation pump actively dispensing: {irrigation_decision.get('reason')}.")
        else:
            recommendations.append("Soil hydration adequate; pump standby.")

        if environment_decision.get("priority") in ["HIGH", "NORMAL"]:
            recommendations.append(f"Microclimate advisory: {environment_decision.get('reason')}")

        if crop_decision and crop_decision.get("priority") == "HIGH":
            recommendations.append(f"Crop stress alert: {crop_decision.get('decision')}")

        directive_summary = " | ".join(recommendations)

        return {
            "agent_name": "Farm Manager Agent",
            "decision": "STATUS_OPTIMIZED" if highest_p_val < 3 else "ACTION_REQUIRED",
            "priority": max_priority,
            "reason": directive_summary,
            "action": f"DISPATCH: Nav={nav_decision}, Pump={'ON' if irrigation_active else 'OFF'}",
            "active_alerts": active_alerts,
            "safety_stop_enforced": is_stopped
        }

