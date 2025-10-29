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
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw new Error('No se pudieron cargar los usuarios');
  }
}

// Crear nuevo usuario
export async function createUser(userData: CreateUserData): Promise<User> {
  try {
    const response = await api.post('/api/users', userData);
    return response.data;
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
