"""
Crop Vision Service:
Handles crop image uploads, runs local OpenCV plant feature extraction,
and returns structured agronomic observations.
"""
import os
import uuid
import aiofiles
from fastapi import UploadFile
from app.agents.crop_monitoring_agent import CropMonitoringAgent

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

crop_agent = CropMonitoringAgent()

async def process_crop_image(file: UploadFile) -> dict:
    # Save uploaded file safely
    extension = os.path.splitext(file.filename)[1]
    if not extension:
        extension = ".jpg"
    unique_filename = f"{uuid.uuid4().hex[:10]}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    # Perform CV Analysis
    result = crop_agent.analyze_image(file_path)
    result["filename"] = unique_filename
    result["file_path"] = file_path
    return result

