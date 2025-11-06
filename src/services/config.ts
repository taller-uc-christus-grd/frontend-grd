import api from '@/lib/api';

export interface SystemConfig {
  maxFileSizeMB?: number;
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  passwordMinLength?: number;
}

// Obtener configuración del sistema
export async function getConfig(): Promise<SystemConfig> {
  const response = await api.get<SystemConfig>('/api/config');
  return response.data;
}

// Actualizar configuración del sistema
export async function updateConfig(config: SystemConfig): Promise<SystemConfig> {
  const response = await api.put<SystemConfig>('/api/config', {
    configuracion: config
  });
  return response.data;
}

