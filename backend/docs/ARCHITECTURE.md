# EduBridge AI — Backend Architecture Specification

**Tagline:** Learning Without Communication Barriers  
**Version:** 1.2.0 (Complete Backend: Phases 1–10 Integrated)  
**Status:** Approved & Fully Tested (60 Automated Tests Passing)  

---

## 1. Architectural Overview

EduBridge AI is designed as a modular, asynchronous, cloud-native backend built using **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.0**, and **Pydantic v2**. It bridges the communication gap between individuals with hearing, visual, and speech impairments and modern educational systems.

```
+-----------------------------------------------------------------------------------+
|                           Future Frontend Clients                                 |
|               (Built via Google Stitch & Google AI Studio)                        |
+-----------------------------------------------------------------------------------+
                                         |
                        REST APIs & WebSockets (/api/v1, /ws)
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                              FastAPI Application                                  |
|                                                                                   |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  |   CORS Middleware   |  | Exception Handlers  |  |  Structured Log Redactor  |  |
|  +---------------------+  +---------------------+  +---------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                             API Sub-Routers                                 |  |
|  | /auth /users /accessibility /tutor /sign-language /avatar /speech /aac      |  |
|  | /visual /gamification /ws/v1/sign-language/stream                           |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
       |            |              |              |              |              |
       v            v              v              v              v              v
+-----------+ +-----------+ +------------+ +------------+ +------------+ +----------+
| Core Auth | | AI Tutor  | | ISL Sign   | | 3D Avatar  | | Speech/AAC | | Gamifi-  |
| & Profile | | Gemma 4   | | Recognizer | | SiGML (848)| | & OCR      | | cation   |
| (JWT/Bcr) | | Cloud Eng | | (MLP / MP) | | Three.js   | | Services   | | Engine   |
+-----------+ +-----------+ +------------+ +------------+ +------------+ +----------+
       |            |              |              |              |              |
       +------------+--------------+--------------+--------------+--------------+
                                         |
                                         v
                      +-------------------------------------+
                      |    PostgreSQL Database (Async)      |
                      | Users, Conversations, AAC, Quizzes, |
                      | Gamification XP, Streaks, Models    |
                      +-------------------------------------+
```

---

## 2. Component Design

### 2.1 Core Application Factory & Lifespan
- **`app/main.py`:** Initializes the FastAPI application using the `lifespan` protocol.
- **Startup:** Connects to PostgreSQL, checks pool connectivity, registers exception handlers, and configures CORS.
- **Shutdown:** Safely flushes transactions and disposes of the connection engine.

### 2.2 Security & Multi-Disability User Profile
- **Password Hashing:** Implemented with `passlib` and `bcrypt` work factor 12. Plaintext passwords are never stored.
- **Authentication:** Stateless signed JWT access tokens (60 min) with rotating refresh tokens (7 days).
- **Accessibility Profile:**
  - Multi-preference support: A user can flag any combination of **Hearing**, **Visual**, **Speech**, or **Other** requirements.
  - Granular parameters: `captions_enabled`, `sign_language_avatar_enabled`, `screen_reader_compatible`, `high_contrast`, `text_size`, `aac_communication_enabled`.

### 2.3 Gemma 4 AI Tutor Architecture (`app/services/ai/`)
- **`BaseAIProvider`:** Abstract provider interface for inference isolation.
- **`GemmaProvider`:** Concrete implementation of Google Generative Language API (`/v1beta/models/{model}:generateContent`) with `x-goog-api-key` authentication, timeouts, and structured error handling.
- **`MockGemmaProvider`:** Deterministic offline mock for CI/automated testing.
- **`PromptBuilder`:** Converts student accessibility flags into pedagogical system instructions and conversation context.
- **`ResponseParser`:** Cleans raw LLM markdown fences, validates JSON with Pydantic v2 schemas, and applies fallback extraction.
- **`ConversationManager`:** Persists message turns in PostgreSQL and strictly enforces user conversation isolation.
- **`QuizGenerator`:** Creates curriculum-aligned multi-question quizzes and evaluates submissions with gamification XP rewards.
- **`EducationalEngine`:** Tailors explanations across multiple teaching tasks (`educational_explanation`, `concept_simplification`, `step_by_step`, `summary`).

### 2.4 ML Model Registry & Assets
The backend unifies verified pre-trained models and assets from the 6 audited repositories:
1. `ml/model_registry/random_forest.joblib` (19.78 MB): 61-feature ISL static gesture classifier.
2. `ml/model_registry/mlp_model_1.p` (458 KB): Single-hand ISL alphabet classifier (C, I, L, O, U, V).
3. `ml/model_registry/mlp_model_2.p` (661 KB): Two-hand ISL alphabet classifier (A, B, D..Z).
4. `ml/model_registry/mlp_model_num.p` (467 KB): Digits 0–9 classifier.
5. `ml/model_registry/gesture_recognizer.task` (8.37 MB): MediaPipe gesture recognizer.
6. `ml/assets/sigml/`: 848 authentic Signing Gesture Markup Language (SiGML) XML files for 3D human avatar rendering.
7. `ml/assets/hamnosys_database.csv`: Hamburg Notation System dictionary.

---

## 3. Directory Layout

```
edubridge-ai-backend/
├── app/
│   ├── main.py              # Application factory, lifespan, CORS & root handlers
│   ├── api/                 # Versioned REST & WebSocket routers
│   │   ├── v1/              # auth, users, accessibility, tutor, sign_language, avatar, speech, aac, visual, gamification
│   │   └── websocket/       # /ws/v1/sign-language/stream/{session_id} real-time streaming
│   ├── core/                # Config, security, exceptions, logging
│   ├── database/            # Async engine, sessionmaker, Base model
│   ├── models/              # User, Profile, Accessibility, Conversation, Gamification, Sign, AAC
│   ├── schemas/             # Pydantic v2 validation models
│   └── services/            # Domain services:
│       ├── ai/              # Gemma 4 Cloud Engine, PromptBuilder, Quizzes
│       ├── sign_language/   # MediaPipe HandLandmarker, 42/84-dim normalizer, MLPClassifier
│       ├── avatar/          # SiGML XML parser, HamNoSys extraction, Three.js bone tracks
│       ├── speech/          # TTS synthesis & STT transcription interfaces
│       ├── aac/             # AAC phrase cards & custom user board storage
│       ├── visual/          # OCR document text extraction & diagram description
│       └── gamification/    # XP transactions, levels, achievements, streaks, leaderboard
├── ml/
│   ├── model_registry/      # Pre-trained verified weights (.p, .task, .joblib)
│   ├── assets/              # 848 SiGML XML animation files & HamNoSys dictionary
│   └── architectures/       # Neural network architecture definitions
├── alembic/                 # Database migrations
├── tests/                   # Automated pytest suite (60 test cases)
├── docs/                    # Architecture, audit, API, models & deployment documentation
├── requirements.txt         # Pinned production dependencies
├── Dockerfile               # Multi-stage production container
├── docker-compose.yml       # Orchestrated PostgreSQL + FastAPI environment
└── .env.example             # Configuration template
```
