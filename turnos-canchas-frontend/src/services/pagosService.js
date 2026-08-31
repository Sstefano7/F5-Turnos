import api from '../config/api';

export const pagosService = {
    getAll: async (params = {}) => {
        const response = await api.get('/pagos', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/pagos/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/pagos', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/pagos/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/pagos/${id}`);
        return response.data;
    },

    exportPdf: async (params = {}) => {
        const response = await api.get('/pagos/export-pdf', { 
            params,
            responseType: 'blob'
        });
        return response.data;
    }
};