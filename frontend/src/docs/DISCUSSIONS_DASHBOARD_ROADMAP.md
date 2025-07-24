# Dashboard de Discussions - Roadmap de Modération

## 🎯 Vision Complète

Le Dashboard de Discussions doit devenir le **centre de contrôle complet** pour la modération et la gestion des discussions sur AgoraFlux.

---

## ✅ **Fonctionnalités Actuelles**

### **📊 Vue d'Ensemble**
- ✅ Liste centralisée de toutes les discussions
- ✅ Statistiques par type (questions, suggestions, commentaires)
- ✅ Filtrage par type et recherche textuelle
- ✅ Tri par date, popularité, nombre de réponses
- ✅ Affichage des auteurs et rôles
- ✅ Pagination et navigation

### **🎨 Interface**
- ✅ Design moderne avec cards hover
- ✅ Badges colorés par type de discussion
- ✅ Responsive et accessible
- ✅ Indicateurs visuels (épinglé, édité)

---

## 🚧 **Fonctionnalités à Implémenter**

### **🛡️ Outils de Modération Essentiels**

#### **1. Actions de Modération par Discussion**
```tsx
// À ajouter dans chaque card de discussion :
<div className="flex gap-2">
  <Button variant="outline" size="sm" onClick={() => handlePin(discussion.id)}>
    <Pin className="h-4 w-4" />
    {discussion.is_pinned ? 'Désépingler' : 'Épingler'}
  </Button>
  
  <Button variant="outline" size="sm" onClick={() => handleHide(discussion.id)}>
    <EyeOff className="h-4 w-4" />
    Masquer
  </Button>
  
  <Button variant="destructive" size="sm" onClick={() => handleDelete(discussion.id)}>
    <Trash2 className="h-4 w-4" />
    Supprimer
  </Button>
  
  <Button variant="outline" size="sm" onClick={() => handleResolve(discussion.id)}>
    <CheckCircle className="h-4 w-4" />
    Marquer résolu
  </Button>
</div>
```

#### **2. Système de Signalements**
```tsx
// Onglet "Signalements" dans le dashboard
<TabsContent value="reports">
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-red-500" />
        Contenus Signalés
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* Liste des discussions/commentaires signalés */}
      {reportedContent.map(report => (
        <div key={report.id} className="border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <Badge variant="destructive">{report.reason}</Badge>
              <p className="mt-2">{report.content}</p>
              <p className="text-sm text-muted-foreground">
                Signalé par {report.reporter_name} • {formatDate(report.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDismissReport(report.id)}>
                Ignorer
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleApproveReport(report.id)}>
                Approuver
              </Button>
            </div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
</TabsContent>
```

#### **3. Modération en Lot**
```tsx
// Sélection multiple et actions en lot
<div className="bg-muted p-4 rounded-lg mb-6">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Checkbox 
        checked={selectedDiscussions.length === discussions.length}
        onCheckedChange={handleSelectAll}
      />
      <span className="text-sm font-medium">
        {selectedDiscussions.length} discussion(s) sélectionnée(s)
      </span>
    </div>
    
    {selectedDiscussions.length > 0 && (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleBulkPin}>
          <Pin className="h-4 w-4 mr-2" />
          Épingler
        </Button>
        <Button variant="outline" size="sm" onClick={handleBulkHide}>
          <EyeOff className="h-4 w-4 mr-2" />
          Masquer
        </Button>
        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </div>
    )}
  </div>
</div>
```

### **📊 Analytics de Modération**

#### **4. Statistiques Avancées**
```tsx
// KPI spécifiques à la modération
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">Signalements en Attente</p>
          <p className="text-3xl font-bold text-red-600">{pendingReports}</p>
        </div>
        <Flag className="h-8 w-8 text-red-600" />
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">Actions de Modération (24h)</p>
          <p className="text-3xl font-bold text-blue-600">{moderationActions24h}</p>
        </div>
        <Shield className="h-8 w-8 text-blue-600" />
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">Utilisateurs Sanctionnés</p>
          <p className="text-3xl font-bold text-yellow-600">{sanctionedUsers}</p>
        </div>
        <UserX className="h-8 w-8 text-yellow-600" />
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">Taux de Résolution</p>
          <p className="text-3xl font-bold text-green-600">{resolutionRate}%</p>
        </div>
        <TrendingUp className="h-8 w-8 text-green-600" />
      </div>
    </CardContent>
  </Card>
</div>
```

### **👤 Gestion des Utilisateurs**

