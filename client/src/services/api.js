import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clauseguard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('clauseguard_token');
      localStorage.removeItem('clauseguard_user');
      // If we are not already on login/register/landing, redirect
      if (!window.location.pathname.match(/\/(login|register)?$/)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const documentAPI = {
  upload: (formData, onProgress) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }),
  loadDemo: () => api.post('/documents/demo'),
  paste: (payload) => api.post('/documents/paste', payload),
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`),
  getFileUrl: (id) => `${API_BASE_URL}/documents/${id}/file`,
};

export const riskAPI = {
  getAnalysis: (docId) => api.get(`/risk/${docId}`),
  getClauses: (docId, params) => api.get(`/clauses/${docId}`, { params }),
  getClauseById: (docId, clauseId) => api.get(`/clauses/${docId}/${clauseId}`),
  reAnalyze: (docId) => api.post(`/risk/analyze/${docId}`),
  redraftClause: (docId, clauseId) => api.post(`/clauses/${docId}/${clauseId}/redraft`),
};

export const qaAPI = {
  ask: (docId, question) => api.post(`/qa/${docId}`, { question }),
  getHistory: (docId) => api.get(`/qa/${docId}/history`),
};

export const reportAPI = {
  getReport: (docId) => api.get(`/reports/${docId}`),
};

export default api;
