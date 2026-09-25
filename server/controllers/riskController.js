const Document = require('../models/Document');
const Clause = require('../models/Clause');
const RiskAnalysis = require('../models/RiskAnalysis');
const { processDocumentPipeline } = require('./documentController');

// @desc    Get risk analysis for document
// @route   GET /api/risk/:documentId
// @access  Private
const getRiskAnalysis = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const analysis = await RiskAnalysis.findOne({ documentId: doc._id });
    if (!analysis && doc.status !== 'COMPLETED') {
      return res.json({
        success: true,
        status: doc.status,
        message: 'Analysis is still in progress'
      });
    }

    res.json({
      success: true,
      data: analysis,
      document: {
        _id: doc._id,
        originalName: doc.originalName,
        pageCount: doc.pageCount,
        status: doc.status,
        overallRisk: doc.overallRisk,
        overallScore: doc.overallScore,
        totalClauses: doc.totalClauses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all clauses for a document with optional category/risk filter
// @route   GET /api/clauses/:documentId
// @access  Private
const getClauses = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const filter = { documentId: doc._id };
    if (req.query.riskLevel) {
      filter.riskLevel = req.query.riskLevel.toUpperCase();
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const clauses = await Clause.find(filter).sort({ pageNumber: 1, _id: 1 });

    res.json({
      success: true,
      count: clauses.length,
      data: clauses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single clause detail
// @route   GET /api/clauses/:documentId/:clauseId
// @access  Private
const getClauseById = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const clause = await Clause.findOne({ documentId: doc._id, clauseId: req.params.clauseId });
    if (!clause) {
      return res.status(404).json({ success: false, message: 'Clause not found' });
    }

    res.json({
      success: true,
      data: clause
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually trigger or re-run risk analysis
// @route   POST /api/risk/analyze/:documentId
// @access  Private
const reAnalyzeDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    processDocumentPipeline(doc._id, doc.filePath, doc.originalName).catch(console.error);

    res.json({
      success: true,
      message: 'Re-analysis pipeline initiated'
    });
  } catch (error) {
    next(error);
  }
};

const AIGateway = require('../services/aiGateway');

// @desc    Generate AI redline / fair alternative counter-proposal for a clause
// @route   POST /api/clauses/:documentId/:clauseId/redraft
// @access  Private
const redraftClause = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const clause = await Clause.findOne({ documentId: doc._id, clauseId: req.params.clauseId });
    if (!clause) {
      return res.status(404).json({ success: false, message: 'Clause not found' });
    }

    const redraftResult = await AIGateway.redraftClause(
      clause.heading,
      clause.text,
      clause.category,
      clause.riskLevel,
      clause.riskFactors
    );

    res.json({
      success: true,
      data: {
        clauseId: clause.clauseId,
        heading: clause.heading,
        originalText: clause.text,
        category: clause.category,
        riskLevel: clause.riskLevel,
        proposedText: redraftResult.proposed_text,
        rationale: redraftResult.rationale,
        keyChanges: redraftResult.key_changes,
        negotiationTip: redraftResult.negotiation_tip,
        complianceTags: redraftResult.compliance_tags
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRiskAnalysis,
  getClauses,
  getClauseById,
  reAnalyzeDocument,
  redraftClause
};
