/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TutorChat } from '../../components/tutor/TutorChat';
import { ThreeAvatar } from '../../components/avatar/ThreeAvatar';
import { CameraWorkspace } from '../../components/sign-language/CameraWorkspace';
import { SignRecognitionResult } from '../../types';
import { Bot, Sparkles, Video, Volume2, ShieldCheck } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const AITutorPage: React.FC = () => {
  const [activeAvatarTokens, setActiveAvatarTokens] = useState<string[]>(['HELLO']);
  const [showCameraInput, setShowCameraInput] = useState<boolean>(false);
  const { preferences, speak } = useAccessibility();

  const handleSignTokenSync = (tokens: string[]) => {
    if (tokens && tokens.length > 0) {
      setActiveAvatarTokens(tokens);
    }
  };

  const handleCameraRecognition = (result: SignRecognitionResult) => {
    setActiveAvatarTokens([result.sign]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222]">
              AI Tutoring Workspace
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0C9] text-[#222222] border border-[#222222] text-xs font-bold">
              Multi-Modal Inclusive
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5">
            Voice, text, Indian Sign Language, and AAC integrated into barrier-free learning
          </p>
        </div>

        <button
          onClick={() => setShowCameraInput(!showCameraInput)}
          className={`px-4 py-2 rounded-full border-2 border-[#222222] text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
            showCameraInput
              ? 'bg-[#FFD966] text-[#222222]'
              : 'bg-white hover:bg-[#FFE0BD] text-[#222222]'
          }`}
        >
          <Video className="w-4 h-4 text-[#F28C00]" />
          <span>{showCameraInput ? 'Hide Sign Camera' : 'Enable Sign Camera Input'}</span>
        </button>
      </div>

      {/* Main 2-Column Tutoring Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tutor Chat Interface */}
        <div className="lg:col-span-7 xl:col-span-8">
          <TutorChat onSignTokenSync={handleSignTokenSync} />
        </div>

        {/* Right Column: 3D Sign Avatar + Optional Camera Feed */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* 3D Sign Avatar Module */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#F28C00]" />
                Live 3D Gesture Output
              </span>
              <span className="text-[11px] font-bold text-[#F28C00]">
                {preferences.preferredSignLanguage || 'ISL'} Kinematics
              </span>
            </div>

            <ThreeAvatar
              activeSignToken={activeAvatarTokens[0] || 'HELLO'}
              signTokens={activeAvatarTokens}
              autoPlay={true}
            />
          </div>

          {/* Collapsible Webcam Sign Recognition Feed */}
          {showCameraInput && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-[#F28C00]" />
                  Webcam Sign Input Feed
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  MediaPipe Active
                </span>
              </div>
              <CameraWorkspace onRecognitionResult={handleCameraRecognition} />
            </div>
          )}

          {/* Inclusive Tutoring Guarantee Card */}
          <div className="p-4 bg-[#FFF0C9]/50 rounded-2xl border-2 border-[#222222] text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#222222]">
              <ShieldCheck className="w-4 h-4 text-[#F28C00]" />
              <span>Universal Accessibility Guarantee</span>
            </div>
            <p className="text-[11px] text-[#666666] leading-relaxed">
              Every AI explanation is calibrated to reduce cognitive fatigue, support screen readers, and provide multi-sensory reinforcement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
