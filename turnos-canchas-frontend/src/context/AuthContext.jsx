import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario guardado al cargar la app
    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al iniciar sesión' 
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await authService.register(data);
      setUser(response.user);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al registrarse',
        errors: error.response?.data?.errors || null,
        status: error.response?.status || null,
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aunque falle en el backend, limpiamos el estado local
      setUser(null);
    }
  };

  // Funciones de verificación de roles
  const isAuthenticated = () => {
    return !!user;
  };

  const isAdmin = () => {
  // Un superadmin también puede acceder a funciones de admin
  return user?.role === 'admin' || user?.role === 'superadmin';
};

  const isSuperAdmin = () => {
    return user?.role === 'superadmin';
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated,
    loading,
    isAdmin,
    isSuperAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};