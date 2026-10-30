/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AccessibilityNeed } from '../../types';
import { Mascot } from '../../components/common/Mascot';
import {
  Mail,
  Lock,
  User as UserIcon,
  Check,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

export const AuthPage: React.FC<{ onAuthenticated?: () => void }> = ({ onAuthenticated }) => {
  const { login, register, switchDemoProfile } = useAuth();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [step, setStep] = useState<'credentials' | 'accommodations'>('credentials');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedNeeds, setSelectedNeeds] = useState<AccessibilityNeed[]>(['hearing_impairment']);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const needsOptions: { id: AccessibilityNeed; label: string; icon: string; desc: string }[] = [
    {
      id: 'hearing_impairment',
      label: 'Hearing Impairment / D/deaf',
      icon: '🤟',
      desc: 'ISL 3D sign avatar, synchronized live captions, and visual alerts.',
    },
    {
      id: 'visual_impairment',
      label: 'Visual Impairment / Low Vision',
      icon: '👁️',
      desc: 'Large high-contrast text sizing, screen-reader descriptions, and audio narration.',
    },
    {
      id: 'speech_impairment',
      label: 'Speech Impairment / Non-Speaking',
      icon: '💬',
      desc: 'Interactive AAC phrase boards, sign camera input, and voice synthesizer.',
    },
    {
      id: 'adhd_cognitive',
      label: 'ADHD & Focus Accommodations',
      icon: '🧠',
      desc: 'Step-by-step lesson mode, break reminders, and clutter-free interface.',
    },
    {
      id: 'motor_mobility',
      label: 'Motor & Keyboard Navigation',
      icon: '⌨️',
      desc: 'Large click targets, full keyboard accessibility, and switch control.',
    },
  ];

  const toggleNeed = (need: AccessibilityNeed) => {
    setSelectedNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    try {
      await login(email || 'maya@edubridge.ai', password || 'password123');
      if (onAuthenticated) onAuthenticated();
    } catch (err: any) {
      setStatusMessage(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setStep('accommodations');
  };

  const handleCompleteRegistration = async () => {
    setLoading(true);
    try {
      await register(name, email, password || 'password123', selectedNeeds);
      if (onAuthenticated) onAuthenticated();
    } catch (err: any) {
      setStatusMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('Password reset instructions have been dispatched to your email.');
  };

  return (
    <div className="min-h-screen bg-[#F1F1F1] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl border-2 border-[#222222] shadow-stitch p-6 sm:p-8 space-y-6">
        {/* Brand Header & Mascot */}
        <div className="text-center space-y-2">
          <Mascot expression="greeting" size={68} className="mx-auto" />
          <div className="text-xl font-extrabold text-[#222222] tracking-tight">
            EduBridge <span className="text-[#F28C00]">AI</span>
          </div>
          <p className="text-xs text-[#666666] font-medium">
            Learning Without Communication Barriers
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        {authMode !== 'forgot' && (
          <div className="flex bg-[#F1F1F1] p-1 rounded-full border-2 border-[#222222]">
            <button
              onClick={() => {
                setAuthMode('login');
                setStep('credentials');
              }}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition ${
                authMode === 'login'
                  ? 'bg-[#F28C00] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#222222]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setStep('credentials');
              }}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition ${
                authMode === 'register'
                  ? 'bg-[#F28C00] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#222222]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className="p-3 bg-[#FFF0C9] border-2 border-[#222222] rounded-xl text-xs font-semibold text-[#222222] animate-slide-up">
            {statusMessage}
          </div>
        )}

        {/* Form 1: LOGIN */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maya@edubridge.ai"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-[#222222] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#222222] uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-[11px] font-bold text-[#F28C00] hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-[#222222] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] shadow-xs transition"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>
        )}

        {/* Form 2: REGISTRATION - Step 1: Credentials */}
        {authMode === 'register' && step === 'credentials' && (
          <form onSubmit={handleRegisterCredentials} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wide">
                Your Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Maya Patel"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-[#222222] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maya@inclusive.learn"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-[#222222] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wide">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-[#222222] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <span>Next: Select Accommodations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Form 2: REGISTRATION - Step 2: Inclusive Onboarding (No Medical Documentation Required) */}
        {authMode === 'register' && step === 'accommodations' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#F28C00]">
                Step 2 of 2: Barrier-Free Onboarding
              </span>
              <h3 className="text-sm font-bold text-[#222222]">
                Select Any Communication Needs
              </h3>
              <p className="text-[11px] text-[#666666]">
                No medical paperwork needed. We adapt the lessons, avatars, and audio to you immediately.
              </p>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {needsOptions.map((opt) => {
                const isSelected = selectedNeeds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleNeed(opt.id)}
                    className={`w-full p-2.5 rounded-xl border-2 text-left transition flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#FFF0C9] border-[#222222] shadow-xs'
                        : 'bg-[#F1F1F1] hover:bg-[#FFE0BD]/30 border-transparent'
                    }`}
                  >
                    <span className="text-xl shrink-0">{opt.icon}</span>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-xs font-bold text-[#222222] flex items-center justify-between">
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#F28C00]" />}
                      </div>
                      <p className="text-[10px] text-[#666666] truncate">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setStep('credentials')}
                className="px-4 py-2 bg-white text-[#222222] rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#F1F1F1] transition"
              >
                Back
              </button>
              <button
                onClick={handleCompleteRegistration}
                disabled={loading}
                className="flex-1 py-2 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] shadow-xs transition"
              >
                {loading ? 'Creating Profile...' : 'Complete & Enter App'}
              </button>
            </div>
          </div>
        )}

        {/* Form 3: FORGOT PASSWORD */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#222222]">
                Reset Account Password
              </h3>
              <p className="text-xs text-[#666666]">
                Enter your account email to receive accessible password reset steps.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#222222] uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maya@edubridge.ai"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-[#222222] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="px-4 py-2 bg-white text-[#222222] rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#F1F1F1] transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] shadow-xs transition"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        )}

        {/* Quick Demo Instant-Launch Persona Strip (For evaluators) */}
        <div className="pt-4 border-t border-[#222222]/15 space-y-2">
          <div className="text-[10px] font-bold uppercase text-[#888888] tracking-wider text-center">
            Instant Demo Logins (Click to Evaluate)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                switchDemoProfile('maya');
                if (onAuthenticated) onAuthenticated();
              }}
              className="p-2 rounded-xl bg-[#FFF0C9] border border-[#222222] hover:bg-[#FFD966] text-left transition text-[11px]"
            >
              <div className="font-extrabold text-[#222222]">🤟 Maya</div>
              <div className="text-[9px] text-[#666666]">Hearing Needs</div>
            </button>
            <button
              onClick={() => {
                switchDemoProfile('alex');
                if (onAuthenticated) onAuthenticated();
              }}
              className="p-2 rounded-xl bg-[#D9EAFB] border border-[#222222] hover:bg-[#b8c8d9] text-left transition text-[11px]"
            >
              <div className="font-extrabold text-[#222222]">💬 Alex</div>
              <div className="text-[9px] text-[#666666]">Speech/AAC</div>
            </button>
            <button
              onClick={() => {
                switchDemoProfile('samira');
                if (onAuthenticated) onAuthenticated();
              }}
              className="p-2 rounded-xl bg-[#F6C4C4] border border-[#222222] hover:bg-[#e7b2b2] text-left transition text-[11px]"
            >
              <div className="font-extrabold text-[#222222]">👁️ Samira</div>
              <div className="text-[9px] text-[#666666]">Visual Needs</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
