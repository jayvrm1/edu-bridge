# EduBridge AI — Comprehensive API Documentation

**Platform:** EduBridge AI — *Learning Without Communication Barriers*  
**Base URL:** `http://localhost:8000`  
**API Version:** `v1` (`/api/v1`)  
**Interactive Docs (Swagger UI):** `http://localhost:8000/docs`  
**Alternative Docs (ReDoc):** `http://localhost:8000/redoc`  
**OpenAPI Specification:** [docs/openapi.json](file:///C:/Users/hp/Downloads/edubridge-ai-backend/docs/openapi.json)  

---

## 1. Authentication & Security Model

All protected endpoints require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <access_token>
```

- **Algorithm:** HMAC-SHA256 (`HS256`)
- **Access Token Expiration:** 60 minutes
- **Refresh Token Expiration:** 7 days with mandatory rotation
- **Password Hashing:** Bcrypt work factor 12
- **Brute Force Protection:** Sliding-window rate limiter per client IP
- **Account Enumeration Defense:** Generic safe responses on password resets

---

## 2. Authentication Endpoints

### 2.1 Register New Account
- **Method:** `POST`
- **Path:** `/api/v1/auth/register`
- **Rate Limit:** 20 requests/minute
- **Request Body:**
```json
{
  "username": "aarav_learner",
  "email": "aarav@edubridge.org",
  "password": "StrongPassword123!",
  "full_name": "Aarav Sharma",
  "preferred_language": "hi",
  "hearing_impairment": true,
  "visual_impairment": false,
  "speech_impairment": true,
  "other_requirements": false
}
```
- **Response (201 Created):** Returns user profile with initial accessibility preferences.

### 2.2 Login & Receive Tokens
- **Method:** `POST`
- **Path:** `/api/v1/auth/login`
- **Request Body:**
```json
{
  "username_or_email": "aarav_learner",
  "password": "StrongPassword123!"
}
```
- **Response (200 OK):** Dual-token JSON with `access_token` and `refresh_token`.

### 2.3 Refresh Token Rotation
- **Method:** `POST`
- **Path:** `/api/v1/auth/refresh`
- **Request Body:** `{"refresh_token": "..."}`
- **Response (200 OK):** Returns fresh access and refresh token pair; old token is revoked.

### 2.4 Logout
- **Method:** `POST`
- **Path:** `/api/v1/auth/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{"refresh_token": "..."}`

---

## 3. User Profile & Accessibility Preferences

### 3.1 Get Profile & Preferences
- **Method:** `GET`
- **Path:** `/api/v1/users/me`
- **Headers:** `Authorization: Bearer <token>`

### 3.2 Update Profile
- **Method:** `PATCH`
- **Path:** `/api/v1/users/me`

### 3.3 Get / Replace / Update Accessibility Preferences
- **GET / PUT / PATCH:** `/api/v1/accessibility/preferences`
- Configurable for Hearing, Visual, Speech, and custom options (captions, avatar, text size, high contrast, AAC).

---

## 4. Gemma 4 AI Tutor Endpoints

### 4.1 Interactive Educational Chat
- **Method:** `POST`
- **Path:** `/api/v1/tutor/chat`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "input_type": "text",
  "message": "Explain how photosynthesis works in plants",
  "task": "educational_explanation",
  "conversation_id": null,
  "response_preferences": {
    "detail_level": "simple",
    "include_examples": true
  }
}
```
- **Response (200 OK):**
```json
{
  "conversation_id": 1,
  "message_id": 2,
  "response": {
    "text": "Photosynthesis is the process by which green plants transform sunlight into energy...",
    "summary": "Plants convert sunlight, water, and carbon dioxide into glucose and oxygen.",
    "key_points": [
      "Requires sunlight, chlorophyll, water, and carbon dioxide",
      "Occurs in chloroplasts",
      "Produces oxygen as a byproduct"
    ],
    "examples": [
      "A tree absorbing morning sunlight to produce glucose"
    ],
    "suggested_questions": [
      "What is the role of chlorophyll?",
      "How do plants breathe at night?"
    ],
    "content_type": "educational_explanation"
  },
  "output_preferences": {
    "text_enabled": true,
    "audio_enabled": false,
    "sign_avatar_enabled": true
  },
  "model": {
    "provider": "google_ai_studio",
    "model": "gemma-4-26b-a4b-it"
  }
}
```

### 4.2 Concept Explanation
- **Method:** `POST`
- **Path:** `/api/v1/tutor/explain`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{"message": "Newton's First Law of Motion"}`

### 4.3 Topic Summary
- **Method:** `POST`
- **Path:** `/api/v1/tutor/summarize`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{"message": "Cell division and mitosis stages"}`

### 4.4 Generate Educational Quiz
- **Method:** `POST`
- **Path:** `/api/v1/tutor/generate-quiz`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "topic": "Solar System",
  "difficulty": "beginner",
  "number_of_questions": 3,
  "question_type": "multiple_choice"
}
```
- **Response (200 OK):**
```json
{
  "topic": "Solar System",
  "difficulty": "beginner",
  "questions": [
    {
      "question_id": 1,
      "question_text": "Which planet is closest to the Sun?",
      "question_type": "multiple_choice",
      "options": ["A) Earth", "B) Mercury", "C) Venus", "D) Mars"],
      "correct_answer": "B) Mercury",
      "explanation": "Mercury orbits closest to the Sun at an average distance of ~58 million km.",
      "hint": "It is also the smallest planet in our solar system."
    }
  ],
  "model_info": {
    "provider": "google_ai_studio",
    "model": "gemma-4-26b-a4b-it"
  }
}
```

### 4.5 Evaluate Quiz Answers
- **Method:** `POST`
- **Path:** `/api/v1/tutor/quiz/evaluate`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "topic": "Solar System",
  "questions": [...],
  "answers": {
    "1": "B) Mercury"
  }
}
```
- **Response (200 OK):**
```json
{
  "topic": "Solar System",
  "score": 1,
  "total_questions": 1,
  "percentage": 100.0,
  "passed": true,
  "feedback": [
    {
      "question_id": 1,
      "is_correct": true,
      "user_answer": "B) Mercury",
      "correct_answer": "B) Mercury",
      "explanation": "Mercury orbits closest to the Sun."
    }
  ],
  "xp_earned": 65
}
```

