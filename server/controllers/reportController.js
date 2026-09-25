const Document = require('../models/Document');
const Clause = require('../models/Clause');
const RiskAnalysis = require('../models/RiskAnalysis');
const Report = require('../models/Report');

// @desc    Get comprehensive audit report
// @route   GET /api/reports/:documentId
// @access  Private
const getReport = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const report = await Report.findOne({ documentId: doc._id });
    const analysis = await RiskAnalysis.findOne({ documentId: doc._id });
    const clauses = await Clause.find({ documentId: doc._id }).sort({ riskScore: -1 });

    const criticalClauses = clauses.filter(c => c.riskLevel === 'CRITICAL');
    const highClauses = clauses.filter(c => c.riskLevel === 'HIGH');
    const mediumClauses = clauses.filter(c => c.riskLevel === 'MEDIUM');
    const lowClauses = clauses.filter(c => c.riskLevel === 'LOW');

    res.json({
      success: true,
      data: {
        document: {
          id: doc._id,
          originalName: doc.originalName,
          pageCount: doc.pageCount,
          totalClauses: doc.totalClauses,
          overallRisk: doc.overallRisk,
          overallScore: doc.overallScore,
          uploadedAt: doc.uploadedAt,
          processedAt: doc.processedAt
        },
        report: report || {
          executiveSummary: analysis?.summary || "Analysis is generating...",
          keyFindings: analysis?.keyFindings || [],
          actionChecklist: analysis?.actionChecklist || [],
          disclaimer: "ClauseGuard AI provides automated informational analysis and is not a substitute for professional legal advice."
        },
        milestones: analysis?.milestones || [],
        renewalInfo: analysis?.renewalInfo || {
          isAutoRenew: false,
          noticePeriodDays: 0,
          termDuration: '12 Months',
          paymentTerms: 'Standard'
        },
        executiveVoiceScript: analysis?.executiveVoiceScript || '',
        estimatedAudioDuration: analysis?.estimatedAudioDuration || 58,
        riskMetrics: {
          overallScore: doc.overallScore,
          overallRisk: doc.overallRisk,
          criticalCount: criticalClauses.length,
          highCount: highClauses.length,
          mediumCount: mediumClauses.length,
          lowCount: lowClauses.length,
          categoryDistribution: analysis?.categoryDistribution || {}
        },
        groupedClauses: {
          critical: criticalClauses,
          high: highClauses,
          medium: mediumClauses,
          low: lowClauses
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReport
};
