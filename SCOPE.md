# E-Stitch Project Scope

## Core (Existing)

- Customer: browse designs, find tailors, place orders, track status, measurements, reviews.
- Tailor: register, get verified, set prices, accept/reject orders, update status.
- Admin: verify tailors, platform rules, monitor orders.

---

## Phase 2 – AI Add-On

**Goal:** Assistive, conceptual clothing design previews from text. Not production-grade fashion simulation.

### Features

1. **Text-to-image sketch generation**
   - Use an open-source model (Stable Diffusion via Hugging Face Inference API) to generate conceptual clothing design previews from user prompts.
   - Prompts are prefixed with fashion-sketch style guidance for consistent, sketch-like output.
   - Implementation: backend `POST /api/ai-designs` with `huggingface_hub` (free tier, open-source model).

2. **Prompt history**
   - Every generation is stored (user, prompt, image path, timestamp).
   - Users can list and revisit previously generated design ideas via `GET /api/ai-designs`.
   - Frontend: “AI Design” page with history list and selection.

3. **Download generated sketches**
   - Users can download generated images for reference and sharing.
   - Backend: `GET /api/ai-designs/{id}/download` returns the image file.
   - Frontend: “Download sketch” button using authenticated fetch and blob download.

### Technology

- **Backend:** FastAPI, SQLite (table `ai_design_generations`), Hugging Face Inference API (free tier).
- **Model:** Open-source (e.g. `stabilityai/stable-diffusion-2-1`).
- **Constraints:** Free and open-source only; feature is clearly assistive/conceptual.

---

## Phase 3 – Visual Enhancement

**Goal:** Basic 3D mannequin preview for selected or AI-generated designs with rotate and zoom. Assistive only.

### Features

1. **Basic 3D mannequin preview**
   - Display a simple 3D mannequin (torso) that shows the selected design image or an AI-generated design as a texture.
   - Source of design: catalog designs or AI-generated designs (from Phase 2).

2. **Rotate and zoom controls**
   - OrbitControls (drag to rotate, scroll to zoom) for better visual understanding of the outfit.
   - Implemented with Three.js via `@react-three/fiber` and `@react-three/drei`.

### Technology

- **Frontend:** Three.js, React Three Fiber, Drei (OrbitControls, useTexture).
- **Constraints:** Basic, conceptual preview only; not production-grade fashion simulation. Free and open-source stack only.

---

## Summary

| Phase   | Feature              | Stack / Notes                                      |
|---------|----------------------|----------------------------------------------------|
| Phase 2 | Text-to-image sketch | Hugging Face Inference API, open-source SD model   |
| Phase 2 | Prompt history       | SQLite, REST API                                   |
| Phase 2 | Download sketches    | File response, blob download in frontend           |
| Phase 3 | 3D mannequin         | Three.js, R3F, Drei                                |
| Phase 3 | Rotate & zoom        | OrbitControls                                      |

All of the above are **assistive and conceptual**, not production-grade fashion or simulation tools.
