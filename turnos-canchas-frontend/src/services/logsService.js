import api from '../config/api';

export const logsService = {
    getAll: async (params = {}) => {
        const response = await api.get('/logs', { params });
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/logs/${id}`);
        return response.data;
    },

    exportPdf: async (params = {}) => {
        const response = await api.get('/logs/export-pdf', { 
            params,
            responseType: 'blob'
        });
        return response.data;
    }
};