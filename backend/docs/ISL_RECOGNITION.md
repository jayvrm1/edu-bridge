# EduBridge AI: Real-Time Indian Sign Language (ISL) Recognition Pipeline

## 1. Overview & Architectural Principles

EduBridge AI is built to remove communication barriers for Deaf, Hard of Hearing, and non-speaking students. The sign language recognition subsystem enables learners to express questions, complete academic exercises, and interact with the Gemma 4 Cloud AI Tutor directly using Indian Sign Language (ISL).

```
                      [ Client Webcam / Mobile Device ]
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            │ Base64 Image Frame                                │ Normalized Landmarks Array
            ▼                                                   ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│ MediaPipe Landmark Extractor  │               │   Mobile / Edge Preprocessor  │
│ (21 3D Landmarks / Hand)      │               │   (Bandwidth-Saving Route)    │
└───────────────┬───────────────┘               └───────────────┬───────────────┘
                │                                               │
                └───────────────────────┬───────────────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │     Feature Normalizer        │
                        │ (x_i - min(x), y_i - min(y))  │
                        └───────────────┬───────────────┘
                                        │
                         1 Hand (42)    │    2 Hands (84)
                   ┌────────────────────┴────────────────────┐
                   ▼                                         ▼
    ┌───────────────────────────────┐         ┌───────────────────────────────┐
    │     Single-Hand Models        │         │      Two-Hand Model           │
    │  • mlp_model_1.p (Alphabets)  │         │  • mlp_model_2.p (Alphabets)  │
    │  • mlp_model_num.p (Digits)   │         │  (A, B, D, E, F, G, H, J, K,  │
    │  (C, I, L, O, U, V, 0-9)      │         │   M, N, P, Q, R, S, T, W..Z)  │
    └──────────────┬────────────────┘         └──────────────┬────────────────┘
                   │                                         │
                   └────────────────────┬────────────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │   Confidence & Debouncer      │
                        │  Threshold >= 0.70 & N-Frames │
                        └───────────────┬───────────────┘
                                        │
                   ┌────────────────────┴────────────────────┐
                   ▼                                         ▼
    ┌───────────────────────────────┐         ┌───────────────────────────────┐
    │  Recognition Session Buffer   │         │    Gemma 4 Cloud AI Tutor     │
    │   (Confirmed Student Text)    │ ──────> │  "Student asked in sign: ..." │
    └───────────────────────────────┘         └───────────────────────────────┘
```

---

## 2. Verified Model Assets & Ground Truth

The recognition engine utilizes authentic pre-trained weights from local repository assets:

| Model ID | Weight File | Architecture | Input Dim | Classes Covered | Source Repository |
|---|---|---|---|---|---|
| `mlp_single_hand_alphabet` | `mlp_model_1.p` | Multi-Layer Perceptron | 42 | **C, I, L, O, U, V** (6 classes) | `streamlit-version` |
| `mlp_two_hand_alphabet` | `mlp_model_2.p` | Multi-Layer Perceptron | 84 | **A, B, D, E, F, G, H, J, K, M, N, P, Q, R, S, T, W, X, Y, Z** (20 classes) | `streamlit-version` |
| `mlp_numbers` | `mlp_model_num.p` | Multi-Layer Perceptron | 42 | **0, 1, 2, 3, 4, 5, 6, 7, 8, 9** (10 classes) | `streamlit-version` |
| `mediapipe_gesture_task` | `gesture_recognizer.task` | MediaPipe Tasks Bundle | Native | Open_Palm, Closed_Fist, Pointing_Up, Thumb_Up, etc. | `SilentTalk-master` |

Together, `mlp_model_1.p` and `mlp_model_2.p` provide complete coverage for **all 26 letters of the English/ISL alphabet (A–Z)** and **all 10 digits (0–9)**.

---

## 3. Mathematical Normalization & Landmark Extraction

