/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BackendConfig {
  baseUrl: string;
  isCustom: boolean;
  status: 'connected' | 'offline' | 'checking' | 'error';
  lastChecked: number | null;
  mode: 'real' | 'fallback_auto';
  latencyMs?: number;
}

const STORAGE_KEY = 'edubridge_api_base_url';
const MODE_STORAGE_KEY = 'edubridge_api_mode';

export const DEFAULT_API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiConfigManager {
  private static instance: ApiConfigManager;
  private currentBaseUrl: string;
  private currentMode: 'real' | 'fallback_auto';
  private listeners: ((config: BackendConfig) => void)[] = [];
  private status: 'connected' | 'offline' | 'checking' | 'error' = 'checking';
  private lastChecked: number | null = null;
  private latencyMs = 0;

  private constructor() {
    const savedUrl = localStorage.getItem(STORAGE_KEY);
    this.currentBaseUrl = savedUrl || DEFAULT_API_BASE_URL;
    this.currentMode = (localStorage.getItem(MODE_STORAGE_KEY) as any) || 'fallback_auto';
  }

  public static getInstance(): ApiConfigManager {
    if (!ApiConfigManager.instance) {
      ApiConfigManager.instance = new ApiConfigManager();
    }
    return ApiConfigManager.instance;
  }

  public getBaseUrl(): string {
    return this.currentBaseUrl.replace(/\/$/, '');
  }

  public setBaseUrl(url: string): void {
    const trimmed = url.trim().replace(/\/$/, '');
    this.currentBaseUrl = trimmed;
    localStorage.setItem(STORAGE_KEY, trimmed);
    this.checkHealth();
  }

  public resetBaseUrl(): void {
    this.currentBaseUrl = DEFAULT_API_BASE_URL;
    localStorage.removeItem(STORAGE_KEY);
    this.checkHealth();
  }

  public getMode(): 'real' | 'fallback_auto' {
    return this.currentMode;
  }

  public setMode(mode: 'real' | 'fallback_auto'): void {
    this.currentMode = mode;
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    this.notify();
  }

  public getConfig(): BackendConfig {
    return {
      baseUrl: this.getBaseUrl(),
      isCustom: this.currentBaseUrl !== DEFAULT_API_BASE_URL,
      status: this.status,
      lastChecked: this.lastChecked,
      mode: this.currentMode,
      latencyMs: this.latencyMs,
    };
  }

  public subscribe(listener: (config: BackendConfig) => void): () => void {
    this.listeners.push(listener);
    listener(this.getConfig());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const config = this.getConfig();
    for (const listener of this.listeners) {
      try {
        listener(config);
      } catch (err) {
        console.error('Error in config listener:', err);
      }
    }
  }

  public async checkHealth(): Promise<boolean> {
    this.status = 'checking';
    this.notify();

    const startTime = performance.now();
    const primaryUrl = `${this.getBaseUrl()}/health`;
    const fallbackUrl = `${this.getBaseUrl()}/api/v1/health`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      let response = await fetch(primaryUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }).catch(() => null);

      if (!response || !response.ok) {
        response = await fetch(fallbackUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        }).catch(() => null);
      }
      clearTimeout(timeoutId);

      this.latencyMs = Math.round(performance.now() - startTime);

      if (response && response.ok) {
        this.status = 'connected';
        this.lastChecked = Date.now();
        this.notify();
        return true;
      } else {
        // Try fallback check to root or openapi.json
        const fallbackCheck = await fetch(`${this.getBaseUrl()}/openapi.json`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }).catch(() => null);

        if (fallbackCheck && fallbackCheck.ok) {
          this.status = 'connected';
          this.lastChecked = Date.now();
          this.notify();
          return true;
        }

        this.status = 'error';
        this.lastChecked = Date.now();
        this.notify();
        return false;
      }
    } catch {
      this.status = 'offline';
      this.lastChecked = Date.now();
      this.notify();
      return false;
    }
  }
}

export const apiConfig = ApiConfigManager.getInstance();

export const FASTAPI_ENDPOINTS_SPEC = [
  { path: '/health', method: 'GET', description: 'Application & database health check' },
  { path: '/api/v1/auth/register', method: 'POST', description: 'Create learner account with accessibility preferences' },
  { path: '/api/v1/auth/login', method: 'POST', description: 'Authenticate student credentials & issue JWT tokens' },
  { path: '/api/v1/auth/refresh', method: 'POST', description: 'Rotate access tokens securely' },
  { path: '/api/v1/auth/logout', method: 'POST', description: 'Revoke active user authentication session' },
  { path: '/api/v1/users/me', method: 'GET', description: 'Fetch authenticated user profile' },
  { path: '/api/v1/accessibility/preferences', method: 'PUT', description: 'Update accessibility settings & accommodations' },
  { path: '/api/v1/tutor/chat', method: 'POST', description: 'Send multi-modal tutoring message (text, voice, signs, AAC)' },
  { path: '/api/v1/tutor/conversations', method: 'GET', description: 'Retrieve student tutor dialogue history' },
  { path: '/api/v1/sign-language/vocabulary', method: 'GET', description: 'Fetch 39 verified ISL signs and alphabet dictionary' },
  { path: '/api/v1/sign-language/sessions', method: 'POST', description: 'Create real-time sign recognition session' },
  { path: '/api/v1/sign-language/sessions/{session_id}/frames', method: 'POST', description: 'Process webcam video frame to ISL prediction' },
  { path: '/api/v1/avatar/languages', method: 'GET', description: 'Fetch supported 3D avatar sign languages' },
  { path: '/api/v1/avatar/translate', method: 'POST', description: 'Translate text to ISL gloss sequence & timing' },
  { path: '/api/v1/avatar/animation/{sign_id}', method: 'GET', description: 'Retrieve 3D animation token metadata for phrase' },
  { path: '/api/v1/speech/status', method: 'GET', description: 'Inspect TTS & STT speech engine status' },
  { path: '/api/v1/speech/synthesize', method: 'POST', description: 'Convert text to accessible audio narration' },
  { path: '/api/v1/aac/phrases', method: 'GET', description: 'Fetch AAC communication cards and categories' },
  { path: '/api/v1/gamification/profile', method: 'GET', description: 'Fetch full dashboard metrics, streaks, XP, & rank' },
  { path: '/api/v1/gamification/leaderboard', method: 'GET', description: 'Retrieve weekly student leaderboard and podium' },
  { path: '/api/v1/gamification/challenges', method: 'GET', description: 'Fetch daily inclusive learning challenges' },
  { path: '/api/v1/gamification/quiz/submit', method: 'POST', description: 'Submit answers and calculate XP & streak awards' },
];
