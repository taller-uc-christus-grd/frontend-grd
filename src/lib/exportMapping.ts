import type { Episode } from '@/types';
import { FINAL_COLUMNS } from './planillaConfig';

export function buildExportRows(list: Episode[]) {
  return list.map(ep => {
    const row: Record<string, any> = {};
    for (const [header, key] of FINAL_COLUMNS) {
      // soporta nested keys tipo 'docs.epicrisis'
      const value = key.split('.').reduce((acc: any, k) => acc?.[k], ep as any);
      row[header] = value ?? '';
    }
    return row;
  });
}
