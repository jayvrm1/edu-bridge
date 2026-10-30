/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccessibilityPreferences, AccessibilityNeed } from '../types';
import { useAuth } from './AuthContext';

interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void;
  toggleNeed: (need: AccessibilityNeed) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  announcement: string;
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updatePreferences } = useAuth();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    user?.preferences || {
      needs: ['hearing_impairment'],
      captionsEnabled: true,
      captionSize: 'medium',
      textSize: 'normal',
      highContrast: false,
      reducedMotion: false,
      screenReaderOptimized: false,
      voiceInteractionEnabled: true,
      speechRate: 1.0,
      preferredSignLanguage: 'ISL',
      avatarEnabled: true,
      avatarSpeed: 1.0,
      aacEnabled: true,
      audioDescriptions: true,
    }
  );

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>('');

  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences);
    }
  }, [user]);

  // Sync to HTML element classes and attributes
  useEffect(() => {
    const root = document.documentElement;

    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (preferences.textSize === 'large') {
      root.setAttribute('data-text-size', 'large');
    } else if (preferences.textSize === 'xlarge') {
      root.setAttribute('data-text-size', 'xlarge');
    } else {
      root.removeAttribute('data-text-size');
    }

    if (preferences.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [preferences.highContrast, preferences.textSize, preferences.reducedMotion]);

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    updatePreferences({ [key]: value });
  };

  const toggleNeed = (need: AccessibilityNeed) => {
    const currentNeeds = [...preferences.needs];
    const exists = currentNeeds.includes(need);
    const updatedNeeds = exists
      ? currentNeeds.filter((n) => n !== need)
      : [...currentNeeds.filter((n) => n !== 'none'), need];

    const finalNeeds = updatedNeeds.length === 0 ? (['none'] as AccessibilityNeed[]) : updatedNeeds;
    updatePreference('needs', finalNeeds);
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Strip emojis for screen clarity
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = preferences.speechRate || 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const announce = (message: string) => {
    setAnnouncement(message);
    const timer = setTimeout(() => setAnnouncement(''), 3000);
    return () => clearTimeout(timer);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        preferences,
        updatePreference,
        toggleNeed,
        speak,
        stopSpeaking,
        isSpeaking,
        announcement,
        announce,
      }}
    >
      {children}
      {/* Live region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
