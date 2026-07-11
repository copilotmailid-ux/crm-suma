import api from './axiosInstance';

export const getCompanies = (params) => api.get('/companies', { params });
export const getAllCompanies = () => api.get('/companies/all');
export const getCompany = (id) => api.get(`/companies/${id}`);
export const createCompany = (data) => api.post('/companies', data);
export const updateCompany = (id, data) => api.put(`/companies/${id}`, data);
export const deleteCompany = (id) => api.delete(`/companies/${id}`);
