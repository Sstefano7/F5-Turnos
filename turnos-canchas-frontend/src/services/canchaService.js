import api from '../config/api';

export const canchaService = {
    getAll: async () => {
        const response = await api.get('/canchas');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/canchas/${id}`);
        return response.data;
    },

    getHorariosDisponibles: async (canchaId, fecha) => {
        const response = await api.get(`/canchas/${canchaId}/horarios-disponibles`, {
            params: { fecha }
        });
        return response.data;
    },

    create: async (canchaData) => {
        const response = await api.post('/canchas', canchaData);
        return response.data;
    },

    update: async (id, canchaData) => {
        const response = await api.put(`/canchas/${id}`, canchaData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/canchas/${id}`);
        return response.data;
    }
};