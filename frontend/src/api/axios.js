import axios from 'axios';

// Base URL for the backend API — hardcoded, never rely on VITE_API_URL which can be set wrong in Vercel
export const API_BASE = import.meta.env.PROD ? 'https://gitcompass.onrender.com/api' : '/api';

// The full origin of the backend (used for browser navigations like OAuth)
export const BACKEND_ORIGIN = import.meta.env.PROD ? 'https://gitcompass.onrender.com' : '';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Do NOT clear token here — token is only cleared by explicit logout or
          // client-side expiry check in App.jsx. Clearing here causes a race where
          // Render's cold-start (50+ sec) returns 401 and wipes the token before
          // the backend is even ready.
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('An error occurred');
      }
    } else if (error.request) {
      console.error('Network error - no response received');
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const authAPI = {
  login: () => api.get('/auth/github'),
  logout: () => api.post('/auth/logout'),
  getUser: () => api.get('/auth/user'),
  checkAuth: () => api.get('/auth/check'),
};

export const resumeAPI = {
  upload: (formData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getSkills: () => api.get('/resume/skills'),
};

export const repositoryAPI = {
  search: (params) => api.post('/repositories/search', params),
  getRecommendations: () => api.get('/repositories/recommendations', { timeout: 150000 }),
  getDetails: (owner, repo) => api.get(`/repositories/${owner}/${repo}`),
  getIssues: (owner, repo, params) => api.get(`/repositories/${owner}/${repo}/issues`, { params }),
  getAnalytics: (owner, repo) => api.get(`/repositories/${owner}/${repo}/analytics`, { timeout: 60000 }),
};

export const guideAPI = {
  generate: (repoData, userContext) => api.post('/guide/generate', { repoData, userContext }),
};

export const aiAPI = {
  explain: (code, language, context) => api.post('/ai/explain', { code, language, context }),
  review: (code, language, context) => api.post('/ai/review', { code, language, context }),
  generatePR: (data) => api.post('/ai/generate-pr', data),
  createPR: (data) => api.post('/ai/create-pr', data),
};

// Alias exports for easier import
export const resumeService = {
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSkills: () => api.get('/resume/skills'),
};

export const repositoryService = {
  search: (params) => api.post('/repositories/search', params),
  getRecommendations: () => api.get('/repositories/recommendations', { timeout: 150000 }),
  getDetails: (owner, repo) => api.get(`/repositories/${owner}/${repo}`),
};

export const guideService = {
  generate: (repository, userSkills) => api.post('/guide/generate', { repository, userSkills }),
};
