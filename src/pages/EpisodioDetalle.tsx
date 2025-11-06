import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getEpisodeDetail } from '@/services/importEpisodes';
import { useAuth } from '@/hooks/useAuth';
import { hasRole } from '@/lib/auth';
import api from '@/lib/api';
import type { Episode } from '@/types';
import { validateFieldValue, formatCurrency } from '@/lib/validations';
import JSZip from 'jszip';
import {
  uploadDocumento,
  getDocumentos,
  deleteDocumento,
  replaceDocumento,
  type DocumentoCloudinary,
} from '@/services/documents';

interface Documento extends DocumentoCloudinary {
  file?: File; // Referencia al archivo real (solo para archivos nuevos antes de subir)
  uploading?: boolean; // Estado de carga
}

export default function EpisodioDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const isGestion = hasRole(user, ['gestion']);
  const isFinanzas = hasRole(user, ['finanzas']);
  
  const [episodio, setEpisodio] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para gestión
  const [comentarios, setComentarios] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Estados para edición de campos financieros
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [savingField, setSavingField] = useState(false);

  // Estados para documentos
  const [isDocumentosOpen, setIsDocumentosOpen] = useState(false);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [replaceModal, setReplaceModal] = useState<{show: boolean, oldFile: string, newFile: string, documentoId: string} | null>(null);
  const [deleteModal, setDeleteModal] = useState<{show: boolean, documentoId: string, fileName: string} | null>(null);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const DeleteConfirmationModal = ({ 
    show, 
    fileName, 
    onConfirm, 
    onCancel 
  }: { 
    show: boolean;
    fileName: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => {
    console.log('🔍 DeleteConfirmationModal renderizado:', { show, fileName });
    
    if (!show) return null;

    const handleConfirmClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('✅ Botón confirmar eliminación clickeado');
      onConfirm();
    };

    const handleCancelClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('❌ Botón cancelar clickeado');
      onCancel();
    };

    return (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
        onClick={(e) => {
          // Cerrar al hacer clic fuera del modal
          if (e.target === e.currentTarget) {
            handleCancelClick(e);
          }
        }}
      >
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Confirmar eliminación
          </h3>
          <p className="text-slate-600 mb-4">
            ¿Estás seguro que deseas eliminar el archivo "{fileName}"?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancelClick}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmClick}
              className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (id) {
      loadEpisodio();
      loadDocumentos();
    }
  }, [id]);

  // Cargar documentos desde el backend
  const loadDocumentos = async () => {
    if (!id) return;
    
    setLoadingDocumentos(true);
    try {
      const documentosFromBackend = await getDocumentos(id);
      setDocumentos(documentosFromBackend);
    } catch (error: any) {
      console.error('Error al cargar documentos:', error);
      // Si el endpoint no existe aún, simplemente no mostrar error
      // Esto permite que el sistema funcione mientras se implementa el backend
      if (error.response?.status !== 404) {
        setSaveMessage(`Error al cargar documentos: ${error.message}`);
        setTimeout(() => setSaveMessage(''), 5000);
      }
    } finally {
      setLoadingDocumentos(false);
    }
  };

  // Estado para mostrar sección de documentos solo cuando viene del hash
  const [showDocumentosSection, setShowDocumentosSection] = useState(false);

  // Detectar hash en la URL para mostrar sección de documentos
  useEffect(() => {
    if (location.hash === '#documentos') {
      setShowDocumentosSection(true);
      setIsDocumentosOpen(true);
      // Scroll suave a la sección de documentos después de un pequeño delay
      setTimeout(() => {
        const element = document.getElementById('seccion-documentos');
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } else {
      setShowDocumentosSection(false);
      setIsDocumentosOpen(false);
    }
  }, [location.hash]);

  const loadEpisodio = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Agregar timestamp para evitar caché
      let data = await getEpisodeDetail(id);
      
      // Normalizar TODOS los valores de campos editables al cargar
      // Normalizar AT: convertir boolean a "S"/"N"
      const atValue = data.at as any;
      if (atValue === true || atValue === 'S' || atValue === 's') {
        data.at = 'S' as any;
      } else if (atValue === false || atValue === 'N' || atValue === 'n') {
        data.at = 'N' as any;
      } else {
        data.at = 'N' as any;
      }
      
      // Normalizar estadoRN: asegurar que sea string o null
      const estadoRNValue = data.estadoRN as any;
      if (estadoRNValue === null || estadoRNValue === undefined || estadoRNValue === '') {
        data.estadoRN = null as any;
      } else {
        data.estadoRN = String(estadoRNValue) as any;
      }
      
      // Normalizar atDetalle: asegurar que sea string o null
      const atDetalleValue = data.atDetalle as any;
      if (atDetalleValue === null || atDetalleValue === undefined || atDetalleValue === '') {
        data.atDetalle = null as any;
      } else {
        data.atDetalle = String(atDetalleValue).trim() as any;
      }
      console.log('📥 atDetalle normalizado al cargar:', data.atDetalle);
      
      // Normalizar campos numéricos: asegurar que sean números
      const numericFields = ['montoAT', 'montoRN', 'pagoOutlierSup', 'pagoDemora', 'precioBaseTramo', 'valorGRD', 'montoFinal', 'diasDemoraRescate'];
      numericFields.forEach(fieldName => {
        const value = (data as any)[fieldName];
        if (value !== null && value !== undefined) {
          (data as any)[fieldName] = typeof value === 'number' ? value : parseFloat(value);
        }
      });
      
      setEpisodio(data);
      // Cargar comentarios existentes
      setComentarios(data.comentariosGestion || '');
      console.log('📥 Episodio cargado (normalizado):', data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el episodio');
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstadoRevision = async (nuevoEstado: 'aprobado' | 'rechazado') => {
    if (!episodio || !isGestion) return;
    
    setSaving(true);
    setSaveMessage('');
    
    try {
      // Intentar usar id si existe, sino usar episodio
      const episodeId = (episodio as any).id || episodio.episodio;
      const url = `/api/episodios/${episodeId}`;
      const payload = {
        validado: nuevoEstado === 'aprobado',
        comentariosGestion: comentarios,
        fechaRevision: new Date().toISOString(),
        revisadoPor: user?.email || 'Usuario'
      };
      
      console.log('🔄 Enviando PATCH a:', url);
      console.log('📦 Datos enviados:', payload);
      console.log('🆔 ID del episodio (usado):', episodeId);
      console.log('🔍 Datos del episodio:', {
        episodio: episodio.episodio,
        id: (episodio as any).id,
        hasId: !!(episodio as any).id
      });
      
      const response = await api.patch(url, payload);
      
      // Actualizar el episodio local con la respuesta del backend
      setEpisodio(response.data);
      
      setSaveMessage(`Episodio ${nuevoEstado === 'aprobado' ? 'aprobado' : 'rechazado'} exitosamente`);
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error: any) {
      console.error('❌ Error al actualizar estado:', error);
      console.error('📋 Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        fullUrl: error.config?.baseURL + error.config?.url
      });
      
      let errorMessage = 'Error al guardar los cambios';
      if (error.response?.status === 404) {
        errorMessage = `El episodio ${episodio?.episodio} no fue encontrado en el servidor. Verifica que el ID del episodio sea correcto.`;
      } else if (error.response?.status === 400) {
        errorMessage = `Datos inválidos: ${error.response?.data?.message || 'El valor ingresado no es válido'}`;
      } else if (error.response?.status === 401) {
        errorMessage = 'No tienes permisos para realizar esta acción. Por favor, inicia sesión nuevamente.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Error del servidor. Por favor, intenta nuevamente más tarde.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSaveMessage(`Error: ${errorMessage}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Función para iniciar edición de campo financiero
  const startEditField = (field: string, currentValue: any) => {
    if (!isFinanzas) return;
    
    setEditingField(field);
    if (field === 'at') {
      // Convertir boolean a "S"/"N" o mantener "S"/"N" si ya es string
      // También manejar valores null/undefined
      if (currentValue === true || currentValue === 'S' || currentValue === 's') {
        setEditValue('S');
      } else if (currentValue === false || currentValue === 'N' || currentValue === 'n' || currentValue === null || currentValue === undefined) {
        setEditValue('N');
      } else {
        setEditValue('N'); // Default
      }
    } else if (field === 'estadoRN') {
      // Manejar null, undefined y strings vacíos correctamente
      setEditValue(currentValue || '');
    } else {
      setEditValue(currentValue?.toString() || '');
    }
  };

  // Función para guardar campo editado
  const saveField = async (field: string) => {
    if (!episodio || !isFinanzas || savingField) return;
    
    setSavingField(true);
    setSaveMessage('');
    
    try {
      // Validar el valor según el tipo de campo
      const fieldValidation = validateFieldValue(field, editValue);
      if (!fieldValidation.isValid) {
        throw new Error(fieldValidation.errors.join(', '));
      }
      
      let validatedValue: any = editValue;
      
      // Convertir tipos según el campo
      if (field.includes('monto') || field.includes('pago') || field.includes('precio') || field.includes('valor')) {
        validatedValue = parseFloat(editValue);
      } else if (field === 'diasDemoraRescate') {
        validatedValue = parseInt(editValue);
      } else if (field === 'at') {
        // Normalizar: aceptar S/s/N/n, convertir a "S" o "N"
        const atVal = String(editValue).trim().toUpperCase();
        validatedValue = (atVal === 'S') ? 'S' : 'N';
        console.log('📤 AT validado para enviar:', validatedValue, 'desde editValue:', editValue);
      } else if (field === 'estadoRN') {
        // Normalizar: aceptar valores válidos o convertir a null
        const estadoVal = String(editValue).trim();
        if (estadoVal === '' || !['Aprobado', 'Pendiente', 'Rechazado'].includes(estadoVal)) {
          validatedValue = null;
        } else {
          validatedValue = estadoVal; // Case-sensitive exacto
        }
        console.log('📤 estadoRN validado para enviar:', validatedValue, 'desde editValue:', editValue);
      }

      // Enviar actualización al backend
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
      
      // Normalizar valores del episodio actualizado del backend
      let updatedEpisodio = { ...response.data };
      
      // Normalizar TODOS los campos que pueden venir en diferentes formatos
      // Normalizar AT: convertir boolean a "S"/"N"
      const atValue = updatedEpisodio.at as any;
      if (atValue === true || atValue === 'S' || atValue === 's') {
        updatedEpisodio.at = 'S' as any;
      } else if (atValue === false || atValue === 'N' || atValue === 'n') {
        updatedEpisodio.at = 'N' as any;
      } else {
        updatedEpisodio.at = 'N' as any;
      }
      
      // Normalizar estadoRN: asegurar que sea string o null
      const estadoRNValue = updatedEpisodio.estadoRN as any;
      if (estadoRNValue === null || estadoRNValue === undefined || estadoRNValue === '') {
        updatedEpisodio.estadoRN = null as any;
      } else {
        // Asegurar que sea un string válido
        const estadoStr = String(estadoRNValue).trim();
        updatedEpisodio.estadoRN = (estadoStr === '' ? null : estadoStr) as any;
      }
      console.log('📥 estadoRN normalizado después del backend:', updatedEpisodio.estadoRN);
      
      // Normalizar atDetalle: asegurar que sea string o null
      const atDetalleValue = updatedEpisodio.atDetalle as any;
      if (atDetalleValue === null || atDetalleValue === undefined || atDetalleValue === '') {
        updatedEpisodio.atDetalle = null as any;
      } else {
        const atDetalleStr = String(atDetalleValue).trim();
        updatedEpisodio.atDetalle = (atDetalleStr === '' ? null : atDetalleStr) as any;
      }
      console.log('📥 atDetalle normalizado después del backend:', updatedEpisodio.atDetalle);
      
      // Normalizar campos numéricos: asegurar que sean números
      const numericFields = ['montoAT', 'montoRN', 'pagoOutlierSup', 'pagoDemora', 'precioBaseTramo', 'valorGRD', 'montoFinal', 'diasDemoraRescate'];
      numericFields.forEach(fieldName => {
        const value = (updatedEpisodio as any)[fieldName];
        if (value !== null && value !== undefined) {
          (updatedEpisodio as any)[fieldName] = typeof value === 'number' ? value : parseFloat(value);
        }
      });
      
      console.log('📦 Episodio normalizado después de recibir del backend:', {
        at: updatedEpisodio.at,
        estadoRN: updatedEpisodio.estadoRN,
        montoRN: updatedEpisodio.montoRN,
        field: field
      });
      
      // Cerrar modo edición ANTES de actualizar para que se actualice la visualización
      setEditingField(null);
      setEditValue('');
      
      // Actualizar el episodio local con la respuesta del backend normalizada
      // Crear un nuevo objeto para forzar re-render
      setEpisodio({ ...updatedEpisodio });
      console.log('✅ Episodio actualizado localmente:', updatedEpisodio);
      
      setSaveMessage(`Campo ${field} actualizado exitosamente`);
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error: any) {
      console.error('❌ Error al actualizar campo:', error);
      console.error('📋 Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        fullUrl: error.config?.baseURL + error.config?.url
      });
      
      let errorMessage = 'Error al guardar los cambios';
      if (error.response?.status === 404) {
        errorMessage = `El episodio ${episodio?.episodio} no fue encontrado en el servidor. Verifica que el ID del episodio sea correcto.`;
      } else if (error.response?.status === 400) {
        errorMessage = `Datos inválidos: ${error.response?.data?.message || 'El valor ingresado no es válido'}`;
      } else if (error.response?.status === 401) {
        errorMessage = 'No tienes permisos para realizar esta acción. Por favor, inicia sesión nuevamente.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Error del servidor. Por favor, intenta nuevamente más tarde.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSaveMessage(`Error: ${errorMessage}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setSavingField(false);
    }
  };

  // Función para cancelar edición
  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Renderizar campo editable
  const renderEditableField = (field: string, label: string, currentValue: any, isCurrency: boolean = false) => {
    if (!isFinanzas) {
      // Si no es finanzas, mostrar solo lectura
      return (
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
          <div className={`text-sm font-semibold ${
            currentValue !== null && currentValue !== undefined 
              ? 'text-slate-900' 
              : 'text-slate-400'
          }`}>
            {currentValue !== null && currentValue !== undefined 
              ? (isCurrency ? formatCurrency(currentValue) : currentValue.toString())
              : 'No disponible'}
          </div>
        </div>
      );
    }

    const isEditing = editingField === field;

    if (isEditing) {
      return (
        <div>
          <span className="text-sm text-[var(--text-secondary)] mb-1 block">{label}:</span>
          <div className="flex items-center gap-2">
            {field === 'estadoRN' ? (
              <input
                type="text"
                value={editValue || ''}
                onChange={(e) => {
                  console.log('🔄 estadoRN ingresado:', e.target.value);
                  setEditValue(e.target.value);
                }}
                className="px-3 py-2 border rounded-lg flex-1"
                autoFocus
                placeholder="Aprobado, Pendiente, Rechazado"
                title="Valores permitidos: Aprobado, Pendiente, Rechazado (case-sensitive) o vacío"
              />
            ) : field === 'at' ? (
              <input
                type="text"
                value={editValue || ''}
                onChange={(e) => {
                  console.log('🔄 AT ingresado:', e.target.value);
                  setEditValue(e.target.value);
                }}
                className="px-3 py-2 border rounded-lg flex-1"
                autoFocus
                placeholder="S o N"
                title="Valores permitidos: S, s, N, n"
              />
            ) : (
              <input
                type={isCurrency ? 'number' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="px-3 py-2 border rounded-lg flex-1"
                autoFocus
                min={isCurrency ? "0" : undefined}
                step={isCurrency ? "0.01" : undefined}
              />
            )}
            <button
              onClick={() => saveField(field)}
              disabled={savingField}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {savingField ? '...' : '✓'}
            </button>
            <button
              onClick={cancelEdit}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <span className="text-sm text-[var(--text-secondary)]">{label}:</span>
        <div className="flex items-center gap-2">
          <p className="font-medium text-[var(--text-primary)] flex-1">
            {currentValue !== null && currentValue !== undefined 
              ? (isCurrency ? formatCurrency(currentValue) : 
                 field === 'at' ? (() => {
                   const atVal = currentValue as any;
                   // Normalizar para mostrar correctamente
                   const atNormalized = (atVal === true || atVal === 'S' || atVal === 's') ? 'Sí' : 'No';
                   console.log('📊 AT renderizado:', { original: atVal, normalizado: atNormalized });
                   return atNormalized;
                 })() : 
                 field === 'estadoRN' ? (() => {
                   const estadoNormalized = currentValue ? String(currentValue) : '-';
                   console.log('📊 estadoRN renderizado:', { original: currentValue, normalizado: estadoNormalized });
                   return estadoNormalized;
                 })() :
                 field === 'atDetalle' ? (() => {
                   const atDetalleNormalized = currentValue ? String(currentValue).trim() : '-';
                   console.log('📊 atDetalle renderizado:', { original: currentValue, normalizado: atDetalleNormalized });
                   return atDetalleNormalized;
                 })() :
                 currentValue.toString())
              : 'No disponible'}
          </p>
          <button
            onClick={() => startEditField(field, currentValue)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Editar
          </button>
        </div>
      </div>
    );
  };

  // Funciones para manejo de documentos
  const processFiles = async (files: FileList) => {
    if (!id) return;

    const filesArray = Array.from(files);
    
    // Crear documentos temporales con estado de carga
    const tempDocumentos: Documento[] = filesArray.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      nombre: file.name,
      fecha: new Date().toISOString().split('T')[0],
      tamaño: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      usuario: user?.email || 'Usuario desconocido',
      url: '',
      public_id: '',
      file: file,
      uploading: true,
    }));

    // Agregar documentos temporales al estado
    setDocumentos(prev => [...prev, ...tempDocumentos]);

    // Subir cada archivo al backend
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const tempDoc = tempDocumentos[i];

      try {
        const documentoSubido = await uploadDocumento(id, file);
        
        // Actualizar el documento temporal con los datos del backend
        setDocumentos(prev => prev.map(doc => 
          doc.id === tempDoc.id 
            ? { ...documentoSubido, uploading: false }
            : doc
        ));

        setSaveMessage(`Documento "${file.name}" subido exitosamente`);
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error: any) {
        console.error('Error al subir documento:', error);
        
        // Remover el documento temporal en caso de error
        setDocumentos(prev => prev.filter(doc => doc.id !== tempDoc.id));
        
        setSaveMessage(`Error al subir "${file.name}": ${error.response?.data?.message || error.message}`);
        setTimeout(() => setSaveMessage(''), 5000);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleReplaceFile = (documentoId: string) => {
    const documento = documentos.find(doc => doc.id === documentoId);
    if (!documento) return;

    if (replaceInputRef.current) {
      replaceInputRef.current.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          const file = files[0];
          setReplaceModal({
            show: true,
            oldFile: documento.nombre,
            newFile: file.name,
            documentoId: documentoId
          });
        }
      };
      replaceInputRef.current.click();
    }
  };

  const handleConfirmReplace = async () => {
    if (!replaceModal || !id) return;
    const documentoId = replaceModal.documentoId;
    const newFileName = replaceModal.newFile;
    const files = replaceInputRef.current?.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      const documento = documentos.find(doc => doc.id === documentoId);
      
      if (!documento) return;

      // Marcar como cargando
      setDocumentos(prev => prev.map(doc => 
        doc.id === documentoId 
          ? { ...doc, uploading: true }
          : doc
      ));

      try {
        // Reemplazar en Cloudinary
        const documentoActualizado = await replaceDocumento(id, documento.public_id, file);
        
        // Actualizar el documento con los nuevos datos
        setDocumentos(prev => prev.map(doc => 
          doc.id === documentoId 
            ? { ...documentoActualizado, uploading: false }
            : doc
        ));
        
        setSaveMessage(`Archivo "${newFileName}" reemplazado exitosamente`);
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error: any) {
        console.error('Error al reemplazar documento:', error);
        setSaveMessage(`Error al reemplazar "${newFileName}": ${error.response?.data?.message || error.message}`);
        setTimeout(() => setSaveMessage(''), 5000);
        
        // Restaurar estado anterior
        setDocumentos(prev => prev.map(doc => 
          doc.id === documentoId 
            ? { ...doc, uploading: false }
            : doc
        ));
      }
    }
    setReplaceModal(null);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
    }
  };

  const handleCancelReplace = () => {
    setReplaceModal(null);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
    }
  };

  const handleDeleteFile = (documentoId: string) => {
    console.log('🗑️ handleDeleteFile llamado con:', documentoId);
    console.log('📋 Documentos disponibles:', documentos);
    
    const documento = documentos.find(doc => doc.id === documentoId);
    if (!documento) {
      console.error('❌ Documento no encontrado con ID:', documentoId);
      setSaveMessage(`Error: Documento no encontrado`);
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    
    console.log('✅ Documento encontrado:', documento);
    setDeleteModal({
      show: true,
      documentoId: documentoId,
      fileName: documento.nombre
    });
    console.log('✅ Modal de eliminación configurado');
  };

  const handleConfirmDelete = async () => {
    console.log('🚀 handleConfirmDelete llamado');
    console.log('📋 Estado del modal:', deleteModal);
    console.log('📋 ID del episodio:', id);
    
    if (!deleteModal || !id) {
      console.error('❌ No hay modal de eliminación o ID de episodio');
      setSaveMessage('Error: No se puede eliminar el documento. Falta información.');
      setTimeout(() => setSaveMessage(''), 5000);
      setDeleteModal(null);
      return;
    }
    
    const documento = documentos.find(doc => doc.id === deleteModal.documentoId);
    if (!documento) {
      console.error('❌ Documento no encontrado:', deleteModal.documentoId);
      setSaveMessage(`Error: Documento no encontrado`);
      setTimeout(() => setSaveMessage(''), 3000);
      setDeleteModal(null);
      return;
    }

    console.log('🗑️ Intentando eliminar documento:', {
      documentoId: deleteModal.documentoId,
      documento: documento,
      public_id: documento.public_id,
      id: documento.id,
      episodioId: id
    });

    // Verificar que tenemos el id necesario
    if (!documento.id) {
      console.error('❌ No hay id disponible en el documento');
      setSaveMessage(`Error: No se puede identificar el documento para eliminar`);
      setTimeout(() => setSaveMessage(''), 5000);
      setDeleteModal(null);
      return;
    }

    // El backend probablemente espera el id del documento (ID interno de la BD)
    // Si el backend espera public_id, el backend puede mapearlo internamente
    // Usamos el id del documento que viene del backend
    const documentoIdToDelete = documento.id;

    try {
      console.log('📤 Enviando DELETE al backend con:', {
        episodioId: id,
        documentoId: documentoIdToDelete
      });

      // Eliminar de Cloudinary
      await deleteDocumento(id, documentoIdToDelete);
      
      console.log('✅ Documento eliminado exitosamente del backend');
      
      // Remover del estado local
      setDocumentos(prev => prev.filter(doc => doc.id !== deleteModal.documentoId));
      setSaveMessage(`✅ Archivo "${deleteModal.fileName}" eliminado exitosamente`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      console.error('❌ Error completo al eliminar documento:', error);
      console.error('📋 Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullUrl: error.config?.baseURL + error.config?.url
      });
      
      let errorMessage = 'Error desconocido al eliminar el documento';
      
      if (error.response) {
        // Hay respuesta del servidor
        if (error.response.status === 404) {
          errorMessage = `El documento no fue encontrado en el servidor`;
        } else if (error.response.status === 400) {
          errorMessage = `Datos inválidos: ${error.response.data?.message || 'El documento no puede ser eliminado'}`;
        } else if (error.response.status === 401) {
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
        } else if (error.response.status === 403) {
          errorMessage = 'No tienes permisos para eliminar este documento';
        } else if (error.response.status === 500) {
          errorMessage = 'Error del servidor. Por favor, intenta nuevamente más tarde.';
        } else {
          errorMessage = error.response.data?.message || error.response.data?.error || `Error ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.request) {
        // No hubo respuesta del servidor
        errorMessage = `Error de conexión: No se pudo conectar al servidor. Verifica tu conexión.`;
      } else {
        // Error en la configuración de la petición
        errorMessage = error.message || 'Error al configurar la petición de eliminación';
      }
      
      setSaveMessage(`❌ Error al eliminar "${deleteModal.fileName}": ${errorMessage}`);
      setTimeout(() => setSaveMessage(''), 8000); // Más tiempo para leer el error
    }
    
    setDeleteModal(null);
  };

  const handleCancelDelete = () => {
    setDeleteModal(null);
  };

  const handleDownloadIndividual = (documento: Documento) => {
    try {
      // Si tiene URL de Cloudinary, usar esa
      if (documento.url || documento.secure_url) {
        const url = documento.secure_url || documento.url;
        const link = document.createElement('a');
        link.href = url;
        link.download = documento.nombre;
        link.target = '_blank'; // Abrir en nueva pestaña si no se puede descargar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (documento.file) {
        // Si es un archivo local (antes de subir), usar blob URL
        const url = URL.createObjectURL(documento.file);
        const link = document.createElement('a');
        link.href = url;
        link.download = `episodio-${id}-${documento.nombre}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        throw new Error('No hay URL disponible para descargar');
      }
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      alert('Error al descargar el archivo');
    }
  };

  const handleDownloadZip = async () => {
    if (documentos.length === 0) {
      alert('No hay documentos para descargar');
      return;
    }
    try {
      const zip = new JSZip();
      
      for (const doc of documentos) {
        if (doc.uploading) continue; // Saltar documentos que se están subiendo
        
        try {
          if (doc.file) {
            // Si tiene archivo local, usarlo directamente
            const fileContent = await doc.file.arrayBuffer();
            zip.file(doc.nombre, fileContent);
          } else if (doc.url || doc.secure_url) {
            // Si tiene URL de Cloudinary, descargar desde ahí
            const url = doc.secure_url || doc.url;
            const response = await fetch(url);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            zip.file(doc.nombre, arrayBuffer);
          }
        } catch (error) {
          console.error(`Error al agregar "${doc.nombre}" al ZIP:`, error);
        }
      }
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `documentos-episodio-${id}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar archivo ZIP:', error);
      alert('Error al generar el archivo ZIP');
    }
  };

  // Vista solo de documentos cuando viene con hash
  const renderDocumentosView = () => (
    <main className="max-w-[1400px] mx-auto px-6 py-10">
      {/* Botón volver a episodios */}
      <div className='mb-6'>
        <Link to='/episodios' className='text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-300/80 shadow-sm transition-all duration-300 inline-block'>← Volver a Episodios</Link>
      </div>
      
      {/* Header */}
      <div className='mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5'>
        <h1 className='text-3xl font-open-sauce font-light bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent'>Documentos - Episodio #{episodio?.episodio}</h1>
      </div>

      {/* Div 1: Cargar documentos */}
      <div className='rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mb-6'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-xl font-open-sauce font-semibold text-slate-900'>Cargar Documentos</h2>
        </div>

        <div 
          className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-indigo-400 transition-colors"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragOver && (
            <div className="absolute inset-0 bg-indigo-50/80 border-2 border-dashed border-indigo-400 rounded-2xl flex items-center justify-center z-10">
              <div className="text-center">
                <svg className="w-16 h-16 text-indigo-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-indigo-600 font-medium text-lg">Suelta los archivos aquí</p>
              </div>
            </div>
          )}

          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-600 mb-4 font-medium">Arrastra y suelta archivos aquí o haz clic en el botón</p>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm hover:bg-indigo-100 hover:border-indigo-300 active:translate-y-px transition-all"
          >
            Seleccionar archivos
          </button>
          <p className='text-xs text-gray-500 mt-3'>Formatos permitidos: PDF, DOC, DOCX, JPG, PNG (máx. 50MB por archivo)</p>
        </div>

        <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
        <input ref={replaceInputRef} type="file" onChange={() => {}} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
      </div>

      {/* Div 2: Documentos cargados */}
      {documentos.length > 0 && (
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='px-6 py-5'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-open-sauce font-semibold text-slate-900'>Documentos cargados ({documentos.length})</h2>
              <button
                onClick={handleDownloadZip}
                className='px-4 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-300/70 hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm'
              >
                Descargar todo (ZIP)
              </button>
            </div>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm border-collapse'>
              <thead>
                <tr className='bg-slate-50 border-b-2 border-slate-200'>
                  <th className='px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap'>Archivo</th>
                  <th className='px-4 py-3 text-center font-semibold text-slate-700 whitespace-nowrap'>Fecha</th>
                  <th className='px-4 py-3 text-center font-semibold text-slate-700 whitespace-nowrap'>Usuario</th>
                  <th className='px-4 py-3 text-center font-semibold text-slate-700 whitespace-nowrap'>Tamaño</th>
                  <th className='px-4 py-3 text-center font-semibold text-slate-700 whitespace-nowrap'>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc) => (
                  <tr key={doc.id} className='border-b border-slate-100 hover:bg-slate-50/50 transition-colors'>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{doc.nombre}</span>
                        {doc.uploading && (
                          <div className='w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin'></div>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-3 text-center text-gray-600'>{doc.fecha}</td>
                    <td className='px-4 py-3 text-center text-gray-600'>{doc.usuario}</td>
                    <td className='px-4 py-3 text-center text-gray-600'>{doc.tamaño}</td>
                    <td className='px-4 py-3'>
                      <div className='flex gap-2 justify-center'>
                        <button 
                          onClick={() => handleDownloadIndividual(doc)} 
                          disabled={doc.uploading}
                          className='p-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                          title='Descargar'
                        >
                          ↓
                        </button>
                        <button 
                          onClick={() => handleReplaceFile(doc.id)} 
                          disabled={doc.uploading}
                          className='p-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                          title='Reemplazar'
                        >
                          ✎
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔴 Botón eliminar clickeado para documento:', doc.id);
                            handleDeleteFile(doc.id);
                          }}
                          disabled={doc.uploading}
                          className='p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                          title='Eliminar'
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Div 3: Estado vacío */}
      {documentos.length === 0 && (
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm p-12 text-center'>
          <svg className='w-16 h-16 text-gray-300 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
          </svg>
          <p className='text-gray-500 text-base'>No hay documentos cargados aún</p>
          <p className='text-gray-400 text-sm mt-2'>Arrastra archivos o haz clic en el botón para comenzar</p>
        </div>
      )}
      {/* Agregar el modal aquí */}
      <DeleteConfirmationModal
        show={deleteModal?.show || false}
        fileName={deleteModal?.fileName || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        />
    </main>
  );

  if (loading) {
    return (
      <main className="main-container-sm">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h3 className="title-secondary mb-2">Cargando episodio...</h3>
          <p className="text-[var(--text-secondary)]">
            Obteniendo información del episodio #{id}
          </p>
        </div>
      </main>
    );
  }

  // Si muestraDocumentosSection es true, retornar solo la vista de documentos
  if (showDocumentosSection) {
    return renderDocumentosView();
  }

  if (error || !episodio) {
    return (
      <main className="main-container-sm">
        <div className="mb-6">
          <Link to='/episodios' className="link-primary text-sm flex items-center">
            <span className="mr-2">←</span> Volver a episodios
          </Link>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-600 mr-3 text-xl">✗</div>
            <div>
              <p className="text-red-800 font-medium">Error al cargar episodio</p>
              <p className="text-red-700 text-sm">{error || 'Episodio no encontrado'}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='max-w-[1400px] mx-auto px-6 py-10'>
      {/* Botón volver a episodios */}
      <div className='mb-6'>
        <Link to='/episodios' className='text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-300/80 shadow-sm transition-all duration-300 inline-block'>← Volver a Episodios</Link>
      </div>
      
      {/* Div 1: Header con título y modo */}
      <div className='mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5'>
        <header>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-open-sauce font-light bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Episodio #{episodio.episodio}</h1>
            <p className="text-slate-600 mt-2">
              Información detallada del episodio hospitalario
            </p>
          </div>
          {isFinanzas && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-300 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-purple-900 font-semibold text-sm">
                  Modo Finanzas
                </span>
              </div>
            </div>
          )}
        </div>
      </header>
      </div>

      {/* Div 2: Mensajes y estado del episodio */}
      <div className='mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
        {/* Mensaje de confirmación de guardado */}
        {saveMessage && (
          <div className={`px-6 py-4 ${
            saveMessage.includes('✅') || saveMessage.includes('exitosamente') 
              ? 'bg-green-50 border-b border-green-200' 
              : 'bg-red-50 border-b border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`text-xl ${saveMessage.includes('✅') || saveMessage.includes('exitosamente') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage.includes('✅') || saveMessage.includes('exitosamente') ? '✓' : '✗'}
              </div>
              <div>
                <p className={`font-semibold ${saveMessage.includes('✅') || saveMessage.includes('exitosamente') ? 'text-green-800' : 'text-red-800'}`}>
                  {saveMessage.includes('✅') || saveMessage.includes('exitosamente') ? 'Cambios guardados' : 'Error'}
                </p>
                <p className={`text-sm mt-1 ${saveMessage.includes('✅') || saveMessage.includes('exitosamente') ? 'text-green-700' : 'text-red-700'}`}>{saveMessage.replace(/[✅❌]/g, '')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Estado del episodio */}
        <div className="px-6 py-5">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-purple-900">Estado:</span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                episodio.validado === true 
                  ? 'bg-green-500 text-white' 
                  : episodio.validado === false
                  ? 'bg-red-500 text-white'
                  : 'bg-yellow-500 text-white'
              }`}>
                {episodio.validado === true ? 'Aprobado' :
                 episodio.validado === false ? 'Rechazado' : 
                 'Pendiente'}
              </span>
              <span className="text-sm text-purple-700">
                {episodio.inlierOutlier && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    episodio.inlierOutlier === 'Outlier' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {episodio.inlierOutlier}
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-purple-600 font-medium">
              Monto Final
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(episodio.montoFinal)}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Div 3: Información del paciente y GRD */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Información del paciente */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-open-sauce font-semibold text-slate-900">Información del Paciente</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Nombre</div>
              <div className="text-sm font-semibold text-slate-900">{episodio.nombre || 'No disponible'}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">RUT</div>
              <div className="text-sm font-semibold text-slate-900">{episodio.rut || 'No disponible'}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Centro</div>
              <div className="text-sm font-semibold text-slate-900">{episodio.centro || 'No disponible'}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Folio</div>
              <div className="text-sm font-semibold text-slate-900">{episodio.folio || 'No disponible'}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 col-span-2">
              <div className="text-xs font-medium text-slate-500 mb-1">Tipo Episodio</div>
              <div className="text-sm font-semibold text-slate-900">{episodio.tipoEpisodio || 'No disponible'}</div>
            </div>
          </div>
        </div>

        {/* Información GRD */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-open-sauce font-semibold text-slate-900">Información GRD</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Código GRD</div>
              <div className="text-sm font-semibold text-slate-900">{episodio.grdCodigo || 'No disponible'}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Peso</div>
              <div className="text-sm font-semibold text-slate-900">{episodio.peso?.toFixed(2) || 'No disponible'}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Estado</div>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                episodio.inlierOutlier === 'Outlier' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {episodio.inlierOutlier || 'No disponible'}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Grupo norma</div>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                episodio.grupoDentroNorma ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {episodio.grupoDentroNorma ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Div 4: Fechas y estancia / Información financiera */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-open-sauce font-semibold text-slate-900">Fechas y Estancia</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Fecha Ingreso</div>
              <div className="text-sm font-semibold text-slate-900">
                {episodio.fechaIngreso ? new Date(episodio.fechaIngreso).toLocaleDateString('es-CL') : 'No disponible'}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Fecha Alta</div>
              <div className="text-sm font-semibold text-slate-900">
                {episodio.fechaAlta ? new Date(episodio.fechaAlta).toLocaleDateString('es-CL') : 'No disponible'}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Días Estada</div>
              <div className="text-sm font-semibold text-slate-900">{episodio.diasEstada || 'No disponible'}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Servicio Alta</div>
              <div className="text-sm font-semibold text-slate-900">{episodio.servicioAlta || 'No disponible'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-open-sauce font-semibold text-slate-900">Información Financiera</h2>
            {isFinanzas && (
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                Campos editables
              </span>
            )}
          </div>
          <div className="space-y-4">
            {renderEditableField('estadoRN', 'Estado RN', episodio.estadoRN)}
            {renderEditableField('montoRN', 'Monto RN', episodio.montoRN, true)}
            {renderEditableField('precioBaseTramo', 'Precio Base por Tramo', episodio.precioBaseTramo, true)}
            {/* Valor GRD es calculado automáticamente: peso * precioBaseTramo */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valor GRD (calculado)
              </label>
              <p className="text-slate-900 font-medium">
                {formatCurrency(episodio.valorGRD || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Calculado automáticamente: peso × precio base por tramo
              </p>
            </div>
            {renderEditableField('montoFinal', 'Monto Final', episodio.montoFinal, true)}
          </div>
        </div>
      </div>

      {/* Div 5: Ajustes por Tecnología y Pagos Adicionales */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mb-6 border-l-4 border-l-amber-500">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-200">
          <h2 className="text-xl font-open-sauce font-semibold text-slate-900">Ajustes y Pagos Adicionales</h2>
          {isFinanzas && (
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
              Campos editables
            </span>
          )}
        </div>
        <div className="space-y-6">
          {/* Grupo: Ajuste por Tecnología */}
          <div className="bg-amber-50/30 rounded-xl p-4 border border-amber-100">
            <h3 className="text-sm font-semibold text-amber-900 mb-4">Ajuste por Tecnología</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {renderEditableField('at', 'Ajuste por Tecnología (AT)', episodio.at)}
              {(() => {
                const atValue = episodio.at as any;
                return (atValue === true || atValue === 'S' || atValue === 's');
              })() && renderEditableField('atDetalle', 'AT Detalle', episodio.atDetalle)}
              {(() => {
                const atValue = episodio.at as any;
                return (atValue === true || atValue === 'S' || atValue === 's');
              })() && renderEditableField('montoAT', 'Monto AT', episodio.montoAT, true)}
            </div>
          </div>
          
          {/* Grupo: Pagos Adicionales */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Pagos Adicionales</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {renderEditableField('diasDemoraRescate', 'Días Demora Rescate', episodio.diasDemoraRescate)}
              {renderEditableField('pagoDemora', 'Pago Demora Rescate', episodio.pagoDemora, true)}
              {renderEditableField('pagoOutlierSup', 'Pago Outlier Superior', episodio.pagoOutlierSup, true)}
            </div>
          </div>
        </div>
      </div>

      {/* Div 6: Documentación */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-open-sauce font-semibold text-slate-900">Documentación</h2>
          {isFinanzas && (
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
              Campo editable
            </span>
          )}
        </div>
        <div className="space-y-3">
          {renderEditableField('documentacion', 'Documentación necesaria', episodio.documentacion)}
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center">
              <span className={`badge-${episodio.docs?.epicrisis ? 'success' : 'error'} mr-2`}>
                {episodio.docs?.epicrisis ? '✓' : '✗'}
              </span>
              <span className="text-sm">Epicrisis</span>
            </div>
            <div className="flex items-center">
              <span className={`badge-${episodio.docs?.protocolo ? 'success' : 'error'} mr-2`}>
                {episodio.docs?.protocolo ? '✓' : '✗'}
              </span>
              <span className="text-sm">Protocolo</span>
            </div>
            <div className="flex items-center">
              <span className={`badge-${episodio.docs?.certDefuncion ? 'success' : 'error'} mr-2`}>
                {episodio.docs?.certDefuncion ? '✓' : '✗'}
              </span>
              <span className="text-sm">Cert. Defunción</span>
            </div>
          </div>
        </div>
      </div>

      {/* Div 7: Sección de Gestión - Solo visible para usuarios de gestión */}
      {isGestion && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 border-l-4 border-l-purple-500 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-open-sauce font-semibold text-slate-900">Revisión de Gestión</h2>
          </div>
          
          {/* Estado actual de revisión */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-[var(--text-secondary)]">Estado actual:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                episodio.validado === true 
                  ? 'bg-green-100 text-green-800' 
                  : episodio.validado === false
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {episodio.validado === true ? 'Aprobado' :
                 episodio.validado === false ? 'Rechazado' : 
                 'Pendiente'}
              </span>
            </div>
            
            {episodio.fechaRevision && (
              <div className="text-sm text-[var(--text-secondary)]">
                <span>Revisado el: {new Date(episodio.fechaRevision).toLocaleDateString('es-CL')}</span>
                {episodio.revisadoPor && (
                  <span className="ml-4">por: {episodio.revisadoPor}</span>
                )}
              </div>
            )}
          </div>

          {/* Campo de observaciones */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Observaciones y comentarios
            </label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Agregar observaciones sobre la revisión del episodio..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Las observaciones serán visibles para todo el equipo
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => actualizarEstadoRevision('aprobado')}
              disabled={saving || episodio.validado === true}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              Aprobar Episodio
            </button>
            
            <button
              onClick={() => actualizarEstadoRevision('rechazado')}
              disabled={saving || episodio.validado === false}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              Rechazar Episodio
            </button>
          </div>

          {/* Mensaje de confirmación */}
          {saveMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              saveMessage.includes('✅') || saveMessage.includes('exitosamente') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveMessage}
            </div>
          )}

          {/* Comentarios existentes */}
          {episodio.comentariosGestion && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Comentarios anteriores:</h4>
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                {episodio.comentariosGestion}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación de eliminación - también disponible en vista principal */}
      <DeleteConfirmationModal
        show={deleteModal?.show || false}
        fileName={deleteModal?.fileName || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </main>
  );
}
