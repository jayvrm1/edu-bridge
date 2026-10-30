/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CameraWorkspace } from '../../components/sign-language/CameraWorkspace';
import { SignPracticeTrainer } from '../../components/sign-language/SignPracticeTrainer';
import { SignDictionary } from '../../components/sign-language/SignDictionary';
import { ThreeAvatar } from '../../components/avatar/ThreeAvatar';
import { SignRecognitionResult } from '../../types';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Video, BookOpen, Sparkles, History, Volume2, Globe } from 'lucide-react';

interface TranslationRecord {
  id: string;
  sign: string;
  confidence: number;
  time: string;
}

export const SignStudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'camera' | 'practice' | 'avatar' | 'dictionary'>('camera');
  const [history, setHistory] = useState<TranslationRecord[]>([
    { id: '1', sign: 'HELLO', confidence: 0.94, time: '10:14 AM' },
    { id: '2', sign: 'NAMASTE', confidence: 0.91, time: '10:15 AM' },
    { id: '3', sign: 'THANK YOU', confidence: 0.96, time: '10:18 AM' },
  ]);
  const [selectedAvatarSign, setSelectedAvatarSign] = useState<string>('HELLO');
  const [targetLanguage, setTargetLanguage] = useState<'ISL' | 'ASL'>('ISL');

  const { speak } = useAccessibility();

  const handleRecognitionResult = (result: SignRecognitionResult) => {
    const newRecord: TranslationRecord = {
      id: `tr_${Date.now()}`,
      sign: result.sign,
      confidence: result.confidence,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHistory((prev) => [newRecord, ...prev.slice(0, 14)]);
    setSelectedAvatarSign(result.sign);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222]">
              Sign Language Studio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFD966] text-[#222222] border border-[#222222] text-xs font-bold">
              ISL Vision Engine
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5">
            Real-time hand gesture recognition, certified ISL exercises, and 3D avatar kinematic playback
          </p>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-2 bg-[#FFFFFF] p-1 rounded-full border-2 border-[#222222]">
          <span className="text-xs font-bold text-[#666666] pl-2 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-[#F28C00]" /> Dialect:
          </span>
          <button
            onClick={() => setTargetLanguage('ISL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              targetLanguage === 'ISL'
                ? 'bg-[#F28C00] text-white shadow-xs'
                : 'text-[#666666] hover:text-[#222222]'
            }`}
          >
            Indian (ISL)
          </button>
          <button
            onClick={() => setTargetLanguage('ASL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              targetLanguage === 'ASL'
                ? 'bg-[#F28C00] text-white shadow-xs'
                : 'text-[#666666] hover:text-[#222222]'
            }`}
          >
            American (ASL)
          </button>
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b-2 border-[#222222]/15">
        <button
          onClick={() => setActiveTab('camera')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'camera'
              ? 'bg-[#F28C00] text-white border-[#222222] shadow-xs'
              : 'bg-[#FFFFFF] text-[#666666] border-transparent hover:border-[#222222]'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Live Camera Recognition</span>
        </button>

        <button
          onClick={() => setActiveTab('practice')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'practice'
              ? 'bg-[#F28C00] text-white border-[#222222] shadow-xs'
              : 'bg-[#FFFFFF] text-[#666666] border-transparent hover:border-[#222222]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Practice Challenges (+XP)</span>
        </button>

        <button
          onClick={() => setActiveTab('avatar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'avatar'
              ? 'bg-[#F28C00] text-white border-[#222222] shadow-xs'
              : 'bg-[#FFFFFF] text-[#666666] border-transparent hover:border-[#222222]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>3D Avatar Kinematics Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('dictionary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'dictionary'
              ? 'bg-[#F28C00] text-white border-[#222222] shadow-xs'
              : 'bg-[#FFFFFF] text-[#666666] border-transparent hover:border-[#222222]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>ISL Dictionary</span>
        </button>
      </div>

      {/* Tab 1: Live Camera Recognition & Translation History */}
      {activeTab === 'camera' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <CameraWorkspace onRecognitionResult={handleRecognitionResult} />
          </div>

          {/* Right Rail: Translation History & Sign to Speech */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#F28C00]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#222222]">
                    Translation History
                  </h3>
                </div>
                <button
                  onClick={() => setHistory([])}
                  className="text-[10px] text-[#888888] hover:text-[#222222]"
                >
                  Clear
                </button>
              </div>

              <div className="divide-y divide-[#222222]/10 max-h-72 overflow-y-auto space-y-1">
                {history.length === 0 ? (
                  <p className="text-xs text-[#888888] text-center py-6">
                    No signs detected yet. Start the webcam to stream signs!
                  </p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="pt-2 pb-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-extrabold text-[#222222] flex items-center gap-1.5">
                          <span>{item.sign}</span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 rounded">
                            {Math.round(item.confidence * 100)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-[#888888]">{item.time}</span>
                      </div>
                      <button
                        onClick={() => speak(`Recognized sign: ${item.sign}`)}
                        className="p-1.5 rounded-full hover:bg-[#FFE0BD] border border-[#222222]/20 text-[#222222] transition"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick 3D Avatar Preview */}
            <ThreeAvatar activeSignToken={selectedAvatarSign} autoPlay={true} />
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Practice Challenges */}
      {activeTab === 'practice' && (
        <SignPracticeTrainer />
      )}

      {/* Tab 3: 3D Avatar Kinematics Lab */}
      {activeTab === 'avatar' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="p-4 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch">
            <h3 className="text-sm font-bold text-[#222222] mb-1">
              Test Any ISL Phrase in 3D Motion
            </h3>
            <p className="text-xs text-[#666666] mb-3">
              Type keywords to watch the avatar execute joint-angle kinematics with speed regulation.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedAvatarSign}
                onChange={(e) => setSelectedAvatarSign(e.target.value.toUpperCase())}
                placeholder="Enter sign token (e.g. HELLO, THANK YOU, YES, HELP, GOOD, A, B, C)..."
                className="flex-1 px-4 py-2 rounded-xl border-2 border-[#222222] text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
              />
              <button
                onClick={() => setSelectedAvatarSign('THANK YOU')}
                className="px-3 py-2 bg-[#FFF0C9] rounded-xl border-2 border-[#222222] text-xs font-bold hover:bg-[#FFD966] transition"
              >
                Sample
              </button>
            </div>
          </div>

          <ThreeAvatar
            activeSignToken={selectedAvatarSign}
            autoPlay={true}
            className="w-full"
          />
        </div>
      )}

      {/* Tab 4: Sign Dictionary */}
      {activeTab === 'dictionary' && (
        <SignDictionary
          onSelectSign={(sign) => {
            setSelectedAvatarSign(sign);
            setActiveTab('avatar');
          }}
        />
      )}
    </div>
  );
};
