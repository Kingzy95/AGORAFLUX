import React, { useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Button,
  Avatar, AvatarFallback, AvatarImage,
  Badge, Separator, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '../ui';
import {
  BarChart3, Users, MessageSquare, FolderOpen, Settings, HelpCircle,
  PlusCircle, Bell, Search, Calendar, TrendingUp, Activity,
  LogOut, User, Palette, Home, Menu, ChevronLeft, ChevronRight,
  Download, FileText, X, Shield
} from 'lucide-react';

// Types
interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  className?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string | number;
  description?: string;
  external?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

// Constants
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: BarChart3,
    path: '/dashboard',
    description: 'Vue d\'ensemble des données et statistiques'
  },
  {
    id: 'projects',
    label: 'Projets',
    icon: FolderOpen,
    path: '/projects',
    description: 'Gérer vos projets collaboratifs'
  },
  {
    id: 'exports',
    label: 'Centre d\'Export',
    icon: Download,
    path: '/export-center',
    description: 'Exporter et télécharger vos données'
  },
  {
    id: 'discussions',
    label: 'Discussions',
    icon: MessageSquare,
    path: '/dashboard/discussions',
    badge: 3,
    description: 'Conversations et débats en cours'
  },
  {
    id: 'community',
    label: 'Communauté',
    icon: Users,
    path: '/dashboard/community',
    description: 'Membres et collaborateurs actifs'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    path: '/dashboard/analytics',
    description: 'Analyses détaillées et métriques'
  }
];

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapsed,
  className = ""
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Optimized handlers
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    setIsSheetOpen(false); // Fermer la sidebar mobile après navigation
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
      setIsSheetOpen(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }, [logout, navigate]);

  // Quick actions avec gestion d'erreur
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'new-project',
      label: 'Nouveau projet',
      icon: PlusCircle,
      action: () => handleNavigation('/projects/new')
    },
    {
      id: 'help',
      label: 'Aide',
      icon: HelpCircle,
      action: () => handleNavigation('/help'),
      variant: 'ghost' as const
    }
  ], [handleNavigation]);

  // Optimized active route detection
  const isActiveRoute = useCallback((path: string): boolean => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || 
             (location.pathname.startsWith('/dashboard') && location.pathname.split('/').length === 2);
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  // User display helpers
  const userInitials = useMemo(() => {
    if (!user?.first_name && !user?.last_name) return 'U';
    return `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
  }, [user?.first_name, user?.last_name]);

  const userDisplayName = useMemo(() => {
    if (user?.first_name || user?.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'Utilisateur';
  }, [user?.first_name, user?.last_name, user?.email]);

  const userRole = useMemo(() => {
    switch (user?.role) {
      case 'admin': return 'Admin';
      case 'moderateur': return 'Modérateur';
      default: return 'Citoyen';
    }
  }, [user?.role]);

  // Navigation Item Component
  const NavigationItem: React.FC<{ item: NavigationItem }> = ({ item }) => {
    const isActive = isActiveRoute(item.path);
    const Icon = item.icon;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => handleNavigation(item.path)}
            className={`w-full justify-start gap-3 h-10 ${isCollapsed ? 'px-3' : 'px-3'}`}
            aria-label={item.description}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Button>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" align="center">
            <div className="text-center">
              <p className="font-medium">{item.label}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  // Main Sidebar Content
  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <svg className="h-8 w-8 text-primary flex-shrink-0" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
          </svg>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-lg leading-tight">AgoraFlux</h1>
              <p className="text-xs text-muted-foreground">Plateforme collaborative</p>
            </div>
          )}
        </div>
        {onToggleCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapsed}
            className="h-8 w-8 p-0 hidden md:flex"
            aria-label={isCollapsed ? "Développer la sidebar" : "Réduire la sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user.avatar_url} alt={userDisplayName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{userDisplayName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {userRole}
                  </Badge>
                  {user.is_verified && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-green-600 border-green-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  )}
                </div>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Menu utilisateur</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/ui-demo')}>
                  <Palette className="mr-2 h-4 w-4" />
                  Démo UI
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {!isCollapsed && (
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Navigation
          </h3>
        )}
        <TooltipProvider delayDuration={0}>
          <div className="space-y-1">
            {NAVIGATION_ITEMS.map((item) => (
              <NavigationItem key={item.id} item={item} />
            ))}
          </div>
        </TooltipProvider>

        <Separator className="my-4" />

        {/* Quick Actions */}
        {!isCollapsed && (
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Actions rapides
          </h3>
        )}
        <TooltipProvider delayDuration={0}>
          <div className="space-y-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={action.variant || "ghost"}
                      size="sm"
                      onClick={action.action}
                      className={`w-full justify-start gap-3 h-10 ${isCollapsed ? 'px-3' : 'px-3'}`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="flex-1 text-left font-medium">{action.label}</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" align="center">
                      <p>{action.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 h-9"
                  onClick={() => handleNavigation('/search')}
                >
                  <Search className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Rechercher</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Recherche globale</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 h-9 relative"
                  onClick={() => handleNavigation('/notifications')}
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  {!isCollapsed && <span className="ml-2">Notifications</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications (3)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNavigation('/')}
          className="w-full h-9"
        >
          <Home className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Accueil</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex ${className}`}>
        <div 
          className={`bg-background border-r transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-16' : 'w-72'
          }`}
        >
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Menu Button - Positioned better */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSheetOpen(true)}
          className="fixed top-4 left-4 z-50 bg-background/95 backdrop-blur-sm shadow-lg border-border/40 h-10 w-10 p-0"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent 
            side="left" 
            className="w-80 max-w-[85vw] p-0"
            onInteractOutside={() => setIsSheetOpen(false)}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navigation</SheetTitle>
            </SheetHeader>
            <div className="relative h-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSheetOpen(false)}
                className="absolute top-4 right-4 z-10 h-8 w-8 p-0"
                aria-label="Fermer le menu"
              >
                <X className="h-4 w-4" />
              </Button>
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar; 