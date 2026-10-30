/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CameraWorkspace } from './CameraWorkspace';
import { SignExercise, SignRecognitionResult } from '../../types';
import { SAMPLE_SIGN_EXERCISES } from '../../services/api/mockData';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Trophy, CheckCircle, ArrowRight, Lightbulb, Volume2 } from 'lucide-react';

interface SignPracticeTrainerProps {
  onCompleteExercise?: (exerciseId: string, xpEarned: number) => void;
}

export const SignPracticeTrainer: React.FC<SignPracticeTrainerProps> = ({ onCompleteExercise }) => {
  const [exercises] = useState<SignExercise[]>(SAMPLE_SIGN_EXERCISES);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [practiceStreak, setPracticeStreak] = useState<number>(3);

  const currentExercise = exercises[currentIndex];
  const { speak, announce } = useAccessibility();
  const { user } = useAuth();

  const handleRecognitionResult = (result: SignRecognitionResult) => {
    if (!currentExercise || isSuccess) return;

    // Check if detected sign matches current exercise
    if (
      result.sign.toUpperCase() === currentExercise.sign.toUpperCase() &&
      result.confidence >= 0.75
    ) {
      triggerSuccess();
    }
  };

  const triggerSuccess = () => {
    setIsSuccess(true);
    setPracticeStreak((prev) => prev + 1);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD966', '#F28C00', '#FFE0BD', '#D9EAFB'],
    });

    announce(`Awesome! You successfully signed ${currentExercise.title}! Earned ${currentExercise.xpReward} XP.`);
    speak(`Excellent! You correctly signed ${currentExercise.title}.`);

    if (onCompleteExercise) {
      onCompleteExercise(currentExercise.id, currentExercise.xpReward);
    }
  };

  const handleNextExercise = () => {
    setIsSuccess(false);
    setCurrentIndex((prev) => (prev + 1) % exercises.length);
  };

  return (
    <div className="space-y-6">
      {/* Exercise Progression Header */}
      <div className="p-4 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD966] text-[#222222] font-extrabold flex items-center justify-center border-2 border-[#222222]">
            #{currentIndex + 1}
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#666666] tracking-wider">
              Exercise {currentIndex + 1} of {exercises.length} • {currentExercise.category}
            </div>
            <h2 className="text-lg font-bold text-[#222222]">{currentExercise.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF0C9] rounded-full border border-[#222222] text-xs font-bold text-[#222222]">
            <span>🔥</span>
            <span>{practiceStreak} Signs Streak</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-[#F28C00] text-white rounded-full border border-[#222222] text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+{currentExercise.xpReward} XP</span>
          </div>
        </div>
      </div>

      {/* Main Practice Area: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Webcam Workspace */}
        <div className="lg:col-span-7">
          <CameraWorkspace
            targetSignHint={currentExercise.sign}
            isTrainingMode={true}
            onRecognitionResult={handleRecognitionResult}
          />
        </div>

        {/* Right: Gesture Blueprint & Coach Tips */}
        <div className="lg:col-span-5 space-y-4">
          {/* Instructions Card */}
          <div className="p-5 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#D9EAFB] border border-[#222222] text-[#222222]">
                  {currentExercise.difficulty}
                </span>
                <h3 className="text-base font-extrabold text-[#222222] mt-1.5">
                  How to Sign: &ldquo;{currentExercise.sign}&rdquo;
                </h3>
              </div>
              <button
                onClick={() => speak(`${currentExercise.title}. ${currentExercise.description}`)}
                className="p-2 rounded-full bg-[#F1F1F1] border border-[#222222] hover:bg-[#FFE0BD] transition"
                title="Read instructions aloud"
              >
                <Volume2 className="w-4 h-4 text-[#222222]" />
              </button>
            </div>

            <p className="text-sm text-[#222222] leading-relaxed bg-[#FFF0C9]/40 p-3.5 rounded-xl border border-[#222222]/15">
              {currentExercise.description}
            </p>

            {/* Coach Tips */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#222222] flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-[#F28C00]" />
                Linguist Coach Tips
              </div>
              <ul className="space-y-1.5">
                {currentExercise.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-[#555555] flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F28C00] mt-1.5 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Success Celebration Callout */}
            {isSuccess ? (
              <div className="p-4 bg-[#FFD966] rounded-xl border-2 border-[#222222] space-y-3 animate-bounce-short">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-800" />
                  <span className="font-extrabold text-sm text-[#222222]">
                    Verification Complete! +{currentExercise.xpReward} XP
                  </span>
                </div>
                <p className="text-xs text-[#222222]">
                  Your gesture posture aligned with certified ISL criteria. Ready for the next sign?
                </p>
                <button
                  onClick={handleNextExercise}
                  className="w-full py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <span>Continue to Next Sign</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={triggerSuccess}
                className="w-full py-2.5 bg-[#F1F1F1] text-[#222222] rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#FFE0BD] flex items-center justify-center gap-2 transition"
              >
                <span>Simulate Target Match (+XP)</span>
              </button>
            )}
          </div>

          {/* Quick Sign Picker Strip */}
          <div className="p-4 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch">
            <div className="text-xs font-bold text-[#222222] mb-2.5">Jump to Sign:</div>
            <div className="flex flex-wrap gap-1.5">
              {exercises.map((ex, idx) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsSuccess(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                    currentIndex === idx
                      ? 'bg-[#F28C00] text-white border-[#222222]'
                      : 'bg-[#F1F1F1] text-[#666666] border-[#222222]/20 hover:border-[#222222]'
                  }`}
                >
                  {ex.sign}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
