# Development Guide

This document provides instructions for setting up the development environment for the FlexAGE project.

---

## 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Python](https://www.python.org/) (v3.9 or later)
- [Poetry](https://python-poetry.org/) for Python package management
- [PostgreSQL](https://www.postgresql.org/) database

---

## 2. Backend Setup

1. **Navigate to Backend Directory**:

   ```bash
   cd backend
   ```
2. **Install Dependencies**:

   Use Poetry to install the Python dependencies from `requirements.txt`.

   ```bash
   poetry install
   ```
3. **Database Setup**:

   - Make sure your PostgreSQL server is running.
   - Create a new database for the project.
   - Create a `.env` file in the `backend` directory and add the following environment variables:

     ```
     DATABASE_URL=postgresql://user:password@host:port/database_name
     SECRET_KEY=your_super_secret_key
     ACCESS_TOKEN_EXPIRE_MINUTES=30
     OPENAI_API_KEY=your_openai_api_key
     ```
4. **Run Database Migrations**:

   Alembic is used for database migrations. To apply all migrations, run:

   ```bash
   poetry run alembic upgrade head
   ```
5. **Run the Development Server**:

   The `start_dev.sh` script runs the application using Uvicorn with live reloading.

   ```bash
   ./start_dev.sh
   ```

   The backend API will be available at `http://localhost:8000`.

---

## 3. Frontend Setup

1. **Navigate to Frontend Directory**:

   ```bash
   cd frontend
   ```
2. **Install Dependencies**:

   Use npm to install the Node.js dependencies.

   ```bash
   npm install
   ```
3. **Environment Variables**:

   Create a `.env.local` file in the `frontend` directory and add the following:

   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```
4. **Run the Development Server**:

   ```bash
   npm run dev
   ```
   The frontend application will be available at `http://localhost:3000`.
