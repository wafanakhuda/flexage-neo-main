# FlexAGE Backend

FlexAGE (Flexible Assessment Grading Engine) is a component designed for streamlined text-based assessment submission and immediate, AI-driven feedback in online learning environments.

## Project Structure

```
backend/
├── alembic/              # Database migration scripts
├── app/                  # Main application package
│   ├── api/              # API routes
│   │   └── endpoints/    # Endpoint modules
│   ├── core/             # Core functionality
│   ├── crud/             # CRUD operations
│   ├── db/               # Database setup and sessions
│   ├── models/           # SQLAlchemy models
│   └── schemas/          # Pydantic schemas
└── main.py               # Application entry point
```

## Setup Instructions

1. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables by creating a `.env` file with your database connection string:
   ```
   DATABASE_URL=postgresql://user:password@host:port/dbname
   ```

4. Create database tables:
   ```
   python -m app.db.init_db
   ```

## Running the Application

Run the FastAPI server with:

```
uvicorn app.main:app --reload
```

Access the API documentation at: http://localhost:8000/docs

## API Endpoints

### FlexAGEComps
- `GET /api/flexagecomps/` - List all FlexAGEComps
- `POST /api/flexagecomps/` - Create a new FlexAGEComp
- `GET /api/flexagecomps/{comp_id}` - Get a specific FlexAGEComp
- `PUT /api/flexagecomps/{comp_id}` - Update a FlexAGEComp
- `DELETE /api/flexagecomps/{comp_id}` - Delete a FlexAGEComp
- `GET /api/flexagecomps/{comp_id}/entries` - Get entries for a FlexAGEComp

### Entries
- `GET /api/entries/` - List all entries
- `POST /api/entries/` - Create a new entry
- `GET /api/entries/{entry_id}` - Get a specific entry
- `PUT /api/entries/{entry_id}` - Update an entry
- `DELETE /api/entries/{entry_id}` - Delete an entry
- `GET /api/entries/{entry_id}/submissions` - Get submissions for an entry
- `GET /api/entries/{entry_id}/student_states` - Get student states for an entry

### Student Operations
- `GET /api/student/{student_user_id}/flexagecomps` - Get FlexAGEComps available to a student
- `GET /api/student/{student_user_id}/flexagecomps/{comp_id}/entries` - Get entries for a student in a FlexAGEComp
- `POST /api/student/{student_user_id}/entries/{entry_id}/submit` - Submit an entry as a student
- `GET /api/student/{student_user_id}/submissions` - Get submissions made by a student

### Submissions
- `GET /api/submissions/` - List submissions
- `GET /api/submissions/{submission_id}` - Get a specific submission with its outcome
- `POST /api/submissions/{submission_id}/generate_outcome` - Generate an outcome for a submission

### Outcomes
- `GET /api/outcomes/{outcome_id}` - Get a specific outcome
