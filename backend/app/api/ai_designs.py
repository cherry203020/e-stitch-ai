"""AI Design Generation API – Phase 2: text-to-image sketches (assistive/conceptual)."""
import asyncio
import io
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from ..config import get_settings
from ..database import get_db
from ..models import AIDesignGeneration
from ..schemas.ai_design import (
    AIDesignGenerateRequest,
    AIDesignFromImageRequest,
    AIDesignGenerationResponse,
)
from ..core.dependencies import get_current_user, require_customer

router = APIRouter(prefix="/ai-designs", tags=["ai-designs"])
settings = get_settings()

# Design-generation prompt prefix for fashion/blouse style
SKETCH_PREFIX = "fashion design sketch, clothing design concept, blouse design, elegant, high quality, "
DEFAULT_NEGATIVE = "blurry, low quality, distorted, deformed, ugly, bad anatomy, text, watermark"


def ensure_ai_design_dir() -> Path:
    d = Path(settings.upload_dir) / settings.ai_design_upload_subdir
    d.mkdir(parents=True, exist_ok=True)
    return d


def _generate_placeholder_image(prompt: str) -> bytes:
    """Generate a placeholder design image with no API key (Pillow only)."""
    from PIL import Image, ImageDraw, ImageFont
    w, h = 512, 512
    img = Image.new("RGB", (w, h), color=(250, 248, 245))
    draw = ImageDraw.Draw(img)
    # Soft gradient-like bands
    for i in range(0, h, 4):
        shade = int(240 - (i / h) * 30)
        draw.rectangle([0, i, w, i + 4], fill=(shade, shade - 5, shade - 10))
    # Simple "blouse" outline suggestion (conceptual)
    margin = 80
    draw.rectangle([margin, margin, w - margin, h - margin], outline=(180, 77, 77), width=3)
    # Prompt text (wrap long lines) – use default font so no key and no extra files needed
    font = ImageFont.load_default()
    text = f"Design idea: {prompt[:200]}" + ("..." if len(prompt) > 200 else "")
    y = h // 2 - 20
    for line in [text[i : i + 35] for i in range(0, min(len(text), 105), 35)]:
        draw.text((margin + 10, y), line, fill=(80, 70, 60), font=font)
        y += 24
    draw.text((margin, h - 50), "Conceptual preview (no API key)", fill=(150, 140, 130), font=font)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _generate_via_hf_api(prompt: str, negative_prompt: Optional[str] = None):
    """Use Hugging Face Inference API. Returns (bytes, None) on success or (None, error_message) on failure."""
    if not settings.huggingface_token:
        return None, "HUGGINGFACE_TOKEN is not set in .env. Add it and restart the backend."
    try:
        from huggingface_hub import InferenceClient
    except ImportError:
        return None, "huggingface_hub not installed. Run: pip install huggingface_hub"
    full_prompt = SKETCH_PREFIX + (prompt or "").strip()
    neg = (negative_prompt or "").strip() or DEFAULT_NEGATIVE
    model_id = getattr(settings, "ai_hf_model_id", None) or "black-forest-labs/FLUX.1-schnell"
    client = InferenceClient(token=settings.huggingface_token)
    try:
        kwargs = {"negative_prompt": neg}
        image = client.text_to_image(full_prompt, model=model_id, **kwargs)
    except TypeError:
        try:
            image = client.text_to_image(full_prompt, model=model_id)
        except Exception as e:
            return None, str(e)
    except Exception as e:
        return None, str(e)
    if image is None:
        return None, "Hugging Face returned no image"
    if isinstance(image, bytes):
        return image, None
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue(), None


async def generate_image_bytes(
    prompt: str,
    negative_prompt: Optional[str] = None,
    source: str = "auto",
) -> bytes:
    """
    Generate design image. source: "auto" (local then HF), "huggingface" (HF only), "local" (local only).
    """
    # 1) Local AI (when source is auto or local)
    if source in ("auto", "local"):
        try:
            from ..services.local_diffusion import is_available, generate_image_sync
            if is_available():
                image_bytes = await asyncio.to_thread(
                    generate_image_sync,
                    prompt,
                    model_id=settings.ai_local_model_id,
                    device_setting=settings.ai_device,
                )
                return image_bytes
        except Exception:
            if source == "local":
                raise HTTPException(
                    status_code=503,
                    detail="Local model not available. Install requirements-ai.txt and run scripts/download_ai_model.py",
                )

    # 2) Hugging Face Inference API (when source is auto or huggingface)
    if source in ("auto", "huggingface"):
        hf_bytes, hf_error = _generate_via_hf_api(prompt, negative_prompt=negative_prompt)
        if hf_bytes is not None:
            return hf_bytes
        if source == "huggingface":
            raise HTTPException(
                status_code=503,
                detail=hf_error or "Hugging Face API failed",
            )

    # 3) Placeholder (no dependencies)
    return _generate_placeholder_image(prompt)


