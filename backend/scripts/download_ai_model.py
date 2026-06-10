"""
Pre-download the local Stable Diffusion model for AI design generation.

Run this once so the first design generation is fast (model is cached by Hugging Face).
Requires: pip install -r requirements-ai.txt (torch, diffusers).

Usage (from backend folder):
  python scripts/download_ai_model.py

Or with custom model:
  AI_LOCAL_MODEL_ID=runwayml/stable-diffusion-v1-5 python scripts/download_ai_model.py
"""
import os
import sys

# Add parent so we can use app.config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    try:
        from diffusers import StableDiffusionPipeline
        import torch
    except ImportError as e:
        print("Install local AI dependencies first: pip install -r requirements-ai.txt")
        print("Error:", e)
        sys.exit(1)

    model_id = os.environ.get("AI_LOCAL_MODEL_ID", "runwayml/stable-diffusion-v1-5")
    print(f"Downloading model: {model_id}")
    print("This may take several minutes (1–3 GB). Model will be cached for future use.")
    try:
        pipe = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float32,
        )
        print("Download complete. Model cached at:", pipe.config.get("_class_name", model_id))
    except Exception as e:
        print("Download failed:", e)
        sys.exit(1)
    print("Done. You can now use 'Local model' in AI Design.")

if __name__ == "__main__":
    main()
