"""
Educational Engine handling specific pedagogical tutoring paradigms.
"""

from typing import Dict, Any, Optional
from app.services.ai.base_provider import BaseAIProvider
from app.services.ai.prompt_builder import PromptBuilder
from app.schemas.ai_tutor import StructuredTutorContent, ResponsePreferences
from app.models.user import User


class EducationalEngine:
    """Specialized pedagogical reasoning processor."""

    def __init__(self, provider: BaseAIProvider):
        self.provider = provider

    async def explain(
        self,
        question: str,
        user: User,
        preferences: Optional[ResponsePreferences] = None
    ) -> StructuredTutorContent:
        prefs = preferences or ResponsePreferences(detail_level="standard", include_examples=True)
        sys_inst = PromptBuilder.build_system_instruction(
            user=user,
            accessibility=user.accessibility_preferences,
            profile=user.profile
        )
        prompt = PromptBuilder.build_tutor_prompt(
            user_message=question,
            task="educational_explanation",
            preferences=prefs
        )
        return await self.provider.generate_educational_content(prompt, sys_inst)

    async def simplify(
        self,
        concept: str,
        user: User,
        preferences: Optional[ResponsePreferences] = None
    ) -> StructuredTutorContent:
        prefs = preferences or ResponsePreferences(detail_level="simple", include_examples=True)
        sys_inst = PromptBuilder.build_system_instruction(
            user=user,
            accessibility=user.accessibility_preferences,
            profile=user.profile
        )
        prompt = PromptBuilder.build_tutor_prompt(
            user_message=f"Explain this concept as simply as possible with intuitive analogies: {concept}",
            task="concept_simplification",
            preferences=prefs
        )
        return await self.provider.generate_educational_content(prompt, sys_inst)

    async def summarize(
        self,
        content: str,
        user: User,
        preferences: Optional[ResponsePreferences] = None
    ) -> StructuredTutorContent:
        prefs = preferences or ResponsePreferences(detail_level="simple", include_examples=False)
        sys_inst = PromptBuilder.build_system_instruction(
            user=user,
            accessibility=user.accessibility_preferences,
            profile=user.profile
        )
        prompt = PromptBuilder.build_tutor_prompt(
            user_message=f"Summarize the key educational takeaways from the following material: {content}",
            task="summary",
            preferences=prefs
        )
        return await self.provider.generate_educational_content(prompt, sys_inst)

