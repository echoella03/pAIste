import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.schemas import IdentifyResponse
# CRITICAL FIX: Import 'run_detection_with_image' instead of just 'run_detection'
from app.services.detection_service import run_detection_with_image
from app.core.config import settings

router = APIRouter()

@router.post("/", response_model=None)
async def identify_species(image: UploadFile = File(...)):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = f"{temp_dir}/{uuid.uuid4()}_{image.filename}"

    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(image.file, f)

        detections, annotated_b64 = run_detection_with_image(temp_path)

        if not detections:
            return {
                "detections": [],
                "message": "No invasive species detected in this image.",
                "annotated_image": annotated_b64, # Returns image with yellow scanning boxes
            }

        return {
            "detections": detections,
            "message": "Identification complete",
            "annotated_image": annotated_b64, # Returns image with red IAS boxes
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)