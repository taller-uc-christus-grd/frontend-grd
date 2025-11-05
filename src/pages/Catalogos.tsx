// src/pages/Catalogos.tsx
import { useEffect, useState } from 'react';
import {
  uploadNormaMinsal,
  getNormaMinsal,
} from '@/services/catalogs';

type UploadState = { loading: boolean; ok?: boolean; msg?: string };

export default function Catalogos() {
  const [norma, setNorma] = useState<File|null>(null);

  const [sNorma, setSNorma] = useState<UploadState>({ loading:false });

  // Contadores básicos (mostramos cuántas filas/ítems tiene la latest)
  const [normaRows, setNormaRows] = useState<number | null>(null);

  // Cargar "latest" al entrar
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const normaLatest = await getNormaMinsal();
      // getNormaMinsal ahora retorna un array basado en totalRecords
      setNormaRows(Array.isArray(normaLatest) ? normaLatest.length : null);
    } catch (e: any) {
      console.error('Error cargando norma minsal:', e);
      // si algún GET falla, no rompemos la página
    }
  }

  async function onUploadNorma(){
    if(!norma) return;
    if(!/\.(xlsx?|csv)$/i.test(norma.name))
      return setSNorma({ loading:false, ok:false, msg:'Sube XLSX/XLS/CSV' });
    setSNorma({ loading:true });
    try{
      const r = await uploadNormaMinsal(norma);
      // El backend devuelve { success, summary: { total, valid, errors }, grds, errorDetails }
      if (r.success) {
        const validCount = r.summary?.valid ?? 0;
        const errorCount = r.summary?.errors ?? 0;
        const totalCount = r.summary?.total ?? 0;
        setSNorma({ 
          loading:false, 
          ok:true, 
          msg:`✅ Importación exitosa: ${validCount} registros válidos de ${totalCount} total${errorCount > 0 ? ` (${errorCount} errores)` : ''}` 
        });
      } else {
        setSNorma({ loading:false, ok:false, msg:r.error || 'Error al procesar el archivo' });
      }
      await loadAll(); // ← volvemos a pedir la "latest" para reflejar cambios
    }catch(e:any){
      const errorMsg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al subir norma';
      setSNorma({ loading:false, ok:false, msg:errorMsg });
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Botón volver al dashboard */}
      <div className='mb-6'>
        <a href='/dashboard' className='text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-300/80 shadow-sm transition-all duration-300 inline-block'>← Volver al Dashboard</a>
      </div>

      {/* Header */}
      <div className='mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5'>
        <h1 className='text-3xl font-open-sauce font-light bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent'>Norma MINSAL</h1>
        <p className='text-slate-600 mt-2'>Gestiona el catálogo oficial de la Norma MINSAL para el sistema GRD.</p>
      </div>

      {/* Tarjeta de Norma MINSAL */}
      <div className="grid grid-cols-1 gap-6">
        {/* Norma MINSAL */}
        <div className="card-interactive bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          

          <div className="space-y-4">
            <div>
              <label className="block text-base md:text-lg font-medium text-gray-700 mb-2">
                Seleccionar archivo Excel
              </label>
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={e=>setNorma(e.target.files?.[0]||null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>

            <button
              onClick={onUploadNorma}
              className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              disabled={!norma || sNorma.loading}
            >
              {sNorma.loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Subiendo...
                </div>
              ) : (
                'Subir Norma MINSAL'
              )}
            </button>

            {sNorma.msg && (
              <div className={`p-3 rounded-lg text-sm ${
                sNorma.ok 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {sNorma.msg}
              </div>
            )}

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Columnas esperadas:</strong> GRD, Tipo GRD, GRAVEDAD, Total Altas, Total Est, Est Media, Altas Depu, Total Est D, N Outliers, Exitus, Percentil 25, Percentil 75, Punto Corte, Peso Total, etc.
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-purple-600 text-sm">ℹ️</span>
          </div>
          <div>
            <h3 className="font-medium text-purple-900 mb-2">Información importante</h3>
            <ul className="text-sm text-purple-800 space-y-2">
              <li>• Los archivos deben estar en formato Excel (.xlsx, .xls) o CSV</li>
              <li>• Las columnas deben coincidir exactamente con el formato especificado</li>
              <li>• Los datos se validarán automáticamente al subir</li>
              <li>• La norma actualizada se aplicará inmediatamente al sistema</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
