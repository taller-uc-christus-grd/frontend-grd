import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import grdLogo from '@/assets/GRD.png';
export default function Navbar(){
  const { user, logout } = useAuth();
  return (<header className="bg-white border-b border-slate-200">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-3 font-semibold">
        <img src={grdLogo} alt="GRD Logo" className="h-8 w-auto" />
        <span>UC Christus – GRD</span>
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {user ? (<><Link to="/dashboard">Dashboard</Link><button className="px-3 py-1 rounded-lg bg-slate-100" onClick={logout}>Salir</button></>)
               : (<Link to="/login" className="px-3 py-1 rounded-lg bg-indigo-600 text-white">Ingresar</Link>)}
      </nav>
    </div></header>);
}
