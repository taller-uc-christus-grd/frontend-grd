// src/pages/Catalogos.tsx
import { useEffect, useState } from 'react';
import {
  uploadNormaMinsal,
  uploadATCatalog,
  uploadPreciosBase,
  getNormaMinsal,
  getCatalogAT,
  getCatalogPreciosBase,
} from '@/services/catalogs';

type UploadState = { loading: boolean; ok?: boolean; msg?: string };

export default function Catalogos() {
  const [norma, setNorma] = useState<File|null>(null);
  const [at, setAT] = useState<File|null>(null);
  const [pb, setPB] = useState<File|null>(null);

  const [sNorma, setSNorma] = useState<UploadState>({ loading:false });
  const [sAT, setSAT] = useState<UploadState>({ loading:false });
  const [sPB, setSPB] = useState<UploadState>({ loading:false });

  // Contadores básicos (mostramos cuántas filas/ítems tiene la latest)
  const [normaRows, setNormaRows] = useState<number | null>(null);
  const [atItems, setAtItems] = useState<number | null>(null);
  const [pbItems, setPbItems] = useState<number | null>(null);

  // Cargar “latest” al entrar
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [normaLatest, atLatest, pbLatest] = await Promise.all([
        getNormaMinsal(),         // devuelve items (array) según tu service
        getCatalogAT(),           // items (array)
        getCatalogPreciosBase(),  // items (array)
      ]);
      setNormaRows(Array.isArray(normaLatest) ? normaLatest.length : null);
      setAtItems(Array.isArray(atLatest) ? atLatest.length : null);
      setPbItems(Array.isArray(pbLatest) ? pbLatest.length : null);
    } catch {
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
      setSNorma({ loading:false, ok:true, msg:`OK v${r.version ?? '—'} • ${r.items ?? '?'} filas` });
      await loadAll(); // ← volvemos a pedir la “latest” para reflejar cambios
    }catch(e:any){
      setSNorma({ loading:false, ok:false, msg:e?.message || 'Error al subir norma' });
    }
  }

  async function onUploadAT(){
    if(!at) return;
    if(!/\.(xlsx?|csv)$/i.test(at.name))
      return setSAT({ loading:false, ok:false, msg:'Sube XLSX/XLS/CSV' });
    setSAT({ loading:true });
    try{
      const r = await uploadATCatalog(at);
      setSAT({ loading:false, ok:true, msg:`OK v${r.version ?? '—'} • ${r.items ?? '?'} items` });
      await loadAll(); // ← re-consulta latest
    }catch(e:any){
      setSAT({ loading:false, ok:false, msg:e?.message || 'Error al subir AT' });
    }
  }

  async function onUploadPB(){
    if(!pb) return;
    if(!/\.(xlsx?|csv)$/i.test(pb.name))
      return setSPB({ loading:false, ok:false, msg:'Sube XLSX/XLS/CSV' });
    setSPB({ loading:true });
    try{
      const r = await uploadPreciosBase(pb);
      setSPB({ loading:false, ok:true, msg:`OK v${r.version ?? '—'} • ${r.items ?? '?'} items` });
      await loadAll(); // ← re-consulta latest
    }catch(e:any){
      setSPB({ loading:false, ok:false, msg:e?.message || 'Error al subir Precios Base' });
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Catálogos y Norma</h1>
        <p className="text-gray-600 mt-2">
          Gestiona los catálogos oficiales para Norma MINSAL, Ajustes por Tecnología y Precios Base por GRD.
        </p>
      </div>

      {/* Grid de catálogos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Norma MINSAL */}
        <div className="card-interactive bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Norma MINSAL</h2>
                <p className="text-sm text-gray-500">Regulaciones oficiales</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Filas vigentes</div>
              <div className="text-lg font-semibold text-purple-600">
                {normaRows ?? '—'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <strong>Formato esperado:</strong> Cabeceras limpias y fechas en formato YYYY-MM-DD
            </div>
          </div>
        </div>

        {/* Catálogo AT */}
        <div className="card-interactive bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Ajustes por Tecnología</h2>
                <p className="text-sm text-gray-500">Catálogo AT</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Ítems vigentes</div>
              <div className="text-lg font-semibold text-blue-600">
                {atItems ?? '—'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo Excel
              </label>
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={e=>setAT(e.target.files?.[0]||null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            <button
              onClick={onUploadAT}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              disabled={!at || sAT.loading}
            >
              {sAT.loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Subiendo...
                </div>
              ) : (
                'Subir Catálogo AT'
              )}
            </button>
            
            {sAT.msg && (
              <div className={`p-3 rounded-lg text-sm ${
                sAT.ok 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {sAT.msg}
              </div>
            )}
            
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Columnas requeridas:</strong> codigoAT, descripcion, precio, vigenteDesde, version
            </div>
          </div>
        </div>

        {/* Precios Base */}
        <div className="card-interactive bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Precios Base por GRD</h2>
                <p className="text-sm text-gray-500">Tarifas oficiales</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Ítems vigentes</div>
              <div className="text-lg font-semibold text-green-600">
                {pbItems ?? '—'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo Excel
              </label>
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={e=>setPB(e.target.files?.[0]||null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
            
            <button
              onClick={onUploadPB}
              className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              disabled={!pb || sPB.loading}
            >
              {sPB.loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Subiendo...
                </div>
              ) : (
                'Subir Precios Base'
              )}
            </button>
            
            {sPB.msg && (
              <div className={`p-3 rounded-lg text-sm ${
                sPB.ok 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {sPB.msg}
              </div>
            )}
            
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Columnas requeridas:</strong> grdCodigo, tramo, precio, vigenteDesde, version
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-sm">ℹ️</span>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Información importante</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Los archivos deben estar en formato Excel (.xlsx, .xls) o CSV</li>
              <li>• Las columnas deben coincidir exactamente con el formato especificado</li>
              <li>• Los datos se validarán automáticamente al subir</li>
              <li>• Los catálogos actualizados se aplicarán inmediatamente a los cálculos</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
