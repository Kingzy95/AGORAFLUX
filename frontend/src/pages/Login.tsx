import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Button,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Input, Label, Alert, AlertDescription,
  Separator
} from '../components/ui';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      setError(
        err.response?.data?.detail || 
        'Erreur de connexion. Veuillez vérifier vos identifiants.'
      );
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Fonction pour remplir automatiquement les champs de test
  const fillTestCredentials = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setFormData({
        email: 'admin@agoraflux.fr',
        password: 'admin123'
      });
    } else {
      setFormData({
        email: 'utilisateur@agoraflux.fr',
        password: 'user123'
      });
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Bouton retour */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Button>

        {/* Carte principale */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-2 pb-4">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-3">
                <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
                </svg>
                <div>
                  <h1 className="text-2xl font-bold">AgoraFlux</h1>
                </div>
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold">Bon retour !</CardTitle>
            <CardDescription className="text-base">
              Connectez-vous pour accéder à votre espace de collaboration citoyenne
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Affichage des erreurs */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="Votre mot de passe"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 px-0"
                    onClick={handleTogglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            {/* Liens */}
            <div className="text-center space-y-2">
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/forgot-password')}
                className="text-sm"
              >
                Mot de passe oublié ?
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="p-0 h-auto font-medium text-primary hover:underline"
                >
                  Créer un compte
                </Button>
              </div>
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-4 my-6">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground bg-background px-2">
                COMPTES DE DÉMONSTRATION
              </span>
              <Separator className="flex-1" />
            </div>

            {/* Comptes de test */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Testez rapidement l'application :
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillTestCredentials('admin')}
                  className="text-xs"
                  disabled={isLoading}
                >
                  👨‍💼 Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillTestCredentials('user')}
                  className="text-xs"
                  disabled={isLoading}
                >
                  👤 Utilisateur
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-md">
                <div className="flex justify-between">
                  <span>Admin :</span>
                  <span>admin@agoraflux.fr / admin123</span>
                </div>
                <div className="flex justify-between">
                  <span>User :</span>
                  <span>utilisateur@agoraflux.fr / user123</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          En vous connectant, vous acceptez nos{' '}
          <Button variant="link" size="sm" className="text-xs p-0 h-auto">
            conditions d'utilisation
          </Button>
          {' '}et notre{' '}
          <Button variant="link" size="sm" className="text-xs p-0 h-auto">
            politique de confidentialité
          </Button>
        </p>
      </div>
    </div>
  );
};

export default Login; 