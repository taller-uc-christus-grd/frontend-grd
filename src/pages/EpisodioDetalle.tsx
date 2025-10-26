import { useParams, Link } from 'react-router-dom';
import { useState, useRef } from 'react';

interface Documento {
  id: string;
  nombre: string;
  fecha: string;
  tamaño: string;
  usuario: string;
}

export default function EpisodioDetalle() {
  const { id } = useParams();
  const [isDocumentosOpen, setIsDocumentosOpen] = useState(false);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList) => {
    const newDocumentos = Array.from(files).map((file, index) => ({
      id: String(Date.now() + index),
      nombre: file.name,
      fecha: new Date().toISOString().split('T')[0],
      tamaño: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      usuario: 'Usuario Actual' // En producción vendría del contexto de autenticación
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
    if (replaceInputRef.current) {
      replaceInputRef.current.click();
      replaceInputRef.current.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          const file = files[0];
          setDocumentos(prev => prev.map(doc => 
            doc.id === documentoId 
              ? {
                  ...doc,
                  nombre: file.name,
                  fecha: new Date().toISOString().split('T')[0],
                  tamaño: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                  usuario: 'Usuario Actual'
                }
              : doc
          ));
        }
      };
    }
  };

  const handleDownloadIndividual = (documento: Documento) => {
    try {
      // Crear contenido simulado del archivo
      const content = `Contenido del archivo: ${documento.nombre}\nFecha: ${documento.fecha}\nTamaño: ${documento.tamaño}\nUsuario: ${documento.usuario}\nEpisodio: ${id}`;
      
      // Crear blob y descargar
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
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

  const handleDownloadZip = () => {
    if (documentos.length === 0) {
      alert('No hay documentos para descargar');
      return;
    }

    try {
      // Crear un archivo de texto con la lista de documentos
      const content = `Documentos del Episodio ${id}\n\n${documentos.map((doc, index) => 
        `${index + 1}. ${doc.nombre}\n   Fecha: ${doc.fecha}\n   Tamaño: ${doc.tamaño}\n   Usuario: ${doc.usuario}\n`
      ).join('\n')}`;
      
      // Crear blob y descargar
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lista-documentos-episodio-${id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al generar archivo:', error);
      alert('Error al generar el archivo');
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
                                className='px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors'
                                title='Descargar archivo'
                              >
                                <svg className='w-3 h-3 inline mr-1' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Descargar
                              </button>
                              <button
                                onClick={() => handleReplaceFile(doc.id)}
                                className='px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors'
                                title='Reemplazar archivo'
                              >
                                <svg className='w-3 h-3 inline mr-1' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Reemplazar
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
    </main>
  );
}
