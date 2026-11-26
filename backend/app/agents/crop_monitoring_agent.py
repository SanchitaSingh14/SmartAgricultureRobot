"""
Crop Monitoring Agent:
Provides realistic, honest computer-vision analysis of agricultural foliage.
Uses OpenCV for foliage segmentation, vegetation index calculation (Excess Green ExG),
and chlorosis/yellowing ratio extraction.
Clearly notes fallback nature and does not fabricate diagnoses without verified neural models.
"""
import os
import cv2
import numpy as np
from typing import Dict, Any, Optional

class CropMonitoringAgent:
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.has_custom_model = model_path is not None and os.path.exists(model_path)

    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze leaf/crop canopy photo using computer vision metrics.
        Calculates:
        - Vegetation canopy coverage (%)
        - Excess Green Index (ExG = 2*G - R - B)
        - Yellowing/Chlorosis ratio (%)
        """
        if not os.path.exists(image_path):
            return {
                "agent_name": "Crop Monitoring Agent",
                "decision": "FILE_NOT_FOUND",
                "priority": "HIGH",
                "health_status": "Error",
                "greenness_index": 0.0,
                "yellowing_ratio": 0.0,
                "notes": f"Image file '{image_path}' could not be located on disk.",
                "model_used": "OpenCV Pipeline (Local)",
                "reason": "File access failure.",
                "action": "ABORT_ANALYSIS",
                "alert": "Crop analysis failed: Target image file missing."
            }

        img = cv2.imread(image_path)
        if img is None:
            return {
                "agent_name": "Crop Monitoring Agent",
                "decision": "IMAGE_CORRUPT",
                "priority": "HIGH",
                "health_status": "Error",
                "greenness_index": 0.0,
                "yellowing_ratio": 0.0,
                "notes": "OpenCV could not decode the uploaded image bytes.",
                "model_used": "OpenCV Pipeline (Local)",
                "reason": "Image decoding error.",
                "action": "ABORT_ANALYSIS",
                "alert": "Crop analysis failed: Image corrupt or unsupported format."
            }

        # Convert BGR to float32 normalized
        b, g, r = cv2.split(img.astype(np.float32) / 255.0)
        
        # Calculate Excess Green Index (ExG)
        # ExG = 2*G - R - B; positive indicates green vegetation dominance
        exg = 2.0 * g - r - b
        mean_exg = float(np.mean(exg))

        # HSV color space analysis for yellowing / chlorosis detection
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Yellow mask in HSV: Hue ~ 20 to 35, Saturation > 50, Value > 50
        lower_yellow = np.array([18, 50, 50])
        upper_yellow = np.array([35, 255, 255])
        yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
        yellow_pixel_ratio = float(np.sum(yellow_mask > 0) / (img.shape[0] * img.shape[1])) * 100.0

        # Green mask in HSV: Hue ~ 36 to 85
        lower_green = np.array([36, 40, 40])
        upper_green = np.array([85, 255, 255])
        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        green_pixel_ratio = float(np.sum(green_mask > 0) / (img.shape[0] * img.shape[1])) * 100.0

        # Interpret metrics with honest scientific boundaries
        if yellow_pixel_ratio > 15.0 and yellow_pixel_ratio > (green_pixel_ratio * 0.4):
            status = "Chlorosis Detected"
            notes = (
                f"Significant chlorotic/yellow pigmentation detected ({yellow_pixel_ratio:.1f}% of image). "
                f"Green canopy coverage is {green_pixel_ratio:.1f}%. "
                "Recommendation: Inspect for nitrogen deficiency, overwatering, or fungal leaf streak. "
                "Note: Rule-based CV heuristic; laboratory soil test recommended before treatment."
            )
            priority = "HIGH"
            alert = f"Visual alert: Elevated chlorosis ({yellow_pixel_ratio:.1f}%) observed in crop canopy."
        elif green_pixel_ratio > 25.0 and mean_exg > 0.05:
            status = "Healthy Foliage"
            notes = (
                f"Robust chlorophyll density detected. Excess Green Index: {mean_exg:.3f}. "
                f"Green leaf coverage: {green_pixel_ratio:.1f}%. Yellowing index is minimal ({yellow_pixel_ratio:.1f}%). "
                "Visual canopy reflects vigorous photosynthetic state."
            )
            priority = "LOW"
            alert = None
        elif green_pixel_ratio < 5.0 and yellow_pixel_ratio < 5.0:
            status = "Low Vegetation / Soil Background"
            notes = (
                f"Sparse foliage detected in frame (Green: {green_pixel_ratio:.1f}%, Yellow: {yellow_pixel_ratio:.1f}%). "
                "Frame appears dominated by bare soil, mulch, or non-foliage elements. "
                "Reposition robot camera closer to crop leaves."
            )
            priority = "NORMAL"
            alert = None
        else:
            status = "Observation: Mixed Foliage"
            notes = (
                f"Foliage analyzed with mixed visual features (ExG: {mean_exg:.3f}, Green: {green_pixel_ratio:.1f}%, "
                f"Yellow: {yellow_pixel_ratio:.1f}%). "
                "Manual agronomic field scouting suggested for detailed disease differentiation."
            )
            priority = "NORMAL"
            alert = None

        return {
            "agent_name": "Crop Monitoring Agent",
            "decision": status,
            "priority": priority,
            "health_status": status,
            "greenness_index": round(mean_exg, 4),
            "yellowing_ratio": round(yellow_pixel_ratio, 2),
            "green_ratio": round(green_pixel_ratio, 2),
            "notes": notes,
            "model_used": "OpenCV HSV & Excess Green Heuristic (Offline Native CV)",
            "reason": f"Green coverage {green_pixel_ratio:.1f}%, yellowing {yellow_pixel_ratio:.1f}%, ExG {mean_exg:.3f}",
            "action": "RECORD_CROP_HEALTH",
            "alert": alert
        }

