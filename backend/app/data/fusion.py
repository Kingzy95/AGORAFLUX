"""
Module de fusion/overlay de données pour AgoraFlux
Combine plusieurs sources de données dans une structure logique unifiée
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import pandas as pd
from loguru import logger
from dataclasses import dataclass
from enum import Enum
import re


class FusionStrategy(Enum):
    """Stratégies de fusion disponibles"""
    GEOGRAPHIC = "geographic"  # Fusion par arrondissement/zone géographique
    TEMPORAL = "temporal"      # Fusion par période temporelle
    THEMATIC = "thematic"      # Fusion par secteur/thème
    HYBRID = "hybrid"          # Combinaison de plusieurs stratégies


@dataclass
class FusionConfig:
    """Configuration pour la fusion de données"""
    strategy: FusionStrategy
    primary_source: str
    secondary_sources: List[str]
    join_keys: Dict[str, str]  # mapping source -> clé de jointure
    aggregation_rules: Dict[str, str] = None
    conflict_resolution: str = "primary_wins"  # primary_wins, merge, average


@dataclass
class FusionResult:
    """Résultat d'une opération de fusion"""
    fused_data: List[Dict[str, Any]]
    fusion_metadata: Dict[str, Any]
    quality_metrics: Dict[str, float]
    source_mapping: Dict[str, List[str]]  # mapping field -> sources d'origine
    conflicts_resolved: int
    records_merged: int


