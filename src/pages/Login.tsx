import { FormEvent, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const role = await login(email, password);
    setLoading(false);
    
    // Redirección según rol
    switch(role) {
      case 'codificador':
        nav('/codificador');
        break;
      case 'finanzas':
        nav('/finanzas');
        break;
      case 'gestion':
        nav('/gestion');
        break;
      case 'admin':
        nav('/admin');
        break;
      default:
        nav('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex items-start justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-md">
          {/* Formulario de login */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            {/* Título */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-open-sauce font-light bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent mb-3 pb-2">
                Ingresar al sistema
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                Acceso exclusivo para equipos GRD, Finanzas y Gestión UC Christus
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Campo Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Campo Contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-medium rounded-xl hover:from-purple-300 hover:to-blue-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </div>
                ) : (
                  'Entrar al sistema'
                )}
              </button>
            </form>

            {/* Información adicional */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                <span className="text-green-500 mr-1">✓</span>
                Sistema seguro y confiable para la gestión GRD
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
