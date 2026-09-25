const mongoose = require('mongoose');
const { wrapModel } = require('../config/db');

const reportSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  executiveSummary: {
    type: String,
    required: true
  },
  keyFindings: [{
    type: String
  }],
  actionChecklist: [{
    type: String
  }],
  disclaimer: {
    type: String,
    default: "ClauseGuard AI provides automated informational analysis and is not a substitute for professional legal advice."
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const MongooseReport = mongoose.model('Report', reportSchema);
module.exports = wrapModel('Report', MongooseReport);
