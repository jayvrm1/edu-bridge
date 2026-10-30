/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, QuizQuestion, QuizResult } from '../../types';
import { SAMPLE_QUIZZES } from '../../services/api/mockData';
import { gamificationService } from '../../services/api/gamificationService';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  Gamepad2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Volume2,
} from 'lucide-react';

export const QuizzesPage: React.FC = () => {
  const [quizzes] = useState<Quiz[]>(SAMPLE_QUIZZES);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(SAMPLE_QUIZZES[0]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedQuestion, setSubmittedQuestion] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const { speak, announce } = useAccessibility();

  if (!activeQuiz) return null;

  const currentQuestion = activeQuiz.questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestion.id];
  const isCorrect = selectedAnswer === currentQuestion.correctIndex;

  const handleSelectOption = (idx: number) => {
    if (submittedQuestion) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: idx }));
  };

  const handleVerifyAnswer = () => {
    setSubmittedQuestion(true);
    if (isCorrect) {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      announce('Correct answer! Well done.');
      speak('Correct answer! Great job.');
    } else {
      announce('Not quite. Review the explanation.');
      speak('Not quite. Review the explanation.');
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSubmittedQuestion(false);
    } else {
      // Complete quiz
      const res = await gamificationService.submitQuiz(activeQuiz.id, selectedAnswers);
      setQuizResult(res);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#FFD966', '#F28C00', '#FFE0BD', '#D9EAFB'],
      });
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSubmittedQuestion(false);
    setQuizResult(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222]">
              Quizzes & Knowledge Games
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFD966] text-[#222222] border border-[#222222] text-xs font-bold">
              +{activeQuiz.xpReward} XP Available
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5">
            Test comprehension of Indian Sign Language grammar, courtesy signs, and inclusive STEM
          </p>
        </div>
      </div>

      {/* Quiz Runner or Quiz Result */}
      {quizResult ? (
        <div className="p-8 bg-[#FFFFFF] rounded-3xl border-2 border-[#222222] shadow-stitch text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#FFF0C9] border-2 border-[#222222] mx-auto flex items-center justify-center text-4xl shadow-md">
            🏆
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F28C00]">
              Quiz Completed!
            </span>
            <h2 className="text-2xl font-extrabold text-[#222222]">
              Score: {quizResult.score} / {quizResult.total} Correct
            </h2>
            <p className="text-sm text-[#666666] max-w-md mx-auto">
              You earned <strong className="text-[#F28C00]">+{quizResult.xpEarned} XP</strong> and maintained your active daily streak!
            </p>
          </div>

          <div className="p-4 bg-[#FFF0C9]/60 rounded-2xl border-2 border-[#222222] max-w-sm mx-auto flex items-center justify-around text-xs font-bold">
            <div>
              <div className="text-[10px] text-[#666666] uppercase">XP Earned</div>
              <div className="text-base text-[#F28C00]">+{quizResult.xpEarned} XP</div>
            </div>
            <div className="w-px h-8 bg-[#222222]/20" />
            <div>
              <div className="text-[10px] text-[#666666] uppercase">Streak Bonus</div>
              <div className="text-base text-emerald-700">Applied 🔥</div>
            </div>
          </div>

          <button
            onClick={handleRestartQuiz}
            className="px-6 py-3 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] inline-flex items-center gap-2 shadow-xs transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </button>
        </div>
      ) : (
        <div className="p-6 bg-[#FFFFFF] rounded-3xl border-2 border-[#222222] shadow-stitch space-y-6">
          {/* Progress Strip */}
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#666666]">
              Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
            </span>
            <span className="text-[#F28C00]">
              Difficulty: {activeQuiz.difficulty}
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#F1F1F1] rounded-full overflow-hidden border border-[#222222]/20">
            <div
              className="h-full bg-[#F28C00] rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Prompt */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base sm:text-lg font-bold text-[#222222] leading-snug">
                {currentQuestion.prompt}
              </h2>
              <button
                onClick={() => speak(currentQuestion.prompt)}
                className="p-2 rounded-full bg-[#F1F1F1] hover:bg-[#FFE0BD] border border-[#222222] shrink-0 transition"
                title="Read question"
              >
                <Volume2 className="w-4 h-4 text-[#222222]" />
              </button>
            </div>

            {currentQuestion.signHint && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0C9] border border-[#222222] text-xs font-bold text-[#222222]">
                <span>🤟 Sign Target:</span>
                <span className="text-[#F28C00] font-mono">{currentQuestion.signHint}</span>
              </div>
            )}
          </div>

          {/* Multiple Choice Options */}
          <div className="space-y-2.5">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              let btnStyle = 'bg-[#FFFFFF] border-[#222222]/20 hover:border-[#222222] text-[#222222]';

              if (submittedQuestion) {
                if (idx === currentQuestion.correctIndex) {
                  btnStyle = 'bg-emerald-100 border-emerald-600 text-emerald-950 font-bold';
                } else if (isSelected) {
                  btnStyle = 'bg-red-100 border-red-500 text-red-950';
                }
              } else if (isSelected) {
                btnStyle = 'bg-[#FFF0C9] border-[#222222] font-bold shadow-xs';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-center justify-between text-xs sm:text-sm ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border-2 border-[#222222] flex items-center justify-center font-bold text-xs bg-white">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {submittedQuestion && idx === currentQuestion.correctIndex && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {submittedQuestion && isSelected && idx !== currentQuestion.correctIndex && (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback Explanation */}
          {submittedQuestion && (
            <div className="p-4 bg-[#F1F1F1] rounded-2xl border-2 border-[#222222] space-y-1.5 animate-slide-up">
              <div className="text-xs font-bold text-[#222222] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#F28C00]" />
                <span>Explanation & Concept Context:</span>
              </div>
              <p className="text-xs text-[#555555] leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="pt-2 flex justify-end">
            {!submittedQuestion ? (
              <button
                onClick={handleVerifyAnswer}
                disabled={selectedAnswer === undefined}
                className="px-6 py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] flex items-center gap-2 shadow-xs transition"
              >
                <span>
                  {currentQuestionIndex < activeQuiz.questions.length - 1
                    ? 'Next Question'
                    : 'View Final Results'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
