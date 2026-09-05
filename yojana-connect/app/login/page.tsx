import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { CrowdCanvas } from "@/components/CrowdCanvas";

export const metadata: Metadata = {
  title: "Citizen Gateway | Sign In & Register - Yojana Connect",
  description: "Sign in or create an account to verify eligibility and apply for government initiatives with zero friction.",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-white selection:bg-white selection:text-black flex flex-col justify-between">
      {/* 1. GIANT BOLD BACKGROUND: YOJANA CONNECT */}
      <div className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center">
        <h1 className="text-center font-black tracking-tighter text-[12vw] leading-none text-white/10 uppercase">
          YOJANA<br className="sm:hidden" /> CONNECT
        </h1>
      </div>

      {/* 2. TOP BRAND HEADER */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="font-black tracking-wider text-xl uppercase">Yojana.</div>
          <span className="hidden sm:inline-block rounded-full border border-neutral-800 bg-neutral-900/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Auth v1.0
          </span>
        </div>
        <div className="text-xs font-medium text-neutral-400">
          Citizen Services Gateway
        </div>
      </header>

      {/* 3. CENTER AUTH CARD CONTAINER */}
      <section className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10">
        <Suspense
          fallback={
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-12 text-center text-neutral-500 backdrop-blur-xl">
              <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs font-medium uppercase tracking-widest">
                Loading Secure Gateway...
              </p>
            </div>
          }
        >
          <AuthCard />
        </Suspense>
      </section>

      {/* 4. WALKING CROWD ANIMATION (SUBTLE BOTTOM LAYER) */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[35vh] w-full z-10 opacity-40">
        <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
      </div>
    </main>
  );
}

