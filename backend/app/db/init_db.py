#!/usr/bin/env python3

# Initialize the database with tables and initial data for FlexAGE

import os
import sys

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.database import engine, SessionLocal
from app.models.models import Base, FlexAGEComp, Entry, User, UserRoleEnum
from app.core.security import get_password_hash

def init_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create default admin user if no users exist
        existing_users = db.query(User).first()
        if not existing_users:
            print("Creating default admin user...")
            admin_user = User(
                username="admin",
                email="admin@flexage.local",
                full_name="FlexAGE Administrator",
                role=UserRoleEnum.ADMIN,
                hashed_password=get_password_hash("admin1234123412341234"),
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("Created admin user with username: admin, password: admin123")
        
        # Check if we have any FlexAGEComps already
        existing_comps = db.query(FlexAGEComp).first()
        
        # If no data, create initial seed data
        if not existing_comps:
            print("Creating initial seed data...")
            
            # Get the admin user for creator relationship
            admin_user = db.query(User).filter(User.role == UserRoleEnum.ADMIN).first()
            
            # Create a sample FlexAGEComp
            sample_comp = FlexAGEComp(
                comp_name="Weekly Reflections",
                general_instructions="Submit your weekly reflections on the assigned readings and lectures.",
                created_by_user_id=admin_user.user_id if admin_user else None
            )
            db.add(sample_comp)
            db.commit()
            db.refresh(sample_comp)
            
            # Create sample entries
            sample_entries = [
                Entry(
                    flex_age_comp_id=sample_comp.comp_id,
                    entry_title="Week 1: Introduction to Critical Thinking",
                    instructions="Reflect on the key concepts from this week's readings about critical thinking. What insights resonated with you the most?",
                    rubric_definition={},
                    created_by_user_id=admin_user.user_id if admin_user else None
                ),
                Entry(
                    flex_age_comp_id=sample_comp.comp_id,
                    entry_title="Week 2: Analytical Frameworks",
                    instructions="Discuss how you might apply one of the analytical frameworks from this week's lecture to a real-world problem.",
                    rubric_definition={},
                    created_by_user_id=admin_user.user_id if admin_user else None
                )
            ]
            
            db.add_all(sample_entries)
            db.commit()
            
            print("Initial seed data created successfully!")
        else:
            print("Database already contains data.")
            
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing FlexAGE database...")
    init_db()
    print("Database initialization complete.")
