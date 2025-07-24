# Permissions Pipeline de Données - AgoraFlux

## Vue d'ensemble

Le **Pipeline de Données** est un système sensible qui permet de traiter, fusionner et gérer les sources de données de la plateforme. L'accès à ce système est **restreint aux utilisateurs privilégiés** pour garantir la sécurité et l'intégrité des données.

---

## Contrôle d'Accès

### Utilisateurs Autorisés

#### **Administrateurs (`admin`)**
- **Accès complet** au pipeline de données
- **Lancement manuel** des traitements
- **Monitoring avancé** des sources et datasets
- **Gestion des erreurs** et diagnostics
- **Configuration** des sources de données

#### **Modérateurs (`moderateur`)**
- **Accès supervisé** au pipeline
- **Lancement manuel** des traitements
- **Monitoring des données** pour la modération
- **Visualisation** des statistiques
- Configuration avancée réservée aux admins

### Utilisateurs Non Autorisés

#### **Citoyens (`utilisateur`)**
- **Aucun accès** au panneau de contrôle du pipeline
- **Visualisation** des données produites (graphiques, métriques)
- **Consultation** des résultats via les dashboards
- **Message informatif** expliquant la restriction

#### **Utilisateurs Non Connectés**
- **Accès refusé** à toute fonctionnalité pipeline
- **Redirection** vers la page de connexion

---

## Implémentation de la Sécurité

### **Vérification Côté Frontend**
```typescript
// Dans AnalyticsDashboard.tsx
const isAdmin = user?.role === 'admin';
const isModerator = user?.role === 'moderateur';
const canAccessPipeline = isAdmin || isModerator;

// Affichage conditionnel
{canAccessPipeline && (
  <Card className="col-span-1 md:col-span-2 lg:col-span-3">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Pipeline de Données
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* Contrôles du pipeline */}
    </CardContent>
  </Card>
)}
```

### **Protection Backend**
```python
# Dans app/api/routes.py
@router.post("/pipeline/run")
async def run_pipeline(
    current_user: User = Depends(get_current_user)
):
    # Vérification des permissions
    if current_user.role not in ['admin', 'moderateur']:
        raise HTTPException(
            status_code=403,
            detail="Permissions insuffisantes pour accéder au pipeline"
        )
    
    # Exécution du pipeline autorisée
    return await pipeline_service.run()
```

### **Message d'Information**
Pour les utilisateurs non autorisés, un message pédagogique s'affiche :

```typescript
{!canAccessPipeline && (
  <Card className="col-span-1 md:col-span-2 lg:col-span-3">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-muted-foreground">
        <Lock className="h-5 w-5" />
        Pipeline de Données (Accès Restreint)
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Le contrôle du pipeline de données est réservé aux administrateurs 
        et modérateurs pour garantir la sécurité et l'intégrité des données.
      </p>
    </CardContent>
  </Card>
)}
```

---

## Fonctionnalités du Pipeline

### **Pour les Administrateurs**

#### **Contrôle Complet**
- **Démarrage manuel** des traitements de données
- **Configuration** des sources de données
- **Monitoring** en temps réel des performances
- **Gestion des erreurs** et diagnostics avancés
- **Planification** des tâches automatiques

#### **Surveillance Avancée**
- **Métriques détaillées** de performance
- **Historique complet** des traitements
- **Alertes** en cas d'erreur ou d'anomalie
- **Logs** détaillés pour le débogage

### **Pour les Modérateurs**

#### **Accès Supervisé**
- **Lancement manuel** des traitements standards
- **Consultation** des statuts et métriques
- **Monitoring** des données pour la modération
- **Export** des données pour l'analyse

#### **Limitations**
- Pas d'accès à la configuration avancée
- Pas de modification des paramètres système
- Supervision par les administrateurs

---

## Interface Utilisateur

### **Carte Pipeline (Admins/Modérateurs)**
```typescript
<Card className="pipeline-control">
  <CardHeader>
    <CardTitle>Pipeline de Données</CardTitle>
    <CardDescription>
      Contrôle et surveillance du traitement des données
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    <div className="space-y-4">
      {/* Statut actuel */}
      <div className="flex items-center justify-between">
        <span>Statut:</span>
        <Badge variant={isRunning ? "default" : "secondary"}>
          {isRunning ? "En cours" : "Arrêté"}
        </Badge>
      </div>
      
      {/* Contrôles */}
      <div className="flex gap-2">
        <Button 
          onClick={handleRunPipeline}
          disabled={isRunning}
        >
          Lancer le Pipeline
        </Button>
        
        {isAdmin && (
          <Button variant="outline" onClick={handleConfigure}>
            Configurer
          </Button>
        )}
      </div>
      
      {/* Métriques */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Dernière exécution:</span>
          <p className="font-medium">{lastRun}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Statut:</span>
          <p className="font-medium">{status}</p>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### **Message d'Information (Utilisateurs)**
```typescript
<Card className="pipeline-info">
  <CardHeader>
    <CardTitle className="text-muted-foreground">
      Pipeline de Données (Accès Restreint)
    </CardTitle>
  </CardHeader>
  
  <CardContent>
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Le pipeline de données traite et fusionne les informations 
        de différentes sources pour alimenter nos visualisations.
      </p>
      
      <p className="text-sm text-muted-foreground">
        L'accès au contrôle de ce système est réservé aux 
        administrateurs et modérateurs pour garantir la sécurité 
        et l'intégrité des données.
      </p>
      
      <div className="bg-muted p-3 rounded">
        <p className="text-xs text-muted-foreground">
          Vous pouvez consulter les résultats du pipeline dans 
          les graphiques et tableaux de bord disponibles.
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Sécurité et Audit

### **Traçabilité**
- **Logs** de tous les accès au pipeline
- **Audit** des actions effectuées
- **Historique** des modifications de configuration
- **Surveillance** des performances et erreurs

### **Protection**
- **Validation** des permissions à chaque action
- **Chiffrement** des données sensibles
- **Isolation** des environnements de traitement
- **Sauvegarde** automatique avant modifications

### **Monitoring**
- **Alertes** en temps réel en cas de problème
- **Métriques** de performance continues
- **Rapports** automatiques pour les administrateurs
- **Notifications** des actions critiques

---

## Roadmap

### **Améliorations Prévues**

#### **Court Terme**
- **Interface graphique** pour la configuration des sources
- **Notifications** push pour les modérateurs
- **Métriques** de performance avancées
- **Historique** détaillé des traitements

#### **Moyen Terme**
- **Planificateur** de tâches intégré
- **API** pour l'intégration externe
- **Machine Learning** pour l'optimisation automatique
- **Dashboard** dédié aux administrateurs

#### **Long Terme**
- **Intelligence artificielle** pour la détection d'anomalies
- **Scaling** automatique selon la charge
- **Multi-tenancy** pour différents environnements
- **Compliance** avec les réglementations de données

---

## Conclusion

Le système de permissions du pipeline de données garantit :

1. **Sécurité** : Accès restreint aux utilisateurs autorisés
2. **Intégrité** : Protection des données et des traitements
3. **Traçabilité** : Audit complet des actions
4. **Usabilité** : Interface adaptée au niveau d'autorisation

Cette approche assure un équilibre optimal entre **fonctionnalité** et **sécurité**, permettant aux utilisateurs privilégiés de gérer efficacement les données tout en protégeant l'intégrité du système. 