### 4.6 Conversation Management
- `GET /api/v1/tutor/conversations`: List user's conversation threads.
- `GET /api/v1/tutor/conversations/{id}`: Fetch message history for a specific conversation.
- `DELETE /api/v1/tutor/conversations/{id}`: Delete conversation thread.
*(Strictly enforces user isolation — accessing another user's conversation returns HTTP 403).*

---

## 5. System Health Check

- **Method:** `GET`
- **Path:** `/health` and `/api/v1/health`
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0",
  "timestamp": "2026-10-30T12:00:00.000Z",
  "database": {
    "status": "healthy",
    "details": {
      "connected": true,
      "engine": "async"
    }
  },
  "services": {
    "api": "operational",
    "gemma_tutor": "configured",
    "sign_recognition": "ready"
  }
}
```

---

## 6. Indian Sign Language (ISL) Recognition Endpoints

### 6.1 List Recognition Models
- **Method:** `GET`
- **Path:** `/api/v1/sign-language/models`
- **Response (200 OK):**
```json
{
  "total_models": 5,
  "loaded_models": 4,
  "models": [
    {
      "name": "ISL single-hand alphabets (C, I, L, O, U, V)",
      "filename": "mlp_model_1.p",
      "model_type": "MLPClassifier",
      "input_dimension": 42,
      "supported_classes": ["C", "I", "L", "O", "U", "V"],
      "is_loaded": true,
      "status": "Loaded and operational"
    },
    {
      "name": "ISL two-hand alphabets (A, B, D, E...)",
      "filename": "mlp_model_2.p",
      "model_type": "MLPClassifier",
      "input_dimension": 84,
      "supported_classes": ["A", "B", "D", "E", "F", "G", "H", "J", "K", "M", "N", "P", "Q", "R", "S", "T", "W", "X", "Y", "Z"],
      "is_loaded": true,
      "status": "Loaded and operational"
    },
    {
      "name": "ISL digits (0-9)",
      "filename": "mlp_model_num.p",
      "model_type": "MLPClassifier",
      "input_dimension": 42,
      "supported_classes": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      "is_loaded": true,
      "status": "Loaded and operational"
    }
  ]
}
```

### 6.2 Sign Language Vocabulary & Instructions
- **Method:** `GET`
- **Path:** `/api/v1/sign-language/vocabulary`
- **Response (200 OK):** Full list of supported letters, numbers, and gestures with physical instructions.

### 6.3 Create Recognition Session
- **Method:** `POST`
- **Path:** `/api/v1/sign-language/sessions`
- **Request Body:**
```json
{
  "mode": "auto",
  "language": "ISL"
}
```
- **Response (201 Created):** Returns `session_id`.

### 6.4 Stream / Process Video Frames
- **Method:** `POST`
- **Path:** `/api/v1/sign-language/sessions/{session_id}/frames`
- **Request Body:**
```json
{
  "frame_base64": "data:image/jpeg;base64,..."
}
```
- **Response (200 OK):** Returns predicted label, confidence, `is_confirmed`, and current accumulated text.

### 6.5 Process Direct Landmarks (Low-Bandwidth Mobile)
- **Method:** `POST`
- **Path:** `/api/v1/sign-language/sessions/{session_id}/landmarks`
- **Request Body:**
```json
{
  "hands": [
    [{"x": 0.5, "y": 0.5, "z": 0.0}, ...]
  ]
}
```

### 6.6 Text Manipulation
- **Method:** `POST`
- **Path:** `/api/v1/sign-language/confirm`
- **Request Body:** `{"session_id": "...", "action": "append|space|backspace|clear", "character": "A"}`

### 6.7 Pipe Sign Language Directly to Gemma 4 AI Tutor
- **Method:** `POST`
- **Path:** `/api/v1/sign-language/ask-tutor`
- **Request Body:**
```json
{
  "session_id": "isl_a1b2c3d4e5f6"
}
```
- **Response (200 OK):**
```json
{
  "session_id": "isl_a1b2c3d4e5f6",
  "recognized_text": "WHAT IS GRAVITY",
  "tutor_reply": "Gravity is the fundamental force that attracts objects toward each other...",
  "conversation_id": "conv_789",
  "mode": "explain"
}
```

---

## 7. Real-Time Streaming WebSocket

- **Protocol:** `WebSocket`
- **Endpoint:** `/ws/v1/sign-language/stream/{session_id}`
- **Capabilities:**
  - Client sends JSON frames (`{"type": "frame", "frame_base64": "..."}`) or landmarks (`{"type": "landmarks", "hands": [...]}`).
  - Server immediately streams predictions and confirmed text buffer.
  - Interactive editing commands (`{"type": "command", "action": "space|backspace|clear"}`).

---

## 8. 3D Avatar & Sign Translation Endpoints

### 8.1 List Supported Avatar Languages
- **Method:** `GET`
- **Path:** `/api/v1/avatar/languages`
- **Response (200 OK):** Lists supported sign dialects and total available animations.

### 8.2 List Avatar Vocabulary
- **Method:** `GET`
- **Path:** `/api/v1/avatar/vocabulary?limit=500`
- **Response (200 OK):** Available sign glosses and associated `.sigml` files.

### 8.3 Text-to-Sign Translation
- **Method:** `POST`
- **Path:** `/api/v1/avatar/translate`
- **Request Body:**
```json
{
  "text": "HELLO 1 2 3",
  "target_language": "ISL",
  "fingerspell_unknown": true
}
```
- **Response (200 OK):** Ordered list of sign tokens, durations, and fingerspelling indicators.

### 8.4 Get Sign Animation (Three.js Bone Keyframes)
- **Method:** `GET`
- **Path:** `/api/v1/avatar/animation/{sign_id}`
- **Response (200 OK):** Parsed HamNoSys notation, viseme mouth picture, and Three.js humanoid bone quaternion tracks.

### 8.5 Compile Sequence of Signs
- **Method:** `POST`
- **Path:** `/api/v1/avatar/sequence`
- **Request Body:** `{"glosses": ["HELLO", "WORLD"], "fps": 30}`
- **Response (200 OK):** Full compiled Three.js keyframe sequence ready for WebGL playback.

---

## 9. Speech & Voice Accessibility Endpoints

### 9.1 Speech Provider Status
- **Method:** `GET`
- **Path:** `/api/v1/speech/status`
- **Response (200 OK):** TTS/STT readiness, active providers, and supported voices.

### 9.2 Text-to-Speech (TTS) Synthesis
- **Method:** `POST`
- **Path:** `/api/v1/speech/synthesize`
- **Request Body:** `{"text": "Welcome to EduBridge AI", "language": "en", "speed": 1.0}`
- **Response (200 OK):** Base64 audio payload and playback duration.

### 9.3 Speech-to-Text (STT) Transcription
- **Method:** `POST`
- **Path:** `/api/v1/speech/transcribe`
- **Request Body:** `{"audio_base64": "...", "language": "en"}`
- **Response (200 OK):** Transcribed textual string and confidence score.

### 9.4 Voice Query directly to Gemma 4 AI Tutor
- **Method:** `POST`
- **Path:** `/api/v1/speech/ask-tutor`
- **Request Body / Query:** Audio base64 string.
- **Response (200 OK):** Returns transcribed text, Gemma 4 tutor explanation, and spoken audio response.

---

## 10. Augmentative & Alternative Communication (AAC) Endpoints

### 10.1 Get Full Categorized AAC Board
- **Method:** `GET`
- **Path:** `/api/v1/aac/phrases`
- **Response (200 OK):** Universal and user-custom phrase cards grouped by category.

### 10.2 Create Custom AAC Phrase Card
- **Method:** `POST`
- **Path:** `/api/v1/aac/phrases`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "category": "classroom",
  "label": "My Question",
  "text": "Could you please explain this concept with an example?",
  "icon": "help-circle",
  "quick_shortcut": "q"
}
```
- **Response (201 Created):** Created phrase record.

