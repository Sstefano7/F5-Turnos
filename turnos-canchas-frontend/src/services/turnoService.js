import api from '../config/api';

export const turnoService = {
    getAll: async (filters = {}) => {
        const response = await api.get('/turnos', { params: filters });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/turnos/${id}`);
        return response.data;
    },

    create: async (turnoData) => {
        const response = await api.post('/turnos', turnoData);
        return response.data;
    },

    update: async (id, turnoData) => {
        const response = await api.put(`/turnos/${id}`, turnoData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/turnos/${id}`);
        return response.data;
    },

    cancelar: async (id) => {
        const response = await api.patch(`/turnos/${id}/cancelar`);
        return response.data;
    },

    getMisTurnos: async (clienteId) => {
        const response = await api.get('/mis-turnos', {
            params: { cliente_id: clienteId }
        });
        return response.data;
    }
};