import api from './axiosInstance';

export const getStats = (params) => api.get('/dashboard/stats', { params });
export const getDeptWise = (params) => api.get('/dashboard/dept-wise', { params });
export const getCompanyWise = (params) => api.get('/dashboard/company-wise', { params });
export const getBatchWise = () => api.get('/dashboard/batch-wise');
export const getRecent = (params) => api.get('/dashboard/recent', { params });
export const getBatchAnalysis = (batch) => api.get('/dashboard/batch-analysis', { params: { batch } });

