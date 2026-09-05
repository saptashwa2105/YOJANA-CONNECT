import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSchemeById, resolveCanonicalSchemeId, SchemeMetadata } from "./schemes";

export interface UserRecord {
  id: number;
  supabaseId: string | null;
  email: string | null;
  age: number;
  state: string;
  occupation: string;
  annualIncome: number | null;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkRecord {
  id: number;
  userId: number;
  supabaseUserId: string | null;
  schemeId: string;
  createdAt: string;
  scheme?: SchemeMetadata | null;
}

export interface AuthIdentity {
  supabaseId: string | null;
  email: string | null;
  metadata?: Record<string, unknown>;
  error?: string;
}

// In-memory persistent fallback cache for development or environments without live Supabase credentials
class InMemoryDatabase {
  private users: Map<number, UserRecord> = new Map();
  private bookmarks: Map<number, BookmarkRecord> = new Map();
  private nextUserId = 1;
  private nextBookmarkId = 1;

  constructor() {
    // Seed a default user profile
    const defaultUser: UserRecord = {
      id: this.nextUserId++,
      supabaseId: "usr_default_demo",
      email: "citizen@yojana.gov.in",
      age: 35,
      state: "Uttar Pradesh",
      occupation: "Farmer",
      annualIncome: 120000,
      language: "hi",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Seed initial bookmarks
    this.bookmarks.set(this.nextBookmarkId, {
      id: this.nextBookmarkId++,
      userId: defaultUser.id,
      supabaseUserId: defaultUser.supabaseId,
      schemeId: "pm-kisan",
      createdAt: new Date().toISOString(),
      scheme: getSchemeById("pm-kisan"),
    });
    this.bookmarks.set(this.nextBookmarkId, {
      id: this.nextBookmarkId++,
      userId: defaultUser.id,
      supabaseUserId: defaultUser.supabaseId,
      schemeId: "pmjay",
      createdAt: new Date().toISOString(),
      scheme: getSchemeById("pmjay"),
    });
  }

  findUserById(id: number): UserRecord | null {
    return this.users.get(id) || null;
  }

  findUserBySupabaseId(supabaseId: string): UserRecord | null {
    for (const user of this.users.values()) {
      if (user.supabaseId === supabaseId) return user;
    }
    return null;
  }

  findUserByEmail(email: string): UserRecord | null {
    const norm = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email && user.email.toLowerCase() === norm) return user;
    }
    return null;
  }

