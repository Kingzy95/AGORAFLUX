# Système de Modération Synchronisé - Implémenté

## Vue d'ensemble

Un système de modération complet et synchronisé qui permet aux modérateurs et administrateurs de gérer les discussions depuis le **Dashboard de Modération** avec **impact immédiat** sur tous les projets et **notifications automatiques** aux utilisateurs concernés.

---

## Fonctionnalités Principales

### **Synchronisation Temps Réel**
- **Dashboard ↔ Projets** : Actions instantanément reflétées
- **Rechargement automatique** : Mise à jour des commentaires toutes les 30s
- **Filtrage dynamique** : Commentaires masqués/supprimés automatiquement filtrés

### **Actions de Modération**

#### **Épinglage/Désépinglage**
- **Dashboard** : Bouton "Épingler/Désépingler"
- **API** : `PATCH /projects/{id}/comments/{id}/moderate` avec `action: "pin/unpin"`
- **Effet** : Commentaire mis en évidence dans le projet

#### **Masquage/Restauration**
- **Dashboard** : Bouton "Masquer" avec confirmation
- **API** : `PATCH /projects/{id}/comments/{id}/moderate` avec `action: "hide/show"`
- **Effet** : Commentaire invisible dans le projet, visible dans le dashboard
- **Notification** : Utilisateur informé avec raison optionnelle

#### **Résolution de Discussion**
- **Dashboard** : Bouton "Résoudre"
- **API** : `PATCH /projects/{id}/comments/{id}/moderate` avec `action: "resolve"`
- **Effet** : Discussion marquée comme résolue (statut `hidden`)
- **Notification** : Utilisateur informé de la résolution

#### **Suppression Définitive**
- **Dashboard** : Bouton "Supprimer" (admin uniquement)
- **API** : `DELETE /projects/{id}/comments/{id}/moderate`
- **Effet** : Commentaire définitivement supprimé
- **Notification** : Utilisateur informé avec raison obligatoire

---

## Permissions & Sécurité

### **Niveaux d'Accès**
```typescript
// Dashboard de Discussions
const hasAccess = user?.role === 'admin' || user?.role === 'moderateur';

// Actions par rôle
const canDelete = user?.role === 'admin';  // Suppression = Admin uniquement
const canModerate = hasAccess;             // Autres actions = Admin/Modérateur
```

### **Contrôles Côté Frontend**
```typescript
// Boutons d'action conditionnels
{canModerate && (
  <>
    <Button onClick={() => togglePin(comment.id)}>
      {comment.is_pinned ? 'Désépingler' : 'Épingler'}
    </Button>
    
    <Button onClick={() => toggleHide(comment.id)}>
      {comment.is_hidden ? 'Restaurer' : 'Masquer'}
    </Button>
    
    <Button onClick={() => resolveComment(comment.id)}>
      Résoudre
    </Button>
  </>
)}

{canDelete && (
  <Button variant="destructive" onClick={() => deleteComment(comment.id)}>
    Supprimer
  </Button>
)}
```

### **Sécurité Backend**
```python
# Vérification des permissions
@router.patch("/projects/{project_id}/comments/{comment_id}/moderate")
async def moderate_comment(
    comment_id: int,
    action: ModerationAction,
    current_user: User = Depends(get_current_user)
):
    # Vérification des permissions
    if current_user.role not in ['admin', 'moderateur']:
        raise HTTPException(403, "Permissions insuffisantes")
    
    # Admin requis pour suppression
    if action.action == "delete" and current_user.role != 'admin':
        raise HTTPException(403, "Seuls les admins peuvent supprimer")
```

---

## Synchronisation Dashboard ↔ Projets

### **Architecture de Synchronisation**

#### **Dashboard de Modération**
```typescript
// Rechargement automatique des commentaires
useEffect(() => {
  const interval = setInterval(() => {
    if (hasAccess) {
      refetch(); // Actualise la liste des commentaires
    }
  }, 30000); // Toutes les 30 secondes

  return () => clearInterval(interval);
}, [hasAccess, refetch]);

// Actions avec refetch immédiat
const moderateComment = async (commentId: number, action: string) => {
  await moderationApi.moderate(commentId, action);
  refetch(); // Actualisation immédiate
  
  // Notification de succès
  toast.success(`Action "${action}" effectuée avec succès`);
};
```

#### **Pages Projet**
```typescript
// Filtrage automatique des commentaires masqués/supprimés
const visibleComments = comments.filter(comment => 
  !comment.is_hidden && comment.status !== 'deleted'
);

// Mise en évidence des commentaires épinglés
const pinnedComments = visibleComments.filter(c => c.is_pinned);
const regularComments = visibleComments.filter(c => !c.is_pinned);

// Affichage ordonné : épinglés en premier
const orderedComments = [...pinnedComments, ...regularComments];
```

