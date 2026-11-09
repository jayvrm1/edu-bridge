"""
Central AI Orchestration Service for EduBridge AI.
Directs requests to the active provider, constructs context, and persists multimodal learning sessions.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.services.ai.base_provider import BaseAIProvider
from app.services.ai.gemma_provider import GemmaProvider, MockGemmaProvider
from app.services.ai.prompt_builder import PromptBuilder
from app.services.ai.conversation_manager import ConversationManager
from app.services.ai.quiz_generator import QuizGenerator
from app.services.ai.educational_engine import EducationalEngine
from app.schemas.ai_tutor import (
    TutorRequest,
    TutorResponse,
    TutorOutputPreferences,
    TutorModelInfo,
    StructuredTutorContent
)
from app.models.user import User


class AIService:
    """Central AI coordinator."""

    def __init__(self, provider: Optional[BaseAIProvider] = None):
        if provider:
            self.provider = provider
        elif settings.GEMMA_PROVIDER == "mock" or settings.APP_ENV == "testing":
            self.provider = MockGemmaProvider()
        else:
            self.provider = GemmaProvider()

        self.educational_engine = EducationalEngine(self.provider)
        self.quiz_generator = QuizGenerator(self.provider)

    def determine_output_preferences(self, user: User) -> TutorOutputPreferences:
        """Derives output modalities from student accessibility flags."""
        prefs = user.accessibility_preferences
        if not prefs:
            return TutorOutputPreferences(text_enabled=True, audio_enabled=False, sign_avatar_enabled=False)

        return TutorOutputPreferences(
            text_enabled=True,
            audio_enabled=(prefs.visual_impairment or prefs.voice_interaction_enabled),
            sign_avatar_enabled=(prefs.hearing_impairment or prefs.sign_language_avatar_enabled)
        )

    async def answer_tutor_request(
        self,
        user: User,
        request: TutorRequest,
        db: AsyncSession
    ) -> TutorResponse:
        # 1. Retrieve or initialize conversation
        title_snippet = request.message[:30] + ("..." if len(request.message) > 30 else "")
        conv = await ConversationManager.get_or_create_conversation(
            db=db,
            user_id=user.id,
            conversation_id=request.conversation_id,
            initial_title=title_snippet
        )

        # 2. Persist user turn
        user_msg = await ConversationManager.save_message(
            db=db,
            conversation_id=conv.id,
            role="user",
            content=request.message,
            input_type=request.input_type,
            metadata={"task": request.task}
        )

        # 3. Construct accessible system instruction and prompt
        sys_inst = PromptBuilder.build_system_instruction(
            user=user,
            accessibility=user.accessibility_preferences,
            profile=user.profile
        )
        prompt = PromptBuilder.build_tutor_prompt(
            user_message=request.message,
            task=request.task,
            preferences=request.response_preferences,
            history_messages=conv.messages
        )

        # 4. Generate structured response from provider
        content: StructuredTutorContent = await self.provider.generate_educational_content(
            prompt=prompt,
            system_instruction=sys_inst,
            task=request.task,
            temperature=settings.GEMMA_TEMPERATURE,
            max_output_tokens=settings.GEMMA_MAX_OUTPUT_TOKENS
        )

        # 5. Persist assistant turn
        asst_msg = await ConversationManager.save_message(
            db=db,
            conversation_id=conv.id,
            role="assistant",
            content=content.text,
            input_type="text",
            metadata={
                "summary": content.summary,
                "key_points": content.key_points,
                "examples": content.examples,
                "suggested_questions": content.suggested_questions,
                "provider": self.provider.provider_name,
                "model": self.provider.model_name
            }
        )

        # 6. Build response with adapted output preferences
        output_prefs = self.determine_output_preferences(user)

        return TutorResponse(
            conversation_id=conv.id,
            message_id=asst_msg.id,
            response=content,
            output_preferences=output_prefs,
            model=TutorModelInfo(
                provider=self.provider.provider_name,
                model=self.provider.model_name
            )
        )


# Factory dependency for FastAPI routes
def get_ai_service() -> AIService:
    return AIService()

