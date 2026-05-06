from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./paiste.db"
    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    UPLOAD_DIR: str = "uploads"
    YOLO_MODEL_PATH: str = "models/yolov8.pt"
    CNN_MODEL_PATH: str = "models/ResNet_best.pth"

    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_BUCKET: str

    class Config:
        env_file = ".env"

settings = Settings()