# Graphique d'Activité Collaborative - Documentation

## 🎯 Vue d'ensemble

Le graphique d'activité collaborative affiche l'évolution des discussions et contributions sur les **7 derniers jours** basé sur les **vraies données d'annotations** récupérées depuis l'API.

---

## 📊 Fonctionnalités

### 📈 **Graphique en Barres**
- **Période** : 7 derniers jours (aujourd'hui - 6 jours)
- **Données** : Annotations réelles filtrées par date
- **Hauteur des barres** : Proportionnelle au nombre d'annotations du jour
- **Interactivité** : Tooltip au survol avec détails

### 🎨 **Design Moderne**
- **Style** : Barres arrondies avec couleur primaire
- **Responsive** : S'adapte à la taille du conteneur
- **Hover effects** : Transition fluide avec opacité
- **Labels** : Jours de la semaine en français (Lun, Mar, etc.)

---

## 🔧 Implémentation Technique

### 📅 **Génération des Données**
```typescript
{Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i)); // 7 derniers jours
  
  // Compter les annotations de ce jour
  const dayAnnotations = filteredAnnotations.filter(annotation => {
    const annotationDate = new Date(annotation.timestamp);
    return annotationDate.toDateString() === date.toDateString();
  });
  
  // Calculer la hauteur proportionnelle
  const height = Math.max(20, (dayAnnotations.length / Math.max(1, filteredAnnotations.length)) * 160);
  
  return (
    <div key={i} className="flex flex-col items-center gap-2">
      <div 
        className="bg-primary rounded-t-sm w-8 transition-all hover:bg-primary/80"
        style={{ height: `${height}px` }}
        title={`${dayAnnotations.length} annotations le ${date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}`}
      />
      <span className="text-xs text-muted-foreground">
        {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
      </span>
    </div>
  );
})}
```

### 📊 **Calcul des Hauteurs**
```typescript
// Hauteur proportionnelle avec minimum de 20px
const height = Math.max(20, (dayAnnotations.length / Math.max(1, filteredAnnotations.length)) * 160);
```

### 🏷️ **Tooltips Informatifs**
```typescript
title={`${dayAnnotations.length} annotations le ${date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}`}
```

---

## 🎨 États d'Affichage

### ✅ **Avec Données** (filteredAnnotations.length > 0)
```tsx
<div className="h-full flex items-end justify-between px-4 pb-4">
  {/* 7 barres représentant les 7 derniers jours */}
  {/* Chaque barre a une hauteur proportionnelle aux annotations du jour */}
</div>
```

### 🈳 **Sans Données** (filteredAnnotations.length === 0)
```tsx
<div className="h-full flex items-center justify-center">
  <div className="text-center text-muted-foreground">
    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
    <p className="text-sm">Aucune activité collaborative pour le moment</p>
    <p className="text-xs mt-1">Les graphiques apparaîtront avec les premières contributions</p>
  </div>
</div>
```

---

## 🎯 Logique de Filtrage

### 📅 **Filtrage par Date**
```typescript
const dayAnnotations = filteredAnnotations.filter(annotation => {
  const annotationDate = new Date(annotation.timestamp);
  return annotationDate.toDateString() === date.toDateString();
});
```

### 🔢 **Sources de Données**
- **filteredAnnotations** : Annotations réelles récupérées depuis l'API `/collaboration/annotations`
- **annotation.timestamp** : Date/heure de création de l'annotation
- **Filtrage journalier** : Comparaison des dates en string pour exactitude

---

## 🎨 Styling et Design

### 🎨 **Classes CSS**
```css
/* Conteneur principal */
.h-[200px] w-full

/* Barres du graphique */
.bg-primary rounded-t-sm w-8 transition-all hover:bg-primary/80

/* Labels des jours */
.text-xs text-muted-foreground

/* État vide */
.h-12 w-12 mx-auto mb-2 opacity-50
```

### 📱 **Responsive Design**
- **Hauteur fixe** : 200px pour cohérence
- **Largeur flexible** : S'adapte au conteneur parent
- **Barres fixes** : 8px de largeur (w-8) pour lisibilité
- **Espacement** : gap-2 entre barres et labels

---

## 🔍 Exemples d'Utilisation

### 📊 **Scénario avec Activité**
```
Lun  Mar  Mer  Jeu  Ven  Sam  Dim
 █    ▄    █    ▄    ▄    ▄    █
 █    █    █    █    █    █    █
 █    █    █    █    █    █    █
```
- **Tooltip** : "3 annotations le lun. 15 janv."
- **Hauteur** : Proportionnelle au nombre d'annotations
- **Interactivité** : Hover change l'opacité

### 🈳 **Scénario sans Activité**
```
         📝
Aucune activité collaborative pour le moment
Les graphiques apparaîtront avec les premières contributions
```

---

## 🚀 Avantages

### ✅ **Données Authentiques**
- **Basé sur vraies annotations** : Pas de données fictives
- **Temps réel** : Se met à jour avec les nouvelles annotations
- **Précision** : Filtrage exact par date

### 🎯 **UX Optimisée**
- **Feedback visuel** : Tooltips informatifs
- **États gracieux** : Message explicatif si pas de données
- **Performance** : Calculs légers côté client

### 🎨 **Design Cohérent**
- **Style shadcn/ui** : Intégré au design system
- **Responsive** : Fonctionne sur tous les écrans
- **Accessible** : Tooltips et labels descriptifs

---

## 🔄 Évolutions Futures

### 📈 **Améliorations Possibles**
```typescript
// Périodes configurables
const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

// Types d'activité détaillés
const activityTypes = ['annotations', 'replies', 'reactions'];

// Graphiques plus avancés
import { LineChart, BarChart } from 'recharts';
```

### 🎯 **Métriques Additionnelles**
- **Réponses par jour** : Compter les replies
- **Réactions par jour** : Compter les reactions
- **Utilisateurs actifs** : Nombre d'utilisateurs uniques
- **Types d'annotations** : Répartition par catégorie

---

## ✅ Résultat

Le graphique d'activité collaborative affiche maintenant **les vraies données** d'annotations sur 7 jours avec :

🎯 **Fonctionnalités complètes** :
- ✅ Graphique en barres proportionnelles
- ✅ Tooltips informatifs
- ✅ Gestion des états vides
- ✅ Design moderne et responsive
- ✅ Données 100% authentiques

**Plus de placeholder "à implémenter" !** 🎉 