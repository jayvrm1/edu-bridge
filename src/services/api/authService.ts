/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, tokenStorage } from './client';
import { AuthResponse, User, AccessibilityPreferences, AccessibilityNeed } from '../../types';
import { INITIAL_USER } from './mockData';

const USER_STORAGE_KEY = 'edubridge_user_profile';

export const authService = {
  async login(email: string, _password: string): Promise<AuthResponse> {
    try {
      const res = await apiClient<any>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username_or_email: email,
          password: _password,
        }),
      });

      if (res?.access_token) {
        tokenStorage.set(res.access_token);
        if (res.refresh_token) {
          tokenStorage.setRefreshToken(res.refresh_token);
        }

        const backendUser = res.user;
        const user: User = {
          ...INITIAL_USER,
          id: backendUser?.id || `usr_${Date.now()}`,
          name: backendUser?.full_name || backendUser?.username || email.split('@')[0],
          email: backendUser?.email || email,
          createdAt: backendUser?.created_at || new Date().toISOString(),
        };

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

        return {
          user,
          tokens: {
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            tokenType: res.token_type || 'bearer',
            expiresIn: res.expires_in || 3600,
          },
        };
      }
      throw new Error('Invalid login response from backend');
    } catch (err) {
      console.warn('[FastAPI Integration] Login endpoint failed or offline. Using local session fallback.');
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      const user: User = saved ? JSON.parse(saved) : { ...INITIAL_USER, email };
      const mockAuth: AuthResponse = {
        user,
        tokens: {
          accessToken: `mock_jwt_token_${Date.now()}`,
          tokenType: 'bearer',
          expiresIn: 3600,
        },
      };
      tokenStorage.set(mockAuth.tokens.accessToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return mockAuth;
    }
  },

  async register(
    name: string,
    email: string,
    _password: string,
    needs: AccessibilityNeed[] = ['none']
  ): Promise<AuthResponse> {
    try {
      const sanitizedUsername = (email.split('@')[0] || 'learner')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .padEnd(3, '1');

      const res = await apiClient<any>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: sanitizedUsername,
          email,
          password: _password,
          full_name: name,
          preferred_language: 'en',
        }),
      });

      if (res?.access_token) {
        tokenStorage.set(res.access_token);
        if (res.refresh_token) {
          tokenStorage.setRefreshToken(res.refresh_token);
        }

        const backendUser = res.user;
        const user: User = {
          ...INITIAL_USER,
          id: backendUser?.id || `usr_${Date.now()}`,
          name: backendUser?.full_name || name,
          email: backendUser?.email || email,
          preferences: {
            ...INITIAL_USER.preferences,
            needs,
          },
          createdAt: backendUser?.created_at || new Date().toISOString(),
        };

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

        // Sync accessibility preferences if custom needs were specified
        if (needs && needs.length > 0 && !needs.includes('none')) {
          this.updatePreferences({ needs }).catch(() => null);
        }

        return {
          user,
          tokens: {
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            tokenType: res.token_type || 'bearer',
            expiresIn: res.expires_in || 3600,
          },
        };
      }
      throw new Error('Invalid registration response from backend');
    } catch (err) {
      console.warn('[FastAPI Integration] Register endpoint offline or failed. Using fallback.');
      const newUser: User = {
        ...INITIAL_USER,
        id: `usr_${Date.now()}`,
        name,
        email,
        xp: 100, // Welcome bonus
        level: 1,
        levelTitle: 'Novice Learner',
        streakDays: 1,
        preferences: {
          ...INITIAL_USER.preferences,
          needs,
        },
        createdAt: new Date().toISOString(),
      };
      const mockAuth: AuthResponse = {
        user: newUser,
        tokens: {
          accessToken: `mock_jwt_token_${Date.now()}`,
          tokenType: 'bearer',
          expiresIn: 3600,
        },
      };
      tokenStorage.set(mockAuth.tokens.accessToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      return mockAuth;
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const res = await apiClient<any>('/api/v1/users/me', {
        method: 'GET',
      });

      if (res?.id) {
        const saved = localStorage.getItem(USER_STORAGE_KEY);
        const existing: User = saved ? JSON.parse(saved) : INITIAL_USER;
        const updated: User = {
          ...existing,
          id: res.id,
          name: res.full_name || res.username || existing.name,
          email: res.email || existing.email,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }
    } catch {
      // ignore
    }

    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(INITIAL_USER));
    return INITIAL_USER;
  },

  async updatePreferences(preferences: Partial<AccessibilityPreferences>): Promise<User> {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    const current: User = saved ? JSON.parse(saved) : INITIAL_USER;
    const updated: User = {
      ...current,
      preferences: {
        ...current.preferences,
        ...preferences,
      },
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));

    try {
      await apiClient<any>('/api/v1/accessibility/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          high_contrast: preferences.highContrast ?? current.preferences.highContrast,
          large_font: preferences.textSize === 'large' || preferences.textSize === 'xlarge',
          font_size: preferences.textSize === 'xlarge' ? 'xlarge' : preferences.textSize === 'large' ? 'large' : 'medium',
          captions_enabled: preferences.captionsEnabled ?? current.preferences.captionsEnabled,
          screen_reader_friendly: preferences.screenReaderOptimized ?? current.preferences.screenReaderOptimized,
          preferred_sign_dialect: preferences.preferredSignLanguage || 'ISL',
          tts_speed: preferences.speechRate || 1.0,
          reduced_motion: preferences.reducedMotion ?? current.preferences.reducedMotion,
          custom_accommodations: {
            needs: preferences.needs || current.preferences.needs,
            avatarEnabled: preferences.avatarEnabled ?? current.preferences.avatarEnabled,
            avatarSpeed: preferences.avatarSpeed ?? current.preferences.avatarSpeed,
            aacEnabled: preferences.aacEnabled ?? current.preferences.aacEnabled,
          },
        }),
      });
    } catch {
      // non-fatal, local storage is already updated
    }

    return updated;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await apiClient('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken || undefined }),
      });
    } catch {
      // ignore
    } finally {
      tokenStorage.clear();
    }
  },
};
