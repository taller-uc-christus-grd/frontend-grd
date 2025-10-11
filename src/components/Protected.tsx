import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { hasRole } from '@/lib/auth';
export default function Protected({ roles }: { roles?: Role[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !hasRole(user, roles)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
