from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import create_db_and_tables
from app.api.routes import auth, reports, identify, admin, dashboard, map, species
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title="pAIste API",
    description="Invasive Alien Species Detection & Reporting System for Davao Region",
    version="1.0.0"
)

if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

origins = [
    "https://pAIste-frontend.onrender.com", 
    "http://localhost:5173", 
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(auth.router,      prefix="/auth",      tags=["Auth"])
app.include_router(identify.router,  prefix="/identify",  tags=["Identify"])
app.include_router(reports.router,   prefix="/reports",   tags=["Reports"])
app.include_router(admin.router,     prefix="/admin",     tags=["Admin"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(map.router,       prefix="/map",       tags=["Map"])
app.include_router(species.router,   prefix="/species",   tags=["Species"])

@app.get("/")
def root():
    return {"message": "Welcome to pAIste API"}
app = app
