import { embed, generateAnswer } from "./gemini";
import { resolveLanguage, SupportedLanguage } from "./language";
import { search, hasScheme } from "./vectorStore";
import {
  resolveCanonicalSchemeId,
  extractSchemeIdFromText,
  extractSchemeIdFromConversation,
} from "./schemeIdHelper";

const NO_CONTEXT_MESSAGES: Record<SupportedLanguage, string> = {
  en: "I couldn't find enough information about that in the available government scheme documents. Please check the official source for the latest details.",
  hi: "उपलब्ध सरकारी योजना दस्तावेजों में मुझे इसके बारे में पर्याप्त जानकारी नहीं मिली। कृपया नवीनतम विवरण के लिए आधिकारिक स्रोत देखें।",
  hinglish:
    "Mujhe uplabdh sarkari yojana documents mein iske baare mein zaroori jaankari nahi mili. Kripya latest details ke liye official source check karein.",
  mr: "उपलब्ध सरकारी योजना कागदपत्रांमध्ये मला याबद्दल पुरेशी माहिती आढळली नाही. कृपया नवीनतम तपशिलांसाठी अधिकृत स्त्रोत तपासा.",
  ta: "கிடைக்கக்கூடிய அரசு திட்ட ஆவணங்களில் போதுமான தகவலை என்னால் கண்டுபிடிக்க முடியவில்லை. சமீபத்திய விவரங்களுக்கு அதிகாரப்பூர்வ இணையதளத்தைப் பார்க்கவும்.",
};

function getNoContextMessage(lang: SupportedLanguage): string {
  return NO_CONTEXT_MESSAGES[lang] || NO_CONTEXT_MESSAGES.en;
}

export class InvalidSchemeIdError extends Error {
  constructor(schemeId: string) {
    super(`Unknown schemeId: ${schemeId}`);
    this.name = "InvalidSchemeIdError";
  }
}

export interface ChatSource {
  schemeId: string;
  title: string;
  url?: string;
  section?: string;
}

export interface AnswerChatOptions {
  message: string;
  language?: string;
  schemeId?: string | null;
  profile?: {
    age?: number;
    state?: string;
    occupation?: string;
    language?: string;
  } | null;
  conversation?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface ChatAnswerResult {
  answer: string;
  language: SupportedLanguage;
  sources: ChatSource[];
  schemes: string[];
  fallback: boolean;
}

function toSources(
  results: Array<{
    metadata: {
      schemeId: string;
      schemeName: string;
      section: string;
      officialUrl?: string;
    };
  }>
): ChatSource[] {
  const unique = new Map<string, ChatSource>();
  for (const result of results) {
    const { schemeId, schemeName, section, officialUrl } = result.metadata;
    unique.set(`${schemeId}:${section}`, {
      schemeId,
      title: schemeName,
      url: officialUrl,
      section,
    });
  }
  return [...unique.values()];
}

export async function answerChat(options: AnswerChatOptions): Promise<ChatAnswerResult> {
  const { message, language, schemeId, profile, conversation = [] } = options;
  const answerLanguage = resolveLanguage(message, language || profile?.language);

  // Determine active scheme ID: explicit schemeId, or extracted from message, or extracted from conversation
  let activeSchemeId = schemeId ? resolveCanonicalSchemeId(schemeId) : null;
  if (schemeId && !(await hasScheme(activeSchemeId))) {
    throw new InvalidSchemeIdError(schemeId);
  }

  if (!activeSchemeId) {
    const inferredId =
      extractSchemeIdFromText(message) || extractSchemeIdFromConversation(conversation);
    if (inferredId && (await hasScheme(inferredId))) {
      activeSchemeId = inferredId;
    }
  }

  // 1. Generate query embedding with follow-up awareness
  let queryForEmbedding = message;
  if (Array.isArray(conversation) && conversation.length > 0) {
    const lastUserTurn = [...conversation].reverse().find((item) => item.role === "user")?.content;
    const wordCount = message.trim().split(/\s+/).length;
    if (lastUserTurn && (wordCount <= 7 || !activeSchemeId)) {
      queryForEmbedding = `${lastUserTurn} ${message}`;
    }
  }

  const queryEmbedding = await embed(queryForEmbedding);

  // 2. Retrieve top 2 most relevant chunks
  const results = await search(queryEmbedding, { schemeId: activeSchemeId, limit: 2 });

  // Cross-lingual semantic threshold
  const scoreThreshold = answerLanguage === "en" || answerLanguage === "hinglish" ? 0.5 : 0.45;

  if (!results.length || results[0].score < scoreThreshold) {
    return {
      answer: getNoContextMessage(answerLanguage),
      language: answerLanguage,
      sources: [],
      schemes: [],
      fallback: true,
    };
  }

  // 3. Compact context assembly
  const context = results.map((result) => result.text).join("\n---\n");

  // 4. Format conversation history (up to last 6 messages) compactly
  const formattedConversation =
    Array.isArray(conversation) && conversation.length > 0
      ? conversation
          .slice(-6)
          .map((item) => {
            const role = item.role === "assistant" ? "Assistant" : "User";
            const content = (item.content || "").trim().replace(/\s+/g, " ");
            const truncated = content.length > 300 ? content.slice(0, 297) + "..." : content;
            return `${role}: ${truncated}`;
          })
          .join("\n")
      : "";

  // 5. Compact profile representation
  let safeProfile = "";
  if (profile && (profile.age || profile.state || profile.occupation)) {
    const parts: string[] = [];
    if (profile.age) parts.push(`Age: ${profile.age}`);
    if (profile.state) parts.push(`State: ${profile.state}`);
    if (profile.occupation) parts.push(`Occupation: ${profile.occupation}`);
    safeProfile = parts.join(", ");
  }

  const promptSections = [
    safeProfile ? `User Profile:\n${safeProfile}` : "",
    formattedConversation ? `Previous Conversation History:\n${formattedConversation}` : "",
    `Current Question:\n${message}`,
    `Scheme Context:\n${context}`,
  ];

  const answer = await generateAnswer({
    language: answerLanguage,
    prompt: promptSections.filter(Boolean).join("\n\n"),
  });

  if (!answer) {
    throw new Error("The language model returned an empty answer.");
  }

  const insufficientPrefix = "INSUFFICIENT_CONTEXT:";
  if (answer.startsWith(insufficientPrefix)) {
    return {
      answer:
        answer.slice(insufficientPrefix.length).trim() || getNoContextMessage(answerLanguage),
      language: answerLanguage,
      sources: [],
      schemes: [],
      fallback: true,
    };
  }

  return {
    answer,
    language: answerLanguage,
    sources: toSources(results),
    schemes: [...new Set(results.map((result) => result.metadata.schemeId))],
    fallback: false,
  };
}

