# Guide de Gestion des Statuts de Projets - AgoraFlux

## 🎯 Pourquoi les projets sont créés en "Brouillon" ?

### **🔒 Sécurité et Contrôle Qualité**

Quand vous créez un nouveau projet sur AgoraFlux, il est **automatiquement mis en statut "Brouillon"** pour plusieurs raisons importantes :

1. **📝 Finalisation du contenu** : Vous pouvez vérifier et compléter toutes les informations
2. **🔍 Révision des datasets** : S'assurer que les données sont correctement uploadées
3. **⚙️ Configuration finale** : Ajuster les paramètres de collaboration et visibilité
4. **🛡️ Éviter les publications accidentelles** : Protection contre les erreurs

### **📋 Statuts Disponibles**

| Statut | Description | Visibilité | Actions possibles |
|--------|-------------|------------|-------------------|
| **🟡 Brouillon** | Projet en préparation | ❌ Privé (propriétaire uniquement) | Édition complète, ajout datasets |
| **🟢 Actif** | Projet publié et ouvert | ✅ Public, collaboration ouverte | Commentaires, contributions |
| **🔵 Terminé** | Projet finalisé | ✅ Public, consultation uniquement | Lecture seule |
| **⚫ Archivé** | Projet archivé | 🔒 Accès restreint | Consultation limitée |

---

## 🚀 Comment Publier un Projet (Brouillon → Actif)

### **📍 Étape 1 : Accéder à votre projet**
1. Allez dans la page **"Projets"** ou **"Mon Dashboard"**
2. Cliquez sur votre projet en statut **"Brouillon"**
3. Vous arrivez sur la page de détail du projet

### **📍 Étape 2 : Utiliser le gestionnaire de statut**
Dans la **sidebar droite**, vous verrez une carte **"Gestion du statut"** avec :

#### **🎛️ Interface de Gestion**
```
┌─────────────────────────────────────┐
│ 🛠️ Gestion du statut                │
├─────────────────────────────────────┤
│ Statut actuel: 🟡 Brouillon         │
│ Projet en cours de préparation...   │
│                                     │
│ [👁️ Publier le projet]              │
│ [⚙️ Changer le statut]               │
└─────────────────────────────────────┘
```

### **📍 Étape 3 : Publier le projet**
1. **Cliquez sur "👁️ Publier le projet"** (bouton vert)
2. Une **dialog de confirmation** s'ouvre :

```
┌─────────────────────────────────────┐
│ 👁️ Publier le projet                │
├─────────────────────────────────────┤
│ Le projet deviendra visible         │
│ publiquement et ouvert à la         │
│ collaboration.                      │
│                                     │
│ Nouveau statut: [🟢 Actif ▼]        │
│                                     │
│ Raison (optionnel):                 │
│ [Publication initiale du projet]    │
│                                     │
│ ⚠️ Une fois publié, le projet sera  │
│ visible par tous les utilisateurs   │
│                                     │
│ [Annuler] [Confirmer]               │
└─────────────────────────────────────┘
```

3. **Cliquez sur "Confirmer"**
4. ✅ **Votre projet est maintenant ACTIF !**

---

## 🎛️ Options de Changement de Statut

### **🔄 Transitions Possibles**

#### **Depuis Brouillon 🟡**
- **→ Actif 🟢** : Publier le projet
- **→ Archivé ⚫** : Archiver sans publier

#### **Depuis Actif 🟢**
- **→ Terminé 🔵** : Marquer comme finalisé
- **→ Brouillon 🟡** : Repasser en privé
- **→ Archivé ⚫** : Archiver le projet

#### **Depuis Terminé 🔵**
- **→ Actif 🟢** : Réactiver la collaboration
- **→ Archivé ⚫** : Archiver définitivement

#### **Depuis Archivé ⚫**
- **→ Actif 🟢** : Restaurer et réactiver
- **→ Terminé 🔵** : Restaurer en lecture seule

---

## 🔧 Interface Technique

### **🎯 Pour les Propriétaires de Projet**

Vous voyez une **interface complète** avec :

```tsx
// Composant ProjectStatusManager avec canManage={true}
<ProjectStatusManager
  project={project}
  onStatusUpdate={(updatedProject) => setProject(updatedProject)}
  canManage={true}  // ✅ Contrôles complets
/>
```

