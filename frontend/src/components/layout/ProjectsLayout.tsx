import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSidebar } from '../../hooks/useSidebar';

interface ProjectsLayoutProps {
  children?: React.ReactNode;
}

const ProjectsLayout: React.FC<ProjectsLayoutProps> = ({ children }) => {
  const { isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed}
        onToggleCollapsed={toggleCollapsed}
        className="h-full"
      />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Zone de contenu avec scroll */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectsLayout; 