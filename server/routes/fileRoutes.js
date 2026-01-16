const express = require('express');
const router = express.Router();
const {
  initUploadSession,
  uploadChunk,
  completeUpload,
  deleteFile,
  downloadFile
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

router.post('/upload-session', protect, initUploadSession);
router.post('/upload-chunk', protect, uploadChunk);
router.post('/complete-upload', protect, completeUpload);
router.get('/:id/download', protect, downloadFile);
router.delete('/:id', protect, deleteFile);

module.exports = router;
