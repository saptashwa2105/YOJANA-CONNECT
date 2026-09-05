const fs = require('node:fs/promises');
const path = require('node:path');
const { resolveCanonicalSchemeId } = require('../../utils/schemeIdHelper');

const indexPath = path.resolve(__dirname, '../../data/index/schemes.index.json');

// In-memory cache structures
let cachedIndex = null;
let schemeChunksMap = null;
let schemeIdsSet = null;

/**
 * Computes vector magnitude (Euclidean norm)
 */
function computeMagnitude(vector) {
  let sum = 0;
  for (let i = 0; i < vector.length; i += 1) {
    sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
}

/**
 * Initializes and caches vector index in memory once.
 * Precomputes magnitudes and pre-groups chunks by schemeId for O(1) lookups.
 */
async function loadIndex() {
  if (cachedIndex) {
    return cachedIndex;
  }

  const rawData = await fs.readFile(indexPath, 'utf8');
  const items = JSON.parse(rawData);

  schemeChunksMap = new Map();
  schemeIdsSet = new Set();

  cachedIndex = items.map((item) => {
    const magnitude = computeMagnitude(item.embedding);
    const enriched = {
      ...item,
      magnitude,
    };

    const sId = item.metadata?.schemeId;
    if (sId) {
      schemeIdsSet.add(sId);
      if (!schemeChunksMap.has(sId)) {
        schemeChunksMap.set(sId, []);
      }
      schemeChunksMap.get(sId).push(enriched);
    }

    return enriched;
  });

  return cachedIndex;
}

/**
 * Fast cosine similarity utilizing precomputed chunk magnitude
 */
function fastCosineSimilarity(queryEmbedding, queryMagnitude, chunk) {
  let dot = 0;
  const chunkEmbedding = chunk.embedding;
  const len = queryEmbedding.length;

  for (let i = 0; i < len; i += 1) {
    dot += queryEmbedding[i] * chunkEmbedding[i];
  }

  const denominator = queryMagnitude * chunk.magnitude;
  return denominator === 0 ? 0 : dot / denominator;
}

/**
 * Searches the in-memory vector store for top matching scheme chunks
 */
async function search(queryEmbedding, { schemeId, limit = 2 } = {}) {
  await loadIndex();

  const resolvedId = schemeId ? resolveCanonicalSchemeId(schemeId) : null;

  // Fast O(1) candidate lookup if schemeId is specified
  const candidates = (resolvedId && schemeChunksMap.has(resolvedId))
    ? schemeChunksMap.get(resolvedId)
    : (schemeId && schemeChunksMap.has(schemeId)
        ? schemeChunksMap.get(schemeId)
        : cachedIndex);

  const queryMag = computeMagnitude(queryEmbedding);

  return candidates
    .map((item) => ({
      ...item,
      score: fastCosineSimilarity(queryEmbedding, queryMag, item),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function hasScheme(schemeId) {
  if (!schemeId) return false;
  await loadIndex();
  const resolvedId = resolveCanonicalSchemeId(schemeId);
  return schemeIdsSet.has(resolvedId) || schemeIdsSet.has(schemeId);
}

/**
 * Returns diagnostic statistics about the in-memory vector index.
 */
function getIndexStats() {
  return {
    isLoaded: Boolean(cachedIndex && cachedIndex.length > 0),
    totalChunks: cachedIndex ? cachedIndex.length : 0,
    totalSchemes: schemeIdsSet ? schemeIdsSet.size : 0,
  };
}

module.exports = {
  search,
  hasScheme,
  loadIndex,
  getIndexStats,
};
