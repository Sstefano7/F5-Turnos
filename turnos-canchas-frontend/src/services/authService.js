import api from '../config/api';

export const authService = {
    register: async (name, email, password, passwordConfirmation) => {
        const response = await api.post('/register', {
            name,
            email,
            password,
            password_confirmation: passwordConfirmation
        });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout: async () => {
        await api.post('/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    isAdmin: () => {
        const user = localStorage.getItem('user');
        if (!user) return false;
        const userData = JSON.parse(user);
        return userData.role === 'admin';
    }
};