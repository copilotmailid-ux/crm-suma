import api from './axiosInstance';

export const getDrives = (params) => api.get('/drives', { params });
export const getDrive = (id) => api.get(`/drives/${id}`);
export const createDrive = (data) => api.post('/drives', data);
export const updateDrive = (id, data) => api.put(`/drives/${id}`, data);
export const deleteDrive = (id) => api.delete(`/drives/${id}`);
export const applyForDrive = (id) => api.post(`/drives/${id}/apply`);
