const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { parseAndRoutePDF } = require('../modules/documents/pdfParserRouter');
const { analyzeSEOContent } = require('../modules/seo/seoAnalyzer');
const { logExtraction, hashContent } = require('../modules/seo/auditLog');
const { checkAndRecordConsistency } = require('../modules/seo/analysisHistory');
const { orchestratePdfCreation } = require('../modules/agents/agentOrchestrator');
const { heavySeoLimiter, verifyClientHeader, validatePdfMagicBytes } = require('../middleware/security');

router.post('/upload-pdf', heavySeoLimiter, verifyClientHeader, (req, res, next) => {
  // Handle multer upload with custom error handling
  upload.single('pdf')(req, res, async (err) => {
    if (err) {
      // Multer or file filter error
      return res.status(err.status || 400).json({
        success: false,
        error: err.message,
        code: err.code || 'UPLOAD_ERROR',
      });
    }

    // Check if file was provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded. Please select a PDF file.',
        code: 'NO_FILE',
      });
    }

    try {
      const { originalname, buffer, size } = req.file;

      // Validate PDF magic bytes header to prevent malicious files
      if (!validatePdfMagicBytes(buffer)) {
        return res.status(400).json({
          success: false,
          error: 'The uploaded file is not a valid PDF document (missing %PDF- header).',
          code: 'INVALID_PDF_HEADER',
        });
      }

      console.log(
        `[Upload] Received "${originalname}" ` +
        `(${(size / 1024 / 1024).toFixed(2)} MB)`
      );

      // Route and parse the PDF via local classification heuristic (LlamaParse vs Gemini)
      const result = await parseAndRoutePDF(buffer, originalname);

      const contentToHash = result.bufferHash || hashContent(result.rawStructuredContent || result.plainTextSummary || '');
      const contentHash = contentToHash;

      // 1. Audit Logging
      logExtraction({
        sourceType: 'pdf',
        target: originalname,
        engine: result.extractionMethod,
        confidence: result.confidence,
        confidenceReasons: result.confidenceReasons,
        pages: result.pageCount,
        documentType: result.classification?.documentType,
        visualRatio: result.classification?.visualRatio,
        headingsCount: result.metrics?.totalHeadings || 0,
        tablesCount: result.tables?.length || 0,
        visualElementsCount: result.visualElements?.length || 0,
        contentHash,
      });

      // Handle unreadable/empty extractions
      if (result.confidence === 'low' && (!result.plainTextSummary || result.plainTextSummary.length < 20)) {
        return res.status(422).json({
          success: false,
          error:
            "We couldn't reliably parse this PDF — the document appears to be corrupted or completely empty. Try re-exporting the PDF or uploading a different file.",
          code: 'UNRELIABLE_PDF_EXTRACTION',
        });
      }

      const signals = {
        title: result.title || result.info?.title || undefined,
        wordCount: result.wordCount,
      };

      // Analyze content for SEO insights (uses structured content or text summary)
      const analysisText = result.rawStructuredContent || result.plainTextSummary;
      const analysis = analyzeSEOContent(analysisText, originalname, signals);

      // --- Multi-Agent Full 0-to-1 SEO Creation Suite ---
      const agentCreation = await orchestratePdfCreation({
        targetName: result.title || originalname,
        content: analysisText,
        metadata: result.info || {},
        competitors: analysis.competitors || [],
        keywords: analysis.keywords || [],
        pageCount: result.pageCount,
        wordCount: result.wordCount,
      });

      analysis.agentCreation = agentCreation;
      analysis.isDocumentCreation = true;

      // 2. Consistency check across repeated analyses of the same file
      const consistencyCheck = checkAndRecordConsistency(originalname, {
        engine: result.extractionMethod,
        score: analysis.score,
        wordCount: result.wordCount,
        headingsCount: result.metrics?.totalHeadings || 0,
        tablesCount: result.tables?.length || 0,
        contentHash,
        confidence: result.confidence,
      });

      // Evidence & verifiable facts behind extraction
      const evidence = {
        engine: result.extractionMethod,
        classification: result.classification?.documentType || 'STANDARD',
        visualPages: result.classification?.visualPages || 0,
        visualRatio: result.classification?.visualRatio || 0,
        title: result.title || result.info?.title || null,
        author: result.info?.author || null,
        creator: result.info?.creator || null,
        pages: result.pageCount,
        characterCount: result.characterCount,
        wordCount: result.wordCount,
        headings: result.metrics?.headings || null,
        tables: result.tables?.length || 0,
        visualElements: result.visualElements?.length || 0,
        latencyMs: result.latencyMs,
        contentHash,
        bufferHash: result.bufferHash,
      };

      // Return full structured output, preserving rich formatting
      res.json({
        success: true,
        filename: originalname,
        bufferHash: result.bufferHash,
        fileSize: `${(size / 1024 / 1024).toFixed(2)} MB`,
        // Structured output fields (do NOT flatten)
        rawStructuredContent: result.rawStructuredContent,
        tables: result.tables,
        visualElements: result.visualElements,
        plainTextSummary: result.plainTextSummary,
        extractionMethod: result.extractionMethod,
        confidence: result.confidence,
        confidenceReasons: result.confidenceReasons,
        pageCount: result.pageCount,
        title: result.title,
        metrics: result.metrics,
        classification: result.classification,
        // SEO Analysis & Verifiable Evidence
        analysis,
        agentCreation,
        evidence,
        consistencyCheck,
        // Compatibility fields
        engine: result.extractionMethod,
        pages: result.pageCount,
        characterCount: result.characterCount,
        extractedText: result.plainTextSummary,
        info: result.info,
        extractionMeta: {
          engine: result.extractionMethod,
          confidence: result.confidence,
          headingsDetected: result.metrics?.totalHeadings || 0,
          tablesDetected: result.tables?.length || 0,
          visualElementsDetected: result.visualElements?.length || 0,
        },
      });

    } catch (error) {
      console.error(`[Upload] Error processing PDF:`, error.message);

      res.status(error.status || 500).json({
        success: false,
        error: error.message,
        code: error.code || 'PROCESSING_ERROR',
      });
    }
  });
});

module.exports = router;