import React, { useState } from 'react';
import Header from '../components/common/Header';
import { 
  Button,
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Badge, Alert, AlertDescription, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Avatar, AvatarFallback, AvatarImage, Separator, Skeleton
} from '../components/ui';
import { 
  Heart, MessageSquare, Share2, Calendar, MapPin, Clock, 
  Star, ChevronDown, Bell, Settings, User, LogOut, Download,
  ThumbsUp, Eye, Filter, Search, AlertCircle, Info, CheckCircle
} from 'lucide-react';

const UIDemo: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('components');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Démonstration des Composants UI" subtitle="Showcase des composants shadcn/ui intégrés" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* En-tête */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Composants shadcn/ui
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Découvrez tous les composants shadcn/ui intégrés dans AgoraFlux. 
              Ces composants modernes et accessibles forment la base de notre interface utilisateur.
            </p>
          </div>

          {/* Navigation par onglets */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="components">Composants</TabsTrigger>
              <TabsTrigger value="forms">Formulaires</TabsTrigger>
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="examples">Exemples</TabsTrigger>
            </TabsList>

            {/* Onglet Composants de base */}
            <TabsContent value="components" className="space-y-8">
              
              {/* Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle>Boutons</CardTitle>
                  <CardDescription>
                    Différentes variantes de boutons avec styles et tailles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="default">Default</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Badges */}
              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                  <CardDescription>
                    Indicateurs et étiquettes pour catégoriser le contenu.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Nouveau</Badge>
                    <Badge variant="secondary">Populaire</Badge>
                    <Badge variant="destructive">Urgent</Badge>
                    <Badge variant="outline">Draft</Badge>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <Badge>
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Messages
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Avatars */}
              <Card>
                <CardHeader>
                  <CardTitle>Avatars</CardTitle>
                  <CardDescription>
                    Représentation visuelle des utilisateurs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-center">
                    <Avatar>
                      <AvatarImage src="https://i.pravatar.cc/150?img=1" />
                      <AvatarFallback>MD</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarImage src="https://i.pravatar.cc/150?img=2" />
                      <AvatarFallback>JM</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                  </div>
                </CardContent>
              </Card>

              {/* Skeleton */}
              <Card>
                <CardHeader>
                  <CardTitle>Skeleton (Chargement)</CardTitle>
                  <CardDescription>
                    Indicateurs de chargement pour améliorer l'UX.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-4 w-[60%]" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Alertes */}
            <TabsContent value="forms" className="space-y-8">
              
              {/* Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Alertes</CardTitle>
                  <CardDescription>
                    Messages d'information, d'erreur et de succès.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Ceci est une alerte d'information standard.
                    </AlertDescription>
                  </Alert>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Une erreur s'est produite lors du traitement.
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Opération réalisée avec succès !
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Form Elements */}
              <Card>
                <CardHeader>
                  <CardTitle>Éléments de Formulaire</CardTitle>
                  <CardDescription>
                    Champs de saisie et contrôles pour les formulaires.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" placeholder="votre@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="select">Sélection</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="option1">Option 1</SelectItem>
                          <SelectItem value="option2">Option 2</SelectItem>
                          <SelectItem value="option3">Option 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Votre message..." />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Navigation */}
            <TabsContent value="navigation" className="space-y-8">
              
              {/* Dialog */}
              <Card>
                <CardHeader>
                  <CardTitle>Modales et Dialogues</CardTitle>
                  <CardDescription>
                    Fenêtres modales pour les actions importantes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>Ouvrir une modale</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Exemple de Modale</DialogTitle>
                        <DialogDescription>
                          Ceci est un exemple de modale utilisant le composant Dialog de shadcn/ui.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p>Contenu de la modale...</p>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Annuler
                          </Button>
                          <Button onClick={() => setIsDialogOpen(false)}>
                            Confirmer
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Dropdown Menu */}
              <Card>
                <CardHeader>
                  <CardTitle>Menu Déroulant</CardTitle>
                  <CardDescription>
                    Menus contextuels et actions rapides.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Actions
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Profil
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Paramètres
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                      </DropdownMenuItem>
                      <Separator />
                      <DropdownMenuItem className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>

              {/* Tooltip */}
              <Card>
                <CardHeader>
                  <CardTitle>Tooltips</CardTitle>
                  <CardDescription>
                    Informations contextuelles au survol.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div className="flex gap-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Télécharger le fichier</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ajouter aux favoris</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Exemples */}
            <TabsContent value="examples" className="space-y-8">
              
              {/* Exemple Carte Projet */}
              <Card>
                <CardHeader>
                  <CardTitle>Exemple: Carte de Projet</CardTitle>
                  <CardDescription>
                    Un exemple concret d'utilisation dans AgoraFlux.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Card className="max-w-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">Rénovation École Primaire</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            15ème arrondissement, Paris
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Éducation</Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Modernisation complète de l'école primaire avec installation de nouvelles technologies et amélioration de l'efficacité énergétique.
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Déc 2024</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>6 mois</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">MD</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">Marie Dupont</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ThumbsUp className="h-4 w-4" />
                                  <span className="ml-1">24</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>24 soutiens citoyens</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                  <span className="ml-1">156</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>156 vues</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="gap-2">
                      <Button className="flex-1">Soutenir</Button>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Exporter en PDF</DropdownMenuItem>
                          <DropdownMenuItem>Partager le lien</DropdownMenuItem>
                          <DropdownMenuItem>Ajouter au rapport</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                  </Card>
                </CardContent>
              </Card>

              {/* Exemple Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle>Exemple: Tableau de bord</CardTitle>
                  <CardDescription>
                    Interface de gestion avec filtres et actions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Barre d'actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Rechercher..." 
                            className="pl-8 w-[300px]"
                          />
                        </div>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filtres
                        </Button>
                      </div>
                      <Button>
                        Nouveau projet
                      </Button>
                    </div>
                    
                    {/* Liste d'éléments */}
                    <div className="space-y-2">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>P{item}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">Projet {item}</p>
                              <p className="text-sm text-muted-foreground">Description courte</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Active</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Voir</DropdownMenuItem>
                                <DropdownMenuItem>Modifier</DropdownMenuItem>
                                <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                                <Separator />
                                <DropdownMenuItem className="text-red-600">
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UIDemo; 