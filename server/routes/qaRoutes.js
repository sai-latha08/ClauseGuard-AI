const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { askQuestion, getChatHistory } = require('../controllers/qaController');

router.use(protect);

router.post('/:documentId', askQuestion);
router.get('/:documentId/history', getChatHistory);

module.exports = router;
