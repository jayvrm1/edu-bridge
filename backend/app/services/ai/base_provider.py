"""
Abstract Base Provider interface for AI reasoning engines.
Allows switching seamlessly between Google AI Studio, Vertex AI, OpenAI-compatible, and Mock providers.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from app.schemas.ai_tutor import StructuredTutorContent, QuizQuestion


class BaseAIProvider(ABC):
    """Abstract interface defining required provider capabilities."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the inference provider."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Configured model identifier."""
        pass

    @abstractmethod
    async def generate_educational_content(
        self,
        prompt: str,
        system_instruction: str,
        task: str = "educational_explanation",
        temperature: float = 0.3,
        max_output_tokens: int = 2048
    ) -> StructuredTutorContent:
        """Generates structured educational explanations from the model."""
        pass

    @abstractmethod
    async def generate_quiz_questions(
        self,
        topic: str,
        difficulty: str,
        num_questions: int,
        question_type: str,
        language: str = "en"
    ) -> List[QuizQuestion]:
        """Generates structured educational quiz questions from the model."""
        pass
