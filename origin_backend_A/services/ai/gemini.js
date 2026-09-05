const { GoogleGenAI } = require('@google/genai');

// Cached singleton client
let clientInstance = null;

/**
 * Resolves the embedding model name.
 * text-embedding-004 is mapped to gemini-embedding-001 (768-dim model used in pre-computed index).
 */
function resolveEmbeddingModel(modelName) {
  if (!modelName || modelName === 'text-embedding-004') {
    return 'gemini-embedding-001';
  }
  return modelName;
}

/**
 * Resolves the generation model name.
 * Default is gemini-3.5-flash-lite for lowest latency (<1.5s).
 */
function resolveGenerationModel(modelName) {
  if (!modelName) return 'gemini-3.5-flash-lite';
  if (
    modelName === 'gemini-1.5-flash' ||
    modelName === 'gemini-1.5-pro' ||
    modelName === 'gemini-1.0-pro'
  ) {
    return 'gemini-3.5-flash-lite';
  }
  return modelName;
}

function withTimeout(promise, milliseconds, operation) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`${operation} timed out after ${milliseconds / 1000} seconds.`)),
        milliseconds
      );
    }),
  ]);
}

/**
 * Returns a cached singleton GoogleGenAI client.
 */
function getClient() {
  if (clientInstance) {
    return clientInstance;
  }

  const rawKey = process.env.GEMINI_API_KEY || '';
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');

  if (!apiKey || apiKey === 'PASTE_YOUR_KEY_HERE') {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const options = { apiKey };

  if (process.env.GEMINI_VERTEX_AI === 'true' || process.env.VERTEX_AI === 'true') {
    options.vertexai = true;
  }
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.GEMINI_PROJECT_ID) {
    options.project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GEMINI_PROJECT_ID;
  }
  if (process.env.GOOGLE_CLOUD_LOCATION || process.env.GEMINI_LOCATION) {
    options.location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GEMINI_LOCATION;
  }
  if (process.env.GEMINI_API_VERSION) {
    options.apiVersion = process.env.GEMINI_API_VERSION;
  }

  clientInstance = new GoogleGenAI(options);
  return clientInstance;
}

async function embedMany(texts) {
  let lastError;
  const model = resolveEmbeddingModel(process.env.EMBEDDING_MODEL);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const client = getClient();
      const result = await withTimeout(
        client.models.embedContent({
          model,
          contents: texts,
          config: { outputDimensionality: 768 },
        }),
        10000,
        `Embedding request (${model})`
      );
      return result.embeddings.map((embedding) => embedding.values);
    } catch (error) {
      lastError = error;
      console.error(
        `[Gemini API Error] (embedContent, attempt ${attempt}/2, model: ${model}):`,
        error.message || error
      );

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  const detail = lastError.cause?.message || lastError.message || JSON.stringify(lastError);
  throw new Error(`Embedding request failed (${model}): ${detail}`);
}

async function embed(text) {
  return (await embedMany([text]))[0];
}

function getLanguageInstruction(language) {
  switch (language) {
    case 'mr':
      return 'Reply natively in Marathi (मराठी) using the Devanagari script. Do not reply in English or Hindi. Translate scheme details, benefits, and eligibility naturally into standard Marathi.';
    case 'ta':
      return 'Reply natively in Tamil (தமிழ்) using the Tamil script. Do not reply in English or Hindi. Translate scheme details, benefits, and eligibility naturally into standard Tamil.';
    case 'hi':
      return 'Reply natively in Hindi (हिंदी) using the Devanagari script. Do not reply in English. Translate scheme details and eligibility naturally into clear Hindi.';
    case 'hinglish':
      return 'Reply in conversational Hinglish (Hindi written phonetically using the Latin/English alphabet).';
    case 'en':
    default:
      return 'Reply in clear and concise English.';
  }
}

async function generateAnswer({ prompt, language }) {
  let lastError;
  const primaryModel = resolveGenerationModel(process.env.GEMINI_MODEL);
  const candidateModels = [primaryModel, 'gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest'];
  const uniqueModels = [...new Set(candidateModels.filter(Boolean))];

  for (const model of uniqueModels) {
    try {
      const client = getClient();
      const result = await withTimeout(
        client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: [
              'You are Yojana Connect, a concise and factual assistant for Indian government schemes.',
              'Use only the supplied scheme context, user profile, and previous conversation history.',
              'When the user asks follow-up questions (such as "Am I eligible?", "What documents?", "How do I apply?"), use the previous conversation history to understand which scheme is being discussed and apply the user profile.',
              'Never invent benefits, eligibility, documents, or URLs.',
              'Be concise, clear, and direct. Avoid conversational filler.',
              'If context is insufficient, start your reply with exactly INSUFFICIENT_CONTEXT: and state so plainly.',
              'Do not state that a user is definitely eligible; final eligibility is determined by official authorities.',
              getLanguageInstruction(language),
            ].join(' '),
            temperature: 0.1,
            maxOutputTokens: 250,
          },
        }),
        parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 25000,
        `Gemini response (${model})`
      );

      const answer = result.text?.trim();
      if (answer) return answer;
      lastError = new Error('Empty response from model');
    } catch (error) {
      lastError = error;
      console.error(
        `[Gemini API Error] (generateContent, model: ${model}):`,
        error.message || error
      );
    }
  }

  const detail = lastError.cause?.message || lastError.message || JSON.stringify(lastError);
  throw new Error(`Gemini generateContent failed across candidate models: ${detail}`);
}

module.exports = {
  embed,
  embedMany,
  generateAnswer,
  getClient,
  resolveEmbeddingModel,
  resolveGenerationModel,
};
