require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const apiRoutes = require('./routes');
const chatRoutes = require('./routes/chatRoutes');
const { loadIndex } = require('./services/ai/vectorStore');

const { getHealthStatus } = require('./controllers/healthController');

const app = express();
const PORT = process.env.PORT || 5001;

// Dynamic CORS Configuration
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const getAllowedOrigins = () => {
  const envOrigins = process.env.CORS_ORIGIN;
  if (!envOrigins) {
    return defaultAllowedOrigins;
  }
  const parsed = envOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // In development, ensure local frontend dev servers (5173, 5174, 3000) are always supported
  if (process.env.NODE_ENV !== 'production') {
    ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:3000'].forEach((origin) => {
      if (!parsed.includes(origin)) {
        parsed.push(origin);
      }
    });
  }
  return parsed;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server) without Origin header
    if (!origin) return callback(null, true);

    const allowed = getAllowedOrigins();
    const isLocalhost =
      process.env.NODE_ENV !== 'production' &&
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (allowed.includes(origin) || isLocalhost || (allowed.includes('*') && process.env.NODE_ENV !== 'production')) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Diagnostic Health Check Endpoint (verifies SQLite DB and AI/RAG readiness)
app.get('/api/health', getHealthStatus);

// AI Chat Route
app.use('/api/chat', chatRoutes);

// API Routes
app.use('/api', apiRoutes);

// Fallback 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Ensure SQLite users table contains supabaseId, email, and annualIncome columns
const ensureUserSchemaUpdated = async () => {
  try {
    const [columns] = await sequelize.query('PRAGMA table_info(users);');
    const columnNames = columns.map((col) => col.name);

    if (!columnNames.includes('supabaseId')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN supabaseId TEXT;');
      console.log('✓ Added supabaseId column to users table.');
    }
    if (!columnNames.includes('email')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN email TEXT;');
      console.log('✓ Added email column to users table.');
    }
    if (!columnNames.includes('annualIncome')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN annualIncome REAL;');
      console.log('✓ Added annualIncome column to users table.');
    }
  } catch (err) {
    console.warn('Note on schema check:', err.message);
  }
};

// Start Server & Sync Database
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ SQLite database connected successfully.');

    await sequelize.sync();
    await ensureUserSchemaUpdated();
    console.log('✓ Sequelize models synchronized with database.');

    // Pre-load and cache vector index in memory on startup
    await loadIndex();
    console.log('✓ Scheme vector index pre-loaded and cached in memory.');

    const server = app.listen(PORT, () => {
      console.log(`✓ Yojana Connect server running on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`✗ Port ${PORT} is already in use.`);
      } else {
        console.error('✗ Server error:', err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('✗ Unable to start server or connect to database:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