@router.get("/status")
async def ai_design_status():
    """Check which image generation sources are available. No auth required for quick testing."""
    from ..services.local_diffusion import is_available
    hf_ok = bool(settings.huggingface_token)
    local_ok = is_available()
    return {
        "huggingface_configured": hf_ok,
        "local_ai_available": local_ok,
        "sources": ["auto", "huggingface", "local"],
        "message": "Hugging Face and/or local model ready" if (hf_ok or local_ok) else "Set HUGGINGFACE_TOKEN in .env or install local model (see scripts/download_ai_model.py)",
    }


@router.get("/verify-token")
async def verify_huggingface_token():
    """
    Check if the Hugging Face API key is valid by calling HF whoami.
    No auth required. Returns valid=True and username if the token works.
    """
    if not settings.huggingface_token:
        return {
            "valid": False,
            "error": "HUGGINGFACE_TOKEN is not set in .env",
            "username": None,
        }
    try:
        from huggingface_hub import HfApi
        api = HfApi(token=settings.huggingface_token)
        user_info = api.whoami()
        name = user_info.get("name") or user_info.get("username") or "unknown"
        return {
            "valid": True,
            "username": name,
            "error": None,
        }
    except Exception as e:
        return {
            "valid": False,
            "username": None,
            "error": str(e),
        }


@router.post("", response_model=AIDesignGenerationResponse)
async def generate_design(
    data: AIDesignGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_customer),
):
    """
    Generate a conceptual clothing design sketch from a text prompt.
    Uses an open-source model (Stable Diffusion). Assistive only.
    """
    prompt = (data.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    image_bytes = await generate_image_bytes(
        prompt,
        negative_prompt=data.negative_prompt,
        source=getattr(data, "source", "auto") or "auto",
    )
    upload_dir = ensure_ai_design_dir()
    filename = f"ai_{current_user.id}_{uuid.uuid4().hex[:12]}.png"
    path = upload_dir / filename
    with open(path, "wb") as f:
        f.write(image_bytes)

    relative_path = f"{settings.ai_design_upload_subdir}/{filename}"
    record = AIDesignGeneration(
        user_id=current_user.id,
        prompt=prompt,
        image_path=relative_path,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)

    return AIDesignGenerationResponse(
        id=record.id,
        prompt=record.prompt,
        image_url=f"/api/uploads/{record.image_path}",
        created_at=record.created_at,
    )


@router.post("/from-image", response_model=AIDesignGenerationResponse)
async def save_external_image(
    data: AIDesignFromImageRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_customer),
):
    """
    Save an image generated externally (e.g. Puter.js) for history and download.
    Expects a data URL (data:image/png;base64,...).
    """
    import base64
    prompt = (data.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    url = (data.image_data_url or "").strip()
    if not url.startswith("data:image/") or ";base64," not in url:
        raise HTTPException(status_code=400, detail="Invalid image_data_url (expect data:image/...;base64,...)")
    try:
        payload = url.split(",", 1)[1]
        image_bytes = base64.b64decode(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 in image_data_url")
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="Image too large")
    upload_dir = ensure_ai_design_dir()
    filename = f"ai_{current_user.id}_{uuid.uuid4().hex[:12]}.png"
    path = upload_dir / filename
    with open(path, "wb") as f:
        f.write(image_bytes)
    relative_path = f"{settings.ai_design_upload_subdir}/{filename}"
    record = AIDesignGeneration(
        user_id=current_user.id,
        prompt=prompt,
        image_path=relative_path,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return AIDesignGenerationResponse(
        id=record.id,
        prompt=record.prompt,
        image_url=f"/api/uploads/{record.image_path}",
        created_at=record.created_at,
    )


@router.get("", response_model=list[AIDesignGenerationResponse])
async def list_my_generations(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_customer),
):
    """List current user's AI design generations (prompt history)."""
    result = await db.execute(
        select(AIDesignGeneration)
        .where(AIDesignGeneration.user_id == current_user.id)
        .order_by(desc(AIDesignGeneration.created_at))
    )
    rows = result.scalars().all()
    return [
        AIDesignGenerationResponse(
            id=r.id,
            prompt=r.prompt,
            image_url=f"/api/uploads/{r.image_path}",
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/{generation_id}", response_model=AIDesignGenerationResponse)
async def get_generation(
    generation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_customer),
):
    """Get one AI design generation by ID (own only)."""
    result = await db.execute(
        select(AIDesignGeneration).where(
            AIDesignGeneration.id == generation_id,
            AIDesignGeneration.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Generation not found")
    return AIDesignGenerationResponse(
        id=record.id,
        prompt=record.prompt,
        image_url=f"/api/uploads/{record.image_path}",
        created_at=record.created_at,
    )


@router.get("/{generation_id}/download")
async def download_generation(
    generation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_customer),
):
    """Download the generated design image for reference/sharing."""
    result = await db.execute(
        select(AIDesignGeneration).where(
            AIDesignGeneration.id == generation_id,
            AIDesignGeneration.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Generation not found")
    full_path = Path(settings.upload_dir) / record.image_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    safe_name = f"e-stitch-design-{record.id}.png"
    return FileResponse(full_path, media_type="image/png", filename=safe_name)
