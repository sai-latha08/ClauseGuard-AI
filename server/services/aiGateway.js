const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

class AIGateway {
  /**
   * Health check to ensure AI microservice is responsive
   */
  static async checkHealth() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.warn(`AI Service health check failed: ${error.message}`);
      return { status: 'offline', error: error.message };
    }
  }

  /**
   * Trigger complete document analysis pipeline
   */
  static async processDocument(documentId, filePath, filename) {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/process-document`,
        {
          document_id: documentId.toString(),
          file_path: filePath,
          filename: filename
        },
        { timeout: 120000 } // 2 minutes timeout for large documents
      );
      return response.data;
    } catch (error) {
      console.error(`AI Gateway processDocument error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'AI Service processing failed');
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
