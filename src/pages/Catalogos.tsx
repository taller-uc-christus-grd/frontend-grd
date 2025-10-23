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
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold">Catálogos y Norma</h1>
      <p className="text-slate-600 text-sm mt-1">
        Sube los Excel oficiales para Norma MINSAL, AT y Precios Base.
      </p>

      {/* Norma */}
      <section className="mt-6 bg-white rounded-xl border p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">Norma MINSAL (Excel)</h2>
          <small className="text-slate-500">
            Filas vigentes: <b>{normaRows ?? '—'}</b>
          </small>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={e=>setNorma(e.target.files?.[0]||null)} />
          <button
            onClick={onUploadNorma}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-60"
            disabled={!norma || sNorma.loading}
          >
            {sNorma.loading ? 'Subiendo…' : 'Subir Norma'}
          </button>
          {sNorma.msg && <span className={sNorma.ok ? 'text-green-700' : 'text-red-700'}>{sNorma.msg}</span>}
        </div>
        <p className="text-xs text-slate-500 mt-2">Formato esperado: cabeceras limpias y fechas YYYY-MM-DD.</p>
      </section>

      {/* AT */}
      <section className="mt-6 bg-white rounded-xl border p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">Catálogo de Ajustes por Tecnología (AT)</h2>
          <small className="text-slate-500">
            Ítems vigentes: <b>{atItems ?? '—'}</b>
          </small>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={e=>setAT(e.target.files?.[0]||null)} />
          <button
            onClick={onUploadAT}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-60"
            disabled={!at || sAT.loading}
          >
            {sAT.loading ? 'Subiendo…' : 'Subir AT'}
          </button>
          {sAT.msg && <span className={sAT.ok ? 'text-green-700' : 'text-red-700'}>{sAT.msg}</span>}
        </div>
        <p className="text-xs text-slate-500 mt-2">Columnas: codigoAT, descripcion, precio, vigenteDesde, version.</p>
      </section>

      {/* Precios Base */}
      <section className="mt-6 bg-white rounded-xl border p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">Catálogo de Precios Base por GRD</h2>
          <small className="text-slate-500">
            Ítems vigentes: <b>{pbItems ?? '—'}</b>
          </small>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={e=>setPB(e.target.files?.[0]||null)} />
          <button
            onClick={onUploadPB}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-60"
            disabled={!pb || sPB.loading}
          >
            {sPB.loading ? 'Subiendo…' : 'Subir Precios Base'}
          </button>
          {sPB.msg && <span className={sPB.ok ? 'text-green-700' : 'text-red-700'}>{sPB.msg}</span>}
        </div>
        <p className="text-xs text-slate-500 mt-2">Columnas: grdCodigo, tramo, precio, vigenteDesde, version.</p>
      </section>
    </main>
  );
}
