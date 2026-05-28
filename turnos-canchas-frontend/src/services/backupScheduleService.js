import api from '../config/api';

const backupScheduleService = {
  async getAll() {
    const response = await api.get('/backups/schedule');
    return response.data;
  },

  async create(data) {
    const response = await api.post('/backups/schedule', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/backups/schedule/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/backups/schedule/${id}`);
    return response.data;
  }
};

export default backupScheduleService;
