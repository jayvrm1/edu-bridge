# EduBridge AI: Six-Repository Audit & Architecture Unification Report

**Date:** October 30, 2026  
**Platform:** EduBridge AI — *Learning Without Communication Barriers*  
**Scope:** Backend & AI/ML Infrastructure Audit of 6 Local Repositories  
**Target Architecture:** FastAPI + PostgreSQL + PyTorch / scikit-learn + MediaPipe + Gemma 4 Cloud Inference + 3D Avatar SiGML Metadata + WebSockets  

---

## 1. Executive Summary

A comprehensive code-level audit was conducted across all six repositories downloaded in `C:\Users\hp\Downloads`:
1. `ISLBridge-Project-main`
2. `SilentTalk-master`
3. `Indian-Sign-Language-Recognition-master`
4. `ishaara-isl-main`
5. `streamlit-version`
6. `bidirectional-indian-sign-language-main`

### Key Findings:
- **Trained Weight Availability:**
  - `Indian-Sign-Language-Recognition-master`: Verified pre-trained model **`random_forest.joblib` (19.78 MB)** for Indian Sign Language static alphabet gestures.
  - `streamlit-version` & `bidirectional-indian-sign-language-main`: Verified pre-trained MLP models **`mlp_model_1.p`** (single-hand ISL alphabets: C, I, L, O, U, V), **`mlp_model_2.p`** (two-hand ISL alphabets: A, B, D, E, F, G, H, J, K, M, N, P, Q, R, S, T, W, X, Y, Z), and **`mlp_model_num.p`** (ISL digits: 0-9).
  - `SilentTalk-master`: Verified **`gesture_recognizer.task` (8.37 MB)** binary MediaPipe model, plus an invaluable repository of **850+ `.sigml` (Signing Gesture Markup Language) files** and **HamNoSys database (`Database2.csv`)** for 3D human avatar animation!
  - `ISLBridge-Project-main` & `ishaara-isl-main`: Contain neural network definitions (PyTorch LSTM and BiLSTM with temporal attention), landmark extraction pipelines, and FastAPI/WebSocket streaming blueprints, but **no bundled weight checkpoints** (`.pt`/`.pth` files were excluded from their source releases).
- **Redundancy:** `bidirectional-indian-sign-language-main` contains a direct copy of `streamlit-version` along with an unbundled web game version.
- **Integration Viability:** Every useful component can be unified into a cohesive, high-performance, asynchronous **FastAPI** backend with real model inference, strict confidence thresholds, and SiGML 3D avatar animation pipelines.

---

## 2. Detailed Per-Repository Audit

---

### Repository 1: `ISLBridge-Project-main`

| Attribute | Details |
|---|---|
| **Primary Purpose** | Real-time desktop ISL gesture translator with GUI (Tkinter) and multi-language TTS |
| **Frameworks / Libraries** | Python, PyTorch (`torch>=2.0.0`), MediaPipe Holistic (`>=0.10.8`), OpenCV, scikit-learn, gTTS, pyttsx3 |
| **Model Architecture** | `GestureRecognitionLSTM`: 2-to-3 layer PyTorch LSTM with dropout (input_dim=166, hidden_dim=128/256, sequence_length=30 frames, num_classes=36) |
| **Input Features** | 166-dim feature vector per frame: Pose landmarks (33*2 = 66 x,y normalized) + Left Hand (21*2 = 42) + Right Hand (21*2 = 42) + Face key points (16 coordinates) over 30 temporal frames |
| **Trained Weights Present?** | **No** (Checkpoint `.pth` files omitted from git commit; expects user training) |
| **Dataset Present?** | **No** (Data directories `data/raw/Frames_Word_Level` are empty placeholders) |
| **Recognition Scope** | Designed for 36 classes (alphabets A-Z, digits 0-9) at word/gesture level |
| **Translation Engine** | Simple string lookup & Google Translate wrapper (`googletrans==4.0.0rc1`) |
| **FastAPI Suitability** | High for architectural reuse: `GestureRecognitionLSTM` class, PyTorch model definition, temporal landmark buffer logic, and GPU memory cleanup utilities (`gpu_utils.py`) |
| **Licence** | MIT License (Copyright 2025 Krish Nagpal) — fully permissive for commercial and educational backend integration |
| **Limitations** | Tkinter desktop GUI must be discarded; missing pre-trained `.pth` checkpoint; relies on `googletrans` which is unstable in production |

