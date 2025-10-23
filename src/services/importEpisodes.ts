import type { Episode } from '@/types';
import api from '@/lib/api';

export type ImportSummary = {
  total: number;
  valid: number;
  errors: number;
  missingHeaders?: string[];
};

export type ImportSyncResponse = {
  summary: ImportSummary;
  episodes: Episode[];
};

export type ImportAsyncResponse = {
  jobId: string;
};

/**
 * 📤 Subir el archivo al backend
 * Soporta flag opcional { replace: true } para indicar reemplazo explícito.
 */
export async function importEpisodes(
  file: File,
  opts?: { replace?: boolean }
): Promise<ImportSyncResponse | ImportAsyncResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (opts?.replace) formData.append('replace', 'true');

  const res = await api.post('/api/episodes/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => console.log(Math.round((e.loaded * 100) / (e.total ?? 1))),
  });

  if (res.status === 200) {
    return res.data as ImportSyncResponse;
  }
  if (res.status === 202) {
    return { jobId: res.data.jobId as string };
  }
  throw new Error(`Error HTTP ${res.status}`);
}

/**
 * ⏳ Consultar el progreso si el backend procesa en segundo plano
 */
export async function pollImport(jobId: string, { intervalMs = 1500, maxTries = 60 } = {}) {
  for (let i = 0; i < maxTries; i++) {
    const res = await api.get(`/api/episodes/import/${jobId}`);
    if (res.status === 200) return res.data as ImportSyncResponse;
    if (res.status !== 202) throw new Error(`Error HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('El procesamiento tardó demasiado.');
}

/**
 * 🔎 Meta rápida para saber si ya hay una carga previa.
 * Ideal: backend expone /api/episodes/meta -> { count, lastImportedAt }
 * Fallback: intenta obtener 1 fila de la planilla final para inferir existencia.
 */
export async function getEpisodesMeta(): Promise<{ count: number; lastImportedAt?: string }> {
  try {
    const { data } = await api.get('/api/episodes/meta');
    return {
      count: data?.count ?? 0,
      lastImportedAt: data?.lastImportedAt,
    };
  } catch {
    try {
      // Si no existe /meta, intenta listar final y ver si hay algún ítem
      const { data } = await api.get('/api/episodes/final', { params: { page: 1, pageSize: 1 } });
      const items = Array.isArray(data) ? data : data?.items ?? [];
      return { count: Array.isArray(items) ? items.length : 0 };
    } catch {
      return { count: 0 };
    }
  }
}
