/**
 * Multi-lingual Language Detection and Normalization Utility
 * Supports 5 languages:
 * - English ('en')
 * - Hindi ('hi')
 * - Hinglish ('hinglish')
 * - Marathi ('mr')
 * - Tamil ('ta')
 */

export const SUPPORTED_LANGUAGES = ["en", "hi", "hinglish", "mr", "ta"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_ALIASES: Record<string, SupportedLanguage> = {
  mr: "mr",
  marathi: "mr",
  "mr-in": "mr",
  ta: "ta",
  tamil: "ta",
  "ta-in": "ta",
  hi: "hi",
  hindi: "hi",
  "hi-in": "hi",
  hinglish: "hinglish",
  "hi-latn": "hinglish",
  en: "en",
  english: "en",
  "en-us": "en",
  "en-in": "en",
};

const MARATHI_WORDS = new Set([
  "आहे", "आहेत", "नाही", "नाहीत", "होते", "होती", "होता",
  "काय", "कसे", "कसा", "कशी", "कधी", "कुठे", "कोणाला", "कोणता", "कोणती", "कोणते",
  "मला", "माझा", "माझी", "माझे", "माझ्या", "आमचा", "आमची", "आमचे", "आम्हाला",
  "स्वतः", "साठी", "योजनेसाठी", "योजनेचे", "योजनेचा", "योजनेची", "योजनेत", "योजनेला",
  "मिळेल", "मिळतील", "मिळतो", "मिळते", "मिळतात", "मिळू",
  "करावे", "करावा", "करावी", "करा", "सांगा", "कागदपत्रे", "पात्रता", "माहिती", "अर्ज",
  "नियम", "अटी", "इत्यादी", "तपशील", "बद्दल", "फायदे", "योजना"
]);

const HINDI_WORDS = new Set([
  "है", "हैं", "था", "थी", "थे", "होगी", "होगा", "होंगे",
  "क्या", "कैसे", "कैसा", "कैसी", "कब", "कहाँ", "कहा", "कौन", "कौनसी", "कौनसा", "किसे", "किसको",
  "मुझे", "मेरा", "मेरी", "मेरे", "हमारा", "हमारी", "हमारे", "हमें",
  "के", "लिए", "मिलेगा", "मिलेगी", "मिलेंगे", "करें", "करना", "बताएं", "बताइए",
  "दस्तावेज", "कागजात", "लाभ", "आवेदन", "जानकारी", "शर्तें"
]);

export function detectLanguage(text?: string | null): SupportedLanguage {
  if (!text || typeof text !== "string") return "en";
  const clean = text.trim();
  if (!clean) return "en";

  // 1. Tamil Script Detection (\u0B80-\u0BFF)
  if (/[\u0B80-\u0BFF]/.test(clean)) {
    return "ta";
  }

  // Romanized Tamil keywords
  if (/\b(thittam|thittangal|pathivu|thevai|eppadi|enna|yaarukku|enakku|ungalukku|vinnappam|uthavi)\b/i.test(clean)) {
    return "ta";
  }

  // 2. Devanagari Script Detection (\u0900-\u097F)
  if (/[\u0900-\u097F]/.test(clean)) {
    if (/[\u0933]/.test(clean)) {
      return "mr"; // ळ is exclusive to Marathi
    }

    const tokens = clean
      .replace(/[।!?.,;:()"'/\\`~@#$%^&*_+=[\]{}|<>]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    let marathiScore = 0;
    let hindiScore = 0;

    for (const token of tokens) {
      if (MARATHI_WORDS.has(token)) marathiScore += 2;
      if (HINDI_WORDS.has(token)) hindiScore += 2;

      if (/(चे|च्या|साठी|तील|वरून|बद्दल)$/.test(token) && token.length > 2) {
        marathiScore += 1;
      }
    }

    return marathiScore > hindiScore ? "mr" : "hi";
  }

  // 3. Romanized Marathi
  if (/\b(ahe|aahe|ahet|aahet|nahi|kaay|kase|kasa|kashi|kadhi|kuthe|mala|majha|majhi|majhe|sathi|yojanasathi|yojaneche|mahiti|patrata|kagadpatre|miltil|milnar)\b/i.test(clean)) {
    return "mr";
  }

  // 4. Hinglish
  if (/\b(kya|kaise|kaun|kab|kahan|kaha|mujhe|mera|meri|mere|hoga|hogi|milega|milegi|chahiye|batao|bataiye|ke liye|yojana|apply kaise|kitna|kitne)\b/i.test(clean)) {
    return "hinglish";
  }

  return "en";
}

export function resolveLanguage(message: string, requestedLanguage?: string | null): SupportedLanguage {
  if (requestedLanguage && typeof requestedLanguage === "string") {
    const normalized = requestedLanguage.trim().toLowerCase();
    const mapped = LANGUAGE_ALIASES[normalized];
    if (mapped) {
      return mapped;
    }
  }

  return detectLanguage(message);
}

