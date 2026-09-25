const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const Clause = require('../models/Clause');
const RiskAnalysis = require('../models/RiskAnalysis');
const Report = require('../models/Report');
const ChatHistory = require('../models/ChatHistory');
const AIGateway = require('../services/aiGateway');

const crypto = require('crypto');

// @desc    Upload a new document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid document file' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const isEphemeral = req.body.isEphemeral === 'true' || req.body.isEphemeral === true;

    // Check for exact duplicate document previously analyzed by this user
    const existingDoc = await Document.findOne({
      userId: req.user.id,
      fileHash: fileHash,
      status: 'COMPLETED'
    });

    if (existingDoc && !isEphemeral) {
      // Remove temporary duplicate file from disk
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(200).json({
        success: true,
        data: existingDoc,
        message: 'Identical document recognized via SHA-256 hash. Instant analysis loaded.'
      });
    }

    const newDoc = await Document.create({
      userId: req.user.id,
      originalName: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: req.file.path,
      fileType: req.file.mimetype || 'application/pdf',
      fileSize: req.file.size,
      fileHash: fileHash,
      isEphemeral: isEphemeral,
      status: 'PROCESSING'
    });

    res.status(201).json({
      success: true,
      data: newDoc,
      message: isEphemeral
        ? 'Confidential Ephemeral Mode active. Document uploaded and processing pipeline initiated.'
        : 'Document uploaded successfully. Processing pipeline initiated.'
    });

    // Asynchronously trigger AI processing in background
    processDocumentPipeline(newDoc._id, req.file.path, req.file.originalname, isEphemeral).catch(err => {
      console.error(`Background processing error for ${newDoc._id}:`, err);
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Background pipeline runner
 */
async function processDocumentPipeline(documentId, filePath, originalName, isEphemeral = false) {
  try {
    await Document.findByIdAndUpdate(documentId, { status: 'ANALYZING' });

    // Call Python FastAPI microservice
    const aiResult = await AIGateway.processDocument(documentId, filePath, originalName);

    // Save clauses to MongoDB
    await Clause.deleteMany({ documentId });
    const clausesToInsert = aiResult.clauses.map(c => ({
      documentId: documentId,
      clauseId: c.clause_id,
      clauseNumber: c.clause_number,
      heading: c.heading,
      text: c.text,
      pageNumber: c.page_number,
      charStart: c.char_start,
      charEnd: c.char_end,
      category: c.category,
      riskLevel: c.risk_level,
      riskScore: c.risk_score,
      confidence: c.confidence,
      riskFactors: c.risk_factors,
      detectedSnippet: c.detected_snippet,
      whyItMatters: c.why_it_matters,
      recommendation: c.recommendation,
      complianceTags: c.compliance_tags || []
    }));

    if (clausesToInsert.length > 0) {
      await Clause.insertMany(clausesToInsert);
    }

    // Save or update RiskAnalysis
    await RiskAnalysis.findOneAndUpdate(
      { documentId },
      {
        documentId,
        overallScore: aiResult.overall_score,
        overallRisk: aiResult.overall_risk,
        riskDistribution: aiResult.risk_distribution,
        categoryDistribution: aiResult.category_distribution,
        complianceMatrix: aiResult.compliance_matrix || {},
        milestones: aiResult.milestones || [],
        renewalInfo: aiResult.renewal_info || {},
        executiveVoiceScript: aiResult.executive_voice_script || '',
        estimatedAudioDuration: aiResult.estimated_audio_duration_seconds || 58,
        summary: aiResult.summary,
        keyFindings: aiResult.key_findings,
        actionChecklist: aiResult.action_checklist
      },
      { upsert: true, new: true }
    );

    // Save or update Report
    await Report.findOneAndUpdate(
      { documentId },
      {
        documentId,
        title: `ClauseGuard Risk Audit: ${originalName}`,
        executiveSummary: aiResult.summary,
        keyFindings: aiResult.key_findings,
        actionChecklist: aiResult.action_checklist,
        generatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Update document status to COMPLETED
    await Document.findByIdAndUpdate(documentId, {
      status: 'COMPLETED',
      pageCount: aiResult.page_count,
      totalClauses: aiResult.total_clauses,
      overallRisk: aiResult.overall_risk,
      overallScore: aiResult.overall_score,
      processedAt: new Date()
    });

    // Zero-data-retention: purge physical file from disk if ephemeral
    if (isEphemeral && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[Privacy] Zero Data Retention active: file ${filePath} purged from disk.`);
      } catch (e) {
        console.warn(`[Privacy] Could not unlink ephemeral file: ${e.message}`);
      }
    }

    console.log(`Document ${documentId} (${originalName}) processing successfully completed.`);
  } catch (err) {
    console.error(`Pipeline failure for document ${documentId}:`, err.message);
    await Document.findByIdAndUpdate(documentId, {
      status: 'FAILED',
      errorMessage: err.message || 'Analysis pipeline encountered an error'
    });
  }
}

// @desc    Get all documents for logged in user
// @route   GET /api/documents
// @access  Private
const getUserDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ userId: req.user.id }).sort({ createdAt: -1 });
    
    // Compute dashboard aggregates
    const totalCount = documents.length;
    const highRiskCount = documents.filter(d => d.overallRisk === 'CRITICAL' || d.overallRisk === 'HIGH').length;
    const avgScore = totalCount > 0 
      ? Math.round(documents.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / totalCount) 
      : 0;

    res.json({
      success: true,
      metrics: {
        totalDocuments: totalCount,
        highRiskDocuments: highRiskCount,
        averageRiskScore: avgScore
      },
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single document details
// @route   GET /api/documents/:id
// @access  Private
const getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found or unauthorized' });
    }

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stream document file
// @route   GET /api/documents/:id/file
// @access  Private
const getDocumentFile = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server filesystem' });
    }

    res.setHeader('Content-Type', doc.fileType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
    const fileStream = fs.createReadStream(doc.filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Delete associated resources
    await Clause.deleteMany({ documentId: doc._id });
    await RiskAnalysis.deleteMany({ documentId: doc._id });
    await Report.deleteMany({ documentId: doc._id });
    await ChatHistory.deleteMany({ documentId: doc._id });

    // Remove local file
    if (fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (e) {
        console.warn('Could not delete file from disk:', e.message);
      }
    }

    await Document.findByIdAndDelete(doc._id);

    res.json({
      success: true,
      message: 'Document and analysis data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze raw pasted Terms & Conditions text
// @route   POST /api/documents/paste
// @access  Private
const pasteDocument = async (req, res, next) => {
  try {
    const { title, text, isEphemeral } = req.body;
    if (!text || !text.trim() || text.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid Terms & Conditions text (at least 20 characters).'
      });
    }

    const cleanTitle = (title && title.trim()) ? title.trim() : `Pasted_Agreement_${Date.now()}`;
    const filename = cleanTitle.endsWith('.txt') ? cleanTitle : `${cleanTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    const storedFilename = `paste-${Date.now()}-${filename}`;

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, storedFilename);
    fs.writeFileSync(filePath, text, 'utf8');

    const fileBuffer = Buffer.from(text, 'utf8');
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const isEph = isEphemeral === 'true' || isEphemeral === true;

    // Check for exact duplicate document previously analyzed by this user
    const existingDoc = await Document.findOne({
      userId: req.user.id,
      fileHash: fileHash,
      status: 'COMPLETED'
    });

    if (existingDoc && !isEph) {
      try { fs.unlinkSync(filePath); } catch (e) {}
      return res.status(200).json({
        success: true,
        data: existingDoc,
        message: 'Identical Terms & Conditions recognized via SHA-256 hash. Instant analysis loaded.'
      });
    }

    const newDoc = await Document.create({
      userId: req.user.id,
      originalName: filename,
      storedFilename: storedFilename,
      filePath: filePath,
      fileType: 'text/plain',
      fileSize: Buffer.byteLength(text, 'utf8'),
      fileHash: fileHash,
      isEphemeral: isEph,
      status: 'PROCESSING'
    });

    res.status(201).json({
      success: true,
      data: newDoc,
      message: isEph
        ? 'Confidential Ephemeral Mode active. Terms text received and AI analysis pipeline initiated.'
        : 'Terms & Conditions text received. AI analysis pipeline initiated.'
    });

    processDocumentPipeline(newDoc._id, filePath, filename, isEph).catch(err => {
      console.error(`Background processing error for pasted doc ${newDoc._id}:`, err);
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Load sample contract demo
// @route   POST /api/documents/demo
// @access  Private
const loadDemoDocument = async (req, res, next) => {
  try {
    const demoSampleText = `CLOUDSPHERE SAAS ENTERPRISE AGREEMENT (2026)

1. INTRODUCTION AND SCOPE OF SERVICE
By subscribing to, accessing, or using the CloudSphere Cloud Platform, Customer agrees to be irrevocably bound by these Terms and Conditions.

2. TERM, SUBSCRIPTION CHARGES, AND AUTO-RENEWAL NOTICE WINDOW
The initial term of this Agreement shall be twelve (12) months. All subscriptions automatically renew for successive 12-month periods unless Customer provides formal written notice of cancellation at least sixty (60) days prior to the expiration of the then-current term. CloudSphere reserves the right to increase subscription rates by up to 25% annually upon thirty (30) days' written notice.

3. INVOICING, PAYMENT TERMS, AND NO REFUND POLICY
All fees are billed annually in advance on Net 30 payment terms. All charges and subscription fees paid hereunder are strictly non-refundable under all circumstances, including partial utilization, unplanned service downtime, or early contract cancellation.

4. UNILATERAL AMENDMENT AND MODIFICATION RIGHTS
CloudSphere reserves the right to amend, alter, or modify these Terms and service features at any time in its sole discretion without prior written consent. Continued use of the Services after notice constitutes binding acceptance.

5. DATA TELEMETRY, SHARING, AND AI MODEL TRAINING
Customer grants CloudSphere a non-exclusive, worldwide license to collect, aggregate, and process customer metadata, prompts, and confidential system inputs to train proprietary artificial intelligence models and share telemetry with third-party advertising and analytics partners.

6. LIMITATION OF LIABILITY AND EXCLUSION OF DAMAGES
THE SERVICES ARE PROVIDED ON AN "AS-IS" BASIS. IN NO EVENT SHALL CLOUDSPHERE'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED THE TOTAL FEES ACTUALLY PAID BY CUSTOMER IN THE PRIOR THREE (3) MONTHS OR FIVE HUNDRED DOLLARS ($500.00), WHICHEVER IS LESS.

7. COMPLIANCE AUDIT AND INSPECTION RIGHTS
CloudSphere may, upon thirty (30) days advance notice, inspect and audit Customer's deployment records, user seat counts, and security protocols to verify adherence to agreed license thresholds.

8. MANDATORY ARBITRATION AND CLASS ACTION WAIVER
All disputes arising under this Agreement shall be resolved through binding individual arbitration administered by the American Arbitration Association. Customer explicitly waives all rights to participate in class actions or jury trials.`;

    const filename = `CloudSphere_SaaS_Agreement_${Date.now()}.txt`;
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, demoSampleText, 'utf8');

    const fileBuffer = Buffer.from(demoSampleText, 'utf8');
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const newDoc = await Document.create({
      userId: req.user.id,
      originalName: 'CloudSphere_SaaS_Agreement.txt',
      storedFilename: filename,
      filePath: filePath,
      fileType: 'text/plain',
      fileSize: Buffer.byteLength(demoSampleText, 'utf8'),
      fileHash: fileHash,
      isEphemeral: false,
      status: 'PROCESSING'
    });

    res.status(201).json({
      success: true,
      data: newDoc,
      message: 'Demo SaaS Agreement loaded. AI processing initiated.'
    });

    processDocumentPipeline(newDoc._id, filePath, 'CloudSphere_SaaS_Agreement.txt', false).catch(err => {
      console.error(`Background demo processing error for ${newDoc._id}:`, err);
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  pasteDocument,
  loadDemoDocument,
  getUserDocuments,
  getDocumentById,
  getDocumentFile,
  deleteDocument,
  processDocumentPipeline
};
