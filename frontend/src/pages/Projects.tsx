import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Fab
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  People,
  TrendingUp,
  AccessTime
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Données mockées pour l'instant
  const projects = [
    {
      id: 1,
      title: 'Budget Municipal Paris 2024',
      description: 'Analyse collaborative des dépenses publiques de la ville de Paris pour l\'année 2024. Participation citoyenne pour identifier les priorités.',
      status: 'ACTIVE',
      participants: 156,
      comments: 89,
      tags: ['budget', 'paris', 'transparence'],
      author: 'Admin AgoraFlux',
      lastUpdate: '2025-07-04',
      category: 'budget'
    },
    {
      id: 2,
      title: 'Mobilité Urbaine et Transport Public',
      description: 'Étude participative sur l\'amélioration des transports en commun en région parisienne.',
      status: 'DRAFT',
      participants: 42,
      comments: 27,
      tags: ['transport', 'mobilité', 'urbain'],
      author: 'Marie Dupont',
      lastUpdate: '2025-07-03',
      category: 'transport'
    },
    {
      id: 3,
      title: 'Espaces Verts et Biodiversité',
      description: 'Analyse des espaces verts urbains et de leur impact sur la biodiversité locale.',
      status: 'COMPLETED',
      participants: 73,
      comments: 45,
      tags: ['environnement', 'biodiversité', 'espaces verts'],
      author: 'Jean Durand',
      lastUpdate: '2025-07-01',
      category: 'environnement'
    },
    {
      id: 4,
      title: 'Éducation Numérique',
      description: 'Projet collaboratif sur l\'intégration du numérique dans les établissements scolaires.',
      status: 'ACTIVE',
      participants: 98,
      comments: 67,
      tags: ['éducation', 'numérique', 'école'],
      author: 'Sophie Martin',
      lastUpdate: '2025-07-02',
      category: 'education'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'DRAFT': return 'warning';
      case 'COMPLETED': return 'primary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'DRAFT': return 'Brouillon';
      case 'COMPLETED': return 'Terminé';
      default: return status;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Projets Collaboratifs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Découvrez et participez aux projets de démocratie participative
        </Typography>
      </Box>

      {/* Filtres */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              md: '2fr 1fr 1fr' 
            }, 
            gap: 3,
            alignItems: 'center' 
          }}
        >
          <TextField
            fullWidth
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              label="Statut"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="ACTIVE">Actif</MenuItem>
              <MenuItem value="DRAFT">Brouillon</MenuItem>
              <MenuItem value="COMPLETED">Terminé</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            <Typography variant="body2">
              {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Liste des projets */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            md: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}
      >
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" component="h3" sx={{ flexGrow: 1, mr: 1 }}>
                  {project.title}
                </Typography>
                <Chip
                  label={getStatusLabel(project.status)}
                  color={getStatusColor(project.status) as any}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                {project.description}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {project.tags.slice(0, 3).map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
                {project.tags.length > 3 && (
                  <Chip label={`+${project.tags.length - 3}`} size="small" variant="outlined" />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <People fontSize="small" color="action" />
                    <Typography variant="caption">{project.participants}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp fontSize="small" color="action" />
                    <Typography variant="caption">{project.comments}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTime fontSize="small" color="action" />
                  <Typography variant="caption">{project.lastUpdate}</Typography>
                </Box>
              </Box>
            </CardContent>
            
            <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
              <Button
                size="small"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                Voir détails
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                disabled={!isAuthenticated}
              >
                Participer
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* Message si aucun projet trouvé */}
      {filteredProjects.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun projet trouvé
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Essayez de modifier vos critères de recherche
          </Typography>
        </Box>
      )}

      {/* Bouton flottant pour créer un projet */}
      {isAuthenticated && (
        <Fab
          color="primary"
          aria-label="Créer un projet"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => navigate('/projects/new')}
        >
          <Add />
        </Fab>
      )}

      {/* Message pour les utilisateurs non connectés */}
      {!isAuthenticated && (
        <Paper sx={{ p: 3, mt: 4, textAlign: 'center', backgroundColor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="h6" gutterBottom>
            Connectez-vous pour participer
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Créez un compte pour participer aux projets et créer vos propres initiatives
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/login')}
          >
            Se connecter
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default Projects; 