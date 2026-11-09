"""
Quiz Generator and Evaluation service.
Orchestrates AI-driven educational assessments and integrates with PostgreSQL gamification.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.services.ai.base_provider import BaseAIProvider
from app.schemas.ai_tutor import (
    QuizQuestion,
    QuizGenerationRequest,
    QuizGenerationResponse,
    QuizEvaluationRequest,
    QuizEvaluationResponse,
    QuestionEvaluation,
    TutorModelInfo
)
from app.models.gamification import UserGamification, XPTransaction


class QuizGenerator:
    """Handles generation and evaluation of pedagogical quizzes."""

    def __init__(self, provider: BaseAIProvider):
        self.provider = provider

    async def create_quiz(self, request: QuizGenerationRequest, language: str = "en") -> QuizGenerationResponse:
        questions = await self.provider.generate_quiz_questions(
            topic=request.topic,
            difficulty=request.difficulty,
            num_questions=request.number_of_questions,
            question_type=request.question_type,
            language=language
        )

        return QuizGenerationResponse(
            topic=request.topic,
            difficulty=request.difficulty,
            questions=questions,
            model_info=TutorModelInfo(
                provider=self.provider.provider_name,
                model=self.provider.model_name
            )
        )

    async def evaluate_quiz(
        self,
        request: QuizEvaluationRequest,
        user_id: int,
        db: AsyncSession
    ) -> QuizEvaluationResponse:
        correct_count = 0
        total = len(request.questions)
        feedback_list: List[QuestionEvaluation] = []

        for q in request.questions:
            user_ans = request.answers.get(q.question_id, "").strip()
            # Case-insensitive comparison and prefix matching
            is_correct = False
            if user_ans:
                if user_ans.lower() == q.correct_answer.lower():
                    is_correct = True
                elif user_ans.split(")")[0].strip().lower() == q.correct_answer.split(")")[0].strip().lower():
                    is_correct = True

            if is_correct:
                correct_count += 1

            feedback_list.append(
                QuestionEvaluation(
                    question_id=q.question_id,
                    is_correct=is_correct,
                    user_answer=user_ans,
                    correct_answer=q.correct_answer,
                    explanation=q.explanation
                )
            )

        percentage = round((correct_count / total * 100.0), 1) if total > 0 else 0.0
        passed = percentage >= 60.0

        # Award XP: 15 XP per correct answer + 50 XP completion bonus
        xp_earned = (correct_count * 15) + (50 if passed else 10)

        # Persist XP transaction in database
        stmt = select(UserGamification).where(UserGamification.user_id == user_id)
        res = await db.execute(stmt)
        gamify = res.scalar_one_or_none()
        if not gamify:
            gamify = UserGamification(user_id=user_id, xp=0, level=1)
            db.add(gamify)

        gamify.xp += xp_earned
        # Simple level progression: 100 XP per level
        gamify.level = max(1, (gamify.xp // 100) + 1)

        txn = XPTransaction(
            gamification_id=gamify.id if gamify.id else 1,
            amount=xp_earned,
            action_type="quiz_completed",
            description=f"Completed {request.topic} quiz ({correct_count}/{total})"
        )
        if gamify.id:
            db.add(txn)

        await db.commit()

        return QuizEvaluationResponse(
            topic=request.topic,
            score=correct_count,
            total_questions=total,
            percentage=percentage,
            passed=passed,
            feedback=feedback_list,
            xp_earned=xp_earned
        )

