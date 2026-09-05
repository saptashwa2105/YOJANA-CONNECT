const { z } = require('zod');
const { answerChat, InvalidSchemeIdError } = require('../services/ai/chatService');

const chatRequest = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(1000),
  language: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
      z.enum(['en', 'hi', 'hinglish', 'mr', 'ta', 'marathi', 'tamil', 'hindi', 'english'])
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
        role: z.enum(['user', 'assistant']),
        content: z.string().max(1000),
      })
    )
    .max(8)
    .optional(),
});

const handleChat = async (req, res, next) => {
  try {
    const input = chatRequest.parse(req.body);
    const result = await answerChat(input);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.issues,
      });
    }

    if (error instanceof InvalidSchemeIdError) {
      return res.status(404).json({
        error: 'Unknown schemeId',
      });
    }

    console.warn('=== [AI Chat Service Error Diagnostics (Returning Safe Fallback)] ===');
    console.warn('Message:', error.message || error);
    if (error.status) console.warn('HTTP Status:', error.status);
    console.warn('====================================================================');

    const requestedLang = req.body?.language || 'en';
    const fallbackAnswers = {
      hi: 'वर्तमान में AI सेवा उपलब्ध नहीं है। कृपया विस्तृत जानकारी के लिए आधिकारिक सरकारी पोर्टल देखें।',
      hinglish: 'AI service abhi uplabdh nahi hai. Kripya scheme ki jaankari ke liye official government portal check karein.',
      mr: 'सध्या AI सेवा उपलब्ध नाही. कृपया अधिक माहितीसाठी अधिकृत सरकारी संकेतस्थळाला भेट द्या.',
      ta: 'தற்போது AI சேவை கிடைக்கவில்லை. விரிவான தகவல்களுக்கு அதிகாரப்பூர்வ அரசு இணையதளத்தைப் பார்க்கவும்.',
      en: 'The AI assistant is temporarily operating in offline mode. Please check the official government scheme portals (such as pmkisan.gov.in or pmjay.gov.in) for current eligibility and application guidelines.',
    };

    return res.status(200).json({
      answer: fallbackAnswers[requestedLang] || fallbackAnswers.en,
      language: requestedLang,
      sources: [],
      schemes: req.body?.schemeId ? [req.body.schemeId] : [],
      fallback: true,
      error: error.message || 'The AI service is temporarily unavailable.',
    });
  }
};

module.exports = {
  handleChat,
};
