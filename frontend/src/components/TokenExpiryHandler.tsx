import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Composant pour gérer l'expiration automatique des tokens
 * Intercepte les réponses 401 et redirige vers la page de connexion
 */
const TokenExpiryHandler: React.FC = () => {
  const { logout } = useAuth();

  useEffect(() => {
    // Intercepter les requêtes fetch pour gérer l'expiration des tokens
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Si la réponse est 401 Unauthorized, le token a expiré
      if (response.status === 401) {
        // Vérifier si c'est bien une erreur d'authentification
        const url = args[0] as string;
        
        // Ignorer les endpoints qui peuvent naturellement retourner 401
        const ignoredEndpoints = ['/api/v1/auth/login', '/api/v1/auth/register'];
        const shouldHandle = !ignoredEndpoints.some(endpoint => 
          typeof url === 'string' && url.includes(endpoint)
        );
        
        if (shouldHandle) {
          console.warn('🔒 Token expiré détecté, redirection vers la page de connexion...');
          
          // Supprimer le token expiré
          localStorage.removeItem('token');
          
          // Déconnecter l'utilisateur
          logout();
          
          // Rediriger vers la page de connexion
          window.location.href = '/login';
        }
      }
      
      return response;
    };

    // Nettoyer l'intercepteur au démontage du composant
    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default TokenExpiryHandler; 