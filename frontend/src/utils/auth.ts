/**
 * Utilitaires pour la gestion de l'authentification côté client
 */

/**
 * Vérifie si un token JWT est expiré
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  
  try {
    // Décoder le payload du JWT (partie centrale encodée en base64)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000; // Temps actuel en secondes
    
    // Vérifier si le token a expiré
    return payload.exp < currentTime;
  } catch (error) {
    // Si le décodage échoue, considérer le token comme expiré
    console.warn('Erreur lors de la vérification du token:', error);
    return true;
  }
};

/**
 * Récupère le token depuis localStorage et vérifie s'il est valide
 */
export const getValidToken = (): string | null => {
  const token = localStorage.getItem('token');
  
  if (!token || isTokenExpired(token)) {
    // Supprimer le token expiré
    if (token) {
      localStorage.removeItem('token');
      console.warn('Token expiré supprimé du localStorage');
    }
    return null;
  }
  
  return token;
};

/**
 * Nettoie les données d'authentification du localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('Données d\'authentification nettoyées');
};

/**
 * Redirige vers la page de connexion avec un message optionnel
 */
export const redirectToLogin = (reason?: string): void => {
  if (reason) {
    console.warn(`Redirection vers login: ${reason}`);
  }
  
  clearAuthData();
  window.location.href = '/login';
}; 