const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const fs = require('fs');

class AIGateway {
  /**
   * Health check to ensure AI microservice is responsive
   */
  static async checkHealth() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 15000 });
      return response.data;
    } catch (error) {
      console.warn(`AI Service health check failed (${AI_SERVICE_URL}): ${error.message}`);
      return { status: 'offline', error: error.message };
    }
  }

  /**
   * Trigger complete document analysis pipeline
   */
  static async processDocument(documentId, filePath, filename) {
    let fileBase64 = null;
    let rawText = null;

    if (filePath && fs.existsSync(filePath)) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        fileBase64 = fileBuffer.toString('base64');
        if (filename.endsWith('.txt') || filename.endsWith('.md')) {
          rawText = fileBuffer.toString('utf8');
        }
      } catch (readErr) {
        console.warn(`[AIGateway] Could not read file into buffer: ${readErr.message}`);
      }
    }

    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/process-document`,
        {
          document_id: documentId.toString(),
          file_path: filePath,
          filename: filename,
          file_base64: fileBase64,
          raw_text: rawText
        },
        { timeout: 120000 } // 2 minutes timeout for cold starts and heavy files
      );
      return response.data;
    } catch (error) {
      console.error(`AI Gateway processDocument error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'AI Service processing failed');
    }
  }

  /**
   * Semantic Q&A query
   */
  static async queryDocument(documentId, question, topK = 4) {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/query`,
        {
          document_id: documentId.toString(),
          question: question,
          top_k: topK
        },
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      console.error(`AI Gateway queryDocument error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'AI Service query failed');
    }
  }

  /**
   * Redraft a clause to produce a fair, balanced alternative
   */
  static async redraftClause(heading, text, category, riskLevel, riskFactors = []) {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/redraft-clause`,
        {
          heading: heading,
          text: text,
          category: category,
          risk_level: riskLevel,
          risk_factors: riskFactors
        },
        { timeout: 15000 }
      );
      return response.data;
    } catch (error) {
      console.error(`AI Gateway redraftClause error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'AI Service clause redrafting failed');
    }
  }
}

module.exports = AIGateway;
