import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

export const seniorityApi = {
  getAll: () => API.get('/seniorities'),
  getById: (id) => API.get(`/seniorities/${id}`),
  create: (data) => API.post('/seniorities', data),
  update: (id, data) => API.put(`/seniorities/${id}`, data),
  delete: (id) => API.delete(`/seniorities/${id}`),
};

export const personnelApi = {
  getAll: () => API.get('/personnel'),
  getById: (id) => API.get(`/personnel/${id}`),
  create: (data) => API.post('/personnel', data),
  update: (id, data) => API.put(`/personnel/${id}`, data),
  delete: (id) => API.delete(`/personnel/${id}`),
};

export const projectApi = {
  getAll: () => API.get('/projects'),
  getById: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  // Partial updates
  updatePersonnel: (id, personnelIds) => API.put(`/projects/${id}/personnel`, personnelIds),
  updateProducts: (id, productIds) => API.put(`/projects/${id}/products`, productIds),
  updatePaymentPlan: (id, paymentPlan) => API.put(`/projects/${id}/payment-plan`, paymentPlan),
  updateMilestones: (id, milestones) => API.put(`/projects/${id}/milestones`, milestones),
  updateResourcePlan: (id, resourcePlan) => API.put(`/projects/${id}/resource-plan`, resourcePlan),
};

export const productApi = {
  getAll: () => API.get('/products'),
  getById: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
};
