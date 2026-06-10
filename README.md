# E-Stitch

Full-stack web application that digitizes the local tailor workflow and connects customers with verified tailors. Includes **Phase 2 (AI Add-On)** and **Phase 3 (3D Mannequin Preview)** — see [SCOPE.md](SCOPE.md) for enhancement details.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Python FastAPI
- **Database**: SQLite
- **Extras**: Google Maps API (optional)

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Seed initial data (admin user, designs, rules):

```bash
cd backend
python seed_data.py
```

Admin login: `admin@estitch.com` / `admin123`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Local AI image generation (no API key)

To get **real AI-generated design images** without any API key, install the optional dependencies and use a free pretrained Stable Diffusion model (downloaded once from Hugging Face):

```bash
cd backend
pip install -r requirements-ai.txt
```

Then run the backend as usual. First generation may take 1–2 minutes (model load) plus ~30s–2min per image (faster on GPU). No `HUGGINGFACE_TOKEN` needed; the model is public and runs fully offline after the first download.

- **GPU (CUDA):** much faster. Set `AI_DEVICE=cuda` in `.env` or leave as `auto`.
- **CPU:** works but slower; first request loads the model, then each image may take 1–3 minutes.

## User Roles

### Customer
- Browse blouse designs (simple, bridal, heavy work)
- **AI Design (Phase 2):** Generate conceptual design sketches from text. Uses **Puter.js** in the browser for fast generation when available; falls back to local Stable Diffusion or placeholder
- **3D Preview (Phase 3):** View selected or AI-generated designs on a basic 3D mannequin with rotate and zoom
- Discover tailors by price, rating, distance
- Place orders with pickup/delivery scheduling
- Track order status in real time
- Request urgent stitching (extra fee)
- Cancel orders (time-based refund rules)
- Rate and review tailors after delivery

### Tailor
- Register and get verified by admin
- Set stitching prices and urgency charges
- Accept or reject incoming orders
- Update order status (fabric picked → stitching → quality check → delivery)

### Admin
- Verify tailor registrations
- Manage platform pricing and cancellation rules
- Monitor all orders

## API Structure

- `POST /api/auth/register` - Register (customer/tailor)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `GET /api/designs` - List designs (category filter)
- `POST /api/ai-designs` - Generate AI design sketch (customer, Phase 2)
- `GET /api/ai-designs` - List my AI design generations (prompt history)
- `GET /api/ai-designs/{id}/download` - Download generated sketch image
- `GET /api/tailors` - List tailors (price, rating, distance filters)
- `POST /api/orders` - Place order
- `GET /api/orders` - List orders
- `GET /api/orders/{id}` - Order detail
- `PATCH /api/orders/{id}/status` - Update status (tailor/admin)
- `POST /api/orders/{id}/cancel` - Cancel order
- `POST /api/reviews` - Submit review

## Order Status Flow

Order Placed → Pending Tailor → Fabric Picked → Stitching in Progress → Quality Check → Out for Delivery → Delivered

## Environment

Backend `.env`:
- `SECRET_KEY` - JWT secret
- `GOOGLE_MAPS_API_KEY` - Optional for maps
- **AI (no key by default):** Install `requirements-ai.txt` for local Stable Diffusion (no API key). Optional: `HUGGINGFACE_TOKEN` to use Hugging Face Inference API instead. Optional: `AI_LOCAL_MODEL_ID` (default `runwayml/stable-diffusion-v1-5`), `AI_DEVICE` (`auto`, `cpu`, or `cuda`).

Frontend `.env`:
- `VITE_API_URL` - API base URL (default: proxied to backend)
- `VITE_GOOGLE_MAPS_API_KEY` - Optional for tailor location maps
