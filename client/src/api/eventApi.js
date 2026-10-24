import api from './axiosInstance';

export const getEvents = async (params = {}) => {
  const response = await api.get('/events', { params });
  return response.data;
};

export const getEventById = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

export const createEvent = async (eventData) => {
  const response = await api.post('/events', eventData);
  return response.data;
};

export const updateEvent = async (id, eventData) => {
  const response = await api.put(`/events/${id}`, eventData);
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await api.delete(`/events/${id}`);
  return response.data;
};

export const addStudentToAttendance = async (id, studentData) => {
  const response = await api.post(`/events/${id}/attendance`, studentData);
  return response.data;
};

export const updateAttendanceStatus = async (id, recordId, data) => {
  const response = await api.patch(`/events/${id}/attendance/${recordId}`, data);
  return response.data;
};

export const bulkUpdateAttendance = async (id, data) => {
  const response = await api.post(`/events/${id}/attendance/bulk`, data);
  return response.data;
};

export const autoRegisterStudents = async (id, data) => {
  const response = await api.post(`/events/${id}/auto-register`, data);
  return response.data;
};

export const removeStudentFromAttendance = async (id, recordId) => {
  const response = await api.delete(`/events/${id}/attendance/${recordId}`);
  return response.data;
};

export const registerForEvent = async (id) => {
  const response = await api.post(`/events/${id}/register`);
  return response.data;
};

export const unregisterFromEvent = async (id) => {
  const response = await api.delete(`/events/${id}/register`);
  return response.data;
};
