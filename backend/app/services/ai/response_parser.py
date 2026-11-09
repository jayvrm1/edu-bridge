"""
Robust parser and validator for model responses.
Extracts and sanitizes JSON from raw LLM output, with schema validation and fallback recovery.
"""

import json
import re
from typing import Dict, Any, List, Optional
from app.schemas.ai_tutor import StructuredTutorContent, QuizQuestion
from app.core.logging import logger


class ResponseParser:
    """Parses raw text outputs into validated Pydantic models."""

    @classmethod
    def clean_json_string(cls, raw_text: str) -> str:
        """Strips markdown code fences and whitespace from raw LLM text."""
        text = raw_text.strip()
        # Remove ```json ... ``` or ``` ... ```
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        return text

    @classmethod
    def parse_tutor_content(cls, raw_text: str, default_task: str = "educational_explanation") -> StructuredTutorContent:
        """Parses model output into StructuredTutorContent."""
        cleaned = cls.clean_json_string(raw_text)
        try:
            data = json.loads(cleaned)
            if isinstance(data, dict):
                return StructuredTutorContent(
                    text=data.get("text", cleaned),
                    summary=data.get("summary", ""),
                    key_points=data.get("key_points", []),
                    examples=data.get("examples", []),
                    suggested_questions=data.get("suggested_questions", []),
                    content_type=data.get("content_type", default_task)
                )
        except json.JSONDecodeError as e:
            logger.warning(f"JSON decode failed on model response: {e}. Attempting regex extraction.")
            # Try to find a JSON block via regex
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group(0))
                    return StructuredTutorContent(**data)
                except Exception:
                    pass

        # Fallback recovery: treat the raw text as the explanation text
        logger.info("Using fallback recovery to encapsulate raw model text into StructuredTutorContent.")
        return StructuredTutorContent(
            text=cleaned,
            summary=cleaned[:150] + ("..." if len(cleaned) > 150 else ""),
            key_points=[],
            examples=[],
            suggested_questions=[],
            content_type=default_task
        )

    @classmethod
    def parse_quiz_questions(cls, raw_text: str) -> List[QuizQuestion]:
        """Parses model output into a list of QuizQuestion models."""
        cleaned = cls.clean_json_string(raw_text)
        try:
            data = json.loads(cleaned)
            if isinstance(data, dict) and "questions" in data:
                data = data["questions"]
            if isinstance(data, list):
                questions = []
                for idx, item in enumerate(data, start=1):
                    q = QuizQuestion(
                        question_id=item.get("question_id", idx),
                        question_text=item.get("question_text", "Question"),
                        question_type=item.get("question_type", "multiple_choice"),
                        options=item.get("options", []),
                        correct_answer=item.get("correct_answer", ""),
                        explanation=item.get("explanation", ""),
                        hint=item.get("hint")
                    )
                    questions.append(q)
                return questions
        except Exception as e:
            logger.error(f"Failed to parse quiz questions from output: {e}")

        # Try to find a JSON array via regex
        match = re.search(r"\[.*\]", cleaned, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(0))
                return [QuizQuestion(**item) for item in data]
            except Exception:
                pass

        return []

