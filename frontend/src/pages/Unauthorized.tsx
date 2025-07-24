import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">403</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Accès non autorisé
          </h2>
          <p className="text-gray-500 mb-8">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            ← Retour à l'accueil
          </Link>
          
          <div className="text-sm text-gray-400">
            <Link to="/login" className="hover:text-blue-600 transition-colors">
              Se connecter
            </Link>
            {" · "}
            <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
              Tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 