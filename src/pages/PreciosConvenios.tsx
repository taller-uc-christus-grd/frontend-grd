import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface PrecioConvenio {
  id?: string;
  aseguradora: string;
  nombre_asegi: string;
  convenio: string;
  descr_convenio: string;
  tipoAsegurad: string;
  tipoConvenio: string;
  tramo: string;
  fechaAdmision: string;
  fechaFin: string;
  precio: number;
}

export default function PreciosConvenios() {
  const { user } = useAuth();
  const [precios, setPrecios] = useState<PrecioConvenio[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    loadPrecios();
  }, []);

  const loadPrecios = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/precios-convenios');
      const datos = response.data || [];
      
      // Formatear fechas al cargar desde el backend
      const preciosFormateados = datos.map((p: any) => ({
        ...p,
        fechaAdmision: formatDate(p.fechaAdmision),
        fechaFin: formatDate(p.fechaFin),
      }));
      
      setPrecios(preciosFormateados);
      console.log('✅ Precios cargados:', preciosFormateados.length);
    } catch (error: any) {
      console.error('❌ Error al cargar precios:', error);
      setMessage(`Error al cargar los precios: ${error.response?.data?.message || error.message}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (rowIndex: number, field: string) => {
    const precio = precios[rowIndex];
    const value = (precio as any)[field];
    setEditingCell({ row: rowIndex, field });
    setEditValue(value?.toString() || '');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveCell = async (rowIndex: number, field: string) => {
    if (!editingCell || editingCell.row !== rowIndex || editingCell.field !== field) return;

    setSaving(true);
    try {
      const precio = precios[rowIndex];
      const updated = { ...precio };
      
      // Convertir tipos según el campo
      if (field === 'precio') {
        const precioNum = parseFloat(editValue);
        if (isNaN(precioNum)) {
          setMessage('❌ Error: El precio debe ser un número válido');
          setTimeout(() => setMessage(''), 3000);
          setSaving(false);
          return;
        }
        (updated as any)[field] = precioNum;
      } else if (field === 'fechaAdmision' || field === 'fechaFin') {
        // Validar formato de fecha
        if (editValue && !editValue.match(/^\d{2}-\d{2}-\d{4}$/)) {
          setMessage(`❌ Error: La fecha debe estar en formato DD-MM-YYYY`);
          setTimeout(() => setMessage(''), 3000);
          setSaving(false);
          return;
        }
        (updated as any)[field] = editValue;
      } else {
        // Campos de texto: permitir vacío solo si no es requerido
        (updated as any)[field] = editValue;
      }

      // Preparar payload según el tipo de campo
      let payload: any = {};
      
      if (field === 'precio') {
        payload[field] = (updated as any)[field];
      } else if (field === 'fechaAdmision' || field === 'fechaFin') {
        // Si es fecha, convertir a ISO (YYYY-MM-DD) para el backend
        if (editValue && editValue.trim()) {
          payload[field] = parseDate(editValue);
        } else {
          payload[field] = null;
        }
      } else if (field === 'tramo') {
        // Tramo puede ser null o vacío
        payload[field] = editValue.trim() || null;
      } else {
        // Campos de texto - permitir vacíos
        payload[field] = editValue || '';
      }

      // Si tiene ID, actualizar campo específico
      if (precio.id) {
        console.log('🔄 Actualizando celda:', { field, payload, id: precio.id });
        await api.patch(`/api/precios-convenios/${precio.id}`, payload);
        
        // Actualizar localmente con el valor editado (formato visual)
        setPrecios(prev => prev.map((p, i) => i === rowIndex ? updated : p));
      } else {
        // Crear nuevo registro - actualizar el campo editado y enviar todo el objeto actualizado
        // Solo actualizar el campo que se está editando
        (updated as any)[field] = payload[field];
        
        // Preparar datos para crear - incluir todos los campos (pueden estar vacíos)
        const dataToCreate: any = {
          aseguradora: updated.aseguradora || '',
          nombre_asegi: updated.nombre_asegi || '',
          convenio: updated.convenio || '',
          descr_convenio: updated.descr_convenio || '',
          tipoAsegurad: updated.tipoAsegurad || '',
          tipoConvenio: updated.tipoConvenio || '',
          tramo: updated.tramo || null,
          precio: updated.precio || 0,
        };

        // Manejar fechas - solo enviar si tienen valor válido
        if (field === 'fechaAdmision') {
          dataToCreate.fechaAdmision = payload[field];
        } else if (updated.fechaAdmision && updated.fechaAdmision.trim()) {
          dataToCreate.fechaAdmision = parseDate(updated.fechaAdmision);
        } else {
          dataToCreate.fechaAdmision = null;
        }

        if (field === 'fechaFin') {
          dataToCreate.fechaFin = payload[field];
        } else if (updated.fechaFin && updated.fechaFin.trim()) {
          dataToCreate.fechaFin = parseDate(updated.fechaFin);
        } else {
          dataToCreate.fechaFin = null;
        }

        // Actualizar el campo que se acaba de editar
        dataToCreate[field] = payload[field];

        console.log('📤 Creando nuevo precio (puede tener campos vacíos):', dataToCreate);
        const response = await api.post('/api/precios-convenios', dataToCreate);
        
        // Actualizar el registro local con el ID recibido
        const nuevoRegistro = { ...updated, id: response.data.id || response.data.data?.id };
        setPrecios(prev => prev.map((p, i) => i === rowIndex ? nuevoRegistro : p));
        
        setEditingCell(null);
        setEditValue('');
        setMessage('✅ Campo guardado correctamente');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // Actualizar localmente
      setPrecios(prev => prev.map((p, i) => i === rowIndex ? updated : p));
      setEditingCell(null);
      setEditValue('');
      setMessage('✅ Cambios guardados correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('❌ Error al guardar:', error);
      console.error('📋 Detalles del error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.response?.data?.message,
        errors: error.response?.data?.errors,
        field,
        editValue,
        precioActualizado: precio,
      });
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error desconocido al guardar';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Si hay mensaje directo
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Si hay array de errores (validación)
        else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: any) => e.message || e).join(', ');
        }
        // Si hay objeto de errores (validación de campos)
        else if (errorData.errors && typeof errorData.errors === 'object') {
          const fieldErrors = Object.entries(errorData.errors).map(([key, value]) => 
            `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
          ).join(' | ');
          errorMessage = `Errores de validación: ${fieldErrors}`;
        }
        // Si hay error general
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage(`❌ Error: ${errorMessage}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const addRow = () => {
    const nuevaFila: PrecioConvenio = {
      aseguradora: '',
      nombre_asegi: '',
      convenio: '',
      descr_convenio: '',
      tipoAsegurad: '',
      tipoConvenio: '',
      tramo: '',
      fechaAdmision: '',
      fechaFin: '',
      precio: 0,
    };
    setPrecios([...precios, nuevaFila]);
    // Iniciar edición en el primer campo de la nueva fila
    const newIndex = precios.length;
    setTimeout(() => startEdit(newIndex, 'aseguradora'), 100);
  };

  const deleteRow = async (rowIndex: number) => {
    const precio = precios[rowIndex];
    if (!precio.id) {
      // Si no tiene ID, solo eliminar localmente
      setPrecios(prev => prev.filter((_, i) => i !== rowIndex));
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await api.delete(`/api/precios-convenios/${precio.id}`);
      setPrecios(prev => prev.filter((_, i) => i !== rowIndex));
      setMessage('✅ Registro eliminado correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      setMessage(`❌ Error al eliminar: ${error.response?.data?.message || error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    
    let dateStr = date;
    
    // Si es un objeto Date o viene en formato ISO/DateTime
    if (date instanceof Date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    dateStr = String(date);
    
    // Si viene en formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [year, month, day] = dateStr.substring(0, 10).split('-');
      return `${day}-${month}-${year}`;
    }
    
    // Si ya está en formato DD-MM-YYYY, retornar tal cual
    return dateStr;
  };

  const parseDate = (date: string) => {
    if (!date || !date.trim()) return null;
    
    // Si viene en formato DD-MM-YYYY, convertir a ISO (YYYY-MM-DD)
    if (date.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = date.split('-');
      return `${year}-${month}-${day}`;
    }
    
    // Si ya está en formato ISO, retornar tal cual
    if (date.match(/^\d{4}-\d{2}-\d{2}/)) {
      return date.substring(0, 10); // Solo la parte de fecha, sin hora
    }
    
    // Si no coincide con ningún formato, retornar null
    return null;
  };

  const formatPrecio = (precio: number) => {
    if (!precio && precio !== 0) return '';
    return precio.toLocaleString('es-CL', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const columns = [
    { key: 'aseguradora', label: 'Aseguradora' },
    { key: 'nombre_asegi', label: 'nombre_asegi' },
    { key: 'convenio', label: 'convenio' },
    { key: 'descr_convenio', label: 'descr_convenio' },
    { key: 'tipoAsegurad', label: 'Tipo Asegurad' },
    { key: 'tipoConvenio', label: 'Tipo convenio' },
    { key: 'tramo', label: 'Tramo' },
    { key: 'fechaAdmision', label: 'fecha admisió' },
    { key: 'fechaFin', label: 'fecha fin' },
    { key: 'precio', label: 'Precio' },
  ];

  return (
    <main className="max-w-[1600px] mx-auto px-6 py-10">
      {/* Botón volver */}
      <div className="mb-6">
        <Link to="/dashboard" className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-300/80 shadow-sm transition-all duration-300 inline-block">
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
        <h1 className="text-3xl font-open-sauce font-light bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Precios Convenios
        </h1>
        <p className="text-slate-600 mt-2">
          Gestiona los precios de convenios por aseguradora, tipo y tramo.
        </p>
      </div>

      {/* Mensajes */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Acciones */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={addRow}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2"
        >
          <span>+</span>
          Agregar Fila
        </button>
        <button
          onClick={loadPrecios}
          disabled={loading}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Recargar'}
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
              <p className="text-xs text-slate-600">Desliza hacia el lado para ver todos los campos</p>
            </div>
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200 last:border-r-0"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">
                      Cargando...
                    </td>
                  </tr>
                ) : precios.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">
                      No hay precios registrados. Haz clic en "Agregar Fila" para crear uno nuevo.
                    </td>
                  </tr>
                ) : (
                  precios.map((precio, rowIndex) => (
                    <tr key={precio.id || rowIndex} className="hover:bg-slate-50">
                      {columns.map(col => {
                        const isEditing = editingCell?.row === rowIndex && editingCell?.field === col.key;
                        const value = (precio as any)[col.key];

                        return (
                          <td
                            key={col.key}
                            className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200 last:border-r-0"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                {col.key === 'fechaAdmision' || col.key === 'fechaFin' ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="px-2 py-1 text-xs border rounded w-28"
                                    placeholder="DD-MM-YYYY"
                                    autoFocus
                                  />
                                ) : col.key === 'precio' ? (
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="px-2 py-1 text-xs border rounded w-24"
                                    step="0.001"
                                    min="0"
                                    autoFocus
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="px-2 py-1 text-xs border rounded w-full"
                                    autoFocus
                                  />
                                )}
                                <button
                                  onClick={() => saveCell(rowIndex, col.key)}
                                  disabled={saving}
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
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
                            ) : (
                              <div
                                onClick={() => startEdit(rowIndex, col.key)}
                                className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                                title="Haz clic para editar"
                              >
                                {col.key === 'fechaAdmision' || col.key === 'fechaFin' 
                                  ? formatDate(value)
                                  : col.key === 'precio' 
                                  ? formatPrecio(value)
                                  : value || '-'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => deleteRow(rowIndex)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          title="Eliminar fila"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

