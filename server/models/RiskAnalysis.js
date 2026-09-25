const mongoose = require('mongoose');
const { wrapModel } = require('../config/db');

const riskAnalysisSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    unique: true
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  overallRisk: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  riskDistribution: {
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 }
  },
  categoryDistribution: {
    type: Map,
    of: Number,
    default: {}
  },
  complianceMatrix: {
    gdpr_status: { type: String, default: "REVIEW_NEEDED" },
    gdpr_score: { type: Number, default: 75.0 },
    ccpa_status: { type: String, default: "REVIEW_NEEDED" },
    ccpa_score: { type: Number, default: 75.0 },
    eu_ai_act_status: { type: String, default: "COMPLIANT" },
    soc2_status: { type: String, default: "REVIEW_NEEDED" },
    flagged_clauses_count: { type: Number, default: 0 }
  },
  milestones: [{
    id: String,
    title: String,
    dateString: String,
    category: String,
    daysFromNow: { type: Number, default: 0 },
    urgency: { type: String, default: 'INFO' },
    description: String,
    actionRequired: String
  }],
  renewalInfo: {
    isAutoRenew: { type: Boolean, default: false },
    noticePeriodDays: { type: Number, default: 0 },
    termDuration: { type: String, default: '12 Months' },
    paymentTerms: { type: String, default: 'Standard' },
    effectiveDate: String,
    renewalCutoffDate: String,
    expirationDate: String
  },
  executiveVoiceScript: {
    type: String,
    default: ''
  },
  estimatedAudioDuration: {
    type: Number,
    default: 55
  },
  summary: {
    type: String,
    required: true
  },
  keyFindings: [{
    type: String
  }],
  actionChecklist: [{
    type: String
  }]
}, {
  timestamps: true
});

const MongooseRiskAnalysis = mongoose.model('RiskAnalysis', riskAnalysisSchema);
module.exports = wrapModel('RiskAnalysis', MongooseRiskAnalysis);
