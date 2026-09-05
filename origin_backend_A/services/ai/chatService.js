const { embed, generateAnswer } = require('./gemini');
const { resolveLanguage } = require('./language');
const { search, hasScheme } = require('./vectorStore');
const {
  resolveCanonicalSchemeId,
  extractSchemeIdFromText,
  extractSchemeIdFromConversation,
} = require('../../utils/schemeIdHelper');

const NO_CONTEXT_MESSAGES = {
  en: "I couldn't find enough information about that in the available government scheme documents. Please check the official source for the latest details.",
  hi: "उपलब्ध सरकारी योजना दस्तावेजों में मुझे इसके बारे में पर्याप्त जानकारी नहीं मिली। कृपया नवीनतम विवरण के लिए आधिकारिक स्रोत देखें।",
  hinglish: "Mujhe uplabdh sarkari yojana documents mein iske baare mein zaroori jaankari nahi mili. Kripya latest details ke liye official source check karein.",
  mr: "उपलब्ध सरकारी योजना कागदपत्रांमध्ये मला याबद्दल पुरेशी माहिती आढळली नाही. कृपया नवीनतम तपशिलांसाठी अधिकृत स्त्रोत तपासा.",
  ta: "கிடைக்கக்கூடிய அரசு திட்ட ஆவணங்களில் போதுமான தகவலை என்னால் கண்டுபிடிக்க முடியவில்லை. சமீபத்திய விவரங்களுக்கு அதிகாரப்பூர்வ இணையதளத்தைப் பார்க்கவும்.",
};

function getNoContextMessage(lang) {
  return NO_CONTEXT_MESSAGES[lang] || NO_CONTEXT_MESSAGES.en;
}

class InvalidSchemeIdError extends Error {
  constructor(schemeId) {
    super(`Unknown schemeId: ${schemeId}`);
    this.name = 'InvalidSchemeIdError';
  }
}

function toSources(results) {
  const unique = new Map();
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

async function answerChat({ message, language, schemeId, profile, conversation = [] }) {
  const answerLanguage = resolveLanguage(message, language || profile?.language);

  // Determine active scheme ID: explicit schemeId, or extracted from message, or extracted from conversation
  let activeSchemeId = schemeId ? resolveCanonicalSchemeId(schemeId) : null;
  if (schemeId && !(await hasScheme(activeSchemeId))) {
    throw new InvalidSchemeIdError(schemeId);
  }

  if (!activeSchemeId) {
    const inferredId = extractSchemeIdFromText(message) || extractSchemeIdFromConversation(conversation);
    if (inferredId && (await hasScheme(inferredId))) {
      activeSchemeId = inferredId;
    }
  }

  // 1. Generate query embedding with follow-up awareness
  // If the query is brief and follows a previous user turn, contextualize embedding to retrieve the target scheme
  let queryForEmbedding = message;
  if (Array.isArray(conversation) && conversation.length > 0) {
    const lastUserTurn = [...conversation].reverse().find((item) => item.role === 'user')?.content;
    const wordCount = message.trim().split(/\s+/).length;
    if (lastUserTurn && (wordCount <= 7 || !activeSchemeId)) {
      queryForEmbedding = `${lastUserTurn} ${message}`;
    }
  }

  const queryEmbedding = await embed(queryForEmbedding);

  // 2. Retrieve top 2 most relevant chunks for a lean, fast prompt payload
  const results = await search(queryEmbedding, { schemeId: activeSchemeId, limit: 2 });

  // Cross-lingual semantic threshold (0.45 for non-English to English document matching)
  const scoreThreshold = (answerLanguage === 'en' || answerLanguage === 'hinglish') ? 0.5 : 0.45;

  if (!results.length || results[0].score < scoreThreshold) {
    return {
      answer: getNoContextMessage(answerLanguage),
      language: answerLanguage,
      sources: [],
      schemes: [],
      fallback: true,
    };
  }

  // 3. Compact context assembly (avoiding redundant filler)
  const context = results.map((result) => result.text).join('\n---\n');

  // 4. Format conversation history (up to last 6 messages) compactly
  const formattedConversation = Array.isArray(conversation) && conversation.length > 0
    ? conversation
        .slice(-6)
        .map((item) => {
          const role = item.role === 'assistant' ? 'Assistant' : 'User';
          const content = (item.content || '').trim().replace(/\s+/g, ' ');
          const truncated = content.length > 300 ? content.slice(0, 297) + '...' : content;
          return `${role}: ${truncated}`;
        })
        .join('\n')
    : '';

  // 5. Compact profile representation
  let safeProfile = '';
  if (profile && (profile.age || profile.state || profile.occupation)) {
    const parts = [];
    if (profile.age) parts.push(`Age: ${profile.age}`);
    if (profile.state) parts.push(`State: ${profile.state}`);
    if (profile.occupation) parts.push(`Occupation: ${profile.occupation}`);
    safeProfile = parts.join(', ');
  }

  const promptSections = [
    safeProfile ? `User Profile:\n${safeProfile}` : '',
    formattedConversation ? `Previous Conversation History:\n${formattedConversation}` : '',
    `Current Question:\n${message}`,
    `Scheme Context:\n${context}`,
  ];

  const answer = await generateAnswer({
    language: answerLanguage,
    prompt: promptSections.filter(Boolean).join('\n\n'),
  });

  if (!answer) {
    throw new Error('The language model returned an empty answer.');
  }

  const insufficientPrefix = 'INSUFFICIENT_CONTEXT:';
  if (answer.startsWith(insufficientPrefix)) {
    return {
      answer: answer.slice(insufficientPrefix.length).trim() || getNoContextMessage(answerLanguage),
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

module.exports = {
  answerChat,
  InvalidSchemeIdError,
};
