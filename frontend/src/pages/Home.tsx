import React from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Paper,
  useTheme
} from '@mui/material';
import {
  People,
  BarChart,
  Public,
  Security,
  TrendingUp,
  AccessTime
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

  const features = [
    {
      icon: <People color="primary" />,
      title: 'Collaboration Citoyenne',
      description: 'Participez aux décisions publiques avec d\'autres citoyens engagés'
    },
    {
      icon: <BarChart color="primary" />,
      title: 'Visualisations Interactives',
      description: 'Explorez les données publiques avec des graphiques et cartes interactifs'
    },
    {
      icon: <Public color="primary" />,
      title: 'Transparence',
      description: 'Accédez aux données ouvertes et participez au débat démocratique'
    },
    {
      icon: <Security color="primary" />,
      title: 'Sécurisé',
      description: 'Plateforme sécurisée avec authentification et modération'
    }
  ];

  const sampleProjects = [
    {
      id: 1,
      title: 'Budget Municipal Paris 2024',
      description: 'Analyse collaborative des dépenses publiques de la ville de Paris',
      status: 'ACTIVE',
      participants: 156,
      comments: 89,
      tags: ['budget', 'paris', 'transparence'],
      author: 'Admin AgoraFlux',
      lastUpdate: '2025-07-04'
    },
    {
      id: 2,
      title: 'Mobilité Urbaine et Transport Public',
      description: 'Étude participative sur l\'amélioration des transports en commun',
      status: 'DRAFT',
      participants: 42,
      comments: 27,
      tags: ['transport', 'mobilité', 'urbain'],
      author: 'Marie Dupont',
      lastUpdate: '2025-07-03'
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

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          color: 'white',
          py: 8,
          mb: 6,
          borderRadius: 2
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom align="center">
            🏛️ AgoraFlux
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
            Plateforme de Simulation et Collaboration Citoyenne
          </Typography>
          <Typography variant="h6" align="center" sx={{ mb: 4, opacity: 0.9 }}>
            Participez à la démocratie participative grâce aux données ouvertes et à la collaboration citoyenne
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            {!isAuthenticated ? (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/register')}
                >
                  Commencer maintenant
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={() => navigate('/projects')}
                >
                  Explorer les projets
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/dashboard')}
                >
                  Mon tableau de bord
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={() => navigate('/projects/new')}
                >
                  Créer un projet
                </Button>
              </>
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Features Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
            Pourquoi AgoraFlux ?
          </Typography>
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(4, 1fr)' 
              }, 
              gap: 4 
            }}
          >
            {features.map((feature, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                <Avatar sx={{ mb: 2, bgcolor: 'primary.light' }}>
                  {feature.icon}
                </Avatar>
                <Typography variant="h6" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Projects Section */}
        <Box sx={{ mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h2">
              Projets en cours
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/projects')}
            >
              Voir tous les projets
            </Button>
          </Box>
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                md: 'repeat(2, 1fr)' 
              }, 
              gap: 3 
            }}
          >
            {sampleProjects.map((project) => (
              <Card
                key={project.id}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h3">
                      {project.title}
                    </Typography>
                    <Chip
                      label={getStatusLabel(project.status)}
                      color={getStatusColor(project.status) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {project.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {project.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
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
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/projects/${project.id}`)}>
                    En savoir plus
                  </Button>
                  <Button size="small" color="primary">
                    Participer
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Call to Action */}
        {!isAuthenticated && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Paper elevation={2} sx={{ p: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Prêt à participer ?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Rejoignez la communauté AgoraFlux et contribuez à la démocratie participative
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
              >
                Créer un compte gratuit
              </Button>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Home; 