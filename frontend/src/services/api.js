import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
  updatePersonnel: (id, personnelIds) => API.put(`/projects/${id}/personnel`, personnelIds),
  updateBudget: (id, data) => API.put(`/projects/${id}/budget`, data),
  updateProducts: (id, productIds) => API.put(`/projects/${id}/products`, productIds),
  updatePaymentPlan: (id, paymentPlan) => API.put(`/projects/${id}/payment-plan`, paymentPlan),
  updateMilestones: (id, milestones) => API.put(`/projects/${id}/milestones`, milestones),
  updateResourcePlan: (id, resourcePlan) => API.put(`/projects/${id}/resource-plan`, resourcePlan),
};

export const potentialSaleApi = {
  getAll: () => API.get('/potential-sales'),
  getByProject: (projectId) => API.get(`/potential-sales/project/${projectId}`),
  create: (data) => API.post('/potential-sales', data),
  update: (id, data) => API.put(`/potential-sales/${id}`, data),
  delete: (id) => API.delete(`/potential-sales/${id}`),
};

export const organizationApi = {
  getAll: () => API.get('/organization'),
  getRoots: () => API.get('/organization/roots'),
  getChildren: (id) => API.get(`/organization/${id}/children`),
  create: (data) => API.post('/organization', data),
  update: (id, data) => API.put(`/organization/${id}`, data),
  delete: (id) => API.delete(`/organization/${id}`),
};

export const productApi = {
  getAll: () => API.get('/products'),
  getById: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
};

export const projectTypeApi = {
  getAll: () => API.get('/project-types'),
  create: (data) => API.post('/project-types', data),
  update: (id, data) => API.put(`/project-types/${id}`, data),
  delete: (id) => API.delete(`/project-types/${id}`),
};

export const projectCategoryApi = {
  getAll: () => API.get('/project-categories'),
  create: (data) => API.post('/project-categories', data),
  update: (id, data) => API.put(`/project-categories/${id}`, data),
  delete: (id) => API.delete(`/project-categories/${id}`),
  getWorkflow: (categoryId) => API.get(`/project-categories/${categoryId}/workflow`),
  saveWorkflow: (categoryId, steps) => API.put(`/project-categories/${categoryId}/workflow`, steps),
};
