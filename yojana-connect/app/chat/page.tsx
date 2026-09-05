"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, Send, Bot, User as UserIcon, ExternalLink, Loader2, ArrowLeft } from "lucide-react";
import { CrowdCanvas } from "@/components/CrowdCanvas";
import { sendChatMessage, ChatMessage, ChatSource } from "@/lib/api";

const PRESET_QUESTIONS = [
  "Which schemes am I eligible for as a farmer?",
  "What benefits does Ayushman Bharat (PM-JAY) provide?",
  "How do I apply for PM-KISAN and what documents are required?",
  "Are there any higher education scholarships for students?",
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "hinglish", label: "Hinglish" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
];

interface ExtendedChatMessage extends ChatMessage {
  sources?: ChatSource[];
  fallback?: boolean;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      role: "assistant",
      content:
        "Namaste! I am Yojana Connect AI, your intelligent guide to Indian government schemes and citizen benefits. How can I assist you today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedQuery = useRef(false);

  // Handle sending a message
  const handleSendMessage = React.useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || inputMessage).trim();
      if (!query || isLoading) return;

      setInputMessage("");

      // Append user message
      const userMsg: ExtendedChatMessage = { role: "user", content: query };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Read saved user criteria from sessionStorage if available
        let profile = undefined;
        if (typeof window !== "undefined") {
          const stored = sessionStorage.getItem("yojana_criteria");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              profile = {
                age: parsed.age ? Number(parsed.age) : undefined,
                state: parsed.state || undefined,
                occupation: parsed.occupation || undefined,
              };
            } catch {
              // Ignore
            }
          }
        }

        // Format conversation history for API (last 6 turns)
        const apiHistory: ChatMessage[] = [...messages, userMsg]
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await sendChatMessage({
          message: query,
          language: selectedLanguage,
          profile,
          conversation: apiHistory,
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.answer,
            sources: response.sources,
            fallback: response.fallback,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I encountered a temporary connection issue. Please verify official details on the central portal (myscheme.gov.in).",
            fallback: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [inputMessage, isLoading, messages, selectedLanguage]
  );

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle initial query from URL (e.g. from homepage search input)
  useEffect(() => {
    if (initialQuery && !hasInitializedQuery.current) {
      hasInitializedQuery.current = true;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, handleSendMessage]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-white selection:bg-white selection:text-black flex flex-col justify-between">
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-20 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <div className="h-4 w-px bg-neutral-800 hidden sm:block" />
            <Link href="/" className="font-black tracking-wider text-xl uppercase text-white hover:opacity-90 transition">
              Yojana.
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              <Sparkles className="h-3 w-3 text-amber-400" />
              AI Assistant
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector Dropdown */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-xs rounded-full px-3 py-1.5 text-neutral-300 focus:border-white focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-neutral-900 text-white">
                  {lang.label}
                </option>
              ))}
            </select>

            <Link
              href="/results"
              className="hidden sm:inline-block rounded-full border border-neutral-800 bg-neutral-900/60 px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white transition"
            >
              My Results
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN CHAT CONTAINER */}
      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 flex-1 flex flex-col justify-between">
        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`flex gap-3 items-start animate-fadeIn ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border ${
                    isUser
                      ? "bg-white text-black border-white"
                      : "bg-neutral-900 border-neutral-700 text-amber-400"
                  }`}
                >
                  {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Message Bubble Card */}
                <div
                  className={`rounded-2xl p-4 text-sm leading-relaxed max-w-[85%] sm:max-w-[75%] backdrop-blur-md shadow-lg ${
                    isUser
                      ? "bg-white text-black font-medium rounded-tr-none"
                      : "bg-neutral-900/90 border border-white/10 text-neutral-200 rounded-tl-none"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* Fallback Notice Banner */}
                  {!isUser && msg.fallback && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-amber-300 flex items-center gap-1.5">
                      <span>ℹ️ Direct scheme knowledge base response</span>
                    </div>
                  )}

                  {/* Official Citations / Sources */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Official Verification Sources:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url || "https://www.myscheme.gov.in"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs bg-neutral-950/70 border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white px-3 py-1.5 rounded-xl transition"
                          >
                            <span>{src.title}</span>
                            <ExternalLink className="h-3 w-3 text-neutral-500" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start animate-fadeIn">
              <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-neutral-900/90 border border-white/10 p-4 text-xs text-neutral-400 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Searching official scheme guidelines and verifying eligibility...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. INPUT AREA & PRESET PROMPTS */}
        <div className="pt-2 sticky bottom-4 z-20">
          {/* Quick Suggestion Chips */}
          {messages.length <= 2 && (
            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PRESET_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  className="shrink-0 text-xs bg-neutral-900/80 hover:bg-neutral-800 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white px-3.5 py-2 rounded-full transition cursor-pointer backdrop-blur-md active:scale-95 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center rounded-2xl border border-white/10 bg-neutral-900/90 backdrop-blur-xl shadow-2xl p-1.5"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask about any government scheme in ${LANGUAGES.find((l) => l.code === selectedLanguage)?.label}...`}
              disabled={isLoading}
              className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center transition hover:bg-neutral-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-2 text-center text-[11px] text-neutral-500">
            Powered by Yojana Connect RAG Vector Index & official Ministry sources.
          </p>
        </div>
      </main>

      {/* 4. WALKING CROWD ANIMATION (SUBTLE BACKGROUND) */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[25vh] z-0 opacity-25">
        <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <div className="flex items-center gap-3 text-neutral-400 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
            <span>Loading AI Assistant...</span>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
