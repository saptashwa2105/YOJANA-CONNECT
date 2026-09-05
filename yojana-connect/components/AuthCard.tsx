"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { googleSignInApi, githubSignInApi, magicLinkApi } from "@/lib/auth";

export function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  // OAuth & Magic Link State
  const [magicEmail, setMagicEmail] = useState("");
  const [isMagicSubmitting, setIsMagicSubmitting] = useState(false);
  const [isOAuthGoogle, setIsOAuthGoogle] = useState(false);
  const [isOAuthGithub, setIsOAuthGithub] = useState(false);

  // Submission & Validation States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetErrors = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});
  };

  // OAuth & Magic Link Handlers
  const handleGoogleSignIn = async () => {
    resetErrors();
    setIsOAuthGoogle(true);
    try {
      const res = await googleSignInApi();
      if (res.success) {
        setSuccessMessage("Signed in with Google! Redirecting...");
        setTimeout(() => {
          router.push(from);
          router.refresh();
        }, 500);
      } else {
        setErrorMessage(res.error || "Failed to sign in with Google.");
      }
    } catch {
      setErrorMessage("Google authentication failed. Please try again.");
    } finally {
      setIsOAuthGoogle(false);
    }
  };

  const handleGithubSignIn = async () => {
    resetErrors();
    setIsOAuthGithub(true);
    try {
      const res = await githubSignInApi();
      if (res.success) {
        setSuccessMessage("Signed in with GitHub! Redirecting...");
        setTimeout(() => {
          router.push(from);
          router.refresh();
        }, 500);
      } else {
        setErrorMessage(res.error || "Failed to sign in with GitHub.");
      }
    } catch {
      setErrorMessage("GitHub authentication failed. Please try again.");
    } finally {
      setIsOAuthGithub(false);
    }
  };

  const handleMagicLink = async (email: string) => {
    resetErrors();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldErrors((prev) => ({ ...prev, magicEmail: "Please provide a valid email address." }));
      return;
    }

    setIsMagicSubmitting(true);
    try {
      const res = await magicLinkApi(email.trim());
      if (res.success) {
        setSuccessMessage("Magic link verified! Redirecting to Citizen Portal...");
        setTimeout(() => {
          router.push(from);
          router.refresh();
        }, 500);
      } else {
        setErrorMessage(res.error || "Failed to process magic link.");
      }
    } catch {
      setErrorMessage("Failed to send magic link. Please try again.");
    } finally {
      setIsMagicSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Background ambient radial glow */}
      <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent blur-xl opacity-50" />

      {/* Main Glass Card */}
      <div className="relative rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <span className="mb-3 inline-block rounded-full border border-neutral-800 bg-neutral-900/90 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400 backdrop-blur-md">
            Citizen Services Gateway
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome Back
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-neutral-400">
            Access your citizen benefits and scheme applications
          </p>
        </div>

        {/* Global Error Notice */}
        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-200 backdrop-blur-md flex items-start gap-2.5 animate-fadeIn">
            <svg
              className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
            </svg>
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Global Success Notice */}
        {successMessage && (
          <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-200 backdrop-blur-md flex items-start gap-2.5 animate-fadeIn">
            <svg
              className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1 leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* Content Container */}
        <div className="space-y-4">
          {/* OAuth Section */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isOAuthGoogle || isOAuthGithub || isMagicSubmitting}
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-neutral-800/80 hover:border-neutral-700 transition flex items-center justify-center gap-3 backdrop-blur-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleGithubSignIn}
              disabled={isOAuthGoogle || isOAuthGithub || isMagicSubmitting}
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-neutral-800/80 hover:border-neutral-700 transition flex items-center justify-center gap-3 backdrop-blur-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800/80" />
            </div>
            <span className="relative bg-neutral-900/90 px-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 backdrop-blur-md">
              OR PASSWORDLESS MAGIC LINK
            </span>
          </div>

          {/* Magic Link Email Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleMagicLink(magicEmail);
            }}
            className="space-y-3"
            noValidate
          >
            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-neutral-300 uppercase mb-1.5">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  name="magicEmail"
                  placeholder="name@example.com"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  disabled={isMagicSubmitting}
                  className={`w-full rounded-2xl border bg-neutral-950/60 pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 backdrop-blur-md transition-all focus:outline-none focus:ring-1 ${
                    fieldErrors.magicEmail
                      ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/30"
                      : "border-neutral-800 focus:border-neutral-500 focus:ring-neutral-400"
                  }`}
                />
              </div>
              {fieldErrors.magicEmail && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.magicEmail}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isMagicSubmitting}
              className="w-full rounded-full bg-white py-3 px-6 text-sm font-bold text-black transition-all hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isMagicSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Sending Link...</span>
                </>
              ) : (
                <span>Continue with Email &rarr;</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info note */}
        <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center">
          <p className="text-[11px] text-neutral-500">
            Protected by Citizen Security Protocol & Data Privacy Standards
          </p>
        </div>
      </div>
    </div>
  );
}