### 10.3 Update Custom AAC Phrase Card
- **Method:** `PATCH`
- **Path:** `/api/v1/aac/phrases/{phrase_id}`

### 10.4 Delete Custom AAC Phrase Card
- **Method:** `DELETE`
- **Path:** `/api/v1/aac/phrases/{phrase_id}`

### 10.5 Pipe AAC Card directly to Gemma 4 AI Tutor
- **Method:** `POST`
- **Path:** `/api/v1/aac/ask-tutor?phrase_text=Please+explain+photosynthesis`
- **Response (200 OK):** Pedagogical tutor response tailored for non-speaking students.

---

## 11. Visual Accessibility & OCR Endpoints

### 11.1 Document OCR Text Extraction
- **Method:** `POST`
- **Path:** `/api/v1/visual/ocr`
- **Request Body:** `{"image_base64": "...", "language": "eng"}`
- **Response (200 OK):** Extracted text, line-by-line bounding coordinates, and confidence.

### 11.2 Accessible Image & Diagram Description
- **Method:** `POST`
- **Path:** `/api/v1/visual/describe`
- **Request Body:** `{"image_base64": "...", "target_modality": "screen_reader"}`
- **Response (200 OK):** Descriptive text explanation, visual components, and academic takeaway.

---

## 12. Gamification & Learning Progress Endpoints

