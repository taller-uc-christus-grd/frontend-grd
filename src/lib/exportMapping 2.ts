import type { Episode } from '@/types';
import { FINAL_COLUMNS } from './planillaConfig';

/**
 * Construye las filas para exportación desde los episodios.
 * Los campos son ingresados manualmente por Finanzas o calculados por el backend.
 * Este mapeo solo extrae los valores sin realizar cálculos.
 */
export function buildExportRows(list: Episode[]) {
  return list.map(ep => {
    const row: Record<string, any> = {};
    for (const [header, key] of FINAL_COLUMNS) {
      // Soporta nested keys tipo 'docs.epicrisis'
      const value = key.split('.').reduce((acc: any, k) => acc?.[k], ep as any);
      row[header] = value ?? '';
    }
    return row;
  });
}
