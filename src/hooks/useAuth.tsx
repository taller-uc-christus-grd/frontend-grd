import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User, Role } from '@/types';
import { getStoredUser, storeUser } from '@/lib/auth';
import api from '@/lib/api';

const Ctx = createContext<any>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  
  // Verificar si el usuario está autenticado al cargar
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser && storedUser.token) {
      // Restaurar token en el header de axios
      api.defaults.headers.common['Authorization'] = `Bearer ${storedUser.token}`;
    }
  }, []);
  
  async function login(email: string, password: string): Promise<Role> {
    try {
      // Llamada real al backend
      const response = await api.post('/api/auth/login', {
        email,
        password
      });

      // El backend debe devolver: { user: { id, email, role, token }, token? }
      const userData = response.data.user || response.data;
      const token = response.data.token || userData.token;

      if (!userData || !userData.role) {
        throw new Error('Respuesta del servidor inválida');
      }

      const authenticatedUser: User = {
        id: userData.id || userData._id || '',
        email: userData.email,
        role: userData.role as Role,
        token: token || ''
      };

      // Guardar token en el header de axios para futuras peticiones
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      setUser(authenticatedUser);
      storeUser(authenticatedUser);
      
      return authenticatedUser.role;
    } catch (error: any) {
      // Manejar errores de autenticación
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      // Detectar errores de red/conexión
      if (!error.response) {
        if (error.message?.includes('Error de conexión') || 
            error.code === 'ECONNREFUSED' || 
            error.code === 'ERR_NETWORK' ||
            error.code === 'ETIMEDOUT') {
          errorMessage = error.message || `Error de conexión: No se pudo conectar al backend. Verifica que esté funcionando en ${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`;
        } else {
          errorMessage = error.message || 'Error de conexión con el servidor.';
        }
      } else if (error.response) {
        // Error con respuesta del servidor
        if (error.response.status === 403) {
          // Usuario inactivo
          errorMessage = error.response?.data?.message || 'Usuario inactivo. Contacta al administrador.';
        } else {
          errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
  
  /**
   * Obtiene el usuario actual autenticado desde el backend
   * Usa el token almacenado para hacer una petición GET /api/auth/me
   * @returns Usuario actual si está autenticado
   * @throws Error si no hay token o la autenticación falla
   */
  async function getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/api/auth/me');
      const userData = response.data.user || response.data;
      const storedUser = getStoredUser();
      const token = storedUser?.token || userData.token;

      if (!userData || !userData.role) {
        throw new Error('Respuesta del servidor inválida');
      }

      const currentUser: User = {
        id: userData.id || userData._id || '',
        email: userData.email,
        role: userData.role as Role,
        token: token || ''
      };

      // Actualizar usuario almacenado
      setUser(currentUser);
      storeUser(currentUser);

      // Actualizar token en el header
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      return currentUser;
    } catch (error: any) {
      // Si falla la autenticación, limpiar sesión
      if (error.response?.status === 401) {
        setUser(null);
        storeUser(null);
        delete api.defaults.headers.common['Authorization'];
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      throw error;
    }
  }
  
  async function logout() {
    try {
      // Opcional: llamar al endpoint de logout del backend
      await api.post('/api/auth/logout').catch(() => {
        // Ignorar errores si el endpoint no existe
      });
    } catch {
      // Continuar con el logout local aunque falle el backend
    }
    
    // Limpiar token del header
    delete api.defaults.headers.common['Authorization'];
    
    setUser(null);
    storeUser(null);
    
    // Redirigir a login después de cerrar sesión
    window.location.href = '/login';
  }
  
  const value = useMemo(() => ({ user, login, logout, getCurrentUser }), [user]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
