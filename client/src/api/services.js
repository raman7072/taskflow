import api from './axios.js';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const workspaceAPI = {
  getAll: () => api.get('/workspaces'),
  getOne: (id) => api.get(`/workspaces/${id}`),
  create: (data) => api.post('/workspaces', data),
  update: (id, data) => api.put(`/workspaces/${id}`, data),
  delete: (id) => api.delete(`/workspaces/${id}`),
};

export const projectAPI = {
  getAll: (workspaceId) => api.get(`/projects?workspace=${workspaceId}`),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const columnAPI = {
  getAll: (projectId) => api.get(`/columns?project=${projectId}`),
  create: (data) => api.post('/columns', data),
  update: (id, data) => api.put(`/columns/${id}`, data),
  delete: (id) => api.delete(`/columns/${id}`),
  reorder: (columns) => api.put('/columns/reorder', { columns }),
};

export const taskAPI = {
  getAll: (projectId) => api.get(`/tasks?project=${projectId}`),
  getMy: () => api.get('/tasks/my'),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  move: (id, data) => api.patch(`/tasks/${id}/move`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text }),
};
