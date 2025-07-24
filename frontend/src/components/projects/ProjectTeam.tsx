import React, { useState, useEffect } from 'react';
import { Project } from '../../types/project';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from '../ui';
import {
  Users,
  Crown,
  Shield,
  User,
  UserPlus,
  Mail,
  MessageSquare,
  Database,
  Calendar,
  Activity,
  MoreVertical,
  Settings,
} from 'lucide-react';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'moderator' | 'contributor';
  joinedAt: string;
  stats: {
    comments: number;
    datasets: number;
    lastActivity: string;
  };
  avatar?: string;
}

interface ProjectTeamProps {
  project: Project;
  onProjectUpdate?: (project: Project) => void;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  moderator: Settings,
  contributor: User,
};

const roleLabels = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  moderator: 'Modérateur', 
  contributor: 'Contributeur',
};

const roleColors = {
  owner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  admin: 'bg-red-100 text-red-800 border-red-200',
  moderator: 'bg-blue-100 text-blue-800 border-blue-200',
  contributor: 'bg-green-100 text-green-800 border-green-200',
};

export const ProjectTeam: React.FC<ProjectTeamProps> = ({ project, onProjectUpdate }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'moderator' | 'contributor'>('contributor');
  const [isInviting, setIsInviting] = useState(false);

  const isOwner = user && project.owner_id === user.id;
  const canManageTeam = isOwner; // Pour l'instant, seul le propriétaire peut gérer l'équipe

  useEffect(() => {
    loadTeamMembers();
  }, [project.id]);

  const loadTeamMembers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Pour l'instant, créer des données de démonstration basées sur les vraies données du projet
      const teamMembers: TeamMember[] = [
        // Propriétaire du projet
        {
          id: project.owner_id,
          name: project.owner ? `${project.owner.first_name} ${project.owner.last_name}` : 'Propriétaire',
          email: project.owner?.email || '',
          role: 'owner',
          joinedAt: project.created_at,
          stats: {
            comments: Math.floor(project.comments_count * 0.4), // Le propriétaire a ~40% des commentaires
            datasets: Math.floor(project.datasets_count * 0.6), // Le propriétaire a ~60% des datasets
            lastActivity: project.updated_at || project.created_at,
          },
        },
      ];

      setMembers(teamMembers);
    } catch (err: any) {
      console.error('Erreur lors du chargement de l\'équipe:', err);
      setError('Erreur lors du chargement de l\'équipe');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsInviting(true);
    try {
      // TODO: Intégrer avec l'API réelle pour inviter des utilisateurs
      console.log('Invitation envoyée:', { email: inviteEmail, role: inviteRole });
      
      // Simuler l'ajout du membre
      const newMember: TeamMember = {
        id: Date.now(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        joinedAt: new Date().toISOString(),
        stats: {
          comments: 0,
          datasets: 0,
          lastActivity: new Date().toISOString(),
        },
      };
      
      setMembers(prev => [...prev, newMember]);
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('contributor');
      
      // Mettre à jour le compteur de contributeurs
      if (onProjectUpdate) {
        onProjectUpdate({
          ...project,
          contributor_count: project.contributor_count + 1,
        });
      }
      
    } catch (err: any) {
      console.error('Erreur lors de l\'invitation:', err);
      setError('Erreur lors de l\'invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Aujourd\'hui';
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffInDays / 30)} mois`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques modernisé */}


      {/* Liste des membres avec design moderne */}
      <div className="space-y-4">
        {members.map((member) => {
          const RoleIcon = roleIcons[member.role];
          
          return (
            <Card key={member.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar modernisé */}
                  <Avatar className="h-12 w-12 ring-2 ring-muted">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Informations principales */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg truncate">{member.name}</h4>
                      <Badge variant="outline" className={`text-xs ${roleColors[member.role]}`}>
                        <RoleIcon className="h-3 w-3 mr-1.5" />
                        {roleLabels[member.role]}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  
                  {/* Actions modernisées */}
                  <div className="flex flex-col gap-2">
                    {canManageTeam && member.role !== 'owner' && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Statistiques d'équipe modernisées */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Statistiques d'équipe</CardTitle>
          <CardDescription>Performance collective du projet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-background rounded-lg border">
              <div className="text-3xl font-bold text-primary mb-1">{project.contributor_count}</div>
              <div className="text-sm text-muted-foreground font-medium">Contributeurs</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <div className="text-3xl font-bold text-primary mb-1">{project.comments_count}</div>
              <div className="text-sm text-muted-foreground font-medium">Commentaires</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <div className="text-3xl font-bold text-primary mb-1">{project.datasets_count}</div>
              <div className="text-sm text-muted-foreground font-medium">Datasets</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 