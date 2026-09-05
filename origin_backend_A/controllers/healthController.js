const { sequelize } = require('../models');
const { loadIndex, getIndexStats } = require('../services/ai/vectorStore');

/**
 * Diagnostic Health Check Controller
 * Verifies:
 * 1. SQLite database connectivity (via sequelize.authenticate())
 * 2. AI / RAG service readiness (in-memory vector store cached & Gemini API key configured)
 */
const getHealthStatus = async (req, res) => {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  // 1. Database Connectivity Check
  let dbCheck = {
    status: 'unknown',
    dialect: 'sqlite',
    latency: null,
  };

  const dbStart = Date.now();
  try {
    await sequelize.authenticate();
    dbCheck = {
      status: 'connected',
      dialect: sequelize.getDialect() || 'sqlite',
      storage: process.env.DB_STORAGE || './database.sqlite',
      latency: `${Date.now() - dbStart}ms`,
    };
  } catch (dbError) {
    dbCheck = {
      status: 'disconnected',
      error: dbError.message,
      latency: `${Date.now() - dbStart}ms`,
    };
  }

  // 2. AI / RAG Service Readiness Check
  let aiCheck = {
    status: 'unknown',
    geminiConfigured: false,
    vectorIndex: {
      loaded: false,
      totalChunks: 0,
      totalSchemes: 0,
    },
  };

  try {
    // Ensure index is loaded into memory
    await loadIndex();
    const stats = getIndexStats();
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const geminiConfigured = Boolean(apiKey && apiKey !== 'PASTE_YOUR_KEY_HERE');

    const isAiReady = stats.isLoaded && geminiConfigured;

    aiCheck = {
      status: isAiReady ? 'ready' : 'degraded',
      geminiConfigured,
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      embeddingModel: process.env.EMBEDDING_MODEL || 'gemini-embedding-001',
      vectorIndex: {
        loaded: stats.isLoaded,
        totalChunks: stats.totalChunks,
        totalSchemes: stats.totalSchemes,
      },
    };
  } catch (aiError) {
    aiCheck = {
      status: 'error',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      error: aiError.message,
      vectorIndex: {
        loaded: false,
        totalChunks: 0,
        totalSchemes: 0,
      },
    };
  }

  // 3. Overall Diagnostic Aggregation
  const isHealthy = dbCheck.status === 'connected' && aiCheck.status === 'ready';
  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    timestamp,
    uptime: `${Math.floor(process.uptime())}s`,
    service: 'Yojana Connect Backend',
    environment: process.env.NODE_ENV || 'development',
    responseTime: `${Date.now() - startTime}ms`,
    checks: {
      database: dbCheck,
      aiService: aiCheck,
    },
  });
};

module.exports = {
  getHealthStatus,
};

