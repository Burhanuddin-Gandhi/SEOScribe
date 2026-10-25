const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pdfRoutes = require('./routes/pdfRoutes');
const urlRoutes = require('./routes/urlRoutes');
const crawlRoutes = require('./routes/crawlRoutes');

const { helmetConfig, generalApiLimiter } = require('./middleware/security');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxies (Cloudflare, Render, Railway, Vercel) for accurate client IP in rate limiting
app.set('trust proxy', 1);

// Security Headers
app.use(helmetConfig);

// CORS configuration (supports local development and deployed frontend)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests, allowed origins, Cloudflare Pages (*.pages.dev), or Vercel (*.vercel.app)
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.pages.dev') ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-seoscribe-client-token', 'x-admin-bypass-key'],
  maxAge: 86400, // Cache preflight response for 24 hours
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Payload size limit to prevent memory exhaustion DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global general rate limit
app.use('/api/', generalApiLimiter);

// Routes
app.use('/api/seo', pdfRoutes);
app.use('/api/seo', urlRoutes);
app.use('/api/crawl', crawlRoutes);

// Health check
app.get('/api/seo/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large. Maximum size is 25MB.',
      code: 'FILE_TOO_LARGE',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field. Use "pdf" as the field name.',
      code: 'INVALID_FIELD',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 SEOScribe server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/seo/health`);
  console.log(`📄 PDF upload:   POST http://localhost:${PORT}/api/seo/upload-pdf`);
  console.log(`🌐 URL scraper:  POST http://localhost:${PORT}/api/seo/analyze-url\n`);
});