  getFirstUser(): UserRecord {
    const first = this.users.values().next().value;
    if (first) return first;
    const created: UserRecord = {
      id: this.nextUserId++,
      supabaseId: null,
      email: null,
      age: 30,
      state: "All India",
      occupation: "General Citizen",
      annualIncome: null,
      language: "en",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(created.id, created);
    return created;
  }

  createUser(data: Partial<UserRecord>): UserRecord {
    const id = this.nextUserId++;
    const now = new Date().toISOString();
    const user: UserRecord = {
      id,
      supabaseId: data.supabaseId || null,
      email: data.email || null,
      age: data.age !== undefined ? data.age : 30,
      state: data.state || "All India",
      occupation: data.occupation || "General Citizen",
      annualIncome: data.annualIncome !== undefined ? data.annualIncome : null,
      language: data.language || "en",
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  updateUser(id: number, data: Partial<UserRecord>): UserRecord | null {
    const existing = this.users.get(id);
    if (!existing) return null;
    const updated: UserRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return updated;
  }

  getUserBookmarks(userId: number): BookmarkRecord[] {
    const results: BookmarkRecord[] = [];
    for (const b of this.bookmarks.values()) {
      if (b.userId === userId) {
        results.push({
          ...b,
          scheme: getSchemeById(b.schemeId),
        });
      }
    }
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  addBookmark(userId: number, schemeId: string, supabaseUserId?: string | null): BookmarkRecord {
    const existing = Array.from(this.bookmarks.values()).find(
      (b) => b.userId === userId && b.schemeId === schemeId
    );
    if (existing) {
      return {
        ...existing,
        scheme: getSchemeById(existing.schemeId),
      };
    }

    const id = this.nextBookmarkId++;
    const bookmark: BookmarkRecord = {
      id,
      userId,
      supabaseUserId: supabaseUserId || null,
      schemeId,
      createdAt: new Date().toISOString(),
      scheme: getSchemeById(schemeId),
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  removeBookmark(userId: number, schemeIdOrId: string): boolean {
    const canonical = resolveCanonicalSchemeId(schemeIdOrId);
    let targetId: number | null = null;

    for (const [id, b] of this.bookmarks.entries()) {
      if (
        b.userId === userId &&
        (b.schemeId === schemeIdOrId ||
          b.schemeId === canonical ||
          String(b.id) === schemeIdOrId)
      ) {
        targetId = id;
        break;
      }
    }

    if (targetId !== null) {
      return this.bookmarks.delete(targetId);
    }
    return false;
  }
}

// Global in-memory instance
const memoryDb = new InMemoryDatabase();

// Supabase client instance
let supabaseClient: SupabaseClient | null = null;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseKey) return false;
  if (
    supabaseUrl.includes("mock-yojana") ||
    supabaseKey.includes("mock-anon-key") ||
    supabaseUrl.trim() === ""
  ) {
    return false;
  }
  return true;
}

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseClient && supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Parses JWT tokens (mock tokens, Supabase JWTs, or raw IDs)
 */
export function extractIdentityFromToken(token?: string | null): AuthIdentity | null {
  if (!token || typeof token !== "string") return null;
  const cleanToken = token.trim();
  if (!cleanToken) return null;

  // 1. Mock token: jwt_mock_<base64>
  if (cleanToken.startsWith("jwt_mock_")) {
    try {
      const payloadBase64 = cleanToken.replace("jwt_mock_", "");
      const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf-8");
      const payload = JSON.parse(payloadJson);

      if (payload.exp && typeof payload.exp === "number") {
        const isExpInSeconds = payload.exp < 10000000000;
        const expMs = isExpInSeconds ? payload.exp * 1000 : payload.exp;
        if (Date.now() > expMs) {
          return { supabaseId: null, email: null, error: "Token has expired" };
        }
      }

      return {
        supabaseId: payload.id || payload.sub || null,
        email: payload.email || null,
        metadata: payload,
      };
    } catch {
      return null;
    }
  }

  // 2. Standard 3-part JWT
  if (cleanToken.includes(".")) {
    try {
      const parts = cleanToken.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
        const payload = JSON.parse(payloadJson);

        if (payload.exp && typeof payload.exp === "number") {
          const isExpInSeconds = payload.exp < 10000000000;
          const expMs = isExpInSeconds ? payload.exp * 1000 : payload.exp;
          if (Date.now() > expMs) {
            return { supabaseId: null, email: null, error: "Token has expired" };
          }
        }

        const supabaseId = payload.sub || payload.user_id || payload.id || null;
        const email = payload.email || payload.user_metadata?.email || null;

        return {
          supabaseId,
          email,
          metadata: payload,
        };
      }
    } catch {
      return null;
    }
  }

  // 3. Raw user ID
  return {
    supabaseId: cleanToken,
    email: null,
    metadata: {},
  };
}

/**
 * Resolves user from Request headers / query params
 */
export async function resolveUser(req: Request): Promise<UserRecord> {
  const url = new URL(req.url);
  const authHeader = req.headers.get("authorization");
  const xUserId = req.headers.get("x-user-id");
  const queryUserId = url.searchParams.get("userId");

  let token: string | null = null;
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7).trim();
  }

  const identity = token ? extractIdentityFromToken(token) : null;
  const client = getSupabaseServerClient();

  // If Supabase is configured and identity found
  if (client && identity && identity.supabaseId && !identity.error) {
    try {
      const { data: existingUser } = await client
        .from("users")
        .select("*")
        .eq("supabase_id", identity.supabaseId)
        .single();

      if (existingUser) {
        return {
          id: existingUser.id,
          supabaseId: existingUser.supabase_id,
          email: existingUser.email,
          age: existingUser.age,
          state: existingUser.state,
          occupation: existingUser.occupation,
          annualIncome: existingUser.annual_income,
          language: existingUser.language || "en",
          createdAt: existingUser.created_at,
          updatedAt: existingUser.updated_at,
        };
      }

      // Provision new user in Supabase
      const { data: newUser, error: insertErr } = await client
        .from("users")
        .insert({
          supabase_id: identity.supabaseId,
          email: identity.email,
          age: 30,
          state: "All India",
          occupation: "General Citizen",
          language: "en",
        })
        .select()
        .single();

      if (!insertErr && newUser) {
        return {
          id: newUser.id,
          supabaseId: newUser.supabase_id,
          email: newUser.email,
          age: newUser.age,
          state: newUser.state,
          occupation: newUser.occupation,
          annualIncome: newUser.annual_income,
          language: newUser.language || "en",
          createdAt: newUser.created_at,
          updatedAt: newUser.updated_at,
        };
      }
    } catch (err) {
      console.warn("[db] Supabase query failed, falling back to in-memory store:", err);
    }
  }

  // Fallback to in-memory store
  if (identity && identity.supabaseId && !identity.error) {
    let memUser = memoryDb.findUserBySupabaseId(identity.supabaseId);
    if (!memUser && identity.email) {
      memUser = memoryDb.findUserByEmail(identity.email);
    }
    if (!memUser) {
      memUser = memoryDb.createUser({
        supabaseId: identity.supabaseId,
        email: identity.email,
        age: 30,
        state: "All India",
        occupation: "General Citizen",
        language: "en",
      });
    }
    return memUser;
  }

  const explicitId = xUserId || queryUserId;
  if (explicitId) {
    if (!isNaN(Number(explicitId))) {
      const user = memoryDb.findUserById(Number(explicitId));
      if (user) return user;
    }
    const userBySupabase = memoryDb.findUserBySupabaseId(explicitId);
    if (userBySupabase) return userBySupabase;
  }

  return memoryDb.getFirstUser();
}

/**
 * Fetch profile with bookmarks
 */
export async function getProfileWithBookmarks(user: UserRecord) {
  const client = getSupabaseServerClient();
  let bookmarks: BookmarkRecord[] = [];

  if (client) {
    try {
      const { data, error } = await client
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        bookmarks = data.map((b) => ({
          id: b.id,
          userId: b.user_id,
          supabaseUserId: b.supabase_user_id,
          schemeId: b.scheme_id,
          createdAt: b.created_at,
          scheme: getSchemeById(b.scheme_id),
        }));
      }
    } catch (err) {
      console.warn("[db] Supabase getProfileWithBookmarks fallback:", err);
      bookmarks = memoryDb.getUserBookmarks(user.id);
    }
  } else {
    bookmarks = memoryDb.getUserBookmarks(user.id);
  }