### Feature Space Definition
MediaPipe detects 21 hand landmarks per hand, where each landmark has coordinates $(x_i, y_i, z_i)$ in $[0.0, 1.0]$.
To achieve translational and scale invariance:

1. **Single Hand (42 Features):**
   $$\hat{x}_i = x_i - \min_{j \in \{0\dots20\}}(x_j)$$
   $$\hat{y}_i = y_i - \min_{j \in \{0\dots20\}}(y_j)$$
   The resulting vector is:
   $$V_{42} = [\hat{x}_0, \hat{y}_0, \hat{x}_1, \hat{y}_1, \dots, \hat{x}_{20}, \hat{y}_{20}]$$

2. **Two Hands (84 Features):**
   $$V_{84} = V_{42}^{\text{Hand 1}} \oplus V_{42}^{\text{Hand 2}}$$

---

## 4. Temporal Debouncing and Stability Filtering

In video feeds running at 15–30 FPS, continuous sign generation without debouncing leads to character spamming (e.g. 30 "A"s in 1 second).

EduBridge AI incorporates `ConfidenceDebouncer`:
- **Confidence Gate:** Predictions below `SIGN_CONFIDENCE_THRESHOLD` (0.70) are discarded (`is_confirmed = False`).
- **N-Frame Stability:** A predicted symbol must remain identical across $N$ consecutive frames (default: 2 frames) before it is eligible for confirmation.
- **Cooldown Filter:** Once confirmed, duplicate emissions of the identical symbol are suppressed for `cooldown_seconds` (default: 1.0s) unless released or transitioned.

---

## 5. API Endpoints

### 1. Model Status
`GET /api/v1/sign-language/models`
Returns load state, dimensions, and supported classes for all models.

### 2. Lexicon Catalog
`GET /api/v1/sign-language/vocabulary`
Returns full ISL alphabets (A–Z), digits (0–9), and control gestures with step-by-step physical descriptions.

### 3. Session Management
- `POST /api/v1/sign-language/sessions`: Create recognition session (`mode`: `"auto"`, `"alphabet"`, `"number"`).
- `GET /api/v1/sign-language/sessions/{session_id}`: Query session state and text buffer.
- `DELETE /api/v1/sign-language/sessions/{session_id}`: End session and free memory.

### 4. Frame & Landmark Inference
- `POST /api/v1/sign-language/sessions/{session_id}/frames`: Process Base64 JPEG/PNG image.
- `POST /api/v1/sign-language/sessions/{session_id}/landmarks`: Process client-extracted landmark JSON array (optimized for low-bandwidth mobile devices).

### 5. Text Editing
- `POST /api/v1/sign-language/confirm`: Perform text edits (`append`, `space`, `backspace`, `clear`).
- `POST /api/v1/sign-language/clear`: Clear session text.

### 6. Bridge to Gemma 4 AI Tutor
- `POST /api/v1/sign-language/ask-tutor`: Directly sends the student's accumulated sign text buffer to the Gemma 4 educational tutor for an immediate accessible explanation.

---

## 6. Real-Time Streaming WebSocket

**Endpoint:** `/ws/v1/sign-language/stream/{session_id}`

### Inbound Message Protocol:
```json
{
  "type": "frame",
  "frame_base64": "data:image/jpeg;base64,..."
}
```
Or for low-bandwidth mode:
```json
{
  "type": "landmarks",
  "hands": [[{"x": 0.1, "y": 0.2}, ...]]
}
```

### Outbound Response:
```json
{
  "type": "prediction",
  "prediction": {
    "predicted_label": "A",
    "confidence": 0.9412,
    "is_confirmed": true,
    "num_hands": 2,
    "mode_used": "two_hand_alphabet",
    "top_candidates": [
      {"label": "A", "probability": 0.9412},
      {"label": "B", "probability": 0.0315}
    ]
  },
  "current_text": "HELLA",
  "frame_count": 42
}
```

