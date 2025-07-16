import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UpdateProfileRequest } from '../types/auth';
import {
  Button,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Input, Label, Textarea, Alert, AlertDescription,
  Avatar, AvatarFallback, AvatarImage,
  Separator, Badge
} from '../components/ui';
import { 
  User, Save, Loader2, CheckCircle, AlertCircle, Camera, 
  Mail, Calendar, Shield, Eye
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    first_name: '',
    last_name: '',
    bio: '',
    avatar_url: ''
  });

  // Initialiser le formulaire avec les données utilisateur
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof UpdateProfileRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Effacer les messages précédents
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Filtrer les champs vides ou inchangés
      const updates: UpdateProfileRequest = {};
      
      if (formData.first_name?.trim() !== user?.first_name) {
        updates.first_name = formData.first_name?.trim();
      }
      if (formData.last_name?.trim() !== user?.last_name) {
        updates.last_name = formData.last_name?.trim();
      }
      if (formData.bio?.trim() !== user?.bio) {
        updates.bio = formData.bio?.trim();
      }
      if (formData.avatar_url?.trim() !== user?.avatar_url) {
        updates.avatar_url = formData.avatar_url?.trim();
      }

      // Ne faire la requête que s'il y a des changements
      if (Object.keys(updates).length === 0) {
        setErrorMessage('Aucune modification détectée');
        return;
      }

      await updateProfile(updates);
      setSuccessMessage('Profil mis à jour avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      setErrorMessage(
        error.response?.data?.detail || 
        'Erreur lors de la mise à jour du profil'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderateur': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'moderateur': return 'Modérateur';
      default: return 'Utilisateur';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement du profil...</span>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* En-tête du profil */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
        <div className="relative">
          <Avatar className="h-24 w-24 md:h-32 md:w-32">
            <AvatarImage src={user.avatar_url || formData.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
            <AvatarFallback className="text-xl md:text-2xl bg-blue-500 text-white">
              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Button 
            size="sm" 
            variant="outline" 
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
            disabled
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {user.first_name} {user.last_name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getRoleColor(user.role)}>
              <Shield className="h-3 w-3 mr-1" />
              {getRoleLabel(user.role)}
            </Badge>
            {user.is_verified && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Vérifié
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
          {user.bio && (
            <p className="text-gray-700 mt-2">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Formulaire d'édition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Modifier mon profil
          </CardTitle>
          <CardDescription>
            Mettez à jour vos informations personnelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Messages d'état */}
            {successMessage && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Champs du formulaire */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleInputChange('first_name')}
                  placeholder="Votre prénom"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleInputChange('last_name')}
                  placeholder="Votre nom"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">URL de l'avatar</Label>
              <Input
                id="avatar_url"
                type="url"
                value={formData.avatar_url}
                onChange={handleInputChange('avatar_url')}
                placeholder="https://exemple.com/avatar.jpg"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Entrez l'URL d'une image pour votre avatar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biographie</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={handleInputChange('bio')}
                placeholder="Parlez-nous un peu de vous..."
                rows={4}
                disabled={isLoading}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {formData.bio?.length || 0}/500 caractères
              </p>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Eye className="h-4 w-4" />
                Les modifications seront visibles par les autres utilisateurs
              </div>
              
              <Button type="submit" disabled={isLoading} className="sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Informations du compte */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>
            Détails techniques de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-gray-600">ID utilisateur</Label>
              <p className="text-sm font-mono text-gray-900">#{user.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Statut</Label>
              <p className="text-sm text-gray-900">
                {user.is_active ? '✅ Actif' : '❌ Inactif'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Dernière connexion</Label>
              <p className="text-sm text-gray-900">
                {user.last_login 
                  ? new Date(user.last_login).toLocaleString('fr-FR')
                  : 'Jamais'
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Compte créé</Label>
              <p className="text-sm text-gray-900">
                {new Date(user.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile; 