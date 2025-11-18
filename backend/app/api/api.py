from fastapi import APIRouter

from app.api.endpoints import flexagecomps, entries, submissions, outcomes, student, auth

api_router = APIRouter()

# Include all the endpoint routers
api_router.include_router(auth.router)
api_router.include_router(flexagecomps.router)
api_router.include_router(entries.router)
api_router.include_router(submissions.router)
api_router.include_router(outcomes.router)
api_router.include_router(student.router)
