# Permissions Pipeline de Données - AgoraFlux

## 🔒 Vue d'ensemble

Le **Pipeline de Données** est un système sensible qui permet de traiter, fusionner et gérer les sources de données de la plateforme. L'accès à ce système est **restreint aux utilisateurs privilégiés** pour garantir la sécurité et l'intégrité des données.

---

## 👥 Contrôle d'Accès

### ✅ **Utilisateurs Autorisés**

#### 🔴 **Administrateurs (`admin`)**
- ✅ **Accès complet** au pipeline de données
- ✅ **Lancement manuel** des traitements
- ✅ **Monitoring avancé** des sources et datasets
- ✅ **Gestion des erreurs** et diagnostics
- ✅ **Configuration** des sources de données

#### 🟡 **Modérateurs (`moderateur`)**
- ✅ **Accès supervisé** au pipeline
- ✅ **Lancement manuel** des traitements
- ✅ **Monitoring des données** pour la modération
- ✅ **Visualisation** des statistiques
- ❌ Configuration avancée réservée aux admins

### ❌ **Utilisateurs Non Autorisés**

#### 🔵 **Citoyens (`utilisateur`)**
- ❌ **Aucun accès** au panneau de contrôle du pipeline
- ✅ **Visualisation** des données produites (graphiques, métriques)
- ✅ **Consultation** des résultats via les dashboards
- 📝 **Message informatif** expliquant la restriction

#### ⚫ **Utilisateurs Non Connectés**
- ❌ **Accès refusé** à toute fonctionnalité pipeline
- 🔄 **Redirection** vers la page de connexion

---

## 🛡️ Implémentation de la Sécurité

### **Vérification Côté Frontend**
```typescript
// Dans AnalyticsDashboard.tsx
const isAdmin = user?.role === 'admin';
const isModerator = user?.role === 'moderateur';
const canAccessPipeline = isAdmin || isModerator;

// Affichage conditionnel
{canAccessPipeline && (
  <PipelineControlPanel />
)}

// Message pour utilisateurs non autorisés
{!canAccessPipeline && (
  <AccessDeniedMessage />
)}
```

### **Protection des Actions**
```typescript
// Dialog de configuration - Accès restreint
{showPipelineDialog && canAccessPipeline && (
  <PipelineConfigDialog />
)}

// Badge de permission affiché
<Badge variant="secondary">
  {isAdmin ? 'Admin' : 'Modérateur'}
</Badge>
```

### **Sécurité Backend (Recommandé)**
Les endpoints du pipeline doivent également vérifier les permissions :
```python
@router.post("/pipeline/run")
async def run_pipeline(current_user: User):
    if current_user.role not in ['admin', 'moderateur']:
        raise HTTPException(403, "Accès refusé")
```

---

## 🖥️ Interface Utilisateur

### **Pour Utilisateurs Autorisés**
- 🎛️ **Panneau de contrôle complet**
- 📊 **Statistiques temps réel** (sources, datasets, dernière exécution)
- ▶️ **Bouton "Lancer Pipeline"** avec confirmation
- 🔄 **Bouton d'actualisation** des données
- 📈 **Indicateurs d'état** (en cours, succès, erreur)
- 🏷️ **Badge de rôle** visible (Admin/Modérateur)

### **Pour Utilisateurs Non Autorisés**
- ℹ️ **Message informatif** élégant (fond bleu)
- 🚫 **Explication claire** de la restriction
- 👤 **Affichage du rôle actuel** de l'utilisateur
- 🎨 **Design cohérent** avec le reste de l'interface

---

## 🚀 Fonctionnalités du Pipeline

### **Ce que Fait le Pipeline**
1. **📥 Collecte** : Récupération des données depuis les sources configurées
2. **🔄 Traitement** : Nettoyage, validation et transformation
3. **🗃️ Fusion** : Agrégation géographique par arrondissement
4. **✅ Validation** : Évaluation de la qualité des données
5. **📊 Publication** : Mise à disposition pour les visualisations

### **Sources de Données Traitées**
- 🚴 **Données Vélib'** : Stations et disponibilité
- 💰 **Budget Municipal** : Allocation par secteur
- 🏛️ **Participation Citoyenne** : Engagement par arrondissement
- 🌍 **Données Géographiques** : Coordonnées et limites
- 📈 **Métriques d'Usage** : Statistiques d'utilisation

---

## 📋 Workflow d'Utilisation

### **Scenario Administrateur**
1. **🔍 Accès** : Voit le panneau de contrôle complet
2. **📊 Monitoring** : Vérifie l'état des sources et datasets
3. **▶️ Lancement** : Clique sur "Lancer Pipeline"
4. **⚙️ Configuration** : Voit le dialog avec les détails du traitement
5. **✅ Confirmation** : Lance le processus avec feedback temps réel
6. **📈 Suivi** : Monitore la progression et les résultats

### **Scenario Modérateur**
1. **🔍 Accès** : Voit le panneau avec ses permissions
2. **📊 Consultation** : Vérifie les données pour la modération
3. **▶️ Lancement** : Peut lancer le pipeline si nécessaire
4. **🎯 Focus** : Se concentre sur les données communautaires

### **Scenario Utilisateur Standard**
1. **ℹ️ Information** : Voit le message explicatif
2. **📊 Consultation** : Accède aux résultats via les graphiques
3. **🎯 Utilisation** : Profite des données traitées sans accès au contrôle

---

## 🎯 Justification des Restrictions

### **Pourquoi Restreindre l'Accès ?**

#### **🔒 Sécurité des Données**
- Éviter les lancements intempestifs qui pourraient surcharger le système
- Protéger l'intégrité des sources de données configurées
- Prévenir les interruptions de service

#### **🎛️ Complexité Technique**
- Le pipeline nécessite une compréhension technique des sources
- Les erreurs peuvent impacter l'ensemble des visualisations
- La configuration requiert des connaissances administratives

#### **👥 Responsabilité**
- Les admins et modérateurs sont formés à l'utilisation
- Traçabilité des actions pour l'audit et le debugging
- Gestion coordonnée des mises à jour de données

#### **⚡ Performance**
- Éviter les lancements simultanés multiples
- Gérer les ressources serveur de manière optimale
- Planification des traitements aux heures creuses

---

## 🔮 Évolutions Possibles

### **Permissions Granulaires**
- 🎯 **Pipeline en lecture seule** pour certains utilisateurs
- 📅 **Planification automatique** selon les rôles
- 🔔 **Notifications** de fin de traitement

### **Monitoring Étendu**
- 📊 **Métriques détaillées** par source
- 🚨 **Alertes automatiques** en cas d'erreur
- 📈 **Historique** des exécutions avec performance

### **Interface Adaptative**
- 🎨 **Vue simplifiée** pour modérateurs
- 🔧 **Vue technique** pour administrateurs
- 📱 **Version mobile** avec permissions adaptées

---

## ✅ Résumé

| Rôle | Pipeline Visible | Peut Lancer | Peut Configurer | Vue Données |
|------|------------------|-------------|------------------|-------------|
| **Admin** | ✅ Complet | ✅ Oui | ✅ Oui | ✅ Complète |
| **Modérateur** | ✅ Supervisé | ✅ Oui | ❌ Non | ✅ Modération |
| **Utilisateur** | ❌ Message | ❌ Non | ❌ Non | ✅ Graphiques |
| **Invité** | ❌ Non | ❌ Non | ❌ Non | ✅ Publique |

Cette approche garantit un **équilibre optimal** entre sécurité, fonctionnalité et expérience utilisateur ! 🛡️✨ 