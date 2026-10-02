/**
 * Real Authentication Service — Section 12.2
 *
 * Replaces the mock authService with real Django REST Framework backend calls.
 * Access token is kept strictly in-memory via the apiClient.
 * Refresh token is managed by the backend HttpOnly cookie only.
 *
 * DO NOT import or reference mockDatabase here.
 */

import apiClient, { setAccessToken, clearAccessToken, refreshAccessToken } from './api/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { User, UserRole } from '../types';
import type { TokenResponse } from './api/types';

// ─── Backend Response Shapes ──────────────────────────────────────────────────

interface BackendUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string; // Backend uses 'patient' | 'doctor' | 'hospital' | 'admin'
  avatar?: string;
  doctor_id?: string;
  facility_id?: string;
  facility_type?: string;
  facility_name?: string;
  patient_profile?: object | null;
  date_joined?: string;
}

interface LoginResponse extends TokenResponse {
  user: BackendUser;
}

// ─── Role Normalization ───────────────────────────────────────────────────────

/**
 * Maps backend role strings to frontend UserRole type.
 * Backend uses: patient | doctor | hospital | admin
 * Frontend expects: patient | doctor | hospital | admin
 */
function normalizeRole(backendRole: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    patient: 'patient',
    doctor: 'doctor',
    hospital: 'hospital',
    clinic: 'hospital',   // clinic admins use the 'hospital' portal role in frontend
    admin: 'admin',
  };
  return roleMap[backendRole?.toLowerCase()] || 'patient';
}

/**
 * Normalizes backend user representation to the frontend User interface.
 * Maps snake_case to camelCase and resolves role.
 */
function normalizeUser(backendUser: BackendUser): User {
  return {
    id: String(backendUser.id),
    email: backendUser.email,
    name: backendUser.name,
    role: normalizeRole(backendUser.role),
    phone: backendUser.phone || undefined,
    mobile: backendUser.phone || undefined,
    avatar: backendUser.avatar || undefined,
    hospitalId: backendUser.facility_id || undefined,
    doctorId: backendUser.doctor_id || undefined,
    facility_id: backendUser.facility_id || undefined,
    facility_type: backendUser.facility_type || undefined,
    facility_name: backendUser.facility_name || undefined,
    facilityName: backendUser.facility_name || undefined,
  };
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

let refreshInitialized = false;

export const authService = {
  /**
   * Authenticate with real backend credentials.
   * Stores access token in-memory only.
   * Backend sets HttpOnly refresh cookie automatically.
   */
  async login(email: string, password: string): Promise<User> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      { email: email.toLowerCase().trim(), password },
      { requiresAuth: false, skipRefresh: true }
    );

    if (!response.access || !response.user) {
      throw new Error('Invalid response from authentication server.');
    }

    setAccessToken(response.access);
    return normalizeUser(response.user);
  },

  /**
   * Register a new patient account.
   * Backend enforces role=PATIENT; frontend must not send any role.
   */
  async register(
    name: string,
    email: string,
    password: string,
    phone: string,
    _role?: UserRole // intentionally ignored — backend enforces PATIENT only
  ): Promise<User> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      { name: name.trim(), email: email.toLowerCase().trim(), password, phone: phone.trim() },
      { requiresAuth: false, skipRefresh: true }
    );

    if (!response.access || !response.user) {
      throw new Error('Invalid response from registration server.');
    }

    setAccessToken(response.access);
    return normalizeUser(response.user);
  },

  /**
   * Calls backend logout endpoint (blacklists refresh token).
   * Clears in-memory access token.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(
        API_ENDPOINTS.AUTH.LOGOUT,
        {},
        { requiresAuth: false, skipRefresh: true }
      );
    } catch {
      // Even if logout API call fails, we must still clear local state
    } finally {
      clearAccessToken();
      refreshInitialized = false;
    }
  },

  /**
   * Session restoration on app startup.
   * Uses the HttpOnly refresh cookie (managed by the browser) to attempt
   * silent token refresh. If successful, fetches the authenticated user.
   * Returns null if no valid session exists.
   */
  async getCurrentSession(): Promise<User | null> {
    if (refreshInitialized) {
      return this.getCurrentUser();
    }

    try {
      // Attempt silent token refresh using HttpOnly cookie
      const newToken = await refreshAccessToken();

      if (!newToken) {
        refreshInitialized = true;
        return null;
      }

      refreshInitialized = true;

      // Token restored — now fetch the authenticated user
      return await this.getCurrentUser();
    } catch {
      refreshInitialized = true;
      clearAccessToken();
      return null;
    }
  },

  /**
   * Fetches the currently authenticated user from the backend.
   * Backend is authoritative — never trust a client-supplied identity.
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const backendUser = await apiClient.get<BackendUser>(
        API_ENDPOINTS.AUTH.ME
      );
      return normalizeUser(backendUser);
    } catch {
      clearAccessToken();
      return null;
    }
  },

  /**
   * Validates a facility setup invitation token.
   */
  async validateProviderSetupToken(token: string): Promise<{
    valid: boolean;
    email: string;
    facility_name: string;
    facility_type: string;
  }> {
    return apiClient.post(
      API_ENDPOINTS.AUTH.PROVIDER_SETUP_VALIDATE,
      { token: token.trim() },
      { requiresAuth: false, skipRefresh: true }
    );
  },

  /**
   * Completes provider setup by setting the facility administrator password.
   */
  async completeProviderSetup(
    token: string,
    password: string,
    passwordConfirm: string
  ): Promise<{ success: boolean; message: string; access?: string; user?: User }> {
    const res = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.PROVIDER_SETUP_COMPLETE,
      {
        token: token.trim(),
        password,
        password_confirm: passwordConfirm,
      },
      { requiresAuth: false, skipRefresh: true }
    );
    if (res.access) {
      setAccessToken(res.access);
    }
    const normalized = res.user ? normalizeUser(res.user) : undefined;
    return {
      success: Boolean(res.success),
      message: res.message || 'Setup complete.',
      access: res.access,
      user: normalized,
    };
  },
};