#### **5. Actions sur les Utilisateurs**
```tsx
// Menu contextuel pour chaque auteur
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => viewUserProfile(discussion.author.id)}>
      <User className="h-4 w-4 mr-2" />
      Voir le profil
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => viewUserHistory(discussion.author.id)}>
      <History className="h-4 w-4 mr-2" />
      Historique des discussions
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => warnUser(discussion.author.id)}>
      <AlertTriangle className="h-4 w-4 mr-2" />
      Avertir l'utilisateur
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => suspendUser(discussion.author.id)}>
      <Ban className="h-4 w-4 mr-2" />
      Suspendre temporairement
    </DropdownMenuItem>
    <DropdownMenuItem 
      className="text-red-600"
      onClick={() => banUser(discussion.author.id)}
    >
      <UserX className="h-4 w-4 mr-2" />
      Bannir définitivement
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### **🎯 Filtres Avancés**

#### **6. Filtrage et Recherche Évolués**
```tsx
// Sidebar de filtres avancés
<Card className="p-6">
  <CardHeader>
    <CardTitle>Filtres Avancés</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Statut de modération */}
    <div>
      <Label>Statut de Modération</Label>
      <Select value={moderationStatus} onValueChange={setModerationStatus}>
        <SelectItem value="all">Tous</SelectItem>
        <SelectItem value="pending">En attente</SelectItem>
        <SelectItem value="approved">Approuvés</SelectItem>
        <SelectItem value="hidden">Masqués</SelectItem>
        <SelectItem value="deleted">Supprimés</SelectItem>
      </Select>
    </div>
    
    {/* Signalements */}
    <div>
      <Label>Signalements</Label>
      <Select value={reportStatus} onValueChange={setReportStatus}>
        <SelectItem value="all">Tous</SelectItem>
        <SelectItem value="reported">Signalés</SelectItem>
        <SelectItem value="not_reported">Non signalés</SelectItem>
      </Select>
    </div>
    
    {/* Projet spécifique */}
    <div>
      <Label>Projet</Label>
      <Select value={selectedProject} onValueChange={setSelectedProject}>
        <SelectItem value="all">Tous les projets</SelectItem>
        {projects.map(project => (
          <SelectItem key={project.id} value={project.id}>
            {project.title}
          </SelectItem>
        ))}
      </Select>
    </div>
    
    {/* Période */}
    <div>
      <Label>Période</Label>
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
      />
    </div>
    
    {/* Auteur */}
    <div>
      <Label>Auteur</Label>
      <Input
        placeholder="Nom de l'utilisateur..."
        value={authorFilter}
        onChange={(e) => setAuthorFilter(e.target.value)}
      />
    </div>
  </CardContent>
</Card>
```

---

## 🔧 **APIs Backend Nécessaires**

### **Endpoints de Modération**
```python
# À ajouter dans backend/app/api/discussions.py

@router.patch("/{discussion_id}/moderate")
async def moderate_discussion(
    discussion_id: int,
    action: ModerationAction,  # pin, hide, delete, resolve
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_moderator)
):
    """Effectue une action de modération sur une discussion"""

@router.get("/reports")
async def get_reported_content(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_moderator)
):
    """Récupère les contenus signalés"""

@router.post("/{discussion_id}/report")
async def report_discussion(
    discussion_id: int,
    reason: str,
    details: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Signale une discussion"""

@router.post("/bulk-moderate")
async def bulk_moderate(
    discussion_ids: List[int],
    action: ModerationAction,
    current_user: User = Depends(get_current_moderator)
):
    """Actions de modération en lot"""
```

---

## 📈 **Priorisation**

### **🔥 Phase 1 (Critique)**
1. **Actions de modération de base** (épingler, masquer, supprimer)
2. **Système de signalements** simple
3. **Filtres par statut de modération**

### **⚡ Phase 2 (Important)**
4. **Modération en lot**
5. **Analytics de modération**
6. **Actions sur les utilisateurs**

### **🎨 Phase 3 (Nice-to-have)**
7. **Filtres avancés**
8. **Historique des actions**
9. **Notifications de modération**
10. **Rapports automatisés**

---

## 🎯 **Objectif Final**

Transformer le Dashboard de Discussions en un **outil de modération professionnel** permettant aux modérateurs et administrateurs de :

- **Surveiller** toute l'activité des discussions
- **Réagir rapidement** aux contenus problématiques  
- **Maintenir** un environnement sain et collaboratif
- **Analyser** les tendances de modération
- **Optimiser** les processus communautaires

Le dashboard deviendrait alors le **cerveau central** de la modération sur AgoraFlux ! 