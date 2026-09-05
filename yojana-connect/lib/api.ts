import { getAuthSessionToken } from "./supabase";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

export interface SchemeDto {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits?: string | string[] | Record<string, unknown>;
  eligibility?: string | string[] | Record<string, unknown>;
  documents?: string | string[];
  applicationProcess?: string;
  officialUrl?: string;
  sourceUrl?: string;
  tags?: string[];
  state?: string;
}

export interface RecommendationItem {
  scheme: SchemeDto;
  matchScore: number;
  eligible: boolean;
  matchReasons: string[];
  whyEligible: string;
  tags: string[];
  isBookmarked: boolean;
}

export interface RecommendationsResponse {
  success: boolean;
  count: number;
  data: RecommendationItem[];
  error?: string;
  fallback?: boolean;
}

export interface BookmarkItem {
  id: number;
  userId: number;
  schemeId: string;
  createdAt: string;
  scheme?: SchemeDto;
}

export interface BookmarksResponse {
  success: boolean;
  count: number;
  data: BookmarkItem[];
  error?: string;
}

export interface ProfileData {
  id: number;
  age?: number | null;
  state?: string | null;
  occupation?: string | null;
  annualIncome?: number | null;
  language?: string;
  bookmarkedSchemeIds?: string[];
  bookmarkCount?: number;
  bookmarks?: BookmarkItem[];
}

export interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  error?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSource {
  schemeId: string;
  title: string;
  url?: string;
  section?: string;
}

export interface ChatRequestPayload {
  message: string;
  language?: string;
  schemeId?: string | null;
  profile?: {
    age?: number;
    state?: string;
    occupation?: string;
  } | null;
  conversation?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  language?: string;
  sources?: ChatSource[];
  schemes?: string[];
  fallback?: boolean;
  error?: string;
}

/**
 * Standard HTTP fetch helper with automatic Bearer token injection and JSON parsing
 */
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const token = await getAuthSessionToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

    const res = await fetch(url, {
      ...options,
      headers,
    });

    let data: T | null = null;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    }

    if (!res.ok) {
      const errMsg =
        (data as Record<string, unknown>)?.message ||
        (data as Record<string, unknown>)?.error ||
        `HTTP ${res.status}: ${res.statusText}`;
      return { ok: false, status: res.status, data, error: String(errMsg) };
    }

    return { ok: true, status: res.status, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    console.warn(`[API] fetchWithAuth failed for ${endpoint}:`, message);
    return { ok: false, status: 0, data: null, error: message };
  }
}

/**
 * 1. Fetch Dynamic Scheme Recommendations
 */
