import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'moderateur' | 'utilisateur';
  requiresAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requiresAuth = true 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Afficher un spinner pendant le chargement
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Si l'authentification est requise mais l'utilisateur n'est pas connecté
  if (requiresAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si un rôle spécifique est requis
  if (requiredRole && user) {
    const hasRequiredRole = () => {
      switch (requiredRole) {
        case 'admin':
          return user.role === 'admin';
        case 'moderateur':
          return user.role === 'admin' || user.role === 'moderateur';
        case 'utilisateur':
          return ['admin', 'moderateur', 'utilisateur'].includes(user.role);
        default:
          return false;
      }
    };

    if (!hasRequiredRole()) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 