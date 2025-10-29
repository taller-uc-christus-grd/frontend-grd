import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import logo from '@/assets/logo.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [active, setActive] = useState<'inicio' | 'como-funciona' | 'equipo-grd'>('inicio');

  // Navegación a secciones
  function go(sectionId: 'inicio' | 'como-funciona' | 'equipo-grd') {
    if (pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
  }

  // === ScrollSpy ===
useEffect(() => {
  if (pathname !== '/') return;

  const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id as 'inicio' | 'como-funciona' | 'equipo-grd';
          setActive(id);
        }
      });
    },
    {
      root: null,
      threshold: 0.4, // más sensible
      rootMargin: '-100px 0px -40% 0px', // compensa el header fijo
    }
  );

  sections.forEach((s) => observer.observe(s));

  return () => observer.disconnect();
}, [pathname]);


  const colorMap: Record<string, string> = {
    'inicio': 'text-purple-600',
    'como-funciona': 'text-blue-600',
    'equipo-grd': 'text-indigo-600',
  };

  const navItems: Array<{ id: 'inicio' | 'como-funciona' | 'equipo-grd'; label: string }> = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'como-funciona', label: '¿Cómo funciona?' },
    { id: 'equipo-grd', label: 'Equipo GRD' },
  ];

  // Modo login - navbar simplificado
  if (pathname === '/login') {
    return (
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="ConectaGRD" className="h-10 md:h-12 w-auto" />
          </Link>

          {/* Botón de volver */}
          <Link 
            to="/" 
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>
    );
  }

  // Función para determinar la ruta según el rol del usuario
  const getRoleRoute = () => {
    if (!user) return '/';
    switch(user.role) {
      case 'codificador': return '/dashboard';
      case 'finanzas': return '/finanzas';
      case 'gestion': return '/dashboard';
      case 'admin': return '/admin';
      default: return '/dashboard';
    }
  };

  // Modo perfiles - navbar solo con cerrar sesión (para páginas específicas de rol)
  const profileRoutes = ['/codificador', '/finanzas', '/gestion', '/admin', '/dashboard'];
  if (profileRoutes.includes(pathname)) {
    return (
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo - lleva a la página específica del rol */}
          <Link to={getRoleRoute()} className="flex items-center">
            <img src={logo} alt="ConectaGRD" className="h-10 md:h-12 w-auto" />
          </Link>

          {/* Solo botón de cerrar sesión */}
          <button 
            onClick={logout} 
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-purple-300 hover:to-blue-300 transition-all duration-300 shadow-md hover:shadow-xl"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>
    );
  }

  // Modo autenticado - navbar con logo que redirige por rol (para todas las demás páginas)
  if (user) {
    return (
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo - lleva a la página específica del rol */}
          <Link to={getRoleRoute()} className="flex items-center">
            <img src={logo} alt="ConectaGRD" className="h-10 md:h-12 w-auto" />
          </Link>

          {/* Solo botón de cerrar sesión */}
          <button 
            onClick={logout} 
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-purple-300 hover:to-blue-300 transition-all duration-300 shadow-md hover:shadow-xl"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Solo logo grande */}
        <button onClick={() => go('inicio')} className="flex items-center">
          <img src={logo} alt="ConectaGRD" className="h-10 md:h-12 w-auto" />
        </button>

        {/* Menú principal */}
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {navItems.map(({ id, label }, idx) => (
            <div key={id} className="flex items-center">
              <button
                onClick={() => go(id)}
                className={`transition-colors ${
                  active === id
                    ? `${colorMap[id]} font-semibold`
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>

              {/* separador entre botones (excepto el último) */}
              {idx < navItems.length - 1 && (
                <span className="mx-4 h-5 w-px bg-slate-300" />
              )}
            </div>
          ))}

          {/* CTA: Ingresar o Salir */}
          {user ? (
            <button onClick={logout} className="px-3 py-1 rounded-xl bg-slate-100">
              Salir
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-xl bg-black text-white hover:opacity-90"
            >
              Ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}


