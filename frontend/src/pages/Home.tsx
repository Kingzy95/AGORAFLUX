import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const features = [
    {
      icon: (
        <span className="material-icons text-3xl">bar_chart</span>
      ),
      title: 'Visualisation de Données',
      description: 'Graphiques et cartes interactifs pour explorer les tendances et modèles des données publiques.'
    },
    {
      icon: (
        <span className="material-icons text-3xl">groups</span>
      ),
      title: 'Discussions Collaboratives',
      description: 'Participez à des discussions significatives, partagez des insights et contribuez aux débats politiques.'
    },
    {
      icon: (
        <span className="material-icons text-3xl">public</span>
      ),
      title: 'Portée Globale',
      description: 'Connectez-vous avec des citoyens du monde entier et participez à des initiatives globales.'
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between whitespace-nowrap px-4 py-4 lg:px-10">
          <div className="flex items-center gap-3 text-slate-800">
            <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
            <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900">AgoraFlux</h2>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <button 
              onClick={() => navigate('/')}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-500"
            >
              Accueil
            </button>
            <button 
              onClick={() => navigate('/projects')}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-500"
            >
              Projets
            </button>
            {isAuthenticated && (
              <>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-500"
                >
                  Tableau de bord
                </button>
                <button 
                  onClick={() => navigate('/export-center')}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-500"
                >
                  Centre d'Export
                </button>
              </>
            )}
          </nav>
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <button 
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-500"
                >
                  Connexion
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="flex min-w-[100px] items-center justify-center rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="truncate">S'inscrire</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">
                  Bonjour, {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                </span>
                <button 
                  onClick={handleLogout}
                  className="flex min-w-[100px] items-center justify-center rounded-md bg-slate-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  <span className="truncate">Déconnexion</span>
                </button>
              </div>
            )}
            <button className="md:hidden">
              <span className="material-icons text-slate-700">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{
              backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBXOInPNq4E8Ir4a0FOCy5zmHGs-LNW10bp4uPfTQjYMENQROAFg2F7piMBvz8l_HeTCKxGe0uVf_Lul1qofnRnnJMEpx7R5eUEBCqAHqZ9ifYG8P9T53WgOlWzvKp7eutwc35LzHHGGTHae6gHSoN9Jg08FudrrkoFxDLV3Cb8-r1LeukWYqdniaXAJekDN2KD4uy5Pi_Wx9Zc_nR9OzDg4HVgpAzlqUleUfqOE8u5QFGEpICmVtGEk_mLkSiVhdk5Be2T3UXvvszm")'
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-black/20"></div>
          <div className="relative mx-auto max-w-7xl px-4 py-32 text-center sm:px-6 lg:px-8 lg:py-48">
            <div className="flex flex-col items-center gap-6">
              <h1 className="text-4xl font-extrabold tracking-tighter text-white sm:text-5xl md:text-6xl">
                AgoraFlux: Plateforme de Collaboration Citoyenne
              </h1>
              <p className="max-w-3xl text-lg text-blue-100/90 sm:text-xl">
                AgoraFlux est une plateforme de pointe conçue pour favoriser l'engagement et la collaboration 
                citoyenne grâce à des données publiques enrichies. Visualisez, discutez et contribuez à une 
                société plus informée et participative.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!isAuthenticated ? (
                  <>
                    <button 
                      onClick={() => navigate('/register')}
                      className="flex min-w-[150px] items-center justify-center rounded-md bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <span className="truncate">Commencer maintenant</span>
                    </button>
                    <button 
                      onClick={() => navigate('/projects')}
                      className="flex min-w-[150px] items-center justify-center rounded-md border-2 border-white px-6 py-3 text-base font-semibold text-white transition-all hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                    >
                      <span className="truncate">Explorer les projets</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="flex min-w-[150px] items-center justify-center rounded-md bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <span className="truncate">Mon tableau de bord</span>
                    </button>
                    <button 
                      onClick={() => navigate('/projects/new')}
                      className="flex min-w-[150px] items-center justify-center rounded-md border-2 border-white px-6 py-3 text-base font-semibold text-white transition-all hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                    >
                      <span className="truncate">Créer un projet</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-50 py-20 sm:py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tighter text-slate-900 sm:text-4xl">
                Fonctionnalités Clés
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
                AgoraFlux offre une suite d'outils puissants pour améliorer la participation citoyenne 
                et la prise de décision basée sur les données.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="transform rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    {feature.icon}
                  </div>
                  <div className="mt-5">
                    <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-2 text-base text-slate-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Preview Section */}
        <section className="bg-white py-20 sm:py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tighter text-slate-900 sm:text-4xl">
                Projets en Cours
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
                Découvrez les projets collaboratifs actuels et participez à la démocratie participative.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Project Cards */}
              <div className="transform rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Actif
                  </span>
                  <div className="flex items-center text-sm text-slate-500">
                    <span className="material-icons text-sm mr-1">group</span>
                    156 participants
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Budget Municipal Paris 2024
                </h3>
                <p className="text-base text-slate-600 mb-4">
                  Analyse collaborative des dépenses publiques de la ville de Paris.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    budget
                  </span>
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    transparence
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/projects/1')}
                  className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Participer
                </button>
              </div>

              <div className="transform rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    Brouillon
                  </span>
                  <div className="flex items-center text-sm text-slate-500">
                    <span className="material-icons text-sm mr-1">group</span>
                    42 participants
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Mobilité Urbaine
                </h3>
                <p className="text-base text-slate-600 mb-4">
                  Étude participative sur l'amélioration des transports en commun.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    transport
                  </span>
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    urbain
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/projects/2')}
                  className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Participer
                </button>
              </div>

              <div className="transform rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    Terminé
                  </span>
                  <div className="flex items-center text-sm text-slate-500">
                    <span className="material-icons text-sm mr-1">group</span>
                    89 participants
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Environnement & Climat
                </h3>
                <p className="text-base text-slate-600 mb-4">
                  Analyse des politiques environnementales locales et propositions citoyennes.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    climat
                  </span>
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    environnement
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/projects/3')}
                  className="w-full rounded-md bg-slate-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Voir les résultats
                </button>
              </div>
            </div>
            <div className="mt-12 text-center">
              <button 
                onClick={() => navigate('/projects')}
                className="inline-flex items-center rounded-md border border-blue-500 bg-transparent px-6 py-3 text-base font-semibold text-blue-600 transition-all hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Voir tous les projets
              </button>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-slate-50 py-20 sm:py-24">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tighter text-slate-900 sm:text-4xl">
                Rejoignez AgoraFlux Aujourd'hui
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
                Renforcez votre communauté et contribuez à un avenir plus transparent et participatif.
              </p>
              {!isAuthenticated && (
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => navigate('/register')}
                    className="flex min-w-[150px] items-center justify-center rounded-md bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="truncate">Créer un compte gratuit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
              </svg>
              <h2 className="text-xl font-bold">AgoraFlux</h2>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <button 
                onClick={() => navigate('/projects')}
                className="text-base font-medium text-slate-300 transition-colors hover:text-white"
              >
                À propos
              </button>
              <button className="text-base font-medium text-slate-300 transition-colors hover:text-white">
                Conditions d'utilisation
              </button>
              <button className="text-base font-medium text-slate-300 transition-colors hover:text-white">
                Politique de confidentialité
              </button>
            </nav>
          </div>
          <p className="mt-8 text-center text-base text-slate-400">© 2024 AgoraFlux. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home; 