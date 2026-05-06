import csv
import sys
import os
from datetime import datetime, timedelta
import random

# Ensure app directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.db.database import create_db_and_tables, engine
from app.models.user import User
from app.models.species import Species
from app.models.report import Report, Detection
from app.core.security import hash_password

DUMMY_IMAGES = [
    "acacia mangium 1.jpg", "acacia mangium 2.jpg", "Asian house rat 1.jpg", "Australian Redclaw crayfish 1.jpg",
    "Australian Redclaw crayfish 2.jpg", "Australian Redclaw crayfish 3.jpg", "Australian Redclaw crayfish 4.jpg",
    "Banded bull frog 1.jpg", "Banded bull frog 2.jpg", "buyo-buyo 1.jpg", "buyo-buyo 2.jpg", "buyo-buyo 3.jpg", "Cane toad 1.jpg", 
    "Cane toad 2.jpg", "chinese edible frog 1.jpg", "chinese edible frog 2.jpg", "crown of thorns 1.jpg", 
    "crown of thorns 2.jpg", "crown of thorns 3.jpg", "Fall armyworm 1.jpg", "Giant african land snail 1.jpg",
    "Giant african land snail 2.jpg", "golden apple snail 1.jpg", "golden apple snail 2.jpg", "golden apple snail 3.jpg",
    "greenhouse frog 1.jpg", "greenhouse frog 2.jpg", "greenhouse frog 3.jpg", "House mouse 1.jpg",
    "House mouse 2.jpg", "House mouse 3.jpg", "House mouse 4.jpg", "ipil-ipil 1.jpg", "ipil-ipil 2.jpg", 
    "ipil-ipil 3.jpg", "nile tilapia 1.jpg", "nile tilapia 2.jpg", "nile tilapia 3.jpg", "Walking catfish 1.jpg", 
    "Walking catfish 2.jpg", "Walking catfish 3.jpg", "Walking catfish 4.jpg", "Water hyacinth 1.jpg",
    "Water hyacinth 2.jpg", "Water hyacinth 3.jpg"
]

ADMIN = {
    "name": "Admin",
    "email": "admin@paiste.ph",
    "password": "Admin@1234",
    "role": "admin",
}

TEST_USERS = [
    {"name": "Juan dela Cruz", "email": "juan@test.ph", "password": "Test@1234"},
    {"name": "Maria Santos", "email": "maria@test.ph", "password": "Test@1234"},
    {"name": "Pedro Reyes", "email": "pedro@test.ph", "password": "Test@1234"},
    {"name": "Andrae Bretana", "email": "andrae@gmail.com", "password": "Test@1234"},
    {"name": "Daniela Comapon", "email": "daniela@gmail.com", "password": "Test@1234"},
    {"name": "Yza Prochina", "email": "yza@gmail.com", "password": "Test@1234"}
]

# Expanded locations in Davao Region
DUMMY_LOCATIONS = [
    # --- IGACOS (Samal) Area ---
    {"name": "Babak District, Samal", "lat": 7.1205, "lng": 125.6811},
    {"name": "Kaputian Beach, Samal", "lat": 6.9822, "lng": 125.7483},
    {"name": "Peñaplata Center, Samal", "lat": 7.0731, "lng": 125.7171},
    {"name": "Talicud Island (West)", "lat": 6.9458, "lng": 125.6883},
    {"name": "Adecor Coastline, Samal", "lat": 7.0150, "lng": 125.7550},
    {"name": "Monfort Bat Sanctuary Area", "lat": 7.1350, "lng": 125.6920},
    
    # --- Davao City Coastal & Urban ---
    {"name": "Davao River Delta", "lat": 7.0655, "lng": 125.6081},
    {"name": "Agdao Shoreline", "lat": 7.0864, "lng": 125.6292},
    {"name": "Sta. Ana Pier", "lat": 7.0764, "lng": 125.6264},
    {"name": "Times Beach, Matina", "lat": 7.0520, "lng": 125.5980},
    {"name": "Toril Fish Port", "lat": 7.0125, "lng": 125.5000},
    {"name": "Bago Aplaya Coast", "lat": 7.0280, "lng": 125.5450},
    {"name": "Sasa Ferry Terminal", "lat": 7.1150, "lng": 125.6600},
    {"name": "Davao City Golf Club Area", "lat": 7.0710, "lng": 125.5850},
    
    # --- Davao del Sur & Buffer Zones ---
    {"name": "Mt. Apo Natural Park (Buffer)", "lat": 6.9897, "lng": 125.2702},
    {"name": "Digos City Coastal Zone", "lat": 6.7497, "lng": 125.3572},
    {"name": "Sta. Cruz Mangrove Area", "lat": 6.8833, "lng": 125.4167},
    {"name": "Malita Agricultural Hub", "lat": 6.4111, "lng": 125.6139},
    {"name": "Eden Nature Park Area", "lat": 7.0150, "lng": 125.4320},
    
    # --- Davao del Norte & Davao de Oro ---
    {"name": "Tagum City Banana Plantations", "lat": 7.4478, "lng": 125.8075},
    {"name": "Panabo Coastal Road", "lat": 7.3050, "lng": 125.6850},
    {"name": "Carmen Agricultural Zone", "lat": 7.3550, "lng": 125.7050},
    {"name": "Mabini Marine Protected Area", "lat": 7.2850, "lng": 125.8550},
    {"name": "Pantukan Mining Buffer", "lat": 7.1450, "lng": 125.8950},
    {"name": "Compostela Valley Basin", "lat": 7.6709, "lng": 126.0836},
    {"name": "Nabunturan Forest Edge", "lat": 7.6050, "lng": 125.9650},
    
    # --- Davao Oriental ---
    {"name": "Mati Pujada Bay", "lat": 6.9150, "lng": 126.2250},
    {"name": "Mati Sleeping Dinosaur Trail", "lat": 6.9523, "lng": 126.2235},
    {"name": "Banaybanay Rice Fields", "lat": 6.9350, "lng": 125.9950},
    {"name": "Lupon Coastal Area", "lat": 6.8950, "lng": 126.0150}
]

