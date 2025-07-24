import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3, Users, MessageSquare, FolderOpen, Settings, HelpCircle,
  PlusCircle, Bell, Home, LogOut, User, Shield, Download, TrendingUp,
  ChevronDown, MoreHorizontal,
  FileText
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarTrigger,
  useSidebar
} from '../ui/sidebar';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';

// Types
interface NavigationItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: string | number;
  isActive?: boolean;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useSidebar();

  // Navigation handlers
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Check if route is active
  const isActiveRoute = (path: string): boolean => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || 
             (location.pathname.startsWith('/dashboard') && location.pathname.split('/').length === 2);
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // User display helpers
  const userInitials = React.useMemo(() => {
    if (!user?.first_name && !user?.last_name) return 'U';
    return `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
  }, [user?.first_name, user?.last_name]);

  const userDisplayName = React.useMemo(() => {
    if (user?.first_name || user?.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'Utilisateur';
  }, [user?.first_name, user?.last_name, user?.email]);

  const userRole = React.useMemo(() => {
    switch (user?.role) {
      case 'admin': return 'Admin';
      case 'moderateur': return 'Modérateur';
      default: return 'Citoyen';
    }
  }, [user?.role]);

  // Navigation data
  const navigationData: NavigationGroup[] = [
    {
      title: "Principal",
      items: [
        {
          title: "Tableau de bord",
          url: "/dashboard",
          icon: BarChart3,
          isActive: isActiveRoute('/dashboard')
        },
        {
          title: "Projets",
          url: "/projects",
          icon: FolderOpen,
          isActive: isActiveRoute('/projects')
        },
        {
          title: "Centre d'Export",
          url: "/export-center",
          icon: Download,
          isActive: isActiveRoute('/export-center')
        }
      ]
    },
    {
      title: "Collaboration",
      items: [
        {
          title: "Discussions",
          url: "/dashboard/discussions",
          icon: MessageSquare,
          badge: 3,
          isActive: isActiveRoute('/dashboard/discussions')
        },
        {
          title: "Communauté",
          url: "/dashboard/community",
          icon: Users,
          isActive: isActiveRoute('/dashboard/community')
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
          icon: TrendingUp,
          isActive: isActiveRoute('/dashboard/analytics')
        },
        {
          title: "Reporting",
          url: "/dashboard/reports",
          icon: FileText,
          isActive: isActiveRoute('/dashboard/reports')
        }
      ]
    },
    {
      title: "Administration",
      items: [
        {
          title: "Admin",
          url: "/admin",
          icon: Shield,
          isActive: isActiveRoute('/admin')
        }
      ]
    }
  ];

  // Quick actions
  const quickActions = [
    {
      title: "Nouveau projet",
      url: "/projects/new",
      icon: PlusCircle
    },
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <svg className="size-4" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
                  </svg>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">AgoraFlux</span>
                  <span className="truncate text-xs text-muted-foreground">Plateforme collaborative</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* User Profile Section */}
        {user && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                      >
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src={user.avatar_url} alt={userDisplayName} />
                          <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{userDisplayName}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {userRole}
                            {user.is_verified && " • Vérifié"}
                          </span>
                        </div>
                        <ChevronDown className="ml-auto size-4" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align="end"
                      sideOffset={4}
                    >
                      <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        Profil
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Navigation Groups */}
        {navigationData.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                    >
                      <div onClick={() => handleNavigation(item.url)} className="cursor-pointer">
                        <item.icon />
                        <span>{item.title}</span>
                        {item.badge && (
                          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Actions rapides</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((action) => (
                <SidebarMenuItem key={action.title}>
                  <SidebarMenuButton asChild>
                    <div onClick={() => handleNavigation(action.url)} className="cursor-pointer">
                      <action.icon />
                      <span>{action.title}</span>
                    </div>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">Plus</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align="end"
                    >
                      <DropdownMenuItem>
                        <span>Raccourci clavier</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div onClick={() => handleNavigation('/notifications')} className="cursor-pointer relative">
                <Bell />
                <span>Notifications</span>
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                <SidebarMenuBadge>3</SidebarMenuBadge>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div onClick={() => handleNavigation('/')} className="cursor-pointer">
                <Home />
                <span>Accueil</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
} 