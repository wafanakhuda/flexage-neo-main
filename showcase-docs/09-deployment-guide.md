
# Deployment Guide

This document provides instructions for deploying the FlexAGE application.

## 1. Backend Deployment

The backend is a FastAPI application configured for deployment on [Vercel](https://vercel.com/).

### Vercel Configuration

The deployment configuration is defined in `backend/vercel.json`. This file configures Vercel to use the Python runtime and routes all requests to the FastAPI application.

**Steps to Deploy:**

1.  **Install Vercel CLI**: Make sure you have the Vercel CLI installed (`npm install -g vercel`).
2.  **Login to Vercel**: `vercel login`
3.  **Deploy**: Navigate to the `backend` directory and run `vercel`.

    ```bash
    cd backend
    vercel
    ```

4.  **Environment Variables**: You will need to configure the following environment variables in the Vercel project settings:
    -   `DATABASE_URL`: The connection string for your PostgreSQL database.
    -   `SECRET_KEY`: A secret key for signing JWTs.
    -   `ACCESS_TOKEN_EXPIRE_MINUTES`: The expiration time for access tokens.
    -   `OPENAI_API_KEY`: Your API key for OpenAI if you are using the LLM evaluation features.

## 2. Frontend Deployment

The frontend is a Next.js application and can be easily deployed to Vercel or any other platform that supports Node.js applications.

### Vercel (Recommended)

1.  **Link Project**: Connect your Git repository to a new Vercel project.
2.  **Framework Preset**: Vercel will automatically detect that it is a Next.js application and configure the build settings.
3.  **Environment Variables**: You will need to set the following environment variable:
    -   `NEXT_PUBLIC_API_BASE_URL`: The URL of your deployed backend API (e.g., `https://your-backend-url.vercel.app`).

### Other Platforms

-   **Build**: Run `npm run build` in the `frontend` directory.
-   **Start**: Run `npm run start` to start the production server.
-   You will need to configure your hosting provider to run these commands and set the appropriate environment variables.
