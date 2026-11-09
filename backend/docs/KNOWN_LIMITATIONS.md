# EduBridge AI: Known Limitations & Model Ground Truth

In accordance with strict engineering standards, this document honestly discloses the capabilities, verified assets, and operational constraints of the EduBridge AI backend.

---

## 1. Machine Learning Models & Weight Availability

### Verified and Fully Operational Models:
- **`mlp_model_1.p` (458 KB):** Pre-trained MLP for single-handed ISL alphabets (**C, I, L, O, U, V**), 42-feature input. Operates with high confidence on normalized MediaPipe landmark inputs.
- **`mlp_model_2.p` (661 KB):** Pre-trained MLP for two-handed ISL alphabets (**A, B, D, E, F, G, H, J, K, M, N, P, Q, R, S, T, W, X, Y, Z**), 84-feature input.
- **`mlp_model_num.p` (467 KB):** Pre-trained MLP for ISL numbers (**0 to 9**), 42-feature input.
- **`gesture_recognizer.task` (8.37 MB):** Native MediaPipe task bundle from `SilentTalk-master` providing gesture detection.

### Models with Incompatibilities or Missing Weights:
- **`random_forest.joblib` (19.78 MB):** Trained using legacy scikit-learn 0.23.2. Modern scikit-learn (1.4+) cannot deserialize its Cython `Tree` struct due to the addition of `missing_go_to_left` in modern scikit-learn. To prevent runtime crashes, alphabet recognition is routed through the verified `mlp_model_1.p` and `mlp_model_2.p`.
- **`ISLBridge-Project-main`:** Contained PyTorch architecture definition (`GestureRecognitionLSTM`, 30-frame sequence, 166-dim), but no pre-trained weights file was provided in the repository.
- **`ishaara-isl-main`:** Contained a BiLSTM architecture with temporal attention (285-dim), but weights were omitted from the source repository.
- *Policy:* In strict adherence to project requirements, no fake weights were fabricated. The system relies exclusively on verified pre-trained models.

---

## 2. 3D Avatar & SiGML Translation

- **Animation Inventory:** The system indexes 848 authentic SiGML XML files from `SilentTalk-master`.
- **Lexical Coverage:** Signs present in the 848 inventory (e.g. numbers, common nouns, greetings) translate into direct sign animations with HamNoSys motion data.
- **Fingerspelling Fallback:** Words without direct SiGML signs are automatically broken into single-character alphabet signs (fingerspelling).
- **Three.js Synthesis:** SiGML XML is converted to standard Three.js quaternion bone tracks for humanoid avatars. While realistic keyframes are synthesized, fine-grained physics and skinning are executed in the client WebGL renderer.

---

## 3. Gemma 4 Cloud AI Tutor

- **Model Specification:** Built for `gemma-4-26b-a4b-it` (MoE) and `gemma-4-31b-it` via the Google AI Studio REST endpoint (`https://generativelanguage.googleapis.com/v1beta`).
- **Authentication:** Requires `GEMMA_API_KEY`. If unconfigured, the backend runs in test/mock mode (`GEMMA_PROVIDER=mock`) with structured pedagogical responses, ensuring developers and CI/CD pipelines can test without paid API keys.

---

## 4. Speech & Visual OCR

- **TTS / STT:** Generates valid audio using `gTTS` when available or offline audio stubs when offline. Cloud speech APIs (e.g. Google Cloud Speech-to-Text) can be plugged in via the modular `BaseSpeechProvider` interface.
- **OCR:** Validates and extracts image text using `pytesseract` if Tesseract OCR binaries are installed on the system, with fallback image metric extraction if uninstalled.