class DataFusion:
    """Gestionnaire principal pour la fusion de données publiques"""
    
    def __init__(self):
        self.fusion_configs = {
            'civic_engagement': FusionConfig(
                strategy=FusionStrategy.GEOGRAPHIC,
                primary_source='paris_participation',
                secondary_sources=['paris_budget'],
                join_keys={
                    'paris_participation': 'arrondissement',
                    'paris_budget': 'arrondissement'  # À dériver du secteur
                }
            ),
            'urban_overview': FusionConfig(
                strategy=FusionStrategy.HYBRID,
                primary_source='paris_budget',
                secondary_sources=['paris_participation', 'transport_national'],
                join_keys={
                    'paris_budget': 'secteur',
                    'paris_participation': 'arrondissement',
                    'transport_national': 'region'
                }
            )
        }
    
    async def fuse_sources(self, 
                          processed_data: Dict[str, Any], 
                          fusion_type: str = 'civic_engagement') -> FusionResult:
        """
        Fusionne plusieurs sources de données selon la configuration spécifiée
        """
        logger.info(f"🔄 Début fusion {fusion_type} avec {len(processed_data)} sources")
        
        if fusion_type not in self.fusion_configs:
            raise ValueError(f"Configuration fusion inconnue: {fusion_type}")
        
        config = self.fusion_configs[fusion_type]
        
        # Étape 1: Validation des sources disponibles
        available_sources = self._validate_sources(processed_data, config)
        if not available_sources:
            logger.warning("⚠️ Aucune source valide pour la fusion")
            return self._empty_fusion_result()
        
        # Étape 2: Préparation des données pour fusion
        prepared_data = self._prepare_data_for_fusion(available_sources, config)
        
        # Étape 3: Exécution de la fusion selon la stratégie
        if config.strategy == FusionStrategy.GEOGRAPHIC:
            fused_data = await self._fuse_geographic(prepared_data, config)
        elif config.strategy == FusionStrategy.TEMPORAL:
            fused_data = await self._fuse_temporal(prepared_data, config)
        elif config.strategy == FusionStrategy.THEMATIC:
            fused_data = await self._fuse_thematic(prepared_data, config)
        elif config.strategy == FusionStrategy.HYBRID:
            fused_data = await self._fuse_hybrid(prepared_data, config)
        else:
            raise ValueError(f"Stratégie fusion non implémentée: {config.strategy}")
        
        # Étape 4: Calcul des métriques de fusion
        fusion_metrics = self._calculate_fusion_metrics(fused_data, available_sources)
        
        # Étape 5: Génération des métadonnées
        fusion_metadata = self._generate_fusion_metadata(config, available_sources, fused_data)
        
        result = FusionResult(
            fused_data=fused_data,
            fusion_metadata=fusion_metadata,
            quality_metrics=fusion_metrics,
            source_mapping=self._build_source_mapping(fused_data),
            conflicts_resolved=fusion_metadata.get('conflicts_resolved', 0),
            records_merged=len(fused_data)
        )
        
        logger.info(f"✅ Fusion {fusion_type} terminée: {len(fused_data)} enregistrements fusionnés")
        return result
    
    def _validate_sources(self, processed_data: Dict[str, Any], config: FusionConfig) -> Dict[str, Any]:
        """Valide et filtre les sources disponibles pour la fusion"""
        available = {}
        
        # Vérifier source primaire
        if config.primary_source in processed_data:
            primary_data = processed_data[config.primary_source]
            if 'data' in primary_data and primary_data['data']:
                available[config.primary_source] = primary_data
                logger.info(f"✅ Source primaire {config.primary_source}: {len(primary_data['data'])} records")
        
        # Vérifier sources secondaires
        for source in config.secondary_sources:
            if source in processed_data:
                secondary_data = processed_data[source]
                if 'data' in secondary_data and secondary_data['data']:
                    available[source] = secondary_data
                    logger.info(f"✅ Source secondaire {source}: {len(secondary_data['data'])} records")
        
        return available
    
    def _prepare_data_for_fusion(self, sources: Dict[str, Any], config: FusionConfig) -> Dict[str, pd.DataFrame]:
        """Prépare les données pour la fusion en DataFrames normalisés"""
        prepared = {}
        
        for source_name, source_data in sources.items():
            try:
                # Conversion en DataFrame
                df = pd.DataFrame(source_data['data'])
                
                # Normalisation des colonnes selon la source
                if source_name == 'paris_participation':
                    df = self._normalize_participation_data(df)
                elif source_name == 'paris_budget':
                    df = self._normalize_budget_data(df)
                elif source_name == 'transport_national':
                    df = self._normalize_transport_data(df)
                
                # Ajout métadonnées source
                df['_source'] = source_name
                df['_source_quality'] = source_data.get('quality_metrics', {}).get('overall_score', 0)
                
                prepared[source_name] = df
                logger.info(f"✅ {source_name} préparé: {len(df)} lignes, {len(df.columns)} colonnes")
                
            except Exception as e:
                logger.error(f"❌ Erreur préparation {source_name}: {e}")
                continue
        
        return prepared
    
    def _normalize_participation_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalise les données de participation citoyenne"""
        normalized = df.copy()
        
        # Standardisation des noms de colonnes
        column_mapping = {
            'arrondissement': 'zone_geo',
            'participants': 'participation_count',
            'projets_actifs': 'active_projects',
            'satisfaction': 'satisfaction_score'
        }
        
        for old_col, new_col in column_mapping.items():
            if old_col in normalized.columns:
                normalized[new_col] = normalized[old_col]
        
        # Extraction du code arrondissement (75001 -> 1)
        if 'zone_geo' in normalized.columns:
            normalized['arrondissement_code'] = normalized['zone_geo'].astype(str).str.extract(r'75(\d+)').astype(int)
        
        # Catégorisation de la participation
        if 'participation_count' in normalized.columns:
            normalized['participation_level'] = pd.cut(
                normalized['participation_count'],
                bins=[0, 100, 500, 1000, float('inf')],
                labels=['Faible', 'Modérée', 'Élevée', 'Très élevée']
            )
        
        return normalized
    
    def _normalize_budget_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalise les données budgétaires"""
        normalized = df.copy()
        
        # Standardisation des colonnes
        column_mapping = {
            'secteur': 'sector',
            'montant': 'amount',
            'pourcentage': 'percentage'
        }
        
        for old_col, new_col in column_mapping.items():
            if old_col in normalized.columns:
                normalized[new_col] = normalized[old_col]
        
        # Mapping secteur -> arrondissement approximatif (pour demo)
        sector_to_district = {
            'Éducation': [1, 5, 6, 7],
            'Transport': [1, 2, 8, 9],
            'Logement': [10, 11, 18, 19, 20],
            'Santé': [3, 4, 12, 13],
            'Environnement': [14, 15, 16, 17],
            'Culture et Sports': [1, 4, 5, 6, 7, 8]
        }
        
        # Expansion des données budgétaires par arrondissement
        expanded_rows = []
        for _, row in normalized.iterrows():
            sector = row.get('sector', '')
            if sector in sector_to_district:
                amount_per_district = row.get('amount', 0) / len(sector_to_district[sector])
                for district in sector_to_district[sector]:
                    new_row = row.copy()
                    new_row['arrondissement_code'] = district
                    new_row['zone_geo'] = f"750{district:02d}"
                    new_row['amount_per_district'] = amount_per_district
                    expanded_rows.append(new_row)
        
        if expanded_rows:
            normalized = pd.DataFrame(expanded_rows)
        
        return normalized
    
    def _normalize_transport_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalise les données de transport"""
        # Pour l'instant, données basiques - à adapter selon la structure réelle
        normalized = df.copy()
        
        # Ajout zone géographique par défaut (Paris global)
        normalized['zone_geo'] = 'PARIS'
        normalized['arrondissement_code'] = 0  # Code global
        
        return normalized
    
    async def _fuse_geographic(self, prepared_data: Dict[str, pd.DataFrame], config: FusionConfig) -> List[Dict[str, Any]]:
        """Fusion par zone géographique (arrondissement)"""
        logger.info("🗺️ Fusion géographique par arrondissement")
        
        primary_df = prepared_data[config.primary_source]
        fused_records = []
        
        # Grouper par arrondissement
        for arrondissement in primary_df['arrondissement_code'].unique():
            if pd.isna(arrondissement):
                continue
            
            # Données primaires pour cet arrondissement
            primary_records = primary_df[primary_df['arrondissement_code'] == arrondissement]
            
            for _, primary_record in primary_records.iterrows():
                fused_record = primary_record.to_dict()
                
                # Fusionner avec les sources secondaires
                for secondary_source in config.secondary_sources:
                    if secondary_source in prepared_data:
                        secondary_df = prepared_data[secondary_source]
                        secondary_records = secondary_df[secondary_df['arrondissement_code'] == arrondissement]
                        
                        if not secondary_records.empty:
                            # Agrégation des données secondaires
                            for _, sec_record in secondary_records.iterrows():
                                for key, value in sec_record.to_dict().items():
                                    if key not in fused_record and not key.startswith('_'):
                                        fused_record[f"{secondary_source}_{key}"] = value
                
                # Métadonnées de fusion
                fused_record['_fusion_type'] = 'geographic'
                fused_record['_fusion_key'] = f"arrondissement_{int(arrondissement)}"
                fused_record['_fused_at'] = datetime.now().isoformat()
                
                fused_records.append(fused_record)
        
        return fused_records
    
    async def _fuse_temporal(self, prepared_data: Dict[str, pd.DataFrame], config: FusionConfig) -> List[Dict[str, Any]]:
        """Fusion par période temporelle"""
        logger.info("📅 Fusion temporelle")
        # À implémenter selon les besoins temporels spécifiques
        return []
    
    async def _fuse_thematic(self, prepared_data: Dict[str, pd.DataFrame], config: FusionConfig) -> List[Dict[str, Any]]:
        """Fusion par secteur/thème"""
        logger.info("🎯 Fusion thématique")
        # À implémenter pour fusion par secteurs
        return []
    
    async def _fuse_hybrid(self, prepared_data: Dict[str, pd.DataFrame], config: FusionConfig) -> List[Dict[str, Any]]:
        """Fusion hybride combinant plusieurs stratégies"""
        logger.info("🔄 Fusion hybride")
        
        # Pour l'instant, utilise la fusion géographique comme base
        geographic_result = await self._fuse_geographic(prepared_data, config)
        
        # TODO: Ajouter couches thématiques et temporelles
        
        return geographic_result
    
    def _calculate_fusion_metrics(self, fused_data: List[Dict[str, Any]], sources: Dict[str, Any]) -> Dict[str, float]:
        """Calcule les métriques de qualité de la fusion"""
        if not fused_data:
            return {"fusion_coverage": 0.0, "data_completeness": 0.0, "source_diversity": 0.0}
        
        total_records = sum(len(source_data['data']) for source_data in sources.values())
        fused_records = len(fused_data)
        
        # Couverture de fusion
        fusion_coverage = (fused_records / total_records * 100) if total_records > 0 else 0
        
        # Complétude des données fusionnées
        total_fields = sum(len(record) for record in fused_data)
        filled_fields = sum(1 for record in fused_data for value in record.values() if value is not None and value != '')
        data_completeness = (filled_fields / total_fields * 100) if total_fields > 0 else 0
        
        # Diversité des sources
        unique_sources = set()
        for record in fused_data:
            for key in record.keys():
                if '_' in key and not key.startswith('_'):
                    source = key.split('_')[0]
                    unique_sources.add(source)
        source_diversity = len(unique_sources) / len(sources) * 100 if sources else 0
        
        return {
            "fusion_coverage": round(fusion_coverage, 2),
            "data_completeness": round(data_completeness, 2),
            "source_diversity": round(source_diversity, 2)
        }
    
    def _generate_fusion_metadata(self, config: FusionConfig, sources: Dict[str, Any], fused_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Génère les métadonnées de la fusion"""
        return {
            "fusion_strategy": config.strategy.value,
            "primary_source": config.primary_source,
            "secondary_sources": config.secondary_sources,
            "sources_used": list(sources.keys()),
            "total_sources": len(sources),
            "records_before_fusion": sum(len(source['data']) for source in sources.values()),
            "records_after_fusion": len(fused_data),
            "fusion_timestamp": datetime.now().isoformat(),
            "conflicts_resolved": 0,  # À implémenter
            "join_keys_used": config.join_keys
        }
    
    def _build_source_mapping(self, fused_data: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Construit le mapping champ -> sources d'origine"""
        mapping = {}
        
        for record in fused_data:
            for field_name in record.keys():
                if not field_name.startswith('_'):
                    if '_' in field_name and not field_name.startswith('_'):
                        source = field_name.split('_')[0]
                        if field_name not in mapping:
                            mapping[field_name] = []
                        if source not in mapping[field_name]:
                            mapping[field_name].append(source)
                    else:
                        # Champ principal
                        if field_name not in mapping:
                            mapping[field_name] = ['primary']
        
        return mapping
    
    def _empty_fusion_result(self) -> FusionResult:
        """Retourne un résultat de fusion vide"""
        return FusionResult(
            fused_data=[],
            fusion_metadata={"error": "No valid sources for fusion"},
            quality_metrics={"fusion_coverage": 0.0, "data_completeness": 0.0, "source_diversity": 0.0},
            source_mapping={},
            conflicts_resolved=0,
            records_merged=0
        )


# Instance globale
data_fusion = DataFusion() 