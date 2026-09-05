"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATES } from "@/data/schemes";
import { CrowdCanvas } from "@/components/CrowdCanvas";

export interface UserCriteria {
  age: string;
  gender: string;
  state: string;
  area: string;
  category: string;
  occupation: string;
  income: string;
  isDisability: boolean;
  isMinority: boolean;
  isStudent: boolean;
}

const GENDERS = ["Male", "Female", "Transgender / Other"];
const AREAS = ["Urban", "Rural"];
const CATEGORIES = ["General", "OBC", "SC", "ST"];
const OCCUPATIONS = [
  "Farmer",
  "Student",
  "Salaried",
  "Self-Employed",
  "Unemployed",
  "Daily Wage",
];
const INCOME_RANGES = [
  "Below ₹1 Lakh",
  "₹1L - ₹2.5L",
  "₹2.5L - ₹5L",
  "Above ₹5L",
];

export default function FindSchemesPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState<UserCriteria>({
    age: "",
    gender: "Male",
    state: "All India",
    area: "Urban",
    category: "General",
    occupation: "Farmer",
    income: "Below ₹1 Lakh",
    isDisability: false,
    isMinority: false,
    isStudent: false,
  });

  const [validationError, setValidationError] = useState("");

  const updateField = <K extends keyof UserCriteria>(field: K, value: UserCriteria[K]) => {
    setValidationError("");
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.age || Number(formData.age) <= 0 || Number(formData.age) > 120) {
        setValidationError("Please enter a valid age between 1 and 120.");
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 2) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 3) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  const handleSubmit = () => {
    // 1. Store in sessionStorage for fast reliable client-side hydration
    if (typeof window !== "undefined") {
      sessionStorage.setItem("yojana_criteria", JSON.stringify(formData));
    }

    // 2. Build URL search parameters so results page is shareable and reloadable
    const params = new URLSearchParams({
      age: formData.age,
      gender: formData.gender,
      state: formData.state,
      area: formData.area,
      category: formData.category,
      occupation: formData.occupation,
      income: formData.income,
      disability: formData.isDisability ? "1" : "0",
      minority: formData.isMinority ? "1" : "0",
      student: formData.isStudent ? "1" : "0",
    });

    router.push(`/results?${params.toString()}`);
  };

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
              Eligibility Wizard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-neutral-400">
              Step {currentStep} of 3
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN QUESTIONNAIRE AREA */}
      <main className="relative z-10 mx-auto w-full max-w-2xl px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        
        {/* Progress Bar Header */}
        <div className="mb-8 text-center">
          <span className="mb-3 inline-block rounded-full border border-neutral-800 bg-neutral-900/80 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-400 backdrop-blur-md">
            Citizen Profile Matching
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Find Eligible Schemes
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-neutral-400">
            Answer a few quick questions to discover direct financial grants, welfare schemes, and subsidies customized for you.
          </p>

          {/* Minimalist 3-Step Progress Indicator */}
          <div className="mt-6 flex items-center justify-between gap-2 max-w-md mx-auto">
            {[
              { step: 1, label: "Basic Details" },
              { step: 2, label: "Occupation" },
              { step: 3, label: "Income & Specifics" },
            ].map((item) => (
              <div key={item.step} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-neutral-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentStep >= item.step ? "bg-white" : "bg-neutral-800"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-medium ${
                    currentStep === item.step ? "text-white font-bold" : "text-neutral-500"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Questionnaire Form Card */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          
          {validationError && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
              {validationError}
            </div>
          )}

          {/* STEP 1: BASIC DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold text-white">Basic Demographic Details</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Tell us your age and residence location to map local and national policies.
                </p>
              </div>

              {/* Age Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                  What is your age? *
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:border-white focus:outline-none text-sm placeholder-neutral-600 transition"
                />
              </div>

              {/* Gender Pills */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                  Gender *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {GENDERS.map((g) => {
                    const isSelected = formData.gender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateField("gender", g)}
                        className={`rounded-xl py-3 px-3 text-xs sm:text-sm font-semibold transition cursor-pointer text-center ${
                          isSelected
                            ? "bg-white text-black shadow-md"
                            : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* State / UT Dropdown */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                  State / Union Territory *
                </label>
                <div className="relative">
                  <select
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="w-full appearance-none bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:border-white focus:outline-none text-sm cursor-pointer pr-10 transition"
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

              {/* Area of Residence */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                  Area of Residence
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {AREAS.map((a) => {
                    const isSelected = formData.area === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => updateField("area", a)}
                        className={`rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold transition cursor-pointer text-center ${
                          isSelected
                            ? "bg-white text-black shadow-md"
                            : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                        }`}
                      >
                        {a === "Urban" ? "🏙️ Urban" : "🌾 Rural"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CATEGORY & OCCUPATION */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold text-white">Category & Employment</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Social category and livelihood status unlock dedicated reservations, loans, and subsidies.
                </p>
              </div>

              {/* Social Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                  Social Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CATEGORIES.map((c) => {
                    const isSelected = formData.category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateField("category", c)}
                        className={`rounded-xl py-3 px-3 text-xs sm:text-sm font-semibold transition cursor-pointer text-center ${
                          isSelected
                            ? "bg-white text-black shadow-md"
                            : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                  Primary Occupation / Livelihood
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {OCCUPATIONS.map((occ) => {
                    const isSelected = formData.occupation === occ;
                    return (
                      <button
                        key={occ}
                        type="button"
                        onClick={() => updateField("occupation", occ)}
                        className={`rounded-xl py-3 px-3 text-xs sm:text-sm font-semibold transition cursor-pointer text-center ${
                          isSelected
                            ? "bg-white text-black shadow-md"
                            : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                        }`}
                      >
                        {occ}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INCOME & SPECIFICS */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold text-white">Income & Special Conditions</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Financial slabs determine eligibility for direct cash benefits and healthcare allowances.
                </p>
              </div>

              {/* Income Range */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                  Annual Family Income (Gross)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INCOME_RANGES.map((inc) => {
                    const isSelected = formData.income === inc;
                    return (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => updateField("income", inc)}
                        className={`rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold transition cursor-pointer text-left flex items-center justify-between ${
                          isSelected
                            ? "bg-white text-black shadow-md"
                            : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                        }`}
                      >
                        <span>{inc}</span>
                        {isSelected && <span className="text-black font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Criteria Toggles */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                  Special Eligibility Criteria
                </label>
                <div className="space-y-2.5">
                  {[
                    {
                      id: "isDisability" as const,
                      label: "Differently Abled (Divyangjan / PwD)",
                      desc: "Qualifies for enhanced subsidies and accessibility allowances",
                    },
                    {
                      id: "isMinority" as const,
                      label: "Minority Community Member",
                      desc: "Eligible for dedicated scholarships and development funds",
                    },
                    {
                      id: "isStudent" as const,
                      label: "Currently Enrolled Student / Scholar",
                      desc: "Eligible for stipend assistance and educational fee waivers",
                    },
                  ].map((item) => {
                    const isChecked = formData[item.id];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updateField(item.id, !isChecked)}
                        className={`w-full rounded-2xl p-4 border transition cursor-pointer text-left flex items-center justify-between gap-3 ${
                          isChecked
                            ? "border-neutral-600 bg-neutral-900 text-white"
                            : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                            isChecked
                              ? "bg-white border-white text-black font-bold text-xs"
                              : "border-neutral-700 bg-neutral-900"
                          }`}
                        >
                          {isChecked ? "✓" : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons Row */}
          <div className="mt-8 pt-6 border-t border-neutral-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="border border-neutral-800 text-neutral-300 rounded-full py-3 px-6 hover:bg-neutral-900 transition text-xs sm:text-sm font-semibold active:scale-95 cursor-pointer"
            >
              {currentStep === 1 ? "Cancel" : "← Back"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="bg-white text-black font-bold rounded-full py-3 px-6 sm:px-8 hover:bg-neutral-200 transition text-xs sm:text-sm shadow-md active:scale-95 cursor-pointer"
            >
              {currentStep === 3 ? "Find Matching Schemes →" : "Continue →"}
            </button>
          </div>
        </div>
      </main>

      {/* 3. WALKING CROWD ANIMATION */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[35vh] z-0 opacity-40">
        <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
      </div>

      {/* 4. FOOTER */}
      <footer className="relative z-20 border-t border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Yojana Connect • Citizen Eligibility Questionnaire</p>
          <p className="text-[11px]">Direct Government Scheme Verification</p>
        </div>
      </footer>
    </div>
  );
}

