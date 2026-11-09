# EduBridge AI: Model Setup & Asset Placement Guide

This guide describes how to configure, inspect, and verify machine learning models and animation assets for EduBridge AI.

---

## 1. Directory Structure

All verified model weights and animation assets must reside in the backend repository root under `ml/`:

```
edubridge-ai-backend/ml/
├── model_registry/
│   ├── mlp_model_1.p            # 458 KB: Single-hand ISL alphabets (42 features)
│   ├── mlp_model_2.p            # 661 KB: Two-hand ISL alphabets (84 features)
│   ├── mlp_model_num.p          # 467 KB: ISL numbers 0-9 (42 features)
│   ├── gesture_recognizer.task  # 8.37 MB: MediaPipe Tasks binary gesture bundle
│   └── random_forest.joblib     # 19.78 MB: Legacy model (retained for audit)
└── assets/
    ├── sigml/                   # 848 authentic SiGML XML animation files
    │   ├── 0.sigml
    │   ├── 1.sigml
    │   ├── ...
    │   └── Z.sigml
    └── hamnosys_database.csv    # 89 KB: Hamburg Notation System phonetic mapping
```

---

## 2. Environment Variables

Configure paths in `.env` (defaults to local repository locations):

```env
MODELS_DIR=./ml/model_registry
SIGML_DIR=./ml/assets/sigml
SIGN_CONFIDENCE_THRESHOLD=0.70
SIGN_LANGUAGE_DEFAULT=ISL
```

---

## 3. Verifying Asset Integrity

### Check Model Registry API:
```bash
curl -X GET http://localhost:8000/api/v1/sign-language/models
```
Expected output:
```json
{
  "total_models": 5,
  "loaded_models": 4,
  "models": [ ... ]
}
```

### Check 3D Avatar SiGML Vocabulary:
```bash
curl -X GET http://localhost:8000/api/v1/avatar/vocabulary?limit=10
```
Expected output:
```json
{
  "total_signs": 848,
  "language": "ISL",
  "signs": [ ... ]
}
```

