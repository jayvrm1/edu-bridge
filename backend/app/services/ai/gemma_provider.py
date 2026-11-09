"""
Gemma 4 Cloud Inference Provider implementation.
Supports Google AI Studio / Generative Language API and mock testing fallback.
"""

import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import AppException, ModelInferenceError
from app.services.ai.base_provider import BaseAIProvider
from app.services.ai.response_parser import ResponseParser
from app.schemas.ai_tutor import StructuredTutorContent, QuizQuestion


class GemmaProvider(BaseAIProvider):
    """Google Cloud Gemma 4 inference provider via Generative Language API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Optional[int] = None
    ):
        self._api_key = api_key if api_key is not None else settings.GEMMA_API_KEY
        self._model = model or settings.GEMMA_MODEL
        self._base_url = (base_url or settings.GEMMA_API_BASE_URL).rstrip("/")
        self._timeout = timeout or settings.GEMMA_TIMEOUT

    @property
    def provider_name(self) -> str:
        return "google_ai_studio"

    @property
    def model_name(self) -> str:
        return self._model

    def _verify_api_key(self):
        if not self._api_key or self._api_key.strip() in ["", "mock_dev_key", "your_gemma_api_key_here"]:
            raise AppException(
                message=(
                    "Gemma 4 Cloud API key is unconfigured. Please configure a valid "
                    "GEMMA_API_KEY from Google AI Studio in your environment (.env) to enable live inference."
                ),
                status_code=503,
                code="AI_PROVIDER_UNCONFIGURED",
                details={"provider": self.provider_name, "model": self.model_name}
            )

    async def _call_api(self, prompt: str, system_instruction: str, temperature: float, max_tokens: int) -> str:
        self._verify_api_key()

        url = f"{self._base_url}/models/{self._model}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self._api_key
        }

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "responseMimeType": "application/json"
            }
        }

        timeout = httpx.Timeout(self._timeout, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

                # Extract text from Google Generative Language candidates schema
                candidates = data.get("candidates", [])
                if not candidates:
                    raise ModelInferenceError("No response candidates returned by Gemma 4 model.")

                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    raise ModelInferenceError("Empty content parts in Gemma 4 candidate.")

                raw_text = parts[0].get("text", "")
                return raw_text

            except httpx.TimeoutException:
                logger.error(f"Timeout connecting to Gemma 4 provider after {self._timeout}s.")
                raise AppException(
                    message="Gemma 4 model inference request timed out. Please try again.",
                    status_code=504,
                    code="MODEL_TIMEOUT"
                )
            except httpx.HTTPStatusError as e:
                err_text = e.response.text
                logger.error(f"Gemma 4 HTTP error: {e.response.status_code} - {err_text}")
                status_code = e.response.status_code
                if "API_KEY_INVALID" in err_text or status_code in [401, 403]:
                    raise AppException(
                        message="Invalid, expired, or unconfigured Gemma API key.",
                        status_code=503,
                        code="AI_PROVIDER_UNCONFIGURED"
                    )
                elif status_code == 429:
                    raise AppException(
                        message="Gemma API rate limit or quota exceeded. Please slow down.",
                        status_code=429,
                        code="AI_RATE_LIMIT_EXCEEDED"
                    )
                raise ModelInferenceError(
                    f"Gemma 4 cloud provider returned error status {status_code}.",
                    details={"error": err_text}
                )
            except Exception as e:
                logger.error(f"Unexpected error communicating with Gemma 4: {e}")
                raise ModelInferenceError(f"Failed to communicate with Gemma 4 cloud provider: {str(e)}")

    async def generate_educational_content(
        self,
        prompt: str,
        system_instruction: str,
        task: str = "educational_explanation",
        temperature: float = 0.3,
        max_output_tokens: int = 2048
    ) -> StructuredTutorContent:
        raw_text = await self._call_api(prompt, system_instruction, temperature, max_output_tokens)
        return ResponseParser.parse_tutor_content(raw_text, default_task=task)

    async def generate_quiz_questions(
        self,
        topic: str,
        difficulty: str,
        num_questions: int,
        question_type: str,
        language: str = "en"
    ) -> List[QuizQuestion]:
        from app.services.ai.prompt_builder import PromptBuilder
        prompt = PromptBuilder.build_quiz_prompt(topic, difficulty, num_questions, question_type, language)
        system_inst = "You are a professional educational assessment engine. Output only valid JSON."
        raw_text = await self._call_api(prompt, system_inst, temperature=0.2, max_tokens=2500)
        return ResponseParser.parse_quiz_questions(raw_text)


class MockGemmaProvider(BaseAIProvider):
    """Deterministic Mock Provider for unit testing and offline development."""

    @property
    def provider_name(self) -> str:
        return "mock_gemma"

    @property
    def model_name(self) -> str:
        return "gemma-4-26b-a4b-it-mock"

    async def generate_educational_content(
        self,
        prompt: str,
        system_instruction: str,
        task: str = "educational_explanation",
        temperature: float = 0.3,
        max_output_tokens: int = 2048
    ) -> StructuredTutorContent:
        return StructuredTutorContent(
            text="Photosynthesis is the biological process by which green plants and certain other organisms transform light energy into chemical energy. During photosynthesis in green plants, light energy is captured and used to convert water, carbon dioxide, and minerals into oxygen and energy-rich organic compounds.",
            summary="Plants convert sunlight, water, and carbon dioxide into glucose and oxygen.",
            key_points=[
                "Requires sunlight, chlorophyll, water, and carbon dioxide",
                "Light-dependent reactions occur in the thylakoid membranes",
                "Calvin cycle (light-independent) occurs in the stroma",
                "Releases oxygen as a vital byproduct"
            ],
            examples=[
                "Green leaves of a mango tree absorbing morning sunlight to produce glucose",
                "Algae in fresh water releasing oxygen bubbles during the day"
            ],
            suggested_questions=[
                "How does chlorophyll absorb specific wavelengths of light?",
                "What is the difference between light-dependent and light-independent reactions?"
            ],
            content_type=task
        )

    async def generate_quiz_questions(
        self,
        topic: str,
        difficulty: str,
        num_questions: int,
        question_type: str,
        language: str = "en"
    ) -> List[QuizQuestion]:
        questions = []
        for i in range(1, num_questions + 1):
            questions.append(
                QuizQuestion(
                    question_id=i,
                    question_text=f"Sample {difficulty} question #{i} on {topic}?",
                    question_type="multiple_choice",
                    options=[
                        f"A) Incorrect choice for {topic}",
                        f"B) Correct choice for {topic}",
                        f"C) Alternative distractor",
                        f"D) Another option"
                    ],
                    correct_answer=f"B) Correct choice for {topic}",
                    explanation=f"Option B accurately represents the verified scientific definition of {topic}.",
                    hint=f"Focus on the primary mechanism of {topic}."
                )
            )
        return questions
