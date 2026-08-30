import api from '../config/api';

export const authService = {
    register: async (payload) => {
        const response = await api.post('/register', payload);
        if (response.data.access_token && response.data.user?.email) {
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

    // NOTA: Para verificar roles (isAdmin, isSuperAdmin) usar siempre el AuthContext
    // (useAuth hook) en lugar de este servicio, ya que el contexto tiene la lógica
    // correcta y actualizada. authService solo maneja el almacenamiento del token.

    verifyEmail: async (token) => {
        const response = await api.get(`/verify-email/${token}`);
        return response.data;
    },

    resendVerification: async () => {
        const response = await api.post('/resend-verification');
        return response.data;
    },

    validatePromo: async (code) => {
        const response = await api.post('/promo/validate', { code });
        return response.data;
    },

    solveChallenge: async (challengeToken, answer) => {
        const response = await api.post('/register/challenge', {
            challenge_token: challengeToken,
            answer,
        });
        return response.data;
    },

    uploadProfilePhoto: async (file) => {
        const formData = new FormData();
        formData.append('photo', file);
        const response = await api.post('/profile/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

        forgotPassword: async (email) => {
        const response = await api.post('/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (email, token, password, passwordConfirmation) => {
        const response = await api.post('/reset-password', {
            email,
            token,
            password,
            password_confirmation: passwordConfirmation
        });
        return response.data;
    }

};