const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pdfRoutes = require('./routes/pdfRoutes');
const urlRoutes = require('./routes/urlRoutes');
const crawlRoutes = require('./routes/crawlRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

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