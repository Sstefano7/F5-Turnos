import api from '../config/api';

export const clienteService = {
   // Cliente propio del usuario autenticado (autocompletado de reservas).
   // No confiar en getAll/create desde el flujo público: son admin-only.
   getMine: async () => {
        const response = await api.get('/mi-cliente');
        return response.data?.cliente ?? null;
    },

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