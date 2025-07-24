# Fonctionnalité Équipe de Projet - AgoraFlux

## 🎯 Vue d'ensemble

La section **Équipe** permet de gérer les membres d'un projet, visualiser leurs contributions et inviter de nouveaux collaborateurs.

---

## 📍 Localisation

### **Accès via l'Interface**
1. **Aller sur la page d'un projet**
2. **Cliquer sur l'onglet "Équipe"** dans la navigation

### **Permissions**
- **👁️ Tous les utilisateurs** : Peuvent voir l'équipe
- **👑 Propriétaire du projet** : Peut inviter et gérer les membres

---

## 🏗️ Fonctionnalités

### **👥 Affichage des Membres**

#### **Informations Affichées**
- **Avatar** : Initiales du nom
- **Nom complet** et email
- **Rôle** avec badge coloré
- **Statistiques de contribution** :
  - 💬 Nombre de commentaires
  - 📊 Nombre de datasets uploadés
  - ⚡ Dernière activité
- **Date d'adhésion** au projet

#### **Rôles et Permissions**
| Rôle | Badge | Permissions |
|------|-------|-------------|
| 👑 **Propriétaire** | <span style="color: #f59e0b">Jaune</span> | Accès total, gestion d'équipe |
| 🛡️ **Administrateur** | <span style="color: #ef4444">Rouge</span> | Gestion avancée du projet |
| ⚙️ **Modérateur** | <span style="color: #3b82f6">Bleu</span> | Modération des discussions |
| 👤 **Contributeur** | <span style="color: #10b981">Vert</span> | Participation standard |

### **➕ Invitation de Membres** *(Propriétaire uniquement)*

#### **Processus d'Invitation**
1. **Cliquer sur "Inviter un membre"**
2. **Saisir l'adresse email** du destinataire
3. **Choisir le rôle** à attribuer
4. **Envoyer l'invitation**

#### **Rôles Attribuables**
- **Contributeur** : Participation standard
- **Modérateur** : Modération des discussions  
- **Administrateur** : Gestion avancée

### **📊 Statistiques d'Équipe**

Affichage en temps réel :
- **Nombre total de contributeurs**
- **Total des commentaires** de l'équipe
- **Total des datasets** uploadés

---

## 🔄 Intégration avec les Compteurs

### **Auto-incrémentation des Contributeurs**

Le compteur `contributor_count` s'incrémente automatiquement quand :

1. **Premier commentaire** d'un utilisateur sur le projet
2. **Premier dataset uploadé** par un utilisateur sur le projet

### **Logique Backend**
```python
# Dans projects.py - création de commentaire
if not existing_contributor:
    project.contributor_count += 1

# Dans datasets.py - upload de dataset  
if not existing_contributor_datasets and not existing_contributor_comments:
    project.contributor_count += 1
```

---

## 🎨 Interface Utilisateur

### **Design des Cartes de Membres**
```tsx
<Card>
  <CardContent className="p-4">
    <div className="flex items-start gap-4">
      {/* Avatar avec initiales */}
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-primary">
          {initiales}
        </AvatarFallback>
      </Avatar>
      
      {/* Informations et statistiques */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{nom}</h4>
          <Badge variant="outline" className={couleurRole}>
            <RoleIcon />
            {labelRole}
          </Badge>
        </div>
        
        {/* Statistiques en grille 3 colonnes */}
        <div className="grid grid-cols-3 gap-4">
          <div>💬 {commentaires} commentaires</div>
          <div>📊 {datasets} datasets</div>
          <div>⚡ {derniereActivite}</div>
        </div>
      </div>
      
      {/* Actions (email, gestion) */}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          <Mail />
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

### **Dialog d'Invitation**
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Inviter un nouveau membre</DialogTitle>
  </DialogHeader>
  <div className="space-y-4">
    <Input 
      type="email" 
      placeholder="exemple@email.com" 
    />
    <Select>
      <SelectItem value="contributor">Contributeur</SelectItem>
      <SelectItem value="moderator">Modérateur</SelectItem>
      <SelectItem value="admin">Administrateur</SelectItem>
    </Select>
  </div>
  <DialogFooter>
    <Button onClick={envoyerInvitation}>
      Envoyer l'invitation
    </Button>
  </DialogFooter>
</Dialog>
```

---

## 🔮 Évolutions Futures

### **Fonctionnalités à Implémenter**
- **🔗 Intégration API réelle** pour les invitations
- **📧 Système d'emails** d'invitation
- **👥 Gestion des permissions** granulaires
- **📊 Analytics d'équipe** avancées
- **💬 Chat d'équipe** intégré
- **🎯 Attribution de tâches** aux membres

### **Améliorations UX**
- **🔍 Recherche de membres** dans les équipes importantes
- **📱 Vue mobile** optimisée
- **🌙 Mode sombre** pour les cartes
- **⚡ Temps réel** pour les statuts en ligne

---

## 🚀 Utilisation

### **Pour les Propriétaires de Projet**
1. **Créez votre projet** normalement
2. **Allez dans l'onglet "Équipe"**
3. **Invitez des collaborateurs** selon leurs compétences
4. **Suivez les contributions** en temps réel

### **Pour les Contributeurs**
1. **Consultez l'équipe** pour connaître les autres membres
2. **Participez activement** (commentaires, datasets)
3. **Votre profil se met à jour** automatiquement

### **Bonnes Pratiques**
- **Invitez progressivement** selon les besoins
- **Attribuez les bons rôles** selon les compétences
- **Encouragez la collaboration** entre membres
- **Reconnaissez les contributions** importantes 