### 12.1 Get Gamification Profile
- **Method:** `GET`
- **Path:** `/api/v1/gamification/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** XP, Level, Progress %, Streaks, and unlocked badges.

### 12.2 List Achievements & Badges
- **Method:** `GET`
- **Path:** `/api/v1/gamification/achievements`
- **Response (200 OK):** Catalog of achievements with unlock status and timestamps.

### 12.3 Learning Streaks
- **Method:** `GET`
- **Path:** `/api/v1/gamification/streaks`
- **Response (200 OK):** Current consecutive days streak and record streak.

### 12.4 Live Leaderboard
- **Method:** `GET`
- **Path:** `/api/v1/gamification/leaderboard?limit=20`
- **Response (200 OK):** Real database rankings of learners sorted by XP.

### 12.5 Daily Learning Quests
- **Method:** `GET`
- **Path:** `/api/v1/gamification/challenges`
- **Method:** `POST`
- **Path:** `/api/v1/gamification/challenges/{challenge_id}/complete`

### 12.6 Submit Quiz & Award XP
- **Method:** `POST`
- **Path:** `/api/v1/gamification/quiz/submit`
- **Request Body:** `{"lesson_id": 1, "score": 5, "max_score": 5}`
- **Response (200 OK):** XP earned, updated level, and any newly unlocked badges.


