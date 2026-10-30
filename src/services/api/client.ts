/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiConfig } from './config';

export class ApiError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const TOKEN_KEY = 'edubridge_auth_token';
const REFRESH_TOKEN_KEY = 'edubridge_refresh_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string): void => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

interface RequestOptions extends RequestInit {
  fallbackHandler?: () => any;
  timeoutMs?: number;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { fallbackHandler, timeoutMs = 6000, ...fetchOptions } = options;
  const baseUrl = apiConfig.getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  const token = tokenStorage.get();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const mode = apiConfig.getMode();

  // If in pure fallback mode or if we know it's offline and fallback exists, run fallback
  if (mode === 'fallback_auto' && fallbackHandler) {
    const config = apiConfig.getConfig();
    if (config.status === 'offline') {
      try {
        return await Promise.resolve(fallbackHandler());
      } catch (e) {
        console.warn('Fallback error, attempting real call:', e);
      }
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.ok) {
      // successful response
      return (await response.json()) as T;
    }

    // If HTTP error code
    let errorDetails: any = null;
    try {
      errorDetails = await response.json();
    } catch {
      // ignore
    }

    // If mode is fallback_auto and fallback handler provided, recover gracefully
    if (fallbackHandler && (response.status === 404 || response.status >= 500)) {
      console.warn(`[FastAPI Integration] ${endpoint} returned ${response.status}. Using high-fidelity fallback.`);
      return await Promise.resolve(fallbackHandler());
    }

    throw new ApiError(
      errorDetails?.detail || errorDetails?.message || `Request failed with status ${response.status}`,
      response.status,
      errorDetails
    );
  } catch (err: any) {
    clearTimeout(timer);

    if (fallbackHandler) {
      console.info(`[FastAPI Integration] Connection to ${url} unavailable. Seamlessly using accessible local fallback.`);
      return await Promise.resolve(fallbackHandler());
    }

    if (err.name === 'AbortError') {
      throw new ApiError(`Request timeout after ${timeoutMs}ms`, 408);
    }
    throw new ApiError(err.message || 'Network error connecting to FastAPI backend', 0);
  }
}
