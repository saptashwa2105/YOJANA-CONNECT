export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_USER_KEY = "auth_user";

// Client-side cookie helpers
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match ? decodeURIComponent(match[3]) : null;
}

export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// Subscription listeners for auth store synchronization
const authListeners = new Set<() => void>();

export function subscribeAuth(callback: () => void) {
  authListeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    authListeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

export function notifyAuthChanged() {
  authListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener errors
    }
  });
}

let cachedUserRaw: string | null = null;
let cachedUserObj: User | null = null;

// Client-side storage helpers
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw === cachedUserRaw) {
      return cachedUserObj;
    }
    cachedUserRaw = raw;
    cachedUserObj = raw ? JSON.parse(raw) : null;
    return cachedUserObj;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY) || getCookie(AUTH_TOKEN_KEY);
}

export function setStoredSession(token: string, user: User, rememberMe = true) {
  if (typeof window === "undefined") return;
  const days = rememberMe ? 30 : 1;
  setCookie(AUTH_TOKEN_KEY, token, days);
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  cachedUserRaw = JSON.stringify(user);
  cachedUserObj = user;
  notifyAuthChanged();
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  deleteCookie(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  cachedUserRaw = null;
  cachedUserObj = null;
  notifyAuthChanged();
}

/**
 * BACKEND INTEGRATION PLACEHOLDERS
 * 
 * Replace or configure these handlers when connecting your production backend.
 * By default, this dispatches to the local Next.js `/api/auth/*` routes, which
 * validates credentials and sets secure session cookies.
 */

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data: AuthResponse = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Authentication failed. Please check your credentials.",
      };
    }

    if (data.token && data.user) {
      setStoredSession(data.token, data.user, credentials.rememberMe ?? true);
    }

    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error. Please try again.";
    return {
      success: false,
      error: message,
    };
  }
}

export async function registerApi(credentials: RegisterCredentials): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data: AuthResponse = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Registration failed. Please try again.",
      };
    }

    if (data.token && data.user) {
      setStoredSession(data.token, data.user, true);
    }

    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error. Please try again.";
    return {
      success: false,
      error: message,
    };
  }
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  } catch {
    // Ignore network failure on logout
  } finally {
    clearStoredSession();
  }
}

export async function googleSignInApi(): Promise<AuthResponse> {
  // Backend OAuth placeholder: Connect to live OAuth provider when ready
  const mockUser: User = {
    id: "usr_google_" + Math.random().toString(36).substring(2, 9),
    name: "Google Citizen",
    email: "citizen.google@gmail.com",
  };
  const mockToken = `jwt_oauth_google_${Date.now()}`;
  setStoredSession(mockToken, mockUser, true);
  return { success: true, token: mockToken, user: mockUser };
}

export async function githubSignInApi(): Promise<AuthResponse> {
  // Backend OAuth placeholder: Connect to live OAuth provider when ready
  const mockUser: User = {
    id: "usr_github_" + Math.random().toString(36).substring(2, 9),
    name: "GitHub Citizen",
    email: "citizen.dev@github.com",
  };
  const mockToken = `jwt_oauth_github_${Date.now()}`;
  setStoredSession(mockToken, mockUser, true);
  return { success: true, token: mockToken, user: mockUser };
}

export async function magicLinkApi(email: string): Promise<AuthResponse> {
  // Backend Magic Link placeholder: Connect to live magic link endpoint
  const mockUser: User = {
    id: "usr_magic_" + Math.random().toString(36).substring(2, 9),
    name: email.split("@")[0].replace(/[._]/g, " "),
    email: email.trim().toLowerCase(),
  };
  const mockToken = `jwt_magic_${Date.now()}`;
  setStoredSession(mockToken, mockUser, true);
  return { success: true, token: mockToken, user: mockUser };
}
