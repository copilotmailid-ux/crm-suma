import api from './axiosInstance';

export const getDrives = (params) => api.get('/drives', { params });
export const getDrive = (id) => api.get(`/drives/${id}`);
export const getDriveCandidates = (id) => api.get(`/drives/${id}/candidates`);
export const createDrive = (data) => api.post('/drives', data);
export const updateDrive = (id, data) => api.put(`/drives/${id}`, data);
export const deleteDrive = (id) => api.delete(`/drives/${id}`);
export const applyForDrive = (id) => api.post(`/drives/${id}/apply`);
export const advanceRoundCandidates = (id, roundNumber, data) =>
  api.post(`/drives/${id}/rounds/${roundNumber}/advance`, data);
export const selectFinalCandidates = (id, data) =>
  api.post(`/drives/${id}/select-final`, data);
export const addOrUpdateRound = (id, data) =>
  api.post(`/drives/${id}/rounds`, data);
export const sendCustomRoundEmail = (id, roundNumber, data) =>
  api.post(`/drives/${id}/rounds/${roundNumber}/send-email`, data);