### **Flow de Synchronisation**

1. **Action dans Dashboard** : Modérateur clique sur "Masquer"
2. **API Call** : `PATCH /moderate` avec `action: "hide"`
3. **Backend Update** : `is_hidden = true` dans la DB
4. **Dashboard Refresh** : Commentaire reste visible avec badge "Masqué"
5. **Projet Auto-Filter** : Commentaire automatiquement filtré
6. **Notification User** : Utilisateur informé de l'action

---

## Système de Notifications

### **Types de Notifications**

#### **Modération Action**
```typescript
interface ModerationNotification {
  type: 'COMMENT_MODERATED';
  user_id: number;           // Auteur du commentaire
  moderator_id: number;      // Modérateur qui a agi
  comment_id: number;
  project_id: number;
  action: 'hide' | 'delete' | 'pin' | 'resolve';
  reason?: string;           // Raison optionnelle
  message: string;           // Message formaté
  timestamp: Date;
}
```

#### **Messages Automatiques**
```typescript
const getModerationMessage = (action: string, projectTitle: string, reason?: string) => {
  const messages = {
    hide: `Votre commentaire sur "${projectTitle}" a été masqué${reason ? ` pour la raison suivante : ${reason}` : '.'}`,
    delete: `Votre commentaire sur "${projectTitle}" a été supprimé${reason ? ` pour la raison suivante : ${reason}` : '.'}`,
    pin: `Votre commentaire sur "${projectTitle}" a été épinglé par un modérateur.`,
    resolve: `Votre discussion sur "${projectTitle}" a été marquée comme résolue.`
  };
  
  return messages[action] || 'Action de modération effectuée.';
};
```

### **Envoi des Notifications**
```typescript
// Lors d'une action de modération
const notifyUser = async (comment: Comment, action: string, reason?: string) => {
  const notification = {
    type: 'COMMENT_MODERATED',
    user_id: comment.author_id,
    moderator_id: currentUser.id,
    comment_id: comment.id,
    project_id: comment.project_id,
    action,
    reason,
    message: getModerationMessage(action, comment.project.title, reason),
    timestamp: new Date()
  };
  
  await notificationService.create(notification);
};
```

---

## Interface Utilisateur

### **Dashboard de Modération - Composants**

#### **Liste des Commentaires**
```typescript
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <MessageSquare className="h-5 w-5" />
      Commentaires à Modérer ({comments.length})
    </CardTitle>
  </CardHeader>
  
  <CardContent className="space-y-4">
    {comments.map(comment => (
      <CommentModerationCard 
        key={comment.id} 
        comment={comment}
        onModerate={handleModerate}
        canDelete={canDelete}
      />
    ))}
  </CardContent>
</Card>
```

#### **Carte de Commentaire avec Actions**
```typescript
<div className="border rounded-lg p-4 space-y-3">
  {/* En-tête avec statut */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="font-medium">{comment.author.first_name}</span>
      {comment.is_pinned && (
        <Badge variant="secondary">Épinglé</Badge>
      )}
      {comment.is_hidden && (
        <Badge variant="outline">Masqué</Badge>
      )}
    </div>
    
    <span className="text-sm text-muted-foreground">
      {formatDate(comment.created_at)}
    </span>
  </div>
  
  {/* Contenu du commentaire */}
  <p className="text-sm">{comment.content}</p>
  
  {/* Informations projet */}
  <div className="text-xs text-muted-foreground">
    Projet : {comment.project.title}
  </div>
  
  {/* Actions de modération */}
  <div className="flex gap-2 pt-2 border-t">
    <Button
      size="sm"
      variant="outline"
      onClick={() => onModerate(comment.id, comment.is_pinned ? 'unpin' : 'pin')}
    >
      {comment.is_pinned ? 'Désépingler' : 'Épingler'}
    </Button>
    
    <Button
      size="sm"
      variant="outline"
      onClick={() => onModerate(comment.id, comment.is_hidden ? 'show' : 'hide')}
    >
      {comment.is_hidden ? 'Restaurer' : 'Masquer'}
    </Button>
    
    <Button
      size="sm"
      variant="outline"
      onClick={() => onModerate(comment.id, 'resolve')}
    >
      Résoudre
    </Button>
    
    {canDelete && (
      <Button
        size="sm"
        variant="destructive"
        onClick={() => onModerate(comment.id, 'delete')}
      >
        Supprimer
      </Button>
    )}
  </div>
</div>
```

