import api from './axiosInstance';

export const getFaculties = (params) => api.get('/faculty', { params });
export const createFaculty = (data) => api.post('/faculty', data);
export const updateFaculty = (id, data) => api.put(`/faculty/${id}`, data);
export const deleteFaculty = (id) => api.delete(`/faculty/${id}`);

export const getTimeTable = (params) => api.get('/faculty/timetable', { params });
export const saveTimeTableSlot = (data) => api.post('/faculty/timetable/slot', data);
export const clearTimeTableSlot = (id) => api.delete(`/faculty/timetable/slot/${id}`);
export const resetDefaultTimeTable = () => api.post('/faculty/timetable/reset-default');
export const getWorkloadAnalytics = (params) => api.get('/faculty/workload', { params });
