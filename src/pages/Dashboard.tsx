// src/pages/Dashboard.tsx
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  const can = (roles: Array<'codificador' | 'finanzas' | 'gestion' | 'admin'>) =>
    !!role && roles.includes(role);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <header>
        <h1 className="text-xl font-semibold">Bienvenido/a</h1>
        <p className="text-slate-600 mt-1">
          Sesión: <b>{user?.email}</b> — Rol: <b>{role}</b>
        </p>
      </header>

      {/* Módulo: Operación diaria */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700 mb-3">Operación</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Carga (codificador + admin) */}
          {can(['codificador', 'admin']) && (
            <Link to="/carga" className="bg-white rounded-xl p-6 border block hover:shadow-sm">
              <div className="font-medium">Carga archivo maestro</div>
              <p className="text-sm text-slate-600 mt-1">
                Subir extracto SIGESA (Excel) para procesar episodios.
              </p>
            </Link>
          )}

          {/* Episodios (cualquiera autenticado) */}
          <Link to="/episodios" className="bg-white rounded-xl p-6 border block hover:shadow-sm">
            <div className="font-medium">Episodios</div>
            <p className="text-sm text-slate-600 mt-1">
              Listado, búsqueda y detalle por episodio.
            </p>
          </Link>

          {/* Exportaciones (finanzas + gestión) */}
          {can(['finanzas', 'gestion']) && (
            <Link to="/exportaciones" className="bg-white rounded-xl p-6 border block hover:shadow-sm">
              <div className="font-medium">Exportaciones</div>
              <p className="text-sm text-slate-600 mt-1">
                Generar planilla final para FONASA.
              </p>
            </Link>
          )}
        </div>
      </section>

      {/* Módulo: Catálogos y configuración */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700 mb-3">Configuración</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Catálogos: admin + finanzas + gestión */}
          {can(['admin', 'finanzas', 'gestion']) && (
            <Link to="/catalogos" className="bg-white rounded-xl p-6 border block hover:shadow-sm">
              <div className="font-medium">Catálogos & Norma</div>
              <p className="text-sm text-slate-600 mt-1">
                Subir Norma MINSAL, AT y Precios Base (Excel).
              </p>
            </Link>
          )}

          {/* Administración (solo admin) */}
          {can(['admin']) && (
            <Link to="/admin" className="bg-white rounded-xl p-6 border block hover:shadow-sm">
              <div className="font-medium">Administración</div>
              <p className="text-sm text-slate-600 mt-1">
                Usuarios, permisos y configuración global.
              </p>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
