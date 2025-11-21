/**
 * Ejemplo de uso de las funciones de API
 * 
 * Este componente muestra ejemplos prácticos de cómo usar:
 * - useAuth hook para autenticación
 * - authService para funciones de auth directas
 * - apiHelpers para peticiones autenticadas
 * 
 * NO usar este componente en producción, es solo para referencia.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUser as getCurrentUserService } from '@/services/authService';
import { apiGet, apiPost, apiPatch, apiDelete, uploadFile } from '@/services/apiHelpers';
import type { Episode, User } from '@/types';

export default function ApiUsageExample() {
  const { user, login, logout, getCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Ejemplo 1: Usar el hook useAuth para login
  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    try {
      const role = await login('usuario@example.com', 'password123');
      setMessage(`Login exitoso! Rol: ${role}`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo 2: Obtener usuario actual usando el hook
  const handleGetCurrentUserHook = async () => {
    setLoading(true);
    setMessage('');
    try {
      const currentUser = await getCurrentUser();
      setMessage(`Usuario actual: ${currentUser.email} (${currentUser.role})`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo 3: Obtener usuario actual usando el servicio directo
  const handleGetCurrentUserService = async () => {
    setLoading(true);
    setMessage('');
    try {
      const currentUser = await getCurrentUserService();
      setMessage(`Usuario desde servicio: ${currentUser.email} (${currentUser.role})`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo 4: Hacer una petición GET autenticada
  const handleGetEpisodios = async () => {
    setLoading(true);
    setMessage('');
    try {
      // El token se agrega automáticamente por el interceptor de axios
      const episodios = await apiGet<Episode[]>('/api/episodios');
      setMessage(`Obtenidos ${episodios?.length || 0} episodios`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo 5: Hacer una petición POST autenticada
  const handleCreateEpisodio = async () => {
    setLoading(true);
    setMessage('');
    try {
      const nuevoEpisodio = await apiPost<Episode>('/api/episodios', {
        episodio: '12345',
        rut: '12345678-9',
        nombre: 'Juan Pérez',
        fechaIngreso: '2024-01-15',
      });
      setMessage(`Episodio creado: ${nuevoEpisodio.episodio}`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo 6: Hacer una petición PATCH autenticada
  const handleUpdateEpisodio = async (episodioId: string) => {
    setLoading(true);
    setMessage('');
    try {
      const episodioActualizado = await apiPatch<Episode>(`/api/episodios/${episodioId}`, {
        validado: true,
        estadoRN: 'Aprobado',
      });
      setMessage(`Episodio ${episodioActualizado.episodio} actualizado`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo 7: Hacer una petición DELETE autenticada
  const handleDeleteEpisodio = async (episodioId: string) => {
    setLoading(true);
    setMessage('');
    try {
      await apiDelete(`/api/episodios/${episodioId}`);
      setMessage(`Episodio ${episodioId} eliminado`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo 8: Subir un archivo
  const handleUploadFile = async (file: File) => {
    setLoading(true);
    setMessage('');
    try {
      const result = await uploadFile('/api/upload', file, {
        tipo: 'episodios',
        centro: 'Hospital1',
      });
      setMessage(`Archivo subido: ${JSON.stringify(result)}`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo 9: Verificar usuario al cargar
  useEffect(() => {
    if (user) {
      console.log('Usuario autenticado:', user.email, user.role);
    }
  }, [user]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ejemplos de Uso de API</h1>

      {/* Estado actual */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-semibold mb-2">Estado Actual:</h2>
        {user ? (
          <p>Usuario: {user.email} ({user.role})</p>
        ) : (
          <p>No hay usuario autenticado</p>
        )}
      </div>

      {/* Mensajes */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Botones de ejemplo */}
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">1. Autenticación (useAuth hook)</h3>
          <div className="space-x-2">
            <button
              onClick={handleLogin}
              disabled={loading || !!user}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Login (usar hook)
            </button>
            <button
              onClick={handleGetCurrentUserHook}
              disabled={loading || !user}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              Obtener Usuario (hook)
            </button>
            <button
              onClick={logout}
              disabled={loading || !user}
              className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">2. Servicio de Auth directo</h3>
          <button
            onClick={handleGetCurrentUserService}
            disabled={loading || !user}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
          >
            Obtener Usuario (servicio directo)
          </button>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">3. Peticiones Autenticadas</h3>
          <div className="space-x-2 flex flex-wrap gap-2">
            <button
              onClick={handleGetEpisodios}
              disabled={loading || !user}
              className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
            >
              GET Episodios
            </button>
            <button
              onClick={handleCreateEpisodio}
              disabled={loading || !user}
              className="px-4 py-2 bg-teal-500 text-white rounded disabled:opacity-50"
            >
              POST Crear Episodio
            </button>
            <button
              onClick={() => handleUpdateEpisodio('123')}
              disabled={loading || !user}
              className="px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
            >
              PATCH Actualizar Episodio
            </button>
            <button
              onClick={() => handleDeleteEpisodio('123')}
              disabled={loading || !user}
              className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
            >
              DELETE Episodio
            </button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">4. Subir Archivo</h3>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadFile(file);
            }}
            disabled={loading || !user}
            className="disabled:opacity-50"
          />
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="ml-2">Cargando...</span>
        </div>
      )}

      {/* Nota */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Este componente es solo para referencia y ejemplos.
          No lo uses en producción. Todas las peticiones incluyen automáticamente
          el token JWT del usuario autenticado.
        </p>
      </div>
    </div>
  );
}