  return {
    id: user.id,
    age: user.age,
    state: user.state,
    occupation: user.occupation,
    annualIncome: user.annualIncome,
    language: user.language,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    bookmarkedSchemeIds: bookmarks.map((b) => b.schemeId),
    bookmarkCount: bookmarks.length,
    bookmarks,
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  updates: {
    age?: number;
    state?: string;
    occupation?: string;
    annualIncome?: number | null;
    language?: string;
  }
): Promise<UserRecord | null> {
  const client = getSupabaseServerClient();

  if (client) {
    try {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.age !== undefined) updatePayload.age = updates.age;
      if (updates.state !== undefined) updatePayload.state = updates.state;
      if (updates.occupation !== undefined) updatePayload.occupation = updates.occupation;
      if (updates.annualIncome !== undefined) updatePayload.annual_income = updates.annualIncome;
      if (updates.language !== undefined) updatePayload.language = updates.language;

      const { data, error } = await client
        .from("users")
        .update(updatePayload)
        .eq("id", userId)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          supabaseId: data.supabase_id,
          email: data.email,
          age: data.age,
          state: data.state,
          occupation: data.occupation,
          annualIncome: data.annual_income,
          language: data.language,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn("[db] Supabase updateUserProfile error:", err);
    }
  }

  return memoryDb.updateUser(userId, updates);
}

