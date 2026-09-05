import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getStoredToken, getStoredUser, User } from "./auth";

// Public Supabase configuration from environment variables or mock fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-yojana.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key-yojana-connect-hackathon";

let supabaseClient: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase client instance.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseClient;
}

export const supabase = getSupabase();

/**
 * Extracts active auth session token.
 * 1. Checks Supabase session via supabase.auth.getSession()
 * 2. Falls back to stored token in localStorage / cookies
 */
export async function getAuthSessionToken(): Promise<string | null> {
  try {
    const client = getSupabase();
    const { data, error } = await client.auth.getSession();
    if (!error && data?.session?.access_token) {
      return data.session.access_token;
    }
  } catch (err) {
    console.warn("[supabase] Unable to retrieve Supabase session:", err);
  }

  // Graceful fallback to client-side cookie / localStorage stored token
  return getStoredToken();
}

/**
 * Resolves current user details from Supabase or stored session.
 */
export async function getAuthSessionUser(): Promise<User | null> {
  try {
    const client = getSupabase();
    const { data, error } = await client.auth.getUser();
    if (!error && data?.user) {
      return {
        id: data.user.id,
        name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Citizen",
        email: data.user.email || "",
      };
    }
  } catch (err) {
    console.warn("[supabase] Unable to retrieve Supabase user:", err);
  }

  return getStoredUser();
}

