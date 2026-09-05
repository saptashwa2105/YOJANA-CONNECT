"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "./AuthContext";

export function HeaderNav() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="relative z-20 flex items-center justify-between px-6 sm:px-8 py-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Link className="flex items-center gap-3 group" href="/">
          <Image
            src="/images/yojana-symbol.png"
            alt="Yojana Connect"
            width={32}
            height={32}
            className="h-7 sm:h-8 w-auto object-contain brightness-0 invert group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all"
          />
          <span className="font-bold text-base sm:text-lg tracking-tight text-white">
            YOJANA<span className="text-neutral-400 font-normal ml-1.5">CONNECT</span>
          </span>
        </Link>
        <span className="hidden sm:inline-block rounded-full border border-neutral-800 bg-neutral-900/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Citizen Portal
        </span>
      </div>

      <nav className="flex items-center gap-5 sm:gap-8 text-sm font-medium text-neutral-400">
        <Link href="/explore" className="hover:text-white transition hidden md:inline-block">
          Schemes
        </Link>
        <a href="#about" className="hover:text-white transition hidden md:inline-block">
          About
        </a>
        <a href="#contact" className="hover:text-white transition hidden md:inline-block">
          Contact
        </a>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-white leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-neutral-500 leading-tight">
                {user.email}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="rounded-full border border-neutral-700 bg-neutral-900/80 px-4 py-1.5 text-xs font-semibold text-neutral-300 backdrop-blur-sm transition hover:bg-neutral-800 hover:text-white active:scale-95"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black transition hover:bg-neutral-200"
          >
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}