---

### Repository 2: `SilentTalk-master`

| Attribute | Details |
|---|---|
| **Primary Purpose** | Full-stack accessibility platform for ISL communication, bilingual translation, HamNoSys mapping, and avatar generation |
| **Frameworks / Libraries** | Python, Django 5.2, Django Channels, TensorFlow 2.15 / Keras, MediaPipe 0.10.9, NLTK, Stanford Parser |
| **Submodules** | 1. `AudioToSignLanguageConverter`: English-to-ISL grammar parsing and SiGML avatar generation<br>2. `silenttalk`: Django web platform with WebSocket channels<br>3. `ActionDetectionforSignLanguage`: Keras LSTM for dynamic actions (`hello`, `thanks`, `iloveyou`)<br>4. `Sign-Language-to-Text-and-Speech`: ASL finger-spelling prototype |
| **Model Architecture & Weights** | - `gesture_recognizer.task` (**8.37 MB MediaPipe task binary present!**)<br>- FaceMesh geometric emotion classification (`happy`, `sad`, `urgent`, `surprised`, `neutral`) using facial landmark ratios<br>- Action detection `action.h5` referenced |
| **3D Avatar & Animation Assets** | **850+ `.sigml` XML files present!** (`0.sigml` through `Z.sigml`, words like `hello.sigml`, `thankyou.sigml`, `family.sigml`, etc.) + `Database2.csv` (HamNoSys notation dictionary) |
| **Translation Engine** | Rule-based syntactic English-to-ISL grammar tree conversion (reordering SVO English to SOV/topic-comment ISL structure) |
| **FastAPI Suitability** | **Extremely high:** The SiGML dataset, HamNoSys parsing, emotion detection, and ISL grammar rules can be directly integrated into FastAPI services |
| **Licence** | Mixed MIT License (Tanmay Jivnani) / Open academic |
| **Limitations** | Monolithic Django setup with Channels needs refactoring into FastAPI async endpoints; heavy Stanford Parser Java dependency can be modernized using lightweight regex/NLP rules |

---

### Repository 3: `Indian-Sign-Language-Recognition-master`

| Attribute | Details |
|---|---|
| **Primary Purpose** | Real-time Indian Sign Language alphabet and character recognition using MediaPipe Hands and Random Forest |
| **Frameworks / Libraries** | Python, scikit-learn, joblib, MediaPipe Hands, OpenCV, `wordninja`, `pyspellchecker` |
| **Model Architecture** | `RandomForestClassifier` trained on normalized keypoints and inter-landmark distances |
| **Input Features** | **61 features:**<br>- 40 features: Relative landmark coordinates `(x_i - x_0, y_i - y_0)` for landmarks 1..20<br>- 20 features: Euclidean distances `dist(lm_0, lm_i)` for landmarks 1..20<br>- 1 feature: Handedness flag (1 for Right, 0 for Left) |
| **Trained Weights Present?** | **YES! `random_forest.joblib` (19.78 MB)** verified and present in directory |
| **Dataset Present?** | Dataset script provided (`dataPrepare.py`), generated dataset CSVs omitted |
| **Recognition Scope** | Static ISL alphabet gestures |
| **FastAPI Suitability** | **Immediate:** Model is fully pre-trained, self-contained, and can be loaded directly into a FastAPI recognition pipeline |
| **Licence** | Open academic / MIT-style |
| **Limitations** | Single-frame static gesture recognition; lacks temporal sequence awareness for continuous dynamic signs; requires scikit-learn runtime |

---

### Repository 4: `ishaara-isl-main`

