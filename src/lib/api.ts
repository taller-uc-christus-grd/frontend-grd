import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Logs de debug (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔍 API Base URL:', baseURL);
  console.log('🔍 VITE_API_URL env:', import.meta.env.VITE_API_URL);
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si es un error 401 (no autorizado), limpiar sesión
    if (error.response?.status === 401) {
      const storedUser = localStorage.getItem('grd_user');
      if (storedUser) {
        localStorage.removeItem('grd_user');
        delete api.defaults.headers.common['Authorization'];
        // Redirigir a login si no estamos ya ahí
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
