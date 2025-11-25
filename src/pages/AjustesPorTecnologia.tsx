import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface AjusteTecnologia {
  id?: string;
  at: string;
  monto: number;
}

export default function AjustesPorTecnologia() {
  const { user } = useAuth();
  const [ajustes, setAjustes] = useState<AjusteTecnologia[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    loadAjustes();
  }, []);

  const loadAjustes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/ajustes-tecnologia');
      const datos = response.data || [];
      setAjustes(datos);
      console.log('✅ Ajustes cargados:', datos.length);
    } catch (error: any) {
      console.error('❌ Error al cargar ajustes:', error);
      setMessage(`Error al cargar los ajustes: ${error.response?.data?.message || error.message}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (rowIndex: number, field: string) => {
    const ajuste = ajustes[rowIndex];
    const value = (ajuste as any)[field];
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
      const ajuste = ajustes[rowIndex];
      const updated = { ...ajuste };
      
      // Convertir tipos según el campo
      if (field === 'monto') {
        const montoNum = parseFloat(editValue);
        if (isNaN(montoNum)) {
          setMessage('❌ Error: El monto debe ser un número válido');
          setTimeout(() => setMessage(''), 3000);
          setSaving(false);
          return;
        }
        (updated as any)[field] = montoNum;
      } else {
        // Campo de texto AT
        (updated as any)[field] = editValue;
      }

      // Preparar payload según el tipo de campo
      let payload: any = {};
      
      if (field === 'monto') {
        payload[field] = (updated as any)[field];
      } else {
        payload[field] = editValue || '';
      }

      // Si tiene ID, actualizar campo específico
      if (ajuste.id) {
        console.log('🔄 Actualizando celda:', { field, payload, id: ajuste.id });
        await api.patch(`/api/ajustes-tecnologia/${ajuste.id}`, payload);
        
        // Actualizar localmente con el valor editado
        setAjustes(prev => prev.map((a, i) => i === rowIndex ? updated : a));
      } else {
        // Crear nuevo registro - actualizar el campo editado y enviar todo el objeto actualizado
        (updated as any)[field] = payload[field];
        
        // Preparar datos para crear - incluir todos los campos (pueden estar vacíos)
        const dataToCreate: any = {
          at: updated.at || '',
          monto: updated.monto || 0,
        };

        // Actualizar el campo que se acaba de editar
        dataToCreate[field] = payload[field];

        console.log('📤 Creando nuevo ajuste (puede tener campos vacíos):', dataToCreate);
        const response = await api.post('/api/ajustes-tecnologia', dataToCreate);
        
        // Actualizar el registro local con el ID recibido
        const nuevoRegistro = { ...updated, id: response.data.id || response.data.data?.id };
        setAjustes(prev => prev.map((a, i) => i === rowIndex ? nuevoRegistro : a));
        
        setEditingCell(null);
        setEditValue('');
        setMessage('✅ Campo guardado correctamente');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // Actualizar localmente
      setAjustes(prev => prev.map((a, i) => i === rowIndex ? updated : a));
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
        ajusteActualizado: ajuste,
      });
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error desconocido al guardar';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: any) => e.message || e).join(', ');
        } else if (errorData.errors && typeof errorData.errors === 'object') {
          const fieldErrors = Object.entries(errorData.errors).map(([key, value]) => 
            `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
          ).join(' | ');
          errorMessage = `Errores de validación: ${fieldErrors}`;
        } else if (errorData.error) {
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
    const nuevaFila: AjusteTecnologia = {
      at: '',
      monto: 0,
    };
    setAjustes([...ajustes, nuevaFila]);
    // Iniciar edición en el primer campo de la nueva fila
    const newIndex = ajustes.length;
    setTimeout(() => startEdit(newIndex, 'at'), 100);
  };

  const deleteRow = async (rowIndex: number) => {
    const ajuste = ajustes[rowIndex];
    if (!ajuste.id) {
      // Si no tiene ID, solo eliminar localmente
      setAjustes(prev => prev.filter((_, i) => i !== rowIndex));
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await api.delete(`/api/ajustes-tecnologia/${ajuste.id}`);
      setAjustes(prev => prev.filter((_, i) => i !== rowIndex));
      setMessage('✅ Registro eliminado correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      setMessage(`❌ Error al eliminar: ${error.response?.data?.message || error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const formatMonto = (monto: number) => {
    if (!monto && monto !== 0) return '';
    return `$${monto.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const columns = [
    { key: 'at', label: 'AT' },
    { key: 'monto', label: 'Monto' },
  ];

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Botón volver */}
      <div className="mb-6">
        <Link to="/dashboard" className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-300/80 shadow-sm transition-all duration-300 inline-block">
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
        <h1 className="text-3xl font-open-sauce font-light bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Ajustes Por Tecnología
        </h1>
        <p className="text-slate-600 mt-2">
          Gestiona los ajustes por tecnología (AT) y sus montos asociados.
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
          onClick={loadAjustes}
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
                ) : ajustes.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">
                      No hay ajustes registrados. Haz clic en "Agregar Fila" para crear uno nuevo.
                    </td>
                  </tr>
                ) : (
                  ajustes.map((ajuste, rowIndex) => (
                    <tr key={ajuste.id || rowIndex} className="hover:bg-slate-50">
                      {columns.map(col => {
                        const isEditing = editingCell?.row === rowIndex && editingCell?.field === col.key;
                        const value = (ajuste as any)[col.key];

                        return (
                          <td
                            key={col.key}
                            className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200 last:border-r-0"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                {col.key === 'monto' ? (
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="px-2 py-1 text-xs border rounded w-32"
                                    step="0.01"
                                    min="0"
                                    autoFocus
                                    placeholder="0"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="px-2 py-1 text-xs border rounded w-full"
                                    autoFocus
                                    placeholder="Nombre del AT"
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
                                {col.key === 'monto' 
                                  ? formatMonto(value)
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

