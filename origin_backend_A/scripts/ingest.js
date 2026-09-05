require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const { chunkScheme } = require('../services/ai/chunker');
const { embedMany } = require('../services/ai/gemini');

async function main() {
  const schemesPath = path.resolve(__dirname, '../data/schemes');
  const outputPath = path.resolve(__dirname, '../data/index/schemes.index.json');
  const filenames = (await fs.readdir(schemesPath)).filter((name) => name.endsWith('.json'));
  const schemes = await Promise.all(
    filenames.map(async (name) => JSON.parse(await fs.readFile(path.join(schemesPath, name), 'utf8')))
  );
  const chunks = schemes.flatMap(chunkScheme);
  const indexedChunks = [];
  const batchSize = 20;

  for (let start = 0; start < chunks.length; start += batchSize) {
    const batch = chunks.slice(start, start + batchSize);
    console.log(`Embedding chunks ${start + 1}-${start + batch.length} of ${chunks.length}`);
    const embeddings = await embedMany(batch.map((chunk) => chunk.text));
    indexedChunks.push(...batch.map((chunk, index) => ({ ...chunk, embedding: embeddings[index] })));
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(indexedChunks, null, 2));
  console.log(`Indexed ${indexedChunks.length} chunks from ${schemes.length} scheme(s).`);
}

main().catch((error) => {
  console.error('Ingestion failed:', error.message);
  process.exitCode = 1;
});

