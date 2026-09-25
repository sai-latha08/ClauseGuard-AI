const Document = require('../models/Document');
const ChatHistory = require('../models/ChatHistory');
const AIGateway = require('../services/aiGateway');

// @desc    Ask a question about a document (RAG Q&A)
// @route   POST /api/qa/:documentId
// @access  Private
const askQuestion = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid question' });
    }

    const doc = await Document.findOne({ _id: req.params.documentId, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Call Python FastAPI RAG engine
    const qaResult = await AIGateway.queryDocument(doc._id, question);

    // Persist to user's chat history for this document
    let chatRecord = await ChatHistory.findOne({ userId: req.user.id, documentId: doc._id });
    if (!chatRecord) {
      chatRecord = new ChatHistory({
        userId: req.user.id,
        documentId: doc._id,
        messages: []
      });
    }

    // Add user message
    chatRecord.messages.push({
      role: 'user',
      content: question,
      timestamp: new Date()
    });

    // Add assistant response
    chatRecord.messages.push({
      role: 'assistant',
      content: qaResult.answer,
      confidence: qaResult.confidence,
      sources: qaResult.sources.map(s => ({
        clauseId: s.clause_id,
        clauseNumber: s.clause_number,
        heading: s.heading,
        pageNumber: s.page_number,
        textSnippet: s.text_snippet,
        category: s.category,
        riskLevel: s.risk_level,
        similarityScore: s.similarity_score
      })),
      timestamp: new Date()
    });

    await chatRecord.save();

    res.json({
      success: true,
      data: {
        question: question,
        answer: qaResult.answer,
        confidence: qaResult.confidence,
        sources: qaResult.sources
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get chat history for a document
// @route   GET /api/qa/:documentId/history
// @access  Private
const getChatHistory = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const chatRecord = await ChatHistory.findOne({ userId: req.user.id, documentId: doc._id });

    res.json({
      success: true,
      data: chatRecord ? chatRecord.messages : []
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  askQuestion,
  getChatHistory
};
