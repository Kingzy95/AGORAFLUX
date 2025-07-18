import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import ProjectsLayout from './components/layout/ProjectsLayout';
// import Layout from './components/Layout';
// import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import CollaborativeDashboard from './components/collaboration/CollaborativeDashboard';
import ProjectDetail from './pages/ProjectDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ExportCenter from './pages/ExportCenter';
import UIDemo from './pages/UIDemo';
import NewProject from './pages/NewProject';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import DiscussionsDashboard from './pages/DiscussionsDashboard';
import CommunityDashboard from './pages/CommunityDashboard';
import ReportsDashboard from './pages/ReportsDashboard';
import NotificationsPage from './pages/NotificationsPage';

// Placeholder components pour les pages manquantes
const Settings = () => <div className="p-8 text-center">Paramètres en cours de développement...</div>;
const ForgotPassword = () => <div className="p-8 text-center">Mot de passe oublié en cours de développement...</div>;
const Unauthorized = () => <div className="p-8 text-center">Accès non autorisé</div>;
const NotFound = () => <div className="p-8 text-center">Page non trouvée</div>;

// Configuration de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Routes principales */}
            <Route path="/" element={<Home />} />
            
            {/* Routes projets avec ProjectsLayout */}
            <Route path="/projects" element={<ProjectsLayout />}>
              <Route index element={<Projects />} />
              <Route path="new" element={<NewProject />} />
              <Route path=":id" element={<ProjectDetail />} />
            </Route>
            
            {/* Routes d'authentification */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Routes avec Dashboard Layout */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<CollaborativeDashboard />} />
              <Route path="discussions" element={<DiscussionsDashboard />} />
              <Route path="community" element={<CommunityDashboard />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="reports" element={<ReportsDashboard />} />
            </Route>
            
            <Route path="/export-center" element={<DashboardLayout />}>
              <Route index element={<ExportCenter />} />
            </Route>

            <Route path="/notifications" element={<NotificationsPage />} />
            
            {/* Routes utilitaires */}
            <Route path="/ui-demo" element={<UIDemo />} />
            
            {/* Routes à développer (avec layout si approprié) */}
            <Route path="/profile" element={<DashboardLayout />}>
              <Route index element={<Profile />} />
            </Route>
            <Route path="/settings" element={<DashboardLayout />}>
              <Route index element={<Settings />} />
            </Route>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
            
            {/* Routes d'erreur */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
