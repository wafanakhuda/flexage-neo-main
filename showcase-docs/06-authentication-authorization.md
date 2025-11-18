# Authentication and Authorization

This document describes the authentication and authorization mechanisms used in the FlexAGE application.

## 1. Authentication

Authentication is handled using JSON Web Tokens (JWT). When a user successfully logs in, the backend generates a JWT access token that must be included in the `Authorization` header of subsequent requests as a Bearer token.

### 1.1. Token Generation

- **Endpoint**: `POST /api/auth/login` or `POST /api/auth/login/json`
- The user provides their credentials (username and password).
- The backend verifies the credentials against the database.
- Upon successful verification, a JWT is created using the `create_access_token` function.
- The token contains a `sub` (subject) claim with the `user_id` and an `exp` (expiration) claim.
- The token is signed using the `SECRET_KEY` defined in the application's configuration.

### 1.2. Token Usage

- The client application stores the received access token.
- For all protected API endpoints, the token must be sent in the `Authorization` header:
  ```
  Authorization: Bearer <your_jwt_token>
  ```

## 2. Authorization

Authorization is managed through a role-based access control (RBAC) system. User roles determine which API endpoints a user can access.

### 2.1. User Roles

There are two primary user roles defined in the system:

- **`STUDENT`**: Represents a student user. Students can view their enrolled courses, submit entries, and view their own grades and feedback.
- **`CONFIGURATOR`**: Represents an administrative or instructor user. Configurators can create and manage users, FlexAGEComps, entries, and view all submissions and outcomes.
- **`ADMIN`**:Similar to the conigurator user, they have additional permission to add/remove users.

### 2.2. Access Control Implementation

Access control is implemented using FastAPI's dependency injection system.

- **`get_current_active_user`**: This dependency ensures that a valid JWT is present and corresponds to an active user in the database. It is used for any endpoint that requires a logged-in user.
- **`get_current_configurator`**: This dependency builds on `get_current_active_user` and further checks if the user has the `CONFIGURATOR` role. It protects endpoints that should only be accessible to administrators.
- **`get_current_student`**: This dependency checks if the authenticated user has the `STUDENT` role. It is used to protect student-specific endpoints.

### 2.3. Endpoint Protection Summary

- **Public Endpoints**: `POST /api/auth/login`, `POST /api/auth/login/json`.
- **Configurator-Only Endpoints**: All endpoints under `/api/configure/*`, plus user management endpoints like `POST /api/auth/register` and `GET /api/auth/users`.
- **Student-Only Endpoints**: All endpoints under `/api/student/*`.
- **General Authenticated Endpoints**: `GET /api/auth/me`.
