import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Button,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Input, Label, Alert, AlertDescription,
  Separator, Textarea
} from '../components/ui';
import { 
  Eye, EyeOff, Mail, Lock, User, ArrowLeft, Loader2, 
  CheckCircle, AlertCircle, Info 
} from 'lucide-react';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  bio: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  bio?: string;
  general?: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);

  // Validation des champs en temps réel
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'firstName':
        return value.length < 2 ? 'Le prénom doit contenir au moins 2 caractères' : undefined;
      case 'lastName':
        return value.length < 2 ? 'Le nom doit contenir au moins 2 caractères' : undefined;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Adresse email invalide' : undefined;
      case 'password':
        if (value.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre';
        }
        return undefined;
      case 'confirmPassword':
        return value !== formData.password ? 'Les mots de passe ne correspondent pas' : undefined;
      case 'bio':
        return value.length > 500 ? 'La biographie ne peut pas dépasser 500 caractères' : undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Validation en temps réel
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error,
      general: undefined // Effacer l'erreur générale
    }));

    // Revalider confirmPassword si password change
    if (name === 'password' && formData.confirmPassword) {
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmError
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Valider tous les champs obligatoires
    ['firstName', 'lastName', 'email', 'password', 'confirmPassword'].forEach(key => {
      const error = validateField(key, formData[key as keyof RegisterFormData]);
      if (error) newErrors[key as keyof ValidationErrors] = error;
    });

    // Valider bio si renseignée
    if (formData.bio) {
      const bioError = validateField('bio', formData.bio);
      if (bioError) newErrors.bio = bioError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);

    if (!validateForm()) {
      setIsValidating(false);
      return;
    }

    try {
      await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        bio: formData.bio || undefined // N'envoyer bio que si renseigné
      });
      
      // Redirection vers la page de bienvenue ou dashboard
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Erreur d\'inscription:', err);
      setErrors({
        general: err.response?.data?.detail || 'Une erreur s\'est produite lors de l\'inscription'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    return {
      score: strength,
      label: ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength] || 'Très faible',
      color: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strength] || 'bg-gray-300'
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const hasValidationErrors = Object.values(errors).some(error => error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        
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
            
            <CardTitle className="text-2xl font-bold">Rejoignez la communauté</CardTitle>
            <CardDescription className="text-base">
              Créez votre compte pour participer à la démocratie citoyenne
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Affichage des erreurs générales */}
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    Prénom *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      placeholder="Votre prénom"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-red-500">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Nom *
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    placeholder="Votre nom"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Adresse email *
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
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Biographie */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">
                  Biographie (optionnel)
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Parlez-nous de vos intérêts et de votre motivation à participer à la démocratie citoyenne..."
                  value={formData.bio}
                  onChange={handleChange}
                  className={`resize-none ${errors.bio ? 'border-red-500' : ''}`}
                  rows={3}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Décrivez vos centres d'intérêt et motivations</span>
                  <span>{formData.bio.length}/500</span>
                </div>
                {errors.bio && (
                  <p className="text-xs text-red-500">{errors.bio}</p>
                )}
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mot de passe *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Créez un mot de passe"
                    value={formData.password}
                    onChange={handleChange}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 px-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Indicateur de force du mot de passe */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmer le mot de passe *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Confirmez votre mot de passe"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 px-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                )}
                {formData.confirmPassword && !errors.confirmPassword && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Les mots de passe correspondent
                  </div>
                )}
              </div>

              {/* Info RGPD */}
              <div className="bg-muted/30 p-3 rounded-md">
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    En créant un compte, vous acceptez nos{' '}
                    <Button variant="link" size="sm" className="text-xs p-0 h-auto underline">
                      conditions d'utilisation
                    </Button>
                    {' '}et notre{' '}
                    <Button variant="link" size="sm" className="text-xs p-0 h-auto underline">
                      politique de confidentialité
                    </Button>
                    . Vos données sont protégées selon le RGPD.
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || isValidating || hasValidationErrors}
              >
                {isLoading || isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>
            </form>

            {/* Séparateur et lien vers login */}
            <div className="flex items-center gap-4 my-6">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground bg-background px-2">
                DÉJÀ MEMBRE ?
              </span>
              <Separator className="flex-1" />
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Vous avez déjà un compte ?{' '}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="p-0 h-auto font-medium text-primary hover:underline"
                >
                  Se connecter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register; 