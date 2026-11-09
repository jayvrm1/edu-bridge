# EduBridge AI — Backend Deployment Guide

---

## 1. System Requirements

- **OS:** Windows 10/11, Ubuntu 22.04 LTS, or macOS
- **Python:** 3.11 or 3.12 (64-bit)
- **Database:** PostgreSQL 15+ (or SQLite for local development/testing)
- **Memory:** Minimum 4 GB RAM (8 GB+ recommended for running ML models)

---

## 2. Local Development Setup (Windows PowerShell)

### Step 1: Open PowerShell and Navigate to the Backend Directory
```powershell
cd C:\Users\hp\Downloads\edubridge-ai-backend
```

### Step 2: Create and Activate Virtual Environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Step 3: Install Pinned Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy the template `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Ensure your database connection string and Gemma 4 keys are configured in `.env`.

### Step 5: Run Database Migrations
```powershell
alembic upgrade head
```

### Step 6: Start the Development Server
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API is now accessible at `http://localhost:8000`.  
Interactive documentation is available at `http://localhost:8000/docs`.

---

## 3. Running Automated Tests

Run the full 60-test suite using pytest:
```powershell
pytest -v
```

---

## 4. Production Deployment with Docker

The repository includes a ready-to-use production `Dockerfile` and `docker-compose.yml` configured for multi-container orchestration with PostgreSQL 16.

### Start the Stack:
```powershell
docker compose up --build -d
```

### View Live Logs:
```powershell
docker compose logs -f backend
```

### Run Migrations inside Container:
```powershell
docker compose exec backend alembic upgrade head
```

### Stop the Stack:
```powershell
docker compose down
```

