// src/components/PrecheckDialog.tsx
import { useMemo, useState } from 'react';
import type { PrecheckResult, PrecheckIssue } from '@/lib/precheck';
import { applyCellEdit, validateRows } from '@/lib/precheck';

export default function PrecheckDialog({
  open,
  onClose,
  result,
  onConfirm, // devuelve rows corregidas
}: {
  open: boolean;
  onClose: () => void;
  result: PrecheckResult | null;
  onConfirm: (fixedRows: any[]) => void;
}) {
  const [rows, setRows] = useState<any[]>(() => result?.rows ?? []);
  const headers = result?.headers ?? [];

  // Recalcula issues cada vez que el usuario edita algo
  const issues = useMemo<PrecheckIssue[]>(() => validateRows(headers, rows), [headers, rows]);
  const hasCritical = issues.some(i => i.type === 'missing_header');
  const canUpload = issues.length === 0 && rows.length > 0;

  // Cuando cambia "result" desde el padre (nuevo archivo)
  // sincronizamos el estado local
  // (opcional: usa useEffect si quieres)
  if (open && result && rows !== result.rows && rows.length === 0) {
    setRows(result.rows);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[95vw] max-w-6xl max-h-[85vh] overflow-hidden shadow-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pre-validación del archivo</h2>
          <button className="text-slate-600 hover:text-black" onClick={onClose}>✕</button>
        </div>

        <div className="p-4 grid md:grid-cols-3 gap-4">
          {/* Panel de issues */}
          <div className="md:col-span-1">
            <h3 className="font-medium mb-2">Validaciones</h3>
            {issues.length === 0 ? (
              <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded text-sm">
                Sin observaciones. Puedes subir al backend.
              </div>
            ) : (
              <ul className="space-y-1 text-sm">
                {issues.map((it, i) => (
                  <li key={i} className={`p-2 rounded border ${
                    it.type === 'missing_header' ? 'border-rose-200 bg-rose-50 text-rose-700' :
                    it.type === 'duplicate' ? 'border-amber-200 bg-amber-50 text-amber-800' :
                    it.type === 'empty' ? 'border-amber-200 bg-amber-50 text-amber-800' :
                    'border-indigo-200 bg-indigo-50 text-indigo-700'
                  }`}>
                    {it.message}
                    {typeof it.rowIndex === 'number' && <span> (fila {it.rowIndex + 2})</span>}
                    {it.column && <span> — {it.column}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tabla editable */}
          <div className="md:col-span-2 overflow-auto border rounded">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-100">
                <tr>
                  {headers.map(h => <th key={h} className="text-left p-2 border-b">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    {headers.map(h => {
                      const cellIssue = issues.find(x => x.rowIndex === idx && x.column === h);
                      const bad = !!cellIssue && (cellIssue.type === 'empty' || cellIssue.type === 'invalid' || cellIssue.type === 'duplicate');
                      return (
                        <td key={h} className={`p-1 align-top ${bad ? 'bg-amber-50' : ''}`}>
                          <input
                            className="w-full border rounded px-1 py-0.5"
                            value={r[h] ?? ''}
                            onChange={e => setRows(applyCellEdit(rows, idx, h, e.target.value))}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 rounded border" onClick={onClose}>Cancelar</button>
          <button
            className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
            disabled={hasCritical || !canUpload}
            onClick={() => onConfirm(rows)}
            title={hasCritical ? 'Faltan columnas requeridas' : (!canUpload ? 'Corrige las observaciones' : 'Subir al backend')}
          >
            Subir al backend
          </button>
        </div>
      </div>
    </div>
  );
}
