import api from '../config/api';

export const bugReportService = {
    getAll: async (params = {}) => {
        const response = await api.get('/bug-reports', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/bug-reports/${id}`);
        return response.data;
    },

    create: async (reportData) => {
        const response = await api.post('/bug-reports', reportData);
        return response.data;
    },

    update: async (id, reportData) => {
        const response = await api.put(`/bug-reports/${id}`, reportData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/bug-reports/${id}`);
        return response.data;
    },

    
    exportPdf: async () => {
        const response = await api.get('/bug-reports/export-pdf', {
            responseType: 'blob' // Súper importante para que entienda que es un archivo
        });
        return response.data;
    }
};