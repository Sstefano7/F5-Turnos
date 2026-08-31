import api from '../config/api';

export const backupsService = {
    getAll: async (params = {}) => {
        const response = await api.get('/backups', { params });
        return response.data;
    },

    create: async () => {
        const response = await api.post('/backups/create');
        return response.data;
    },

    download: async (fileName) => {
        const response = await api.get(`/backups/download/${fileName}`, {
            responseType: 'blob'
        });
        return response.data;
    }
};