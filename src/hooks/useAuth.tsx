import { createContext, useContext, useMemo, useState } from 'react';
import type { User, Role } from '@/types';
import { getStoredUser, storeUser } from '@/lib/auth';

const Ctx = createContext<any>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  
  async function login(email: string, _password: string) {
    const role: Role = email.includes('fin') ? 'finanzas' : email.includes('ges') ? 'gestion' : email.includes('admin') ? 'admin' : 'codificador';
    const mock: User = { id: 'u1', email, role, token: 'mock' };
    setUser(mock); 
    storeUser(mock);
    
    // Retornar el rol para redirección
    return role;
  }
  
  function logout(){ 
    setUser(null); 
    storeUser(null);
    // Redirigir a login después de cerrar sesión
    window.location.href = '/login';
  }
  
  const value = useMemo(()=>({ user, login, logout }),[user]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(){ 
  const ctx = useContext(Ctx); 
  if(!ctx) throw new Error('useAuth within AuthProvider'); 
  return ctx; 
}