| Attribute | Details |
|---|---|
| **Primary Purpose** | Research-grade real-time ISL recognition, continuous CTC segmentation, and bidirectional seq2seq translation |
| **Frameworks / Libraries** | Python 3.11+, PyTorch 2.1+, FastAPI 0.104+, Uvicorn, MediaPipe Holistic, HuggingFace Transformers (T5) |
| **Model Architecture** | - `BiLSTMEncoder` with `TemporalAttention` pooling (input_dim=285, num_classes=263 for INCLUDE dataset)<br>- Continuous CTC model architecture for continuous sign segmentation<br>- T5 seq2seq model for ISL gloss-to-English and English-to-gloss translation |
| **Input Features** | 285 features (95 key landmarks: Pose 33 + Left Hand 21 + Right Hand 21 + Face contour 20 * 3 coords [x, y, z]) normalized to shoulder midpoint and scaled by shoulder width |
| **Trained Weights Present?** | **No** (Model checkpoint paths in `api/main.py` default to randomly initialized weights if checkpoints are absent) |
| **Dataset Present?** | Scripts for downloading INCLUDE dataset (`download_include.py`) |
| **FastAPI Suitability** | **Native match:** Already structured as a FastAPI app with WebSocket streaming, landmark normalizers, and async buffer handling |
| **Licence** | Open-source research |
| **Limitations** | Checkpoint weights were not bundled; T5 translation requires HuggingFace model download or fallback to rule-based engine |

---

### Repository 5: `streamlit-version`

| Attribute | Details |
|---|---|
| **Primary Purpose** | Interactive Streamlit web app for ISL alphabet recognition, number recognition, speech-to-sign, and text-to-sign |
| **Frameworks / Libraries** | Python, Streamlit, scikit-learn (MLPClassifier), MediaPipe Hands, OpenCV, gTTS, pyttsx3, speech_recognition |
| **Model Architecture** | Multi-Layer Perceptrons (MLP):<br>- `mlp_model_1.p` (42 features: single-hand alphabets C, I, L, O, U, V)<br>- `mlp_model_2.p` (84 features: two-hand alphabets A, B, D, E, F, G, H, J, K, M, N, P, Q, R, S, T, W, X, Y, Z)<br>- `mlp_model_num.p` (42 features: digits 0-9) |
| **Trained Weights Present?** | **YES! All three models are verified present** in `assets/models/` (`mlp_model_1.p`, `mlp_model_2.p`, `mlp_model_num.p`) |
| **Dataset Present?** | Sample reference images for alphabet and digits included in `assets/images/` |
| **Recognition Scope** | Full ISL Alphabet (A-Z, 26 letters) and Digits (0-9, 10 digits) |
| **FastAPI Suitability** | **High:** The landmark normalization logic and pickled MLP models can be loaded directly into a FastAPI service |
| **Licence** | Open academic |
| **Limitations** | Streamlit UI code and hardcoded local Windows file paths (`D:\Mini_project\...`) must be refactored into modular backend services |

---

### Repository 6: `bidirectional-indian-sign-language-main`

| Attribute | Details |
|---|---|
| **Primary Purpose** | Complete project suite encompassing the Streamlit prototype, research documentation, and a Flask-based "Web Game" version |
| **Frameworks / Libraries** | Python, Flask, Flask-CORS, MediaPipe Hands, scikit-learn, OpenCV |
| **Submodules** | 1. `streamlit-version`: Duplicate of Repo 5<br>2. `web_game_version`: Flask REST API (`server.py`) with base64 webcam frame endpoint `/predict`<br>3. `frontend/images/quiz_images`: **Full visual dataset of 36 high-resolution ISL reference images (0-9 and A-Z)** |
| **Model Architecture & Weights** | Same MLP models (`mlp_model_1.p`, `mlp_model_2.p`, `mlp_model_num.p`) duplicated in `web_game_version/models/` |
| **FastAPI Suitability** | The `/predict` endpoint logic in `server.py` provides the exact pattern for receiving base64 webcam frames and returning predicted characters with confidence |
| **Licence** | Open academic (Research paper by Mohammed Mudasir Ahmed, Ozair Ali, Syed Ibrahim Ali) |
| **Limitations** | Flask is synchronous; must be ported to FastAPI async routes and WebSockets |