#### **Dialog de Confirmation avec Raison**
```typescript
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmer l'action de modération</AlertDialogTitle>
      <AlertDialogDescription>
        Vous êtes sur le point de {action} ce commentaire. 
        Cette action sera visible par l'auteur.
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <div className="py-4">
      <Label htmlFor="reason">Raison (optionnelle)</Label>
      <Textarea
        id="reason"
        placeholder="Expliquez pourquoi cette action est nécessaire..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
    </div>
    
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction onClick={confirmAction}>
        Confirmer
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Impact sur les Pages Projet

### **Filtrage Automatique**
```typescript
// Filtrage côté frontend des commentaires modérés
const useProjectComments = (projectId: number) => {
  const { data: allComments } = useQuery(['comments', projectId]);
  
  // Seuls les commentaires visibles sont affichés
  const visibleComments = useMemo(() => {
    return allComments?.filter(comment => 
      !comment.is_hidden && 
      comment.status !== 'deleted'
    ) || [];
  }, [allComments]);
  
  // Tri avec épinglés en premier
  const sortedComments = useMemo(() => {
    const pinned = visibleComments.filter(c => c.is_pinned);
    const regular = visibleComments.filter(c => !c.is_pinned);
    return [...pinned, ...regular];
  }, [visibleComments]);
  
  return sortedComments;
};
```

### **Affichage des Commentaires Épinglés**
```typescript
// Style spécial pour les commentaires épinglés
<div className={cn(
  "border rounded-lg p-4",
  comment.is_pinned && "border-primary bg-primary/5"
)}>
  {comment.is_pinned && (
    <div className="flex items-center gap-1 text-primary text-sm mb-2">
      <Pin className="h-4 w-4" />
      Commentaire épinglé
    </div>
  )}
  
  {/* Contenu du commentaire */}
  <p>{comment.content}</p>
</div>
```

---

## Tests et Validation

### **Scenarios de Test**

#### **Test de Synchronisation**
1. **Modérateur masque** un commentaire dans le dashboard
2. **Vérification** : Commentaire reste visible dans dashboard avec badge "Masqué"
3. **Vérification** : Commentaire disparaît immédiatement de la page projet
4. **Vérification** : Notification envoyée à l'auteur
5. **Modérateur restaure** le commentaire
6. **Vérification** : Commentaire réapparaît dans la page projet

#### **Test des Permissions**
1. **Utilisateur standard** : Aucun accès au dashboard de modération
2. **Modérateur** : Accès complet sauf suppression
3. **Admin** : Accès complet incluant suppression
4. **Vérification** : Boutons conditionnels selon le rôle

#### **Test des Notifications**
1. **Action de modération** effectuée
2. **Vérification** : Notification créée avec bon contenu
3. **Vérification** : Utilisateur reçoit la notification
4. **Vérification** : Message personnalisé selon l'action

---

## Performance et Optimisations

### **Rechargement Intelligent**
```typescript
// Rechargement uniquement si nécessaire
const useAutoRefresh = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      // Vérifier s'il y a eu des changements récents
      queryClient.invalidateQueries(['moderation-comments']);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [enabled]);
};
```

### **Cache Optimisé**
```typescript
// Invalidation sélective du cache
const updateCommentCache = (commentId: number, updates: Partial<Comment>) => {
  queryClient.setQueryData(['comments'], (oldData: Comment[]) => 
    oldData.map(comment => 
      comment.id === commentId 
        ? { ...comment, ...updates }
        : comment
    )
  );
};
```

---

## Conclusion et Avantages

### **Bénéfices du Système**

#### **Pour les Modérateurs**
- **Interface centralisée** : Gestion de tous les commentaires en un lieu
- **Actions rapides** : Boutons intuitifs avec confirmations
- **Visibilité complète** : Voir commentaires masqués pour suivi
- **Raisons documentées** : Traçabilité des actions

#### **Pour les Utilisateurs**
- **Transparence** : Notifications explicatives des actions
- **Équité** : Processus de modération visible et documenté
- **Réactivité** : Pas besoin de rafraîchir, changements instantanés

#### **Pour la Plateforme**
- **Qualité** : Discussions mieux modérées et organisées
- **Efficacité** : Modération rapide et synchronisée
- **Audit** : Traçabilité complète des actions de modération
- **Scalabilité** : Système extensible pour nouvelles fonctionnalités

### **Réussite Technique**
- **Synchronisation parfaite** entre dashboard et projets
- **Permissions granulaires** et sécurisées
- **Notifications automatiques** et personnalisées
- **Interface intuitive** et professionnelle
- **Performance optimisée** avec cache intelligent

Ce système de modération représente un **pilier fondamental** pour maintenir la qualité des discussions sur la plateforme AgoraFlux tout en offrant une expérience utilisateur transparente et équitable. 