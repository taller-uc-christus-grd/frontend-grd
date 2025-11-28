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
  const [filterConvenio, setFilterConvenio] = useState<string>(''); // Filtro de convenio (solo para finanzas)
  
  // Estados para edición
  const [editingCell, setEditingCell] = useState<{row: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  
  // Estados para ajustes de tecnología
  const [ajustesTecnologia, setAjustesTecnologia] = useState<Array<{id?: string, at?: string, monto?: number}>>([]);
  const [loadingAjustes, setLoadingAjustes] = useState(false);
  
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

    // Filtro por convenio (solo para finanzas, filtra en tiempo real)
    if (isFinanzas && filterConvenio.trim() !== '') {
      const convenioTerm = filterConvenio.trim().toLowerCase();
      filtered = filtered.filter(ep => {
        const convenio = ep.convenio?.toLowerCase() || '';
        return convenio.startsWith(convenioTerm);
      });
    }

    return filtered;
  }, [episodios, searchTerm, filterValidated, filterOutlier, filterConvenio, isFinanzas]);

  // Campos editables según rol del usuario
const getEditableFields = () => {
  const editableFields = new Set<string>();
  
  if (isFinanzas) {
    // Finanzas puede editar campos financieros + VALIDADO,
    // EXCEPTO at, atDetalle, montoAT (AT es de codificador/gestión)
    FINAL_COLUMNS.forEach(([header, key, editable]) => {
      if (
        editable &&
        key !== 'at' &&
        key !== 'atDetalle' &&
        key !== 'montoAT'
      ) {
        editableFields.add(key);
      }
    });

    // Nos aseguramos explícitamente que VALIDADO sí está
    editableFields.add('validado');
    
    // Para casos fuera de norma, Finanzas puede hacer override manual de valorGRD y montoFinal
    // Estos campos se agregan dinámicamente cuando el episodio está fuera de norma
    editableFields.add('valorGRD');
    editableFields.add('montoFinal');
  }
  
  if (isCodificador) {
    // Codificador puede editar AT(S/N) y AT Detalle (montoAT es solo lectura)
    editableFields.add('at');
    editableFields.add('atDetalle');
    
    // Para casos fuera de norma, Codificador puede hacer override manual de valorGRD y montoFinal
    editableFields.add('valorGRD');
    editableFields.add('montoFinal');
  }

  if (isGestion) {
    // Gestión NO valida, pero SÍ puede editar ajustes por tecnología y precioBaseTramo
    editableFields.add('at');
    editableFields.add('atDetalle');
    editableFields.add('precioBaseTramo');
  }
  
  return editableFields;
};

  const editableFields = getEditableFields();

  // Log para verificar permisos
  console.log('🔐 Permisos del usuario:', {
    rol: user?.role,
    isFinanzas,
    isGestion,
    isCodificador,
    editableFields: Array.from(editableFields)
  });

  // Función para iniciar edición
  const startEdit = (rowIndex: number, field: string, currentValue: any) => {
    // Verificar permisos según rol
    if (!editableFields.has(field)) return;

    // AT y AT Detalle: Codificador o Gestión
    if (field === 'at' || field === 'atDetalle') {
      if (!isCodificador && !isGestion) return;
    }

    // precioBaseTramo: Gestión o Finanzas
    if (field === 'precioBaseTramo') {
      if (!isGestion && !isFinanzas) return;
    }

    // valorGRD y montoFinal: solo editables para Finanzas o Codificador cuando el episodio está fuera de norma
    if (field === 'valorGRD' || field === 'montoFinal') {
      const episodio = filteredEpisodios[rowIndex];
      const esFueraDeNorma = episodio.grupoDentroNorma === false;
      const tienePermiso = (isFinanzas || isCodificador);
      if (!esFueraDeNorma || !tienePermiso) {
        return;
      }
    }

    // VALIDADO: solo Finanzas
    if (field === 'validado' && !isFinanzas) return;

    // Otros campos: solo Finanzas (campos financieros)
    if (
      field !== 'validado' &&
      field !== 'at' &&
      field !== 'atDetalle' &&
      field !== 'precioBaseTramo' &&
      field !== 'valorGRD' &&
      field !== 'montoFinal' &&
      !isFinanzas
    ) {
      return;
    }
    
    setEditingCell({ row: rowIndex, field });
    
    // Convertir valores según el tipo de campo
    if (field === 'validado') {
      // Convertir boolean/null a string para el dropdown
      if (currentValue === true) {
        setEditValue('aprobado');
      } else if (currentValue === false) {
        setEditValue('rechazado');
      } else {
        setEditValue('pendiente'); // Default
      }
    } else if (field === 'at') {
      // Convertir boolean a "S"/"N" o mantener "S"/"N" si ya es string
      // También manejar valores null/undefined
      if (currentValue === true || currentValue === 'S' || currentValue === 's') {
        setEditValue('S');
      } else if (currentValue === false || currentValue === 'N' || currentValue === 'n' || currentValue === null || currentValue === undefined) {
        setEditValue('N');
      } else {
        setEditValue('N'); // Default
      }
    } else if (field === 'atDetalle') {
      // Verificar que at sea "S" antes de permitir editar atDetalle
      const episodio = filteredEpisodios[rowIndex];
      const atValue = episodio.at;
      const atEsS = atValue === true || String(atValue || '').toUpperCase() === 'S';
      
      if (!atEsS) {
        console.warn('⚠️ No se puede editar atDetalle porque AT(S/N) no es "Sí"');
        return; // No permitir editar si at no es S
      }
      
      // Manejar null, undefined y strings vacíos para atDetalle
      // Asegurar que el valor coincida exactamente con uno de los valores disponibles
      const atDetalleVal = currentValue ? String(currentValue).trim() : '';
      setEditValue(atDetalleVal);
      console.log('🔄 Iniciando edición de atDetalle:', { 
        currentValue, 
        atDetalleVal, 
        ajustesCount: ajustesTecnologia.length,
        ajustesDisponibles: ajustesTecnologia.map(a => a.at?.trim()).filter(Boolean),
        valorEncontradoEnAjustes: ajustesTecnologia.some(a => (a.at || '').trim() === atDetalleVal)
      });
    } else if (field === 'estadoRN') {
      // Manejar null, undefined y strings vacíos - convertir a 'Pendiente' si es null
      if (currentValue === null || currentValue === undefined || currentValue === '') {
        setEditValue('Pendiente');
      } else {
        setEditValue(String(currentValue));
      }
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
      
      // Preparar payload base
      let payload: any = { [field]: validatedValue };
      
      if (field === 'at') {
        // Normalizar: el editValue ya viene como 'S' o 'N' del dropdown
        // Asegurarse de que sea 'S' o 'N'
        const atVal = String(editValue || '').trim().toUpperCase();
        validatedValue = (atVal === 'S' || atVal === 'SÍ' || atVal === 'SI' || atVal === 'SÍ') ? 'S' : 'N';
        console.log('📤 AT validado para enviar:', { 
          validatedValue, 
          editValue, 
          atVal,
          tipo: typeof editValue
        });
        
        // Preparar payload
        payload = { [field]: validatedValue };
        
        // Si se está cambiando a "N", también limpiar atDetalle y montoAT
        if (validatedValue === 'N') {
          // IMPORTANTE: Solo enviar 'at' y 'atDetalle' - NO enviar montoAT
          // El backend debe limpiar montoAT automáticamente cuando at = 'N'
          payload = {
            at: 'N',
            atDetalle: null
          };
          console.log('📤 Limpiando atDetalle porque AT = N (backend debe limpiar montoAT automáticamente)');
        } else if (validatedValue === 'S') {
          // Si se cambia a "S", mantener atDetalle y montoAT existentes (no limpiar)
          payload = { [field]: 'S' };
          console.log('📤 Cambiando AT a S, manteniendo atDetalle y montoAT existentes');
        }
      }
      
      if (field === 'estadoRN') {
        // Normalizar: aceptar valores válidos o convertir a null
        const estadoVal = String(editValue).trim();
        if (estadoVal === '' || estadoVal === 'Pendiente' || !['Aprobado', 'Pendiente', 'Rechazado'].includes(estadoVal)) {
          // Pendiente se envía como null al backend
          validatedValue = null;
        } else {
          validatedValue = estadoVal; // Case-sensitive exacto: 'Aprobado' o 'Rechazado'
        }
        payload = { [field]: validatedValue };
        console.log('📤 estadoRN validado para enviar:', validatedValue, 'desde editValue:', editValue);
      }
      
      if (field === 'atDetalle') {
        // Normalizar: aceptar string o convertir a null si está vacío
        const atDetalleVal = editValue ? String(editValue).trim() : '';
        validatedValue = atDetalleVal === '' ? null : atDetalleVal;
        // IMPORTANTE: Solo enviar atDetalle, NO enviar montoAT
        // El backend debe autocompletar montoAT automáticamente según atDetalle
        payload = { [field]: validatedValue };
        console.log('📤 atDetalle validado para enviar (SIN montoAT - backend lo autocompleta):', { 
          validatedValue, 
          editValue,
          ajustesDisponibles: ajustesTecnologia.map(a => ({ at: a.at?.trim(), monto: a.monto }))
        });
        
        // NO enviar montoAT - el backend debe autocompletarlo automáticamente
        // Ver documento PROMPT_BACKEND_AUTOCOMPLETAR_MONTO_AT.md para la implementación del backend
      }
      
      if (field === 'validado') {
        // Convertir string del dropdown a boolean/null
        if (editValue === 'aprobado') {
          validatedValue = true;
        } else if (editValue === 'rechazado') {
          validatedValue = false;
        } else {
          validatedValue = null; // pendiente
        }
        payload = { [field]: validatedValue };
      }
      
      // Enviar el campo editado (y montoAT si aplica) al backend
      // El backend se encarga de todos los cálculos usando los catálogos
      try {
        // Intentar usar id si existe, sino usar episodio
        const episodeId = (episodio as any).id || episodio.episodio;
        const url = `/api/episodios/${episodeId}`;
        
        console.log('🔄 Enviando PATCH a:', url);
        console.log('📦 Datos enviados (PAYLOAD):', JSON.stringify(payload, null, 2));
        console.log('🆔 ID del episodio (usado):', episodeId);
        console.log('👤 Usuario actual:', {
          rol: user?.role,
          email: user?.email,
          tokenLength: user?.token?.length
        });
        console.log('🔍 Datos del episodio ANTES:', {
          episodio: episodio.episodio,
          id: (episodio as any).id,
          at: episodio.at,
          atDetalle: episodio.atDetalle,
          montoAT: episodio.montoAT,
          field: field
        });
        
        // Verificar que el token esté presente
        const token = user?.token || localStorage.getItem('grd_user') ? JSON.parse(localStorage.getItem('grd_user') || '{}')?.token : null;
        console.log('🔑 Token presente:', !!token, 'Longitud:', token?.length);
        
        const response = await api.patch(url, payload);
        
        console.log(`✅ Campo ${field} actualizado exitosamente para episodio ${episodio.episodio}`);
        
        // Si se guardó atDetalle, hacer GET al backend para obtener el montoAT actualizado automáticamente
        let updatedEpisodioFromBackend: any;
        if (field === 'atDetalle') {
          console.log('🔄 Haciendo GET al backend para obtener montoAT actualizado después de guardar atDetalle...');
          try {
            const getResponse = await api.get(url);
            // El backend puede devolver el episodio directamente en response.data o dentro de response.data.data
            updatedEpisodioFromBackend = getResponse.data?.data || getResponse.data;
            
            // Si es un array, tomar el primer elemento
            if (Array.isArray(updatedEpisodioFromBackend)) {
              updatedEpisodioFromBackend = updatedEpisodioFromBackend[0];
            }
            
            console.log('✅ GET exitoso - Episodio refrescado con montoAT actualizado:', {
              atDetalle: updatedEpisodioFromBackend?.atDetalle,
              montoAT: updatedEpisodioFromBackend?.montoAT
            });
          } catch (getError: any) {
            console.warn('⚠️ Error al hacer GET después de guardar atDetalle, usando respuesta del PATCH:', getError);
            updatedEpisodioFromBackend = response.data?.data || response.data;
          }
        } else {
          // Para otros campos, usar la respuesta del PATCH directamente
          updatedEpisodioFromBackend = response.data?.data || response.data;
        }
        
        // Si es un array, tomar el primer elemento
        if (Array.isArray(updatedEpisodioFromBackend)) {
          updatedEpisodioFromBackend = updatedEpisodioFromBackend[0];
        }
        
        // Si es un array, tomar el primer elemento
        if (Array.isArray(updatedEpisodioFromBackend)) {
          updatedEpisodioFromBackend = updatedEpisodioFromBackend[0];
        }
        
        // Asegurar que tenemos un objeto
        if (!updatedEpisodioFromBackend || typeof updatedEpisodioFromBackend !== 'object') {
          console.error('❌ ERROR: La respuesta del backend no contiene un episodio válido:', updatedEpisodioFromBackend);
          throw new Error('El backend no devolvió un episodio válido');
        }
        
        updatedEpisodioFromBackend = { ...updatedEpisodioFromBackend };
        
        console.log('✅ Episodio extraído del backend:', updatedEpisodioFromBackend);
        
        // Normalizar TODOS los campos que pueden venir en diferentes formatos
        // Normalizar AT: convertir boolean a "S"/"N"
        const atValue = updatedEpisodioFromBackend.at as any;
        console.log('🔄 Normalizando AT del backend:', { 
          atValue, 
          tipo: typeof atValue,
          esTrue: atValue === true,
          esFalse: atValue === false,
          esS: atValue === 'S',
          esN: atValue === 'N',
          valorString: String(atValue || '')
        });
        
        // IMPORTANTE: Normalizar AT correctamente - USAR SIEMPRE EL VALOR DEL PAYLOAD QUE ENVIAMOS
        // Si el backend devuelve algo diferente, forzar el valor que enviamos
        if (field === 'at') {
          // Si estamos actualizando AT, usar el valor que enviamos (el validado)
          updatedEpisodioFromBackend.at = validatedValue as any;
          console.log('✅ AT forzado al valor enviado:', validatedValue);
        } else {
          // Si no estamos actualizando AT, normalizar el valor que viene del backend
          if (atValue === true || String(atValue || '').trim().toUpperCase() === 'S' || atValue === 'S') {
            updatedEpisodioFromBackend.at = 'S' as any;
            console.log('✅ AT normalizado a: S');
          } else if (atValue === false || String(atValue || '').trim().toUpperCase() === 'N' || atValue === 'N') {
            updatedEpisodioFromBackend.at = 'N' as any;
            console.log('✅ AT normalizado a: N');
          } else {
            // Si viene null, undefined, o algo raro, mantener el valor actual del episodio
            const atActual = episodio.at;
            const atActualStr = String(atActual || '');
            const atEsS = atActual === true || atActualStr.toUpperCase() === 'S';
            updatedEpisodioFromBackend.at = atEsS ? 'S' : 'N' as any;
            console.log('⚠️ AT tenía valor inesperado, usando valor del episodio actual:', atActual, '->', updatedEpisodioFromBackend.at);
          }
        }
        
        // Normalizar estadoRN: asegurar que sea string o null
        const estadoRNValue = updatedEpisodioFromBackend.estadoRN as any;
        if (estadoRNValue === null || estadoRNValue === undefined || estadoRNValue === '') {
          updatedEpisodioFromBackend.estadoRN = null as any;
        } else {
          updatedEpisodioFromBackend.estadoRN = String(estadoRNValue) as any;
        }
        
        // Normalizar atDetalle: asegurar que sea string o null
        const atDetalleValue = updatedEpisodioFromBackend.atDetalle as any;
        if (atDetalleValue === null || atDetalleValue === undefined || atDetalleValue === '') {
          updatedEpisodioFromBackend.atDetalle = null as any;
        } else {
          // Asegurar que el valor coincida exactamente con uno de los ajustes disponibles
          const atDetalleTrimmed = String(atDetalleValue).trim();
          const ajusteCoincidente = ajustesTecnologia.find(a => (a.at || '').trim() === atDetalleTrimmed);
          // Usar el valor exacto del ajuste encontrado, o el valor trimmeado si no se encuentra
          updatedEpisodioFromBackend.atDetalle = ajusteCoincidente ? (ajusteCoincidente.at || '').trim() as any : atDetalleTrimmed as any;
        }
        console.log('📥 atDetalle normalizado después del backend:', {
          original: atDetalleValue,
          normalizado: updatedEpisodioFromBackend.atDetalle,
          tipo: typeof updatedEpisodioFromBackend.atDetalle,
          coincideConAjuste: ajustesTecnologia.some(a => (a.at || '').trim() === updatedEpisodioFromBackend.atDetalle)
        });
        
        // Si AT = "N", asegurar que atDetalle y montoAT estén limpios
        if (updatedEpisodioFromBackend.at === 'N' || updatedEpisodioFromBackend.at === false) {
          updatedEpisodioFromBackend.at = 'N' as any;
          updatedEpisodioFromBackend.atDetalle = null as any;
          updatedEpisodioFromBackend.montoAT = 0 as any;
          console.log('🧹 Limpiando atDetalle y montoAT porque AT = N (después del backend)');
        }
        
        // Normalizar campos numéricos: asegurar que sean números
        const numericFields = ['montoAT', 'montoRN', 'pagoOutlierSup', 'pagoDemora', 'precioBaseTramo', 'valorGRD', 'montoFinal', 'diasDemoraRescate'];
        numericFields.forEach(fieldName => {
          const value = (updatedEpisodioFromBackend as any)[fieldName];
          if (value !== null && value !== undefined && !isNaN(value)) {
            (updatedEpisodioFromBackend as any)[fieldName] = typeof value === 'number' ? value : parseFloat(value);
          } else if (fieldName === 'montoAT' && (updatedEpisodioFromBackend.at === 'N' || updatedEpisodioFromBackend.at === false)) {
            // Si montoAT es null/undefined y AT = N, establecer a 0
            (updatedEpisodioFromBackend as any)[fieldName] = 0;
          }
        });
        
        console.log('📦 Episodio normalizado después de recibir del backend:', {
          at: updatedEpisodioFromBackend.at,
          estadoRN: updatedEpisodioFromBackend.estadoRN,
          montoRN: updatedEpisodioFromBackend.montoRN,
          field: field,
          atDetalle: updatedEpisodioFromBackend.atDetalle,
          montoAT: updatedEpisodioFromBackend.montoAT,
          montoATTipo: typeof updatedEpisodioFromBackend.montoAT
        });
        
        // Actualizar la lista local con los datos del backend
        // SIMPLIFICADO: Buscar por episodio (campo episodio) que es único
        setEpisodios(prevEpisodios => {
          const episodioNumber = episodio.episodio;
          const index = prevEpisodios.findIndex(ep => ep.episodio === episodioNumber);
          
          if (index === -1) {
            console.error('❌ ERROR CRÍTICO: No se encontró el episodio', {
              episodioBuscado: episodioNumber,
              totalEpisodios: prevEpisodios.length,
              primeros3: prevEpisodios.slice(0, 3).map(e => e.episodio)
            });
            return prevEpisodios;
          }
          
          console.log('✅ Episodio encontrado en índice:', index, 'episodio:', episodioNumber);
          
          // Crear copia del episodio actualizado con TODOS los campos del backend
          const episodioActualizado = { 
            ...prevEpisodios[index],
            ...updatedEpisodioFromBackend 
          };
          
          // Asegurar que AT esté normalizado
          episodioActualizado.at = updatedEpisodioFromBackend.at;
          
          // Asegurar que estadoRN esté normalizado (usar el valor que enviamos si estamos actualizando estadoRN)
          if (field === 'estadoRN') {
            // Si estamos actualizando estadoRN, usar el valor validado que enviamos
            episodioActualizado.estadoRN = validatedValue as any;
            console.log('✅ estadoRN forzado al valor enviado:', validatedValue);
          } else {
            // Si no estamos actualizando estadoRN, normalizar el valor que viene del backend
            const estadoRNValue = updatedEpisodioFromBackend.estadoRN as any;
            if (estadoRNValue === null || estadoRNValue === undefined || estadoRNValue === '') {
              episodioActualizado.estadoRN = null as any;
            } else {
              episodioActualizado.estadoRN = String(estadoRNValue) as any;
            }
          }
          
          console.log('🔄 ACTUALIZANDO episodio:', {
            index,
            episodio: episodioNumber,
            campo: field,
            atANTES: prevEpisodios[index].at,
            atDESPUES: episodioActualizado.at,
            tipoAntes: typeof prevEpisodios[index].at,
            tipoDespues: typeof episodioActualizado.at
          });
          
          // Crear nuevo array con el episodio actualizado
          const updated = [
            ...prevEpisodios.slice(0, index),
            episodioActualizado,
            ...prevEpisodios.slice(index + 1)
          ];
          
          // VERIFICAR que se actualizó correctamente
          const episodioVerificado = updated[index];
          console.log('✅ VERIFICACIÓN después de actualizar:', {
            episodio: episodioVerificado.episodio,
            at: episodioVerificado.at,
            atTipo: typeof episodioVerificado.at,
            coincide: episodioVerificado.episodio === episodioNumber
          });
          
          return updated;
        });
        
        // Esperar un tick para que React procese la actualización del estado antes de cerrar la edición
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Cerrar modo edición DESPUÉS de actualizar el estado para que se actualice la visualización
        setEditingCell(null);
        setEditValue('');
        
        // Mostrar mensaje de confirmación con información adicional si es atDetalle
        let mensaje = `✅ Campo ${field} guardado exitosamente`;
        if (field === 'atDetalle') {
          mensaje = `✅ AT Detalle guardado exitosamente. El Monto AT se autocompletará automáticamente.`;
        } else if (field === 'at' && validatedValue === 'N') {
          mensaje = `✅ AT(S/N) = No. AT Detalle y Monto AT fueron limpiados`;
        } else if (field === 'at' && validatedValue === 'S') {
          mensaje = `✅ AT(S/N) = Sí guardado exitosamente`;
        }
        setSaveMessage(mensaje);
        setTimeout(() => setSaveMessage(''), 3000);
        
      } catch (backendError: any) {
        console.error('❌ Error al guardar en backend:', backendError);
        
        // Extraer información detallada del error
        const errorData = backendError.response?.data || {};
        const errorDetails = {
          status: backendError.response?.status,
          statusText: backendError.response?.statusText,
          message: errorData.message || errorData.error || errorData.mensaje,
          stack: errorData.stack,
          data: errorData,
          url: backendError.config?.url,
          method: backendError.config?.method,
          fullUrl: backendError.config?.baseURL + backendError.config?.url,
          payload: backendError.config?.data
        };
        
        console.error('📋 Detalles completos del error:', errorDetails);
        
        // NO revertir cambios locales - mantener el estado actual
        // NO cerrar la edición si hay un error - permitir que el usuario intente de nuevo
        
        let errorMessage = 'Error al guardar los cambios';
        
        if (backendError.response?.status === 404) {
          errorMessage = `El episodio ${episodio.episodio} no fue encontrado en el servidor. Verifica que el ID del episodio sea correcto.`;
        } else if (backendError.response?.status === 400) {
          errorMessage = `Datos inválidos: ${errorDetails.message || 'El valor ingresado no es válido'}`;
        } else if (backendError.response?.status === 401) {
          errorMessage = 'No tienes permisos para realizar esta acción. Por favor, inicia sesión nuevamente.';
        } else if (backendError.response?.status === 403) {
          // Error 403: Forbidden - sin permisos para esta acción específica
          console.error('🚫 Error 403 - Acceso denegado:', {
            status: backendError.response?.status,
            statusText: backendError.response?.statusText,
            field: field,
            rol: user?.role,
            episodio: episodio.episodio,
            mensajeBackend: errorDetails.message,
            errorData: errorData,
            payloadEnviado: payload,
            url: errorDetails.url,
            fullUrl: errorDetails.fullUrl
          });
          
          if (errorDetails.message) {
            errorMessage = errorDetails.message;
          } else {
            errorMessage = `Acceso denegado: No tienes permisos para editar el campo "${field}". Tu rol actual es "${user?.role}". Solo el rol "codificador" puede editar los campos AT(S/N) y AT Detalle.`;
          }
        } else if (backendError.response?.status === 500) {
          // Error 500: mostrar el mensaje del backend si está disponible
          if (errorDetails.message) {
            // Si el mensaje contiene "acceso denegado" o "access denied", es un problema de permisos
            if (errorDetails.message.toLowerCase().includes('acceso denegado') || 
                errorDetails.message.toLowerCase().includes('access denied')) {
              errorMessage = `Acceso denegado: ${errorDetails.message}. Verifica que tu rol (${user?.role}) tenga permisos para editar "${field}".`;
              console.error('🚫 Error 500 - Acceso denegado:', {
                field: field,
                rol: user?.role,
                episodio: episodio.episodio,
                mensajeBackend: errorDetails.message,
                payloadEnviado: payload
              });
            } else if (errorDetails.message.includes('column') || errorDetails.message.includes('does not exist')) {
              errorMessage = `Error en la base de datos: ${errorDetails.message}. Contacta al administrador.`;
            } else if (errorDetails.message.includes('Prisma')) {
              errorMessage = `Error en la base de datos: ${errorDetails.message}. Verifica la configuración del servidor.`;
            } else {
              errorMessage = `Error del servidor: ${errorDetails.message}`;
            }
          } else {
            errorMessage = 'Error del servidor. Por favor, contacta al administrador o intenta nuevamente más tarde.';
          }
        } else if (errorDetails.message) {
          errorMessage = errorDetails.message;
        } else if (backendError.message) {
          errorMessage = backendError.message;
        }
        
        // Mostrar mensaje de error al usuario
        setSaveMessage(`❌ ${errorMessage}`);
        setTimeout(() => setSaveMessage(''), 5000);
        
        // NO cerrar la edición - dejar que el usuario intente de nuevo o cancele
        // throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error general al guardar:', error);
      alert(`Error: ${error.message}`);
      // NO cerrar la edición si hay un error general
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
              value={editValue || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log('🔄 estadoRN onChange:', { newValue, editValueActual: editValue });
                setEditValue(newValue);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="px-2 py-1 text-xs border rounded w-32"
              autoFocus
            >
              <option value="">-- Seleccionar --</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          ) : key === 'at' ? (
            <select
              value={editValue || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log('🔄 AT(S/N) onChange:', { 
                  newValue, 
                  editValueActual: editValue,
                  episodioAtActual: episodio.at
                });
                // Solo actualizar el estado del input, NO actualizar la lista hasta que se guarde
                setEditValue(newValue);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="px-2 py-1 text-xs border rounded w-24"
              autoFocus
            >
              <option value="">-- Seleccionar --</option>
              <option value="S">Sí</option>
              <option value="N">No</option>
            </select>
          ) : key === 'atDetalle' ? (
            // Solo permitir editar atDetalle si at === 'S' o at === true (SOLO del episodio guardado, NO del editValue)
            (() => {
              const episodioAtValue = episodio.at;
              const atEsS = episodioAtValue === true || String(episodioAtValue || '').toUpperCase() === 'S';
              // NO usar editValue aquí - solo permitir si el valor GUARDADO del episodio es 'S'
              
              if (!atEsS) {
                return (
                  <div className="px-2 py-1 text-xs text-slate-400 italic">
                    Primero selecciona AT(S/N) = Sí y guarda
                  </div>
                );
              }
              
              // Asegurar que el valor del select coincida exactamente con las opciones
              const editValueTrimmed = editValue ? String(editValue).trim() : '';
              // Buscar el ajuste que coincide exactamente (con trim)
              const ajusteCoincidente = ajustesTecnologia.find(a => (a.at || '').trim() === editValueTrimmed);
              const valorParaSelect = ajusteCoincidente ? (ajusteCoincidente.at || '').trim() : '';
              
              console.log('🔍 Renderizando select atDetalle:', {
                editValue,
                editValueTrimmed,
                ajusteCoincidente: ajusteCoincidente ? { at: ajusteCoincidente.at, monto: ajusteCoincidente.monto } : null,
                valorParaSelect,
                ajustesDisponibles: ajustesTecnologia.map(a => ({ at: a.at?.trim(), id: a.id }))
              });
              
              return (
            <select
              value={valorParaSelect}
              onChange={(e) => {
                const newValue = e.target.value; // No hacer trim aquí, el value ya viene sin espacios
                console.log('🔄 AT Detalle onChange - ANTES:', { 
                  newValue, 
                  editValueAnterior: editValue,
                  editValueType: typeof editValue,
                  ajustesDisponibles: ajustesTecnologia.map(a => a.at?.trim()).filter(Boolean),
                  valorCoincide: ajustesTecnologia.some(a => (a.at || '').trim() === newValue)
                });
                // Actualizar inmediatamente el estado con el valor exacto de la opción
                setEditValue(newValue);
                
                // Mostrar preview del monto que se autocompletará al guardar
                if (newValue && newValue.trim() !== '') {
                  // El valor ya viene normalizado de las opciones, así que buscar directamente
                  const ajusteSeleccionado = ajustesTecnologia.find(ajuste => {
                    const ajusteAt = (ajuste.at || '').trim();
                    return ajusteAt === newValue; // El newValue ya viene de la opción, que ya tiene trim
                  });
                  
                  console.log('🔍 Preview - Buscando ajuste para nuevo valor:', {
                    newValue: newValue,
                    ajusteEncontrado: ajusteSeleccionado ? { 
                      at: ajusteSeleccionado.at, 
                      monto: ajusteSeleccionado.monto,
                      id: ajusteSeleccionado.id
                    } : null,
                    totalAjustes: ajustesTecnologia.length,
                    todosLosAjustes: ajustesTecnologia.map(a => ({ 
                      at: a.at?.trim(), 
                      monto: a.monto,
                      id: a.id 
                    }))
                  });
                  
                  if (ajusteSeleccionado && ajusteSeleccionado.monto !== undefined && ajusteSeleccionado.monto !== null) {
                    console.log('💰 Preview - Monto que se autocompletará al guardar:', {
                      atDetalle: newValue,
                      montoAT: ajusteSeleccionado.monto,
                      tipoMonto: typeof ajusteSeleccionado.monto
                    });
                  } else {
                    console.warn('⚠️ Preview - No se encontró monto para:', newValue);
                  }
                }
                
                // Verificar que el valor se actualizó
                setTimeout(() => {
                  console.log('🔄 AT Detalle onChange - DESPUÉS:', {
                    editValueActualizado: editValue,
                    newValue: newValue
                  });
                }, 0);
              }}
              onClick={(e) => {
                // Prevenir que el click en el select dispare el onClick del td
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                // Prevenir que el mousedown cierre la edición
                e.stopPropagation();
              }}
                className="px-2 py-1 text-xs border rounded min-w-[200px] max-w-[300px]"
                autoFocus
              >
                <option value="">-- Seleccionar AT --</option>
                {ajustesTecnologia
                  .filter(ajuste => ajuste.at && ajuste.at.trim() !== '') // Filtrar ajustes sin nombre
                  .map((ajuste) => {
                    const ajusteAt = (ajuste.at || '').trim();
                    return (
                      <option key={ajuste.id || ajusteAt} value={ajusteAt}>
                        {ajusteAt || '(Sin nombre)'}
                      </option>
                    );
                  })}
              </select>
              );
            })()
          ) : key === 'validado' ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1 text-xs border rounded"
              autoFocus
            >
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
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
    
    // Manejar null/undefined para campos que no sean validado (validado se maneja en el switch)
    // EXCEPCIÓN: enNorma se maneja en su propio case, no devolver '-' aquí
    if (key !== 'validado' && key !== 'enNorma' && (value === null || value === undefined)) return '-';
    
    switch (key) {
      case 'validado':
        // Para Finanzas, mostrar dropdown directamente
        if (isFinanzas) {
          // Manejar null/undefined como 'pendiente' (default)
          const currentValueStr =
            value === true ? 'aprobado' : value === false ? 'rechazado' : 'pendiente';

          return (
            <select
              value={currentValueStr}
              onChange={async (e) => {
                const newValue = e.target.value;
                let validatedValue: any = null;

                if (newValue === 'aprobado') {
                  validatedValue = true;
                } else if (newValue === 'rechazado') {
                  validatedValue = false;
                } else {
                  validatedValue = null; // pendiente
                }

                setSaving(true);
                try {
                  const episodeId = (episodio as any).id || episodio.episodio;
                  const url = `/api/episodios/${episodeId}`;
                  const payload = { validado: validatedValue };

                  const response = await api.patch(url, payload);

                  setEpisodios(prevEpisodios => {
                    const index = prevEpisodios.findIndex(ep => {
                      const epId = (ep as any).id || ep.episodio;
                      const searchId = (episodio as any).id || episodio.episodio;
                      return epId === searchId || ep.episodio === episodio.episodio;
                    });
                    
                    if (index === -1) return prevEpisodios;
                    
                    return [
                      ...prevEpisodios.slice(0, index),
                      { ...response.data },
                      ...prevEpisodios.slice(index + 1)
                    ];
                  });
                  
                  setSaveMessage(` Estado actualizado exitosamente`);
                  setTimeout(() => setSaveMessage(''), 3000);
                } catch (error: any) {
                  console.error('Error al actualizar estado:', error);
                  setSaveMessage(` Error: ${error.response?.data?.message || error.message}`);
                  setTimeout(() => setSaveMessage(''), 5000);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className={`px-2 py-1 text-xs border rounded font-medium ${
                currentValueStr === 'aprobado'
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : currentValueStr === 'rechazado'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-300'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          );
        }

        // Para otros roles, mostrar badge simple
        return (
          <span className={`badge-${value ? 'success' : 'warning'}`}>
            {value ? '✓' : '○'}
          </span>
        );
      
      case 'at':
        // Manejar tanto boolean como "S"/"N"
        const atValue = value === true || value === 'S' || String(value || '').toUpperCase() === 'S';
        const atDisplay = atValue ? 'Sí' : 'No';
        const atValueNormalized = atValue ? 'S' : 'N';
        console.log(' AT renderizado en tabla:', { 
          original: value, 
          tipo: typeof value,
          display: atDisplay,
          normalizado: atValueNormalized
        });
        return atValue ? (
          <span className="badge-success">{atDisplay}</span>
        ) : (
          <span className="badge-error">{atDisplay}</span>
        );
      
      case 'inlierOutlier': {
        const inlierValue = value ? String(value) : '-';
        let badgeClass = 'badge-success'; // Por defecto para Inlier
        if (inlierValue === 'Outlier Superior' || inlierValue === 'Outlier Inferior' || inlierValue === 'Outlier') {
          badgeClass = 'badge-error'; // Rojo para outliers
        } else if (inlierValue === 'Inlier') {
          badgeClass = 'badge-success'; // Verde para inlier
        }
        return (
          <span className={badgeClass}>
            {inlierValue}
          </span>
        );
      }
      
      case 'enNorma': {
        // Campo calculado: "Si" (dentro de norma), "No" (fuera de norma), o null
        // Si "Inlier/Outlier" está vacío, "En norma" también debe estar vacío
        const inlierValueForEnNorma = episodio.inlierOutlier;
        // Verificar si inlierOutlier está vacío (null, undefined, string vacío, o "-")
        const isInlierEmpty = !inlierValueForEnNorma || 
          (typeof inlierValueForEnNorma === 'string' && (inlierValueForEnNorma.trim() === '' || inlierValueForEnNorma.trim() === '-'));
        
        // Si inlierOutlier está vacío, siempre mostrar vacío, sin importar el valor de enNorma
        if (isInlierEmpty) {
          return <span className="text-slate-400">-</span>;
        }
        
        // Si enNorma es null/undefined pero inlierOutlier tiene valor, calcularlo
        if (value === undefined || value === null) {
          if (inlierValueForEnNorma && typeof inlierValueForEnNorma === 'string') {
            const normalized = inlierValueForEnNorma.trim().toLowerCase();
            const calculatedValue = normalized === 'inlier' ? 'Si' : 'No';
            return calculatedValue === 'Si' ? (
              <span className="badge-success">Si</span>
            ) : (
              <span className="badge-error">No</span>
            );
          }
          return <span className="text-slate-400">-</span>;
        }
        
        // Si tiene valor, mostrarlo
        if (value === 'Si' || value === 'Sí') {
          return <span className="badge-success">Si</span>;
        } else if (value === 'No') {
          return <span className="badge-error">No</span>;
        } else {
          return <span className="text-slate-400">-</span>;
        }
      }
      
      case 'estadoRN':
        // Para Finanzas, mostrar dropdown directamente (similar a validado)
        if (isFinanzas) {
          // Manejar null/undefined como 'Pendiente' (default)
          const currentValueStr = value === 'Aprobado' ? 'Aprobado' : 
                                  value === 'Rechazado' ? 'Rechazado' : 
                                  'Pendiente';

          return (
            <select
              value={currentValueStr}
              onChange={async (e) => {
                const newValue = e.target.value;
                let validatedValue: any = null;

                if (newValue === 'Aprobado') {
                  validatedValue = 'Aprobado';
                } else if (newValue === 'Rechazado') {
                  validatedValue = 'Rechazado';
                } else {
                  validatedValue = null; // pendiente
                }

                setSaving(true);
                try {
                  const episodeId = (episodio as any).id || episodio.episodio;
                  const url = `/api/episodios/${episodeId}`;
                  const payload = { estadoRN: validatedValue };

                  console.log('🔄 Actualizando estadoRN:', { url, payload, validatedValue });

                  const response = await api.patch(url, payload);

                  setEpisodios(prevEpisodios => {
                    const index = prevEpisodios.findIndex(ep => {
                      const epId = (ep as any).id || ep.episodio;
                      const searchId = (episodio as any).id || episodio.episodio;
                      return epId === searchId || ep.episodio === episodio.episodio;
                    });
                    
                    if (index === -1) return prevEpisodios;
                    
                    // Actualizar con la respuesta del backend
                    const updatedEpisodio = response.data?.data || response.data;
                    const episodioActualizado = { 
                      ...prevEpisodios[index],
                      ...updatedEpisodio,
                      estadoRN: validatedValue // Asegurar que estadoRN esté actualizado
                    };
                    
                    return [
                      ...prevEpisodios.slice(0, index),
                      episodioActualizado,
                      ...prevEpisodios.slice(index + 1)
                    ];
                  });
                  
                  setSaveMessage(`✅ Estado RN actualizado exitosamente`);
                  setTimeout(() => setSaveMessage(''), 3000);
                } catch (error: any) {
                  console.error('Error al actualizar estadoRN:', error);
                  setSaveMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
                  setTimeout(() => setSaveMessage(''), 5000);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className={`px-2 py-1 text-xs border rounded font-medium ${
                currentValueStr === 'Aprobado'
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : currentValueStr === 'Rechazado'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-300'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          );
        }

        // Para otros roles, mostrar badge simple
        const estadoDisplay = value ? String(value) : '-';
        console.log('📊 estadoRN renderizado en tabla:', { original: value, display: estadoDisplay });
        return value ? (
          <span className={`badge-${
            value === 'Aprobado' ? 'success' : 
            value === 'Pendiente' ? 'warning' : 'error'
          }`}>
            {estadoDisplay}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        );
      
      case 'montoAT':
        // Monto AT debe mostrarse solo si AT = 'S'
        const episodioAtParaMonto = episodio.at;
        const atEsSParaMonto = episodioAtParaMonto === true || String(episodioAtParaMonto || '').toUpperCase() === 'S';
        const montoATValue = (atEsSParaMonto && value) ? (typeof value === 'number' ? value : parseFloat(String(value))) : 0;
        const montoATFormatted = montoATValue > 0 ? formatCurrency(montoATValue) : '-';
        console.log('📊 Monto AT renderizado en tabla:', { 
          original: value, 
          tipo: typeof value,
          atEsS: atEsSParaMonto,
          episodioAt: episodioAtParaMonto,
          montoATValue: montoATValue,
          formatted: montoATFormatted
        });
        return (
          <div className="flex items-center gap-1">
            <span className={hasErrors ? 'text-red-600' : hasWarnings ? 'text-yellow-600' : ''}>
              {montoATFormatted}
            </span>
            {hasErrors && <span className="text-red-500 text-xs">⚠️</span>}
            {hasWarnings && !hasErrors && <span className="text-yellow-500 text-xs">⚠️</span>}
          </div>
        );
      
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
      
<<<<<<< HEAD
      case 'convenio':
        // Mostrar convenio si tiene valor, sino mostrar '-'
        return value ? (
          <span className="text-slate-700" title={value}>
            {value}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        );
      
      case 'atDetalle':
        // Asegurar que el valor se muestre correctamente
        const atDetalleDisplay = value ? String(value).trim() : '';
        return atDetalleDisplay ? (
          <span className="text-xs text-slate-700 max-w-[200px] truncate" title={atDetalleDisplay}>
            {atDetalleDisplay}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        );
      
      default:
        return value || '-';
    }
  };

  // Cargar episodios automáticamente al montar el componente
  // IMPORTANTE: Cargar ajustesTecnologia PRIMERO para que estén disponibles al normalizar atDetalle
  useEffect(() => {
    const loadData = async () => {
      // Solo cargar ajustes si no están cargados aún
      if (!ajustesTecnologia || ajustesTecnologia.length === 0) {
        await loadAjustesTecnologia(); // Cargar ajustes primero
      }
      await loadEpisodios(); // Luego cargar episodios (necesita ajustesTecnologia para normalizar atDetalle)
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Función para cargar ajustes de tecnología del backend
  const loadAjustesTecnologia = async () => {
    setLoadingAjustes(true);
    try {
      const response = await api.get('/api/ajustes-tecnologia');
      const ajustes = response.data || [];
      setAjustesTecnologia(ajustes);
      console.log('✅ Ajustes de tecnología cargados:', ajustes.length);
    } catch (error: any) {
      console.error('❌ Error al cargar ajustes de tecnología:', error);
      // No mostramos error al usuario porque es solo para el dropdown
    } finally {
      setLoadingAjustes(false);
    }
  };

  // Función para cargar episodios del backend
  const loadEpisodios = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usar ajustesTecnologia del estado (ya debería estar cargado en el useEffect inicial)
      // Si no está disponible, usar array vacío - no cargar aquí para evitar 429
      const ajustesParaNormalizar = ajustesTecnologia || [];
      console.log('📋 Cargando episodios con ajustesTecnologia:', {
        ajustesLength: ajustesParaNormalizar.length,
        tieneAjustes: ajustesParaNormalizar.length > 0
      });
      
      // Agregar timestamp para evitar caché del navegador
      const response = await api.get('/api/episodios/final', {
        params: {
          page: 1,
          pageSize: 100, // Cargar los primeros 100 episodios
          _t: Date.now() // Timestamp para evitar caché
        }
      });
      
      // El backend debería devolver { items: Episode[], total: number }
      let episodiosData = response.data?.items || response.data || [];
      
      // CRÍTICO: Log de la respuesta completa del backend ANTES de procesar
      console.log('📥 RESPUESTA COMPLETA DEL BACKEND (response.data):', response.data);
      
      if (episodiosData.length > 0) {
        const primerEpisodio = episodiosData[0];
        
        // IMPORTANTE: Log completo del primer episodio SIN modificar
        console.log('🔍 PRIMER EPISODIO COMPLETO (SIN PROCESAR):', JSON.stringify(primerEpisodio, null, 2));
        
        // Buscar campos relacionados con AT
        const todasLasKeys = Object.keys(primerEpisodio);
        const keysConAt = todasLasKeys.filter(k => 
          k.toLowerCase().includes('at') || 
          k.toLowerCase().includes('detalle') ||
          k.toLowerCase().includes('ajuste') ||
          k.toLowerCase().includes('tecnologia')
        );
        
        console.log('🔍 TODAS LAS KEYS DEL EPISODIO:', todasLasKeys);
        console.log('🔍 KEYS QUE CONTIENEN "at", "detalle", "ajuste" o "tecnologia":', keysConAt);
        console.log('🔍 VALORES DE ESAS KEYS:', keysConAt.map(k => ({ 
          key: k, 
          value: primerEpisodio[k], 
          tipo: typeof primerEpisodio[k] 
        })));
        
        // VERIFICACIÓN ESPECÍFICA PARA precioBaseTramo
        const keysConPrecio = todasLasKeys.filter(k => 
          k.toLowerCase().includes('precio') || 
          k.toLowerCase().includes('base') || 
          k.toLowerCase().includes('tramo')
        );
        console.log('💰 KEYS QUE CONTIENEN "precio", "base" o "tramo":', keysConPrecio);
        console.log('💰 VALORES DE PRECIO BASE:', keysConPrecio.map(k => ({ 
          key: k, 
          value: primerEpisodio[k], 
          tipo: typeof primerEpisodio[k] 
        })));
        console.log('💰 VERIFICACIÓN precioBaseTramo:', {
          tienePrecioBaseTramo: 'precioBaseTramo' in primerEpisodio,
          precioBaseTramoValue: primerEpisodio.precioBaseTramo,
          precioBaseTramoTipo: typeof primerEpisodio.precioBaseTramo,
          precioBaseTramoEsNull: primerEpisodio.precioBaseTramo === null,
          precioBaseTramoEsUndefined: primerEpisodio.precioBaseTramo === undefined,
          convenio: (primerEpisodio as any).convenio,
          peso: primerEpisodio.peso,
          pesoTipo: typeof primerEpisodio.peso
        });
        
        const verificacionEspecifica: any = {
          tieneAtDetalle: 'atDetalle' in primerEpisodio,
          tieneAt_detalle: 'at_detalle' in primerEpisodio,
          atDetalleValue: primerEpisodio.atDetalle,
          at_detalleValue: (primerEpisodio as any).at_detalle,
          atValue: primerEpisodio.at,
          montoATValue: primerEpisodio.montoAT
        };
        console.log('🔍 VERIFICACIÓN ESPECÍFICA:', verificacionEspecifica);
      }
      
      // Normalizar TODOS los valores de campos editables al cargar
      // IMPORTANTE: Usar ajustesParaNormalizar (variable local) en lugar del estado para evitar problemas de timing
      episodiosData = episodiosData.map((ep: any) => {
        // CRÍTICO: Log del episodio ANTES de cualquier normalización
        const atDetalleOriginal = ep.atDetalle;
        console.log('📥 Episodio ANTES de normalización:', {
          episodio: ep.episodio,
          at: ep.at,
          atDetalle: atDetalleOriginal,
          atDetalleTipo: typeof atDetalleOriginal,
          atDetalleEsNull: atDetalleOriginal === null,
          atDetalleEsUndefined: atDetalleOriginal === undefined,
          montoAT: ep.montoAT
        });
        
        // Normalizar AT: convertir boolean a "S"/"N"
        if (ep.at === true || ep.at === 'S' || ep.at === 's') {
          ep.at = 'S';
        } else if (ep.at === false || ep.at === 'N' || ep.at === 'n') {
          ep.at = 'N';
        } else {
          ep.at = 'N'; // Default
        }
        
        // Normalizar estadoRN: asegurar que sea string o null
        if (ep.estadoRN === null || ep.estadoRN === undefined || ep.estadoRN === '') {
          ep.estadoRN = null;
        } else {
          ep.estadoRN = String(ep.estadoRN);
        }
        
        // Normalizar atDetalle: SIMPLIFICADO - mantener siempre el valor del backend
        // Solo limpiar si AT = 'N', de lo contrario mantener exactamente como viene
        if (ep.at === 'N') {
          // Si AT = "N", limpiar atDetalle y montoAT automáticamente
          ep.at = 'N';
          ep.atDetalle = null;
          ep.montoAT = 0;
          console.log('🧹 Limpiando atDetalle y montoAT porque AT = N para episodio:', ep.episodio);
        } else if (ep.at === 'S') {
          // Si AT = 'S', mantener atDetalle tal como viene del backend
          // Solo hacer trim si tiene valor (no cambiar si es null)
          if (ep.atDetalle !== null && ep.atDetalle !== undefined && ep.atDetalle !== '') {
            // Hacer trim pero mantener el valor (no buscar en catálogo para no perderlo)
            ep.atDetalle = String(ep.atDetalle).trim();
            console.log('✅ Manteniendo atDetalle del backend para episodio:', {
              episodio: ep.episodio,
              at: ep.at,
              atDetalle: ep.atDetalle
            });
          } else {
            // Si viene null/vacío y AT = 'S', mantener null
            ep.atDetalle = null;
            console.log('📋 atDetalle es null/vacío para episodio:', ep.episodio);
          }
        } else {
          // Si AT no es 'S' ni 'N' (caso raro), mantener atDetalle como viene
          if (ep.atDetalle !== null && ep.atDetalle !== undefined && ep.atDetalle !== '') {
            ep.atDetalle = String(ep.atDetalle).trim();
            console.log('⚠️ AT no normalizado pero atDetalle tiene valor, manteniendo:', {
              episodio: ep.episodio,
              at: ep.at,
              atDetalle: ep.atDetalle
            });
          }
        }
        
        // Log DESPUÉS de normalización para verificar
        console.log('📤 Episodio DESPUÉS de normalización:', {
          episodio: ep.episodio,
          at: ep.at,
          atDetalle: ep.atDetalle,
          atDetalleTipo: typeof ep.atDetalle,
          atDetalleOriginal: atDetalleOriginal,
          cambio: atDetalleOriginal !== ep.atDetalle ? '⚠️ CAMBIÓ' : '✅ MANTUVO',
          montoAT: ep.montoAT,
          precioBaseTramo: ep.precioBaseTramo,
          precioBaseTramoTipo: typeof ep.precioBaseTramo,
          peso: ep.peso,
          convenio: (ep as any).convenio
        });
        
        // Normalizar campos numéricos: asegurar que sean números
        const numericFields = ['montoAT', 'montoRN', 'pagoOutlierSup', 'pagoDemora', 'precioBaseTramo', 'valorGRD', 'montoFinal', 'diasDemoraRescate'];
        numericFields.forEach(fieldName => {
          const value = ep[fieldName];
          if (value !== null && value !== undefined) {
            ep[fieldName] = typeof value === 'number' ? value : parseFloat(value);
          } else if (fieldName === 'montoAT' && ep.at === 'N') {
            // Si montoAT es null/undefined y AT = N, establecer a 0
            ep[fieldName] = 0;
          }
        });
        
        // Normalizar enNorma: si inlierOutlier está vacío, enNorma también debe estar vacío
        const inlierValue = ep.inlierOutlier;
        // Verificar si inlierOutlier está vacío (null, undefined, string vacío, o "-")
        const isInlierEmpty = !inlierValue || 
          (typeof inlierValue === 'string' && (inlierValue.trim() === '' || inlierValue.trim() === '-'));
        
        if (isInlierEmpty) {
          // Si inlierOutlier está vacío, enNorma también debe estar vacío (null)
          ep.enNorma = null;
        } else if (!ep.enNorma || (ep.enNorma !== 'Si' && ep.enNorma !== 'Sí' && ep.enNorma !== 'No')) {
          // Si no tiene valor o tiene un valor inválido, calcularlo basado en inlierOutlier
          if (inlierValue && typeof inlierValue === 'string') {
            const normalized = inlierValue.trim().toLowerCase();
            ep.enNorma = normalized === 'inlier' ? 'Si' : 'No';
          }
        } else if (ep.enNorma === 'Sí') {
          // Normalizar 'Sí' a 'Si' para consistencia
          ep.enNorma = 'Si';
        }
        
        return ep;
      });
      
      setEpisodios(episodiosData);
      
      console.log('Episodios cargados:', episodiosData.length);
      
      // Log para debug: verificar estructura de los episodios
      if (episodiosData.length > 0) {
        const primerEp = episodiosData[0];
        console.log('📋 Estructura del primer episodio:', {
          episodio: primerEp.episodio,
          id: (primerEp as any).id,
          at: primerEp.at,
          atDetalle: primerEp.atDetalle, // ⚠️ VERIFICAR SI ESTÁ
          montoAT: primerEp.montoAT,
          estadoRN: primerEp.estadoRN,
          precioBaseTramo: primerEp.precioBaseTramo, // 💰 VERIFICAR PRECIO BASE
          precioBaseTramoTipo: typeof primerEp.precioBaseTramo,
          peso: primerEp.peso,
          convenio: (primerEp as any).convenio,
          enNorma: (primerEp as any).enNorma,
          inlierOutlier: primerEp.inlierOutlier,
          tieneEnNorma: 'enNorma' in primerEp,
          todasLasKeys: Object.keys(primerEp),
          keysConAt: Object.keys(primerEp).filter(k => k.toLowerCase().includes('at') || k.toLowerCase().includes('detalle')),
          keysConPrecio: Object.keys(primerEp).filter(k => k.toLowerCase().includes('precio') || k.toLowerCase().includes('base') || k.toLowerCase().includes('tramo'))
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
          <div className={`border-b px-6 py-4 ${
            saveMessage.includes('✅') || saveMessage.includes('exitosamente')
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`text-xl ${saveMessage.includes('✅') || saveMessage.includes('exitosamente') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage.includes('✅') || saveMessage.includes('exitosamente') ? '✅' : '❌'}
              </div>
              <div>
                <p className={`font-semibold ${
                  saveMessage.includes('✅') || saveMessage.includes('exitosamente')
                    ? 'text-green-800'
                    : 'text-red-800'
                }`}>
                  {saveMessage.includes('✅') || saveMessage.includes('exitosamente') ? 'Cambios guardados' : 'Error'}
                </p>
                <p className={`text-sm mt-1 ${
                  saveMessage.includes('✅') || saveMessage.includes('exitosamente')
                    ? 'text-green-700'
                    : 'text-red-700'
                }`}>
                  {saveMessage.replace(/^✅ |^❌ /, '')}
                </p>
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
                    <p className="text-sm text-slate-700 flex items-start gap-2.5">
                      <span className="text-purple-500 mt-0.5 font-bold">•</span>
                      <span><strong>Estado RN:</strong> Valores permitidos: "Aprobado", "Pendiente", "Rechazado" (case-sensitive) o vacío (null).</span>
                    </p>
                    <p className="text-sm text-slate-700 flex items-start gap-2.5">
                      <span className="text-purple-500 mt-0.5 font-bold">•</span>
                      <span><strong>Casos fuera de norma:</strong> Para episodios marcados como "Fuera de norma", puedes ingresar manualmente <strong>Valor GRD</strong> y <strong>Monto Final</strong> para hacer override de los cálculos automáticos.</span>
                    </p>
                    {/* AT(S/N) ahora es solo para Codificador */}
                  </div>
                </div>
                
                {/* Lista de campos editables */}
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-2.5 text-sm text-slate-700">
                  <div className="space-y-2.5">
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Estado RN</strong> - Estado del reembolso</span>
                    </p>
                    {/* AT(S/N), AT Detalle, Monto AT ahora son solo para Codificador */}
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
                      <span><strong className="font-semibold text-slate-900">Monto Final</strong> - Monto final (calculado automáticamente, editable solo para casos fuera de norma)</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Valor GRD</strong> - Valor GRD (calculado automáticamente, editable solo para casos fuera de norma)</span>
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
              <img src={icon4} alt="Gestión" className="w-6 h-6 object-contain" style={{ filter: 'invert(17%) sepia(96%) saturate(5067%) hue-rotate(300deg) brightness(95%) contrast(96%)' }} />
              <h3 className="text-base font-open-sauce font-medium text-fuchsia-900">
                Campos editables para Gestión
              </h3>
            </div>
            <div className="text-sm text-slate-700 mb-4">
              <p className="flex items-start gap-2">
                <span className="text-fuchsia-500 mt-1">•</span>
                <span>
                  <strong className="font-semibold text-slate-900">AT (S/N)</strong> y <strong>AT Detalle</strong> - Ajustes por tecnología.
                  El <strong>Monto AT</strong> se autocompleta automáticamente y es de solo lectura.
                </span>
              </p>
              <p className="flex items-start gap-2 mt-2">
                <span className="text-fuchsia-500 mt-1">•</span>
                <span>
                  <strong className="font-semibold text-slate-900">Precio Base por Tramo</strong> - Precio base del episodio según el convenio y tramo.
                </span>
              </p>
            </div>
            {/* Instrucciones primero */}
            <div className="mb-6 -mx-6 px-6 py-4 bg-white/80 border-l-4 border-fuchsia-500 rounded-r-lg shadow-sm">
              <h4 className="text-sm font-semibold text-fuchsia-900 mb-3">Instrucciones</h4>
              <div className="space-y-2.5">
                <p className="text-sm text-slate-700 flex items-start gap-2.5">
                  <span className="text-fuchsia-500 mt-0.5 font-bold">•</span>
                  <span>Los cambios se reflejan inmediatamente en el sistema.</span>
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
        <div className={`grid gap-6 ${isFinanzas ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
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

          {/* Filtro por convenio (solo para finanzas) */}
          {isFinanzas && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Convenio</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Filtrar por convenio..."
                value={filterConvenio}
                onChange={(e) => setFilterConvenio(e.target.value)}
              />
            </div>
          )}

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
        ) : filteredEpisodios.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No se encontraron episodios</h3>
            <p className="text-slate-600 mb-6">
              {filterConvenio && isFinanzas 
                ? `No hay episodios con convenio que comience con "${filterConvenio}"`
                : 'No hay episodios que coincidan con los filtros aplicados'
              }
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterValidated('all');
                setFilterOutlier('all');
                setFilterConvenio('');
              }}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
            >
              Limpiar Filtros
            </button>
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
                      
                      // Determinar si el campo debe ser clickeable
                      let shouldBeClickable = false;

                      if (key === 'montoAT') {
                        // montoAT nunca es editable
                        shouldBeClickable = false;
                      } else if (isFinanzas && key === 'validado') {
                        // Para Finanzas, VALIDADO ya tiene dropdown directo, no usamos startEdit
                        shouldBeClickable = false;
                      } else if (isEditable) {
                        shouldBeClickable = true;
                      }

                      // AT y AT Detalle: clickeables solo si Codificador o Gestión
                      if ((key === 'at' || key === 'atDetalle') && !isCodificador && !isGestion) {
                        shouldBeClickable = false;
                      }
                      
                      // precioBaseTramo: clickeable solo si Gestión o Finanzas
                      if (key === 'precioBaseTramo' && !isGestion && !isFinanzas) {
                        shouldBeClickable = false;
                      }
                      
                      // valorGRD y montoFinal: solo editables para Finanzas o Codificador cuando el episodio está fuera de norma
                      if ((key === 'valorGRD' || key === 'montoFinal') && shouldBeClickable) {
                        const esFueraDeNorma = episodio.grupoDentroNorma === false;
                        const tienePermiso = (isFinanzas || isCodificador);
                        if (!esFueraDeNorma || !tienePermiso) {
                          shouldBeClickable = false;
                        }
                      }
                      
                      return (
                        <td 
                          key={key}
                          className={`px-4 py-3 text-slate-700 ${
                            shouldBeClickable ? 'bg-blue-50/50 font-medium cursor-pointer hover:bg-blue-100/70 transition-colors' : ''
                          }`}
                          onClick={() => shouldBeClickable && startEdit(rowIndex, key, value)}
                          title={shouldBeClickable ? 'Hacer clic para editar' : ''}
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

        {isCodificador && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-t border-blue-200 px-6 py-6">
            <div className="flex items-start gap-3 mb-4">
              <img src={icon1} alt="Codificador" className="w-8 h-8 object-contain mt-1" style={{ filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(194deg) brightness(100%) contrast(96%)' }} />
              <div className="flex-1">
                <h3 className="text-base font-open-sauce font-medium text-blue-900 mb-4">Campos editables para Codificador</h3>
                
                {/* Instrucciones primero */}
                <div className="mb-6 -mx-6 px-6 py-4 bg-white/80 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Instrucciones</h4>
                  <div className="space-y-2.5">
                    <p className="text-sm text-slate-700 flex items-start gap-2.5">
                      <span className="text-blue-500 mt-0.5 font-bold">•</span>
                      <span>Primero selecciona <strong>AT(S/N)</strong> como "Sí" o "No".</span>
                    </p>
                    <p className="text-sm text-slate-700 flex items-start gap-2.5">
                      <span className="text-blue-500 mt-0.5 font-bold">•</span>
                      <span>Si seleccionas "Sí", entonces podrás editar <strong>AT Detalle</strong>.</span>
                    </p>
                    <p className="text-sm text-slate-700 flex items-start gap-2.5">
                      <span className="text-blue-500 mt-0.5 font-bold">•</span>
                      <span>El <strong>Monto AT</strong> se autocompleta automáticamente según el AT Detalle seleccionado (no es editable).</span>
                    </p>
                    <p className="text-sm text-slate-700 flex items-start gap-2.5">
                      <span className="text-blue-500 mt-0.5 font-bold">•</span>
                      <span>Si seleccionas "No" en AT(S/N), se limpiarán automáticamente AT Detalle y Monto AT.</span>
                    </p>
                  </div>
                </div>
                
                {/* Lista de campos editables */}
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-2.5 text-sm text-slate-700">
                  <div className="space-y-2.5">
                    <p className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">AT (S/N)</strong> - Ajuste por Tecnología (Sí/No)</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">AT Detalle</strong> - Detalle del AT (solo habilitado si AT = Sí)</span>
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <p className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span><strong className="font-semibold text-slate-900">Monto AT</strong> - Se autocompleta automáticamente (solo lectura)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
