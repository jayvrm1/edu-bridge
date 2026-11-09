# Gemma 4 Cloud Inference & Provider Research Report

**Platform:** EduBridge AI — *Learning Without Communication Barriers*  
**Date:** October 30, 2026  
**Document:** `docs/GEMMA4_PROVIDER_RESEARCH.md`  

---

## 1. Executive Summary

Gemma 4 is Google DeepMind's frontier family of lightweight, open-weight multimodal and reasoning models released on **April 2, 2026** under the commercially permissive Apache 2.0 license. In EduBridge AI, Gemma 4 serves as the central pedagogical engine powering adaptive tutoring, concept explanations, step-by-step guidance, and quiz generation tailored to learners with hearing, visual, and speech accessibility needs.

This research establishes the verified cloud inference routes, model identifiers, API endpoint structures, authentication protocols, rate limits, and provider-agnostic abstraction patterns implemented in the EduBridge AI backend.

---

## 2. Gemma 4 Model Variants & Identifiers

| Model Variant | Parameter Count | Architecture | Target Deployment & Use Case | Recommended Identifier |
|---|---|---|---|---|
| **Gemma 4 31B Dense** | 31 Billion | Dense Decoder-Only | Frontier reasoning, complex scientific tutoring, deep code and concept explanations | `gemma-4-31b-it` |
| **Gemma 4 26B MoE** | 26B total (~3.8B active) | Mixture of Experts (MoE) | High-throughput, low-latency live interactive tutoring | `gemma-4-26b-a4b-it` |
| **Gemma 4 E4B** | Effective 4 Billion | Compact Multimodal | Fast summary, lightweight quiz validation, edge inference | `gemma-4-e4b-it` |
| **Gemma 4 E2B** | Effective 2 Billion | Ultra-lightweight Edge | Mobile and local offline fallback | `gemma-4-e2b-it` |

**EduBridge AI Default Selection:**
- **Primary AI Tutor:** `gemma-4-26b-a4b-it` (ideal balance of pedagogical reasoning depth and low latency response time).
- **Advanced Concept Explanation & Complex Reasoning:** `gemma-4-31b-it`.

---

## 3. Supported Cloud Inference Providers

### Option A: Google AI Studio (Primary Recommended Provider)
- **Official Provider:** Google Generative AI / Google AI Studio.
- **REST Endpoint:**
  ```http
  POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
  ```
- **Authentication:**
  - Header: `x-goog-api-key: <GEMMA_API_KEY>` or URL parameter `?key=<GEMMA_API_KEY>`.
- **SDK Support:**
  - Official `google-genai` Python SDK or direct asynchronous HTTPX REST calls.
- **Payload Schema:**
  ```json
  {
    "system_instruction": {
      "parts": [{"text": "You are EduBridge AI Tutor..."}]
    },
    "contents": [
      {
        "role": "user",
        "parts": [{"text": "Explain photosynthesis"}]
      }
    ],
    "generationConfig": {
      "temperature": 0.3,
      "maxOutputTokens": 2048,
      "responseMimeType": "application/json"
    }
  }
  ```
- **Pricing & Quotas:**
  - Free tier available for development (up to 15 RPM / 1 million TPM depending on model tier).
  - Pay-as-you-go commercial tiers available with high concurrency guarantees.

### Option B: Google Cloud Vertex AI (Enterprise / Sovereign Cloud)
- **Official Provider:** Google Cloud Vertex AI Model Garden.
- **Endpoint Structure:**
  ```http
  POST https://{REGION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{REGION}/publishers/google/models/gemma-4-26b-a4b-it-maas:rawPredict
  ```
- **Authentication:** Google Cloud Application Default Credentials (OAuth2 Bearer token).
- **Enterprise Features:** VPC Service Controls, HIPAA/GDPR data residency, and dedicated endpoint provisioning.

### Option C: OpenAI-Compatible Inference Providers (Groq, OpenRouter, vLLM)
- **Endpoint:**
  ```http
  POST {GEMMA_API_BASE_URL}/chat/completions
  ```
- **Authentication:** `Authorization: Bearer <API_KEY>`
- **Use Case:** Self-hosted university GPU clusters running vLLM, or multi-cloud fallbacks.

### Option D: Mock Provider (Local Development & CI Testing)
- Purely local deterministic mock engine that validates prompt schema and returns realistic structured JSON educational responses without external API calls or billing costs.

---

## 4. EduBridge AI Provider-Agnostic Abstraction

To avoid vendor lock-in, the backend implements a clean interface:

```python
class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_explanation(self, request: PromptPayload) -> StructuredTutorResponse:
        pass

    @abstractmethod
    async def generate_quiz(self, request: QuizGenerationPayload) -> StructuredQuizResponse:
        pass
```

The concrete implementation (`GemmaProvider`) is dynamically selected via environment variables:
- `GEMMA_PROVIDER=google_ai_studio`
- `GEMMA_API_KEY=...`
- `GEMMA_MODEL=gemma-4-26b-a4b-it`
- `GEMMA_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta`
- `GEMMA_TIMEOUT=30`
- `GEMMA_MAX_OUTPUT_TOKENS=2048`
- `GEMMA_TEMPERATURE=0.3`

---

## 5. Security & Verification Rules
1. **Never Expose Credentials:** `GEMMA_API_KEY` is loaded strictly on the backend and never passed to the frontend or included in logs.
2. **Graceful Startup Without Key:** The backend will boot successfully even if `GEMMA_API_KEY` is empty or unconfigured; calls to the AI tutor will return a structured `HTTP 503 SERVICE_UNAVAILABLE` error explaining that cloud credentials are required, rather than crashing or generating hallucinated fake responses.
3. **Structured JSON Output:** Prompts mandate strict JSON schemas, parsed and validated by Pydantic v2 models (`StructuredTutorResponse`, `QuizResponse`).

