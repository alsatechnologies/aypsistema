import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from './Layout';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredModule,
  requireAdmin = false 
}) => {
  const { usuario, loading, tienePermiso, esAdministrador } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !esAdministrador()) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-red-600">No tienes permisos para acceder a esta sección.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (requiredModule && !tienePermiso(requiredModule)) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-yellow-800 font-semibold mb-2">Acceso Restringido</h2>
            <p className="text-yellow-600">Tu rol no tiene acceso a este módulo.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;