---

## 3. Comparison Table

| Repository | Framework | Recognition Model | Weights | Dataset / Assets | Translation | Reusable Components | Licence | Integration Decision |
|---|---|---|---|---|---|---|---|---|
| **ISLBridge-Project-main** | PyTorch, MediaPipe Holistic | `GestureRecognitionLSTM` (30 frames, 166 dims) | Missing | None | GoogleTrans | LSTM model definition, 166-dim feature extractor, GPU utils | MIT | **Adopt model architecture & feature extraction** |
| **SilentTalk-master** | Django, TensorFlow, MediaPipe | MediaPipe Gesture Recognizer + Emotion FaceMesh | `gesture_recognizer.task` (8.37 MB) | **850+ `.sigml` XML files**, `Database2.csv` | English-to-ISL syntax reordering | 850+ SiGML animation registry, HamNoSys mappings, emotion detection | MIT / Open | **Adopt SiGML avatar assets, emotion detection & grammar rules** |
| **Indian-Sign-Language-Recognition-master** | scikit-learn, MediaPipe Hands | `RandomForestClassifier` (61 features) | **`random_forest.joblib` (19.78 MB)** | None | Simple spellchecker | 61-feature extraction pipeline, pre-trained Random Forest model | Open | **Adopt as primary static alphabet recognition engine** |
| **ishaara-isl-main** | FastAPI, PyTorch, Transformers | `BiLSTMEncoder` with Temporal Attention (285 dims) | Missing | None | T5 seq2seq (Gloss ↔ Text) | FastAPI WebSocket architecture, shoulder-normalized landmarks, T5 pipeline | Open | **Adopt WebSocket streaming pattern & normalization schema** |
| **streamlit-version** | Streamlit, scikit-learn | Multi-model MLP (1-hand 42 dim, 2-hand 84 dim) | **3 MLP models (`.p`)** | Reference images (A, E, 2) | Text-to-Sign image lookup | Multi-hand routing logic (42 vs 84 dims), pre-trained digit model | Open | **Adopt digit & multi-hand classification logic** |
| **bidirectional-indian-sign-language-main** | Flask, scikit-learn | Same MLP models as Repo 5 | Duplicate of Repo 5 | **36 Quiz/Lesson reference images (0-9, A-Z)** | Word-to-sign mapper | Base64 image decode pipeline, gamification quiz assets | Open | **Adopt base64 API handler & gamification quiz data** |

---

## 4. Key Architectural Discoveries & Integration Decisions

### 1. Duplicate & Overlapping Models
- `streamlit-version` and `bidirectional-indian-sign-language-main` contain identical MLP models (`mlp_model_1.p`, `mlp_model_2.p`, `mlp_model_num.p`).
- `Indian-Sign-Language-Recognition-master` provides a Random Forest model with superior feature engineering (40 relative coords + 20 distances + handedness).
- **Decision:** Build a **Unified Ensemble Sign Recognizer**:
  - Primary ISL Static Sign Engine: `RandomForestClassifier` (`random_forest.joblib`) + Multi-Hand MLP (`mlp_model_1.p`, `mlp_model_2.p`, `mlp_model_num.p`).
  - Gesture & Dynamic Action Engine: MediaPipe Gesture Recognizer (`gesture_recognizer.task`) + BiLSTM Temporal Attention architecture.

### 2. Dependency Conflicts & Modernization
- **Python Version:** Repositories vary from Python 3.8 (`ISLBridge`) to 3.11 (`ishaara`) and 3.12 (current host system).
  - Modern FastAPI, PyTorch 2.x, and MediaPipe run smoothly on Python 3.11/3.12.
- **Stanford Parser in SilentTalk:** Relies on Java 8 jar files and deprecated NLTK StanfordParser wrappers.
  - **Decision:** Replace Java dependency with a pure Python syntactic rule transformer for English → ISL grammar (SOV structure, wh-word post-position, question particles).