**Fonctionnalités disponibles :**
- 🟢 **Bouton "Publier"** si en brouillon
- 🔵 **Bouton "Marquer terminé"** si actif
- ⚙️ **Sélecteur de statut** complet
- 📝 **Champ raison** pour justifier les changements
- ⚠️ **Alertes explicatives** pour chaque transition

### **👁️ Pour les Autres Utilisateurs**

Interface **en lecture seule** :

```tsx
// Composant ProjectStatusManager avec canManage={false}
<ProjectStatusManager
  project={project}
  onStatusUpdate={() => {}}
  canManage={false}  // 👁️ Lecture seule
/>
```

**Affichage informatif :**
- 📊 **Badge de statut** avec couleur
- 📅 **Date de publication** si applicable
- 📝 **Description** du statut actuel

---

## 🔄 Workflow Recommandé

### **📋 Checklist avant Publication**

Avant de passer de **Brouillon** à **Actif**, vérifiez :

- [ ] **Titre** : Clair et descriptif
- [ ] **Description** : Complète et engageante  
- [ ] **Objectifs** : Bien définis
- [ ] **Méthodologie** : Expliquée
- [ ] **Datasets** : Au moins un dataset uploadé
- [ ] **Tags** : Ajoutés pour la découvrabilité
- [ ] **Paramètres** : Commentaires/contributions configurés

### **🎯 Bonnes Pratiques**

#### **🟡 Phase Brouillon**
- Prenez le temps de **bien structurer** votre projet
- **Testez l'upload** de vos datasets
- **Rédigez une description** attractive
- **Ajoutez des tags** pertinents

#### **🟢 Phase Active**
- **Engagez** avec les commentaires
- **Répondez** aux questions
- **Modérez** si nécessaire
- **Mettez à jour** régulièrement

#### **🔵 Phase Terminée**
- **Documentez** les résultats
- **Partagez** les conclusions
- **Archivez** si plus d'intérêt

---

## 🛠️ API et Intégration

### **🔗 Endpoint Backend**
```http
PATCH /api/v1/projects/{project_id}/status
Content-Type: application/json

{
  "status": "active",
  "reason": "Publication initiale du projet"
}
```

### **📱 Service Frontend**
```typescript
// Méthode API
async updateProjectStatus(
  id: number, 
  status: 'draft' | 'active' | 'completed' | 'archived', 
  reason?: string
): Promise<Project>

// Utilisation
const updatedProject = await apiService.updateProjectStatus(
  project.id, 
  'active', 
  'Projet prêt pour la collaboration'
);
```

---

## ❓ FAQ - Questions Fréquentes

### **Q: Pourquoi mon projet n'apparaît pas dans la liste publique ?**
**R:** Votre projet est probablement encore en statut **"Brouillon"**. Utilisez le bouton **"Publier le projet"** pour le rendre visible.

### **Q: Peut-on revenir en arrière après publication ?**
**R:** Oui ! Vous pouvez repasser un projet **Actif** en **Brouillon** via le sélecteur de statut.

### **Q: Que se passe-t-il quand j'archive un projet ?**
**R:** Le projet devient **invisible** dans les listes publiques mais reste accessible via lien direct pour les collaborateurs.

### **Q: Un projet "Terminé" peut-il recevoir des commentaires ?**
**R:** Non, un projet terminé est en **lecture seule**. Réactivez-le pour permettre les interactions.

### **Q: Qui peut changer le statut d'un projet ?**
**R:** Seul le **propriétaire** du projet peut changer son statut. Les autres utilisateurs voient l'information en lecture seule.

---

## ✅ Résumé

🎯 **Les projets sont créés en "Brouillon" pour :**
- ✅ Permettre la finalisation avant publication
- ✅ Éviter les publications accidentelles  
- ✅ Garantir la qualité du contenu
- ✅ Donner le contrôle total au créateur

🚀 **Pour publier un projet :**
1. Accédez à la page du projet
2. Cliquez sur **"👁️ Publier le projet"** dans la sidebar
3. Confirmez dans la dialog
4. Votre projet est maintenant **🟢 Actif** !

🎛️ **Gestion complète** disponible via le composant **ProjectStatusManager** avec transitions fluides et interface intuitive.

**Votre projet est maintenant prêt à recevoir des collaborateurs !** 🎉 