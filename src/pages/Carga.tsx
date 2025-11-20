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
                  <th className="text-left p-2 border-b font-semibold">#</th>
                  {headers.map(h => <th key={h} className="text-left p-2 border-b">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-1 align-top text-slate-600 font-medium">{idx + 1}</td>
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
            Subir
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

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
    
    if (f) {
      // Validar formato de archivo
      const allowedTypes = [
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'text/csv' // .csv
      ];
      
      const allowedExtensions = ['.xls', '.xlsx', '.csv'];
      const fileExtension = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(f.type) && !allowedExtensions.includes(fileExtension)) {
        setError('Solo se permiten archivos .xls, .xlsx o .csv');
        setFile(null);
        return;
      }
      
      // Validar tamaño del archivo (máximo 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (f.size > maxSize) {
        setError('El archivo es demasiado grande. Máximo 50MB');
        setFile(null);
        return;
      }
      
      setStatus(`Archivo seleccionado: ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  }

  // === Pre-validación: muestra solo columnas necesarias, pero guarda dataset completo ===
  async function startPrecheck() {
    if (!file) return;
    
    setLoading(true);
    setError('');
    setStatus('Validando archivo...');
    
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rowsRaw = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

      if (!rowsRaw.length) {
        setError('El archivo está vacío.');
        setLoading(false);
        return;
      }

      // Validar columnas requeridas
      const fileHeaders = Object.keys(rowsRaw[0]);
      const normalizedFileHeaders = fileHeaders.map(h => normalizeHeader(h));
      
      const missingHeaders = REQUIRED_HEADERS.filter(required => 
        !normalizedFileHeaders.some(fileHeader => 
          fileHeader.toLowerCase().includes(required.toLowerCase()) ||
          required.toLowerCase().includes(fileHeader.toLowerCase())
        )
      );
      
      if (missingHeaders.length > 0) {
        setError(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
        setLoading(false);
        return;
      }
      
      setStatus(`Archivo válido. Encontradas ${rowsRaw.length} filas con ${fileHeaders.length} columnas.`);

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
    
    // Agregar "Convenio" si está presente en el archivo (aunque no sea requerida)
    // Insertarlo después de "Nombre" (orden: RUT, Nombre, Convenio)
    // Buscar variaciones: "Convenios (cod)", "Convenio", "Convenios", etc.
    const convenioHeader = _rawHeaders.find(h => {
      const normalized = h.toLowerCase().trim();
      return normalized.includes('convenio') || normalized.includes('convenios');
    });
    
    let allHeadersForView = headersForView;
    if (convenioHeader && !headersForView.includes(convenioHeader)) {
      // Buscar la posición de "Nombre" en headersForView
      const nombreIndexInView = headersForView.indexOf('Nombre');
      if (nombreIndexInView >= 0) {
        // Insertar "Convenio" después de "Nombre"
        allHeadersForView = [
          ...headersForView.slice(0, nombreIndexInView + 1),
          convenioHeader,
          ...headersForView.slice(nombreIndexInView + 1)
        ];
      } else {
        // Si no se encuentra Nombre en la vista, agregar al final
        allHeadersForView = [...headersForView, convenioHeader];
      }
    }
    
    const rowsForView = _rawRows.map(r => {
      const o: any = {};
      REQUIRED_HEADERS.forEach(h => { o[h] = r[h] ?? ''; });
      // Agregar Convenio si existe
      if (convenioHeader) {
        o[convenioHeader] = r[convenioHeader] ?? '';
      }
      return o;
    });

    // Guarda estado
    setRawHeaders(_rawHeaders);
    setRawRows(_rawRows);
    setViewHeaders(allHeadersForView);
    setViewRows(rowsForView);
    setOpenPrecheck(true);
    
    } catch (e: any) {
      setError(`Error al procesar el archivo: ${e.message}`);
      setLoading(false);
    }
  }

  // Convierte filas corregidas (SOLO necesarias) a cambios en el dataset COMPLETO y sube
  async function uploadFixedRows(editedViewRows: any[]) {
    // Buscar el header de Convenio si existe (buscar "Convenios (cod)", "Convenio", etc.)
    const convenioHeader = rawHeaders.find(h => {
      const normalized = h.toLowerCase().trim();
      return normalized.includes('convenio') || normalized.includes('convenios');
    });
    
    console.log('📤 Preparando archivo para subir:', {
      convenioHeader,
      rawHeaders: rawHeaders.slice(0, 10), // Primeras 10 columnas
      primeraFila: editedViewRows[0] ? Object.keys(editedViewRows[0]) : []
    });
    
    // Merge: aplicar cambios de columnas necesarias + Convenio a las filas completas
    const merged = rawRows.map((full, idx) => {
      const v = editedViewRows[idx] ?? {};
      const copy = { ...full };
      REQUIRED_HEADERS.forEach(h => {
        if (h in v) copy[h] = v[h];
      });
      // Preservar cambios de Convenio si existe
      if (convenioHeader && convenioHeader in v) {
        copy[convenioHeader] = v[convenioHeader];
        console.log(`📝 Fila ${idx + 1}: Convenio = "${v[convenioHeader]}"`);
      }
      return copy;
    });

    // Verificar que Convenio esté en los datos antes de serializar
    if (merged.length > 0 && convenioHeader) {
      const primeraFila = merged[0];
      console.log('✅ Verificación antes de serializar:', {
        tieneConvenio: convenioHeader in primeraFila,
        valorConvenio: primeraFila[convenioHeader],
        todasLasColumnas: Object.keys(primeraFila)
      });
    }

    // Serializar TODO el dataset (completo) y enviar
    // Asegurar que todas las columnas estén presentes, incluyendo convenio
    const allHeaders = rawHeaders.length > 0 ? [...rawHeaders] : Object.keys(merged[0] || {});
    
    // Verificar que convenio esté en los headers antes de serializar
    if (convenioHeader && !allHeaders.includes(convenioHeader)) {
      allHeaders.push(convenioHeader);
      console.log(`⚠️ Convenio header no estaba en rawHeaders, agregado: "${convenioHeader}"`);
    }
    
    // Asegurar que todas las filas tengan todas las columnas
    const mergedWithAllHeaders = merged.map(row => {
      const completeRow: any = {};
      allHeaders.forEach(header => {
        completeRow[header] = row[header] ?? '';
      });
      return completeRow;
    });
    
    const ws = XLSX.utils.json_to_sheet(mergedWithAllHeaders, { header: allHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SIGESA_FULL');
    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const fixedFile = new File(
      [out],
      file ? `FIXED_${file.name.replace(/\.[^.]+$/, '')}.xlsx` : 'fixed.xlsx',
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );
    
    // Log final para verificar
    if (mergedWithAllHeaders.length > 0 && convenioHeader) {
      console.log('📤 Archivo serializado - Verificación final:', {
        convenioHeader,
        valorEnPrimeraFila: mergedWithAllHeaders[0][convenioHeader],
        todasLasColumnas: Object.keys(mergedWithAllHeaders[0]).filter(k => k.toLowerCase().includes('convenio'))
      });
    }

    await uploadToBackend(fixedFile);
    setOpenPrecheck(false);
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
    setUploadProgress(0);
    setCurrentStep('Preparando archivo...');

    try {
      // Simular progreso de validación
      setUploadProgress(10);
      setCurrentStep('Validando estructura...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadProgress(30);
      setCurrentStep('Enviando al servidor...');
      
      const res = await importEpisodes(theFile, { 
        replace: hasPrevious
      });

      setUploadProgress(70);
      setCurrentStep('Procesando datos...');

      if ('summary' in res) {
        setUploadProgress(100);
        setCurrentStep('Completado');
        apply(res, hasPrevious);
      } else {
        setStatus('Procesando en servidor...');
        setCurrentStep('Procesando en segundo plano...');
        const done = await pollImport(res.jobId);
        setUploadProgress(100);
        setCurrentStep('Completado');
        apply(done, hasPrevious);
      }
    } catch (e: any) {
      setError(e.message ?? 'Error al procesar el archivo');
      setStatus('');
      setUploadProgress(0);
      setCurrentStep('');
    } finally {
      setLoading(false);
    }
  }

  function apply(r: ImportSyncResponse, wasReplace: boolean) {
    setLastImport(r.summary);
    setEpisodios(r.episodes);
    
    // Log para debug: verificar que convenio esté en los episodios
    if (r.episodes.length > 0) {
      console.log('📥 Episodios recibidos después de importar:', {
        total: r.episodes.length,
        primerEpisodio: {
          episodio: r.episodes[0].episodio,
          convenio: (r.episodes[0] as any).convenio,
          tieneConvenio: 'convenio' in (r.episodes[0] as any),
          todasLasKeys: Object.keys(r.episodes[0])
        }
      });
    }
    
    const msg =
      `Validado: ${r.summary.valid}/${r.summary.total}` +
      (r.summary.errors ? ` (errores: ${r.summary.errors})` : '');
    setStatus((wasReplace ? 'Reemplazo OK. ' : 'Carga OK. ') + msg);
    setHasPrevious(true);
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Botón volver al dashboard */}
      <div className='mb-6'>
        <Link to='/dashboard' className='text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-300/80 shadow-sm transition-all duration-300 inline-block'>← Volver al Dashboard</Link>
      </div>

      {/* Div 1: Header */}
      <div className='mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5'>
        <h1 className='text-3xl font-open-sauce font-light bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent'>Carga de archivo maestro</h1>
        <p className='text-slate-600 mt-2'>Sube el archivo maestro y realiza una pre-validación antes de enviar al servidor.</p>
      </div>

      {/* Div 2: Proceso de carga */}
      <div className='mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-6'>
        <h3 className="text-base font-open-sauce font-medium text-amber-900 mb-3">Proceso de carga</h3>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">1. <strong>Selecciona</strong> tu archivo maestro (.xls, .xlsx, .csv)</div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">2. <strong>Previsualiza</strong> y corrige los datos si es necesario</div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">3. <strong>Confirma</strong> para subir el archivo corregido</div>
        </div>
      </div>

      {/* Div 3: Columnas requeridas */}
      <div className='mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-6'>
        <h3 className="text-base font-open-sauce font-medium text-blue-900 mb-3">Columnas requeridas</h3>
        <div className="grid md:grid-cols-2 gap-2 text-sm text-blue-800">
          <div className="space-y-1">
            <p>• N° episodio (Episodio CMBD)</p>
            <p>• GRD (IR GRD - Código)</p>
            <p>• Diagnóstico principal</p>
            <p>• Procedimiento principal</p>
          </div>
          <div className="space-y-1">
            <p>• Fecha de ingreso</p>
            <p>• Fecha de alta</p>
            <p>• Peso medio [Norma IR]</p>
            <p>• Estancia real del episodio</p>
          </div>
        </div>
      </div>

      {/* Div 4: Seleccionar archivo y acciones */}
      <div className='mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-6'>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Selección de archivo */}
          <div className='md:col-span-2'>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar archivo maestro</label>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="mt-1 text-xs text-gray-500">Formatos: .xls, .xlsx, .csv (máximo 50MB)</p>
          </div>

          {/* Acción principal */}
          <div className='flex items-end'>
            <button
              onClick={startPrecheck}
              className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!file || loading}
            >
              {loading ? 'Validando...' : 'Previsualizar y Corregir'}
            </button>
          </div>
        </div>

        {/* Estado actual */}
        {(status || error) && (
          <div className='mt-4 grid md:grid-cols-2 gap-4'>
            {status && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {status} • <Link className="text-indigo-600 underline" to="/episodios">Ver episodios</Link>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
          </div>
        )}

        {/* Barra de progreso */}
        {loading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{currentStep}</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Nota */}
      <div className='text-xs text-slate-500'>El archivo se valida y normaliza en el servidor. Acepta .xlsx/.xls/.csv.</div>

      {/* Modal de pre-check */}
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