import { FormEvent, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
export default function Login(){
  const { login } = useAuth(); const nav = useNavigate();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [loading,setLoading]=useState(false);
  async function onSubmit(e:FormEvent){ e.preventDefault(); setLoading(true); await login(email,password); nav('/dashboard'); setLoading(false); }
  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="title-primary mb-2">ConectaGRD</h1>
          <p className="text-[var(--text-secondary)]">Sistema de Gestión Clínica</p>
        </div>
        
        <form onSubmit={onSubmit} className="card-elevated p-8">
          <h2 className="title-secondary mb-6 text-center">Ingresar al sistema</h2>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">Correo electrónico</label>
              <input 
                className="form-input" 
                type="email"
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder="tu@email.com"
                required
              />
            </div>
            
            <div>
              <label className="form-label">Contraseña</label>
              <input 
                className="form-input" 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <button 
            disabled={loading} 
            className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar al sistema'}
          </button>
          
          <p className="text-xs text-[var(--text-muted)] text-center mt-4">
            Acceso exclusivo para equipos GRD, Finanzas y Gestión UC Christus
          </p>
        </form>
      </div>
    </main>
  );
}
