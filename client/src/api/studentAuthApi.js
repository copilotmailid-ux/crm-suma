import api from './axiosInstance';

export const studentLogin = (credentials) => api.post('/student-auth/login', credentials);
export const getStudentProfile = () => api.get('/student-auth/profile');
export const updateStudentProfile = (data) => api.put('/student-auth/profile', data);
export const changeStudentPassword = (data) => api.put('/student-auth/change-password', data);
