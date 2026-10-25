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

// Universal CORS middleware ensuring every response (including preflights and errors) has CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-seoscribe-client-token, x-admin-bypass-key');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Security Headers
app.use(helmetConfig);

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