import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TokenExpiryHandler: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ne pas faire de redirection pendant le chargement initial
    if (isLoading) return;

    // Si l'utilisateur n'est pas authentifié et qu'il n'est pas sur une page publique
    const publicPaths = ['/', '/login', '/register'];
    const isPublicPath = publicPaths.includes(location.pathname);

    if (!isAuthenticated && !isPublicPath) {
      console.log('Token expiré, redirection vers le login');
      navigate('/login', { 
        replace: true,
        state: { from: location.pathname } 
      });
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  // Ce composant ne rend rien
  return null;
};

export default TokenExpiryHandler; 