// src/App.tsx
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Codificador from '@/pages/Codificador'
import Finanzas from '@/pages/Finanzas'
import Gestion from '@/pages/Gestion'
import Carga from '@/pages/Carga'
import Episodios from '@/pages/Episodios'
import EpisodioDetalle from '@/pages/EpisodioDetalle'
import Exportaciones from '@/pages/Exportaciones'
import Admin from '@/pages/Admin'
import Respaldos from '@/pages/Respaldos'
import Protected from '@/components/Protected'
import Catalogos from '@/pages/Catalogos' 
// Wrapper para poder anidar rutas protegidas con roles opcionales
import type { Role } from '@/types'

function ProtectedWrapper({ roles }: { roles?: Role[] }) {
  return (
    <Protected roles={roles}>
      <Outlet />
    </Protected>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas específicas por rol */}
          <Route element={<ProtectedWrapper roles={['codificador']} />}>
            <Route path="/codificador" element={<Codificador />} />
          </Route>

          <Route element={<ProtectedWrapper roles={['finanzas']} />}>
            <Route path="/finanzas" element={<Finanzas />} />
          </Route>

          <Route element={<ProtectedWrapper roles={['gestion']} />}>
            <Route path="/gestion" element={<Gestion />} />
          </Route>

          <Route element={<ProtectedWrapper roles={['admin']} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Rutas que requieren sesión */}
          <Route element={<ProtectedWrapper />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Solo Codificador */}
            <Route element={<ProtectedWrapper roles={['codificador']} />}>
              <Route path="/carga" element={<Carga />} />
            </Route>

            {/* Episodios (codificador, finanzas, gestión) - sin admin */}
            <Route element={<ProtectedWrapper roles={['codificador', 'finanzas', 'gestion']} />}>
              <Route path="/episodios" element={<Episodios />} />
              <Route path="/episodios/:id" element={<EpisodioDetalle />} />
              <Route path="/respaldos/:episodio" element={<Respaldos />} />
            </Route>

            {/* Finanzas y Gestión - sin admin */}
            <Route element={<ProtectedWrapper roles={['finanzas', 'gestion']} />}>
              <Route path="/exportaciones" element={<Exportaciones />} />
            </Route>

            {/* Solo Codificador → Carga de catálogos */}
            <Route element={<ProtectedWrapper roles={['codificador']} />}>                                                                    
              <Route path="/catalogos" element={<Catalogos />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}
