"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { SCHEMES, CATEGORIES, STATES, Scheme } from "@/data/schemes";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Bookmark, ExternalLink } from "lucide-react";
import { CrowdCanvas } from "@/components/CrowdCanvas";
import { fetchBookmarks, addBookmarkApi, removeBookmarkApi } from "@/lib/api";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { EffectCoverflow, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function ExploreSchemesPage() {
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("All States");
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Swiper Carousel State
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Modal State for Scheme Details
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  // Load saved bookmarks from backend SQLite on mount
  useEffect(() => {
    let isMounted = true;
    async function loadBookmarks() {
      try {
        const res = await fetchBookmarks();
        if (isMounted && res.success && Array.isArray(res.data)) {
          setSavedSchemeIds(res.data.map((b) => b.schemeId));
        }
      } catch (err) {
        console.warn("[Explore] Failed to load bookmarks from backend:", err);
      }
    }
    loadBookmarks();
    return () => {
      isMounted = false;
    };
  }, []);

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
      console.warn("[Explore] Failed to update bookmark in SQLite:", err);
    }
  };

  // Reset Filters Handler
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedState("All States");
    setShowSavedOnly(false);
  };

  // Check if any filter is active
  const isFilterActive =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedState !== "All States" ||
    showSavedOnly;

  // Filter Logic
  const filteredSchemes = useMemo(() => {
    return SCHEMES.filter((scheme) => {
      // 1. Search Query Filter (name, shortDescription, tags)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = scheme.name.toLowerCase().includes(query);
        const matchesDesc = scheme.shortDescription.toLowerCase().includes(query);
        const matchesTags = scheme.tags.some((tag) => tag.toLowerCase().includes(query));
        const matchesMinistry = scheme.ministry?.toLowerCase().includes(query);

        if (!matchesName && !matchesDesc && !matchesTags && !matchesMinistry) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== "all") {
        const catObj = CATEGORIES.find((c) => c.id === selectedCategory);
        if (catObj && scheme.category !== catObj.name) {
          return false;
        }
      }

      // 3. State Filter
      if (selectedState !== "All States") {
        if (selectedState === "All India") {
          if (scheme.state !== "All India") return false;
        } else {
          if (scheme.state !== selectedState && scheme.state !== "All India") {
            return false;
          }
        }
      }

      // 4. Saved Only Filter
      if (showSavedOnly && !savedSchemeIds.includes(scheme.id)) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedState, showSavedOnly, savedSchemeIds]);

  const isLoop = filteredSchemes.length > 3;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-white selection:bg-white selection:text-black flex flex-col justify-between">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-20 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </Link>
            <div className="h-4 w-px bg-neutral-800 hidden sm:block" />
            <Link href="/" className="font-black tracking-wider text-xl uppercase text-white hover:opacity-90 transition">
              Yojana.
            </Link>
            <span className="hidden md:inline-block rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Citizen Gateway
            </span>
          </div>

          <div className="flex items-center gap-3">
            {savedSchemeIds.length > 0 && (
              <button
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  showSavedOnly
                    ? "bg-white text-black font-bold"
                    : "border border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:text-white"
                }`}
              >
                <svg
                  className={`h-3.5 w-3.5 ${showSavedOnly ? "fill-black" : "fill-neutral-400"}`}
                  viewBox="0 0 24 24"
                >
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>Saved ({savedSchemeIds.length})</span>
              </button>
            )}

            <span className="hidden sm:inline-block text-xs font-medium text-neutral-400">
              Schemes Portal
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-8 py-8 flex-1">
        
        {/* Hero Title Section */}
        <div className="relative z-20 mb-8 text-center max-w-3xl mx-auto">
          <span className="mb-3 inline-block rounded-full border border-neutral-800 bg-neutral-900/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-400 backdrop-blur-md">
            National Registry
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Explore Government Schemes
          </h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-400">
            Find, verify eligibility, and discover direct financial assistance, welfare grants, and subsidies.
          </p>
        </div>

        {/* 3. SEARCH & CONTROLS CONTAINER */}
        <div className="relative z-20 mb-8 rounded-3xl border border-neutral-800 bg-neutral-900/70 p-4 sm:p-6 backdrop-blur-md shadow-2xl">
          
          {/* Top Search Bar & Dropdowns Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
            
            {/* Search Input Pill */}
            <div className="md:col-span-6 relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search schemes by name, keyword, or benefits..."
                className="w-full rounded-full border border-neutral-800 bg-neutral-950/60 pl-11 pr-10 py-3 text-sm text-white placeholder-neutral-500 backdrop-blur-md transition focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-neutral-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none rounded-full border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-xs sm:text-sm text-white backdrop-blur-md transition focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-neutral-900 text-white">
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* State Filter Dropdown */}
            <div className="md:col-span-3">
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full appearance-none rounded-full border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-xs sm:text-sm text-white backdrop-blur-md transition focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                >
                  {STATES.map((st) => (
                    <option key={st} value={st} className="bg-neutral-900 text-white">
                      {st}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Scrolling Category Pills */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs transition-all duration-150 ${
                    isActive
                      ? "bg-white text-black font-bold shadow-sm"
                      : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white font-medium"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Bar & Counter */}
          <div className="mt-4 pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-400">
              <span className="font-semibold text-white">{filteredSchemes.length}</span>
              <span>{filteredSchemes.length === 1 ? "scheme available" : "schemes available"}</span>
              {isFilterActive && (
                <span className="text-neutral-500 hidden sm:inline-block">
                  (filtered from {SCHEMES.length})
                </span>
              )}
            </div>

            {/* Clear Filters Button */}
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition font-medium underline underline-offset-4"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear all filters</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. 3D COVERFLOW CAROUSEL (SKIPER 49 INSPIRED) */}
        {filteredSchemes.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 py-4 sm:py-8 flex flex-col items-center justify-center select-none w-full"
          >
            {/* 3D Coverflow Container */}
            <div className="w-full max-w-5xl mx-auto relative flex items-center justify-center overflow-visible">
              <Swiper
                key={`${selectedCategory}-${selectedState}-${searchQuery}-${showSavedOnly}-${filteredSchemes.length}`}
                effect="coverflow"
                grabCursor={true}
                centeredSlides={true}
                slidesPerView="auto"
                loop={isLoop}
                coverflowEffect={{
                  rotate: 35,
                  stretch: 0,
                  depth: 160,
                  modifier: 1,
                  slideShadows: false,
                }}
                modules={[EffectCoverflow, Pagination, Navigation]}
                pagination={{
                  clickable: true,
                  el: ".custom-swiper-pagination",
                }}
                onSwiper={(swiper) => {
                  setSwiperInstance(swiper);
                  setCurrentIndex(swiper.realIndex ?? swiper.activeIndex);
                }}
                onSlideChange={(swiper) => {
                  setCurrentIndex(swiper.realIndex ?? swiper.activeIndex);
                }}
                className="w-full !py-6 !overflow-visible"
              >
                {filteredSchemes.map((scheme) => {
                  const isSaved = savedSchemeIds.includes(scheme.id);
                  return (
                    <SwiperSlide
                      key={scheme.id}
                      className="!w-[320px] sm:!w-[380px] !h-[460px] !rounded-3xl bg-neutral-900/85 border border-white/10 backdrop-blur-xl p-7 flex flex-col justify-between shadow-2xl text-white select-none overflow-hidden relative"
                    >
                      {/* Ambient top inner highlight */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent" />

                      <div className="relative z-10 flex flex-col">
                        {/* Top row: Category badge and State badge */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span className="bg-white/10 text-xs px-3 py-1 rounded-full border border-white/10 font-medium text-neutral-200">
                            {scheme.category}
                          </span>
                          <span className="rounded-full border border-white/10 bg-neutral-950/60 px-3 py-1 text-xs font-medium text-neutral-400">
                            {scheme.state}
                          </span>
                        </div>

                        {/* Center: Scheme name and description */}
                        <div className="mb-3">
                          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug line-clamp-2 mb-1">
                            {scheme.name}
                          </h2>
                          <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-3">
                            {scheme.ministry}
                          </p>
                          <p className="text-neutral-400 text-sm leading-relaxed line-clamp-4">
                            {scheme.shortDescription}
                          </p>
                        </div>

                        {/* Tags: Key eligibility pill tags */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {scheme.eligibility.slice(0, 2).map((crit, idx) => (
                            <span
                              key={idx}
                              className="bg-neutral-950/60 border border-white/5 text-xs px-2.5 py-1 rounded-lg text-neutral-300 truncate max-w-[280px]"
                              title={crit}
                            >
                              {crit}
                            </span>
                          ))}
                          {scheme.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={`tag-${idx}`}
                              className="bg-neutral-950/60 border border-white/5 text-xs px-2.5 py-1 rounded-lg text-neutral-400 font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bottom row: Save bookmark toggle and "View Details" button */}
                      <div className="border-t border-white/[0.08] pt-4 mt-auto flex items-center justify-between gap-3 relative z-10">
                        <button
                          type="button"
                          onClick={(e) => toggleSaveScheme(scheme.id, e)}
                          className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                            isSaved
                              ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                              : "border-white/10 bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700"
                          }`}
                          title={isSaved ? "Remove from saved" : "Save scheme"}
                          aria-label={isSaved ? "Remove bookmark" : "Add bookmark"}
                        >
                          <Bookmark
                            className={`h-4 w-4 ${isSaved ? "fill-amber-400 text-amber-400" : "fill-none"}`}
                          />
                        </button>

                        <div className="flex items-center gap-2">
                          <a
                            href={scheme.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full border border-white/10 bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700 transition shrink-0"
                            title="Visit official portal"
                            aria-label="Open portal link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setSelectedScheme(scheme)}
                            className="bg-white text-neutral-950 font-semibold px-5 py-2 rounded-full hover:bg-neutral-200 transition text-xs active:scale-95 shadow-md cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            {/* Custom Pagination Bullets */}
            <div className="custom-swiper-pagination flex items-center justify-center gap-1.5 mt-4 h-4 relative z-20" />

            {/* Minimalist Frosted Navigation Controls */}
            <div className="relative z-20 mt-3 flex items-center justify-center">
              <div className="flex items-center gap-2.5 sm:gap-3.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 px-4 py-2 rounded-full shadow-2xl text-white">
                <button
                  type="button"
                  onClick={() => swiperInstance?.slidePrev()}
                  disabled={!isLoop && currentIndex === 0}
                  className="text-white hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  aria-label="Previous scheme"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </button>

                <div className="flex items-center gap-2 px-1 text-center">
                  <span className="text-white font-bold text-xs">
                    {currentIndex + 1} / {filteredSchemes.length}
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-neutral-200 text-xs font-medium whitespace-nowrap">
                    Swipe card or use arrows
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => swiperInstance?.slideNext()}
                  disabled={!isLoop && currentIndex >= filteredSchemes.length - 1}
                  className="text-white hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  aria-label="Next scheme"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* 5. EMPTY STATE */
          <div className="relative z-10 rounded-3xl border border-neutral-800 bg-neutral-900/50 p-12 text-center backdrop-blur-md max-w-lg mx-auto my-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950/60 text-2xl mb-4">
              🔍
            </div>
            <h3 className="text-lg font-bold text-white">No Schemes Found</h3>
            <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">
              We could not find any government schemes matching your search filters. Try adjusting your query or resetting filters.
            </p>
            <div className="mt-6">
              <button
                onClick={resetFilters}
                className="rounded-full bg-white px-6 py-2.5 text-xs font-bold text-black transition hover:bg-neutral-200 active:scale-95"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 6. SCHEME DETAILS MODAL */}
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
                className="rounded-full border border-neutral-800 bg-neutral-950/70 p-2 text-neutral-400 hover:text-white transition hover:bg-neutral-800 shrink-0"
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
                className="rounded-full border border-neutral-700 bg-neutral-800/60 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => toggleSaveScheme(selectedScheme.id, e)}
                  className="rounded-full border border-neutral-700 bg-neutral-900/70 px-4 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition flex items-center gap-1.5"
                >
                  <svg
                    className={`h-3.5 w-3.5 ${savedSchemeIds.includes(selectedScheme.id) ? "fill-amber-400 text-amber-400" : "fill-none"}`}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  <span>{savedSchemeIds.includes(selectedScheme.id) ? "Saved" : "Save Scheme"}</span>
                </button>

                <a
                  href={selectedScheme.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-6 py-2.5 text-xs font-bold text-black transition hover:bg-neutral-200 active:scale-95 flex items-center gap-2"
                >
                  <span>Apply on Official Portal</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. FOOTER */}
      <footer className="relative z-20 border-t border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Yojana Connect • Citizen Services Gateway</p>
          <p className="text-[11px]">Government Initiatives Direct Verification & Access</p>
        </div>
      </footer>

      {/* 8. WALKING CROWD ANIMATION */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[40vh] z-0 opacity-40">
        <CrowdCanvas cols={7} rows={15} src="/images/peeps/all-peeps.png" />
      </div>
    </div>
  );
}

