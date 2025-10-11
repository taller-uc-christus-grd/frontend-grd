import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Carga from '@/pages/Carga';
import Episodios from '@/pages/Episodios';
import EpisodioDetalle from '@/pages/EpisodioDetalle';
import Exportaciones from '@/pages/Exportaciones';
import Admin from '@/pages/Admin';
import Respaldos from '@/pages/Respaldos';
import Protected from '@/components/Protected';

function ProtectedWrapper({ roles }: any){
  return (<Protected roles={roles}><Outlet /></Protected>);
}

export default function App(){
  return (<div className="min-h-screen flex flex-col">
    <Navbar />
    <div className="flex-1">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedWrapper />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route element={<ProtectedWrapper roles={['codificador','admin']}}>
            <Route path="/carga" element={<Carga />} />
          </Route>
          <Route path="/episodios" element={<Episodios />} />
          <Route path="/episodios/:id" element={<EpisodioDetalle />} />
          <Route path="/respaldos/:episodio" element={<Respaldos />} />
          <Route element={<ProtectedWrapper roles={['finanzas','gestion']}}>
            <Route path="/exportaciones" element={<Exportaciones />} />
          </Route>
          <Route element={<ProtectedWrapper roles={['admin']}}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
    <Footer />
  </div>);
}