- **Hardcoded Absolute Paths:** `streamlit-version` contains hardcoded paths (`D:\Mini_project\...`).
  - **Decision:** All paths will be dynamically resolved using `pathlib.Path` relative to backend project directories or configured via environment variables.

### 3. Missing Weights & Datasets Handled Transparently
- Neither `ISLBridge` nor `ishaara` include pre-trained weights for their 263-class continuous BiLSTM/LSTM models.
- **Decision:** The backend will:
  1. Use the **verified pre-trained models** (`random_forest.joblib`, `mlp_model_*.p`, and `gesture_recognizer.task`) for guaranteed out-of-the-box recognition of all 26 alphabets, 10 digits, and standard gestures.
  2. Implement the **PyTorch BiLSTM / LSTM model architectures** in modular registries ready to load checkpoints or run inference when weights are supplied.
  3. Clearly document this separation in `docs/MODEL_SETUP.md`.

### 4. 3D Avatar & SiGML Asset Foundation
- `SilentTalk-master` provides **850+ `.sigml` XML files** containing authentic HamNoSys gestures (manual hand shapes, finger orientations, palm directions, wrist movements, body locations, and non-manual facial/mouth expressions).
- **Decision:** We will create a dedicated `avatar/` service that parses these `.sigml` files into structured JSON schemas (bone rotations, morph targets, timing, and bone animations) that Three.js and React Three Fiber frontends can directly consume!

---

## 5. Unified EduBridge AI Backend Architecture

