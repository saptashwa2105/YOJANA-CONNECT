import { NextRequest, NextResponse } from "next/server";
import { resolveUser, getUserBookmarks } from "@/lib/db";
import {
  loadSchemeDataset,
  evaluateSchemeMatch,
  parseAge,
  parseIncome,
  UserProfileCriteria,
} from "@/lib/schemes";

async function handleRecommendations(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    const url = new URL(req.url);

    let bodyData: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        bodyData = await req.json();
      } catch {
        // Body might be empty or invalid JSON
      }
    }

    const bodyProfile =
      (bodyData.profile as Record<string, unknown>) || bodyData || {};

    const eligibleOnlyParam =
      url.searchParams.get("eligibleOnly") ?? bodyData.eligibleOnly ?? "true";
    const shouldFilterEligible = String(eligibleOnlyParam) !== "false";

    const minScoreParam =
      url.searchParams.get("minScore") ?? bodyData.minScore ?? 0;
    const minScore = Number(minScoreParam) || 0;

    const occupation =
      (url.searchParams.get("occupation") ||
        bodyProfile.occupation ||
        user?.occupation ||
        null) as string | null;

    const state =
      (url.searchParams.get("state") ||
        bodyProfile.state ||
        user?.state ||
        null) as string | null;

    const rawAge =
      url.searchParams.get("age") !== null
        ? url.searchParams.get("age")
        : bodyProfile.age !== undefined
        ? bodyProfile.age
        : user?.age;
    const age = parseAge(rawAge);

    const rawIncome =
      url.searchParams.get("annualIncome") ||
      url.searchParams.get("income") ||
      url.searchParams.get("incomeRange") ||
      bodyProfile.annualIncome ||
      bodyProfile.income ||
      bodyProfile.incomeRange ||
      user?.annualIncome;
    const annualIncome = parseIncome(rawIncome);

    const activeProfile: UserProfileCriteria = {
      id: user?.id || null,
      occupation,
      state,
      age,
      annualIncome,
      language:
        (url.searchParams.get("language") ||
          bodyProfile.language ||
          user?.language ||
          "en") as string,
    };

    const dataset = loadSchemeDataset();

    let bookmarkedSet = new Set<string>();
    if (user?.id) {
      const bookmarks = await getUserBookmarks(user);
      bookmarkedSet = new Set(bookmarks.map((b) => b.schemeId));
    }

    let recommendations = dataset.map((scheme) => {
      const evaluation = evaluateSchemeMatch(scheme, activeProfile);
      return {
        scheme: {
          id: scheme.id,
          name: scheme.name,
          category: scheme.category,
          description: scheme.description,
          benefits: scheme.benefits,
          eligibility: scheme.eligibility,
          documents: scheme.documents,
          applicationProcess: scheme.applicationProcess,
          officialUrl: scheme.officialUrl,
          sourceUrl: scheme.sourceUrl,
          tags: evaluation.tags,
        },
        matchScore: evaluation.matchScore,
        eligible: evaluation.eligible,
        matchReasons: evaluation.matchReasons,
        whyEligible: evaluation.whyEligible,
        tags: evaluation.tags,
        isBookmarked: bookmarkedSet.has(scheme.id),
      };
    });

    if (shouldFilterEligible) {
      recommendations = recommendations.filter((r) => r.eligible);
    }

    if (minScore > 0) {
      recommendations = recommendations.filter((r) => r.matchScore >= minScore);
    }

    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      profile: activeProfile,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to calculate recommendations";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleRecommendations(req);
}

export async function POST(req: NextRequest) {
  return handleRecommendations(req);
}

