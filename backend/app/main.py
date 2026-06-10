"""E-Stitch - FastAPI main application."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .api.auth import router as auth_router
from .api.designs import router as designs_router
from .api.tailors import router as tailors_router
from .api.orders import router as orders_router
from .api.measurements import router as measurements_router
from .api.reviews import router as reviews_router
from .api.platform_rules import router as platform_rules_router
from .api.uploads import router as uploads_router
from .api.ai_designs import router as ai_designs_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="E-Stitch API",
    description="Digitizing local tailor workflow - Customer, Tailor, Admin",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(designs_router, prefix="/api")
app.include_router(tailors_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(measurements_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(platform_rules_router, prefix="/api")
app.include_router(uploads_router, prefix="/api")
app.include_router(ai_designs_router, prefix="/api")


@app.get("/")
def root():
    return {"app": "E-Stitch", "version": "1.0.0", "docs": "/docs"}
