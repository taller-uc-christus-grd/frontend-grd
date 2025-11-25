import type { Role, User } from '@/types';

const STORAGE_KEY = 'grd_user';

/**
 * Obtiene el usuario almacenado en localStorage
 * @returns Usuario si existe, null si no hay usuario almacenado
 */
export const getStoredUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as User) : null;
};

/**
 * Guarda o elimina el usuario en localStorage
 * @param user - Usuario a guardar o null para eliminar
 */
export const storeUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 * @param user - Usuario a verificar
 * @param allowedRoles - Array de roles permitidos
 * @returns true si el usuario tiene uno de los roles permitidos
 */
export const hasRole = (user: User | null, allowedRoles: Role[]): boolean => {
  return !!user && allowedRoles.includes(user.role);
};

/**
 * Obtiene el token JWT del usuario almacenado
 * @returns Token JWT si existe, null si no hay usuario o token
 */
export const getToken = (): string | null => {
  const user = getStoredUser();
  return user?.token || null;
};
