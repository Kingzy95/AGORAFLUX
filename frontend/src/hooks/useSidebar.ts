import { useState, useEffect, useCallback } from 'react';

export interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
}

export interface SidebarActions {
  toggleCollapsed: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export interface UseSidebarReturn extends SidebarState, SidebarActions {}

const STORAGE_KEY = 'agoraflux-sidebar-state';

export const useSidebar = (): UseSidebarReturn => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Charger l'état depuis localStorage au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { isCollapsed: savedCollapsed } = JSON.parse(saved);
        setIsCollapsed(savedCollapsed);
      }
    } catch (error) {
      console.warn('Impossible de charger l\'état de la sidebar:', error);
    }
  }, []);

  // Sauvegarder l'état dans localStorage quand il change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isCollapsed }));
    } catch (error) {
      console.warn('Impossible de sauvegarder l\'état de la sidebar:', error);
    }
  }, [isCollapsed]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const openMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    openMobile,
    closeMobile,
    toggleMobile,
    setCollapsed,
  };
}; 