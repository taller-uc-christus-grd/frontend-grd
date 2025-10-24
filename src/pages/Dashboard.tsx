// src/pages/Dashboard.tsx
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  const can = (roles: Array<'codificador' | 'finanzas' | 'gestion' | 'admin'>) =>
    !!role && roles.includes(role);

  return (
    <main className="main-container-lg">
      <header className="mb-8">
        <h1 className="title-primary">Bienvenido/a</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Sesión: <span className="font-medium text-[var(--text-primary)]">{user?.email}</span> — 
          Rol: <span className="font-medium text-[var(--primary-blue)]">{role}</span>
        </p>
      </header>

      {/* Módulos del sistema */}
      <section className="mb-10">
        <h2 className="title-section">Módulos del Sistema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Carga (codificador + admin) */}
          {can(['codificador', 'admin']) && (
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

          {/* Episodios (cualquiera autenticado) */}
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

          {/* Exportaciones (finanzas + gestión) */}
          {can(['finanzas', 'gestion']) && (
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

          {/* Catálogos: admin + finanzas + gestión */}
          {can(['admin', 'finanzas', 'gestion']) && (
            <Link to="/catalogos" className="card-interactive p-6 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-800 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">📚</span>
                </div>
                <div className="font-medium text-[var(--text-primary)]">Catálogos & Norma</div>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Subir Norma MINSAL, AT y Precios Base (Excel).
              </p>
            </Link>
          )}

          {/* Administración (solo admin) */}
          {can(['admin']) && (
            <Link to="/admin" className="card-interactive p-6 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-800 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">⚙️</span>
                </div>
                <div className="font-medium text-[var(--text-primary)]">Administración</div>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Usuarios, permisos y configuración global.
              </p>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
