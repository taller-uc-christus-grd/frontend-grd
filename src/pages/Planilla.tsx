import { useMemo, useState } from 'react';
import { useEpisodes } from '@/hooks/useEpisodes';
import { FINAL_COLUMNS } from '@/lib/planillaConfig';
import { exportToExcel, exportToCSV } from '@/lib/exporters';
import { isReady } from '@/lib/calcs';
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

    // NOTA: Ya no calculamos valores derivados aquí.
    // Los cálculos los realiza el backend o se ingresan manualmente por Finanzas.
    // Solo actualizamos el estado de completitud para exportación.
    clone.completeness = isReady(clone) ? 'ready' : 'incompleto';
    upsertEpisode(clone);
  }

  const canEdit = (key: string) => FINAL_COLUMNS.find(c => c[1] === key)?.[2] === true;

  return (
    <main className="main-container">
      <header className="mb-8">
        <h1 className="title-primary">Planilla Final</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Gestión y edición de la planilla final para exportación a FONASA
        </p>
      </header>

      {/* Controles de filtrado y exportación */}
      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <input 
              className="form-input" 
              placeholder="Buscar episodio o nombre…" 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
            />
          </div>
          
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={onlyOutliers} 
              onChange={e=>setOnlyOutliers(e.target.checked)}
              className="rounded"
            />
            Solo Outliers
          </label>
          
          <div className="flex gap-3">
            <button 
              className="btn-secondary" 
              onClick={()=>exportToCSV(list)}
            >
              Exportar CSV
            </button>
            <button 
              className="btn-accent btn-blue" 
              onClick={()=>exportToExcel(list)}
            >
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de episodios en estilo Landing */}
      <div className="grid gap-6">
        {list.map(ep => (
          <div className="card-elevated p-6 border-l-4" style={{ borderLeftColor: 'var(--primary-blue)' }}>
          {/* Header del episodio */}
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary-blue)] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📋</span>
                </div>
                <div>
                  <h3 className="title-secondary">Episodio #{ep.episodio}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {ep.nombre} • {ep.rut}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {ep.validado ? (
                  <span className="badge-success flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    Validado
                  </span>
                ) : (
                  <span className="badge-warning flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    Pendiente
                  </span>
                )}
                {ep.inlierOutlier === 'Outlier' && (
                  <span className="badge-error flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    Outlier
                  </span>
                )}
              </div>
            </div>

            {/* Grid de campos */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Información del paciente */}
              <div className="space-y-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(91, 139, 255, 0.05)' }}>
                <h4 className="font-medium text-[var(--primary-blue)] mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary-blue)' }}></div>
                  Información del Paciente
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="form-label">Centro</label>
                    {canEdit('centro') ? (
                      <input 
                        className="form-input" 
                        value={ep.centro ?? ''} 
                        onChange={e=>setField(ep, 'centro', e.target.value)} 
                      />
                    ) : (
                      <p className="text-[var(--text-secondary)]">{ep.centro ?? '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">N° Folio</label>
                    {canEdit('folio') ? (
                      <input 
                        className="form-input" 
                        value={ep.folio ?? ''} 
                        onChange={e=>setField(ep, 'folio', e.target.value)} 
                      />
                    ) : (
                      <p className="text-[var(--text-secondary)]">{ep.folio ?? '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Tipo Episodio</label>
                    {canEdit('tipoEpisodio') ? (
                      <select 
                        className="form-input" 
                        value={ep.tipoEpisodio ?? ''} 
                        onChange={e=>setField(ep, 'tipoEpisodio', e.target.value || null)}
                      >
                        <option value="">—</option>
                        <option>Hospitalario</option>
                        <option>Ambulatorio</option>
                      </select>
                    ) : (
                      <p className="text-[var(--text-secondary)]">{ep.tipoEpisodio ?? '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información GRD */}
              <div className="space-y-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(155, 121, 255, 0.05)' }}>
                <h4 className="font-medium text-[var(--primary-purple)] mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary-purple)' }}></div>
                  Información GRD
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="form-label">IR GRD</label>
                    <p className="text-[var(--text-secondary)]">{ep.grdCodigo ?? '—'}</p>
                  </div>

                  <div>
                    <label className="form-label">Peso GRD</label>
                    <p className="text-[var(--text-secondary)]">{ep.peso ?? '—'}</p>
                  </div>

                  <div>
                    <label className="form-label">Estado RN</label>
                    {canEdit('estadoRN') ? (
                      <select 
                        className="form-input" 
                        value={ep.estadoRN ?? ''} 
                        onChange={e=>setField(ep, 'estadoRN', e.target.value || null)}
                      >
                        <option value="">—</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Rechazado">Rechazado</option>
                      </select>
                    ) : (
                      <p className="text-[var(--text-secondary)]">{ep.estadoRN ?? '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información financiera */}
              <div className="space-y-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(197, 123, 255, 0.05)' }}>
                <h4 className="font-medium text-[var(--primary-purple-light)] mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary-purple-light)' }}></div>
                  Información Financiera
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="form-label">AT (S/N)</label>
                    {canEdit('at') ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={Boolean(ep.at)} 
                          onChange={e=>setField(ep, 'at', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-[var(--text-secondary)]">
                          {ep.at ? 'Sí' : 'No'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[var(--text-secondary)]">{ep.at ? 'Sí' : 'No'}</p>
                    )}
                  </div>

                  {ep.at && (
                    <div>
                      <label className="form-label">AT Detalle</label>
                      {canEdit('atDetalle') ? (
                        <input 
                          className="form-input" 
                          value={ep.atDetalle ?? ''} 
                          onChange={e=>setField(ep, 'atDetalle', e.target.value)} 
                          placeholder="código/desc AT" 
                        />
                      ) : (
                        <p className="text-[var(--text-secondary)]">{ep.atDetalle ?? '—'}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="form-label">Días Demora Rescate</label>
                    {canEdit('diasDemoraRescate') ? (
                      <input 
                        className="form-input" 
                        type="number" 
                        value={ep.diasDemoraRescate ?? ''} 
                        onChange={e=>setField(ep, 'diasDemoraRescate', e.target.value === '' ? undefined : Number(e.target.value))} 
                      />
                    ) : (
                      <p className="text-[var(--text-secondary)]">{ep.diasDemoraRescate ?? '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Monto Final</label>
                    <p className="text-lg font-semibold text-[var(--primary-blue)]">
                      ${ep.montoFinal?.toLocaleString() ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentación */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="font-medium text-[var(--admin-gray)] mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--admin-gray)' }}></div>
                Documentación
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                {['epicrisis', 'protocolo', 'certDefuncion'].map(doc => (
                  <div key={doc} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={Boolean(ep.docs?.[doc as keyof typeof ep.docs])} 
                      onChange={e=>setField(ep, `docs.${doc}`, e.target.checked)}
                      className="rounded"
                    />
                    <label className="text-sm text-[var(--text-secondary)] capitalize">
                      {doc.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 mt-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[var(--primary-blue)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
              Información sobre campos editables
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <span className="font-medium text-[var(--primary-blue)]">Campos editables:</span> Centro, N° Folio, TIPO EPISODIO, ESTADO RN, AT/AT detalle, Días demora rescate, Precio Base, EPICRISIS/PROTOCOLO/CERT. DEFUNCION. <span className="text-purple-600 font-medium">VALIDADO (solo Gestión)</span>.
              <br />
              <span className="text-[var(--text-muted)]">Los demás se calculan o provienen del extracto SIGESA.</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
