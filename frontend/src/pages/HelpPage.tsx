import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search, Book, Users, BarChart3, MessageSquare, Shield, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { useAuth } from '../context/AuthContext';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface CategoryInfo {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const HelpPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const categories: Record<string, CategoryInfo> = {
    'getting-started': {
      icon: Book,
      title: 'Premiers pas',
      description: 'Comprendre les bases d\'AgoraFlux',
      color: 'bg-blue-500'
    },
    'projects': {
      icon: BarChart3,
      title: 'Projets',
      description: 'Créer et gérer vos projets collaboratifs',
      color: 'bg-green-500'
    },
    'collaboration': {
      icon: Users,
      title: 'Collaboration',
      description: 'Travailler ensemble efficacement',
      color: 'bg-purple-500'
    },
    'discussions': {
      icon: MessageSquare,
      title: 'Discussions',
      description: 'Participer aux débats citoyens',
      color: 'bg-orange-500'
    },
    'data': {
      icon: Download,
      title: 'Données',
      description: 'Comprendre et utiliser les données',
      color: 'bg-cyan-500'
    },
    'moderation': {
      icon: Shield,
      title: 'Modération',
      description: 'Gérer la qualité des contributions',
      color: 'bg-red-500'
    }
  };

  const faqItems: FAQItem[] = [
    // Premiers pas
    {
      id: '1',
      question: 'Qu\'est-ce qu\'AgoraFlux ?',
      answer: 'AgoraFlux est une plateforme de collaboration citoyenne qui permet aux citoyens de participer activement à l\'amélioration de leur ville en travaillant sur des projets basés sur des données publiques. Notre mission est de favoriser la démocratie participative en rendant les données publiques accessibles et exploitables par tous.',
      category: 'getting-started',
      tags: ['présentation', 'mission', 'objectifs']
    },
    {
      id: '2',
      question: 'Comment puis-je m\'inscrire sur la plateforme ?',
      answer: 'L\'inscription est simple et gratuite. Cliquez sur "S\'inscrire" en haut de la page, remplissez le formulaire avec votre email, nom, prénom et un mot de passe sécurisé. Vous recevrez un email de confirmation pour activer votre compte.',
      category: 'getting-started',
      tags: ['inscription', 'compte', 'registration']
    },
    {
      id: '3',
      question: 'Quels sont les différents rôles sur AgoraFlux ?',
      answer: 'Il existe trois rôles principaux : **Citoyen** (peut créer des projets et participer), **Modérateur** (peut modérer les discussions et gérer les contenus), et **Administrateur** (accès complet à la plateforme). Chaque rôle a des permissions spécifiques adaptées à ses responsabilités.',
      category: 'getting-started',
      tags: ['rôles', 'permissions', 'accès']
    },

    // Projets
    {
      id: '4',
      question: 'Comment créer un nouveau projet ?',
      answer: 'Pour créer un projet, cliquez sur "Nouveau projet" dans la sidebar ou allez dans la section Projets. Remplissez le titre, la description, définissez les objectifs et ajoutez des tags pertinents. Vous pouvez choisir la visibilité (public, privé, restreint) selon vos besoins.',
      category: 'projects',
      tags: ['création', 'nouveau projet', 'visibilité']
    },
    {
      id: '5',
      question: 'Quelle est la différence entre un projet public, privé et restreint ?',
      answer: '**Public** : Visible par tous, participation ouverte. **Privé** : Visible uniquement par l\'équipe du projet. **Restreint** : Visible par tous mais participation sur invitation uniquement. Cette flexibilité permet d\'adapter la collaboration selon le contexte du projet.',
      category: 'projects',
      tags: ['visibilité', 'permissions', 'types de projet']
    },
    {
      id: '6',
      question: 'Comment inviter des personnes à collaborer sur mon projet ?',
      answer: 'Dans la page de votre projet, cliquez sur "Gérer l\'équipe" puis "Inviter des collaborateurs". Entrez les emails des personnes à inviter et définissez leur rôle (Admin, Modérateur, ou Utilisateur). Ils recevront une invitation par email.',
      category: 'projects',
      tags: ['invitation', 'équipe', 'collaboration']
    },
    {
      id: '7',
      question: 'Que signifient les différents statuts de projet ?',
      answer: '**Brouillon** : Projet en préparation. **Actif** : Projet ouvert à la collaboration. **Terminé** : Projet complété avec discussions fermées. **Archivé** : Projet archivé pour consultation. **Suspendu** : Projet temporairement interrompu.',
      category: 'projects',
      tags: ['statuts', 'lifecycle', 'gestion']
    },

    // Collaboration
    {
      id: '8',
      question: 'Comment puis-je contribuer à un projet existant ?',
      answer: 'Parcourez les projets publics, cliquez sur celui qui vous intéresse. Vous pouvez participer en ajoutant des commentaires, en proposant des datasets, en participant aux discussions, ou en contactant le créateur pour une collaboration plus poussée.',
      category: 'collaboration',
      tags: ['contribution', 'participation', 'engagement']
    },
    {
      id: '9',
      question: 'Qu\'est-ce que le système de notifications ?',
      answer: 'Les notifications vous informent en temps réel des activités importantes : nouveaux commentaires sur vos projets, invitations à collaborer, actions de modération, mises à jour de projets suivis. Vous pouvez les consulter en cliquant sur l\'icône cloche.',
      category: 'collaboration',
      tags: ['notifications', 'communication', 'suivi']
    },

    // Discussions
    {
      id: '10',
      question: 'Comment participer aux discussions ?',
      answer: 'Dans chaque projet, vous trouverez une section "Discussions". Vous pouvez y poster des commentaires, poser des questions, faire des suggestions. Respectez toujours la charte de bonne conduite et restez constructif dans vos interventions.',
      category: 'discussions',
      tags: ['commentaires', 'participation', 'débats']
    },
    {
      id: '11',
      question: 'Que faire si je vois du contenu inapproprié ?',
      answer: 'Utilisez le bouton "Signaler" présent sur chaque commentaire. Notre équipe de modération examinera le contenu rapidement. Vous pouvez également contacter directement un modérateur ou administrateur via les notifications.',
      category: 'discussions',
      tags: ['signalement', 'modération', 'contenu inapproprié']
    },
    {
      id: '12',
      question: 'Puis-je modifier ou supprimer mes commentaires ?',
      answer: 'Vous pouvez modifier vos commentaires pendant 15 minutes après publication. Après ce délai, seuls les modérateurs peuvent intervenir. Pour supprimer un commentaire, contactez un modérateur avec une justification valable.',
      category: 'discussions',
      tags: ['édition', 'suppression', 'gestion commentaires']
    },

    // Données
    {
      id: '13',
      question: 'Qu\'est-ce que le pipeline de données ?',
      answer: 'Le pipeline de données traite et fusionne automatiquement les informations de différentes sources (Vélib\', budget municipal, participation citoyenne) pour alimenter nos visualisations. Seuls les administrateurs et modérateurs peuvent le contrôler pour garantir la qualité des données.',
      category: 'data',
      tags: ['pipeline', 'traitement', 'sources']
    },
    {
      id: '14',
      question: 'Comment puis-je ajouter des données à un projet ?',
      answer: 'Dans la section "Datasets" du projet, cliquez sur "Ajouter un dataset". Vous pouvez uploader des fichiers CSV, JSON, Excel ou connecter une API. Les données sont automatiquement analysées pour évaluer leur qualité et cohérence.',
      category: 'data',
      tags: ['upload', 'datasets', 'formats']
    },
    {
      id: '15',
      question: 'Comment interpréter les scores de qualité des données ?',
      answer: 'Chaque dataset reçoit un score global basé sur trois critères : **Complétude** (% de données remplies), **Cohérence** (uniformité des formats), **Validité** (respect des règles). Un score > 80% indique des données de bonne qualité.',
      category: 'data',
      tags: ['qualité', 'scores', 'métriques']
    },

    // Modération (pour modérateurs/admins)
    ...(user?.role === 'admin' || user?.role === 'moderateur' ? [
      {
        id: '16',
        question: 'Comment accéder au dashboard de modération ?',
        answer: 'En tant que modérateur/administrateur, vous avez accès au "Dashboard de Discussions" dans la sidebar. Cette interface centralisée vous permet de gérer toutes les discussions de la plateforme avec des actions de modération en temps réel.',
        category: 'moderation',
        tags: ['dashboard', 'accès', 'interface']
      },
      {
        id: '17',
        question: 'Quelles actions de modération puis-je effectuer ?',
        answer: 'Vous pouvez **épingler** les discussions importantes, **masquer** les contenus inappropriés, **résoudre** les discussions traitées. Les administrateurs peuvent également **supprimer** définitivement les contenus. Toutes les actions génèrent des notifications automatiques.',
        category: 'moderation',
        tags: ['actions', 'épinglage', 'masquage', 'suppression']
      },
      {
        id: '18',
        question: 'Comment fonctionnent les notifications de modération ?',
        answer: 'Chaque action de modération génère automatiquement une notification personnalisée à l\'auteur du commentaire, expliquant l\'action effectuée et la raison si fournie. Cela assure la transparence du processus de modération.',
        category: 'moderation',
        tags: ['notifications', 'transparence', 'communication']
      }
    ] : [])
  ];

  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  const filteredItems = faqItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Centre d'Aide AgoraFlux
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Trouvez toutes les informations dont vous avez besoin pour utiliser 
            efficacement notre plateforme de collaboration citoyenne.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher dans la FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Object.entries(categories).map(([key, category]) => {
            const Icon = category.icon;
            const itemCount = faqItems.filter(item => item.category === key).length;
            
            return (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCategory === key ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`${category.color} p-2 rounded-lg text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {itemCount} question{itemCount > 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600">{category.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Clear filter button */}
        {(selectedCategory || searchTerm) && (
          <div className="mb-6 text-center">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory(null);
                setSearchTerm('');
              }}
            >
              Afficher toutes les questions
            </Button>
          </div>
        )}

        {/* FAQ Items */}
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([categoryKey, items]) => {
            const category = categories[categoryKey];
            if (!category || items.length === 0) return null;

            return (
              <div key={categoryKey}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${category.color} p-2 rounded-lg text-white`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {category.title}
                  </h2>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <Card key={item.id}>
                      <Collapsible
                        open={openItems.has(item.id)}
                        onOpenChange={() => toggleItem(item.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg text-left">
                                {item.question}
                              </CardTitle>
                              {openItems.has(item.id) ? (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div 
                              className="text-gray-700 leading-relaxed mb-4"
                              dangerouslySetInnerHTML={{ 
                                __html: item.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                              }}
                            />
                            <div className="flex flex-wrap gap-2">
                              {item.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-gray-600">
              Essayez d'autres mots-clés ou parcourez toutes les catégories.
            </p>
          </div>
        )}

        {/* Contact */}
        <div className="mt-12 bg-white rounded-lg p-8 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Vous ne trouvez pas votre réponse ?
          </h3>
          <p className="text-gray-600 mb-6">
            Notre équipe est là pour vous aider. N'hésitez pas à nous contacter 
            pour toute question spécifique.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = 'mailto:support@agoraflux.fr'}
              className="bg-primary hover:bg-primary/90"
            >
              Contacter le support
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('/guide-utilisateur.pdf', '_blank')}
            >
              Guide utilisateur (PDF)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage; 