/**
 * Fetch bookmarks for user
 */
export async function getUserBookmarks(user: UserRecord): Promise<BookmarkRecord[]> {
  const client = getSupabaseServerClient();

  if (client) {
    try {
      const { data, error } = await client
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((b) => ({
          id: b.id,
          userId: b.user_id,
          supabaseUserId: b.supabase_user_id,
          schemeId: b.scheme_id,
          createdAt: b.created_at,
          scheme: getSchemeById(b.scheme_id),
        }));
      }
    } catch (err) {
      console.warn("[db] Supabase getUserBookmarks error:", err);
    }
  }

  return memoryDb.getUserBookmarks(user.id);
}

/**
 * Add bookmark
 */
export async function addUserBookmark(
  user: UserRecord,
  schemeId: string
): Promise<{ bookmark: BookmarkRecord; isAlreadyBookmarked: boolean }> {
  const client = getSupabaseServerClient();
  const canonicalId = resolveCanonicalSchemeId(schemeId);

  if (client) {
    try {
      // Check existing
      const { data: existing } = await client
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .eq("scheme_id", canonicalId)
        .maybeSingle();

      if (existing) {
        return {
          bookmark: {
            id: existing.id,
            userId: existing.user_id,
            supabaseUserId: existing.supabase_user_id,
            schemeId: existing.scheme_id,
            createdAt: existing.created_at,
            scheme: getSchemeById(existing.scheme_id),
          },
          isAlreadyBookmarked: true,
        };
      }

      const { data: created, error } = await client
        .from("bookmarks")
        .insert({
          user_id: user.id,
          supabase_user_id: user.supabaseId,
          scheme_id: canonicalId,
        })
        .select()
        .single();

      if (!error && created) {
        return {
          bookmark: {
            id: created.id,
            userId: created.user_id,
            supabaseUserId: created.supabase_user_id,
            schemeId: created.scheme_id,
            createdAt: created.created_at,
            scheme: getSchemeById(created.scheme_id),
          },
          isAlreadyBookmarked: false,
        };
      }
    } catch (err) {
      console.warn("[db] Supabase addUserBookmark error:", err);
    }
  }

  const existing = memoryDb.getUserBookmarks(user.id).find((b) => b.schemeId === canonicalId);
  if (existing) {
    return { bookmark: existing, isAlreadyBookmarked: true };
  }

  const bookmark = memoryDb.addBookmark(user.id, canonicalId, user.supabaseId);
  return { bookmark, isAlreadyBookmarked: false };
}

/**
 * Remove bookmark
 */
export async function removeUserBookmark(
  user: UserRecord,
  schemeIdOrId: string
): Promise<boolean> {
  const client = getSupabaseServerClient();
  const canonicalId = resolveCanonicalSchemeId(schemeIdOrId);

  if (client) {
    try {
      let query = client.from("bookmarks").delete().eq("user_id", user.id);
      if (!isNaN(Number(schemeIdOrId))) {
        query = query.or(`id.eq.${schemeIdOrId},scheme_id.eq.${canonicalId}`);
      } else {
        query = query.eq("scheme_id", canonicalId);
      }

      const { error } = await query;
      if (!error) return true;
    } catch (err) {
      console.warn("[db] Supabase removeUserBookmark error:", err);
    }
  }

  return memoryDb.removeBookmark(user.id, schemeIdOrId);
}
