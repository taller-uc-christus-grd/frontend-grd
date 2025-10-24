// src/components/Protected.tsx
import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { hasRole } from '@/lib/auth'

type Props = {
  roles?: Role[]
  children?: ReactNode
}

export default function Protected({ roles, children }: Props) {
  const { user } = useAuth()

  // Redirección al login si no hay sesión válida
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Redirección al dashboard si no tiene el rol requerido
  if (roles && !hasRole(user, roles)) {
    return <Navigate to="/dashboard" replace />
  }

  // Si se usa como wrapper, renderiza sus hijos; si no, usa <Outlet/>
  return children ? <>{children}</> : <Outlet />
}

