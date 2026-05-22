import axios from 'axios';

const API_BASE = 'http://localhost:3045/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

const createCRUD = (endpoint) => ({
  getAll: (params) => api.get(endpoint, { params }),
  getById: (id) => api.get(`${endpoint}/${id}`),
  create: (data) => api.post(endpoint, data),
  update: (id, data) => api.put(`${endpoint}/${id}`, data),
  delete: (id) => api.delete(`${endpoint}/${id}`),
});

export const animalsAPI = {
  ...createCRUD('/animals'),
  aiAnalysis: (id) => api.post(`/animals/${id}/ai-analysis`),
  healthTrend: (id) => api.get(`/animals/${id}/health-trend`),
};
export const healthRecordsAPI = { ...createCRUD('/health-records'), aiAnalysis: (id) => api.post(`/health-records/${id}/ai-analysis`) };
export const vaccinationsAPI = createCRUD('/vaccinations');
export const feedManagementAPI = { ...createCRUD('/feed-management'), aiOptimize: (data) => api.post('/feed-management/ai-optimize', data) };
export const weightTrackingAPI = createCRUD('/weight-tracking');
export const breedingRecordsAPI = { ...createCRUD('/breeding-records'), aiRecommendation: (id) => api.post(`/breeding-records/${id}/ai-recommendation`) };
export const vetVisitsAPI = createCRUD('/vet-visits');
export const medicationsAPI = createCRUD('/medications');
export const herdsAPI = {
  ...createCRUD('/herds'),
  riskAssessment: (id) => api.post(`/herds/${id}/risk-assessment`),
  healthSummary: (id) => api.get(`/herds/${id}/health-summary`),
};
export const alertsAPI = { ...createCRUD('/alerts'), resolve: (id) => api.put(`/alerts/${id}/resolve`) };
export const diseaseDetectionAPI = { ...createCRUD('/disease-detection'), aiPredict: (data) => api.post('/disease-detection/ai-predict', data) };
export const mortalityRecordsAPI = createCRUD('/mortality-records');
export const milkProductionAPI = { ...createCRUD('/milk-production'), aiAnalysis: () => api.post('/milk-production/ai-analysis') };
export const financialRecordsAPI = { ...createCRUD('/financial-records'), aiAnalysis: () => api.post('/financial-records/ai-analysis') };

export default api;
