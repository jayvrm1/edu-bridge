"""
Pydantic v2 schemas for Gemma 4 AI Tutor, Structured Content, and Quiz Engines.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ResponsePreferences(BaseModel):
    detail_level: str = Field(default="standard", description="Detail level: simple, standard, in_depth")
    include_examples: bool = Field(default=True, description="Whether to include concrete educational examples")
    target_grade_level: Optional[str] = Field(default=None, description="Optional target grade or difficulty level")


class TutorRequest(BaseModel):
    input_type: str = Field(
        default="text",
        description="Input modality: text, sign_language, voice, aac, ocr"
    )
    message: str = Field(..., min_length=1, max_length=4000, description="User's academic question or topic")
    task: str = Field(
        default="educational_explanation",
        description="Pedagogical task: educational_explanation, concept_simplification, step_by_step, example_generation, summary"
    )
    conversation_id: Optional[int] = Field(default=None, description="Optional ID of existing conversation")
    response_preferences: ResponsePreferences = Field(default_factory=ResponsePreferences)


class StructuredTutorContent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    text: str = Field(..., description="Main pedagogical explanation text")
    summary: str = Field(default="", description="One to two sentence clear summary")
    key_points: List[str] = Field(default_factory=list, description="Bulleted takeaway concepts")
    examples: List[str] = Field(default_factory=list, description="Practical real-world examples")
    suggested_questions: List[str] = Field(default_factory=list, description="Follow-up exploration questions")
    content_type: str = Field(default="educational_explanation")


class TutorOutputPreferences(BaseModel):
    text_enabled: bool = Field(default=True)
    audio_enabled: bool = Field(default=False)
    sign_avatar_enabled: bool = Field(default=False)


class TutorModelInfo(BaseModel):
    provider: str
    model: str


class TutorResponse(BaseModel):
    conversation_id: int
    message_id: int
    response: StructuredTutorContent
    output_preferences: TutorOutputPreferences
    model: TutorModelInfo


# ── Quiz Schemas ─────────────────────────────────────────────────────────────

class QuizQuestion(BaseModel):
    question_id: int = Field(..., description="1-indexed question sequence number")
    question_text: str = Field(..., description="Question statement")
    question_type: str = Field(default="multiple_choice", description="multiple_choice, true_false, short_answer")
    options: Optional[List[str]] = Field(default=None, description="Choices for multiple choice questions")
    correct_answer: str = Field(..., description="Correct option or answer text")
    explanation: str = Field(..., description="Detailed explanation of why this answer is correct")
    hint: Optional[str] = Field(default=None, description="Pedagogical hint for the learner")


class QuizGenerationRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200, description="Subject topic to test")
    difficulty: str = Field(default="beginner", description="beginner, intermediate, advanced")
    number_of_questions: int = Field(default=5, ge=1, le=20, description="Number of questions to generate")
    question_type: str = Field(default="multiple_choice", description="multiple_choice, true_false, mixed")


class QuizGenerationResponse(BaseModel):
    topic: str
    difficulty: str
    questions: List[QuizQuestion]
    model_info: TutorModelInfo


class QuestionEvaluation(BaseModel):
    question_id: int
    is_correct: bool
    user_answer: str
    correct_answer: str
    explanation: str


class QuizEvaluationRequest(BaseModel):
    topic: str
    answers: Dict[int, str] = Field(..., description="Map of question_id to user selected answer")
    questions: List[QuizQuestion] = Field(..., description="The original quiz questions")


class QuizEvaluationResponse(BaseModel):
    topic: str
    score: int
    total_questions: int
    percentage: float
    passed: bool
    feedback: List[QuestionEvaluation]
    xp_earned: int

