import os
import json
import base64
import io
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models 
from torchvision import transforms
from ultralytics import YOLO
from typing import List, Tuple
from PIL import Image, ImageDraw, ImageFont

from app.core.config import settings

CNN_CLASS_NAMES = [
    "Acacia mangium", "Asian house rat", "Australian redclaw crayfish",
    "Banded bull frog", "Buyo-buyo", "Cane toad", "Chinese edible frog",
    "Crown of thorns", "Fall armyworm", "Giant african land snail",
    "Golden apple snail", "Greenhouse frog", "House mouse",
    "Ipil-ipil", "Nile tilapia", "Walking catfish", "Water hyacinth",
]

YOLO_CONFIDENCE_THRESHOLD = 0.80
CNN_CONFIDENCE_THRESHOLD  = 0.80
RESNET_INPUT_SIZE = (224, 224)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

resnet_transform = transforms.Compose([
    transforms.Resize(RESNET_INPUT_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

yolo_model = None
cnn_model  = None

def load_models():
    global yolo_model, cnn_model
    
    if os.path.exists(settings.YOLO_MODEL_PATH):
        yolo_model = YOLO(settings.YOLO_MODEL_PATH)
        yolo_model.to(DEVICE)
    
    if os.path.exists(settings.CNN_MODEL_PATH):
        cnn_model = models.resnet50(weights=None)
        num_ftrs = cnn_model.fc.in_features
        cnn_model.fc = nn.Linear(num_ftrs, len(CNN_CLASS_NAMES))
        
        state_dict = torch.load(settings.CNN_MODEL_PATH, map_location=DEVICE)
        cnn_model.load_state_dict(state_dict)
        
        cnn_model.eval()
        cnn_model.to(DEVICE)

load_models()

def run_detection(image_path: str) -> List[dict]:
    detections, _ = run_detection_with_image(image_path)
    return detections

def run_detection_with_image(image_path: str) -> Tuple[List[dict], str]:
    image = Image.open(image_path).convert("RGB")

    if yolo_model is None or cnn_model is None:
        stub = _stub_detections()
        annotated = _draw_boxes(image, stub)
        return stub, _to_base64(annotated)

    yolo_results = yolo_model(image, conf=YOLO_CONFIDENCE_THRESHOLD, verbose=False)

    detections = []
    visualization_list = []  

    for result in yolo_results:
        for box in result.boxes:
            yolo_conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

            if x2 <= x1 or y2 <= y1:
                continue

            is_yolo_accepted = yolo_conf >= YOLO_CONFIDENCE_THRESHOLD

            crop = image.crop((x1, y1, x2, y2))
            species_name, cnn_conf = _classify_crop(crop)

            is_cnn_accepted = cnn_conf >= CNN_CONFIDENCE_THRESHOLD
            is_accepted = is_yolo_accepted and is_cnn_accepted

            det_obj = {
                "species_name": species_name,
                "confidence_score": float(cnn_conf),
                "bbox": [x1, y1, x2, y2],
                "bbox_data": json.dumps([x1, y1, x2, y2]),
                "yolo_label": "IAS",
                "cnn_label": species_name,
                "accepted": is_accepted,
                "rejected": not is_accepted,
                "rejection_reason": "" if is_accepted else ("Low YOLO" if not is_yolo_accepted else "Low CNN")
            }

            detections.append(det_obj)
            visualization_list.append(det_obj)

    annotated = _draw_boxes(image, visualization_list)
    return detections, _to_base64(annotated)

def _classify_crop(crop: Image.Image) -> Tuple[str, float]:
    cnn_model.eval()
    input_tensor = resnet_transform(crop).unsqueeze(0).to(DEVICE)
    
    with torch.no_grad():
        logits = cnn_model(input_tensor)
        probs  = F.softmax(logits, dim=1)
        conf, idx = torch.max(probs, dim=1)
    
    species = CNN_CLASS_NAMES[idx.item()]
    return species, conf.item()

def _draw_boxes(image: Image.Image, boxes: List[dict]) -> Image.Image:
    draw = ImageDraw.Draw(image)
    font_size = 40
    
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except IOError:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except IOError:
            font = ImageFont.load_default()

    for box in boxes:
        x1, y1, x2, y2 = box["bbox"]
        
        if box["accepted"]:
            color = "#CA0000" 
            label_text = f"IAS: {box['species_name']} {box['confidence_score']*100:.0f}%"
        else:
            color = "#FFD700" 
            reason = box.get("rejection_reason", "Scanning...")
            label_text = f"{reason}"

        for i in range(4):
            draw.rectangle([x1+i, y1+i, x2-i, y2-i], outline=color)

        text_y = y1 - (font_size + 10) if y1 > (font_size + 10) else y1 + 5
        
        try:
            left, top, right, bottom = draw.textbbox((x1 + 5, text_y), label_text, font=font)
            draw.rectangle([left - 5, top - 5, right + 5, bottom + 5], fill=color)
            text_color = "white" 
        except AttributeError:
            text_color = color 

        draw.text((x1 + 5, text_y), label_text, fill=text_color, font=font)

    return image

def _to_base64(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=90)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def _stub_detections() -> List[dict]:
    return [
        {
            "species_name": "Golden Apple Snail",
            "confidence_score": 0.91,
            "bbox_data": json.dumps([120, 80, 340, 260]),
            "bbox": [120, 80, 340, 260],
            "yolo_label": "IAS",
            "cnn_label": "Golden Apple Snail",
            "accepted": True,
            "rejected": False
        }
    ]