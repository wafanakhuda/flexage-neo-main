# FlexAGE API Reference

## Overview

The FlexAGE API is a RESTful API built with FastAPI that provides endpoints for managing assessments, submissions, and grading. All endpoints require authentication via JWT tokens unless otherwise specified.

## Base URL

- **Production**: `https://flexage-backend.vercel.app`
- **Local Development**: `http://localhost:8000`

## Authentication

### Headers
All authenticated requests must include:
```
Authorization: Bearer <jwt_token>
```

### Token Acquisition
Obtain tokens via the authentication endpoints described below.

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticate user with form data and return access token.

**Request Body** (Form Data):
```
username: string
password: string
```

**Response**:
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

#### POST `/api/auth/login/json`
Authenticate user with JSON payload and return access token.

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

#### GET `/api/auth/me`
Get current user information.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "user_id": "uuid",
  "username": "string",
  "email": "string",
  "full_name": "string",
  "role": "student|configurator|admin",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### POST `/api/auth/register`
Create a new user (configurator/admin only).

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Request Body**:
```json
{
  "username": "string",
  "email": "string",
  "full_name": "string",
  "password": "string",
  "role": "student|configurator|admin"
}
```

**Response**: User object

#### GET `/api/auth/users`
Get list of users (configurator/admin only).

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Query Parameters**:
- `skip`: integer (default: 0)
- `limit`: integer (default: 100)

**Response**: Array of user objects

#### POST `/api/auth/enroll`
Enroll a student in a FlexAGEComp (configurator/admin only).

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Request Body**:
```json
{
  "student_user_id": "uuid",
  "flex_age_comp_id": "uuid"
}
```

**Response**:
```json
{
  "message": "Student enrolled successfully"
}
```

#### DELETE `/api/auth/enroll`
Unenroll a student from a FlexAGEComp (configurator/admin only).

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Request Body**:
```json
{
  "student_user_id": "uuid",
  "flex_age_comp_id": "uuid"
}
```

**Response**:
```json
{
  "message": "Student unenrolled successfully"
}
```

---

### FlexAGEComp Management (Configurator)

#### POST `/api/configure/flexagecomps`
Create a new FlexAGEComp.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Request Body**:
```json
{
  "comp_name": "string",
  "general_instructions": "string"
}
```

**Response**: FlexAGEComp object with metadata

#### GET `/api/configure/flexagecomps`
Get list of FlexAGEComps.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Query Parameters**:
- `skip`: integer (default: 0)
- `limit`: integer (default: 100)

**Response**: Array of FlexAGEComp objects

#### GET `/api/configure/flexagecomps/{comp_id}`
Get specific FlexAGEComp by ID.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Response**: FlexAGEComp object

#### PUT `/api/configure/flexagecomps/{comp_id}`
Update FlexAGEComp.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Request Body**:
```json
{
  "comp_name": "string",
  "general_instructions": "string"
}
```

**Response**: Updated FlexAGEComp object

#### DELETE `/api/configure/flexagecomps/{comp_id}`
Delete FlexAGEComp.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Response**: Deleted FlexAGEComp object

#### GET `/api/configure/flexagecomps/{comp_id}/entries`
Get entries for a specific FlexAGEComp.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Query Parameters**:
- `skip`: integer (default: 0)
- `limit`: integer (default: 100)

**Response**: Array of Entry objects

#### GET `/api/configure/flexagecomps/{comp_id}/enrolled_students`
Get students enrolled in a FlexAGEComp.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Response**: Array of User objects

---

### Entry Management (Configurator)

#### POST `/api/configure/entries`
Create a new entry.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Request Body**:
```json
{
  "entry_title": "string",
  "instructions": "string",
  "rubric_definition": {
    "criteria": ["criterion1", "criterion2"],
    "levels": ["level1", "level2"],
    "cells": {
      "criterion1_level1": {
        "description": "string",
        "points": 0
      }
    }
  },
  "flex_age_comp_id": "uuid"
}
```

**Response**: Entry object with metadata

#### GET `/api/configure/entries`
Get list of entries.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Query Parameters**:
- `flex_age_comp_id`: uuid (optional)
- `skip`: integer (default: 0)
- `limit`: integer (default: 100)

**Response**: Array of Entry objects

#### GET `/api/configure/entries/{entry_id}`
Get specific entry by ID.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Response**: Entry object

#### PUT `/api/configure/entries/{entry_id}`
Update entry.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Request Body**:
```json
{
  "entry_title": "string",
  "instructions": "string",
  "rubric_definition": {}
}
```

**Response**: Updated Entry object

#### DELETE `/api/configure/entries/{entry_id}`
Delete entry.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Response**: Deleted Entry object

