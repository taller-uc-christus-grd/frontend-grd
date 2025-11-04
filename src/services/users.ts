// src/services/users.ts
import api from '@/lib/api';
import type { Role } from '@/types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: Role;
  status: 'active' | 'inactive';
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: string;
}

// Obtener todos los usuarios
export async function getUsers(): Promise<User[]> {
  try {
    const response = await api.get('/api/users');
    // Transformar los datos del backend al formato del frontend
    return response.data.map((user: any) => ({
      id: user.id.toString(),
      name: user.nombre || user.name,
      email: user.email,
      role: (user.rol || user.role).toLowerCase() as Role,
      status: user.activo === true || user.activo === 'active' ? 'active' : 'inactive',
      createdAt: user.createdAt || user.created_at,
      lastLogin: user.lastLogin || user.last_login
    }));
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw new Error('No se pudieron cargar los usuarios');
  }
}

// Crear nuevo usuario
export async function createUser(userData: CreateUserData): Promise<User> {
  try {
    // Transformar los datos del frontend al formato que espera el backend
    const backendData = {
      nombre: userData.name, // El backend espera 'nombre'
      email: userData.email,
      password: userData.password,
      rol: userData.role.toUpperCase(), // El backend espera 'rol' en mayúsculas (CODIFICADOR, FINANZAS, etc.)
      activo: userData.status === 'active' // El backend espera 'activo' como boolean
    };
    
    const response = await api.post('/api/users', backendData);
    
    // Transformar la respuesta del backend al formato del frontend
    const user = response.data;
    return {
      id: user.id.toString(),
      name: user.nombre || user.name,
      email: user.email,
      role: (user.rol || user.role).toLowerCase() as Role,
      status: user.activo === true || user.activo === 'active' ? 'active' : 'inactive',
      createdAt: user.createdAt || user.created_at,
      lastLogin: user.lastLogin || user.last_login
    };
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    throw new Error(error.response?.data?.message || 'Error al crear usuario');
  }
}

// Actualizar usuario
export async function updateUser(userData: UpdateUserData): Promise<User> {
  try {
    const response = await api.put(`/api/users/${userData.id}`, userData);
    return response.data;
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
    throw new Error(error.response?.data?.message || 'Error al actualizar usuario');
  }
}

// Eliminar usuario
export async function deleteUser(userId: string): Promise<void> {
  try {
    await api.delete(`/api/users/${userId}`);
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    throw new Error(error.response?.data?.message || 'Error al eliminar usuario');
  }
}

// Cambiar estado del usuario
export async function toggleUserStatus(userId: string, status: 'active' | 'inactive'): Promise<User> {
  try {
    const response = await api.patch(`/api/users/${userId}/status`, { status });
    return response.data;
  } catch (error: any) {
    console.error('Error al cambiar estado del usuario:', error);
    throw new Error(error.response?.data?.message || 'Error al cambiar estado del usuario');
  }
}
