// src/App.tsx
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Carga from '@/pages/Carga'
import Episodios from '@/pages/Episodios'
import EpisodioDetalle from '@/pages/EpisodioDetalle'
import Exportaciones from '@/pages/Exportaciones'
import Admin from '@/pages/Admin'
import Respaldos from '@/pages/Respaldos'
import Protected from '@/components/Protected'

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

          {/* Rutas que requieren sesión */}
          <Route element={<ProtectedWrapper />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Codificador y Admin */}
            <Route element={<ProtectedWrapper roles={['codificador', 'admin']} />}>
              <Route path="/carga" element={<Carga />} />
            </Route>

            {/* Episodios (visibles autenticado cualquiera) */}
            <Route path="/episodios" element={<Episodios />} />
            <Route path="/episodios/:id" element={<EpisodioDetalle />} />
            <Route path="/respaldos/:episodio" element={<Respaldos />} />

            {/* Finanzas y Gestión */}
            <Route element={<ProtectedWrapper roles={['finanzas', 'gestion']} />}>
              <Route path="/exportaciones" element={<Exportaciones />} />
            </Route>

            {/* Solo Admin */}
            <Route element={<ProtectedWrapper roles={['admin']} />}>
              <Route path="/admin" element={<Admin />} />
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