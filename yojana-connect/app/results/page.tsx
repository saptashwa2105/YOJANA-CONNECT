"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SCHEMES, Scheme } from "@/data/schemes";
import { CrowdCanvas } from "@/components/CrowdCanvas";
import { Sparkles, Loader2 } from "lucide-react";
import {
  fetchRecommendations,
  fetchBookmarks,
  addBookmarkApi,
  removeBookmarkApi,
  RecommendationItem,
} from "@/lib/api";

interface DisplaySchemeItem {
  scheme: Scheme;
  matchScore: number;
  matchBadge: string;
  matchReason: string;
}

function ResultsContent() {
  const searchParams = useSearchParams();

  // Selected criteria and modal state
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(true);
  const [backendRecommendations, setBackendRecommendations] = useState<RecommendationItem[] | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Derive criteria directly from URL params or sessionStorage
  const criteria = useMemo(() => {
    const ageParam = searchParams.get("age");
    const genderParam = searchParams.get("gender");
    const stateParam = searchParams.get("state");
    const areaParam = searchParams.get("area");
    const categoryParam = searchParams.get("category");
    const occupationParam = searchParams.get("occupation");
    const incomeParam = searchParams.get("income");
    const disabilityParam = searchParams.get("disability") === "1";
    const minorityParam = searchParams.get("minority") === "1";
    const studentParam = searchParams.get("student") === "1";

    if (ageParam || stateParam || occupationParam) {
      return {
        age: ageParam || "",
        gender: genderParam || "",
        state: stateParam || "All India",
        area: areaParam || "",
        category: categoryParam || "",
        occupation: occupationParam || "",
        income: incomeParam || "",
        isDisability: disabilityParam,
        isMinority: minorityParam,
        isStudent: studentParam,
      };
    }

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("yojana_criteria");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore parsing errors
        }
      }
    }

    return {
      age: "",
      gender: "",
      state: "All India",
      area: "",
      category: "",
      occupation: "",
      income: "",
      isDisability: false,
      isMinority: false,
      isStudent: false,
    };
  }, [searchParams]);

  // Load live bookmarks and recommendations from backend
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoadingBackend(true);
      try {
        // 1. Fetch user bookmarks from SQLite
        const bookmarksRes = await fetchBookmarks();
        if (isMounted && bookmarksRes.success && Array.isArray(bookmarksRes.data)) {
          const ids = bookmarksRes.data.map((b) => b.schemeId);
          setSavedSchemeIds(ids);
        }

        // 2. Fetch dynamic recommendations from Express backend
        const recsRes = await fetchRecommendations({
          age: criteria.age,
          occupation: criteria.occupation,
          state: criteria.state,
          annualIncome: criteria.income,
          eligibleOnly: true,
        });

        if (isMounted) {
          if (recsRes.success && Array.isArray(recsRes.data) && recsRes.data.length > 0) {
            setBackendRecommendations(recsRes.data);
            setIsLiveConnected(true);
          } else {
            setBackendRecommendations(null);
            setIsLiveConnected(false);
          }
        }
      } catch (err) {
        console.warn("[Results] Backend connection warning, falling back to local dataset:", err);
        if (isMounted) {
          setBackendRecommendations(null);
          setIsLiveConnected(false);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBackend(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [criteria]);

  // Toggle Save/Bookmark Handler with SQLite sync
  const toggleSaveScheme = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlySaved = savedSchemeIds.includes(id);

    // Optimistic UI update
    setSavedSchemeIds((prev) =>
      isCurrentlySaved ? prev.filter((item) => item !== id) : [...prev, id]
    );

    try {
      if (isCurrentlySaved) {
        await removeBookmarkApi(id);
      } else {
        await addBookmarkApi(id);
      }
    } catch (err) {
      console.warn("[Results] Failed to sync bookmark to SQLite:", err);
    }
  };

  // Helper to normalize benefits into string array
  const normalizeList = (val: unknown): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === "object") {
      return Object.values(val as Record<string, unknown>).map(String);
    }
    return [String(val)];
  };

  // Matched schemes calculation (backend priority with client-side fallback)
  const matchedSchemes = useMemo<DisplaySchemeItem[]>(() => {
    // 1. If backend returned dynamic recommendations, format and return them
    if (backendRecommendations && backendRecommendations.length > 0) {
      return backendRecommendations.map((item) => {
        const rawScheme = item.scheme;
        const score = item.matchScore || 85;
        const badge =
          score >= 95 ? "100% Eligible" : score >= 80 ? "High Match" : "Eligible";

        const benefitsList = normalizeList(rawScheme.benefits);
        const eligibilityList = normalizeList(rawScheme.eligibility);

        const formattedScheme: Scheme = {
          id: rawScheme.id,
          name: rawScheme.name,
          shortDescription: rawScheme.description || "Direct government citizen benefit.",
          fullDescription: rawScheme.description || "",
          category: rawScheme.category || "General Welfare",
          state: rawScheme.state || criteria.state || "All India",
          tags: item.tags || rawScheme.tags || [rawScheme.category],
          benefits: benefitsList.length > 0 ? benefitsList : ["Direct financial support and welfare grant"],
          eligibility: eligibilityList.length > 0 ? eligibilityList : ["Citizens meeting demographic and income conditions"],
          ministry: "Government of India",
          applicationUrl: rawScheme.officialUrl || "https://www.myscheme.gov.in",
        };

        return {
          scheme: formattedScheme,
          matchScore: score,
          matchBadge: badge,
          matchReason: item.whyEligible || (item.matchReasons && item.matchReasons[0]) || "Matches your demographic profile.",
        };
      });
    }

    // 2. Fallback: Client-side dynamic matching
    const results: DisplaySchemeItem[] = [];
    const ageNum = criteria.age ? Number(criteria.age) : 0;
    const userState = criteria.state || "All India";
    const userOcc = criteria.occupation;
    const userIncome = criteria.income;
    const userGender = criteria.gender;

    for (const scheme of SCHEMES) {
      const isStateScheme = scheme.state !== "All India";
      if (isStateScheme && userState !== "All States" && userState !== "All India") {
        if (scheme.state.toLowerCase() !== userState.toLowerCase()) {
          continue;
        }
      }

      let score = 70;
      let badge = "High Match";
      let reason = "Matches your demographic and income profile.";

      if (scheme.id === "pm-kisan") {
        if (userOcc === "Farmer") {
          score = 98;
          badge = "100% Eligible";
          reason = "Primary match: Direct DBT income support for landholder farmer households.";
        } else if (criteria.area === "Rural") {
          score = 85;
          badge = "High Match";
          reason = "Rural household assistance grant.";
        } else {
          score = 65;
          badge = "Conditional Match";
          reason = "Eligible if family holds agricultural land in revenue records.";
        }
      } else if (scheme.id === "ayushman-bharat" || scheme.id === "pmjay") {
        if (ageNum >= 70) {
          score = 99;
          badge = "Universal Match";
          reason = "Universal senior citizen free healthcare cover regardless of income.";
        } else if (
          userIncome === "Below ₹1 Lakh" ||
          userIncome === "₹1L - ₹2.5L" ||
          userOcc === "Daily Wage" ||
          userOcc === "Unemployed"
        ) {
          score = 95;
          badge = "100% Eligible";
          reason = "Covered under primary economic vulnerability and healthcare criteria.";
        } else {
          score = 80;
          badge = "Eligible";
          reason = "₹5 Lakh annual hospital hospitalization cover under SECC criteria.";
        }
      } else if (scheme.id === "pm-awas-yojana" || scheme.id === "pmay-g" || scheme.id === "pmay-u") {
        if (userIncome === "Above ₹5L") {
          continue;
        }
        score = 90;
        badge = "High Match";
        reason = "Pucca housing subsidy and Credit Linked Interest Subsidy.";
      } else if (scheme.id === "pm-svanidhi") {
        if (userOcc === "Daily Wage" || userOcc === "Self-Employed" || userOcc === "Unemployed") {
          score = 95;
          badge = "100% Eligible";
          reason = "Collateral-free working capital micro-credit with 7% interest rebate.";
        } else if (criteria.area === "Urban") {
          score = 75;
          badge = "Eligible";
          reason = "Urban livelihood working capital loan.";
        } else {
          score = 60;
          badge = "Conditional";
          reason = "Applicable for street vendors and small trade operators.";
        }
      } else if (scheme.id === "naps-skill") {
        if (userOcc === "Student" || criteria.isStudent || (ageNum >= 14 && ageNum <= 30)) {
          score = 96;
          badge = "100% Eligible";
          reason = "Vocational apprenticeship training with 25% direct stipend support.";
        } else {
          score = 65;
          badge = "Skill Program";
          reason = "Certified national apprenticeship accreditation.";
        }
      } else if (scheme.id === "mjpjay-maha") {
        if (userState !== "Maharashtra" && userState !== "All States" && userState !== "All India") {
          continue;
        }
        score = 94;
        badge = "State Priority";
        reason = "Free critical illness hospitalization cover across Maharashtra.";
      } else if (scheme.id === "kanya-sumangala") {
        if (userGender === "Male") continue;
        if (userState !== "Uttar Pradesh" && userState !== "All States" && userState !== "All India") {
          continue;
        }
        score = 95;
        badge = "State Grant";
        reason = "₹15,000 milestone cash transfers for girl children in Uttar Pradesh.";
      } else if (scheme.id === "delhi-ladli") {
        if (userGender === "Male") continue;
        if (userState !== "Delhi" && userState !== "All States" && userState !== "All India") {
          continue;
        }
        score = 95;
        badge = "Capital Grant";
        reason = "Long-term educational milestone fixed deposits in Delhi.";
      }

      results.push({
        scheme,
        matchScore: score,
        matchBadge: badge,
        matchReason: reason,
      });
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [backendRecommendations, criteria]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-white selection:bg-white selection:text-black flex flex-col justify-between">
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-20 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/find"
              className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Edit Criteria</span>
            </Link>
            <div className="h-4 w-px bg-neutral-800 hidden sm:block" />
            <Link href="/" className="font-black tracking-wider text-xl uppercase text-white hover:opacity-90 transition">
              Yojana.
            </Link>
            <span className="hidden md:inline-block rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Personalized Results
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isLiveConnected && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Express Backend
              </span>
            )}
            <Link
              href="/explore"
              className="rounded-full border border-neutral-800 bg-neutral-900/60 px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white transition"
            >
              Browse All Schemes
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN RESULTS AREA */}
      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 sm:py-20 flex-1">
        {/* Title & Introduction */}
        <div className="mb-8 max-w-3xl">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              {isLoadingBackend ? "Analyzing Eligibility..." : `${matchedSchemes.length} Schemes Matched`}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Schemes Matched For You
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-400 leading-relaxed">
            Based on your demographic, occupational, and income details, our backend recommendation engine verified direct financial aid, grants, and subsidies tailored to your profile.
          </p>
        </div>

        {/* 5. Top Criteria Summary Bar */}
        <div className="inline-flex flex-wrap items-center gap-2 p-2 bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-2xl mb-10 w-full">
          <span className="text-xs font-semibold text-neutral-400 px-2 py-1">Filters:</span>
          {criteria.age && (
            <span className="text-xs text-neutral-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-medium">
              Age: <strong className="text-white">{criteria.age}</strong>
            </span>
          )}
          {criteria.gender && (
            <span className="text-xs text-neutral-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-medium">
              {criteria.gender}
            </span>
          )}
          {criteria.state && (
            <span className="text-xs text-neutral-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-medium">
              📍 {criteria.state}
            </span>
          )}
          {criteria.area && (
            <span className="text-xs text-neutral-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-medium">
              {criteria.area}
            </span>
          )}
          {criteria.occupation && (
            <span className="text-xs text-neutral-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-medium">
              💼 {criteria.occupation}
            </span>
          )}
          {criteria.income && (
            <span className="text-xs text-neutral-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-medium">
              💰 {criteria.income}
            </span>
          )}
          {criteria.category && (
            <span className="text-xs text-neutral-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-medium">
              🏷️ {criteria.category}
            </span>
          )}
          {criteria.isDisability && (
            <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-medium">
              ♿ PwD
            </span>
          )}
          {criteria.isMinority && (
            <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl font-medium">
              Minority
            </span>
          )}
          {criteria.isStudent && (
            <span className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl font-medium">
              🎓 Student
            </span>
          )}

          {/* Understated Edit Filters Button */}
          <Link
            href="/find"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-xl font-medium transition active:scale-95 ml-auto cursor-pointer"
          >
            <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Edit Filters</span>
          </Link>
        </div>

        {/* Loading Spinner */}
        {isLoadingBackend && (
          <div className="flex items-center justify-center py-16 gap-3 text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            <span className="text-sm font-medium">Evaluating SQLite schemes against your profile...</span>
          </div>
        )}

        {/* 3. SCHEME CARDS GRID (2-COLUMN) */}
        {!isLoadingBackend && matchedSchemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {matchedSchemes.map(({ scheme, matchBadge, matchReason, matchScore }) => {
              const isSaved = savedSchemeIds.includes(scheme.id);
              return (
                <div
                  key={scheme.id}
                  className="bg-neutral-900/40 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all duration-300 rounded-3xl p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden group"
                >
                  {/* Subtle Inner Top-Edge Gradient Glow */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.04] to-transparent" />

                  <div className="relative z-10">
                    {/* Category & Badges Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold bg-white/5 border border-white/10 px-3 py-1 rounded-full w-fit">
                          {scheme.category}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium bg-neutral-950/40 border border-white/5 px-2.5 py-1 rounded-full">
                          {scheme.state}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-neutral-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          {matchScore}%
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                          {matchBadge}
                        </span>
                      </div>
                    </div>

                    {/* Scheme Title */}
                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white group-hover:text-neutral-100 transition mb-3 leading-snug">
                      {scheme.name}
                    </h2>

                    {/* Ministry / Authority */}
                    <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium -mt-1 mb-4">
                      {scheme.ministry}
                    </p>

                    {/* Match Rationale Callout */}
                    <div className="mb-4 rounded-2xl bg-neutral-950/40 border border-white/5 p-3 text-xs text-neutral-300 leading-relaxed">
                      <span className="text-emerald-400 font-semibold">Match Rationale: </span>
                      {matchReason}
                    </div>

                    {/* Description */}
                    <p className="text-neutral-400 text-sm leading-relaxed mb-6 line-clamp-3">
                      {scheme.shortDescription}
                    </p>

                    {/* Key Eligibility / Benefit Highlights */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {scheme.benefits.slice(0, 2).map((benefit, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs text-neutral-300 bg-neutral-950/40 border border-white/5 px-3 py-1.5 rounded-xl font-medium"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="line-clamp-1">{benefit}</span>
                        </div>
                      ))}
                      {scheme.tags.slice(0, 2).map((tag, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-950/30 border border-white/5 px-2.5 py-1.5 rounded-xl font-mono"
                        >
                          <span>#{tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer Action Row */}
                  <div className="border-t border-white/[0.06] pt-5 mt-auto flex items-center justify-between relative z-10 gap-3">
                    <div className="flex items-center gap-2">
                      {/* Save / Bookmark Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleSaveScheme(scheme.id, e)}
                        className={`p-2.5 rounded-full border transition cursor-pointer ${
                          isSaved
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                            : "border-white/10 text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                        title={isSaved ? "Remove bookmark" : "Save scheme to profile"}
                        aria-label="Bookmark scheme"
                      >
                        <svg
                          className={`h-4 w-4 ${isSaved ? "fill-amber-400 text-amber-400" : "fill-none"}`}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>

                      {/* Official Portal Link */}
                      <a
                        href={scheme.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-full border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition shrink-0"
                        title="Visit official portal"
                        aria-label="Open portal link"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>

                    {/* View Details CTA */}
                    <button
                      type="button"
                      onClick={() => setSelectedScheme(scheme)}
                      className="bg-white text-neutral-950 font-semibold text-xs tracking-wide px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !isLoadingBackend ? (
          /* Empty State */
          <div className="rounded-3xl border border-white/[0.08] bg-neutral-900/40 backdrop-blur-xl p-12 text-center max-w-lg mx-auto my-12 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-neutral-950/60 text-2xl mb-4">
              🔍
            </div>
            <h3 className="text-xl font-bold text-white">No Direct Matches Found</h3>
            <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">
              We could not find direct programs targeting this exact combination. Try adjusting your state or income criteria, or explore all national schemes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Link
                href="/find"
                className="bg-white text-neutral-950 font-semibold text-xs px-6 py-2.5 rounded-full hover:bg-neutral-200 transition shadow-md active:scale-95"
              >
                Reset and Try Again
              </Link>
              <Link
                href="/explore"
                className="border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 px-6 py-2.5 rounded-full text-xs font-semibold transition"
              >
                Browse All Schemes
              </Link>
            </div>
          </div>
        ) : null}

        {/* AI Assistance Callout Card */}
        <div className="mt-16 mb-12 max-w-3xl mx-auto px-4 relative z-20">
          <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl flex flex-col items-center gap-5 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent" />

            <p className="text-neutral-300 text-sm sm:text-base font-normal tracking-wide relative z-10">
              Have questions about eligibility or required documents? Ask our AI assistant.
            </p>

            <Link
              href="/chat"
              className="bg-white text-neutral-950 font-bold text-sm px-7 py-3 rounded-full hover:bg-neutral-200 active:scale-95 transition-all shadow-lg flex items-center gap-2 relative z-10 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ask Yojana Connect</span>
            </Link>
          </div>
        </div>
      </main>

      {/* 5. FULL SCHEME DETAILS MODAL */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-neutral-800 bg-neutral-900/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-neutral-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="rounded-full border border-neutral-800 bg-neutral-950/70 px-3 py-1 text-[11px] font-semibold text-neutral-300">
                    {selectedScheme.category}
                  </span>
                  <span className="rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-[10px] font-medium text-neutral-400">
                    {selectedScheme.state}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {selectedScheme.name}
                </h2>
                <p className="mt-1 text-xs text-neutral-500 uppercase tracking-wider">
                  {selectedScheme.ministry}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedScheme(null)}
                className="rounded-full border border-neutral-800 bg-neutral-950/70 p-2 text-neutral-400 hover:text-white transition hover:bg-neutral-800 shrink-0 cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 text-sm">
              {/* Detailed Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Overview & Description
                </h4>
                <p className="text-neutral-300 leading-relaxed text-xs sm:text-sm">
                  {selectedScheme.fullDescription}
                </p>
              </div>

              {/* Benefits */}
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                  Scheme Benefits & Financial Aid
                </h4>
                <ul className="space-y-2">
                  {selectedScheme.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-neutral-300">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Eligibility Criteria */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Eligibility Criteria
                </h4>
                <ul className="space-y-1.5">
                  {selectedScheme.eligibility.map((crit, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                      <span className="text-neutral-500 shrink-0">•</span>
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedScheme.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-neutral-950/60 border border-neutral-800 px-2.5 py-1 text-[11px] text-neutral-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-8 pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedScheme(null)}
                className="rounded-full border border-neutral-700 bg-neutral-800/60 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition cursor-pointer"
              >
                Close
              </button>

              <a
                href={selectedScheme.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white px-6 py-2.5 text-xs font-bold text-black transition hover:bg-neutral-200 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Apply on Official Portal</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 6. WALKING CROWD ANIMATION */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[35vh] z-0 opacity-40">
        <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
      </div>

      {/* 7. FOOTER */}
      <footer className="relative z-20 border-t border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Yojana Connect • Citizen Services Results</p>
          <p className="text-[11px]">Government Initiatives Direct Verification & Access</p>
        </div>
      </footer>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <div className="flex items-center gap-3 text-neutral-400 text-sm">
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <span>Finding matching schemes...</span>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
