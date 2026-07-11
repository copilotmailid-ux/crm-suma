import api from './axiosInstance';

export const getStats = () => api.get('/dashboard/stats');
export const getDeptWise = () => api.get('/dashboard/dept-wise');
export const getCompanyWise = () => api.get('/dashboard/company-wise');
export const getBatchWise = () => api.get('/dashboard/batch-wise');
export const getRecent = () => api.get('/dashboard/recent');
export const getBatchAnalysis = (batch) => api.get('/dashboard/batch-analysis', { params: { batch } });

