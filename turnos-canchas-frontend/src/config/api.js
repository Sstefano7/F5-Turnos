import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor para agregar el token a cada petición
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 401 = token vencido o revocado. Sin esto la app quedaba congelada en una
// pantalla rota y el usuario tenia que adivinar que tenia que reloguearse.
const RUTAS_SESION = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';
        const esSesion = RUTAS_SESION.some((ruta) => url.includes(ruta))
            || url.includes('/register/challenge')
            || url.includes('/promo/validate')
            || url.includes('/bug-reports');

        if (status === 401 && !esSesion && localStorage.getItem('token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!RUTAS_SESION.some((ruta) => window.location.pathname.startsWith(ruta))) {
                window.location.assign('/login?sesion=expirada');
            }
        }

        return Promise.reject(error);
    }
);

export default api;