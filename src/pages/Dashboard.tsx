// src/pages/Dashboard.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hasRole } from '@/lib/auth';
import { useEffect } from 'react';
import exportImg from '@/assets/export.png';
import documentImg from '@/assets/document.png';
import folderImg from '@/assets/folder.png';
import minsalImg from '@/assets/minsal.png';

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
    <main className="max-w-[1400px] mx-auto px-6 py-14 md:py-20">
      {/* Header: tarjeta superior mostrando rol real (no Admin) */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-open-sauce font-light bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              {formatRole(user?.role)}
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              Sesión: <span className="font-medium text-slate-900">{user?.email || 'No autenticado'}</span> · Rol: <span className="font-medium text-purple-600 capitalize">{user?.role || 'Sin rol'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Contenedor de Módulos: título más grande y delgado */}
      <section className="mb-10">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200/70">
            <h2 className="text-xl md:text-2xl font-open-sauce font-light text-slate-900">Módulos del Sistema</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Carga (solo codificador) */}
          {hasRole(user, ['codificador']) && (
            <Link to="/carga" className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6 transition-all hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-purple-200 group">
              <div className="flex items-center mb-3">
                <img src={folderImg} alt="Carga archivo maestro" className="w-8 h-8 mr-3 select-none object-contain" style={{ filter: 'invert(23%) sepia(92%) saturate(7475%) hue-rotate(261deg) brightness(93%) contrast(96%)' }} />
                <div className="text-purple-600 text-lg font-medium">Carga archivo maestro</div>
              </div>
              <p className="text-sm text-slate-600 mb-4">Subir extracto SIGESA (Excel) para procesar episodios.</p>
              <button className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-300">Haz click para entrar</button>
            </Link>
          )}

          {/* Episodios (codificador, finanzas, gestión) */}
          {hasRole(user, ['codificador', 'finanzas', 'gestion']) && (
            <Link to="/episodios" className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6 transition-all hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-sky-200 group">
              <div className="flex items-center mb-3">
                <img src={documentImg} alt="Episodios" className="w-8 h-8 mr-3 select-none object-contain" style={{ filter: 'invert(35%) sepia(67%) saturate(1121%) hue-rotate(181deg) brightness(94%) contrast(92%)' }} />
                <div className="text-sky-600 text-lg font-medium">Episodios</div>
              </div>
              <p className="text-sm text-slate-600 mb-4">Listado, búsqueda y detalle por episodio.</p>
              <button className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-300">Haz click para entrar</button>
            </Link>
          )}

          {/* Exportaciones (finanzas + gestión) */}
          {hasRole(user, ['finanzas', 'gestion']) && (
            <Link to="/exportaciones" className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6 transition-all hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-purple-200 group">
              <div className="flex items-center mb-3">
                <img src={exportImg} alt="Exportaciones" className="w-8 h-8 mr-3 select-none object-contain" style={{ filter: 'invert(23%) sepia(92%) saturate(7475%) hue-rotate(261deg) brightness(93%) contrast(96%)' }} />
                <div className="text-purple-600 text-lg font-medium">Exportaciones</div>
              </div>
              <p className="text-sm text-slate-600 mb-4">Generar planilla final para FONASA.</p>
              <button className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-300">Haz click para entrar</button>
            </Link>
          )}

          {/* Precios Convenios (finanzas + gestión) */}
          {hasRole(user, ['finanzas', 'gestion']) && (
            <Link to="/precios-convenios" className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6 transition-all hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-green-200 group">
              <div className="flex items-center mb-3">
                <img src={documentImg} alt="Precios Convenios" className="w-8 h-8 mr-3 select-none object-contain" style={{ filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' }} />
                <div className="text-green-600 text-lg font-medium">Precios Convenios</div>
              </div>
              <p className="text-sm text-slate-600 mb-4">Gestiona los precios de convenios por aseguradora, tipo y tramo.</p>
              <button className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-300">Haz click para entrar</button>
            </Link>
          )}

          {/* Ajustes Por Tecnología (finanzas + gestión) */}
          {hasRole(user, ['finanzas', 'gestion']) && (
            <Link to="/ajustes-tecnologia" className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6 transition-all hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-blue-200 group">
              <div className="flex items-center mb-3">
                <img src={documentImg} alt="Ajustes Por Tecnología" className="w-8 h-8 mr-3 select-none object-contain" style={{ filter: 'invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' }} />
                <div className="text-blue-600 text-lg font-medium">Ajustes Por Tecnología</div>
              </div>
              <p className="text-sm text-slate-600 mb-4">Gestiona los ajustes por tecnología (AT) y sus montos asociados.</p>
              <button className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-300">Haz click para entrar</button>
            </Link>
          )}

          {/* Catálogos: solo codificador */}
          {hasRole(user, ['codificador']) && (
            <Link to="/catalogos" className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6 transition-all hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-purple-200 group">
              <div className="flex items-center mb-3">
                <img src={minsalImg} alt="Carga de Norma MINSAL" className="w-8 h-8 mr-3 select-none object-contain" style={{ filter: 'invert(44%) sepia(78%) saturate(1926%) hue-rotate(241deg) brightness(97%) contrast(93%)' }} />
                <div className="text-purple-400 text-lg font-medium">Carga de Norma MINSAL</div>
              </div>
              <p className="text-sm text-slate-600 mb-4">Subir Norma MINSAL (Excel).</p>
              <button className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-300">Haz click para entrar</button>
            </Link>
          )}

          </div>
        </div>
      </section>
    </main>
  );
}

function formatRole(role?: string) {
  if (!role) return 'Panel';
  const map: Record<string, string> = {
    finanzas: 'Finanzas',
    gestion: 'Gestión',
    codificador: 'Codificador',
    admin: 'Administrador',
  };
  return map[role] || role.charAt(0).toUpperCase() + role.slice(1);
}
