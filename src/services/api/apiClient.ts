/**
 * MeetAdr Reusable API Client.
 *
 * Implements:
 * - Strictly in-memory access token storage (no localStorage / sessionStorage / cookies in JS)
 * - Automatic Authorization header injection for authenticated requests
 * - HttpOnly cookie-based refresh with single-flight mutex
 * - Infinite loop prevention (max 1 retry per request)
 * - Safe JSON and non-JSON error normalization
 * - Comprehensive HTTP verbs (GET, POST, PUT, PATCH, DELETE)
 */

import { buildApiUrl, API_ENDPOINTS } from '../../config/api';
import { ApiError, type ApiErrorPayload, type HttpMethod, type RequestOptions } from './types';

// ============================================================================
// 1. In-Memory Access Token Storage
// ============================================================================

/**
 * Access token is held strictly in JavaScript module memory.
 * Never written to localStorage, sessionStorage, IndexedDB, or document.cookie.
 */
let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  if (token && typeof token === 'string' && token.trim()) {
    inMemoryAccessToken = token.trim();
  } else {
    inMemoryAccessToken = null;
  }
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function clearAccessToken(): void {
  inMemoryAccessToken = null;
}

// ============================================================================
// 1.5 CSRF Cookie Helper
// ============================================================================

/**
 * Extracts Django's csrftoken from document.cookie (standard non-HttpOnly CSRF cookie).
 * Used for cookie-based mutating requests without exposing refresh/auth secrets.
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ============================================================================
// 2. Refresh Mutex / Single-Flight Promise
// ============================================================================

let refreshPromise: Promise<string | null> | null = null;

/**
 * Performs a single-flight token refresh against the Django backend.
 * Uses credentials: 'include' so the HttpOnly refresh cookie is sent by the browser.
 * Multiple concurrent 401s coalesce into this single promise.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshUrl = buildApiUrl(API_ENDPOINTS.AUTH.REFRESH);
      const refreshHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      const csrf = getCsrfToken();
      if (csrf) {
        refreshHeaders['X-CSRFToken'] = csrf;
      }

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: refreshHeaders,
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        clearAccessToken();
        return null;
      }

      const data = (await parseResponseBody(response)) as { access?: string } | null;
      if (data && typeof data.access === 'string' && data.access.trim()) {
        const newAccessToken = data.access.trim();
        setAccessToken(newAccessToken);
        return newAccessToken;
      }

      clearAccessToken();
      return null;
    } catch {
      clearAccessToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ============================================================================
// 3. Response Parsing & Error Normalization
// ============================================================================

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

function normalizeError(response: Response, data: unknown): ApiError {
  let message = '';
  let fieldErrors: Record<string, string[] | string> | undefined;

  if (data && typeof data === 'object') {
    const payload = data as ApiErrorPayload;

    if (payload.detail && typeof payload.detail === 'string') {
      message = payload.detail;
    } else if (payload.message && typeof payload.message === 'string') {
      message = payload.message;
    } else if (payload.error && typeof payload.error === 'string') {
      message = payload.error;
    } else if (Array.isArray(payload.non_field_errors) && payload.non_field_errors.length > 0) {
      message = String(payload.non_field_errors[0]);
    }

    // Extract field-level validation errors
    const potentialFields: Record<string, string[] | string> = {};
    let foundFields = false;

    for (const [key, val] of Object.entries(payload)) {
      if (['detail', 'message', 'error', 'non_field_errors'].includes(key)) {
        continue;
      }
      if (Array.isArray(val) && val.every((item) => typeof item === 'string')) {
        potentialFields[key] = val;
        foundFields = true;
      } else if (typeof val === 'string') {
        potentialFields[key] = val;
        foundFields = true;
      }
    }

    if (foundFields) {
      fieldErrors = potentialFields;
      if (!message) {
        const firstField = Object.keys(potentialFields)[0];
        const firstError = Array.isArray(potentialFields[firstField])
          ? potentialFields[firstField][0]
          : potentialFields[firstField];
        message = `${firstField}: ${firstError}`;
      }
    }
  } else if (typeof data === 'string' && data.length < 200 && !data.trim().startsWith('<')) {
    message = data.trim();
  }

  if (!message) {
    switch (response.status) {
      case 400:
        message = 'The request was invalid. Please check your input.';
        break;
      case 401:
        message = 'Authentication required. Please log in.';
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 409:
        message = 'A conflict occurred. The resource may already exist or has changed.';
        break;
      case 422:
        message = 'Unprocessable entity. Please verify submitted details.';
        break;
      case 429:
        message = 'Too many requests. Please wait a moment and try again.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        message = 'A server error occurred. Our team has been notified.';
        break;
      default:
        message = response.statusText || 'An unexpected error occurred.';
    }
  }

  return new ApiError({
    message,
    status: response.status,
    statusText: response.statusText,
    data,
    fieldErrors,
    isNetworkError: false,
  });
}

// ============================================================================
// 4. Core Request Dispatcher
// ============================================================================

export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions & { method?: HttpMethod } = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    params,
    requiresAuth = true,
    skipRefresh = false,
    isRetry = false,
    timeoutMs,
    headers: customHeaders = {},
    credentials = 'include',
    ...restInit
  } = options;

  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : buildApiUrl(endpoint, params);

  const headers = new Headers(customHeaders);

  // Default Accept
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Attach Authorization header if authenticated and token exists
  if (requiresAuth !== false && inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  // Attach CSRF header for state-mutating requests (POST, PUT, PATCH, DELETE)
  const upperMethod = method.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(upperMethod) && !headers.has('X-CSRFToken')) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }
  }

  // Serialize JSON body if appropriate
  let formattedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      formattedBody = body;
      // Let browser set the correct multipart/form-data boundary
      headers.delete('Content-Type');
    } else if (typeof body === 'string') {
      formattedBody = body;
    } else {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      formattedBody = JSON.stringify(body);
    }
  }

  // Optional timeout via AbortController
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  if (timeoutMs && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restInit,
      method,
      headers,
      body: formattedBody,
      credentials,
      signal: timeoutMs ? controller.signal : restInit.signal,
    });
  } catch (error: unknown) {
    if (timeoutId) clearTimeout(timeoutId);

    const isAbort = error instanceof DOMException && error.name === 'AbortError';
    throw new ApiError({
      message: isAbort
        ? 'Request timed out. Please try again.'
        : 'Network connection failed. Please check your internet connection.',
      status: 0,
      statusText: isAbort ? 'Timeout' : 'Network Error',
      isNetworkError: true,
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  // 401 Handling & Refresh Interceptor
  if (response.status === 401 && !skipRefresh && !isRetry) {
    // Only attempt refresh if not already retried and not a refresh request itself
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry original request exactly ONCE with new access token
      return request<T>(endpoint, {
        ...options,
        isRetry: true,
      });
    }
  }

  const responseData = await parseResponseBody(response);

  if (!response.ok) {
    throw normalizeError(response, responseData);
  }

  return responseData as T;
}

// ============================================================================
// 5. Convenience HTTP Verbs
// ============================================================================

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  request,
  setAccessToken,
  getAccessToken,
  clearAccessToken,
  refreshAccessToken,
};

export default apiClient;
