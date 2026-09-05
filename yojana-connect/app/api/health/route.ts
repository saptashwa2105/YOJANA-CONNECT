import { NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseServerClient } from "@/lib/db";
import { loadIndex, getIndexStats } from "@/lib/ai/vectorStore";

export async function GET() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // 1. Database Connectivity Check
  let dbStatus = "in-memory-fallback";
  let dbLatency = "0ms";

  if (isSupabaseConfigured()) {
    const dbStart = Date.now();
    try {
      const client = getSupabaseServerClient();
      if (client) {
        const { error } = await client.from("users").select("id").limit(1);
        dbLatency = `${Date.now() - dbStart}ms`;
        dbStatus = error ? "disconnected" : "connected";
      }
    } catch {
      dbStatus = "error";
    }
  }

  // 2. AI / Vector Store Check
  let aiCheck = {
    status: "unknown",
    geminiConfigured: false,
    vectorIndex: {
      loaded: false,
      totalChunks: 0,
      totalSchemes: 0,
    },
  };

  try {
    await loadIndex();
    const stats = getIndexStats();
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const geminiConfigured = Boolean(apiKey && apiKey !== "PASTE_YOUR_KEY_HERE");

    aiCheck = {
      status: stats.isLoaded && geminiConfigured ? "ready" : "degraded",
      geminiConfigured,
      vectorIndex: {
        loaded: stats.isLoaded,
        totalChunks: stats.totalChunks,
        totalSchemes: stats.totalSchemes,
      },
    };
  } catch {
    aiCheck = {
      status: "error",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      vectorIndex: {
        loaded: false,
        totalChunks: 0,
        totalSchemes: 0,
      },
    };
  }

  const isHealthy =
    (dbStatus === "connected" || dbStatus === "in-memory-fallback") &&
    aiCheck.vectorIndex.loaded;

  return NextResponse.json(
    {
      status: isHealthy ? "OK" : "DEGRADED",
      timestamp,
      service: "Yojana Connect Full-Stack Next.js",
      environment: process.env.NODE_ENV || "development",
      responseTime: `${Date.now() - startTime}ms`,
      checks: {
        database: {
          status: dbStatus,
          configured: isSupabaseConfigured(),
          latency: dbLatency,
        },
        aiService: aiCheck,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
