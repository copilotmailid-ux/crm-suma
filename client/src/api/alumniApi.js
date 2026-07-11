import api from './axiosInstance';

export const getAlumni = (params) => api.get('/alumni', { params });
export const getAlumniById = (id) => api.get(`/alumni/${id}`);
export const updateAlumni = (id, data) => api.put(`/alumni/${id}`, data);
export const deleteAlumni = (id) => api.delete(`/alumni/${id}`);
