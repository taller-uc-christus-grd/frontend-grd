import { useMemo, useState } from 'react';
import { useEpisodes } from '@/hooks/useEpisodes';
import { FINAL_COLUMNS } from '@/lib/planillaConfig';
import { exportToExcel, exportToCSV } from '@/lib/exporters';
import { computeValores, isReady } from '@/lib/calcs';
import type { Episode } from '@/types';

export default function PlanillaFinal(){
  const { episodios, upsertEpisode } = useEpisodes();
  const [q, setQ] = useState('');
  const [onlyEditable, setOnlyEditable] = useState(false);
  const [onlyOutliers, setOnlyOutliers] = useState(false);

  const list = useMemo(()=>{
    let r = episodios;
    if (q) {
      const s = q.toLowerCase();
      r = r.filter(x => x.episodio.includes(q) || x.nombre?.toLowerCase().includes(s));
    }
    if (onlyOutliers) r = r.filter(x => x.inlierOutlier === 'Outlier');
    // prioridad outliers
    r = [...r].sort((a,b)=> (a.inlierOutlier==='Outlier'? -1:0) - (b.inlierOutlier==='Outlier'? -1:0));
    return r;
  },[episodios,q,onlyOutliers]);

  function setField(ep: Episode, key: string, raw: any) {
    // soporta nested keys: docs.epicrisis
    const clone: any = structuredClone(ep);
    const path = key.split('.');
    let cur = clone;
    for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]] ?? (cur[path[i]] = {});
    cur[path[path.length - 1]] = raw;

    // recalcular derivados
    const preciosTramo = new Map<string, number>(); // Aquí irá tu catálogo real
    const atPrecios = new Map<string, number>();    // Aquí irá tu catálogo real
    const r = computeValores(clone, preciosTramo, atPrecios);
    clone.precioBase = clone.precioBase ?? r.base;
    clone.montoAT = r.at;
    clone.valorGRD = r.valorGRD;
    clone.pagoOutlierSup = r.pagoOutlierSup;
    clone.pagoDemora = r.pagoDemora;
    clone.montoFinal = r.montoFinal;
    clone.completeness = isReady(clone) ? 'ready' : 'incompleto';
    upsertEpisode(clone);
  }

  const canEdit = (key: string) => FINAL_COLUMNS.find(c => c[1] === key)?.[2] === true;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold flex-1">Planilla final</h1>
        <input className="border rounded px-2 py-1" placeholder="Buscar episodio o nombre…" value={q} onChange={e=>setQ(e.target.value)} />
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={onlyOutliers} onChange={e=>setOnlyOutliers(e.target.checked)} />
          Solo Outliers
        </label>
        <button className="px-3 py-2 rounded bg-slate-100 border" onClick={()=>exportToCSV(list)}>Exportar CSV</button>
        <button className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={()=>exportToExcel(list)}>Exportar Excel</button>
      </div>

      <div className="mt-4 bg-white rounded-xl border overflow-auto">
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="bg-slate-100">
            <tr>
              {FINAL_COLUMNS.map(([h]) => <th key={h} className="text-left p-2">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {list.map(ep => (
              <tr key={ep.episodio} className="border-t">
                {FINAL_COLUMNS.map(([header, key]) => {
                  const path = key.split('.');
                  const value = path.reduce((acc: any, k)=>acc?.[k], ep as any);
                  const editable = canEdit(key);

                  // Render por tipo simple (checkbox / select / input / lectura)
                  if (editable && (key === 'validado' || key.startsWith('docs.'))) {
                    const checked = Boolean(value);
                    return <td key={header} className="p-2">
                      <input type="checkbox" checked={checked} onChange={e=>setField(ep, key, e.target.checked)} />
                    </td>;
                  }

                  if (editable && key === 'estadoRN') {
                    return <td key={header} className="p-2">
                      <select className="border rounded px-2 py-1" value={value ?? ''} onChange={e=>setField(ep, key, e.target.value || null)}>
                        <option value="">—</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Rechazado">Rechazado</option>
                      </select>
                    </td>;
                  }

                  if (editable && key === 'tipoEpisodio') {
                    return <td key={header} className="p-2">
                      <select className="border rounded px-2 py-1" value={value ?? ''} onChange={e=>setField(ep, key, e.target.value || null)}>
                        <option value="">—</option>
                        <option>Hospitalario</option>
                        <option>Ambulatorio</option>
                      </select>
                    </td>;
                  }

                  if (editable && (key === 'precioBase' || key === 'diasDemoraRescate')) {
                    return <td key={header} className="p-2">
                      <input className="border rounded px-2 py-1 w-28" type="number" value={value ?? ''} onChange={e=>setField(ep, key, e.target.value === '' ? undefined : Number(e.target.value))} />
                    </td>;
                  }

                  if (editable && key === 'at') {
                    return <td key={header} className="p-2">
                      <input type="checkbox" checked={Boolean(value)} onChange={e=>setField(ep, key, e.target.checked)} />
                    </td>;
                  }

                  if (editable && key === 'atDetalle') {
                    return <td key={header} className="p-2">
                      <input className="border rounded px-2 py-1 w-56" value={value ?? ''} onChange={e=>setField(ep, key, e.target.value)} placeholder="código/desc AT" />
                    </td>;
                  }

                  if (editable && (key === 'centro' || key === 'folio')) {
                    return <td key={header} className="p-2">
                      <input className="border rounded px-2 py-1 w-40" value={value ?? ''} onChange={e=>setField(ep, key, e.target.value)} />
                    </td>;
                  }

                  // Lectura (cálculos y campos de extracto)
                  return <td key={header} className="p-2">{value ?? ''}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 mt-2">
        Campos editables: VALIDADO, Centro, N° Folio, TIPO EPISODIO, ESTADO RN, AT/AT detalle, Días demora rescate, Precio Base, EPICRISIS/PROTOCOLO/CERT. DEFUNCION.
        Los demás se calculan o provienen del extracto SIGESA.
      </p>
    </main>
  );
}
