"""Application configuration."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment."""
    
    app_name: str = "E-Stitch"
    debug: bool = False
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./estitch.db"
    
    # JWT
    secret_key: str = "your-super-secret-key-change-in-production-estitch-2024"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    
    # File upload
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 5
    
    # Google Maps (optional - set in .env)
    google_maps_api_key: str = ""

    # Phase 2 – AI Add-On (design & image generation)
    huggingface_token: str = ""  # optional: use Hugging Face Inference API for image generation when set
    ai_hf_model_id: str = "black-forest-labs/FLUX.1-schnell"  # HF Inference API text-to-image (fast, works well)
    ai_design_upload_subdir: str = "ai_designs"
    # Local AI (no API key): free pretrained model via diffusers, downloaded once from Hugging Face
    ai_local_model_id: str = "runwayml/stable-diffusion-v1-5"
    ai_device: str = "auto"  # "cpu", "cuda", or "auto" (cuda if available)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
