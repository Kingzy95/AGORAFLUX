import React, { useState } from 'react';
import { Project } from '../../types/project';
import apiService from '../../services/api';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui';
import {
  FileText,
  Eye,
  CheckCircle,
  Archive,
  AlertCircle,
  Info,
  Calendar,
  Settings,
} from 'lucide-react';

interface ProjectStatusManagerProps {
  project: Project;
  onStatusUpdate: (updatedProject: Project) => void;
  canManage?: boolean;
}

interface StatusInfo {
  value: 'draft' | 'active' | 'completed' | 'archived';
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const statusOptions: StatusInfo[] = [
  {
    value: 'draft',
    label: 'Brouillon',
    description: 'Projet en cours de préparation, non visible publiquement',
    icon: FileText,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100 border-yellow-200'
  },
  {
    value: 'active',
    label: 'Actif',
    description: 'Projet ouvert à la collaboration et visible publiquement',
    icon: Eye,
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-200'
  },
  {
    value: 'completed',
    label: 'Terminé',
    description: 'Projet finalisé, consultation uniquement',
    icon: CheckCircle,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-200'
  },
  {
    value: 'archived',
    label: 'Archivé',
    description: 'Projet archivé, accès restreint',
    icon: Archive,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100 border-gray-200'
  }
];

export const ProjectStatusManager: React.FC<ProjectStatusManagerProps> = ({
  project,
  onStatusUpdate,
  canManage = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'draft' | 'active' | 'completed' | 'archived'>(project.status);
  const [reason, setReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Debug logs
  console.log('ProjectStatusManager - Props:', { 
    projectId: project.id, 
    projectStatus: project.status, 
    canManage,
    projectOwnerId: project.owner_id 
  });

  const currentStatusInfo = statusOptions.find(s => s.value === project.status);
  const newStatusInfo = statusOptions.find(s => s.value === selectedStatus);

  const handleStatusChange = async () => {
    if (selectedStatus === project.status) {
      setIsDialogOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedProject = await apiService.updateProjectStatus(
        project.id,
        selectedStatus,
        reason || undefined
      );
      
      onStatusUpdate(updatedProject);
      setIsDialogOpen(false);
      setReason('');
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour du statut');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusChangeMessage = () => {
    if (project.status === 'draft' && selectedStatus === 'active') {
      return {
        type: 'success',
        title: 'Publier le projet',
        message: 'Le projet deviendra visible publiquement et ouvert à la collaboration.'
      };
    }
    if (project.status === 'active' && selectedStatus === 'completed') {
      return {
        type: 'info',
        title: 'Marquer comme terminé',
        message: 'Le projet sera marqué comme terminé. Les utilisateurs pourront toujours le consulter.'
      };
    }
    if (selectedStatus === 'archived') {
      return {
        type: 'warning',
        title: 'Archiver le projet',
        message: 'Le projet sera archivé et son accès sera restreint.'
      };
    }
    return {
      type: 'info',
      title: 'Changer le statut',
      message: 'Le statut du projet sera modifié.'
    };
  };

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStatusInfo && <currentStatusInfo.icon className="h-5 w-5" />}
            Statut du projet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-3 rounded-lg border ${currentStatusInfo?.bgColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={currentStatusInfo?.color}>
                {currentStatusInfo?.label}
              </Badge>
              {project.published_at && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Publié le {new Date(project.published_at).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentStatusInfo?.description}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Gestion du statut
        </CardTitle>
        <CardDescription>
          Gérez la visibilité et l'état de votre projet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut actuel */}
        <div className={`p-3 rounded-lg border ${currentStatusInfo?.bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {currentStatusInfo && <currentStatusInfo.icon className="h-4 w-4" />}
              <Badge variant="secondary" className={currentStatusInfo?.color}>
                {currentStatusInfo?.label}
              </Badge>
            </div>
            {project.published_at && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Publié le {new Date(project.published_at).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {currentStatusInfo?.description}
          </p>
        </div>

        {/* Actions rapides */}
        <div className="flex flex-wrap gap-2">
          {project.status === 'draft' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setSelectedStatus('active')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Publier le projet
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
          
          {project.status === 'active' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedStatus('completed')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer comme terminé
                </Button>
              </DialogTrigger>
            </Dialog>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Changer le statut
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Dialog de confirmation */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {newStatusInfo && <newStatusInfo.icon className="h-5 w-5" />}
                {getStatusChangeMessage().title}
              </DialogTitle>
              <DialogDescription>
                {getStatusChangeMessage().message}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nouveau statut</label>
                <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <status.icon className="h-4 w-4" />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Raison (optionnel)</label>
                <Textarea
                  placeholder="Expliquez pourquoi vous changez le statut..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              {selectedStatus !== project.status && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {selectedStatus === 'active' && project.status === 'draft' && 
                      "Une fois publié, le projet sera visible par tous les utilisateurs et ouvert à la collaboration."
                    }
                    {selectedStatus === 'completed' && 
                      "Un projet terminé reste consultable mais n'accepte plus de nouvelles contributions."
                    }
                    {selectedStatus === 'archived' && 
                      "Un projet archivé aura un accès restreint et ne sera plus visible dans les listes publiques."
                    }
                    {selectedStatus === 'draft' && 
                      "Le projet redeviendra privé et ne sera plus visible publiquement."
                    }
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedStatus(project.status);
                  setReason('');
                  setError(null);
                }}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleStatusChange}
                disabled={isLoading || selectedStatus === project.status}
              >
                {isLoading ? 'Mise à jour...' : 'Confirmer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}; 