def load_species_from_csv():
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "species_data.csv")    
    try:
        with open(csv_path, mode='r', encoding='utf-8') as f:
            return list(csv.DictReader(f))
    except FileNotFoundError:
        print("❌ Error: species_data.csv not found!")
        sys.exit(1)

def seed():
    print("🌱 Initializing Database...")
    create_db_and_tables()

    with Session(engine) as session:
        # 1. Admin Creation
        existing_admin = session.exec(select(User).where(User.email == ADMIN["email"])).first()
        if not existing_admin:
            admin_user = User(
                name=ADMIN["name"], email=ADMIN["email"],
                password_hash=hash_password(ADMIN["password"]), role=ADMIN["role"]
            )
            session.add(admin_user)
            session.commit()
            session.refresh(admin_user)
            print(f"✅ Admin: {ADMIN['email']}")
        else:
            admin_user = existing_admin 

        # 2. Test Users
        test_user_objects = []
        for u in TEST_USERS:
            existing = session.exec(select(User).where(User.email == u["email"])).first()
            if not existing:
                user = User(name=u["name"], email=u["email"], 
                            password_hash=hash_password(u["password"]), role="user")
                session.add(user)
                session.commit()
                session.refresh(user)
                test_user_objects.append(user)
            else:
                test_user_objects.append(existing)
        print(f"✅ Users ready.")

        # 3. Species Loading
        species_data = load_species_from_csv()
        species_objects = []
        for sp_data in species_data:
            existing = session.exec(select(Species).where(Species.name == sp_data["name"])).first()
            if not existing:
                species = Species(**sp_data)
                session.add(species)
                session.commit()
                session.refresh(species)
                species_objects.append(species)
            else:
                species_objects.append(existing)
        
        species_map = {s.name: s for s in species_objects}
        print(f"✅ Species loaded.")

        # 4. Randomized Reports (The "Trends" Logic)
        print("\n🗺️  Generating yearly historical data (365-day spread)...")
        existing_reports = session.exec(select(Report)).first()
        
        if existing_reports:
            print("⚠️  Reports exist. Skipping seed. (TRUNCATE to refresh).")
        else:
            report_count = 0
            now = datetime.now()
            
            for img_name in DUMMY_IMAGES:
                matched_species = next((s for n, s in species_map.items() if n.lower() in img_name.lower()), None)
                if not matched_species: continue

                location = random.choice(DUMMY_LOCATIONS)
                user = test_user_objects[report_count % len(test_user_objects)]
                
                # Randomized spread: 1 day to 365 days ago
                days_ago = random.randint(1, 365)
                random_report_date = now - timedelta(days=days_ago, hours=random.randint(0,23))
                random_review_date = random_report_date + timedelta(hours=random.randint(12, 48))

                # Confidence Floor: 85%
                conf = round(random.uniform(0.85, 0.99), 2)

                report = Report(
                    user_id=user.id, image_path=f"uploads/{img_name}",
                    gps_lat=location["lat"], gps_lng=location["lng"],
                    location_name=location["name"], location_source="manual",
                    status="validated", admin_remarks="Historical trend record verified.",
                    reviewed_by=admin_user.id, 
                    submitted_at=random_report_date, reviewed_at=random_review_date
                )
                session.add(report)
                session.commit()
                session.refresh(report)

                detection = Detection(
                    report_id=report.id, species_id=matched_species.id,
                    species_name=matched_species.name, confidence_score=conf,
                    bbox_data="[50, 50, 300, 300]", yolo_label="IAS",
                    cnn_label=matched_species.name, detected_at=random_report_date
                )
                session.add(detection)
                
                # Attempt MCTS calculation
                try:
                    from app.services.mcts_service import compute_mcts
                    compute_mcts(report.id, session)
                except Exception: pass
                
                report_count += 1
                
            print(f"✅ Successfully seeded {report_count} randomized reports.")

        session.commit()
        print("\n🎉 pAIste Database Seeding Complete!")

if __name__ == "__main__":
    seed()