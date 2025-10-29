import { useParams, Link } from 'react-router-dom';
import { useState, useRef } from 'react';
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
  const [isDocumentosOpen, setIsDocumentosOpen] = useState(false);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [replaceModal, setReplaceModal] = useState<{show: boolean, oldFile: string, newFile: string, documentoId: string} | null>(null);
  const [deleteModal, setDeleteModal] = useState<{show: boolean, documentoId: string, fileName: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList) => {
    const newDocumentos = Array.from(files).map((file, index) => ({
      id: String(Date.now() + index),
      nombre: file.name,
      fecha: new Date().toISOString().split('T')[0],
      tamaño: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      usuario: 'Usuario Actual', // En producción vendría del contexto de autenticación
      file: file // Guardar la referencia al archivo real
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
          
          // Mostrar modal de confirmación
          setReplaceModal({
            show: true,
            oldFile: documento.nombre,
            newFile: file.name,
            documentoId: documentoId
          });
        }
      };

      // Abrir el explorador de archivos
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
              fecha: new Date().toISOString().split('T')[0], // Registro de fecha de actualización
              tamaño: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
              usuario: 'Usuario Actual',
              file: file // Actualizar la referencia al archivo
            }
          : doc
      ));

      // Feedback visual de éxito
      setShowSuccessMessage(`Archivo "${newFileName}" reemplazado exitosamente`);
      setTimeout(() => {
        setShowSuccessMessage(null);
      }, 3000);
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

    setShowSuccessMessage(`Archivo "${deleteModal.fileName}" eliminado exitosamente`);
    setTimeout(() => {
      setShowSuccessMessage(null);
    }, 3000);

    setDeleteModal(null);
  };

  const handleCancelDelete = () => {
    setDeleteModal(null);
  };

  const handleDownloadIndividual = (documento: Documento) => {
    try {
      // Usar el archivo real
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

      // Agregar cada archivo al ZIP
      for (const doc of documentos) {
        const fileContent = await doc.file.arrayBuffer();
        zip.file(doc.nombre, fileContent);
      }

      // Generar el archivo ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Descargar el archivo ZIP
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

  return (
    <main className='max-w-3xl mx-auto px-4 py-10'>
      <Link to='/episodios' className='text-sm text-indigo-600'>← Volver</Link>
      <h1 className='text-xl font-semibold mt-2'>Episodio #{id}</h1>
      
      {/* Datos clínicos y GRD */}
      <div className='bg-white rounded-xl border p-6 mt-4'>
        <p className='text-sm text-slate-600'>Datos clínicos y GRD.</p>
      </div>

      {/* Documentos de respaldo */}
      <div className='bg-white rounded-xl border mt-4'>
        <button
          onClick={() => setIsDocumentosOpen(!isDocumentosOpen)}
          className='w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 transition-colors'
        >
          <h2 className='text-sm text-slate-600'>Documentos de respaldo</h2>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${
              isDocumentosOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isDocumentosOpen && (
          <div 
            className='px-6 pb-6 border-t relative'
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Área de drop overlay */}
            {isDragOver && (
              <div className='absolute inset-0 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-lg z-10 flex items-center justify-center pointer-events-none'>
                <div className='text-center'>
                  <svg className='w-12 h-12 text-indigo-400 mx-auto mb-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className='text-indigo-600 font-medium text-lg'>Suelta los archivos aquí</p>
                  <p className='text-sm text-indigo-500 mt-2'>Se agregarán a la lista de documentos</p>
                </div>
              </div>
            )}

            <div className='flex items-center justify-between mt-4'>
              <button
                onClick={() => fileInputRef.current?.click()}
                className='px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors'
              >
                Subir documentos
              </button>
              
              {documentos.length > 0 && (
                <button
                  onClick={handleDownloadZip}
                  className='px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors'
                >
                  Descargar todo (ZIP)
                </button>
              )}
            </div>

            {/* Input oculto para subir archivos */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            
            <input
              ref={replaceInputRef}
              type="file"
              onChange={() => {}} // Se maneja en handleReplaceFile
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            
            {/* Mensaje de éxito */}
            {showSuccessMessage && (
              <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center'>
                <svg className='w-5 h-5 text-green-500 mr-2' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className='text-green-700 text-sm'>{showSuccessMessage}</span>
              </div>
            )}
            
            {/* Lista de documentos */}
            <div className='mt-4'>
              {documentos.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead className='bg-slate-100'>
                      <tr>
                        <th className='text-center p-3 font-medium text-slate-900'>Archivo</th>
                        <th className='text-center p-3 font-medium text-slate-900'>Fecha</th>
                        <th className='text-center p-3 font-medium text-slate-900'>Usuario</th>
                        <th className='text-center p-3 font-medium text-slate-900'>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentos.map((doc) => (
                        <tr key={doc.id} className='border-t hover:bg-slate-50'>
                          <td className='p-3'>
                            <div className='flex items-center'>
                              <svg className='w-4 h-4 text-slate-400 mr-2' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className='text-slate-900'>{doc.nombre}</span>
                            </div>
                          </td>
                          <td className='p-3 text-slate-600 text-center'>{doc.fecha}</td>
                          <td className='p-3 text-slate-600 text-center'>{doc.usuario}</td>
                          <td className='p-3 text-center'>
                            <div className='flex gap-2 justify-center'>
                              <button
                                onClick={() => handleDownloadIndividual(doc)}
                                className='p-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors'
                                title='Descargar archivo'
                              >
                                <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleReplaceFile(doc.id)}
                                className='p-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors'
                                title='Reemplazar archivo'
                              >
                                <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteFile(doc.id)}
                                className='p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors'
                                title='Eliminar archivo'
                              >
                                <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !isDragOver ? (
                <div className='bg-slate-50 rounded-lg p-8 text-center'>
                  <svg className='w-12 h-12 text-slate-300 mx-auto mb-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className='text-slate-500'>No hay documentos cargados aún</p>
                  <p className='text-sm text-slate-400 mt-1'>Arrastra archivos aquí o haz clic en "Subir documentos"</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación de reemplazo */}
      {replaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Confirmar reemplazo
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              ¿Estás seguro de que quieres reemplazar este archivo?
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2">
              <div>
                <span className="text-xs text-slate-500">Archivo actual:</span>
                <p className="text-sm text-slate-900 font-medium">{replaceModal.oldFile}</p>
              </div>
              <div className="border-t pt-2">
                <span className="text-xs text-slate-500">Nuevo archivo:</span>
                <p className="text-sm text-slate-900 font-medium">{replaceModal.newFile}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Se actualizará la fecha del documento a la fecha actual.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelReplace}
                className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReplace}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Confirmar reemplazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Confirmar eliminación
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              ¿Estás seguro de que quieres eliminar este archivo?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-900">Esta acción no se puede deshacer</p>
                  <p className="text-xs text-red-700 mt-1">El archivo se eliminará permanentemente</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <span className="text-xs text-slate-500">Archivo a eliminar:</span>
              <p className="text-sm text-slate-900 font-medium">{deleteModal.fileName}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar archivo
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
