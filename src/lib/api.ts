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
  timeout: 30000, // 30 segundos timeout
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Logs de debug para errores (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.error('❌ Error de API:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
    }

    // Si es un error de red (sin respuesta del servidor)
    if (!error.response) {
      let networkErrorMessage = 'Error de conexión: No se pudo conectar al servidor.';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        networkErrorMessage = `Error de conexión: No se pudo conectar al backend en ${baseURL}. Verifica que el servidor esté funcionando.`;
      } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        networkErrorMessage = 'Error de conexión: El servidor tardó demasiado en responder. Intenta nuevamente.';
      }
      
      const networkError = new Error(networkErrorMessage);
      return Promise.reject(networkError);
    }

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
