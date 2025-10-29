import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FINAL_COLUMNS } from '@/lib/planillaConfig';
import type { Episode } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { hasRole } from '@/lib/auth';
import { 
  validateFieldValue, 
  formatCurrency
} from '@/lib/validations';
import api from '@/lib/api';

export default function Episodios() {
  const { user } = useAuth();
  const isFinanzas = hasRole(user, ['finanzas']);
  const isGestion = hasRole(user, ['gestion']);
  
  // TODO: Reemplazar con datos reales del backend
  const [episodios, setEpisodios] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValidated, setFilterValidated] = useState<'all' | 'validated' | 'pending'>('all');
  const [filterOutlier, setFilterOutlier] = useState<'all' | 'inlier' | 'outlier'>('all');
  
  // Estados para edición
  const [editingCell, setEditingCell] = useState<{row: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  
  // Los catálogos se manejan en el backend
  
  // Estados para validaciones
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string[]}>({});
  const [validationWarnings, setValidationWarnings] = useState<{[key: string]: string[]}>({});
  
  // Estado para mensajes de confirmación
  const [saveMessage, setSaveMessage] = useState<string>('');

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

  // Campos editables según rol del usuario
  const getEditableFields = () => {
    const editableFields = new Set<string>();
    
    if (isFinanzas) {
      // Finanzas puede editar campos financieros
      FINAL_COLUMNS.forEach(([header, key, editable]) => {
        if (editable && key !== 'validado') { // validado es solo para gestión
          editableFields.add(key);
        }
      });
    }
    
    if (isGestion) {
      // Gestión puede editar el campo validado
      editableFields.add('validado');
    }
    
    return editableFields;
  };

  const editableFields = getEditableFields();

  // Función para iniciar edición
  const startEdit = (rowIndex: number, field: string, currentValue: any) => {
    if ((!isFinanzas && !isGestion) || !editableFields.has(field)) return;
    
    setEditingCell({ row: rowIndex, field });
    
    // Para el campo validado, convertir boolean a string apropiado
    if (field === 'validado') {
      setEditValue(currentValue === true ? 'true' : currentValue === false ? 'false' : '');
    } else {
      setEditValue(currentValue?.toString() || '');
    }
  };

  // Función para guardar cambios
  const saveEdit = async () => {
    if (!editingCell || saving) return;
    
    setSaving(true);
    try {
      const { row, field } = editingCell;
      const episodio = filteredEpisodios[row];
      
      // Validar el valor según el tipo de campo
      const fieldValidation = validateFieldValue(field, editValue);
      if (!fieldValidation.isValid) {
        throw new Error(fieldValidation.errors.join(', '));
      }
      
      let validatedValue: any = editValue;
      
      if (field.includes('monto') || field.includes('pago') || field.includes('precio') || field.includes('valor')) {
        validatedValue = parseFloat(editValue);
      }
      
      if (field === 'diasDemoraRescate') {
        validatedValue = parseInt(editValue);
      }
      
      if (field === 'validado') {
        validatedValue = editValue === 'true' ? true : editValue === 'false' ? false : null;
      }

      // Actualizar el episodio localmente
      const updatedEpisodios = [...episodios];
      const originalIndex = episodios.findIndex(ep => ep.episodio === episodio.episodio);
      if (originalIndex !== -1) {
        const updatedEpisodio = {
          ...updatedEpisodios[originalIndex],
          [field]: validatedValue
        };

        // Enviar solo el campo editado al backend
        // El backend se encarga de todos los cálculos usando los catálogos
        try {
          const response = await api.patch(`/api/episodes/${episodio.episodio}`, { 
            [field]: validatedValue
          });
          
          console.log(`Campo ${field} actualizado exitosamente para episodio ${episodio.episodio}`);
          
          // El backend devuelve el episodio completo con todos los campos recalculados
          const updatedEpisodioFromBackend = response.data;
          
          // Actualizar la lista local con los datos del backend
          updatedEpisodios[originalIndex] = updatedEpisodioFromBackend;
          setEpisodios(updatedEpisodios);
          
          // Mostrar mensaje de confirmación
          setSaveMessage(`✅ Campo ${field} guardado exitosamente`);
          setTimeout(() => setSaveMessage(''), 3000);
          
        } catch (backendError: any) {
          console.error('Error al guardar en backend:', backendError);
          // Revertir cambios locales si falla el backend
          setEpisodios(episodios);
          throw new Error(`Error al guardar: ${backendError.response?.data?.message || backendError.message}`);
        }
      }
      
      setEditingCell(null);
      setEditValue('');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Función para cancelar edición
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Función para renderizar valores de celdas con formato apropiado
  const renderCellValue = (key: string, value: any, episodio: Episode, rowIndex: number) => {
    const isEditing = editingCell?.row === rowIndex && editingCell?.field === key;
    const isEditable = editableFields.has(key);
    const episodioKey = episodio.episodio;
    const hasErrors = validationErrors[episodioKey]?.length > 0;
    const hasWarnings = validationWarnings[episodioKey]?.length > 0;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          {key === 'estadoRN' ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1 text-xs border rounded"
              autoFocus
            >
              <option value="">Seleccionar...</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          ) : key === 'validado' ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1 text-xs border rounded"
              autoFocus
            >
              <option value="">Seleccionar...</option>
              <option value="true">Aprobar</option>
              <option value="false">Rechazar</option>
            </select>
          ) : (
            <input
              type={key.includes('monto') || key.includes('pago') || key.includes('precio') || key.includes('valor') ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1 text-xs border rounded w-20"
              autoFocus
              min="0"
              step="0.01"
            />
          )}
          <button
            onClick={saveEdit}
            disabled={saving}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            title={saving ? 'Guardando en servidor...' : 'Guardar cambios'}
          >
            {saving ? '⏳' : '✓'}
          </button>
          <button
            onClick={cancelEdit}
            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            ✕
          </button>
        </div>
      );
    }
    
    if (value === null || value === undefined) return '-';
    
    switch (key) {
      case 'validado':
        // Para gestión, mostrar estado de revisión con badges más descriptivos
        if (isGestion) {
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === true 
                ? 'bg-green-100 text-green-800' 
                : value === false
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {value === true ? '✅ Aprobado' :
               value === false ? '❌ Rechazado' : 
               '⏳ Pendiente'}
            </span>
          );
        }
        // Para otros roles, mostrar el badge simple original
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
        const formattedValue = value ? formatCurrency(value) : '-';
        return (
          <div className="flex items-center gap-1">
            <span className={hasErrors ? 'text-red-600' : hasWarnings ? 'text-yellow-600' : ''}>
              {formattedValue}
            </span>
            {hasErrors && <span className="text-red-500 text-xs">⚠️</span>}
            {hasWarnings && !hasErrors && <span className="text-yellow-500 text-xs">⚠️</span>}
          </div>
        );
      
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
          completeness: 'ready',
          comentariosGestion: 'Episodio revisado y aprobado. Documentación completa.',
          fechaRevision: '2024-01-22T10:30:00Z',
          revisadoPor: 'gestión@ucchristus.cl'
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
          completeness: 'incompleto',
          comentariosGestion: 'Episodio rechazado por documentación incompleta. Falta epicrisis.',
          fechaRevision: '2024-01-26T14:15:00Z',
          revisadoPor: 'gestión@ucchristus.cl'
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
          completeness: 'ready',
          comentariosGestion: '',
          fechaRevision: undefined,
          revisadoPor: undefined
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
        <div className="flex items-center justify-between">
          <div>
        <h1 className="title-primary">Episodios</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Listado completo de episodios hospitalarios procesados
        </p>
          </div>
          {isFinanzas && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600">💰</span>
                <span className="text-green-800 font-medium text-sm">
                  Modo Finanzas - Campos editables
                </span>
              </div>
            </div>
          )}
        </div>
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

      {/* Mensaje de confirmación de guardado */}
      {saveMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-green-600 mr-3">✅</div>
            <div>
              <p className="text-green-800 font-medium">Cambios guardados</p>
              <p className="text-green-700 text-sm">{saveMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Información sobre campos editables */}
      {isFinanzas && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Campos editables para Finanzas (ingreso manual):</h3>
          <div className="grid md:grid-cols-2 gap-2 text-xs text-blue-700">
            <div className="space-y-1">
              <p>• <strong>Estado RN</strong> - Estado del reembolso</p>
              <p>• <strong>AT (S/N)</strong> - Ajuste por Tecnología</p>
              <p>• <strong>AT Detalle</strong> - Detalle del AT</p>
              <p>• <strong>Monto AT</strong> - Monto de ajuste (manual)</p>
              <p>• <strong>Monto RN</strong> - Monto de reembolso</p>
              <p>• <strong>Días Demora Rescate</strong> - Días de demora</p>
            </div>
            <div className="space-y-1">
              <p>• <strong>Pago Demora Rescate</strong> - Pago por demora</p>
              <p>• <strong>Pago Outlier Superior</strong> - Pago por outlier</p>
              <p>• <strong>Precio Base por Tramo</strong> - Precio base</p>
              <p>• <strong>Valor GRD</strong> - Valor GRD</p>
              <p>• <strong>Monto Final</strong> - Monto final (calculado por backend)</p>
              <p>• <strong>Documentación</strong> - Documentación necesaria</p>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            💡 Haz clic en cualquier campo editable para modificarlo. Los campos calculados se actualizan automáticamente.
          </p>
          <p className="text-xs text-green-600 mt-1">
            💾 Los cambios se guardan automáticamente en el servidor al confirmar la edición.
          </p>
        </div>
      )}

      {/* Información sobre campos editables para Gestión */}
      {isGestion && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-purple-800 mb-2">Campos editables para Gestión:</h3>
          <div className="text-xs text-purple-700">
            <p>• <strong>VALIDADO</strong> - Aprobar o rechazar episodios</p>
          </div>
          <p className="text-xs text-purple-600 mt-2">
            💡 Haz clic en el campo VALIDADO para aprobar o rechazar episodios. Los cambios se reflejan inmediatamente en el sistema.
          </p>
          <p className="text-xs text-purple-600 mt-1">
            💾 Los cambios se guardan automáticamente en el servidor al confirmar la edición.
          </p>
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
                {filteredEpisodios.map((episodio, rowIndex) => (
                  <tr key={episodio.episodio} className="table-row">
                    {FINAL_COLUMNS.map(([header, key, editable]) => {
                      const value = key.split('.').reduce((acc: any, k) => acc?.[k], episodio as any);
                      const isEditable = editableFields.has(key);
                      
                      return (
                        <td 
                          key={key}
                          className={`table-cell ${
                            isEditable ? 'bg-blue-50 font-medium cursor-pointer hover:bg-blue-100' : ''
                          }`}
                          onClick={() => isEditable && startEdit(rowIndex, key, value)}
                          title={isEditable ? 'Hacer clic para editar' : ''}
                        >
                          {renderCellValue(key, value, episodio, rowIndex)}
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
                      {/* Indicadores de validación */}
                      {(validationErrors[episodio.episodio]?.length > 0 || validationWarnings[episodio.episodio]?.length > 0) && (
                        <div className="mt-1">
                          {validationErrors[episodio.episodio]?.map((error, idx) => (
                            <div key={idx} className="text-xs text-red-600" title={error}>
                              ⚠️ {error}
                            </div>
                          ))}
                          {validationWarnings[episodio.episodio]?.map((warning, idx) => (
                            <div key={idx} className="text-xs text-yellow-600" title={warning}>
                              ⚠️ {warning}
                            </div>
                          ))}
                        </div>
                      )}
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
