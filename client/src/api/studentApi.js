import api from './axiosInstance';

export const getStudents = (params) => api.get('/students', { params });
export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);
export const getBatches = () => api.get('/students/batches/list');
export const bulkCreateStudents = (students) => api.post('/students/bulk', { students });

// Student attended drives history & offer letters
export const getStudentDrives = (id) => api.get(`/students/${id}/drives`);
export const uploadStudentOfferLetter = (id, data) => api.post(`/students/${id}/offer-letter`, data);
export const deleteStudentOfferLetter = (id, data) => api.delete(`/students/${id}/offer-letter`, { data });

