import api from '@/lib/api';

export interface DocumentoCloudinary {
  id: string;
  nombre: string;
  fecha: string;
  tamaño: string;
  usuario: string;
  url: string; // URL de Cloudinary
  public_id: string; // ID público de Cloudinary
  secure_url?: string; // URL segura de Cloudinary
}

/**
 * Sube un documento a Cloudinary a través del backend
 * @param episodioId ID del episodio
 * @param file Archivo a subir
 * @returns Documento guardado en Cloudinary
 */
export async function uploadDocumento(
  episodioId: string,
  file: File
): Promise<DocumentoCloudinary> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('episodioId', episodioId);

  const response = await api.post(`/api/episodios/${episodioId}/documentos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`📤 Subiendo documento: ${percentCompleted}%`);
      }
    },
  });

  return response.data;
}

/**
 * Obtiene todos los documentos asociados a un episodio
 * @param episodioId ID del episodio
 * @returns Lista de documentos
 */
export async function getDocumentos(episodioId: string): Promise<DocumentoCloudinary[]> {
  console.log('📥 Obteniendo documentos para episodio:', episodioId);
  const response = await api.get(`/api/episodios/${episodioId}/documentos`);
  console.log('📥 Documentos recibidos:', response.data);
  return response.data;
}

/**
 * Elimina un documento de Cloudinary
 * @param episodioId ID del episodio
 * @param documentoId ID del documento (public_id de Cloudinary o id del documento)
 * @returns Respuesta de eliminación
 */
export async function deleteDocumento(
  episodioId: string,
  documentoId: string
): Promise<void> {
  console.log('🗑️ Eliminando documento:', {
    episodioId,
    documentoId,
    url: `/api/episodios/${episodioId}/documentos/${documentoId}`
  });
  
  try {
    const response = await api.delete(`/api/episodios/${episodioId}/documentos/${documentoId}`);
    console.log('✅ Documento eliminado exitosamente:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error al eliminar documento:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullUrl: error.config?.baseURL + error.config?.url
    });
    throw error;
  }
}

/**
 * Reemplaza un documento existente
 * @param episodioId ID del episodio
 * @param documentoId ID del documento a reemplazar
 * @param file Nuevo archivo
 * @returns Documento actualizado
 */
export async function replaceDocumento(
  episodioId: string,
  documentoId: string,
  file: File
): Promise<DocumentoCloudinary> {
  // Primero eliminamos el documento anterior
  await deleteDocumento(episodioId, documentoId);
  
  // Luego subimos el nuevo
  return uploadDocumento(episodioId, file);
}