```
edubridge-ai-backend/
├── app/
│   ├── main.py                     # FastAPI application factory & lifespan
│   ├── core/
│   │   ├── config.py               # Pydantic v2 settings (.env loader)
│   │   ├── security.py             # JWT, Argon2/bcrypt password hashing
│   │   ├── exceptions.py           # Custom API exceptions & handlers
│   │   └── logging.py              # Structured logging & audit logger
│   ├── database/
│   │   ├── session.py              # Async PostgreSQL engine & sessionmaker
│   │   ├── base.py                 # Declarative Base
│   │   └── migrations/             # Alembic migration environment
│   ├── models/                     # SQLAlchemy 2.0 ORM Models
│   │   ├── user.py                 # Users, Profiles, AccessibilityPrefs
│   │   ├── conversation.py         # Sessions, Conversations, Messages
│   │   ├── curriculum.py           # Lessons, Modules, Quizzes, QuizAttempts
│   │   ├── gamification.py         # XP, Levels, Badges, Streaks
│   │   └── sign_vocabulary.py      # SignLexicon, SiGMLAssets, ModelsMeta
│   ├── schemas/                    # Pydantic v2 validation & response schemas
│   │   ├── auth.py                 # Register, Login, Token, PasswordReset
│   │   ├── user.py                 # Profile, AccessibilityPrefs
│   │   ├── ai_tutor.py             # Unified prompt, TutorRequest/Response
│   │   ├── recognition.py          # FramePayload, LandmarkData, Prediction
│   │   ├── translation.py          # SignToText, TextToSign, Gloss
│   │   ├── avatar.py               # SiGMLAnimationSequence, BoneKeyframes
│   │   ├── speech_aac.py           # STT/TTS payload, AACBoard, AACCard
│   │   ├── visual.py               # OCRRequest, DiagramExplanation
│   │   └── gamification.py         # Progress, XPTransaction, Badge
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py             # /api/v1/auth (register, login, me)
│   │   │   ├── users.py            # /api/v1/users (profile, accessibility)
│   │   │   ├── tutor.py            # /api/v1/tutor (Gemma 4 AI tutor)
│   │   │   ├── recognition.py      # /api/v1/recognition (POST frame/landmarks)
│   │   │   ├── translation.py      # /api/v1/translation (sign ↔ text)
│   │   │   ├── avatar.py           # /api/v1/avatar (SiGML metadata & keyframes)
│   │   │   ├── speech.py           # /api/v1/speech (STT & TTS)
│   │   │   ├── aac.py              # /api/v1/aac (boards, shortcuts, phrases)
│   │   │   ├── visual.py           # /api/v1/visual (OCR & image reasoning)
│   │   │   └── gamification.py     # /api/v1/gamification (XP, streaks, quizzes)
│   │   └── websocket/
│   │       ├── recognition_ws.py   # /ws/v1/recognize (real-time stream)
│   │       └── tutor_ws.py         # /ws/v1/tutor (live streaming tutor)
│   ├── services/
│   │   ├── ai/
│   │   │   ├── gemma_client.py     # Provider-agnostic Gemma 4 cloud client
│   │   │   └── prompt_builder.py   # Structured prompt generator
│   │   ├── sign_language/
│   │   │   ├── recognizer.py       # Multi-model inference orchestrator
│   │   │   ├── landmark_extractor.py # MediaPipe Hands & Holistic pipeline
│   │   │   ├── normalizer.py       # Spatial & temporal normalizers
│   │   │   └── grammar_rules.py    # English ↔ ISL grammar transformer
│   │   ├── avatar/
│   │   │   ├── sigml_parser.py     # XML SiGML to JSON keyframe parser
│   │   │   └── registry.py         # 850+ animation index & lookup
│   │   ├── speech/                 # STT and TTS services
│   │   ├── aac/                    # AAC boards and vocabulary services
│   │   ├── visual/                 # OCR and vision analysis
│   │   └── gamification/           # XP, streaks, level calculator
├── ml/
│   ├── model_registry/             # Houses verified model weights
│   │   ├── random_forest.joblib    # 19.78 MB ISL Alphabet model
│   │   ├── mlp_model_1.p           # 1-hand ISL alphabet model
│   │   ├── mlp_model_2.p           # 2-hand ISL alphabet model
│   │   ├── mlp_model_num.p         # ISL digit model (0-9)
│   │   └── gesture_recognizer.task # 8.37 MB MediaPipe task model
│   ├── architectures/
│   │   ├── isl_bilstm.py           # PyTorch BiLSTM with Temporal Attention
│   │   └── isl_lstm.py             # PyTorch LSTM
│   └── assets/
│       └── sigml/                  # 850+ SiGML animation files
├── tests/                          # Automated pytest suite
├── docs/                           # Architecture, audit, API & deployment docs
├── scripts/                        # Database seeding & setup scripts
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 6. Implementation Roadmap

- **Phase 1 (Complete):** Deep audit of all 6 downloaded repositories, inventory of weights and assets.
- **Phase 2 (Current):** Publish `docs/REPOSITORY_AUDIT.md`, finalize unified architecture, and obtain confirmation.
- **Phase 3:** Create `edubridge-ai-backend` skeleton, SQLAlchemy database models, Alembic migrations, and PostgreSQL connection.
- **Phase 4:** Implement authentication (JWT, Argon2/bcrypt), user profiles, and multi-disability accessibility preferences.
- **Phase 5:** Implement cloud-provider agnostic Gemma 4 AI tutor client with structured prompt generation and contextual tutoring.
- **Phase 6:** Integrate MediaPipe landmark extractors and load verified pre-trained ISL recognition models with confidence evaluation and REST/WebSocket endpoints.
- **Phase 7:** Implement bidirectional sign translation (Sign-to-Text, Text-to-Sign) and SiGML-based 3D avatar animation metadata APIs.
- **Phase 8:** Implement Speech (STT/TTS), AAC communication board data, and Visual Accessibility (OCR & diagram explanation).
- **Phase 9:** Implement gamification engine (XP, levels, daily streaks, quizzes, badges) with PostgreSQL persistence.
- **Phase 10:** Automated testing suite, security hardening, Docker & docker-compose configuration, and comprehensive documentation (`README.md`, `API_DOCUMENTATION.md`, `MODEL_SETUP.md`, `DEPLOYMENT.md`, `KNOWN_LIMITATIONS.md`).

