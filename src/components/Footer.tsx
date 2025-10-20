import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

export default function Footer() {
  return (
    <footer className="bg-gray-200 text-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Logo y descripción */}
          <div className="md:col-span-2">
            <img src={logo} alt="ConectaGRD" className="h-12 mb-4" />
            <p className="text-gray-600 text-sm leading-relaxed mb-4 max-w-md">
              Sistema integral de gestión GRD que automatiza y simplifica los procesos 
              de codificación, validación y facturación para equipos de salud.
            </p>
            <div className="flex items-center text-sm text-gray-600">
              <span className="text-green-500 mr-2">✓</span>
              Sistema seguro y confiable para UC Christus
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Inicio
                </Link>
              </li>
              <li>
                <Link 
                  to="/" 
                  onClick={() => {
                    setTimeout(() => {
                      document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  ¿Cómo funciona?
                </Link>
              </li>
              <li>
                <Link 
                  to="/" 
                  onClick={() => {
                    setTimeout(() => {
                      document.getElementById('equipo-grd')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Equipo GRD
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Ingresar al sistema
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea separadora */}
        <div className="border-t border-gray-300 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2024 ConectaGRD. Todos los derechos reservados.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-gray-500 text-xs">
                Desarrollado para UC Christus
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}