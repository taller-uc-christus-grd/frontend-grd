import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useEpisodes } from '@/hooks/useEpisodes';
import {
  importEpisodes,
  pollImport,
  getEpisodesMeta,
  type ImportSyncResponse,
} from '@/services/importEpisodes';
import {
  REQUIRED_HEADERS,
  normalizeHeader,
  validateRows,
  applyCellEdit,
  type PrecheckIssue,
} from '@/lib/precheck';

// Números que validamos en precheck (campos de la vista)
const NUMERIC_HEADERS = new Set<string>([
  'Peso Medio [Norma IR]',
  'Estancia real del episodio',
]);

function toNumberLoose(v: any) {
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim();
  if (!s) return NaN;
  const norm = s
    .replace(/\s/g, '')
    .replace(/(?<=\d)[.](?=\d{3}\b)/g, '') // quita separadores de miles puntuales
    .replace(/,(?=\d{2,})/g, '.')          // coma decimal a punto
    .replace(/(?<=\d)\.(?=\d{3}\b)/g, ''); // punto de miles en algunos casos
  const n = Number(norm);
  return Number.isFinite(n) ? n : NaN;
}

/* ================= Modal simple de previsualización/edición ================== */
function PrecheckDialog({
  open,
  headers,
  rows,
  onClose,
  onConfirm,
}: {
  open: boolean;
  headers: string[];     // SOLO necesarias (para la tabla)
  rows: any[];           // SOLO necesarias (datos editables en el modal)
  onClose: () => void;
  onConfirm: (fixedRows: any[]) => void; // devuelve SOLO necesarias editadas
}) {
  const [viewRows, setViewRows] = useState<any[]>(rows);
  const [issues, setIssues] = useState<PrecheckIssue[]>([]);
  const [limit, setLimit] = useState(200);

  // Cuando abre o cambian las filas de entrada, resetea vista
  useEffect(() => {
    if (open) setViewRows(rows);
  }, [open, rows]);

  // Debounce de validaciones (recalcula tras editar)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setIssues(validateRows(headers, viewRows));
    }, 220);
    return () => clearTimeout(t);
  }, [open, headers, viewRows]);

  const visibleRows = useMemo(() => viewRows.slice(0, limit), [viewRows, limit]);
  const hasCritical = issues.some(i => i.type === 'missing_header');
  const canUpload = issues.length === 0 && viewRows.length > 0;

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[95vw] max-w-6xl max-h-[85vh] overflow-hidden shadow-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pre-validación del archivo</h2>
          <button className="text-slate-600 hover:text-black" onClick={onClose}>✕</button>
        </div>

        <div className="p-4 grid md:grid-cols-3 gap-4 max-h-[65vh] overflow-y-auto">
          {/* Issues */}
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
                    it.type === 'duplicate' || it.type === 'empty' ? 'border-amber-200 bg-amber-50 text-amber-800' :
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

          {/* Tabla solo con columnas necesarias (formato uniforme para todas) */}
          <div className="md:col-span-2 overflow-auto border rounded max-h-[55vh]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-100">
                <tr>
                  {headers.map(h => <th key={h} className="text-left p-2 border-b">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    {headers.map(h => {
                      const absIndex = idx; // coincide con slice
                      const onBlur = (val: string) => {
                        const value = NUMERIC_HEADERS.has(h)
                          ? (() => {
                              const n = toNumberLoose(val);
                              return Number.isNaN(n) ? val : String(n);
                            })()
                          : val;
                        setViewRows(prev => applyCellEdit(prev, absIndex, h, value));
                      };
                      // marcar celdas con issue
                      const cellIssue = issues.find(x => x.rowIndex === absIndex && x.column === h);
                      const bad = !!cellIssue && (cellIssue.type === 'empty' || cellIssue.type === 'invalid' || cellIssue.type === 'duplicate');

                      return (
                        <td key={h} className={`p-1 align-top ${bad ? 'bg-amber-50' : ''}`}>
                          <input
                            className="w-full border rounded px-1 py-1"
                            defaultValue={r[h] ?? ''}
                            onBlur={e => onBlur(e.target.value)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between p-2 text-xs text-slate-600">
              <span>Mostrando {visibleRows.length} de {viewRows.length} filas</span>
              {viewRows.length > limit ? (
                <button className="px-2 py-1 rounded border" onClick={()=> setLimit(viewRows.length)}>
                  Ver todas (puede ser lento)
                </button>
              ) : viewRows.length > 200 ? (
                <button className="px-2 py-1 rounded border" onClick={()=> setLimit(200)}>
                  Ver solo 200
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 rounded border" onClick={onClose}>Cancelar</button>
          <button
            className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
            disabled={hasCritical || !canUpload}
            onClick={() => onConfirm(viewRows)}
            title={hasCritical ? 'Faltan columnas requeridas' : (!canUpload ? 'Corrige las observaciones' : 'Subir al backend')}
          >
            Subir al backend
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ Página Carga ============================ */
export default function Carga() {
  const { setEpisodios, setLastImport, lastImport } = useEpisodes();

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Saber si ya existe una carga previa para mostrar "Reemplazar" y pedir confirmación
  const [hasPrevious, setHasPrevious] = useState(false);

  // Estado del precheck (vista + dataset completo)
  const [openPrecheck, setOpenPrecheck] = useState(false);
  const [viewHeaders, setViewHeaders] = useState<string[]>([]);
  const [viewRows, setViewRows] = useState<any[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);

  useEffect(() => {
    getEpisodesMeta()
      .then((m) => setHasPrevious((m?.count ?? 0) > 0))
      .catch(() => setHasPrevious(false));
  }, []);

  function onPickFile(f: File | null) {
    setFile(f);
    setError('');
    setStatus('');
  }

  // === Pre-validación: muestra solo columnas necesarias, pero guarda dataset completo ===
  async function startPrecheck() {
    if (!file) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rowsRaw = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

    if (!rowsRaw.length) {
      setError('El archivo está vacío.');
      return;
    }

    // Normaliza headers y filas (dataset completo)
    const _rawHeaders = Object.keys(rowsRaw[0]).map(h => normalizeHeader(h));
    const _rawRows = rowsRaw.map(r => {
      const o: any = {};
      Object.entries(r).forEach(([k, v]) => (o[normalizeHeader(k)] = v));
      return o;
    });

    // Proyección SOLO a necesarias para la vista/edición
    const present = new Set(_rawHeaders);
    const headersForView = REQUIRED_HEADERS.filter(h => present.has(h));
    const rowsForView = _rawRows.map(r => {
      const o: any = {};
      REQUIRED_HEADERS.forEach(h => { o[h] = r[h] ?? ''; });
      return o;
    });

    // Guarda estado
    setRawHeaders(_rawHeaders);
    setRawRows(_rawRows);
    setViewHeaders(REQUIRED_HEADERS.slice());
    setViewRows(rowsForView);
    setOpenPrecheck(true);
  }

  // Convierte filas corregidas (SOLO necesarias) a cambios en el dataset COMPLETO y sube
  async function uploadFixedRows(editedViewRows: any[]) {
    // Merge: aplicar cambios de columnas necesarias a las filas completas
    const merged = rawRows.map((full, idx) => {
      const v = editedViewRows[idx] ?? {};
      const copy = { ...full };
      REQUIRED_HEADERS.forEach(h => {
        if (h in v) copy[h] = v[h];
      });
      return copy;
    });

    // Serializar TODO el dataset (completo) y enviar
    const ws = XLSX.utils.json_to_sheet(merged, { header: rawHeaders.length ? rawHeaders : undefined });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SIGESA_FULL');
    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const fixedFile = new File(
      [out],
      file ? `FIXED_${file.name.replace(/\.[^.]+$/, '')}.xlsx` : 'fixed.xlsx',
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    await uploadToBackend(fixedFile);
    setOpenPrecheck(false);
  }

  // === Subir directo (sin precheck) ===
  async function upload() {
    if (!file) return;
    await uploadToBackend(file);
  }

  async function uploadToBackend(theFile: File) {
    if (hasPrevious) {
      const ok = window.confirm(
        'Ya existe una carga previa.\n' +
        'Esto REEMPLAZARÁ los episodios actuales.\n\n' +
        '¿Deseas continuar?'
      );
      if (!ok) return;
    }

    setError('');
    setStatus(hasPrevious ? 'Reemplazando...' : 'Subiendo...');
    setLoading(true);

    try {
      const res = await importEpisodes(theFile, { replace: hasPrevious });

      if ('summary' in res) {
        apply(res, hasPrevious);
      } else {
        setStatus('Procesando en servidor...');
        const done = await pollImport(res.jobId);
        apply(done, hasPrevious);
      }
    } catch (e: any) {
      setError(e.message ?? 'Error al procesar el archivo');
      setStatus('');
    } finally {
      setLoading(false);
    }
  }

  function apply(r: ImportSyncResponse, wasReplace: boolean) {
    setLastImport(r.summary);
    setEpisodios(r.episodes);
    const msg =
      `Validado: ${r.summary.valid}/${r.summary.total}` +
      (r.summary.errors ? ` (errores: ${r.summary.errors})` : '');
    setStatus((wasReplace ? 'Reemplazo OK. ' : 'Carga OK. ') + msg);
    setHasPrevious(true);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold">Carga de archivo maestro</h1>

      <div className="bg-white rounded-xl p-6 border mt-4 space-y-3">
        <input
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={(e) => onPickFile(e.target.files?.[0] || null)}
          disabled={loading}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={startPrecheck}
            className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-60"
            disabled={!file || loading}
          >
            Previsualizar
          </button>

          <button
            onClick={upload}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-60"
            disabled={!file || loading}
            title={hasPrevious ? 'Sobrescribe la carga anterior' : 'Sube una nueva carga'}
          >
            {loading ? 'Procesando...' : hasPrevious ? 'Reemplazar archivo' : 'Subir'}
          </button>
        </div>

        {status && (
          <p className="mt-3 text-sm text-slate-700">
            {status} •{' '}
            <Link className="text-indigo-600 underline" to="/episodios">
              Ver episodios
            </Link>
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {lastImport?.missingHeaders?.length ? (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
            Faltan columnas: {lastImport.missingHeaders.join(', ')}
          </div>
        ) : null}

        <p className="text-xs text-slate-500">
          El archivo se valida y normaliza en el servidor. Acepta .xlsx/.xls/.csv.
        </p>
      </div>

      {/* Modal de pre-check: muestra solo necesarias, pero sube TODO el dataset con correcciones */}
      <PrecheckDialog
        open={openPrecheck}
        headers={viewHeaders}
        rows={viewRows}
        onClose={() => setOpenPrecheck(false)}
        onConfirm={uploadFixedRows}
      />
    </main>
  );
}