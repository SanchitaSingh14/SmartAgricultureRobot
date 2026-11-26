import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.api.endpoints.farm import router as farm_router, coordinator, get_or_create_robot_state
from app.services.sensor_simulator import simulator
from app.services.mqtt_service import mqtt_service
from app.models.entities import SensorReading
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MainApp")

# Create database tables
Base.metadata.create_all(bind=engine)

# Background simulation worker
simulation_task = None

async def background_simulation_loop():
    logger.info("Starting background simulation worker loop...")
    while True:
        try:
            await asyncio.sleep(settings.SIMULATION_INTERVAL_SECONDS)
            db = SessionLocal()
            try:
                robot = get_or_create_robot_state(db)
                if robot.simulation_running:
                    data = simulator.generate_reading()
                    reading = SensorReading(
                        timestamp=datetime.now(timezone.utc),
                        soil_moisture=data["soil_moisture"],
                        temperature=data["temperature"],
                        humidity=data["humidity"],
                        left_distance=data["left_distance"],
                        center_distance=data["center_distance"],
                        right_distance=data["right_distance"],
                        is_simulated=True,
                        source=data.get("source", "sim_loop")
                    )
                    db.add(reading)
                    db.commit()
                    db.refresh(reading)

                    coordinator.run_cycle(db, reading, robot)
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in simulation loop: {e}")
            await asyncio.sleep(2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Smart Agriculture Robot Backend...")
    mqtt_service.connect()
    global simulation_task
    simulation_task = asyncio.create_task(background_simulation_loop())
    yield
    # Shutdown
    if simulation_task:
        simulation_task.cancel()
    mqtt_service.disconnect()
    logger.info("Smart Agriculture Robot Backend shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(farm_router, prefix=settings.API_V1_STR)

# Serve uploaded crop pictures
upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "uploads"))
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

@app.get("/")
def root():
    return {
        "message": "AI-Powered Smart Agriculture Robot Backend is running.",
        "documentation": "/docs",
        "api_prefix": settings.API_V1_STR
    }

