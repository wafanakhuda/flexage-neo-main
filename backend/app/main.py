from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router
from app.core.config import settings

from app.db.init_db import init_db

app = FastAPI()

@app.on_event("startup")
def on_startup():
    init_db()
    
# Create FastAPI app
app = FastAPI(
    title="FlexAGE API",
    description="API for FlexAGE - Flexible Assessment Grading Engine",
    version="0.1.0",
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=7200,
)

# Include API router
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to FlexAGE API",
        "documentation": "/docs",
    }
