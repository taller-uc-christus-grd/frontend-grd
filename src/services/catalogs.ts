// src/services/catalogs.ts
import api from '@/lib/api';

/**
 * Sube archivo Excel de la Norma MINSAL (xlsx/xls/csv).
 */
export async function uploadNormaMinsal(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post('/api/catalogs/norma-minsal/import', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data; // { ok:true, version:n, items:n }
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
  return res.data.items; // o res.data.norma según lo que devuelva el backend
}
