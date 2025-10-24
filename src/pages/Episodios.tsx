import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FINAL_COLUMNS } from '@/lib/planillaConfig';
import type { Episode } from '@/types';
import api from '@/lib/api';

export default function Episodios() {
  // TODO: Reemplazar con datos reales del backend
  const [episodios, setEpisodios] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValidated, setFilterValidated] = useState<'all' | 'validated' | 'pending'>('all');
  const [filterOutlier, setFilterOutlier] = useState<'all' | 'inlier' | 'outlier'>('all');

  // Filtros y búsqueda
  const filteredEpisodios = useMemo(() => {
    let filtered = episodios;

    // Búsqueda por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ep => 
        ep.episodio?.toLowerCase().includes(term) ||
        ep.nombre?.toLowerCase().includes(term) ||
        ep.rut?.toLowerCase().includes(term)
      );
    }

    // Filtro por validación
    if (filterValidated !== 'all') {
      filtered = filtered.filter(ep => 
        filterValidated === 'validated' ? ep.validado : !ep.validado
      );
    }

    // Filtro por outlier
    if (filterOutlier !== 'all') {
      filtered = filtered.filter(ep => 
        filterOutlier === 'outlier' ? ep.inlierOutlier === 'Outlier' : ep.inlierOutlier !== 'Outlier'
      );
    }

    return filtered;
  }, [episodios, searchTerm, filterValidated, filterOutlier]);

  // Función para renderizar valores de celdas con formato apropiado
  const renderCellValue = (key: string, value: any, episodio: Episode) => {
    if (value === null || value === undefined) return '-';
    
    switch (key) {
      case 'validado':
        return (
          <span className={`badge-${value ? 'success' : 'warning'}`}>
            {value ? '✓' : '○'}
          </span>
        );
      
      case 'at':
        return value ? (
          <span className="badge-success">Sí</span>
        ) : (
          <span className="badge-error">No</span>
        );
      
      case 'inlierOutlier':
        return (
          <span className={`badge-${
            value === 'Outlier' ? 'warning' : 'success'
          }`}>
            {value || '-'}
          </span>
        );
      
      case 'grupoDentroNorma':
        return value ? (
          <span className="badge-success">Sí</span>
        ) : (
          <span className="badge-error">No</span>
        );
      
      case 'estadoRN':
        return value ? (
          <span className={`badge-${
            value === 'Aprobado' ? 'success' : 
            value === 'Pendiente' ? 'warning' : 'error'
          }`}>
            {value}
          </span>
        ) : '-';
      
      case 'montoAT':
      case 'montoRN':
      case 'pagoOutlierSup':
      case 'pagoDemora':
      case 'precioBaseTramo':
      case 'valorGRD':
      case 'montoFinal':
        return value ? `$${value.toLocaleString()}` : '-';
      
      case 'peso':
        return value ? value.toFixed(2) : '-';
      
      case 'diasEstada':
      case 'diasDemoraRescate':
        return value || '-';
      
      case 'documentacion':
        return value ? (
          <span className="text-xs text-gray-600 max-w-32 truncate" title={value}>
            {value}
          </span>
        ) : '-';
      
      default:
        return value || '-';
    }
  };

  // Cargar episodios automáticamente al montar el componente
  useEffect(() => {
    loadEpisodios();
  }, []);

  // Función para cargar episodios del backend
  const loadEpisodios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/episodes/final', {
        params: {
          page: 1,
          pageSize: 100 // Cargar los primeros 100 episodios
        }
      });
      
      // El backend debería devolver { items: Episode[], total: number }
      const episodiosData = response.data?.items || response.data || [];
      setEpisodios(episodiosData);
      
      console.log('Episodios cargados:', episodiosData.length);
    } catch (error) {
      console.error('Error cargando episodios:', error);
      setError('Error al cargar episodios. Usando datos de demostración.');
      
      // Datos mock para desarrollo (eliminar cuando esté el backend)
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
          validado: true,
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-container-lg">
      <header className="mb-8">
        <h1 className="title-primary">Episodios</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Listado completo de episodios hospitalarios procesados
        </p>
      </header>

      {/* Filtros y búsqueda */}
      <div className="card mb-6 p-6">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="form-label">Buscar</label>
            <input
              type="text"
              className="form-input"
              placeholder="Episodio, nombre, RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por validación */}
          <div>
            <label className="form-label">Estado</label>
            <select
              className="form-input"
              value={filterValidated}
              onChange={(e) => setFilterValidated(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="validated">Validados</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>

          {/* Filtro por outlier */}
          <div>
            <label className="form-label">Tipo</label>
            <select
              className="form-input"
              value={filterOutlier}
              onChange={(e) => setFilterOutlier(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="inlier">Inlier</option>
              <option value="outlier">Outlier</option>
            </select>
          </div>

          {/* Botón de recarga */}
          <div className="flex items-end">
            <button
              onClick={loadEpisodios}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Recargar Episodios'}
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <p className="text-yellow-800 font-medium">Modo de demostración</p>
              <p className="text-yellow-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de episodios */}
      <div className="table-container">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="title-secondary mb-2">Cargando episodios...</h3>
            <p className="text-[var(--text-secondary)]">
              Conectando con el servidor para obtener los datos
            </p>
          </div>
        ) : episodios.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="title-secondary mb-2">No hay episodios cargados</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Los episodios aparecerán aquí una vez que se carguen desde el backend
            </p>
            <Link to="/carga" className="btn-primary">
              Cargar Archivo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  {FINAL_COLUMNS.map(([header, key, editable]) => (
                    <th 
                      key={key}
                      className={`table-cell font-medium text-[var(--text-primary)] ${
                        editable ? 'bg-blue-50' : ''
                      }`}
                      title={editable ? 'Campo editable' : 'Campo de solo lectura'}
                    >
                      {header}
                    </th>
                  ))}
                  <th className="table-cell font-medium text-[var(--text-primary)]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEpisodios.map((episodio) => (
                  <tr key={episodio.episodio} className="table-row">
                    {FINAL_COLUMNS.map(([header, key, editable]) => {
                      const value = key.split('.').reduce((acc: any, k) => acc?.[k], episodio as any);
                      
                      return (
                        <td 
                          key={key}
                          className={`table-cell ${
                            editable ? 'bg-blue-50 font-medium' : ''
                          }`}
                        >
                          {renderCellValue(key, value, episodio)}
                        </td>
                      );
                    })}
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <Link
                          to={`/episodios/${episodio.episodio}`}
                          className="link-primary font-medium text-sm"
                        >
                          Ver
                        </Link>
                        <Link
                          to={`/respaldos/${episodio.episodio}`}
                          className="link-secondary font-medium text-sm"
                        >
                          Docs
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información de resultados */}
      {episodios.length > 0 && (
        <div className="mt-4 text-sm text-[var(--text-secondary)]">
          Mostrando {filteredEpisodios.length} de {episodios.length} episodios
        </div>
      )}
    </main>
  );
}
