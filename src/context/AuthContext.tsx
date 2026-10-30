/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AccessibilityPreferences, AccessibilityNeed } from '../types';
import { authService } from '../services/api/authService';
import { INITIAL_USER } from '../services/api/mockData';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password?: string, needs?: AccessibilityNeed[]) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: Partial<AccessibilityPreferences>) => Promise<void>;
  switchDemoProfile: (profile: 'maya' | 'alex' | 'samira') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PROFILES: Record<'maya' | 'alex' | 'samira', User> = {
  maya: {
    ...INITIAL_USER,
    id: 'usr_maya',
    name: 'Maya Patel',
    email: 'maya@edubridge.ai',
    level: 4,
    levelTitle: 'Intermediate Signer',
    xp: 2450,
    streakDays: 7,
    globalRank: 12,
    preferences: {
      ...INITIAL_USER.preferences,
      needs: ['hearing_impairment'],
      captionsEnabled: true,
      preferredSignLanguage: 'ISL',
    },
  },
  alex: {
    ...INITIAL_USER,
    id: 'usr_alex',
    name: 'Alex Rivera',
    email: 'alex@edubridge.ai',
    level: 3,
    levelTitle: 'AAC Explorer',
    xp: 1820,
    streakDays: 5,
    globalRank: 24,
    preferences: {
      ...INITIAL_USER.preferences,
      needs: ['speech_impairment'],
      aacEnabled: true,
      voiceInteractionEnabled: true,
      preferredSignLanguage: 'ISL',
    },
  },
  samira: {
    ...INITIAL_USER,
    id: 'usr_samira',
    name: 'Samira Sen',
    email: 'samira@edubridge.ai',
    level: 5,
    levelTitle: 'High-Contrast Scholar',
    xp: 3200,
    streakDays: 12,
    globalRank: 8,
    preferences: {
      ...INITIAL_USER.preferences,
      needs: ['visual_impairment'],
      highContrast: true,
      textSize: 'large',
      screenReaderOptimized: true,
      audioDescriptions: true,
    },
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setUser(INITIAL_USER);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password = 'password123') => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password = 'password123',
    needs: AccessibilityNeed[] = ['none']
  ) => {
    setLoading(true);
    try {
      const response = await authService.register(name, email, password, needs);
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (prefs: Partial<AccessibilityPreferences>) => {
    if (!user) return;
    try {
      const updatedUser = await authService.updatePreferences(prefs);
      setUser(updatedUser);
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  const switchDemoProfile = (profile: 'maya' | 'alex' | 'samira') => {
    const target = DEMO_PROFILES[profile];
    setUser(target);
    localStorage.setItem('edubridge_user_profile', JSON.stringify(target));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updatePreferences,
        switchDemoProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
