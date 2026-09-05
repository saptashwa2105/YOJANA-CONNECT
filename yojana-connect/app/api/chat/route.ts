import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { answerChat, InvalidSchemeIdError } from "@/lib/ai/chatService";

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(1000),
  language: z
    .preprocess(
      (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
      z.enum([
        "en",
        "hi",
        "hinglish",
        "mr",
        "ta",
        "marathi",
        "tamil",
        "hindi",
        "english",
      ])
    )
    .optional(),
  schemeId: z.string().trim().min(1).max(100).optional().nullable(),
  profile: z
    .object({
      age: z.number().int().min(0).max(130).optional(),
      state: z.string().max(100).optional(),
      occupation: z.string().max(100).optional(),
    })
    .optional()
    .nullable(),
  conversation: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(1000),
      })
    )
    .max(8)
    .optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  try {
    const input = chatRequestSchema.parse(body);
    const result = await answerChat(input);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof InvalidSchemeIdError) {
      return NextResponse.json(
        {
          error: "Unknown schemeId",
        },
        { status: 404 }
      );
    }

    console.warn("=== [AI Chat API Diagnostics (Returning Safe Fallback)] ===");
    console.warn("Error:", error instanceof Error ? error.message : error);
    console.warn("=========================================================");

    const requestedLang = (body as { language?: string })?.language || "en";
    const fallbackAnswers: Record<string, string> = {
      hi: "वर्तमान में AI सेवा उपलब्ध नहीं है। कृपया विस्तृत जानकारी के लिए आधिकारिक सरकारी पोर्टल देखें।",
      hinglish:
        "AI service abhi uplabdh nahi hai. Kripya scheme ki jaankari ke liye official government portal check karein.",
      mr: "सध्या AI सेवा उपलब्ध नाही. कृपया अधिक माहितीसाठी अधिकृत सरकारी संकेतस्थळाला भेट द्या.",
      ta: "தற்போது AI சேவை கிடைக்கவில்லை. விரிவான தகவல்களுக்கு அதிகாரப்பூர்வ அரசு இணையதளத்தைப் பார்க்கவும்.",
      en: "The AI assistant is temporarily operating in offline mode. Please check the official government scheme portals (such as pmkisan.gov.in or pmjay.gov.in) for current eligibility and application guidelines.",
    };

    return NextResponse.json(
      {
        answer: fallbackAnswers[requestedLang] || fallbackAnswers.en,
        language: requestedLang,
        sources: [],
        schemes: (body as { schemeId?: string })?.schemeId
          ? [(body as { schemeId?: string }).schemeId!]
          : [],
        fallback: true,
        error:
          error instanceof Error
            ? error.message
            : "The AI service is temporarily unavailable.",
      },
      { status: 200 }
    );
  }
}

