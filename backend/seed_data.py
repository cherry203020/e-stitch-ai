"""Seed database with initial designs and admin user."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from app.database import async_session_maker, init_db, Base
from app.database import engine
from app.models import User, Design, PlatformRule
from app.core.security import get_password_hash


async def seed():
    await init_db()
    async with async_session_maker() as db:
        # Admin user
        r = await db.execute(select(User).where(User.email == "admin@estitch.com"))
        if not r.scalar_one_or_none():
            admin = User(
                email="admin@estitch.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Platform Admin",
                role="admin"
            )
            db.add(admin)
            await db.flush()
            print("Created admin user: admin@estitch.com / admin123")

        # Predefined blouse designs with images and price (min 1000)
        designs = [
            {"name": "Classic Round Neck", "neck_type": "round", "sleeve_type": "short", "back_type": "high", "category": "simple", "description": "Simple round neck with short sleeves", "image_url": "/api/uploads/designs/classic-round-neck.png", "price": 1000},
            {"name": "V-Neck Party", "neck_type": "v-neck", "sleeve_type": "three-quarter", "back_type": "high", "category": "simple", "description": "Elegant V-neck with 3/4 sleeves", "image_url": "/api/uploads/designs/v-neck-party.png", "price": 1200},
            {"name": "Boat Neck Casual", "neck_type": "boat", "sleeve_type": "sleeveless", "back_type": "high", "category": "simple", "description": "Trendy boat neck sleeveless", "image_url": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80", "price": 1000},
            {"name": "Keyhole Back", "neck_type": "round", "sleeve_type": "full", "back_type": "keyhole", "category": "simple", "description": "Round neck with keyhole back", "image_url": "/api/uploads/designs/keyhole-back.png", "price": 1500},
            {"name": "Heavy Zardozi Bridal", "neck_type": "v-neck", "sleeve_type": "full", "back_type": "low", "category": "bridal", "description": "Heavy zardozi work bridal blouse", "image_url": "/api/uploads/designs/heavy-zardozi-bridal.png", "price": 5000},
            {"name": "Kundan Bridal", "neck_type": "sweetheart", "sleeve_type": "three-quarter", "back_type": "low", "category": "bridal", "description": "Kundan stone bridal blouse", "image_url": "/api/uploads/designs/kundan-bridal.png", "price": 4500},
            {"name": "Mirror Work Lehenga", "neck_type": "round", "sleeve_type": "short", "back_type": "high", "category": "heavy_work", "description": "Traditional mirror work heavy blouse", "image_url": "/api/uploads/designs/mirror-work-lehenga.png", "price": 2500},
            {"name": "Thread Embroidery", "neck_type": "v-neck", "sleeve_type": "full", "back_type": "high", "category": "heavy_work", "description": "Intricate thread embroidery", "image_url": "/api/uploads/designs/thread-embroidery.png", "price": 2200},
        ]
        r = await db.execute(select(Design).limit(1))
        existing = r.scalar_one_or_none()
        if not existing:
            for d in designs:
                db.add(Design(**d))
            await db.flush()
            print("Created predefined designs")
        else:
            # Update existing designs with image URLs
            for d in designs:
                r2 = await db.execute(select(Design).where(Design.name == d["name"]))
                design = r2.scalar_one_or_none()
                if design:
                    design.image_url = d["image_url"]
                    if "description" in d and d["description"]:
                        design.description = d["description"]
                    if "price" in d:
                        design.price = d["price"]
            await db.flush()
            print("Updated design images and prices")

        # Platform rules
        rules = [
            {"rule_key": "cancellation_rules", "rule_value": '{"72": 100, "48": 75, "24": 50, "0": 0}', "description": "Hours before pickup -> refund %"},
            {"rule_key": "default_urgency_multiplier", "rule_value": "1.5", "description": "Default urgency charge multiplier"},
        ]
        for rule in rules:
            r = await db.execute(select(PlatformRule).where(PlatformRule.rule_key == rule["rule_key"]))
            if not r.scalar_one_or_none():
                db.add(PlatformRule(**rule))
        await db.flush()
        print("Platform rules set")
        await db.commit()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
