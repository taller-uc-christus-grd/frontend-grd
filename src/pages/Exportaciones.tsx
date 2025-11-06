import { useState } from 'react';
import { Link } from 'react-router-dom';
// import * as XLSX from 'xlsx'; // ¡Ya no se necesita en el frontend!
import type { Exportacion, FiltroExportacion } from '@/types';
// import { FINAL_COLUMNS } from '@/lib/planillaConfig'; // Ya no se necesita
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function Exportaciones() {
  const { user } = useAuth();
  const [filtros, setFiltros] = useState<Set<FiltroExportacion>>(new Set());
  const [generando, setGenerando] = useState(false);
  const [exportaciones, setExportaciones] = useState<Exportacion[]>([]);
  
  // Ya no necesitamos los estados de episodios, carga, o modal de "no hay episodios"
  // el backend nos avisará si no hay.
  const [modalSinFiltros, setModalSinFiltros] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ya no necesitamos cargarEpisodios, filtrarEpisodios, ni el estado 'episodios'
  // El backend hará todo eso por nosotros.

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

  const generarExcel = async () => {
    setGenerando(true);
    setErrorMessage(null); // Limpiar errores anteriores

    try {
      // 1. Validar que haya al menos un filtro seleccionado
      if (filtros.size === 0) {
        setModalSinFiltros(true);
        setGenerando(false);
        return;
      }

      const filtrosArray = Array.from(filtros);
      console.log('Solicitando exportación con filtros:', filtrosArray);

      // 2. Llamar al endpoint del backend con los filtros
      const response = await api.get('/api/export', {
        params: {
          // Unimos los filtros en un string separado por comas
          filtros: filtrosArray.join(','), 
          // Aquí podrías añadir más filtros de UI, como fechas
          // desde: '2024-01-01',
          // hasta: '2024-12-31',
        },
        responseType: 'blob', // ¡MUY IMPORTANTE! Esperamos un archivo
      });

      // 3. Crear el Blob y el enlace de descarga
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      
      // Extraer el nombre del archivo de la respuesta del backend
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `Exportacion-GRD-${new Date().toISOString().slice(0, 10)}.xlsx`; // Default
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }

      // 4. Crear registro en el historial de descargas
      const fecha = new Date();
      const fechaGeneracion = fecha.toISOString();
      
      const nuevaExportacion: Exportacion = {
        id: `export-${Date.now()}`,
        fechaGeneracion,
        usuarioGeneracion: user?.email || 'Usuario desconocido',
        cantidadEpisodios: 0, // El backend no nos da este dato ahora, pero no es crítico
        filtros: filtrosArray,
        descargas: [], // Se llenará en la descarga
        datosExcel: blob // Guardamos el blob para descargas futuras
      };
      
      // 5. Iniciar la descarga automáticamente y registrarla
      descargarExcel(nuevaExportacion, true, fileName);
      
      // Añadir al historial
      setExportaciones(prev => [nuevaExportacion, ...prev]);

    } catch (error: any) {
      console.error('Error generando Excel:', error);
      // Manejar errores específicos del backend
      if (error.response?.status === 404) {
        setErrorMessage('No se encontraron episodios con los filtros seleccionados.');
      } else if (error.response?.status === 400) {
        const errorData = await (error.response.data as Blob).text();
        const errorJson = JSON.parse(errorData);
        setErrorMessage(`Error: ${errorJson.message || 'Petición incorrecta.'}`);
      } else {
        setErrorMessage('Error desconocido al generar el archivo Excel.');
      }
      // Limpiar el mensaje después de 5 seg
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setGenerando(false);
    }
  };

  const descargarExcel = (exportacion: Exportacion, primeraDescarga = false, fileName: string) => {
    
    if (!primeraDescarga) {
      // Registrar descarga adicional
      const nuevaDescarga = {
        fecha: new Date().toISOString(),
        usuario: user?.email || 'Usuario desconocido'
      };
      const exportacionesActualizadas = exportaciones.map(exp => 
        exp.id === exportacion.id
          ? { ...exp, descargas: [...exp.descargas, nuevaDescarga] }
          : exp
      );
      setExportaciones(exportacionesActualizadas);
    }

    // Descargar archivo desde el blob guardado
    const url = URL.createObjectURL(exportacion.datosExcel);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName; // Usamos el nombre de archivo del backend
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
          
          {/* Mensaje de error (¡NUEVO!) */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}

          <div className='border-t border-slate-200 pt-6'>
            <div className='flex items-center gap-4 mb-4'>
              {/* Botón Generar Excel */}
              <button
                onClick={generarExcel}
                disabled={generando}
                className='px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm hover:bg-indigo-100 hover:border-indigo-300 active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {generando ? 'Generando…' : 'Generar Excel'}
              </button>

              {/* Checkboxes de filtro (ETIQUETAS CORREGIDAS) */}
              <div className='flex items-center gap-4'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={filtros.has('validados')}
                    onChange={() => toggleFiltro('validados')}
                    className='w-4 h-4 text-indigo-600'
                  />
                  <span className='text-sm text-slate-700'>Aprobados (Gestión)</span>
                </label>
                
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={filtros.has('no-validados')}
                    onChange={() => toggleFiltro('no-validados')}
                    className='w-4 h-4 text-indigo-600'
                  />
                  <span className='text-sm text-slate-700'>Rechazados (Gestión)</span>
                </label>
                
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={filtros.has('pendientes')}
                    onChange={() => toggleFiltro('pendientes')}
                    className='w-4 h-4 text-indigo-600'
                  />
                  <span className='text-sm text-slate-700'>Pendientes (Gestión)</span>
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
                      <td className='p-3 text-center text-slate-600'>
                        {/* El backend no devuelve esto, pero podrías añadirlo si quisieras */}
                        <span className='text-slate-400 italic'>N/A</span>
                      </td>
                      <td className='p-3 text-slate-600'>
                        {exp.filtros.map((f: string) => {
                          const label = f === 'validados' ? 'Aprobados' : f === 'no-validados' ? 'Rechazados' : 'Pendientes';
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
                          onClick={() => descargarExcel(exp, false, `Exportacion-Filtrada-${exp.id}.xlsx`)}
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

      {/* Modal: Sin filtros seleccionados (sin cambios) */}
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
                  Debes seleccionar al menos un tipo de episodio (Aprobados, Rechazados, o Pendientes) para generar la exportación.
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
