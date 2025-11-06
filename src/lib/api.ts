import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Logs de debug (siempre mostrar en consola para debugging)
console.log('🔍 API Base URL:', baseURL);
console.log('🔍 VITE_API_URL env:', import.meta.env.VITE_API_URL);
console.log('🔍 Environment:', import.meta.env.MODE);

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos timeout
});

api.interceptors.request.use(
  (config) => {
    // Lee el token del almacenamiento local (ajusta la forma en que lo almacenas)
    const storedUser = localStorage.getItem('grd_user'); 
    const user = storedUser ? JSON.parse(storedUser) : null;
    const token = user?.token; // Asumiendo que el token JWT está en user.token

    if (token) {
      // CLAVE: Adjuntar el token al header 'Authorization'
      config.headers.Authorization = `Bearer ${token}`;
      
      // Logging para debugging (solo en desarrollo)
      if (import.meta.env.DEV) {
        console.log('🔑 Token agregado a la petición:', {
          url: config.url,
          method: config.method,
          hasToken: !!token,
          tokenLength: token.length
        });
      }
    } else {
      // Logging si no hay token (solo en desarrollo)
      if (import.meta.env.DEV) {
        console.warn('⚠️ No se encontró token para la petición:', {
          url: config.url,
          method: config.method
        });
      }
    }
    
    // Si es FormData, NO establecer Content-Type manualmente - axios lo hace automáticamente con el boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
      
      // Logs detallados para debugging en producción
      console.error('❌ Error de red:', {
        message: error.message,
        code: error.code,
        baseURL,
        url: error.config?.url,
        fullUrl: error.config?.baseURL + error.config?.url,
      });
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        networkErrorMessage = `Error de conexión: No se pudo conectar al backend en ${baseURL}. Verifica que el servidor esté funcionando y que la URL sea correcta.`;
      } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        networkErrorMessage = 'Error de conexión: El servidor tardó demasiado en responder. Intenta nuevamente.';
      } else if (error.code === 'ERR_CERT_AUTHORITY_INVALID' || error.message?.includes('certificate')) {
        networkErrorMessage = 'Error de certificado SSL. Verifica que la URL del backend sea correcta.';
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
    
    // Si es un error 500 con mensaje de acceso denegado, loguear detalles
    if (error.response?.status === 500) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.response?.data?.mensaje;
      if (errorMessage?.toLowerCase().includes('acceso denegado') || 
          errorMessage?.toLowerCase().includes('access denied')) {
        console.error('🚫 Error de acceso denegado (500):', {
          message: errorMessage,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.response?.data
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
