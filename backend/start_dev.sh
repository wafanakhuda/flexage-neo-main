#!/usr/bin/env bash

# Exit script on error
set -e

# Print commands before execution
set -x

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database (creates tables if they don't exist)
python -m app.db.init_db

# Run the application with hot-reloading
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
