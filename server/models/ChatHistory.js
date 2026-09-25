const mongoose = require('mongoose');
const { wrapModel } = require('../config/db');

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    default: 1.0
  },
  sources: [{
    clauseId: String,
    clauseNumber: String,
    heading: String,
    pageNumber: Number,
    textSnippet: String,
    category: String,
    riskLevel: String,
    similarityScore: Number
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  messages: [chatMessageSchema]
}, {
  timestamps: true
});

chatHistorySchema.index({ userId: 1, documentId: 1 }, { unique: true });

const MongooseChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
module.exports = wrapModel('ChatHistory', MongooseChatHistory);
