const multer = require('multer');

const CONSTRAINTS = {
  PDF_MAX_SIZE_MB: 25,
  ALLOWED_MIMETYPES: ['application/pdf'],
};

// Use memory storage — no disk writes, buffer stays in memory
const storage = multer.memoryStorage();

// File filter — only allow PDFs
const fileFilter = (req, file, cb) => {
  if (!CONSTRAINTS.ALLOWED_MIMETYPES.includes(file.mimetype)) {
    const error = new Error('Only PDF files are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    error.status = 400;
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: CONSTRAINTS.PDF_MAX_SIZE_MB * 1024 * 1024, // 25MB in bytes
    files: 1, // Only allow 1 file per request
  },
});

module.exports = upload;
module.exports.CONSTRAINTS = CONSTRAINTS;
