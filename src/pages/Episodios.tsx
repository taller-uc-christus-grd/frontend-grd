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
import icon3 from '@/assets/icon3.png';
import icon4 from '@/assets/icon4.png';
import icon1 from '@/assets/icon1.png';

export default function Episodios() {
  const { user } = useAuth();
  const isFinanzas = hasRole(user, ['finanzas']);
  const isGestion = hasRole(user, ['gestion']);
  const isCodificador = hasRole(user, ['codificador']);
  
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
    
    // Convertir valores según el tipo de campo
    if (field === 'validado') {
      setEditValue(currentValue === true ? 'true' : currentValue === false ? 'false' : '');
    } else if (field === 'at') {
      // Convertir boolean a "S"/"N" o mantener "S"/"N" si ya es string
      if (currentValue === true || currentValue === 'S' || currentValue === 's') {
        setEditValue('S');
      } else if (currentValue === false || currentValue === 'N' || currentValue === 'n') {
        setEditValue('N');
      } else {
        setEditValue('N'); // Default
      }
    } else if (field === 'estadoRN') {
      setEditValue(currentValue || '');
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
      
      if (field === 'at') {
        // Convertir a "S" o "N" para el backend
        validatedValue = editValue === 'S' || editValue === 'true' ? 'S' : 'N';
      }
      
      if (field === 'estadoRN') {
        // Si está vacío, enviar null
        validatedValue = editValue === '' ? null : editValue;
      }
      
      if (field === 'validado') {
        validatedValue = editValue === 'true' ? true : editValue === 'false' ? false : null;
      }

      // Enviar solo el campo editado al backend
      // El backend se encarga de todos los cálculos usando los catálogos
      try {
        // Intentar usar id si existe, sino usar episodio
        const episodeId = (episodio as any).id || episodio.episodio;
        const url = `/api/episodios/${episodeId}`;
        const payload = { [field]: validatedValue };
        
        console.log('🔄 Enviando PATCH a:', url);
        console.log('📦 Datos enviados:', payload);
        console.log('🆔 ID del episodio (usado):', episodeId);
        console.log('🔍 Datos del episodio:', {
          episodio: episodio.episodio,
          id: (episodio as any).id,
          hasId: !!(episodio as any).id
        });
        
        const response = await api.patch(url, payload);
        
        console.log(`Campo ${field} actualizado exitosamente para episodio ${episodio.episodio}`);
        console.log('📥 Respuesta del backend:', response.data);
        
        // El backend devuelve el episodio completo con todos los campos recalculados
        const updatedEpisodioFromBackend = response.data;
        
        // Actualizar la lista local con los datos del backend
        // Buscar el episodio por ID flexible (puede ser id o episodio)
        setEpisodios(prevEpisodios => {
          const updated = [...prevEpisodios];
          const index = updated.findIndex(ep => {
            const epId = (ep as any).id || ep.episodio;
            const searchId = (episodio as any).id || episodio.episodio;
            return epId === searchId || ep.episodio === episodio.episodio;
          });
          
          if (index !== -1) {
            // Reemplazar completamente el episodio con los datos del backend
            updated[index] = updatedEpisodioFromBackend;
            console.log('✅ Episodio actualizado en la lista local:', updatedEpisodioFromBackend);
          } else {
            console.warn('⚠️ No se encontró el episodio en la lista para actualizar');
          }
          
          return updated;
        });
        
        // Mostrar mensaje de confirmación
        setSaveMessage(`✅ Campo ${field} guardado exitosamente`);
        setTimeout(() => setSaveMessage(''), 3000);
        
      } catch (backendError: any) {
          console.error('❌ Error al guardar en backend:', backendError);
          console.error('📋 Detalles del error:', {
            status: backendError.response?.status,
            statusText: backendError.response?.statusText,
            data: backendError.response?.data,
            url: backendError.config?.url,
            method: backendError.config?.method,
            fullUrl: backendError.config?.baseURL + backendError.config?.url
          });
          
          // Revertir cambios locales si falla el backend
          setEpisodios(episodios);
          
          let errorMessage = 'Error al guardar los cambios';
          if (backendError.response?.status === 404) {
            errorMessage = `El episodio ${episodio.episodio} no fue encontrado en el servidor. Verifica que el ID del episodio sea correcto.`;
          } else if (backendError.response?.status === 400) {
            errorMessage = `Datos inválidos: ${backendError.response?.data?.message || 'El valor ingresado no es válido'}`;
          } else if (backendError.response?.status === 401) {
            errorMessage = 'No tienes permisos para realizar esta acción. Por favor, inicia sesión nuevamente.';
          } else if (backendError.response?.status === 500) {
            errorMessage = 'Error del servidor. Por favor, intenta nuevamente más tarde.';
          } else if (backendError.response?.data?.message) {
            errorMessage = backendError.response.data.message;
          } else if (backendError.message) {
            errorMessage = backendError.message;
          }
          
          throw new Error(errorMessage);
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
          ) : key === 'at' ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1 text-xs border rounded"
              autoFocus
            >
              <option value="N">No</option>
              <option value="S">Sí</option>
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
        // Manejar tanto boolean como "S"/"N"
        const atValue = value === true || value === 'S' || value === 's';
        return atValue ? (
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
      // Agregar timestamp para evitar caché del navegador
      const response = await api.get('/api/episodios/final', {
        params: {
          page: 1,
          pageSize: 100, // Cargar los primeros 100 episodios
          _t: Date.now() // Timestamp para evitar caché
        }
      });
      
      // El backend debería devolver { items: Episode[], total: number }
      const episodiosData = response.data?.items || response.data || [];
      setEpisodios(episodiosData);
      
      console.log('Episodios cargados:', episodiosData.length);
      
      // Log para debug: verificar estructura de los episodios
      if (episodiosData.length > 0) {
        console.log('📋 Estructura del primer episodio:', {
          episodio: episodiosData[0].episodio,
          id: (episodiosData[0] as any).id,
          keys: Object.keys(episodiosData[0])
        });
      }
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
    <main className="max-w-[1400px] mx-auto px-6 py-10">
      {/* Botón volver al dashboard */}
      <div className='mb-6'>
        <Link to='/dashboard' className='text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-300/80 shadow-sm transition-all duration-300 inline-block'>← Volver al Dashboard</Link>
      </div>

      {/* Div 1: Header con título y botón modo */}
      <div className='mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5'>
      <header>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-open-sauce font-light bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Episodios</h1>
            <p className="text-slate-600 mt-2">
              Listado completo de episodios hospitalarios procesados
            </p>
          </div>
          {isFinanzas && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-300 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <img src={icon3} alt="Finanzas" className="w-6 h-6 object-contain" />
                <span className="text-purple-900 font-semibold text-sm">
                  Modo Finanzas
                </span>
              </div>
            </div>
          )}
          {isGestion && (
            <div className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-300 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <img src={icon4} alt="Gestión" className="w-6 h-6 object-contain" style={{ filter: 'invert(17%) sepia(96%) saturate(5067%) hue-rotate(300deg) brightness(95%) contrast(96%)' }} />
                <span className="text-fuchsia-900 font-semibold text-sm">Modo Gestión</span>
              </div>
            </div>
          )}
          {isCodificador && (
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-300 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <img src={icon1} alt="Codificador" className="w-6 h-6 object-contain" style={{ filter: 'invert(27%) sepia(94%) saturate(1406%) hue-rotate(188deg) brightness(96%) contrast(95%)' }} />
                <span className="text-sky-900 font-semibold text-sm">Modo Codificador</span>
              </div>
            </div>
          )}
        </div>
      </header>
      </div>

      {/* Div 2: Instrucciones */}
      <div className='mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
        {error && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="text-yellow-600 text-xl">⚠️</div>
              <div>
                <p className="text-yellow-800 font-semibold">Modo de demostración</p>
                <p className="text-yellow-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {saveMessage && (
          <div className="bg-green-50 border-b border-green-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="text-green-600 text-xl">✅</div>
              <div>
                <p className="text-green-800 font-semibold">Cambios guardados</p>
                <p className="text-green-700 text-sm mt-1">{saveMessage}</p>
              </div>
            </div>
          </div>
        )}

        {isFinanzas && (
          <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 border-t border-purple-200/50 px-6 py-6">
            <div className="flex items-start gap-3 mb-4">
              <img src={icon3} alt="Finanzas" className="w-8 h-8 object-contain mt-1" style={{ filter: 'invert(23%) sepia(92%) saturate(7475%) hue-rotate(261deg) brightness(93%) contrast(96%)' }} />
              <div className="flex-1">
                <h3 className="text-base font-open-sauce font-medium text-purple-900 mb-4">Campos editables para Finanzas (ingreso manual)</h3>
                
                {/* Instrucciones primero */}
                <div className="mb-6 -mx-6 px-6 py-4 bg-white/80 border-l-4 border-purple-500 rounded-r-lg shadow-sm">
                  <h4 className="text-sm font-semibold text-purple-900 mb-3">Instrucciones</h4>
                  <div className="space-y-2.5">
                    <p className="text-sm text-slate-700 flex items-start gap-2.5">
                      <span className="text-purple-500 mt-0.5 font-bold">•</span>
                      <span>Haz clic en cualquier campo editable para modificarlo. Los campos calculados se actualizan automáticamente.</span>
                    </p>
                    <p className="text-sm text-slate-700 flex items-start gap-2.5">
                      <span className="text-purple-500 mt-0.5 font-bold">•</span>
                      <span>Los cambios se guardan automáticamente en el servidor al confirmar la edición.</span>
                    </p>
                  </div>
                </div>
                
                {/* Lista de campos editables */}
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-2.5 text-sm text-slate-700">
                  <div className="space-y-2.5">
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Estado RN</strong> - Estado del reembolso</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">AT (S/N)</strong> - Ajuste por Tecnología</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">AT Detalle</strong> - Detalle del AT</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Monto AT</strong> - Monto de ajuste (manual)</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Monto RN</strong> - Monto de reembolso</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Días Demora Rescate</strong> - Días de demora</span>
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Pago Demora Rescate</strong> - Pago por demora</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Pago Outlier Superior</strong> - Pago por outlier</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Precio Base por Tramo</strong> - Precio base</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Valor GRD</strong> - Valor GRD</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Monto Final</strong> - Monto final (calculado por backend)</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Documentación</strong> - Documentación necesaria</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isGestion && (
          <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 border-t border-fuchsia-200 px-6 py-6">
            <div className="flex items-center gap-3 mb-3">
              <img src={icon4} alt="Gestión" className="w-7 h-7 object-contain" style={{ filter: 'invert(17%) sepia(96%) saturate(5067%) hue-rotate(300deg) brightness(95%) contrast(96%)' }} />
              <h3 className="text-base font-open-sauce font-medium text-fuchsia-900">Campos editables para Gestión</h3>
            </div>
            <div className="text-sm text-slate-700 mb-4">
              <p className="flex items-start gap-2">
                <span className="text-fuchsia-500 mt-1">•</span>
                <span><strong className="font-semibold text-slate-900">VALIDADO</strong> - Aprobar o rechazar episodios</span>
              </p>
            </div>
            {/* Instrucciones primero */}
            <div className="mb-6 -mx-6 px-6 py-4 bg-white/80 border-l-4 border-fuchsia-500 rounded-r-lg shadow-sm">
              <h4 className="text-sm font-semibold text-fuchsia-900 mb-3">Instrucciones</h4>
              <div className="space-y-2.5">
                <p className="text-sm text-slate-700 flex items-start gap-2.5">
                  <span className="text-fuchsia-500 mt-0.5 font-bold">•</span>
                  <span>Haz clic en el campo VALIDADO para aprobar o rechazar episodios. Los cambios se reflejan inmediatamente en el sistema.</span>
                </p>
                <p className="text-sm text-slate-700 flex items-start gap-2.5">
                  <span className="text-fuchsia-500 mt-0.5 font-bold">•</span>
                  <span>Los cambios se guardan automáticamente en el servidor al confirmar la edición.</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Div 3: Filtros y búsqueda */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Buscar</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Episodio, nombre, RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por validación */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
            <select
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
            <select
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
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
              className="w-full px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm hover:bg-indigo-100 hover:border-indigo-300 active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : 'Recargar Episodios'}
            </button>
          </div>
        </div>
      </div>


      {/* Div 4: Tabla de episodios */}
      <div className="mb-3">
        <p className="text-sm font-light text-slate-500 italic">Desliza hacia el lado para ver todos los campos</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Cargando episodios...</h3>
              <p className="text-slate-600">
              Conectando con el servidor para obtener los datos
            </p>
          </div>
        ) : episodios.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay episodios cargados</h3>
            <p className="text-slate-600 mb-6">
              Los episodios aparecerán aquí una vez que se carguen desde el backend
            </p>
            <Link to="/carga" className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">
              Cargar Archivo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                  {FINAL_COLUMNS.map(([header, key, editable]) => (
                    <th 
                      key={key}
                      className={`px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap ${
                        editable ? 'bg-blue-50' : ''
                      }`}
                      title={editable ? 'Campo editable' : 'Campo de solo lectura'}
                    >
                      {header}
                    </th>
                  ))}
                <th className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
                {filteredEpisodios.map((episodio, rowIndex) => (
                  <tr key={episodio.episodio} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    {FINAL_COLUMNS.map(([header, key, editable]) => {
                      const value = key.split('.').reduce((acc: any, k) => acc?.[k], episodio as any);
                      const isEditable = editableFields.has(key);
                      
                      return (
                        <td 
                          key={key}
                          className={`px-4 py-3 text-slate-700 ${
                            isEditable ? 'bg-blue-50/50 font-medium cursor-pointer hover:bg-blue-100/70 transition-colors' : ''
                          }`}
                          onClick={() => isEditable && startEdit(rowIndex, key, value)}
                          title={isEditable ? 'Hacer clic para editar' : ''}
                        >
                          {renderCellValue(key, value, episodio, rowIndex)}
                  </td>
                      );
                    })}
                  <td className="px-4 py-3">
                      <div className="flex gap-3 items-center">
                        <Link
                          to={`/episodios/${episodio.episodio}`}
                          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:underline transition-colors"
                        >
                          Ver
                        </Link>
                    <Link 
                          to={`/episodios/${episodio.episodio}#documentos`}
                          className="text-purple-600 hover:text-purple-700 font-medium text-sm hover:underline transition-colors"
                    >
                          Docs
                    </Link>
                      </div>
                      {/* Indicadores de validación */}
                      {(validationErrors[episodio.episodio]?.length > 0 || validationWarnings[episodio.episodio]?.length > 0) && (
                        <div className="mt-2 space-y-1">
                          {validationErrors[episodio.episodio]?.map((error, idx) => (
                            <div key={idx} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded" title={error}>
                              ⚠️ {error}
                            </div>
                          ))}
                          {validationWarnings[episodio.episodio]?.map((warning, idx) => (
                            <div key={idx} className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded" title={warning}>
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
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
            Mostrando {filteredEpisodios.length} de {episodios.length} episodios
          </div>
        )}
      </div>
    </main>
  );
}
