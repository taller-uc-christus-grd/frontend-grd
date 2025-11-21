/**
 * Servicio de Autenticación
 * 
 * Funciones helper para interactuar con los endpoints de autenticación del backend.
 * Todas las peticiones incluyen automáticamente el token JWT en el header Authorization
 * si el usuario está autenticado.
 */

import api from '@/lib/api';
import type { User, Role } from '@/types';
import { storeUser, getStoredUser } from '@/lib/auth';

/**
 * Interfaz para las credenciales de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Respuesta del endpoint de login
 */
export interface LoginResponse {
  user: User;
  token?: string;
}

/**
 * Inicia sesión en el backend
 * 
 * @param credentials - Email y contraseña del usuario
 * @returns Usuario autenticado y su rol
 * 
 * @example
 * ```ts
 * try {
 *   const role = await login({ email: 'user@example.com', password: 'password123' });
 *   console.log('Usuario autenticado con rol:', role);
 * } catch (error) {
 *   console.error('Error al iniciar sesión:', error.message);
 * }
 * ```
 */
export async function login(credentials: LoginCredentials): Promise<Role> {
  const response = await api.post<LoginResponse>('/api/auth/login', credentials);
  
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

  // Guardar usuario en localStorage
  storeUser(authenticatedUser);

  // El interceptor de axios se encargará de agregar el token a las peticiones
  return authenticatedUser.role;
}

/**
 * Obtiene el usuario actual autenticado desde el backend
 * 
 * Requiere un token JWT válido en el header Authorization.
 * 
 * @returns Usuario actual autenticado
 * 
 * @example
 * ```ts
 * try {
 *   const user = await getCurrentUser();
 *   console.log('Usuario actual:', user.email, 'Rol:', user.role);
 * } catch (error) {
 *   if (error.message.includes('Sesión expirada')) {
 *     // Redirigir a login
 *   }
 * }
 * ```
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<{ user: User } | User>('/api/auth/me');
  const userData = response.data.user || (response.data as User);
  const token = getStoredUser()?.token || userData.token;

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
  storeUser(currentUser);

  return currentUser;
}

/**
 * Cierra sesión en el backend
 * 
 * Opcionalmente llama al endpoint de logout del backend si existe.
 * Siempre limpia la sesión local.
 * 
 * @example
 * ```ts
 * await logout();
 * // El usuario será redirigido automáticamente si usas el hook useAuth
 * ```
 */
export async function logout(): Promise<void> {
  try {
    // Intentar llamar al endpoint de logout del backend
    await api.post('/api/auth/logout');
  } catch {
    // Ignorar errores si el endpoint no existe
  }

  // Limpiar sesión local
  storeUser(null);
}

