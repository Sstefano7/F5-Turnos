import api from '../config/api';

export const clienteService = {
   getAll: async (params = {}) => {
        const response = await api.get('/clientes', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/clientes/${id}`);
        return response.data;
    },

    create: async (clienteData) => {
        const response = await api.post('/clientes', clienteData);
        return response.data;
    },

    update: async (id, clienteData) => {
        const response = await api.put(`/clientes/${id}`, clienteData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/clientes/${id}`);
        return response.data;
    }
};