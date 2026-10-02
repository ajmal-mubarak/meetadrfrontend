/**
 * Core API Types & Error Representations.
 *
 * Provides reusable structures for paginated responses, token exchanges,
 * request configuration, and normalized API error handling.
 */

/**
 * Standard Django REST Framework paginated response envelope.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Authentication token response from backend login/refresh/register endpoints.
 */
export interface TokenResponse {
  access: string;
  refresh?: string;
}

/**
 * Backend raw error payload structure.
 */
export interface ApiErrorPayload {
  detail?: string;
  message?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
  non_field_errors?: string[];
  [key: string]: unknown;
}

/**
 * Normalized API Error class.
 *
 * Extracts meaningful messages, field validation errors, and HTTP status codes
 * without leaking sensitive backend stack traces or internal implementation details.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly data?: unknown;
  readonly fieldErrors?: Record<string, string[] | string>;
  readonly isNetworkError: boolean;

  constructor(params: {
    message: string;
    status: number;
    statusText?: string;
    data?: unknown;
    fieldErrors?: Record<string, string[] | string>;
    isNetworkError?: boolean;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.statusText = params.statusText || '';
    this.data = params.data;
    this.fieldErrors = params.fieldErrors;
    this.isNetworkError = Boolean(params.isNetworkError);

    // Maintains proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isForbiddenError(): boolean {
    return this.status === 403;
  }

  get isNotFoundError(): boolean {
    return this.status === 404;
  }

  get isConflictError(): boolean {
    return this.status === 409;
  }

  get isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Supported HTTP methods.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/**
 * Request options passed to the API client methods.
 */
export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  requiresAuth?: boolean;
  skipRefresh?: boolean; // Prevents recursive refresh calls on the refresh endpoint itself
  isRetry?: boolean;     // Internal flag to enforce a single automatic refresh retry
  timeoutMs?: number;    // Request timeout in milliseconds
}
