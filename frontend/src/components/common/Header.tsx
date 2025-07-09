import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { ArrowLeft, Menu, LogOut, User, Palette } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backTo?: string;
  rightActions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  showBackButton = false, 
  backTo = '/',
  rightActions 
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navigationItems = [
    { label: 'Accueil', path: '/', show: true },
    { label: 'Projets', path: '/projects', show: true },
    { label: 'Tableau de bord', path: '/dashboard', show: isAuthenticated },
    { label: 'Centre d\'Export', path: '/export-center', show: isAuthenticated },
    { label: 'UI Demo', path: '/ui-demo', show: true, icon: Palette },
  ].filter(item => item.show);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Back button + Title */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(backTo)}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
              </svg>
              <div>
                <h2 className="text-xl font-bold leading-tight tracking-tight">
                  AgoraFlux
                </h2>
                {title !== 'AgoraFlux' && (
                  <h1 className="text-lg font-semibold text-muted-foreground">{title}</h1>
                )}
              </div>
            </div>
          </div>

          {/* Center: Navigation Desktop */}
          <nav className="hidden items-center gap-2 md:flex">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className="text-sm font-medium"
              >
                {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Right: Actions + Auth */}
          <div className="flex items-center gap-2">
            {rightActions}
            
            {!isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/login')}
                >
                  Connexion
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                >
                  S'inscrire
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>
                    {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                  </span>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            )}
            
            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden ml-2"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 max-w-[85vw]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  {/* Navigation */}
                  <div className="space-y-2">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.path}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleNavigate(item.path)}
                      >
                        {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                        {item.label}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Auth Actions */}
                  <div className="border-t pt-4 space-y-2">
                    {!isAuthenticated ? (
                      <>
                        <Button 
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => handleNavigate('/login')}
                        >
                          Connexion
                        </Button>
                        <Button 
                          className="w-full justify-start"
                          onClick={() => handleNavigate('/register')}
                        >
                          S'inscrire
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>
                              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Déconnexion
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <div className="pb-4">
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 