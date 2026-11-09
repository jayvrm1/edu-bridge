"""
Prompt Builder for Gemma 4 AI Tutor.
Constructs pedagogical, accessible, and structured prompts tailored to student preferences.
"""

from typing import List, Dict, Any, Optional
from app.models.user import User, AccessibilityPreferences, UserProfile
from app.models.conversation import Message
from app.schemas.ai_tutor import ResponsePreferences


class PromptBuilder:
    """Builds educational system instructions and structured prompts."""

    SYSTEM_TUTOR_BASE = (
        "You are EduBridge AI Tutor, a compassionate, patient, and pedagogically expert educational tutor. "
        "Your mission is 'Learning Without Communication Barriers'. "
        "You adapt to learners with hearing, visual, speech, and physical accessibility requirements. "
        "Explain academic concepts clearly, avoiding unnecessary jargon while maintaining conceptual rigor. "
        "Always output valid, clean JSON according to the specified schema."
    )

    @classmethod
    def build_system_instruction(
        cls,
        user: Optional[User] = None,
        accessibility: Optional[AccessibilityPreferences] = None,
        profile: Optional[UserProfile] = None
    ) -> str:
        instructions = [cls.SYSTEM_TUTOR_BASE]

        # Preferred language
        lang = profile.preferred_language if profile and profile.preferred_language else "en"
        instructions.append(f"Deliver explanations primarily in language/locale: '{lang}'.")

        # Accessibility adaptations
        if accessibility:
            if accessibility.hearing_impairment:
                instructions.append(
                    "Accessibility Requirement (Hearing): The student uses sign language (ISL) or text. "
                    "Use clear, visually structured formatting, short sentences, and explicit signable concepts."
                )
            if accessibility.visual_impairment:
                instructions.append(
                    "Accessibility Requirement (Visual): The student relies on screen readers or audio. "
                    "Provide vivid, descriptive textual descriptions for any visual diagrams, charts, or spatial concepts. "
                    "Avoid referring to 'as seen in the image above'."
                )
            if accessibility.speech_impairment:
                instructions.append(
                    "Accessibility Requirement (Speech): The student communicates via AAC, sign language, or text. "
                    "Provide clear, concise options and avoid requiring verbal dialogue."
                )
            if accessibility.preferences_metadata:
                instructions.append(f"Additional student learning adjustments: {accessibility.preferences_metadata}")

        return " ".join(instructions)

    @classmethod
    def build_tutor_prompt(
        cls,
        user_message: str,
        task: str,
        preferences: ResponsePreferences,
        history_messages: Optional[List[Message]] = None
    ) -> str:
        history_text = ""
        if history_messages:
            # Include up to the last 6 messages for context
            recent = history_messages[-6:]
            turns = []
            for m in recent:
                turns.append(f"{m.role.upper()} ({m.input_type}): {m.content}")
            history_text = "\n".join(turns)

        prompt = f"""
Task: {task}
Detail Level: {preferences.detail_level}
Include Examples: {preferences.include_examples}

{"Conversation History:" if history_text else ""}
{history_text}

Student Question:
"{user_message}"

Generate a structured JSON response with this exact schema:
{{
  "text": "Comprehensive, encouraging pedagogical explanation.",
  "summary": "Concise 1-2 sentence core takeaway.",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "examples": ["Real-world application or example 1", "Example 2"],
  "suggested_questions": ["Curious follow-up question 1", "Follow-up question 2"],
  "content_type": "{task}"
}}

Output only the JSON object. Do not include markdown code block formatting like ```json.
"""
        return prompt.strip()

    @classmethod
    def build_quiz_prompt(
        cls,
        topic: str,
        difficulty: str,
        num_questions: int,
        question_type: str,
        language: str = "en"
    ) -> str:
        return f"""
You are an expert academic assessment creator.
Create an educational quiz on the topic: "{topic}"
Difficulty: {difficulty}
Number of questions: {num_questions}
Target question type: {question_type}
Language: {language}

Output a JSON array of questions with this exact schema:
[
  {{
    "question_id": 1,
    "question_text": "Clear question text?",
    "question_type": "multiple_choice",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct_answer": "B) Option 2",
    "explanation": "Detailed pedagogical explanation of why this answer is correct.",
    "hint": "Gentle guiding hint for a struggling learner."
  }}
]

Output only the valid JSON array without any wrapping text.
""".strip()

