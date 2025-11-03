import * as XLSX from 'xlsx';
import { buildExportRows } from './exportMapping';
import { FINAL_COLUMNS } from './planillaConfig';
import type { Episode } from '@/types';

export function exportToExcel(episodios: Episode[], filename = 'planilla_final.xlsx') {
  const rows = buildExportRows(episodios);
  const ws = XLSX.utils.json_to_sheet(rows, { header: FINAL_COLUMNS.map(c=>c[0]) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Export');
  XLSX.writeFile(wb, filename);
}

export function exportToCSV(episodios: Episode[], filename = 'planilla_final.csv') {
  const rows = buildExportRows(episodios);
  const ws = XLSX.utils.json_to_sheet(rows, { header: FINAL_COLUMNS.map(c=>c[0]) });
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
