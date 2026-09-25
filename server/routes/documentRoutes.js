const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  uploadDocument,
  pasteDocument,
  loadDemoDocument,
  getUserDocuments,
  getDocumentById,
  getDocumentFile,
  deleteDocument
} = require('../controllers/documentController');

router.use(protect);

router.post('/upload', upload.single('file'), uploadDocument);
router.post('/paste', pasteDocument);
router.post('/demo', loadDemoDocument);
router.get('/', getUserDocuments);
router.get('/:id', getDocumentById);
router.get('/:id/file', getDocumentFile);
router.delete('/:id', deleteDocument);

module.exports = router;
