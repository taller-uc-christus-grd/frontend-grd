import { FormEvent, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
export default function Login(){
  const { login } = useAuth(); const nav = useNavigate();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [loading,setLoading]=useState(false);
  async function onSubmit(e:FormEvent){ e.preventDefault(); setLoading(true); await login(email,password); nav('/dashboard'); setLoading(false); }
  return (<main className='max-w-md mx-auto px-4 py-16'><form onSubmit={onSubmit} className='bg-white rounded-2xl shadow p-8 border'><h1 className='text-xl font-semibold'>Ingresar</h1><label className='block text-sm mt-2'>Correo</label><input className='w-full border rounded-lg px-3 py-2' value={email} onChange={e=>setEmail(e.target.value)} /><label className='block text-sm mt-3'>Contraseña</label><input className='w-full border rounded-lg px-3 py-2' type='password' value={password} onChange={e=>setPassword(e.target.value)} /><button disabled={loading} className='mt-4 w-full px-4 py-2 rounded-xl bg-indigo-600 text-white'>{loading?'Entrando...':'Entrar'}</button></form></main>);
}
