// src/pages/Dashboard.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hasRole } from '@/lib/auth';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Si es admin, redirigir automáticamente a /admin
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <main className="main-container-lg">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ No autenticado</h1>
          <p className="text-gray-600 mb-6">No se encontró usuario en la sesión</p>
          <a href="/login" className="btn-primary">Ir a Login</a>
        </div>
      </main>
    );
  }

  // Si es admin, mostrar loading mientras redirige
  if (user.role === 'admin') {
    return (
      <main className="main-container-lg">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo a administración...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="main-container-lg">
      <header className="mb-8">
        <h1 className="title-primary">Bienvenido/a</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Sesión: <span className="font-medium text-[var(--text-primary)]">{user?.email || 'No autenticado'}</span> — 
          Rol: <span className="font-medium text-[var(--primary-blue)]">{user?.role || 'Sin rol'}</span>
        </p>
      </header>

      {/* Módulos del sistema */}
      <section className="mb-10">
        <h2 className="title-section">Módulos del Sistema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* Carga (solo codificador) */}
          {hasRole(user, ['codificador']) && (
            <Link to="/carga" className="card-interactive p-6 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-800 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">📁</span>
                </div>
                <div className="font-medium text-[var(--text-primary)]">Carga archivo maestro</div>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Subir extracto SIGESA (Excel) para procesar episodios.
              </p>
            </Link>
          )}

          {/* Episodios (codificador, finanzas, gestión) */}
          {hasRole(user, ['codificador', 'finanzas', 'gestion']) && (
            <Link to="/episodios" className="card-interactive p-6 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-800 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">📋</span>
                </div>
                <div className="font-medium text-[var(--text-primary)]">Episodios</div>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Listado, búsqueda y detalle por episodio.
              </p>
            </Link>
          )}

          {/* Exportaciones (finanzas + gestión) */}
          {hasRole(user, ['finanzas', 'gestion']) && (
            <Link to="/exportaciones" className="card-interactive p-6 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-800 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">📊</span>
                </div>
                <div className="font-medium text-[var(--text-primary)]">Exportaciones</div>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Generar planilla final para FONASA.
              </p>
            </Link>
          )}

          {/* Catálogos: solo codificador */}
          {hasRole(user, ['codificador']) && (
            <Link to="/catalogos" className="card-interactive p-6 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-800 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">📚</span>
                </div>
                <div className="font-medium text-[var(--text-primary)]">Carga de Norma MINSAL</div>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Subir Norma MINSAL (Excel).
              </p>
            </Link>
          )}

        </div>
      </section>
    </main>
  );
}