#### GET `/api/configure/entries/{entry_id}/submissions`
Get submissions for an entry with outcomes.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Response**: Array of Submission objects with outcomes and student names

#### GET `/api/configure/entries/{entry_id}/student_states`
Get student states for an entry.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Response**: Array of StudentEntryState objects with submissions

---

### Submission Management (Configurator)

#### GET `/api/configure/submissions`
Get list of submissions.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Query Parameters**:
- `entry_id`: uuid (optional)
- `student_user_id`: uuid (optional)
- `skip`: integer (default: 0)
- `limit`: integer (default: 100)

**Response**: Array of Submission objects

#### GET `/api/configure/submissions/{submission_id}`
Get specific submission with outcome.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Response**: Submission object with outcome

#### POST `/api/configure/submissions/{submission_id}/grade`
Trigger manual grading for a submission.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Response**: Outcome object

---

### Outcome Management (Configurator)

#### GET `/api/configure/outcomes/{outcome_id}`
Get specific outcome by ID.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Response**: Outcome object

#### PUT `/api/configure/outcomes/{outcome_id}`
Update outcome (manual override).

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `configurator` or `admin`

**Request Body**:
```json
{
  "outcome_data": {
    "overall_score": 85,
    "feedback": "string",
    "rubric_scores": {
      "criterion1": 4,
      "criterion2": 3
    },
    "confidence": 0.95
  },
  "is_llm_generated": false
}
```

**Response**: Updated Outcome object

---

### Student Endpoints

#### GET `/api/student/flexagecomps`
Get FlexAGEComps the current student is enrolled in.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `student`

**Query Parameters**:
- `skip`: integer (default: 0)
- `limit`: integer (default: 100)

**Response**: Array of FlexAGEComp objects

#### GET `/api/student/flexagecomps/{comp_id}/entries`
Get entries for a FlexAGEComp with student state.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `student`

**Response**: Array of Entry objects with student states and submissions

#### GET `/api/student/entries/{entry_id}`
Get entry details with student state.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `student`

**Response**: Entry object with student state and submission

#### POST `/api/student/entries/{entry_id}/submit`
Submit work for an entry.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `student`

**Request Body**:
```json
{
  "submission_title": "string",
  "content": "string"
}
```

**Response**: Submission object

#### GET `/api/student/submissions/{submission_id}`
Get submission details with outcome.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `student`

**Response**: Submission object with outcome

#### GET `/api/student/submissions`
Get all submissions by current student.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `student`

**Query Parameters**:
- `skip`: integer (default: 0)
- `limit`: integer (default: 100)

**Response**: Array of Submission objects

#### GET `/api/student/entries/{entry_id}/submissions`
Get all submissions for a specific entry by current student.

**Headers**: `Authorization: Bearer <token>`
**Required Role**: `student`

**Response**: Array of Submission objects with outcomes

---

## Data Models

### FlexAGEComp Object
```json
{
  "comp_id": "uuid",
  "comp_name": "string",
  "general_instructions": "string",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Entry Object
```json
{
  "entry_id": "uuid",
  "entry_title": "string",
  "instructions": "string",
  "rubric_definition": {
    "criteria": ["string"],
    "levels": ["string"],
    "cells": {}
  },
  "flex_age_comp_id": "uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Submission Object
```json
{
  "submission_id": "uuid",
  "submission_title": "string",
  "content": "string",
  "entry_id": "uuid",
  "student_user_id": "uuid",
  "submitted_at": "2024-01-01T00:00:00Z",
  "student_name": "string"
}
```

### Outcome Object
```json
{
  "outcome_id": "uuid",
  "submission_id": "uuid",
  "outcome_data": {
    "overall_score": 85,
    "feedback": "string",
    "rubric_scores": {},
    "confidence": 0.95
  },
  "is_llm_generated": true,
  "generated_at": "2024-01-01T00:00:00Z"
}
```

### StudentEntryState Object
```json
{
  "state_id": "uuid",
  "entry_id": "uuid",
  "student_user_id": "uuid",
  "status": "not_submitted|submitted_processing|outcome_available",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### User Object
```json
{
  "user_id": "uuid",
  "username": "string",
  "email": "string",
  "full_name": "string",
  "role": "student|configurator|admin",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Error Responses

### Standard Error Format
```json
{
  "detail": "Error message description"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

### Authentication Errors
- `401`: Invalid or expired token
- `403`: Insufficient permissions for role-based access

### Validation Errors
```json
{
  "detail": [
    {
      "loc": ["field_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Rate Limiting

Currently, no rate limiting is implemented. This may be added in future versions.

## Versioning

The API is currently unversioned. Future versions will use URL versioning (e.g., `/api/v1/`).

## CORS

CORS is configured to allow all origins in development. Production deployments should restrict origins to specific domains.
