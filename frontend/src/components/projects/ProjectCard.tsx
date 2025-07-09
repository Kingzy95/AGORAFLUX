import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import {
  Eye,
  MessageSquare,
  Heart,
  Share,
  Calendar,
  Users,
  MoreVertical,
  Bookmark,
  Flag,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    description: string;
    category: string;
    status: 'draft' | 'active' | 'completed' | 'archived';
    author: {
      name: string;
      avatar?: string;
    };
    stats: {
      views: number;
      comments: number;
      likes: number;
      participants: number;
    };
    tags: string[];
    createdAt: string;
    isLiked?: boolean;
    isBookmarked?: boolean;
  };
  showActions?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, showActions = true }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      case 'draft':
        return 'bg-yellow-500 text-white';
      case 'archived':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'completed':
        return 'Terminé';
      case 'draft':
        return 'Brouillon';
      case 'archived':
        return 'Archivé';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <TooltipProvider>
      <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border">
        <CardHeader className="space-y-3">
          {/* Header avec status et actions */}
          <div className="flex items-start justify-between">
            <Badge className={getStatusColor(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Bookmark className="h-4 w-4 mr-2" />
                    {project.isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="h-4 w-4 mr-2" />
                    Partager
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Signaler
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Titre et description */}
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {project.title}
            </CardTitle>
            <CardDescription className="text-sm line-clamp-3">
              {project.description}
            </CardDescription>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {project.category}
            </Badge>
            {project.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 2 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    +{project.tags.length - 2}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Autres tags: {project.tags.slice(2).join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Auteur */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={project.author.avatar} alt={project.author.name} />
              <AvatarFallback className="text-xs">
                {project.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{project.author.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(project.createdAt)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{formatNumber(project.stats.views)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{project.stats.views} vues</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{formatNumber(project.stats.comments)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{project.stats.comments} commentaires</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Heart className={`h-4 w-4 ${project.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{formatNumber(project.stats.likes)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{project.stats.likes} likes</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{formatNumber(project.stats.participants)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{project.stats.participants} participants</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Actions principales */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => navigate(`/projects/${project.id}`)}
              size="sm" 
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir le projet
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  className={project.isLiked ? 'text-red-500 border-red-500' : ''}
                >
                  <Heart className={`h-4 w-4 ${project.isLiked ? 'fill-current' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{project.isLiked ? 'Ne plus aimer' : 'Aimer ce projet'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline">
                  <Share className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Partager ce projet</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ProjectCard; 