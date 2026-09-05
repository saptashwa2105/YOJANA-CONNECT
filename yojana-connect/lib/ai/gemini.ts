import { GoogleGenAI } from "@google/genai";
import { SupportedLanguage } from "./language";

let clientInstance: GoogleGenAI | null = null;

function resolveEmbeddingModel(modelName?: string): string {
  if (!modelName || modelName === "text-embedding-004") {
    return "gemini-embedding-001";
  }
  return modelName;
}

function resolveGenerationModel(modelName?: string): string {
  if (!modelName) return "gemini-3.5-flash-lite";
  if (
    modelName === "gemini-1.5-flash" ||
    modelName === "gemini-1.5-pro" ||
    modelName === "gemini-1.0-pro"
  ) {
    return "gemini-3.5-flash-lite";
  }
  return modelName;
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(
        () => reject(new Error(`${operation} timed out after ${milliseconds / 1000} seconds.`)),
        milliseconds
      );
    }),
  ]);
}

export function getGeminiClient(): GoogleGenAI {
  if (clientInstance) {
    return clientInstance;
  }

  const rawKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "");

  if (!apiKey || apiKey === "PASTE_YOUR_KEY_HERE") {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  clientInstance = new GoogleGenAI({ apiKey });
  return clientInstance;
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  let lastError: unknown;
  const model = resolveEmbeddingModel(process.env.EMBEDDING_MODEL);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const client = getGeminiClient();
      const result = await withTimeout(
        client.models.embedContent({
          model,
          contents: texts,
          config: { outputDimensionality: 768 },
        }),
        10000,
        `Embedding request (${model})`
      );

      if (result.embeddings) {
        return result.embeddings.map((e) => (e.values ? Array.from(e.values) : []));
      }
      throw new Error("No embeddings returned by model");
    } catch (error) {
      lastError = error;
      console.warn(
        `[Gemini API] embedContent attempt ${attempt}/2 failed (${model}):`,
        error instanceof Error ? error.message : error
      );
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Embedding request failed (${model}): ${message}`);
}

export async function embed(text: string): Promise<number[]> {
  const list = await embedMany([text]);
  return list[0];
}

function getLanguageInstruction(language: SupportedLanguage): string {
  switch (language) {
    case "mr":
      return "Reply natively in Marathi (मराठी) using the Devanagari script. Do not reply in English or Hindi. Translate scheme details, benefits, and eligibility naturally into standard Marathi.";
    case "ta":
      return "Reply natively in Tamil (தமிழ்) using the Tamil script. Do not reply in English or Hindi. Translate scheme details, benefits, and eligibility naturally into standard Tamil.";
    case "hi":
      return "Reply natively in Hindi (हिंदी) using the Devanagari script. Do not reply in English. Translate scheme details and eligibility naturally into clear Hindi.";
    case "hinglish":
      return "Reply in conversational Hinglish (Hindi written phonetically using the Latin/English alphabet).";
    case "en":
    default:
      return "Reply in clear and concise English.";
  }
}

export async function generateAnswer(options: {
  prompt: string;
  language: SupportedLanguage;
}): Promise<string> {
  const { prompt, language } = options;
  let lastError: unknown;
  const primaryModel = resolveGenerationModel(process.env.GEMINI_MODEL);
  const candidateModels = [primaryModel, "gemini-3.5-flash-lite", "gemini-3.7-flash", "gemini-flash-latest"];
  const uniqueModels = [...new Set(candidateModels.filter(Boolean))];

  for (const model of uniqueModels) {
    try {
      const client = getGeminiClient();
      const result = await withTimeout(
        client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: [
              "You are Yojana Connect, a concise and factual assistant for Indian government schemes.",
              "Use only the supplied scheme context, user profile, and previous conversation history.",
              "When the user asks follow-up questions (such as 'Am I eligible?', 'What documents?', 'How do I apply?'), use the previous conversation history to understand which scheme is being discussed and apply the user profile.",
              "Never invent benefits, eligibility, documents, or URLs.",
              "Be concise, clear, and direct. Avoid conversational filler.",
              "If context is insufficient, start your reply with exactly INSUFFICIENT_CONTEXT: and state so plainly.",
              "Do not state that a user is definitely eligible; final eligibility is determined by official authorities.",
              getLanguageInstruction(language),
            ].join(" "),
            temperature: 0.1,
            maxOutputTokens: 250,
          },
        }),
        parseInt(process.env.GEMINI_TIMEOUT_MS || "25000", 10),
        `Gemini response (${model})`
      );

      const answer = result.text?.trim();
      if (answer) return answer;
      lastError = new Error("Empty response from model");
    } catch (error) {
      lastError = error;
      console.warn(
        `[Gemini API] generateContent model ${model} failed:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Gemini generateContent failed across candidate models: ${message}`);
}
