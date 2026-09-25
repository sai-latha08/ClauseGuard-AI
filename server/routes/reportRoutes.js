const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getReport } = require('../controllers/reportController');

router.use(protect);

router.get('/:documentId', getReport);

module.exports = router;
