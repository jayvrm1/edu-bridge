# EduBridge AI — Backend & AI/ML Infrastructure

> **Tagline:** Learning Without Communication Barriers  
> **Architecture:** FastAPI • PostgreSQL • SQLAlchemy 2.0 • Alembic • PyTorch / Scikit-Learn • MediaPipe • Gemma 4 Cloud AI  

---

## 📖 1. Project Overview

**EduBridge AI** is an inclusive, multimodal educational backend platform engineered to eliminate communication barriers in learning. It caters specifically to learners with **hearing, visual, speech, and physical impairments** through:

- **Indian Sign Language (ISL) Recognition:** Real-time webcam sign-to-text and gesture evaluation.
- **3D Animated Human Avatar Support:** SiGML (Signing Gesture Markup Language) animation pipelines and bone keyframe generation.
- **Gemma 4 Cloud AI Tutor:** Adaptive, pedagogical explanations tailored to the learner's specific accessibility profile.
- **Multimodal Accessibility:** Augmented and Alternative Communication (AAC) cards, Speech-to-Text / Text-to-Speech, and OCR image reasoning.
- **Gamification Engine:** XP, streaks, levels, and interactive quiz tracking stored in PostgreSQL.

---

## 🤖 2. Gemma 4 AI Tutor Integration

EduBridge AI features an integrated, provider-agnostic educational reasoning engine powered by **Gemma 4**:
- **Supported Models:** `gemma-4-26b-a4b-it` (default high-efficiency MoE), `gemma-4-31b-it` (frontier reasoning), `gemma-4-e4b-it` (edge compact).
- **Supported Providers:** Google AI Studio (`google_ai_studio`), Google Cloud Vertex AI (`vertex_ai`), OpenAI-compatible gateways (`openai_compatible`), and offline test mock (`mock`).
- **Pedagogical Features:**
  - Concept explanation & intuitive simplification
  - Step-by-step problem breakdowns and real-world examples
  - Multi-question interactive quiz generation and automated evaluation
  - Gamified XP rewarding on quiz completions
  - Conversation turn tracking and persistence in PostgreSQL with strict user isolation

---

## 🏗️ 3. Technology Stack

| Layer | Technologies |
|---|---|
| **API Framework** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, Pydantic Settings |
| **Database & ORM** | PostgreSQL (async via `asyncpg`), SQLAlchemy 2.0, Alembic migrations |
| **Security** | Bcrypt password hashing, Stateless JWT Bearer tokens, Token Rotation |
| **AI Reasoning** | Gemma 4 Cloud Inference (Google AI Studio / Vertex AI) |
| **Sign Language ML** | Scikit-learn Random Forest (19.78 MB), Multi-model MLPs, MediaPipe Hands & Holistic |
| **Avatar Assets** | 848 authentic SiGML XML animation models & HamNoSys dictionary |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX, Coverage (60 automated tests) |

---

## 📁 4. Folder Structure

```
edubridge-ai-backend/
├── app/
│   ├── main.py              # Application factory, lifespan, CORS, error handling
│   ├── api/                 # Versioned REST endpoints and WebSocket handlers
│   │   ├── v1/              # Routers (auth, users, accessibility, tutor, sign_language, avatar, speech, aac, visual, gamification)
│   │   └── websocket/       # Real-time WebSocket streaming (recognition_ws)
│   ├── core/                # Configuration (.env), Security (JWT/Bcrypt), Logging
│   ├── database/            # Async SQLAlchemy engine, session maker, Base
│   ├── models/              # User, Profile, Conversation, Gamification, Sign, AAC
│   ├── schemas/             # Pydantic v2 validation models
│   └── services/            # Domain services
│       ├── ai/              # Gemma 4 Cloud Provider, PromptBuilder, QuizGenerator
│       ├── sign_language/   # MediaPipe landmark extraction, normalization, MLP inference, debouncing, sessions
│       ├── avatar/          # SiGML XML parser, HamNoSys extraction, Three.js bone tracks
│       ├── speech/          # TTS synthesis & STT transcription interfaces
│       ├── aac/             # AAC phrase cards & custom user board storage
│       ├── visual/          # OCR document text extraction & diagram description
│       └── gamification/    # XP transactions, levels, achievements, streaks, leaderboard
├── ml/
│   ├── model_registry/      # Houses verified trained weights (.joblib, .p, .task)
│   ├── assets/              # 848 SiGML XML files & HamNoSys dictionary
│   └── architectures/       # Neural network architecture definitions
├── alembic/                 # Database migration environments
├── tests/                   # Automated pytest suite (60 test cases)
├── docs/                    # Architecture, audit, API & deployment documentation
├── Dockerfile               # Multi-stage production container
├── docker-compose.yml       # Orchestrated PostgreSQL + FastAPI environment
├── requirements.txt         # Pinned production dependencies
└── .env.example             # Configuration template
```

---

## 🚀 5. Quick Start (Windows PowerShell)

### Step 1: Open PowerShell and Navigate to the Directory
```powershell
cd C:\Users\hp\Downloads\edubridge-ai-backend
```

### Step 2: Set Up Virtual Environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Step 3: Install Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
```powershell
Copy-Item .env.example .env
```
To enable live Gemma 4 inference, configure:
```env
GEMMA_PROVIDER=google_ai_studio
GEMMA_API_KEY=your_actual_google_ai_studio_api_key
GEMMA_MODEL=gemma-4-26b-a4b-it
```

### Step 5: Run Database Migrations
```powershell
alembic upgrade head
```

### Step 6: Start the Backend Server
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🧪 6. Running Automated Tests

Run the full 60-test suite:
```powershell
pytest -v
```

---

## 📑 7. Documentation Index

- [docs/ISL_RECOGNITION.md](file:///C:/Users/hp/Downloads/edubridge-ai-backend/docs/ISL_RECOGNITION.md): Real-time webcam Indian Sign Language recognition architecture, normalization formulas, and debouncing.
- [docs/GEMMA4_PROVIDER_RESEARCH.md](file:///C:/Users/hp/Downloads/edubridge-ai-backend/docs/GEMMA4_PROVIDER_RESEARCH.md): Verified Gemma 4 cloud inference providers, endpoints, and model variants.
- [docs/MODEL_SETUP.md](file:///C:/Users/hp/Downloads/edubridge-ai-backend/docs/MODEL_SETUP.md): Model placement, weights verification, and asset catalog guide.
- [docs/KNOWN_LIMITATIONS.md](file:///C:/Users/hp/Downloads/edubridge-ai-backend/docs/KNOWN_LIMITATIONS.md): Transparent disclosure of model boundaries, weights availability, and fallbacks.
- [docs/ARCHITECTURE.md](file:///C:/Users/hp/Downloads/edubridge-ai-backend/docs/ARCHITECTURE.md): Complete backend architecture and data flow.
- [docs/REPOSITORY_AUDIT.md](file:///C:/Users/hp/Downloads/edubridge-ai-backend/docs/REPOSITORY_AUDIT.md): Comprehensive audit of the 6 local repositories.
- [docs/API_DOCUMENTATION.md](file:///C:/Users/hp/Downloads/edubridge-ai-backend/docs/API_DOCUMENTATION.md): API contract, error responses, and endpoints.
- [docs/DEPLOYMENT.md](file:///C:/Users/hp/Downloads/edubridge-ai-backend/docs/DEPLOYMENT.md): Deployment, Docker, and PostgreSQL setup.
- [docs/openapi.json](file:///C:/Users/hp/Downloads/edubridge-ai-backend/docs/openapi.json): Full OpenAPI 3.1 specification for Stitch/AI Studio frontend integration.
