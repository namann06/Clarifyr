# Clarifyr - Production Deployment Guide

This guide provides step-by-step instructions to deploy the Clarifyr platform (Spring Boot backend + React frontend) to production using **Supabase** for database hosting, **Render** (or Railway/Koyeb) for application hosting, and **Cron-Job.org** to keep the free backend awake 24/7.

---

## Architecture Overview

```mermaid
graph TD
    User([Browser/User]) -->|HTTPS| Frontend[React Frontend - Vercel/Render Static]
    User -->|WSS / API| Backend[Spring Boot Backend - Render/Railway Web Service]
    Backend -->|JDBC| Database[(PostgreSQL Database - Supabase)]
    Cron[Cron-Job.org] -->|Ping every 10 min| Backend
```

---

## 1. Local Testing with Docker Compose

Before deploying to the cloud, you can test the production-ready containerized builds locally:

1. Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
2. In the root project directory, run:
   ```bash
   docker compose up --build
   ```
3. Once the build finishes:
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:8080/api
4. To stop the containers:
   ```bash
   docker compose down -v
   ```

---

## 2. Production Database Setup (Supabase)

Supabase offers a generous free-tier managed PostgreSQL database.

1. Sign up/log in to [Supabase](https://supabase.com/).
2. Create a new project named `Clarifyr`. Specify a strong database password and note it down.
3. Once the project is provisioned, go to **Project Settings** (gear icon) -> **Database**.
4. Scroll down to **Connection string** and select **URI**. Copy the string.
   - It will look like this: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres`
   - For Spring Boot, we will format it as a JDBC URL:
     `jdbc:postgresql://db.xxxxxx.supabase.co:5432/postgres?sslmode=require`

---

## 3. Production Backend Setup (Render)

Render can deploy our Spring Boot application automatically using the `Dockerfile` in the root repository.

1. Sign up/log in to [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing the Clarifyr code.
4. Set the following details:
   - **Name**: `clarifyr-backend`
   - **Environment**: `Docker`
   - **Branch**: `main` (or whichever branch you push to)
   - **Instance Type**: `Free`
5. Click **Advanced** and add the following **Environment Variables**:

| Key | Value | Description |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db.xxxxxx.supabase.co:5432/postgres?sslmode=require` | Complete JDBC Connection URL from Supabase |
| `SPRING_DATASOURCE_DRIVER_CLASS_NAME` | `org.postgresql.Driver` | Driver class name for PostgreSQL |
| `DB_USERNAME` | `postgres` | Default Supabase master user |
| `DB_PASSWORD` | `your_actual_supabase_password` | The database password you chose |
| `JWT_SECRET` | `generate_a_long_random_signing_key_here_32_chars` | Signing key for JWT tokens |
| `APP_CORS_ALLOWED_ORIGINS` | `https://your-frontend-url.vercel.app` | URL of your deployed frontend (update after frontend deployment) |

6. Click **Deploy Web Service**.
7. Note down your backend URL (e.g., `https://clarifyr-backend.onrender.com`).

---

## 4. Keeping Render Backend Awake (No-Sleep Workaround)

Render's free tier automatically sleeps after 15 minutes of inactivity. When a recruiter clicks your CV link, this sleep causes a 50+ second "cold start" delay, making the site feel broken.

We solve this using **Cron-Job.org**:

1. Create a free account at [Cron-Job.org](https://cron-job.org/).
2. Go to **Cron Jobs** -> **Create Cron Job**.
3. Configure the cron job:
   - **Title**: Keep Clarifyr Backend Awake
   - **Address**: `https://your-backend-url.onrender.com/api/test` (This is a public healthcheck endpoint we set up)
   - **Schedule**: Every 12 minutes (`*/12 * * * *`)
4. Click **Create**.
5. This sends a lightweight request to the backend every 12 minutes, keeping the container active and ready to respond instantly to recruiters.

---

## 5. Production Frontend Setup (Vercel / Render Static)

For frontends, Vercel is highly recommended because it offers premium static asset delivery and is completely free with no sleep cycles.

### Deploying to Vercel

1. Create a free account at [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project** and import your GitHub repository.
3. Configure the project:
   - **Framework Preset**: `Vite` (Vercel should auto-detect this)
   - **Root Directory**: `clarifyr_frontend`
4. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL`: `https://your-backend-url.onrender.com/api`
   - `VITE_WS_URL`: `https://your-backend-url.onrender.com/ws`
   *(Important: Vite compiles environment variables at build-time, so these must be defined before clicking deploy!)*
5. Click **Deploy**.
6. Vercel will build your app and provide you with a public URL (e.g., `https://clarifyr-frontend.vercel.app`).
7. **Crucial Final Step**: Copy this frontend URL, go back to Render (your backend service dashboard), edit the `APP_CORS_ALLOWED_ORIGINS` environment variable to match your frontend URL, and save. Render will automatically redeploy the backend with the new security permissions.

---

## Database Seeding (Pre-populated Tutors)

When the application boots up on the Supabase database for the first time:
- It automatically seeds the **demo student** (`student@clarifyr.com`) and **demo tutor** (`tutor@clarifyr.com`) with the password `password123`.
- It seeds **3 realistic tutor profiles** representing Mathematics, Physics, UI/UX Design, Figma, and Web Development.
- This ensures the app is immediately interactive for anyone browsing your portfolio.
