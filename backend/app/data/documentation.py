"""
Module de génération automatique de documentation pour AgoraFlux
Génère automatiquement la documentation des champs exploités et transformations
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import json
import re
from loguru import logger


class DocumentationType(Enum):
    """Types de documentation disponibles"""
    FIELD_SCHEMA = "field_schema"
    TRANSFORMATION_LOG = "transformation_log"
    DATA_LINEAGE = "data_lineage"
    QUALITY_REPORT = "quality_report"
    FUSION_MAPPING = "fusion_mapping"


@dataclass
class FieldDocumentation:
    """Documentation d'un champ de données"""
    field_name: str
    field_type: str
    description: str
    source_fields: List[str]
    transformations: List[str]
    validation_rules: List[str]
    sample_values: List[Any]
    null_percentage: float
    unique_values_count: int
    data_quality_score: float


@dataclass
class DatasetDocumentation:
    """Documentation complète d'un dataset"""
    dataset_name: str
    dataset_id: Optional[int]
    source_systems: List[str]
    fields: List[FieldDocumentation]
    processing_summary: Dict[str, Any]
    quality_metrics: Dict[str, float]
    transformation_history: List[Dict[str, Any]]
    generated_at: str
    version: str


class AutoDocumentationGenerator:
    """Générateur automatique de documentation des données"""
    
    def __init__(self):
        self.documentation_templates = {
            'field_template': {
                'field_name': '',
                'display_name': '',
                'description': '',
                'data_type': '',
                'format': '',
                'validation_rules': [],
                'source_mapping': {},
                'transformations_applied': [],
                'sample_values': [],
                'statistics': {}
            },
            'dataset_template': {
                'metadata': {},
                'schema': {},
                'lineage': {},
                'quality': {},
                'transformations': {}
            }
        }
    
    async def generate_comprehensive_documentation(self, 
                                                 processed_data: Dict[str, Any],
                                                 fusion_result: Optional[Any] = None) -> Dict[str, Any]:
        """
        Génère une documentation complète pour toutes les sources et fusions
        """
        logger.info("📖 Génération documentation automatique complète")
        
        documentation = {
            "generation_metadata": {
                "generated_at": datetime.now().isoformat(),
                "generator_version": "1.0.0",
                "total_sources": len(processed_data),
                "includes_fusion": fusion_result is not None
            },
            "source_documentation": {},
            "fusion_documentation": {},
            "global_schema": {},
            "transformation_summary": {}
        }
        
        # Documentation des sources individuelles
        for source_name, source_data in processed_data.items():
            logger.info(f"📝 Documentation source: {source_name}")
            source_doc = await self.generate_source_documentation(source_name, source_data)
            documentation["source_documentation"][source_name] = source_doc
        
        # Documentation de la fusion si disponible
        if fusion_result:
            logger.info("🔗 Documentation fusion")
            fusion_doc = await self.generate_fusion_documentation(fusion_result)
            documentation["fusion_documentation"] = fusion_doc
        
        # Schéma global unifié
        global_schema = self._generate_global_schema(processed_data, fusion_result)
        documentation["global_schema"] = global_schema
        
        # Résumé des transformations
        transformation_summary = self._generate_transformation_summary(processed_data, fusion_result)
        documentation["transformation_summary"] = transformation_summary
        
        logger.info("✅ Documentation complète générée")
        return documentation
    
    async def generate_source_documentation(self, source_name: str, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """Génère la documentation pour une source spécifique"""
        
        data_records = source_data.get('data', [])
        quality_metrics = source_data.get('quality_metrics', {})
        metadata = source_data.get('metadata', {})
        
        # Analyse des champs
        field_analysis = self._analyze_fields(data_records, source_name)
        
        # Documentation des transformations
        transformations_doc = self._document_transformations(metadata.get('transformations_applied', []))
        
        # Générer documentation de source
        source_doc = {
            "source_metadata": {
                "source_name": source_name,
                "source_type": metadata.get('source', 'unknown'),
                "records_count": len(data_records),
                "processed_at": source_data.get('processed_at'),
                "data_type": source_data.get('data_type', 'unknown')
            },
            "data_schema": {
                "fields": field_analysis,
                "total_fields": len(field_analysis),
                "key_fields": self._identify_key_fields(field_analysis),
                "nullable_fields": [f['field_name'] for f in field_analysis if f['null_percentage'] > 0]
            },
            "quality_assessment": {
                "overall_score": quality_metrics.get('overall_score', 0),
                "completeness": quality_metrics.get('completeness', 0),
                "consistency": quality_metrics.get('consistency', 0),
                "validity": quality_metrics.get('validity', 0),
                "quality_issues": quality_metrics.get('issues', [])
            },
            "transformations": transformations_doc,
            "sample_data": data_records[:3] if data_records else [],
            "field_documentation": self._generate_field_documentation(field_analysis, source_name)
        }
        
        return source_doc
    
    async def generate_fusion_documentation(self, fusion_result: Any) -> Dict[str, Any]:
        """Génère la documentation pour les données fusionnées"""
        
        fusion_doc = {
            "fusion_metadata": fusion_result.fusion_metadata,
            "fusion_strategy": fusion_result.fusion_metadata.get('fusion_strategy', 'unknown'),
            "sources_involved": fusion_result.fusion_metadata.get('sources_used', []),
            "records_merged": fusion_result.records_merged,
            "conflicts_resolved": fusion_result.conflicts_resolved,
            "fusion_quality": fusion_result.quality_metrics,
            "source_field_mapping": fusion_result.source_mapping,
            "fusion_schema": self._analyze_fusion_schema(fusion_result.fused_data),
            "lineage_tracking": self._generate_lineage_documentation(fusion_result),
            "fusion_rules": self._document_fusion_rules(fusion_result.fusion_metadata)
        }
        
        return fusion_doc
    
    def _analyze_fields(self, data_records: List[Dict[str, Any]], source_name: str) -> List[Dict[str, Any]]:
        """Analyse les champs d'un dataset"""
        if not data_records:
            return []
        
        # Collecter toutes les clés uniques
        all_fields = set()
        for record in data_records:
            all_fields.update(record.keys())
        
        field_analysis = []
        
        for field_name in all_fields:
            # Collecter toutes les valeurs pour ce champ
            values = [record.get(field_name) for record in data_records]
            non_null_values = [v for v in values if v is not None and v != '']
            
            # Analyser le type de données
            field_type = self._infer_field_type(non_null_values)
            
            # Calculer statistiques
            null_count = len(values) - len(non_null_values)
            null_percentage = (null_count / len(values) * 100) if values else 0
            unique_count = len(set(str(v) for v in non_null_values))
            
            # Échantillons de valeurs
            sample_values = list(set(str(v) for v in non_null_values[:5]))
            
            field_doc = {
                "field_name": field_name,
                "inferred_type": field_type,
                "total_values": len(values),
                "non_null_values": len(non_null_values),
                "null_percentage": round(null_percentage, 2),
                "unique_values_count": unique_count,
                "sample_values": sample_values,
                "is_key_field": self._is_potential_key(field_name, unique_count, len(values)),
                "description": self._generate_field_description(field_name, field_type, source_name)
            }
            
            field_analysis.append(field_doc)
        
        return sorted(field_analysis, key=lambda x: x['field_name'])
    
    def _infer_field_type(self, values: List[Any]) -> str:
        """Infère le type de données d'un champ"""
        if not values:
            return "unknown"
        
        # Test pour différents types
        numeric_count = 0
        date_count = 0
        boolean_count = 0
        
        for value in values[:min(100, len(values))]:  # Échantillon
            str_value = str(value).strip()
            
            # Test numérique
            try:
                float(str_value)
                numeric_count += 1
                continue
            except:
                pass
            
            # Test date
            if re.match(r'\d{4}-\d{2}-\d{2}', str_value) or re.match(r'\d{2}/\d{2}/\d{4}', str_value):
                date_count += 1
                continue
            
            # Test booléen
            if str_value.lower() in ['true', 'false', 'yes', 'no', '1', '0']:
                boolean_count += 1
                continue
        
        sample_size = min(100, len(values))
        
        if numeric_count / sample_size > 0.8:
            return "numeric"
        elif date_count / sample_size > 0.8:
            return "date"
        elif boolean_count / sample_size > 0.8:
            return "boolean"
        else:
            return "text"
    
    def _is_potential_key(self, field_name: str, unique_count: int, total_count: int) -> bool:
        """Détermine si un champ est potentiellement une clé"""
        key_indicators = ['id', 'code', 'key', 'identifier', 'uuid']
        
        # Test par nom
        name_based = any(indicator in field_name.lower() for indicator in key_indicators)
        
        # Test par unicité
        uniqueness_ratio = unique_count / total_count if total_count > 0 else 0
        uniqueness_based = uniqueness_ratio > 0.95
        
        return name_based or uniqueness_based
    
    def _generate_field_description(self, field_name: str, field_type: str, source_name: str) -> str:
        """Génère une description automatique pour un champ"""
        
        descriptions = {
            # Participation citoyenne
            'arrondissement': 'Code de l\'arrondissement parisien (format 75XXX)',
            'participants': 'Nombre de citoyens ayant participé aux consultations',
            'projets_actifs': 'Nombre de projets citoyens en cours dans la zone',
            'satisfaction': 'Score de satisfaction des citoyens (0-5)',
            'commentaires': 'Nombre de commentaires déposés par les citoyens',
            
            # Budget
            'secteur': 'Secteur budgétaire (Éducation, Transport, Santé, etc.)',
            'montant': 'Montant budgétaire alloué en euros',
            'pourcentage': 'Pourcentage du budget total',
            'annee': 'Année budgétaire de référence',
            
            # Champs génériques
            'nom': 'Nom ou libellé descriptif',
            'description': 'Description détaillée de l\'élément',
            'date': 'Date de l\'événement ou de la mesure',
            'created_at': 'Date de création de l\'enregistrement',
            'updated_at': 'Date de dernière modification'
        }
        
        # Description spécifique si disponible
        if field_name in descriptions:
            return descriptions[field_name]
        
        # Description générique basée sur le type
        type_descriptions = {
            'numeric': f'Valeur numérique représentant {field_name}',
            'text': f'Information textuelle concernant {field_name}',
            'date': f'Date liée à {field_name}',
            'boolean': f'Indicateur vrai/faux pour {field_name}'
        }
        
        return type_descriptions.get(field_type, f'Champ {field_name} de type {field_type}')
    
    def _identify_key_fields(self, field_analysis: List[Dict[str, Any]]) -> List[str]:
        """Identifie les champs clés d'un dataset"""
        return [field['field_name'] for field in field_analysis if field.get('is_key_field', False)]
    
    def _document_transformations(self, transformations: List[str]) -> Dict[str, Any]:
        """Documente les transformations appliquées"""
        return {
            "transformations_applied": transformations,
            "total_transformations": len(transformations),
            "transformation_categories": self._categorize_transformations(transformations),
            "transformation_details": [
                {
                    "transformation": trans,
                    "category": self._get_transformation_category(trans),
                    "description": self._get_transformation_description(trans)
                }
                for trans in transformations
            ]
        }
    
    def _categorize_transformations(self, transformations: List[str]) -> Dict[str, int]:
        """Catégorise les transformations par type"""
        categories = {
            "cleaning": 0,
            "validation": 0,
            "formatting": 0,
            "calculation": 0,
            "normalization": 0
        }
        
        for trans in transformations:
            category = self._get_transformation_category(trans)
            if category in categories:
                categories[category] += 1
        
        return categories
    
    def _get_transformation_category(self, transformation: str) -> str:
        """Détermine la catégorie d'une transformation"""
        trans_lower = transformation.lower()
        
        if any(word in trans_lower for word in ['nettoyage', 'suppression', 'clean']):
            return "cleaning"
        elif any(word in trans_lower for word in ['validation', 'vérification', 'check']):
            return "validation"
        elif any(word in trans_lower for word in ['formatage', 'format', 'devise']):
            return "formatting"
        elif any(word in trans_lower for word in ['calcul', 'taux', 'score']):
            return "calculation"
        elif any(word in trans_lower for word in ['normalisation', 'standard']):
            return "normalization"
        else:
            return "other"
    
    def _get_transformation_description(self, transformation: str) -> str:
        """Génère une description détaillée d'une transformation"""
        descriptions = {
            "Nettoyage des valeurs nulles": "Suppression ou traitement des valeurs manquantes dans le dataset",
            "Normalisation des chaînes de caractères": "Standardisation du format des textes (trim, casse, etc.)",
            "Validation des types de données": "Vérification et conversion des types de données appropriés",
            "Calcul métriques de qualité": "Évaluation automatique de la qualité des données",
            "Validation montants budgétaires": "Contrôle de cohérence des montants financiers",
            "Formatage devises": "Conversion des montants en format monétaire standardisé",
            "Validation codes arrondissements": "Vérification du format des codes postaux parisiens",
            "Calcul taux de participation": "Calcul des ratios de participation citoyenne"
        }
        
        return descriptions.get(transformation, f"Transformation: {transformation}")
    
    def _generate_global_schema(self, processed_data: Dict[str, Any], fusion_result: Optional[Any] = None) -> Dict[str, Any]:
        """Génère un schéma global unifié"""
        all_fields = {}
        source_mapping = {}
        
        # Collecter champs de toutes les sources
        for source_name, source_data in processed_data.items():
            data_records = source_data.get('data', [])
            if data_records:
                for record in data_records[:5]:  # Échantillon
                    for field_name in record.keys():
                        if field_name not in all_fields:
                            all_fields[field_name] = {
                                "sources": [],
                                "type": self._infer_field_type([record[field_name]]),
                                "description": self._generate_field_description(field_name, "unknown", source_name)
                            }
                        
                        if source_name not in all_fields[field_name]["sources"]:
                            all_fields[field_name]["sources"].append(source_name)
        
        # Ajouter champs de fusion si disponible
        if fusion_result and fusion_result.fused_data:
            for record in fusion_result.fused_data[:5]:
                for field_name in record.keys():
                    if field_name not in all_fields:
                        all_fields[field_name] = {
                            "sources": ["fusion"],
                            "type": self._infer_field_type([record[field_name]]),
                            "description": f"Champ généré par fusion: {field_name}"
                        }
        
        return {
            "unified_schema": all_fields,
            "total_unique_fields": len(all_fields),
            "cross_source_fields": {
                field: info for field, info in all_fields.items() 
                if len(info["sources"]) > 1
            },
            "fusion_specific_fields": {
                field: info for field, info in all_fields.items() 
                if "fusion" in info["sources"]
            }
        }
    
    def _generate_transformation_summary(self, processed_data: Dict[str, Any], fusion_result: Optional[Any] = None) -> Dict[str, Any]:
        """Génère un résumé global des transformations"""
        all_transformations = []
        
        for source_name, source_data in processed_data.items():
            metadata = source_data.get('metadata', {})
            transformations = metadata.get('transformations_applied', [])
            all_transformations.extend(transformations)
        
        return {
            "total_transformations": len(all_transformations),
            "unique_transformations": list(set(all_transformations)),
            "transformation_frequency": {
                trans: all_transformations.count(trans) 
                for trans in set(all_transformations)
            },
            "most_common_transformation": max(set(all_transformations), key=all_transformations.count) if all_transformations else None,
            "fusion_applied": fusion_result is not None
        }
    
    def _analyze_fusion_schema(self, fused_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyse le schéma des données fusionnées"""
        if not fused_data:
            return {}
        
        return self._analyze_fields(fused_data, "fusion")
    
    def _generate_lineage_documentation(self, fusion_result: Any) -> Dict[str, Any]:
        """Génère la documentation de lignage des données"""
        return {
            "fusion_strategy": fusion_result.fusion_metadata.get('fusion_strategy'),
            "primary_source": fusion_result.fusion_metadata.get('primary_source'),
            "secondary_sources": fusion_result.fusion_metadata.get('secondary_sources'),
            "field_origins": fusion_result.source_mapping,
            "transformation_chain": "acquisition → processing → fusion → output",
            "data_flow": {
                "input_records": fusion_result.fusion_metadata.get('records_before_fusion', 0),
                "output_records": fusion_result.records_merged,
                "merge_ratio": round(fusion_result.records_merged / fusion_result.fusion_metadata.get('records_before_fusion', 1), 2)
            }
        }
    
    def _document_fusion_rules(self, fusion_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Documente les règles de fusion appliquées"""
        return {
            "fusion_strategy": fusion_metadata.get('fusion_strategy'),
            "join_keys": fusion_metadata.get('join_keys_used', {}),
            "conflict_resolution": "primary_source_wins",  # À paramétrer
            "aggregation_methods": {
                "numeric_fields": "sum",
                "categorical_fields": "primary_source",
                "text_fields": "concatenate"
            },
            "merge_criteria": "geographic_proximity",
            "data_validation": "post_fusion_quality_check"
        }
    
    def _generate_field_documentation(self, field_analysis: List[Dict[str, Any]], source_name: str) -> Dict[str, Any]:
        """Génère la documentation détaillée des champs"""
        field_docs = {}
        
        for field in field_analysis:
            field_name = field['field_name']
            field_docs[field_name] = {
                "technical_name": field_name,
                "display_name": field_name.replace('_', ' ').title(),
                "description": field['description'],
                "data_type": field['inferred_type'],
                "required": field['null_percentage'] < 5,  # Considéré requis si < 5% de nulls
                "validation_rules": self._generate_validation_rules(field),
                "sample_values": field['sample_values'],
                "data_quality": {
                    "completeness": 100 - field['null_percentage'],
                    "uniqueness": field['unique_values_count'] / field['total_values'] * 100 if field['total_values'] > 0 else 0
                },
                "source_system": source_name
            }
        
        return field_docs
    
    def _generate_validation_rules(self, field: Dict[str, Any]) -> List[str]:
        """Génère les règles de validation pour un champ"""
        rules = []
        
        field_name = field['field_name'].lower()
        field_type = field['inferred_type']
        
        # Règles basées sur le nom
        if 'email' in field_name:
            rules.append("Format email valide")
        elif 'phone' in field_name or 'telephone' in field_name:
            rules.append("Format téléphone français")
        elif 'arrondissement' in field_name:
            rules.append("Code arrondissement parisien (75001-75020)")
        elif 'montant' in field_name or 'budget' in field_name:
            rules.append("Montant positif en euros")
        elif 'pourcentage' in field_name:
            rules.append("Valeur entre 0 et 100")
        
        # Règles basées sur le type
        if field_type == "numeric":
            rules.append("Valeur numérique")
        elif field_type == "date":
            rules.append("Format date ISO (YYYY-MM-DD)")
        
        # Règle de nullité
        if field['null_percentage'] < 5:
            rules.append("Champ obligatoire")
        
        return rules if rules else ["Aucune validation spécifique"]


# Instance globale
auto_doc_generator = AutoDocumentationGenerator() 