export async function fetchRecommendations(
  criteria: {
    age?: string | number;
    occupation?: string;
    state?: string;
    annualIncome?: string | number;
    income?: string | number;
    eligibleOnly?: boolean;
    minScore?: number;
  } = {}
): Promise<RecommendationsResponse> {
  try {
    const params = new URLSearchParams();
    if (criteria.age !== undefined && criteria.age !== "") {
      params.set("age", String(criteria.age));
    }
    if (criteria.occupation) {
      params.set("occupation", criteria.occupation);
    }
    if (criteria.state) {
      params.set("state", criteria.state);
    }
    const inc = criteria.annualIncome || criteria.income;
    if (inc !== undefined && inc !== "") {
      params.set("annualIncome", String(inc));
    }
    if (criteria.eligibleOnly !== undefined) {
      params.set("eligibleOnly", String(criteria.eligibleOnly));
    }
    if (criteria.minScore !== undefined) {
      params.set("minScore", String(criteria.minScore));
    }

    const endpoint = `/recommendations?${params.toString()}`;
    const result = await fetchWithAuth<RecommendationsResponse>(endpoint, {
      method: "GET",
    });

    if (result.ok && result.data && Array.isArray(result.data.data)) {
      return result.data;
    }

    return {
      success: false,
      count: 0,
      data: [],
      error: result.error || "Failed to retrieve recommendations",
      fallback: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching recommendations";
    return {
      success: false,
      count: 0,
      data: [],
      error: message,
      fallback: true,
    };
  }
}

/**
 * 2. Fetch User Bookmarks
 */
export async function fetchBookmarks(): Promise<BookmarksResponse> {
  try {
    const result = await fetchWithAuth<BookmarksResponse>("/bookmarks", {
      method: "GET",
    });

    if (result.ok && result.data && Array.isArray(result.data.data)) {
      return result.data;
    }

    return {
      success: false,
      count: 0,
      data: [],
      error: result.error || "Failed to load bookmarks",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching bookmarks";
    return {
      success: false,
      count: 0,
      data: [],
      error: message,
    };
  }
}

/**
 * 3. Add a Bookmark
 */
export async function addBookmarkApi(schemeId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const result = await fetchWithAuth<{ success: boolean; message?: string }>(`/bookmarks/${encodeURIComponent(schemeId)}`, {
      method: "POST",
    });

    if (result.ok) {
      return { success: true, message: result.data?.message || "Scheme bookmarked" };
    }

    // 409 means already bookmarked, which is technically success for UI
    if (result.status === 409) {
      return { success: true, message: "Already bookmarked" };
    }

    return { success: false, error: result.error || "Failed to save bookmark" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving bookmark";
    return { success: false, error: message };
  }
}

/**
 * 4. Remove a Bookmark
 */
export async function removeBookmarkApi(schemeId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const result = await fetchWithAuth<{ success: boolean; message?: string }>(`/bookmarks/${encodeURIComponent(schemeId)}`, {
      method: "DELETE",
    });

    if (result.ok) {
      return { success: true, message: result.data?.message || "Bookmark removed" };
    }

    return { success: false, error: result.error || "Failed to remove bookmark" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error removing bookmark";
    return { success: false, error: message };
  }
}

/**
 * 5. Fetch User Profile
 */
export async function fetchUserProfile(): Promise<ProfileResponse> {
  try {
    const result = await fetchWithAuth<ProfileResponse>("/profile", {
      method: "GET",
    });

    if (result.ok && result.data) {
      return result.data;
    }

    return { success: false, error: result.error || "Failed to load profile" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching profile";
    return { success: false, error: message };
  }
}

/**
 * 6. Update User Profile
 */
export async function updateUserProfile(data: Partial<ProfileData>): Promise<ProfileResponse> {
  try {
    const result = await fetchWithAuth<ProfileResponse>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (result.ok && result.data) {
      return result.data;
    }

    return { success: false, error: result.error || "Failed to update profile" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating profile";
    return { success: false, error: message };
  }
}

/**
 * 7. Send Chat Message to AI Assistant
 */
export async function sendChatMessage(payload: ChatRequestPayload): Promise<ChatResponse> {
  try {
    const result = await fetchWithAuth<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (result.ok && result.data && result.data.answer) {
      return result.data;
    }

    // Return safe fallback message if downstream AI service is offline
    return {
      answer:
        "The AI assistant is temporarily operating in offline mode. Please check official portals (such as pmkisan.gov.in or pmjay.gov.in) for details.",
      language: payload.language || "en",
      sources: [],
      schemes: payload.schemeId ? [payload.schemeId] : [],
      fallback: true,
      error: result.error,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chat service network error";
    return {
      answer:
        "Could not connect to the assistant. Please verify your internet connection or check official government resources.",
      language: payload.language || "en",
      sources: [],
      fallback: true,
      error: message,
    };
  }
}

/**
 * 8. Backend Diagnostic Health Check
 */
export async function checkBackendHealth(): Promise<{ status: string; database?: boolean; aiReady?: boolean }> {
  try {
    const result = await fetchWithAuth<{ status: string; checks?: { database?: boolean; aiService?: boolean } }>("/health", {
      method: "GET",
    });

    if (result.ok && result.data) {
      return {
        status: result.data.status || "healthy",
        database: result.data.checks?.database ?? true,
        aiReady: result.data.checks?.aiService ?? true,
      };
    }

    return { status: "unreachable", database: false, aiReady: false };
  } catch {
    return { status: "error", database: false, aiReady: false };
  }
}

