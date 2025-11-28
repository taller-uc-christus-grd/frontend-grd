/**
 * Helpers para peticiones API autenticadas
 * 
 * Funciones utilitarias para realizar peticiones al backend con autenticación automática.
 * Todas las peticiones incluyen automáticamente el token JWT si el usuario está autenticado.
 */

import api from '@/lib/api';

/**
 * Respuesta genérica de la API
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  ok?: boolean;
}

/**
 * Realiza una petición GET autenticada
 * 
 * @param endpoint - Ruta del endpoint (ej: '/api/episodios')
 * @returns Datos de la respuesta
 * 
 * @example
 * ```ts
 * const episodios = await apiGet<Episode[]>('/api/episodios');
 * ```
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const response = await api.get<ApiResponse<T> | T>(endpoint);
  // Si la respuesta tiene formato { data: ... }, extraer data
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as ApiResponse<T>).data;
  }
  return response.data as T;
}

/**
 * Realiza una petición POST autenticada
 * 
 * @param endpoint - Ruta del endpoint
 * @param data - Datos a enviar en el body
 * @returns Datos de la respuesta
 * 
 * @example
 * ```ts
 * const nuevoEpisodio = await apiPost<Episode>('/api/episodios', {
 *   episodio: '12345',
 *   rut: '12345678-9'
 * });
 * ```
 */
export async function apiPost<T = any>(endpoint: string, data?: any): Promise<T> {
  const response = await api.post<ApiResponse<T> | T>(endpoint, data);
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as ApiResponse<T>).data;
  }
  return response.data as T;
}

/**
 * Realiza una petición PUT autenticada
 * 
 * @param endpoint - Ruta del endpoint
 * @param data - Datos a enviar en el body
 * @returns Datos de la respuesta
 * 
 * @example
 * ```ts
 * const episodioActualizado = await apiPut<Episode>(`/api/episodios/${id}`, {
 *   validado: true
 * });
 * ```
 */
export async function apiPut<T = any>(endpoint: string, data?: any): Promise<T> {
  const response = await api.put<ApiResponse<T> | T>(endpoint, data);
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as ApiResponse<T>).data;
  }
  return response.data as T;
}

/**
 * Realiza una petición PATCH autenticada
 * 
 * @param endpoint - Ruta del endpoint
 * @param data - Datos a enviar en el body
 * @returns Datos de la respuesta
 * 
 * @example
 * ```ts
 * const episodioParcial = await apiPatch<Episode>(`/api/episodios/${id}`, {
 *   estadoRN: 'Aprobado'
 * });
 * ```
 */
export async function apiPatch<T = any>(endpoint: string, data?: any): Promise<T> {
  const response = await api.patch<ApiResponse<T> | T>(endpoint, data);
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as ApiResponse<T>).data;
  }
  return response.data as T;
}

/**
 * Realiza una petición DELETE autenticada
 * 
 * @param endpoint - Ruta del endpoint
 * @returns Datos de la respuesta
 * 
 * @example
 * ```ts
 * await apiDelete(`/api/episodios/${id}`);
 * ```
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  const response = await api.delete<ApiResponse<T> | T>(endpoint);
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as ApiResponse<T>).data;
  }
  return response.data as T;
}

/**
 * Sube un archivo usando FormData
 * 
 * @param endpoint - Ruta del endpoint
 * @param file - Archivo a subir
 * @param additionalData - Datos adicionales a incluir en FormData
 * @returns Datos de la respuesta
 * 
 * @example
 * ```ts
 * const result = await uploadFile('/api/upload', fileInput.files[0], {
 *   tipo: 'episodios',
 *   centro: 'Hospital1'
 * });
 * ```
 */
export async function uploadFile<T = any>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string | number | boolean>
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  const response = await api.post<ApiResponse<T> | T>(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as ApiResponse<T>).data;
  }
  return response.data as T;
}

