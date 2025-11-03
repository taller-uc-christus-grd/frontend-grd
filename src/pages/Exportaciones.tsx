import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import type { Episode, Exportacion, FiltroExportacion } from '@/types';
import { FINAL_COLUMNS } from '@/lib/planillaConfig';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function Exportaciones() {
  const { user } = useAuth();
  const [filtros, setFiltros] = useState<Set<FiltroExportacion>>(new Set());
  const [generando, setGenerando] = useState(false);
  const [exportaciones, setExportaciones] = useState<Exportacion[]>([]);
  const [episodios, setEpisodios] = useState<Episode[]>([]);
  const [cargandoEpisodios, setCargandoEpisodios] = useState(false);
  const [modalNoHayEpisodios, setModalNoHayEpisodios] = useState(false);
  const [modalSinFiltros, setModalSinFiltros] = useState(false);

  // Cargar episodios
  const cargarEpisodios = async (): Promise<Episode[]> => {
    setCargandoEpisodios(true);
    try {
      const response = await api.get('/api/episodes/final', {
        params: { page: 1, pageSize: 1000 }
      });
      const episodiosData = response.data?.items || response.data || [];
      setEpisodios(episodiosData);
      return episodiosData;
    } catch (error) {
      console.error('Error cargando episodios:', error);
      // Usar datos mock para desarrollo
      const mockEpisodios: Episode[] = [
        {
          episodio: 'EP001',
          nombre: 'Juan Pérez',
          rut: '12.345.678-9',
          centro: 'Hospital UC Christus',
          folio: 'FOL001',
          tipoEpisodio: 'Hospitalización',
          fechaIngreso: '2024-01-15',
          fechaAlta: '2024-01-20',
          servicioAlta: 'Medicina Interna',
          estadoRN: 'Aprobado',
          at: true,
          atDetalle: 'BASTON-ADULTO',
          montoAT: 18000,
          motivoEgreso: 'Alta médica',
          grdCodigo: 'G045',
          peso: 1.2,
          montoRN: 150000,
          inlierOutlier: 'Inlier',
          grupoDentroNorma: true,
          diasEstada: 5,
          precioBaseTramo: 125000,
          valorGRD: 150000,
          pagoOutlierSup: 0,
          montoFinal: 168000,
          validado: true,
          diasDemoraRescate: 0,
          pagoDemora: 0,
          documentacion: 'Epicrisis completa',
          docs: {
            epicrisis: true,
            protocolo: true,
            certDefuncion: false
          },
          completeness: 'ready'
        },
        {
          episodio: 'EP002',
          nombre: 'María González',
          rut: '98.765.432-1',
          centro: 'Hospital UC Christus',
          folio: 'FOL002',
          tipoEpisodio: 'Cirugía',
          fechaIngreso: '2024-01-18',
          fechaAlta: '2024-01-25',
          servicioAlta: 'Cirugía General',
          estadoRN: 'Pendiente',
          at: false,
          atDetalle: undefined,
          montoAT: 0,
          motivoEgreso: 'Alta programada',
          grdCodigo: 'G012',
          peso: 0.8,
          montoRN: 200000,
          inlierOutlier: 'Outlier',
          grupoDentroNorma: false,
          diasEstada: 7,
          precioBaseTramo: 180000,
          valorGRD: 144000,
          pagoOutlierSup: 25000,
          montoFinal: 169000,
          validado: false,
          diasDemoraRescate: 2,
          pagoDemora: 5000,
          documentacion: 'Pendiente epicrisis',
          docs: {
            epicrisis: false,
            protocolo: false,
            certDefuncion: false
          },
          completeness: 'incompleto'
        },
        {
          episodio: 'EP003',
          nombre: 'Carlos Rodríguez',
          rut: '11.222.333-4',
          centro: 'Hospital UC Christus',
          folio: 'FOL003',
          tipoEpisodio: 'Urgencia',
          fechaIngreso: '2024-01-20',
          fechaAlta: '2024-01-22',
          servicioAlta: 'Urgencia',
          estadoRN: 'Aprobado',
          at: true,
          atDetalle: 'SILLA-RUEDAS-SIM',
          montoAT: 120000,
          motivoEgreso: 'Alta por mejoría',
          grdCodigo: 'G078',
          peso: 1.5,
          montoRN: 80000,
          inlierOutlier: 'Inlier',
          grupoDentroNorma: true,
          diasEstada: 2,
          precioBaseTramo: 60000,
          valorGRD: 90000,
          pagoOutlierSup: 0,
          montoFinal: 210000,
          validado: false,
          diasDemoraRescate: 0,
          pagoDemora: 0,
          documentacion: 'Epicrisis y consentimientos',
          docs: {
            epicrisis: true,
            protocolo: true,
            certDefuncion: false
          },
          completeness: 'ready'
        }
      ];
      setEpisodios(mockEpisodios);
      return mockEpisodios;
    } finally {
      setCargandoEpisodios(false);
    }
  };

  // Cargar episodios al montar el componente
  useEffect(() => {
    cargarEpisodios();
  }, []);

  const toggleFiltro = (filtro: FiltroExportacion) => {
    setFiltros(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(filtro)) {
        nuevo.delete(filtro);
      } else {
        nuevo.add(filtro);
      }
      return nuevo;
    });
  };

  const filtrarEpisodios = (episodios: Episode[]) => {
    if (filtros.size === 0) return [];

    return episodios.filter(ep => {
      // Debug: verificar estructura del episodio cuando venga del backend
      console.log('Episodio:', ep.episodio, 'estadoRN:', ep.estadoRN);
      
      if (filtros.has('validados') && ep.estadoRN === 'Aprobado') return true;
      if (filtros.has('no-validados') && ep.estadoRN === 'Rechazado') return true;
      if (filtros.has('pendientes') && ep.estadoRN === 'Pendiente') return true;
      return false;
    });
  };

  const generarExcel = async () => {
    setGenerando(true);
    try {
      // Validar que haya al menos un filtro seleccionado
      if (filtros.size === 0) {
        setModalSinFiltros(true);
        setGenerando(false);
        return;
      }

      const episodiosCargados = await cargarEpisodios();
      
      const episodiosFiltrados = filtrarEpisodios(episodiosCargados);
      
      console.log('Total episodios:', episodiosCargados.length);
      console.log('Episodios filtrados:', episodiosFiltrados.length);
      console.log('Filtros aplicados:', Array.from(filtros));
      
      if (episodiosFiltrados.length === 0) {
        setModalNoHayEpisodios(true);
        setGenerando(false);
        return;
      }

      // Preparar datos para Excel
      const datos = episodiosFiltrados.map(ep => {
        const fila: any = {};
        FINAL_COLUMNS.forEach(([header, key, editable]) => {
          const value = key.split('.').reduce((acc: any, k) => acc?.[k], ep as any);
          
          // Formatear valores
          if (value === null || value === undefined) {
            fila[header] = '-';
          } else if (typeof value === 'boolean') {
            fila[header] = value ? 'Sí' : 'No';
          } else if (key === 'validado' && value === null) {
            fila[header] = 'Pendiente';
          } else {
            fila[header] = value.toString();
          }
        });
        return fila;
      });

      // Crear libro de trabajo
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Episodios');

      // Generar archivo como buffer
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Crear nueva exportación
      const fecha = new Date();
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      const hora = String(fecha.getHours()).padStart(2, '0');
      const minuto = String(fecha.getMinutes()).padStart(2, '0');
      const fechaGeneracion = `${año}-${mes}-${dia}T${hora}:${minuto}:00`;
      
      const nuevaExportacion: Exportacion = {
        id: `export-${Date.now()}`,
        fechaGeneracion,
        usuarioGeneracion: user?.email || 'Usuario desconocido',
        cantidadEpisodios: episodiosFiltrados.length,
        filtros: Array.from(filtros),
        descargas: [],
        datosExcel: blob
      };

      setExportaciones(prev => [nuevaExportacion, ...prev]);

    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('Error al generar el archivo Excel');
    } finally {
      setGenerando(false);
    }
  };

  const descargarExcel = (exportacion: Exportacion) => {
    // Agregar descarga al historial
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    const fechaDescarga = `${año}-${mes}-${dia}T${hora}:${minuto}:00`;
    
    const nuevaDescarga = {
      fecha: fechaDescarga,
      usuario: user?.email || 'Usuario desconocido'
    };

    const exportacionesActualizadas = exportaciones.map(exp => 
      exp.id === exportacion.id
        ? { ...exp, descargas: [...exp.descargas, nuevaDescarga] }
        : exp
    );
    setExportaciones(exportacionesActualizadas);

    // Descargar archivo
    const fechaStr = formatearFechaLocal(exportacion.fechaGeneracion);
    const url = URL.createObjectURL(exportacion.datosExcel);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fechaStr}-ExportacionFonasa.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatearFecha = (fechaISO: string) => {
    return new Date(fechaISO).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearFechaLocal = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  return (
    <main className='max-w-[1400px] mx-auto px-6 py-10'>
      {/* Botón volver al dashboard */}
      <div className='mb-6'>
        <Link to='/dashboard' className='text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-300/80 shadow-sm transition-all duration-300 inline-block'>← Volver al Dashboard</Link>
      </div>

      {/* Header */}
      <div className='mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5'>
        <h1 className='text-3xl font-open-sauce font-light bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent'>Exportaciones FONASA</h1>
      </div>

      {/* Exportaciones FONASA */}
      <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
      {/* Sección de generación */}
      <div className='p-6'>
        <p className='text-base font-open-sauce font-light text-slate-700 mb-4'>Selecciona los tipos de episodios a incluir en el Excel y haz clic en "Generar Excel"</p>
        <div className='border-t border-slate-200 pt-6'>
          <div className='flex items-center gap-4 mb-4'>
          {/* Botón Generar Excel */}
          <button
            onClick={generarExcel}
            disabled={generando || cargandoEpisodios}
            className='px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm hover:bg-indigo-100 hover:border-indigo-300 active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {generando ? 'Generando…' : 'Generar Excel'}
          </button>

          {/* Checkboxes de filtro */}
          <div className='flex items-center gap-4'>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={filtros.has('validados')}
                onChange={() => toggleFiltro('validados')}
                className='w-4 h-4 text-indigo-600'
              />
              <span className='text-sm text-slate-700'>Aprobados</span>
            </label>
            
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={filtros.has('no-validados')}
                onChange={() => toggleFiltro('no-validados')}
                className='w-4 h-4 text-indigo-600'
              />
              <span className='text-sm text-slate-700'>No aprobados</span>
            </label>
            
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={filtros.has('pendientes')}
                onChange={() => toggleFiltro('pendientes')}
                className='w-4 h-4 text-indigo-600'
              />
              <span className='text-sm text-slate-700'>Pendientes</span>
            </label>
          </div>
        </div>
        </div>
      </div>

      {/* Tabla de historial */}
      {exportaciones.length > 0 && (
        <div className='border-t'>
          <div className='p-6'>
            <h2 className='text-lg font-semibold text-slate-900'>Historial de Exportaciones</h2>
          </div>
          
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-slate-100'>
                <tr>
                  <th className='text-center p-3 font-medium text-slate-900'>Fecha de Generación</th>
                  <th className='text-center p-3 font-medium text-slate-900'>Usuario</th>
                  <th className='text-center p-3 font-medium text-slate-900'>Episodios</th>
                  <th className='text-center p-3 font-medium text-slate-900'>Filtros Aplicados</th>
                  <th className='text-center p-3 font-medium text-slate-900'>Historial de Descargas</th>
                  <th className='text-center p-3 font-medium text-slate-900'>Descargar</th>
                </tr>
              </thead>
              <tbody>
                {exportaciones.map((exp) => (
                  <tr key={exp.id} className='border-t hover:bg-slate-50'>
                    <td className='p-3 text-slate-900'>{formatearFecha(exp.fechaGeneracion)}</td>
                    <td className='p-3 text-slate-600'>{exp.usuarioGeneracion}</td>
                    <td className='p-3 text-center text-slate-600'>{exp.cantidadEpisodios}</td>
                    <td className='p-3 text-slate-600'>
                      {exp.filtros.map((f: string) => {
                        const label = f === 'validados' ? 'Aprobados' : f === 'no-validados' ? 'No aprobados' : 'Pendientes';
                        const badgeClass = f === 'validados' ? 'badge-success' : f === 'no-validados' ? 'badge-error' : 'badge-warning';
                        return (
                          <span key={f} className={`${badgeClass} inline-block mr-1 mb-1`}>
                            {label}
                          </span>
                        );
                      })}
                    </td>
                    <td className='p-3 text-slate-600'>
                      {exp.descargas.length === 0 ? (
                        <span className='text-slate-400 italic'>Aún no hay descargas</span>
                      ) : (
                        <div className='space-y-1'>
                          {exp.descargas.map((desc: any, idx: number) => (
                            <div key={idx} className='text-xs'>
                              {formatearFecha(desc.fecha)} - {desc.usuario}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className='p-3 text-center'>
                      <button
                        onClick={() => descargarExcel(exp)}
                        className='p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors'
                        title='Descargar'
                      >
                        <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Modal: No hay episodios */}
      {modalNoHayEpisodios && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border p-6 max-w-md w-full mx-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No hay episodios para exportar
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  No se encontraron episodios con los filtros seleccionados. Intenta cambiar los filtros e intenta de nuevo.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setModalNoHayEpisodios(false)}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Sin filtros seleccionados */}
      {modalSinFiltros && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border p-6 max-w-md w-full mx-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Filtros requeridos
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Debes seleccionar al menos un tipo de episodio (Aprobados, No aprobados, o Pendientes) para generar la exportación.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setModalSinFiltros(false)}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
