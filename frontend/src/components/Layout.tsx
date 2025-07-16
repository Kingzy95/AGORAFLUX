import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './layout/Sidebar';
import Header from './common/Header';
import { NotificationDropdown, ToastContainer } from './notifications';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="AgoraFlux" subtitle="Plateforme de collaboration citoyenne" />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
      
      {/* Conteneur des toasts de notification */}
      <ToastContainer />
    </div>
  );
};

export default Layout; 