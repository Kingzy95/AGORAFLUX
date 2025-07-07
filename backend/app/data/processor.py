"""
Processeur de données pour AgoraFlux
Nettoyage, validation et transformation des données publiques
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import re
import pandas as pd
from loguru import logger
from dataclasses import dataclass
from enum import Enum
import numpy as np


class DataQuality(Enum):
    """Niveaux de qualité des données"""
    EXCELLENT = "excellent"  # >95%
    GOOD = "good"           # 80-95%
    ACCEPTABLE = "acceptable"  # 60-80%
    POOR = "poor"           # <60%


@dataclass
class QualityMetrics:
    """Métriques de qualité des données"""
    completeness: float  # % de données non nulles
    consistency: float   # % de données cohérentes
    validity: float      # % de données valides
    overall_score: float # Score global
    quality_level: DataQuality
    issues: List[str]    # Liste des problèmes détectés


class DataProcessor:
    """Processeur principal pour le nettoyage et la validation des données"""
    
    def __init__(self):
        self.validators = {
            'budget': self._validate_budget_data,
            'participation': self._validate_participation_data,
            'transport': self._validate_transport_data
        }
    
    async def process_data(self, raw_data: Dict[str, Any], data_type: str) -> Dict[str, Any]:
        """
        Traite les données brutes : nettoyage, validation, transformation
        """
        logger.info(f"🔄 Traitement des données {data_type}...")
        
        # Étape 1: Nettoyage initial
        cleaned_data = self._clean_raw_data(raw_data)
        
        # Étape 2: Validation spécifique au type
        if data_type in self.validators:
            validated_data = self.validators[data_type](cleaned_data)
        else:
            validated_data = cleaned_data
        
        # Étape 3: Calcul des métriques de qualité
        quality_metrics = self._calculate_quality_metrics(validated_data, data_type)
        
        # Étape 4: Transformation vers format standard
        transformed_data = self._transform_to_standard_format(validated_data, data_type)
        
        result = {
            "data_type": data_type,
            "processed_at": datetime.now().isoformat(),
            "raw_rows": len(raw_data.get('data', [])),
            "processed_rows": len(transformed_data),
            "quality_metrics": quality_metrics.__dict__,
            "data": transformed_data,
            "metadata": {
                "source": raw_data.get('source', 'unknown'),
                "processing_duration": "< 1s",  # À implémenter
                "transformations_applied": self._get_applied_transformations(data_type)
            }
        }
        
        logger.info(f"✅ Données {data_type} traitées: {len(transformed_data)} lignes, qualité {quality_metrics.quality_level.value}")
        return result
    
    def _clean_raw_data(self, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Nettoyage initial des données brutes"""
        data = raw_data.get('data', [])
        if not data:
            return []
        
        cleaned = []
        for row in data:
            if isinstance(row, dict):
                # Supprime les valeurs nulles et vides
                clean_row = {k: v for k, v in row.items() if v is not None and v != ''}
                
                # Normalise les chaînes de caractères
                for key, value in clean_row.items():
                    if isinstance(value, str):
                        clean_row[key] = value.strip()
                
                if clean_row:  # Garde seulement les lignes non vides
                    cleaned.append(clean_row)
        
        return cleaned
    
    def _validate_budget_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validation spécifique aux données budgétaires"""
        validated = []
        
        for row in data:
            try:
                # Validation des champs obligatoires
                if not all(key in row for key in ['secteur', 'montant']):
                    continue
                
                # Conversion et validation des montants
                montant = self._parse_numeric(row.get('montant', 0))
                if montant <= 0:
                    continue
                
                # Validation du secteur
                secteur = str(row.get('secteur', '')).strip()
                if len(secteur) < 2:
                    continue
                
                validated_row = {
                    'secteur': secteur,
                    'montant': montant,
                    'pourcentage': self._parse_numeric(row.get('pourcentage', 0)),
                    'annee': int(row.get('annee', datetime.now().year)),
                    'description': str(row.get('description', '')).strip()
                }
                
                validated.append(validated_row)
                
            except Exception as e:
                logger.warning(f"⚠️ Ligne budgétaire invalide ignorée: {str(e)}")
                continue
        
        return validated
    
    def _validate_participation_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validation spécifique aux données de participation"""
        validated = []
        
        for row in data:
            try:
                # Validation des champs obligatoires
                if not all(key in row for key in ['arrondissement', 'participants']):
                    continue
                
                # Validation de l'arrondissement (format 75XXX)
                arrond = str(row.get('arrondissement', '')).strip()
                if not re.match(r'^75\d{3}$', arrond):
                    continue
                
                # Validation des participants (nombre positif)
                participants = self._parse_numeric(row.get('participants', 0))
                if participants < 0:
                    continue
                
                validated_row = {
                    'arrondissement': arrond,
                    'nom': str(row.get('nom', f'{arrond} arrondissement')).strip(),
                    'participants': int(participants),
                    'projets_actifs': int(self._parse_numeric(row.get('projets_actifs', 0))),
                    'commentaires': int(self._parse_numeric(row.get('commentaires', 0))),
                    'satisfaction': round(float(self._parse_numeric(row.get('satisfaction', 0))), 1),
                    'mois': str(row.get('mois', datetime.now().strftime('%Y-%m'))).strip()
                }
                
                validated.append(validated_row)
                
            except Exception as e:
                logger.warning(f"⚠️ Ligne participation invalide ignorée: {str(e)}")
                continue
        
        return validated
    
    def _validate_transport_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validation spécifique aux données de transport"""
        # Pour l'instant, validation basique
        return data if isinstance(data, list) else []
    
    def _parse_numeric(self, value: Any) -> float:
        """Parse une valeur numérique depuis différents formats"""
        if isinstance(value, (int, float)):
            return float(value)
        
        if isinstance(value, str):
            # Supprime espaces et symboles monétaires
            cleaned = re.sub(r'[€$,\s]', '', value.strip())
            
            # Gère les notations européennes (virgule comme décimale)
            cleaned = cleaned.replace(',', '.')
            
            try:
                return float(cleaned)
            except ValueError:
                return 0.0
        
        return 0.0
    
    def _calculate_quality_metrics(self, data: List[Dict[str, Any]], data_type: str) -> QualityMetrics:
        """Calcule les métriques de qualité des données"""
        if not data:
            return QualityMetrics(0, 0, 0, 0, DataQuality.POOR, ["Aucune donnée valide"])
        
        total_fields = sum(len(row) for row in data)
        empty_fields = sum(1 for row in data for value in row.values() if not value)
        
        # Complétude: % de champs non vides
        completeness = ((total_fields - empty_fields) / total_fields * 100) if total_fields > 0 else 0
        
        # Cohérence: % de données cohérentes (validation type spécifique)
        consistency = self._calculate_consistency(data, data_type)
        
        # Validité: % de données dans les plages attendues
        validity = self._calculate_validity(data, data_type)
        
        # Score global (moyenne pondérée)
        overall_score = (completeness * 0.3 + consistency * 0.4 + validity * 0.3)
        
        # Niveau de qualité
        if overall_score >= 95:
            quality_level = DataQuality.EXCELLENT
        elif overall_score >= 80:
            quality_level = DataQuality.GOOD
        elif overall_score >= 60:
            quality_level = DataQuality.ACCEPTABLE
        else:
            quality_level = DataQuality.POOR
        
        issues = []
        if completeness < 90:
            issues.append(f"Complétude faible: {completeness:.1f}%")
        if consistency < 85:
            issues.append(f"Cohérence faible: {consistency:.1f}%")
        if validity < 85:
            issues.append(f"Validité faible: {validity:.1f}%")
        
        return QualityMetrics(
            completeness=round(completeness, 1),
            consistency=round(consistency, 1),
            validity=round(validity, 1),
            overall_score=round(overall_score, 1),
            quality_level=quality_level,
            issues=issues
        )
    
    def _calculate_consistency(self, data: List[Dict[str, Any]], data_type: str) -> float:
        """Calcule la cohérence des données"""
        if not data:
            return 0.0
        
        if data_type == 'budget':
            # Vérification cohérence budgétaire
            total_montant = sum(row.get('montant', 0) for row in data)
            total_pourcentage = sum(row.get('pourcentage', 0) for row in data)
            
            # La somme des pourcentages doit être proche de 100%
            consistency = 100 - abs(100 - total_pourcentage) if total_pourcentage > 0 else 0
            return max(0, min(100, consistency))
        
        elif data_type == 'participation':
            # Vérification cohérence participation
            consistent_rows = 0
            for row in data:
                # Les participants doivent être >= projets_actifs + commentaires raisonnables
                participants = row.get('participants', 0)
                projets = row.get('projets_actifs', 0)
                if participants >= projets:  # Logique basique
                    consistent_rows += 1
            
            return (consistent_rows / len(data) * 100) if data else 0
        
        return 90.0  # Valeur par défaut
    
    def _calculate_validity(self, data: List[Dict[str, Any]], data_type: str) -> float:
        """Calcule la validité des données"""
        if not data:
            return 0.0
        
        valid_rows = 0
        
        for row in data:
            if data_type == 'budget':
                montant = row.get('montant', 0)
                pourcentage = row.get('pourcentage', 0)
                # Montant raisonnable et pourcentage valide
                if 1000 <= montant <= 10000000000 and 0 <= pourcentage <= 100:
                    valid_rows += 1
            
            elif data_type == 'participation':
                participants = row.get('participants', 0)
                satisfaction = row.get('satisfaction', 0)
                # Participants raisonnables et satisfaction valide
                if 0 <= participants <= 10000 and 0 <= satisfaction <= 5:
                    valid_rows += 1
            
            else:
                valid_rows += 1  # Par défaut, considère comme valide
        
        return (valid_rows / len(data) * 100) if data else 0
    
    def _transform_to_standard_format(self, data: List[Dict[str, Any]], data_type: str) -> List[Dict[str, Any]]:
        """Transforme vers un format standardisé pour l'API"""
        if not data:
            return []
        
        transformed = []
        for row in data:
            # Ajoute métadonnées communes
            standard_row = {
                **row,
                'data_type': data_type,
                'processed_at': datetime.now().isoformat(),
                'quality_checked': True
            }
            
            # Transformations spécifiques par type
            if data_type == 'budget':
                standard_row['montant_formatted'] = self._format_currency(row.get('montant', 0))
                standard_row['category'] = 'budget'
            
            elif data_type == 'participation':
                standard_row['participation_rate'] = self._calculate_participation_rate(row)
                standard_row['category'] = 'civic_engagement'
            
            transformed.append(standard_row)
        
        return transformed
    
    def _format_currency(self, amount: float) -> str:
        """Formate un montant en euros"""
        if amount >= 1000000000:
            return f"{amount/1000000000:.1f} Md€"
        elif amount >= 1000000:
            return f"{amount/1000000:.1f} M€"
        elif amount >= 1000:
            return f"{amount/1000:.1f} k€"
        else:
            return f"{amount:.0f} €"
    
    def _calculate_participation_rate(self, row: Dict[str, Any]) -> float:
        """Calcule un taux de participation normalisé"""
        participants = row.get('participants', 0)
        # Estimation basée sur population arrondissement (approximatif)
        # Population moyenne par arrondissement parisien: ~110,000
        estimated_population = 110000
        return round((participants / estimated_population * 100), 2)
    
    def _get_applied_transformations(self, data_type: str) -> List[str]:
        """Retourne la liste des transformations appliquées"""
        common_transformations = [
            "Nettoyage des valeurs nulles",
            "Normalisation des chaînes de caractères",
            "Validation des types de données",
            "Calcul métriques de qualité"
        ]
        
        if data_type == 'budget':
            return common_transformations + [
                "Validation montants budgétaires",
                "Formatage devises",
                "Vérification cohérence pourcentages"
            ]
        elif data_type == 'participation':
            return common_transformations + [
                "Validation codes arrondissements",
                "Calcul taux de participation",
                "Validation plages de satisfaction"
            ]
        
        return common_transformations


# Instance globale
data_processor = DataProcessor() 