import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Container,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  FolderOpen,
  DatasetOutlined,
  People,
  Settings,
  ExitToApp,
  Home,
  Add
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    handleUserMenuClose();
  };

  const navigationItems = [
    { 
      label: 'Accueil', 
      path: '/', 
      icon: <Home />,
      public: true 
    },
    { 
      label: 'Projets', 
      path: '/projects', 
      icon: <FolderOpen />,
      public: true 
    },
    { 
      label: 'Tableau de bord', 
      path: '/dashboard', 
      icon: <Dashboard />,
      public: false 
    },
    { 
      label: 'Mes données', 
      path: '/datasets', 
      icon: <DatasetOutlined />,
      public: false 
    },
    { 
      label: 'Nouveau projet', 
      path: '/projects/new', 
      icon: <Add />,
      public: false 
    },
  ];

  const adminItems = [
    { 
      label: 'Utilisateurs', 
      path: '/admin/users', 
      icon: <People /> 
    },
    { 
      label: 'Administration', 
      path: '/admin', 
      icon: <Settings /> 
    },
  ];

  const filteredNavItems = navigationItems.filter(item => 
    item.public || isAuthenticated
  );

  const NavItems = ({ mobile = false }) => (
    <>
      {filteredNavItems.map((item) => (
        <ListItem 
          key={item.path}
          onClick={() => {
            navigate(item.path);
            if (mobile) setMobileOpen(false);
          }}
          sx={{
            cursor: 'pointer',
            backgroundColor: location.pathname === item.path ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItem>
      ))}
      
      {user?.role === 'admin' && (
        <>
          <Divider sx={{ my: 1 }} />
          {adminItems.map((item) => (
            <ListItem 
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (mobile) setMobileOpen(false);
              }}
              sx={{
                cursor: 'pointer',
                backgroundColor: location.pathname === item.path ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </>
      )}
    </>
  );

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          AgoraFlux
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <NavItems mobile />
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#1976d2'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            🏛️ AgoraFlux
          </Typography>

          {/* Navigation Desktop */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {filteredNavItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  sx={{
                    backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* User Menu */}
          {isAuthenticated ? (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleUserMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
                  <AccountCircle sx={{ mr: 1 }} />
                  Profil
                </MenuItem>
                <MenuItem onClick={() => { navigate('/settings'); handleUserMenuClose(); }}>
                  <Settings sx={{ mr: 1 }} />
                  Paramètres
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 1 }} />
                  Déconnexion
                </MenuItem>
              </Menu>
            </div>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Connexion
              </Button>
              <Button 
                color="inherit" 
                variant="outlined"
                onClick={() => navigate('/register')}
                sx={{ borderColor: 'white', '&:hover': { borderColor: 'white' } }}
              >
                Inscription
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer Mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 