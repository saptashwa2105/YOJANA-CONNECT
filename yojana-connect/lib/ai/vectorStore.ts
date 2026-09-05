import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { resolveCanonicalSchemeId } from "./schemeIdHelper";

export interface VectorChunk {
  id: string;
  text: string;
  embedding: number[];
  magnitude: number;
  metadata: {
    schemeId: string;
    schemeName: string;
    category: string;
    section: string;
    officialUrl?: string;
  };
}

export interface SearchResult extends VectorChunk {
  score: number;
}

// In-memory cache structures
let cachedIndex: VectorChunk[] | null = null;
let schemeChunksMap: Map<string, VectorChunk[]> | null = null;
let schemeIdsSet: Set<string> | null = null;

function computeMagnitude(vector: number[]): number {
  let sum = 0;
  for (let i = 0; i < vector.length; i += 1) {
    sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
}

function resolveIndexPath(): string {
  const candidatePaths = [
    path.join(process.cwd(), "data/index/schemes.index.json"),
    path.join(process.cwd(), "yojana-connect/data/index/schemes.index.json"),
    path.resolve(__dirname, "../../data/index/schemes.index.json"),
  ];

  for (const p of candidatePaths) {
    try {
      if (existsSync(p)) {
        return p;
      }
    } catch {
      // continue
    }
  }

  return path.join(process.cwd(), "data/index/schemes.index.json");
}

export async function loadIndex(): Promise<VectorChunk[]> {
  if (cachedIndex) {
    return cachedIndex;
  }

  const indexPath = resolveIndexPath();
  const rawData = await fs.readFile(indexPath, "utf8");
  const items: Array<{
    id: string;
    text: string;
    embedding: number[];
    metadata: VectorChunk["metadata"];
  }> = JSON.parse(rawData);

  schemeChunksMap = new Map();
  schemeIdsSet = new Set();

  cachedIndex = items.map((item) => {
    const magnitude = computeMagnitude(item.embedding);
    const enriched: VectorChunk = {
      ...item,
      magnitude,
    };

    const sId = item.metadata?.schemeId;
    if (sId) {
      schemeIdsSet!.add(sId);
      if (!schemeChunksMap!.has(sId)) {
        schemeChunksMap!.set(sId, []);
      }
      schemeChunksMap!.get(sId)!.push(enriched);
    }

    return enriched;
  });

  return cachedIndex;
}

function fastCosineSimilarity(
  queryEmbedding: number[],
  queryMagnitude: number,
  chunk: VectorChunk
): number {
  let dot = 0;
  const chunkEmbedding = chunk.embedding;
  const len = queryEmbedding.length;

  for (let i = 0; i < len; i += 1) {
    dot += queryEmbedding[i] * chunkEmbedding[i];
  }

  const denominator = queryMagnitude * chunk.magnitude;
  return denominator === 0 ? 0 : dot / denominator;
}

export async function search(
  queryEmbedding: number[],
  options: { schemeId?: string | null; limit?: number } = {}
): Promise<SearchResult[]> {
  const { schemeId = null, limit = 2 } = options;
  const allChunks = await loadIndex();

  const resolvedId = schemeId ? resolveCanonicalSchemeId(schemeId) : null;

  let candidates: VectorChunk[] = allChunks;
  if (resolvedId && schemeChunksMap?.has(resolvedId)) {
    candidates = schemeChunksMap.get(resolvedId)!;
  } else if (schemeId && schemeChunksMap?.has(schemeId)) {
    candidates = schemeChunksMap.get(schemeId)!;
  }

  const queryMag = computeMagnitude(queryEmbedding);

  return candidates
    .map((item) => ({
      ...item,
      score: fastCosineSimilarity(queryEmbedding, queryMag, item),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function hasScheme(schemeId?: string | null): Promise<boolean> {
  if (!schemeId) return false;
  await loadIndex();
  const resolvedId = resolveCanonicalSchemeId(schemeId);
  return (schemeIdsSet?.has(resolvedId) || schemeIdsSet?.has(schemeId)) ?? false;
}

export function getIndexStats(): { isLoaded: boolean; totalChunks: number; totalSchemes: number } {
  return {
    isLoaded: Boolean(cachedIndex && cachedIndex.length > 0),
    totalChunks: cachedIndex ? cachedIndex.length : 0,
    totalSchemes: schemeIdsSet ? schemeIdsSet.size : 0,
  };
}
