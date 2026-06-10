"""
Local text-to-image using Stable Diffusion (diffusers).
No API key: model is downloaded once from Hugging Face (public).
Free, open-source, runs fully offline after first download.
"""
import io
import threading
from typing import Optional

# Lazy-loaded pipeline (loaded on first request)
_pipeline = None
_pipeline_lock = threading.Lock()
SKETCH_SUFFIX = ", fashion sketch, clothing design concept, blouse design, line drawing, conceptual art"


def _get_device(device_setting: str) -> str:
    if device_setting == "cuda":
        return "cuda"
    if device_setting == "cpu":
        return "cpu"
    try:
        import torch
        return "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        return "cpu"


def _load_pipeline(model_id: str, device: str):
    """Load Stable Diffusion pipeline (sync, may take 1–2 min first time)."""
    from diffusers import StableDiffusionPipeline
    import torch
    # Use float32 everywhere to avoid black images (float16 can cause them on many setups)
    kwargs = {"torch_dtype": torch.float32}
    try:
        pipe = StableDiffusionPipeline.from_pretrained(model_id, safety_checker=None, **kwargs)
    except TypeError:
        pipe = StableDiffusionPipeline.from_pretrained(model_id, **kwargs)
    pipe = pipe.to(device)
    if device == "cpu":
        pipe.enable_attention_slicing()  # reduce memory on CPU
    return pipe


def get_pipeline(model_id: str, device_setting: str):
    """Get or create the global pipeline (thread-safe, lazy load)."""
    global _pipeline
    with _pipeline_lock:
        if _pipeline is not None:
            return _pipeline
        device = _get_device(device_setting)
        _pipeline = _load_pipeline(model_id, device)
        return _pipeline


def _is_mostly_black(image) -> bool:
    """True if image is essentially black (generation failed)."""
    pixels = list(image.getdata())
    if not pixels:
        return True
    if isinstance(pixels[0], int):
        mean = sum(pixels) / len(pixels)
    else:
        mean = sum(sum(p) for p in pixels) / (len(pixels) * len(pixels[0]))
    return mean < 15.0


def generate_image_sync(
    prompt: str,
    model_id: str,
    device_setting: str,
    num_inference_steps: int = 30,
    guidance_scale: float = 7.5,
    width: int = 512,
    height: int = 512,
) -> bytes:
    """
    Generate image from text using local Stable Diffusion. Blocking call.
    Run this from a thread (e.g. asyncio.to_thread) to avoid blocking the event loop.
    Uses float32 and a fixed seed to avoid black-image issues.
    """
    import torch
    full_prompt = (prompt.strip() + SKETCH_SUFFIX)[:500]
    pipe = get_pipeline(model_id, device_setting)
    device = _get_device(device_setting)
    generator = torch.Generator(device=device).manual_seed(42)
    image = None
    for attempt in range(3):
        image = pipe(
            full_prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            width=width,
            height=height,
            generator=generator,
        ).images[0]
        if not _is_mostly_black(image):
            break
        generator.manual_seed(42 + attempt + 1)
    if image is None or _is_mostly_black(image):
        raise RuntimeError("Local model produced black image; try again or use placeholder.")
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def is_available() -> bool:
    """Return True if diffusers and torch are installed and local generation can be used."""
    try:
        import torch  # noqa: F401
        import diffusers  # noqa: F401
        return True
    except ImportError:
        return False
