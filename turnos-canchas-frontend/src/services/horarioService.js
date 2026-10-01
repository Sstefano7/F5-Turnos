import api from '../config/api';

export const horarioService = {
  getAll: async (params = {}) => {
    const response = await api.get('/horarios', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/horarios/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/horarios', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/horarios/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/horarios/${id}`);
    return response.data;
  },
};
