import api from '../config/api';

export const auditService = {
    getAll: async (params = {}) => {
        const response = await api.get('/audits', { params });
        return response.data;
    },

    exportPdf: async (params = {}) => {
        const response = await api.get('/audits/export-pdf', { 
            params,
            responseType: 'blob'
        });
        return response.data;
    }
};