const mongoose = require('mongoose');
const { wrapModel } = require('../config/db');

const clauseSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  clauseId: {
    type: String,
    required: true
  },
  clauseNumber: {
    type: String,
    default: ''
  },
  heading: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  pageNumber: {
    type: Number,
    required: true
  },
  charStart: {
    type: Number,
    default: 0
  },
  charEnd: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  confidence: {
    type: Number,
    default: 0.8
  },
  riskFactors: [{
    type: String
  }],
  detectedSnippet: {
    type: String
  },
  whyItMatters: {
    type: String
  },
  recommendation: {
    type: String
  },
  complianceTags: [{
    type: String
  }]
}, {
  timestamps: true
});

const MongooseClause = mongoose.model('Clause', clauseSchema);
module.exports = wrapModel('Clause', MongooseClause);
