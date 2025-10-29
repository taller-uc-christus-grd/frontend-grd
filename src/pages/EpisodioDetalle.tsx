import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getEpisodeDetail } from '@/services/importEpisodes';
import { useAuth } from '@/hooks/useAuth';
import { hasRole } from '@/lib/auth';
import api from '@/lib/api';
import type { Episode } from '@/types';
import { validateFieldValue, formatCurrency } from '@/lib/validations';
import JSZip from 'jszip';

interface Documento {
  id: string;
  nombre: string;
  fecha: string;
  tamaño: string;
  usuario: string;
  file: File; // Referencia al archivo real
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadEpisodio();
    }
  }, [id]);

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
      const data = await getEpisodeDetail(id);
      setEpisodio(data);
      // Cargar comentarios existentes
      setComentarios(data.comentariosGestion || '');
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
      const response = await api.patch(`/api/episodes/${episodio.episodio}`, {
        validado: nuevoEstado === 'aprobado',
        comentariosGestion: comentarios,
        fechaRevision: new Date().toISOString(),
        revisadoPor: user?.email || 'Usuario'
      });
      
      // Actualizar el episodio local con la respuesta del backend
      setEpisodio(response.data);
      
      setSaveMessage(`✅ Episodio ${nuevoEstado === 'aprobado' ? 'aprobado' : 'rechazado'} exitosamente`);
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error: any) {
      console.error('Error al actualizar estado:', error);
      setSaveMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
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
      setEditValue(currentValue ? 'true' : 'false');
    } else if (field === 'estadoRN') {
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
        validatedValue = editValue === 'true';
      }

      // Enviar actualización al backend
      const response = await api.patch(`/api/episodes/${episodio.episodio}`, { 
        [field]: validatedValue
      });
      
      // Actualizar el episodio local con la respuesta del backend
      setEpisodio(response.data);
      
      setSaveMessage(`✅ Campo ${field} actualizado exitosamente`);
      setTimeout(() => setSaveMessage(''), 3000);
      
      setEditingField(null);
      setEditValue('');
      
    } catch (error: any) {
      console.error('Error al actualizar campo:', error);
      setSaveMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
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
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="px-3 py-2 border rounded-lg flex-1"
                autoFocus
              >
                <option value="">Seleccionar...</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            ) : field === 'at' ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="px-3 py-2 border rounded-lg flex-1"
                autoFocus
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
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
              {savingField ? '⏳' : '✓'}
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
                 field === 'at' ? (currentValue ? 'Sí' : 'No') : 
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
  const processFiles = (files: FileList) => {
    const newDocumentos = Array.from(files).map((file, index) => ({
      id: String(Date.now() + index),
      nombre: file.name,
      fecha: new Date().toISOString().split('T')[0],
      tamaño: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      usuario: user?.email || 'Usuario desconocido',
      file: file
    }));
    setDocumentos(prev => [...prev, ...newDocumentos]);
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

  const handleConfirmReplace = () => {
    if (!replaceModal) return;
    const documentoId = replaceModal.documentoId;
    const newFileName = replaceModal.newFile;
    const files = replaceInputRef.current?.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      setDocumentos(prev => prev.map(doc => 
        doc.id === documentoId 
          ? {
              ...doc,
              nombre: newFileName,
              fecha: new Date().toISOString().split('T')[0],
              tamaño: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
              usuario: user?.email || 'Usuario desconocido',
              file: file
            }
          : doc
      ));
      setSaveMessage(`Archivo "${newFileName}" reemplazado exitosamente`);
      setTimeout(() => setSaveMessage(''), 3000);
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
    const documento = documentos.find(doc => doc.id === documentoId);
    if (!documento) return;
    setDeleteModal({
      show: true,
      documentoId: documentoId,
      fileName: documento.nombre
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal) return;
    setDocumentos(prev => prev.filter(doc => doc.id !== deleteModal.documentoId));
    setSaveMessage(`Archivo "${deleteModal.fileName}" eliminado exitosamente`);
    setTimeout(() => setSaveMessage(''), 3000);
    setDeleteModal(null);
  };

  const handleCancelDelete = () => {
    setDeleteModal(null);
  };

  const handleDownloadIndividual = (documento: Documento) => {
    try {
      const url = URL.createObjectURL(documento.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `episodio-${id}-${documento.nombre}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
        const fileContent = await doc.file.arrayBuffer();
        zip.file(doc.nombre, fileContent);
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
    <main className="main-container-sm">
      <div className="mb-6">
        <Link to='/episodios' className="link-primary text-sm flex items-center">
          <span className="mr-2">←</span> Volver a episodios
        </Link>
      </div>
      
      <header className="mb-6">
        <h1 className="title-primary">Documentos - Episodio #{episodio.episodio}</h1>
      </header>

      <div className="card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="title-secondary text-lg">Cargar Documentos</h2>
          </div>

          <div 
            className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragOver && (
              <div className="absolute inset-0 bg-indigo-50 border-2 border-dashed border-indigo-400 rounded-lg flex items-center justify-center z-10">
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
              className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors mb-2"
            >
              Seleccionar archivos
            </button>
            <p className="text-xs text-gray-500 mt-3">Formatos permitidos: PDF, DOC, DOCX, JPG, PNG (máx. 50MB por archivo)</p>
          </div>

          <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
          <input ref={replaceInputRef} type="file" onChange={() => {}} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
          
          {documentos.length > 0 && (
            <>
              <div className="flex items-center justify-between mt-8 mb-4">
                <h3 className="title-secondary text-base">Documentos cargados ({documentos.length})</h3>
                <button
                  onClick={handleDownloadZip}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar todo (ZIP)
                </button>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-3 font-medium text-left">Archivo</th>
                      <th className="p-3 font-medium text-center">Fecha</th>
                      <th className="p-3 font-medium text-center">Usuario</th>
                      <th className="p-3 font-medium text-center">Tamaño</th>
                      <th className="p-3 font-medium text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          <span className="font-medium">{doc.nombre}</span>
                        </td>
                        <td className="p-3 text-center text-gray-600">{doc.fecha}</td>
                        <td className="p-3 text-center text-gray-600">{doc.usuario}</td>
                        <td className="p-3 text-center text-gray-600">{doc.tamaño}</td>
                        <td className="p-3">
                          <div className="flex gap-2 justify-center">
                            <button 
                              onClick={() => handleDownloadIndividual(doc)} 
                              className="p-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                              title="Descargar"
                            >
                              ⬇
                            </button>
                            <button 
                              onClick={() => handleReplaceFile(doc.id)} 
                              className="p-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                              title="Reemplazar"
                            >
                              ✏
                            </button>
                            <button 
                              onClick={() => handleDeleteFile(doc.id)} 
                              className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                              title="Eliminar"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {documentos.length === 0 && (
            <div className="mt-8 text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-base">No hay documentos cargados aún</p>
              <p className="text-gray-400 text-sm mt-2">Arrastra archivos o haz clic en el botón para comenzar</p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {replaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar reemplazo</h3>
            <p className="text-sm mb-4">¿Estás seguro de reemplazar este archivo?</p>
            <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2">
              <div>
                <span className="text-xs text-gray-500">Actual:</span>
                <p className="font-medium">{replaceModal.oldFile}</p>
              </div>
              <div className="border-t pt-2">
                <span className="text-xs text-gray-500">Nuevo:</span>
                <p className="font-medium">{replaceModal.newFile}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={handleCancelReplace} className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">Cancelar</button>
              <button onClick={handleConfirmReplace} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
            <p className="text-sm mb-4">¿Estás seguro de eliminar este archivo?</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-red-900">Esta acción no se puede deshacer</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="font-medium">{deleteModal.fileName}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={handleCancelDelete} className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">Cancelar</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
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
            <div className="text-red-600 mr-3">❌</div>
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
    <main className="main-container-sm">
      <div className="mb-6">
        <Link to='/episodios' className="link-primary text-sm flex items-center">
          <span className="mr-2">←</span> Volver a episodios
        </Link>
      </div>
      
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="title-primary">Episodio #{episodio.episodio}</h1>
            <p className="text-[var(--text-secondary)] mt-2">
              Información detallada del episodio hospitalario
            </p>
          </div>
          {isFinanzas && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">💰</span>
                <span className="text-blue-800 font-medium text-sm">
                  Modo Finanzas - Haz clic en "Editar" para modificar campos
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mensaje de confirmación de guardado */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg text-sm ${
          saveMessage.includes('✅') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Estado del episodio */}
      <div className="mb-6">
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
                {episodio.validado === true ? '✅ Aprobado' :
                 episodio.validado === false ? '❌ Rechazado' : 
                 '⏳ Pendiente'}
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Información del paciente */}
        <div className="card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">👤</span>
            </div>
            <h2 className="title-secondary">Información del Paciente</h2>
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
        <div className="card p-6 border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-indigo-600 text-lg">📊</span>
            </div>
            <h2 className="title-secondary">Información GRD</h2>
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

      {/* Fechas y estancia */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card p-6 border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">📅</span>
            </div>
            <h2 className="title-secondary">Fechas y Estancia</h2>
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

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="title-secondary">Información Financiera</h2>
            {isFinanzas && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Campos editables
              </span>
            )}
          </div>
          <div className="space-y-4">
            {renderEditableField('estadoRN', 'Estado RN', episodio.estadoRN)}
            {renderEditableField('montoRN', 'Monto RN', episodio.montoRN, true)}
            {renderEditableField('precioBaseTramo', 'Precio Base por Tramo', episodio.precioBaseTramo, true)}
            {renderEditableField('valorGRD', 'Valor GRD', episodio.valorGRD, true)}
            {renderEditableField('montoFinal', 'Monto Final', episodio.montoFinal, true)}
          </div>
        </div>
      </div>

      {/* Ajustes por Tecnología y Pagos Adicionales */}
      <div className="card p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="title-secondary">Ajustes y Pagos Adicionales</h2>
          {isFinanzas && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Campos editables
            </span>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {renderEditableField('at', 'Ajuste por Tecnología (AT)', episodio.at)}
          {episodio.at && renderEditableField('atDetalle', 'AT Detalle', episodio.atDetalle)}
          {episodio.at && renderEditableField('montoAT', 'Monto AT', episodio.montoAT, true)}
          {renderEditableField('diasDemoraRescate', 'Días Demora Rescate', episodio.diasDemoraRescate)}
          {renderEditableField('pagoDemora', 'Pago Demora Rescate', episodio.pagoDemora, true)}
          {renderEditableField('pagoOutlierSup', 'Pago Outlier Superior', episodio.pagoOutlierSup, true)}
        </div>
      </div>

      {/* Documentación */}
      <div className="card p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="title-secondary">Documentación</h2>
          {isFinanzas && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
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

      {/* Sección de Gestión - Solo visible para usuarios de gestión */}
      {isGestion && (
        <div className="card p-6 mt-6 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-lg">👥</span>
            </div>
            <h2 className="title-secondary">Revisión de Gestión</h2>
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
                {episodio.validado === true ? '✅ Aprobado' :
                 episodio.validado === false ? '❌ Rechazado' : 
                 '⏳ Pendiente'}
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
              ) : (
                '✅'
              )}
              Aprobar Episodio
            </button>
            
            <button
              onClick={() => actualizarEstadoRevision('rechazado')}
              disabled={saving || episodio.validado === false}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                '❌'
              )}
              Rechazar Episodio
            </button>
          </div>

          {/* Mensaje de confirmación */}
          {saveMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              saveMessage.includes('✅') 
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
    </main>
  );
}
