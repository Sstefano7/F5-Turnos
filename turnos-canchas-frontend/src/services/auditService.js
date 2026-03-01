import api from '../config/api';

export const auditService = {
    getAll: async (params = {}) => {
        const response = await api.get('/audits', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/audits/${id}`);
        return response.data;
    }
};