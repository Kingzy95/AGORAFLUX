import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import {
  Button,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Input, Textarea, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Checkbox,
  Badge, Separator, Progress,
  Alert, AlertDescription,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '../components/ui';
import {
  Save, Upload, FileText, Database, Users, Settings,
  Info, AlertCircle, CheckCircle, X, Plus, Trash2, Eye, EyeOff,
  FolderOpen, Tag, Target, Lightbulb, BarChart3, Globe, Lock, Shield, ArrowLeft
} from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  tags: string;
  objectives: string;
  methodology: string;
  expected_outcomes: string;
  visibility: 'public' | 'private' | 'restricted';
  allow_comments: boolean;
  allow_contributions: boolean;
  moderation_enabled: boolean;
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  description: string;
  type: 'CSV' | 'JSON' | 'EXCEL' | 'API';
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  datasetId?: number;
}

const NewProject: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États du formulaire
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    tags: '',
    objectives: '',
    methodology: '',
    expected_outcomes: '',
    visibility: 'public',
    allow_comments: true,
    allow_contributions: true,
    moderation_enabled: false
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Validation en temps réel
  const [validation, setValidation] = useState({
    title: { isValid: true, message: '' },
    description: { isValid: true, message: '' },
    tags: { isValid: true, message: '' },
    files: { isValid: true, message: '' }
  });

  // Gérer les changements de formulaire
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validation en temps réel
    if (field === 'title') {
      const isValid = value.toString().length >= 5 && value.toString().length <= 255;
      setValidation(prev => ({
        ...prev,
        title: {
          isValid,
          message: isValid ? '' : 'Le titre doit contenir entre 5 et 255 caractères'
        }
      }));
    }
    
    if (field === 'description') {
      const isValid = value.toString().length >= 20 && value.toString().length <= 5000;
      setValidation(prev => ({
        ...prev,
        description: {
          isValid,
          message: isValid ? '' : 'La description doit contenir entre 20 et 5000 caractères'
        }
      }));
    }
    
    if (field === 'tags') {
      let isValid = true;
      let message = '';
      
      if (value.toString().trim()) {
        const tags = value.toString().split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (tags.length > 10) {
          isValid = false;
          message = 'Maximum 10 tags autorisés';
        } else {
          for (const tag of tags) {
            if (tag.length < 2 || tag.length > 50) {
              isValid = false;
              message = 'Chaque tag doit contenir entre 2 et 50 caractères';
              break;
            }
          }
        }
      }
      
      setValidation(prev => ({
        ...prev,
        tags: { isValid, message }
      }));
    }
  };

  // Gérer l'upload de fichiers
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        file,
        name: file.name,
        description: '',
        type: getFileType(file),
        status: 'pending',
        progress: 0
      };

      setUploadedFiles(prev => [...prev, newFile]);
    });
  };

  const getFileType = (file: File): 'CSV' | 'JSON' | 'EXCEL' | 'API' => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv': return 'CSV';
      case 'json': return 'JSON';
      case 'xlsx':
      case 'xls': return 'EXCEL';
      default: return 'CSV';
    }
  };

  const uploadFileToProject = async (file: UploadedFile, projectId: number) => {
    try {
      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
      ));

      // Simulation de progression (le vrai upload ne donne pas de progression en temps réel)
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress: Math.min(f.progress + 20, 90) } : f
        ));
      }, 200);

      // Appel API réel
      const dataset = await apiService.uploadDataset(file.file, projectId, {
        name: file.name,
        description: file.description || `Dataset ${file.name}`,
        type: file.type
      });

      clearInterval(progressInterval);

      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? { 
          ...f, 
          status: 'success' as const, 
          progress: 100,
          datasetId: dataset.id 
        } : f
      ));

      return dataset;

    } catch (error: any) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? { 
          ...f, 
          status: 'error' as const, 
          error: error.response?.data?.detail || error.message || 'Erreur lors de l\'upload'
        } : f
      ));
      throw error;
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileDescription = (fileId: string, description: string) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, description } : f
    ));
  };

  // Gérer la soumission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validation finale
      const hasValidTitle = formData.title.length >= 5;
      const hasValidDescription = formData.description.length >= 20;
      const hasFiles = uploadedFiles.length > 0;

      if (!hasValidTitle || !hasValidDescription) {
        throw new Error('Veuillez remplir tous les champs requis');
      }

      if (!hasFiles) {
        throw new Error('Veuillez ajouter au moins un dataset');
      }

      // 1. Créer le projet
      const projectData = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        objectives: formData.objectives || undefined,
        methodology: formData.methodology || undefined,
        expected_outcomes: formData.expected_outcomes || undefined,
        visibility: formData.visibility,
        allow_comments: formData.allow_comments,
        allow_contributions: formData.allow_contributions,
        moderation_enabled: formData.moderation_enabled
      };

      const createdProject = await apiService.createProject(projectData);

      // 2. Uploader tous les fichiers
      const uploadPromises = uploadedFiles
        .filter(f => f.status === 'pending')
        .map(file => uploadFileToProject(file, createdProject.id));

      await Promise.all(uploadPromises);

      // Vérifier que tous les uploads ont réussi
      const failedUploads = uploadedFiles.filter(f => f.status === 'error');
      if (failedUploads.length > 0) {
        console.warn('Certains fichiers n\'ont pas pu être uploadés:', failedUploads);
        // On continue quand même si le projet est créé
      }

      // 3. Rediriger vers le projet créé
      navigate(`/projects/${createdProject.id}`);
      
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      
      let errorMessage = 'Erreur lors de la création du projet';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Gestion des erreurs de validation Pydantic
        if (Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail.map((err: any) => {
            if (err.msg && err.loc) {
              const field = err.loc[err.loc.length - 1];
              return `${field}: ${err.msg}`;
            }
            return err.msg || 'Erreur de validation';
          }).join(', ');
          errorMessage = `Erreur de validation: ${validationErrors}`;
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const getStepIcon = (step: number) => {
    if (step < currentStep) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (step === currentStep) return <div className="w-5 h-5 rounded-full bg-primary" />;
    return <div className="w-5 h-5 rounded-full bg-muted" />;
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: return validation.title.isValid && validation.description.isValid && formData.title && formData.description;
      case 2: return uploadedFiles.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="h-full bg-background">
      <div className="p-6 space-y-6">
        {/* En-tête de page */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouveau Projet</h1>
            <p className="text-muted-foreground mt-1">
              Créez un projet collaboratif basé sur des données publiques
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Database className="w-3 h-3" />
              Data-driven
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              Collaboratif
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de progression */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Progression</CardTitle>
                <CardDescription>Étapes de création du projet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    currentStep === 1 ? 'bg-primary/10' : ''
                  }`}>
                    {getStepIcon(1)}
                    <div>
                      <p className="font-medium text-sm">Informations générales</p>
                      <p className="text-xs text-muted-foreground">Titre, description, objectifs</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    currentStep === 2 ? 'bg-primary/10' : ''
                  }`}>
                    {getStepIcon(2)}
                    <div>
                      <p className="font-medium text-sm">Données et fichiers</p>
                      <p className="text-xs text-muted-foreground">Upload des datasets</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    currentStep === 3 ? 'bg-primary/10' : ''
                  }`}>
                    {getStepIcon(3)}
                    <div>
                      <p className="font-medium text-sm">Configuration</p>
                      <p className="text-xs text-muted-foreground">Paramètres et permissions</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>{Math.round((currentStep / 3) * 100)}%</span>
                  </div>
                  <Progress value={(currentStep / 3) * 100} className="h-2" />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Un projet AgoraFlux doit obligatoirement contenir des données publiques vérifiables.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <Tabs value={currentStep.toString()} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="1" disabled={currentStep < 1}>
                  <FileText className="w-4 h-4 mr-2" />
                  Informations
                </TabsTrigger>
                <TabsTrigger value="2" disabled={currentStep < 2}>
                  <Database className="w-4 h-4 mr-2" />
                  Données
                </TabsTrigger>
                <TabsTrigger value="3" disabled={currentStep < 3}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configuration
                </TabsTrigger>
              </TabsList>

              {/* Étape 1: Informations générales */}
              <TabsContent value="1" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Informations du projet
                    </CardTitle>
                    <CardDescription>
                      Décrivez votre projet collaboratif et ses objectifs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre du projet *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="ex: Analyse du Budget Municipal de Paris 2024"
                        className={!validation.title.isValid ? 'border-red-500' : ''}
                        maxLength={255}
                      />
                      {!validation.title.isValid && (
                        <p className="text-sm text-red-500">{validation.title.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formData.title.length}/255 caractères
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Décrivez le contexte, les enjeux et l'intérêt de ce projet pour la communauté..."
                        rows={4}
                        className={!validation.description.isValid ? 'border-red-500' : ''}
                        maxLength={5000}
                      />
                      {!validation.description.isValid && (
                        <p className="text-sm text-red-500">{validation.description.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formData.description.length}/5000 caractères
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        placeholder="budget, transparence, municipalité, paris"
                        maxLength={500}
                        className={!validation.tags.isValid ? 'border-red-500' : ''}
                      />
                      {!validation.tags.isValid && (
                        <p className="text-sm text-red-500">{validation.tags.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Séparez les tags par des virgules (max 10 tags, 2-50 caractères chacun)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="objectives">
                          <Target className="w-4 h-4 inline mr-2" />
                          Objectifs
                        </Label>
                        <Textarea
                          id="objectives"
                          value={formData.objectives}
                          onChange={(e) => handleInputChange('objectives', e.target.value)}
                          placeholder="Quels sont les objectifs de ce projet ?"
                          rows={3}
                          maxLength={2000}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="methodology">
                          <BarChart3 className="w-4 h-4 inline mr-2" />
                          Méthodologie
                        </Label>
                        <Textarea
                          id="methodology"
                          value={formData.methodology}
                          onChange={(e) => handleInputChange('methodology', e.target.value)}
                          placeholder="Comment allez-vous analyser les données ?"
                          rows={3}
                          maxLength={2000}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expected_outcomes">
                        <Lightbulb className="w-4 h-4 inline mr-2" />
                        Résultats attendus
                      </Label>
                      <Textarea
                        id="expected_outcomes"
                        value={formData.expected_outcomes}
                        onChange={(e) => handleInputChange('expected_outcomes', e.target.value)}
                        placeholder="Quels résultats espérez-vous obtenir de cette collaboration ?"
                        rows={3}
                        maxLength={2000}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToNextStep()}
                    className="gap-2"
                  >
                    Continuer
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </TabsContent>

              {/* Étape 2: Upload de données */}
              <TabsContent value="2" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Datasets du projet
                    </CardTitle>
                    <CardDescription>
                      Ajoutez les données publiques qui serviront de base à la collaboration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Zone de drop */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Glissez vos fichiers ici</h3>
                      <p className="text-muted-foreground mb-4">
                        Ou cliquez pour sélectionner des fichiers
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('file-input')?.click()}
                      >
                        Choisir des fichiers
                      </Button>
                      <input
                        id="file-input"
                        type="file"
                        multiple
                        accept=".csv,.json,.xlsx,.xls"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                      />
                      <p className="text-xs text-muted-foreground mt-4">
                        Formats supportés: CSV, JSON, Excel (.xlsx, .xls)
                      </p>
                    </div>

                    {/* Liste des fichiers uploadés */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Fichiers ajoutés ({uploadedFiles.length})</h4>
                        <div className="space-y-3">
                          {uploadedFiles.map((file) => (
                            <Card key={file.id} className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  <Badge variant="outline">{file.type}</Badge>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium truncate">{file.name}</h5>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFile(file.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  
                                  <Input
                                    placeholder="Description du dataset..."
                                    value={file.description}
                                    onChange={(e) => updateFileDescription(file.id, e.target.value)}
                                    className="mb-3"
                                  />

                                  {file.status === 'uploading' && (
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>Upload en cours...</span>
                                        <span>{Math.round(file.progress)}%</span>
                                      </div>
                                      <Progress value={file.progress} className="h-2" />
                                    </div>
                                  )}

                                  {file.status === 'success' && (
                                    <div className="flex items-center gap-2 text-green-600">
                                      <CheckCircle className="w-4 h-4" />
                                      <span className="text-sm">Fichier uploadé avec succès</span>
                                    </div>
                                  )}

                                  {file.status === 'error' && (
                                    <div className="flex items-center gap-2 text-red-600">
                                      <AlertCircle className="w-4 h-4" />
                                      <span className="text-sm">{file.error || 'Erreur lors de l\'upload'}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadedFiles.length === 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Vous devez ajouter au moins un dataset pour créer un projet AgoraFlux.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToNextStep()}
                    className="gap-2"
                  >
                    Continuer
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </TabsContent>

              {/* Étape 3: Configuration */}
              <TabsContent value="3" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Configuration du projet
                    </CardTitle>
                    <CardDescription>
                      Définissez les paramètres de visibilité et de collaboration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label>Visibilité du projet</Label>
                        <Select 
                          value={formData.visibility} 
                          onValueChange={(value: 'public' | 'private' | 'restricted') => 
                            handleInputChange('visibility', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                <div>
                                  <p className="font-medium">Public</p>
                                  <p className="text-xs text-muted-foreground">
                                    Visible par tous, participation ouverte
                                  </p>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="restricted">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                <div>
                                  <p className="font-medium">Restreint</p>
                                  <p className="text-xs text-muted-foreground">
                                    Visible par tous, participation sur invitation
                                  </p>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="private">
                              <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                <div>
                                  <p className="font-medium">Privé</p>
                                  <p className="text-xs text-muted-foreground">
                                    Accès limité aux invités uniquement
                                  </p>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <Label>Paramètres de collaboration</Label>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Autoriser les commentaires</Label>
                              <p className="text-sm text-muted-foreground">
                                Les utilisateurs peuvent commenter et discuter
                              </p>
                            </div>
                            <Checkbox
                              checked={formData.allow_comments}
                              onCheckedChange={(checked) => handleInputChange('allow_comments', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Autoriser les contributions</Label>
                              <p className="text-sm text-muted-foreground">
                                Les utilisateurs peuvent proposer des améliorations
                              </p>
                            </div>
                            <Checkbox
                              checked={formData.allow_contributions}
                              onCheckedChange={(checked) => handleInputChange('allow_contributions', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Modération activée</Label>
                              <p className="text-sm text-muted-foreground">
                                Les commentaires nécessitent une approbation
                              </p>
                            </div>
                            <Checkbox
                              checked={formData.moderation_enabled}
                              onCheckedChange={(checked) => handleInputChange('moderation_enabled', checked)}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Une fois créé, le projet sera en statut "Brouillon". 
                          Vous pourrez le publier après avoir vérifié tous les paramètres.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>

                {/* Résumé final */}
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé du projet</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">Titre</p>
                        <p className="text-muted-foreground">{formData.title || 'Non défini'}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Visibilité</p>
                        <Badge variant="outline">{formData.visibility}</Badge>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Datasets</p>
                        <p className="text-muted-foreground">{uploadedFiles.length} fichier(s)</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Collaboration</p>
                        <div className="flex gap-1 flex-wrap">
                          {formData.allow_comments && <Badge variant="secondary" className="text-xs">Commentaires</Badge>}
                          {formData.allow_contributions && <Badge variant="secondary" className="text-xs">Contributions</Badge>}
                          {formData.moderation_enabled && <Badge variant="secondary" className="text-xs">Modération</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {submitError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canProceedToNextStep()}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Créer le projet
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProject; 