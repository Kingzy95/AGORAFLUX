import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Avatar,
  Tooltip,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Badge
} from '@mui/material';
import {
  AddComment as AddCommentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Reply as ReplyIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

interface Annotation {
  id: string;
  userId: string | number;
  userName: string;
  userRole: 'admin' | 'moderateur' | 'utilisateur';
  x: number; // Position X en pourcentage
  y: number; // Position Y en pourcentage
  content: string;
  category: 'question' | 'insight' | 'concern' | 'suggestion';
  timestamp: Date;
  replies?: Annotation[];
  isPrivate?: boolean;
  isResolved?: boolean;
}

interface AnnotationSystemProps {
  chartId: string;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'timestamp'>) => void;
  onUpdateAnnotation: (id: string, annotation: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  readOnly?: boolean;
  showPrivate?: boolean;
  children?: React.ReactNode;
}

const AnnotationSystem: React.FC<AnnotationSystemProps> = ({
  chartId,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  readOnly = false,
  showPrivate = true,
  children
}) => {
  const { user } = useAuth();
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [newAnnotationPosition, setNewAnnotationPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<{ open: boolean; annotation?: Annotation }>({ open: false });
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; annotationId: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const categoryColors: Record<Annotation['category'], string> = {
    question: '#2196f3',
    insight: '#4caf50',
    concern: '#ff9800',
    suggestion: '#9c27b0'
  };

  const categoryLabels: Record<Annotation['category'], string> = {
    question: '❓ Question',
    insight: '💡 Observation',
    concern: '⚠️ Préoccupation',
    suggestion: '💭 Suggestion'
  };

  // Filtrer les annotations selon les permissions
  const visibleAnnotations = annotations.filter(annotation => {
    if (!showPrivate && annotation.isPrivate) return false;
    if (annotation.isPrivate && String(annotation.userId) !== String(user?.id) && user?.role !== 'admin') return false;
    return true;
  });

  const handleChartClick = (event: React.MouseEvent) => {
    if (readOnly || !isAddingAnnotation || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setNewAnnotationPosition({ x, y });
    setEditDialog({ open: true });
  };

  const handleAddAnnotation = (data: {
    content: string;
    category: Annotation['category'];
    isPrivate: boolean;
  }) => {
    if (!newAnnotationPosition || !user) return;

    onAddAnnotation({
      userId: user.id,
      userName: `${user.first_name} ${user.last_name}`,
      userRole: user.role,
      x: newAnnotationPosition.x,
      y: newAnnotationPosition.y,
      content: data.content,
      category: data.category,
      isPrivate: data.isPrivate
    });

    setNewAnnotationPosition(null);
    setEditDialog({ open: false });
    setIsAddingAnnotation(false);
  };

  const handleEditAnnotation = (annotation: Annotation, updates: Partial<Annotation>) => {
    onUpdateAnnotation(annotation.id, updates);
    setEditDialog({ open: false });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, annotationId: string) => {
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget, annotationId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const canEditAnnotation = (annotation: Annotation) => {
    return String(user?.id) === String(annotation.userId) || user?.role === 'admin' || user?.role === 'moderateur';
  };

  const AnnotationMarker: React.FC<{ annotation: Annotation }> = ({ annotation }) => (
    <Box
      sx={{
        position: 'absolute',
        left: `${annotation.x}%`,
        top: `${annotation.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        cursor: 'pointer'
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedAnnotation(annotation.id);
      }}
    >
      <Tooltip
        title={
          <Box>
            <Typography variant="subtitle2">{annotation.userName}</Typography>
            <Typography variant="body2">{annotation.content.slice(0, 100)}...</Typography>
            <Chip
              label={categoryLabels[annotation.category]}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>
        }
        arrow
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: categoryColors[annotation.category],
            border: '2px solid white',
            boxShadow: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white',
            animation: annotation.id === selectedAnnotation ? 'pulse 2s infinite' : 'none'
          }}
        >
          {annotation.replies?.length || '•'}
        </Box>
      </Tooltip>
    </Box>
  );

  const AnnotationDialog: React.FC = () => (
    <Dialog
      open={editDialog.open}
      onClose={() => setEditDialog({ open: false })}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {editDialog.annotation ? 'Modifier l\'annotation' : 'Nouvelle annotation'}
      </DialogTitle>
      <DialogContent>
        <AnnotationForm
          annotation={editDialog.annotation}
          onSubmit={editDialog.annotation 
            ? (data) => handleEditAnnotation(editDialog.annotation!, data)
            : handleAddAnnotation
          }
          onCancel={() => setEditDialog({ open: false })}
        />
      </DialogContent>
    </Dialog>
  );

  const AnnotationForm: React.FC<{
    annotation?: Annotation;
    onSubmit: (data: any) => void;
    onCancel: () => void;
  }> = ({ annotation, onSubmit, onCancel }) => {
    const [content, setContent] = useState(annotation?.content || '');
    const [category, setCategory] = useState<Annotation['category']>(annotation?.category || 'question');
    const [isPrivate, setIsPrivate] = useState(annotation?.isPrivate || false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (content.trim()) {
        onSubmit({ content: content.trim(), category, isPrivate });
      }
    };

    return (
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Votre annotation"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Partagez votre observation, question ou suggestion..."
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Chip
              key={key}
              label={label}
              onClick={() => setCategory(key as Annotation['category'])}
              color={category === key ? 'primary' : 'default'}
              variant={category === key ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Chip
            icon={isPrivate ? <VisibilityOffIcon /> : <VisibilityIcon />}
            label={isPrivate ? 'Annotation privée' : 'Annotation publique'}
            onClick={() => setIsPrivate(!isPrivate)}
            color={isPrivate ? 'secondary' : 'primary'}
            variant="outlined"
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!content.trim()}
          >
            {annotation ? 'Modifier' : 'Ajouter'}
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Container principal avec annotations */}
      <Box
        ref={containerRef}
        onClick={handleChartClick}
        sx={{
          position: 'relative',
          cursor: isAddingAnnotation ? 'crosshair' : 'default',
          '&::before': isAddingAnnotation ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            zIndex: 5,
            pointerEvents: 'none'
          } : {}
        }}
      >
        {/* Contenu du graphique */}
        {children}
        
        {/* Marqueurs d'annotations */}
        {showAnnotations && visibleAnnotations.map((annotation) => (
          <AnnotationMarker key={annotation.id} annotation={annotation} />
        ))}
      </Box>

      {/* Contrôles d'annotation */}
      {!readOnly && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 20 }}>
          <Tooltip title={showAnnotations ? 'Masquer les annotations' : 'Afficher les annotations'}>
            <IconButton
              onClick={() => setShowAnnotations(!showAnnotations)}
              size="small"
              sx={{ backgroundColor: 'background.paper', mr: 1 }}
            >
              <Badge badgeContent={visibleAnnotations.length} color="primary">
                {showAnnotations ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title={isAddingAnnotation ? 'Annuler l\'ajout' : 'Ajouter une annotation'}>
            <Fab
              size="small"
              color={isAddingAnnotation ? 'secondary' : 'primary'}
              onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
            >
              {isAddingAnnotation ? <CloseIcon /> : <AddCommentIcon />}
            </Fab>
          </Tooltip>
        </Box>
      )}

      {/* Détail de l'annotation sélectionnée */}
      {selectedAnnotation && (
        <Card
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            maxWidth: 300,
            zIndex: 15,
            boxShadow: 3
          }}
        >
          {(() => {
            const annotation = annotations.find(a => a.id === selectedAnnotation);
            if (!annotation) return null;

            return (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '12px' }}>
                      {annotation.userName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="caption" fontWeight="bold">
                      {annotation.userName}
                    </Typography>
                    {annotation.isPrivate && (
                      <VisibilityOffIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    )}
                  </Box>
                  
                  <Box>
                    {canEditAnnotation(annotation) && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, annotation.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => setSelectedAnnotation(null)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Chip
                  label={categoryLabels[annotation.category]}
                  size="small"
                  sx={{ mb: 1, backgroundColor: categoryColors[annotation.category], color: 'white' }}
                />

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {annotation.content}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {annotation.timestamp.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>

                {annotation.replies && annotation.replies.length > 0 && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" fontWeight="bold" gutterBottom>
                      Réponses ({annotation.replies.length})
                    </Typography>
                    {/* Liste des réponses... */}
                  </Box>
                )}
              </Box>
            );
          })()}
        </Card>
      )}

      {/* Menu contextuel */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const annotation = annotations.find(a => a.id === menuAnchor?.annotationId);
          if (annotation) {
            setEditDialog({ open: true, annotation });
          }
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Modifier
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuAnchor?.annotationId) {
            onDeleteAnnotation(menuAnchor.annotationId);
          }
          handleMenuClose();
        }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
        <MenuItem onClick={() => {
          const annotation = annotations.find(a => a.id === menuAnchor?.annotationId);
          if (annotation) {
            onUpdateAnnotation(annotation.id, { isResolved: !annotation.isResolved });
          }
          handleMenuClose();
        }}>
          <FlagIcon sx={{ mr: 1 }} />
          Marquer comme résolu
        </MenuItem>
      </Menu>

      {/* Dialog d'ajout/modification */}
      <AnnotationDialog />

      {/* Styles pour l'animation pulse */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.2); }
            100% { transform: translate(-50%, -50%) scale(1); }
          }
        `}
      </style>
    </Box>
  );
};

export default AnnotationSystem; 