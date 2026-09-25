const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getRiskAnalysis,
  getClauses,
  getClauseById,
  reAnalyzeDocument,
  redraftClause
} = require('../controllers/riskController');

router.use(protect);

router.get('/risk/:documentId', getRiskAnalysis);
router.post('/risk/analyze/:documentId', reAnalyzeDocument);
router.get('/clauses/:documentId', getClauses);
router.get('/clauses/:documentId/:clauseId', getClauseById);
router.post('/clauses/:documentId/:clauseId/redraft', redraftClause);

module.exports = router;
