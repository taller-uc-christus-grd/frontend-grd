import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEpisodeDetail } from '@/services/importEpisodes';
import { useAuth } from '@/hooks/useAuth';
import { hasRole } from '@/lib/auth';
import api from '@/lib/api';
import type { Episode } from '@/types';

export default function EpisodioDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const isGestion = hasRole(user, ['gestion']);
  
  const [episodio, setEpisodio] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para gestión
  const [comentarios, setComentarios] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (id) {
      loadEpisodio();
    }
  }, [id]);

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
        <h1 className="title-primary">Episodio #{episodio.episodio}</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Información detallada del episodio hospitalario
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Información del paciente */}
        <div className="card p-6">
          <h2 className="title-secondary mb-4">Información del Paciente</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Nombre:</span>
              <p className="font-medium text-[var(--text-primary)]">{episodio.nombre || 'No disponible'}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">RUT:</span>
              <p className="font-medium text-[var(--text-primary)]">{episodio.rut || 'No disponible'}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Centro:</span>
              <p className="font-medium text-[var(--text-primary)]">{episodio.centro || 'No disponible'}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Folio:</span>
              <p className="font-medium text-[var(--text-primary)]">{episodio.folio || 'No disponible'}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Tipo Episodio:</span>
              <p className="font-medium text-[var(--text-primary)]">{episodio.tipoEpisodio || 'No disponible'}</p>
            </div>
          </div>
        </div>

        {/* Información GRD */}
        <div className="card p-6">
          <h2 className="title-secondary mb-4">Información GRD</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Código GRD:</span>
              <p className="font-medium text-[var(--text-primary)]">{episodio.grdCodigo || 'No disponible'}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Peso:</span>
              <p className="font-medium text-[var(--text-primary)]">{episodio.peso?.toFixed(2) || 'No disponible'}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Estado:</span>
              <span className={`badge-${episodio.inlierOutlier === 'Outlier' ? 'warning' : 'success'}`}>
                {episodio.inlierOutlier || 'No disponible'}
              </span>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Grupo dentro de norma:</span>
              <span className={`badge-${episodio.grupoDentroNorma ? 'success' : 'error'}`}>
                {episodio.grupoDentroNorma ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fechas y estancia */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card p-6">
          <h2 className="title-secondary mb-4">Fechas y Estancia</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Fecha Ingreso:</span>
              <p className="font-medium text-[var(--text-primary)]">
                {episodio.fechaIngreso ? new Date(episodio.fechaIngreso).toLocaleDateString('es-CL') : 'No disponible'}
              </p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Fecha Alta:</span>
              <p className="font-medium text-[var(--text-primary)]">
                {episodio.fechaAlta ? new Date(episodio.fechaAlta).toLocaleDateString('es-CL') : 'No disponible'}
              </p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Días de Estada:</span>
              <p className="font-medium text-[var(--text-primary)]">{episodio.diasEstada || 'No disponible'}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Servicio Alta:</span>
              <p className="font-medium text-[var(--text-primary)]">{episodio.servicioAlta || 'No disponible'}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="title-secondary mb-4">Información Financiera</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Estado RN:</span>
              <span className={`badge-${
                episodio.estadoRN === 'Aprobado' ? 'success' : 
                episodio.estadoRN === 'Pendiente' ? 'warning' : 'error'
              }`}>
                {episodio.estadoRN || 'No disponible'}
              </span>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Monto RN:</span>
              <p className="font-medium text-[var(--text-primary)]">
                {episodio.montoRN ? `$${episodio.montoRN.toLocaleString()}` : 'No disponible'}
              </p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Valor GRD:</span>
              <p className="font-medium text-[var(--text-primary)]">
                {episodio.valorGRD ? `$${episodio.valorGRD.toLocaleString()}` : 'No disponible'}
              </p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Monto Final:</span>
              <p className="font-medium text-[var(--text-primary)]">
                {episodio.montoFinal ? `$${episodio.montoFinal.toLocaleString()}` : 'No disponible'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ajustes por Tecnología */}
      {episodio.at && (
        <div className="card p-6 mt-6">
          <h2 className="title-secondary mb-4">Ajustes por Tecnología (AT)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-[var(--text-secondary)]">AT Detalle:</span>
              <p className="font-medium text-[var(--text-primary)]">{episodio.atDetalle || 'No disponible'}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Monto AT:</span>
              <p className="font-medium text-[var(--text-primary)]">
                {episodio.montoAT ? `$${episodio.montoAT.toLocaleString()}` : 'No disponible'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Documentación */}
      <div className="card p-6 mt-6">
        <h2 className="title-secondary mb-4">Documentación</h2>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-[var(--text-secondary)]">Documentación necesaria:</span>
            <p className="font-medium text-[var(--text-primary)]">{episodio.documentacion || 'No disponible'}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
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
