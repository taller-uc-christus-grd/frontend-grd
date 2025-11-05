// src/services/catalogs.ts
import api from '@/lib/api';

/**
 * Sube archivo Excel de la Norma MINSAL (xlsx/xls/csv).
 */
export async function uploadNormaMinsal(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  
  // Log para verificar qué URL se está usando
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const fullURL = `${baseURL}/api/catalogs/norma-minsal/import`;
  console.log('📤 Subiendo archivo a:', fullURL);
  console.log('📤 Archivo:', file.name, 'Tamaño:', file.size, 'bytes');
  
  // NO establecer Content-Type manualmente - axios lo hace automáticamente con el boundary correcto
  const res = await api.post('/api/catalogs/norma-minsal/import', fd);
  return res.data; // El backend devuelve { success, summary: { total, valid, errors }, grds, errorDetails }
}

/**
 * Sube el catálogo de Ajustes por Tecnología (AT)
 */
export async function uploadATCatalog(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post('/api/catalogs/at/import', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/**
 * Sube el catálogo de Precios Base por GRD
 */
export async function uploadPreciosBase(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post('/api/catalogs/precios-base/import', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/**
 * Obtiene catálogo AT vigente (GET)
 */
export async function getCatalogAT() {
  const res = await api.get('/api/catalogs/at', { params: { version: 'latest' } });
  return res.data.items;
}

/**
 * Obtiene catálogo de precios base vigente (GET)
 */
export async function getCatalogPreciosBase() {
  const res = await api.get('/api/catalogs/precios-base', { params: { version: 'latest' } });
  return res.data.items;
}

/**
 * Obtiene la versión vigente de la Norma MINSAL
 */
export async function getNormaMinsal() {
  const res = await api.get('/api/catalogs/norma-minsal', {
    params: { version: 'latest' },
  });
  // El backend devuelve { version, totalRecords, lastUpdated, status }
  // Retornamos un array vacío por compatibilidad, o podemos ajustar el componente para usar totalRecords
  return res.data.totalRecords ? Array(res.data.totalRecords).fill(null) : [];
}
