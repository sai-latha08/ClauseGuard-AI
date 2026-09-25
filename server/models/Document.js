const mongoose = require('mongoose');
const { wrapModel } = require('../config/db');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  storedFilename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'],
    default: 'application/pdf'
  },
  fileSize: {
    type: Number,
    required: true
  },
  pageCount: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['UPLOADING', 'PROCESSING', 'ANALYZING', 'COMPLETED', 'FAILED'],
    default: 'UPLOADING'
  },
  errorMessage: {
    type: String,
    default: null
  },
  overallRisk: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'PENDING'],
    default: 'PENDING'
  },
  overallScore: {
    type: Number,
    default: 0
  },
  totalClauses: {
    type: Number,
    default: 0
  },
  isEphemeral: {
    type: Boolean,
    default: false
  },
  fileHash: {
    type: String,
    index: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const MongooseDocument = mongoose.model('Document', documentSchema);
module.exports = wrapModel('Document', MongooseDocument);
