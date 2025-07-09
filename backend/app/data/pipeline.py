"""
Pipeline principal de données pour AgoraFlux
Orchestre l'acquisition, traitement et injection des données publiques
"""

import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from loguru import logger

from .sources import data_source_manager, get_mock_budget_data, get_mock_participation_data
from .processor import data_processor
from .fusion import data_fusion
from .documentation import auto_doc_generator
from ..core.database import get_db
from ..models.dataset import Dataset, DatasetType, DatasetStatus
from ..models.project import Project


class DataPipeline:
    """Pipeline principal pour le traitement des données publiques"""
    
    def __init__(self):
        self.source_manager = data_source_manager
        self.processor = data_processor
        self.fusion_engine = data_fusion
        self.doc_generator = auto_doc_generator
        self.last_run = None
        self.is_running = False
    
    async def run_full_pipeline(self, use_mock_data: bool = False) -> Dict[str, Any]:
        """
        Execute le pipeline complet : acquisition → traitement → fusion → documentation → injection
        """
        if self.is_running:
            return {"error": "Pipeline déjà en cours d'exécution"}
        
        self.is_running = True
        start_time = datetime.now()
        
        try:
            logger.info("🚀 Démarrage du pipeline de données AgoraFlux")
            
            # Étape 1: Acquisition des données
            if use_mock_data:
                raw_data = self._get_mock_data()
                logger.info("📊 Utilisation des données de test")
            else:
                raw_data = await self._acquire_data()
            
            # Étape 2: Traitement des données
            processed_data = await self._process_data(raw_data)
            
            # Étape 3: Fusion des données (overlay)
            fusion_result = await self._fuse_data(processed_data)
            
            # Étape 4: Génération documentation automatique
            documentation = await self._generate_documentation(processed_data, fusion_result)
            
            # Étape 5: Injection en base de données
            injection_results = await self._inject_data(processed_data, fusion_result, documentation)
            
            # Étape 6: Rapport final
            duration = (datetime.now() - start_time).total_seconds()
            
            results = {
                "pipeline_id": f"run_{int(start_time.timestamp())}",
                "started_at": start_time.isoformat(),
                "duration_seconds": round(duration, 2),
                "status": "completed",
                "data_sources": len(raw_data),
                "raw_records": sum(len(data.get('data', [])) for data in raw_data.values()),
                "processed_records": sum(result.get('processed_rows', 0) for result in processed_data.values()),
                "fused_records": fusion_result.records_merged if fusion_result else 0,
                "injected_records": sum(result.get('records_inserted', 0) for result in injection_results.values()),
                "quality_scores": {
                    source: result.get('quality_metrics', {}).get('overall_score', 0)
                    for source, result in processed_data.items()
                },
                "fusion_quality": fusion_result.quality_metrics if fusion_result else {},
                "documentation_generated": documentation is not None,
                "details": {
                    "acquisition": self._summarize_acquisition(raw_data),
                    "processing": self._summarize_processing(processed_data),
                    "fusion": self._summarize_fusion(fusion_result),
                    "documentation": self._summarize_documentation(documentation),
                    "injection": injection_results
                }
            }
            
            self.last_run = results
            logger.info(f"✅ Pipeline terminé en {duration:.2f}s - {results['injected_records']} enregistrements injectés")
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Erreur dans le pipeline: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "started_at": start_time.isoformat(),
                "duration_seconds": (datetime.now() - start_time).total_seconds()
            }
        finally:
            self.is_running = False
    
    async def _acquire_data(self) -> Dict[str, Any]:
        """Acquisition des données depuis les sources externes"""
        logger.info("📡 Acquisition des données externes...")
        
        try:
            # Récupération parallèle de toutes les sources
            raw_data = await self.source_manager.fetch_all_sources()
            
            # Log des résultats
            for source, data in raw_data.items():
                if 'error' in data:
                    logger.warning(f"⚠️ Erreur source {source}: {data['error']}")
                else:
                    rows = len(data.get('data', []))
                    logger.info(f"✅ Source {source}: {rows} lignes récupérées")
            
            return raw_data
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'acquisition: {str(e)}")
            # Fallback vers données de test en cas d'erreur
            logger.info("🔄 Basculement vers les données de test...")
            return self._get_mock_data()
    
    def _get_mock_data(self) -> Dict[str, Any]:
        """Retourne des données de test réalistes"""
        return {
            'paris_budget': {
                'source': 'Mock Budget Data',
                'format': 'python',
                'data': get_mock_budget_data(),
                'retrieved_at': datetime.now().isoformat()
            },
            'paris_participation': {
                'source': 'Mock Participation Data',
                'format': 'python',
                'data': get_mock_participation_data(),
                'retrieved_at': datetime.now().isoformat()
            }
        }
    
    async def _process_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Traitement et validation des données brutes"""
        logger.info("⚙️ Traitement des données...")
        
        processed_results = {}
        
        for source_key, raw_source_data in raw_data.items():
            if 'error' in raw_source_data:
                logger.warning(f"⚠️ Ignore source {source_key} avec erreur")
                continue
            
            # Détermine le type de données basé sur la source
            data_type = self._get_data_type_from_source(source_key)
            
            try:
                # Traitement asynchrone
                processed = await self.processor.process_data(raw_source_data, data_type)
                processed_results[source_key] = processed
                
                # Log du résultat
                quality = processed.get('quality_metrics', {})
                logger.info(f"✅ {source_key} traité: {processed.get('processed_rows', 0)} lignes, qualité {quality.get('overall_score', 0):.1f}%")
                
            except Exception as e:
                logger.error(f"❌ Erreur traitement {source_key}: {str(e)}")
                processed_results[source_key] = {"error": str(e)}
        
        return processed_results
    
    async def _fuse_data(self, processed_data: Dict[str, Any]) -> Optional[Any]:
        """Fusion des données selon les stratégies configurées"""
        logger.info("🔗 Début fusion des données...")
        
        try:
            # Vérifier s'il y a assez de sources pour fusion
            valid_sources = {k: v for k, v in processed_data.items() 
                           if 'data' in v and v['data'] and not 'error' in v}
            
            if len(valid_sources) < 2:
                logger.warning("⚠️ Fusion ignorée: moins de 2 sources valides")
                return None
            
            # Fusion géographique par défaut (engagement civique)
            fusion_result = await self.fusion_engine.fuse_sources(
                processed_data, 
                fusion_type='civic_engagement'
            )
            
            logger.info(f"✅ Fusion terminée: {fusion_result.records_merged} enregistrements fusionnés")
            return fusion_result
            
        except Exception as e:
            logger.error(f"❌ Erreur fusion: {str(e)}")
            return None
    
    async def _generate_documentation(self, processed_data: Dict[str, Any], fusion_result: Optional[Any] = None) -> Optional[Dict[str, Any]]:
        """Génération automatique de documentation"""
        logger.info("📖 Génération documentation automatique...")
        
        try:
            documentation = await self.doc_generator.generate_comprehensive_documentation(
                processed_data, 
                fusion_result
            )
            
            logger.info("✅ Documentation générée avec succès")
            return documentation
            
        except Exception as e:
            logger.error(f"❌ Erreur génération documentation: {str(e)}")
            return None

    async def _inject_data(self, processed_data: Dict[str, Any], fusion_result: Optional[Any] = None, documentation: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Injection des données traitées, fusionnées et documentées en base"""
        logger.info("💾 Injection des données en base...")
        
        injection_results = {}
        
        # Obtenir une session de base de données
        db_gen = get_db()
        db = next(db_gen)
        
        try:
            # Injection des sources individuelles
            for source_key, processed_source in processed_data.items():
                if 'error' in processed_source:
                    logger.warning(f"⚠️ Ignore injection {source_key} avec erreur")
                    continue
                
                try:
                    result = await self._inject_source_data(db, source_key, processed_source, documentation)
                    injection_results[source_key] = result
                    
                except Exception as e:
                    logger.error(f"❌ Erreur injection {source_key}: {str(e)}")
                    injection_results[source_key] = {"error": str(e)}
            
            # Injection des données fusionnées si disponibles
            if fusion_result and fusion_result.fused_data:
                try:
                    fusion_injection = await self._inject_fusion_data(db, fusion_result, documentation)
                    injection_results['fusion'] = fusion_injection
                except Exception as e:
                    logger.error(f"❌ Erreur injection fusion: {str(e)}")
                    injection_results['fusion'] = {"error": str(e)}
            
            # Commit des changements
            db.commit()
            logger.info("✅ Toutes les injections commitées")
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Rollback des injections: {str(e)}")
            raise
        finally:
            db.close()
        
        return injection_results

    async def _inject_source_data(self, db: Session, source_key: str, processed_data: Dict[str, Any], documentation: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Injection d'une source spécifique"""
        data_type = processed_data.get('data_type', 'unknown')
        records = processed_data.get('data', [])
        
        if not records:
            return {"records_inserted": 0, "message": "Aucune donnée à injecter"}
        
        # Crée ou récupère un projet pour cette source
        project = self._get_or_create_project(db, source_key, data_type)
        
        # Crée ou met à jour le dataset
        dataset = self._get_or_create_dataset(db, source_key, data_type, project.id, processed_data)
        
        # Pour l'instant, on stocke les données dans le champ JSON du dataset
        # Dans une version future, on créerait des tables spécialisées
        
        # Met à jour les statistiques
        dataset.rows_count = len(records)
        dataset.status = DatasetStatus.PROCESSED
        
        # Calcul des scores de qualité
        quality = processed_data.get('quality_metrics', {})
        
        # Convertit l'enum DataQuality en string pour la sérialisation JSON
        quality_serializable = dict(quality)
        if 'quality_level' in quality_serializable:
            if hasattr(quality_serializable['quality_level'], 'value'):
                quality_serializable['quality_level'] = quality_serializable['quality_level'].value
        
        dataset.processing_config = {
            "data": records[:100],  # Limite pour éviter surcharge
            "sample_data": records[:5],
            "total_records": len(records),
            "last_processed": datetime.now().isoformat(),
            "quality_metrics": quality_serializable,  # Version sérialisable
            "metadata": processed_data.get('metadata', {})
        }
        
        dataset.completeness_score = quality.get('completeness', 0)
        dataset.consistency_score = quality.get('consistency', 0)
        dataset.validity_score = quality.get('validity', 0)
        dataset.overall_quality_score = quality.get('overall_score', 0)
        
        db.add(dataset)
        
        return {
            "records_inserted": len(records),
            "dataset_id": dataset.id,
            "project_id": project.id,
            "quality_score": quality.get('overall_score', 0),
            "message": f"Dataset {dataset.name} mis à jour avec {len(records)} enregistrements"
        }

    async def _inject_fusion_data(self, db: Session, fusion_result: Any, documentation: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Injection spécifique des données fusionnées"""
        logger.info("💾 Injection données fusionnées...")
        
        # Créer un projet dédié pour les données fusionnées
        fusion_project = self._get_or_create_project(db, "fusion", "civic_engagement_fused")
        
        # Créer dataset pour données fusionnées
        fusion_dataset = self._get_or_create_dataset(db, "fusion", "civic_engagement_fused", fusion_project.id, {
            'data': fusion_result.fused_data,
            'quality_metrics': fusion_result.quality_metrics,
            'metadata': fusion_result.fusion_metadata
        })
        
        # Enrichir avec métadonnées de fusion
        fusion_dataset.processing_config = {
            "fusion_data": fusion_result.fused_data[:100],  # Limite
            "fusion_metadata": fusion_result.fusion_metadata,
            "fusion_quality": fusion_result.quality_metrics,
            "source_mapping": fusion_result.source_mapping,
            "records_merged": fusion_result.records_merged,
            "conflicts_resolved": fusion_result.conflicts_resolved,
            "documentation": documentation.get('fusion_documentation', {}) if documentation else {}
        }
        
        # Statistiques de fusion
        fusion_dataset.rows_count = fusion_result.records_merged
        fusion_dataset.completeness_score = fusion_result.quality_metrics.get('data_completeness', 0)
        fusion_dataset.overall_quality_score = fusion_result.quality_metrics.get('fusion_coverage', 0)
        
        db.add(fusion_dataset)
        
        return {
            "records_inserted": fusion_result.records_merged,
            "dataset_id": fusion_dataset.id,
            "project_id": fusion_project.id,
            "fusion_quality": fusion_result.quality_metrics,
            "message": f"Données fusionnées injectées: {fusion_result.records_merged} enregistrements"
        }

    def _get_or_create_project(self, db: Session, source_key: str, data_type: str) -> Project:
        """Crée ou récupère le projet pour cette source"""
        project_title = f"Données {data_type.title()} - {source_key}"
        
        # Cherche un projet existant
        project = db.query(Project).filter(
            Project.title == project_title
        ).first()
        
        if not project:
            # Crée un nouveau projet
            project = Project(
                title=project_title,
                slug=f"data-{data_type}-{source_key}".lower().replace('_', '-'),
                description=f"Projet automatique pour les données {data_type} de la source {source_key}",
                                 owner_id=9,  # Utilisateur admin par défaut
                tags=f"{data_type}, données publiques, pipeline automatique",
                objectives=f"Centraliser et traiter les données {data_type} pour AgoraFlux",
                allow_comments=True,
                allow_contributions=False,
                moderation_enabled=False
            )
            db.add(project)
            db.flush()  # Pour obtenir l'ID
        
        return project
    
    def _get_or_create_dataset(self, db: Session, source_key: str, data_type: str, project_id: int, processed_data: Dict[str, Any]) -> Dataset:
        """Crée ou récupère le dataset pour cette source"""
        dataset_name = f"Dataset {data_type} - {source_key}"
        
        # Cherche un dataset existant
        dataset = db.query(Dataset).filter(
            Dataset.name == dataset_name,
            Dataset.project_id == project_id
        ).first()
        
        if not dataset:
            # Crée un nouveau dataset
            dataset = Dataset(
                name=dataset_name,
                slug=f"dataset-{data_type}-{source_key}".lower().replace('_', '-'),
                description=f"Dataset automatique pour {data_type} depuis {source_key}",
                type=DatasetType.JSON,  # Stockage JSON pour flexibilité
                status=DatasetStatus.PROCESSING,
                project_id=project_id,
                                 uploaded_by_id=9  # Utilisateur admin par défaut
            )
            db.add(dataset)
            db.flush()  # Pour obtenir l'ID
        
        return dataset
    
    def _get_data_type_from_source(self, source_key: str) -> str:
        """Détermine le type de données basé sur la clé de source"""
        if 'budget' in source_key.lower():
            return 'budget'
        elif 'participation' in source_key.lower():
            return 'participation'
        elif 'transport' in source_key.lower():
            return 'transport'
        else:
            return 'general'
    
    def _summarize_acquisition(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Résumé de l'étape d'acquisition"""
        summary = {}
        for source, data in raw_data.items():
            if 'error' in data:
                summary[source] = {"status": "error", "error": data['error']}
            else:
                summary[source] = {
                    "status": "success",
                    "rows": len(data.get('data', [])),
                    "format": data.get('format', 'unknown')
                }
        return summary
    
    def _summarize_processing(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Résumé de l'étape de traitement"""
        summary = {}
        for source, data in processed_data.items():
            if 'error' in data:
                summary[source] = {"status": "error", "error": data['error']}
            else:
                quality = data.get('quality_metrics', {})
                summary[source] = {
                    "status": "success",
                    "rows_processed": data.get('processed_rows', 0),
                    "quality_score": quality.get('overall_score', 0),
                    "quality_level": quality.get('quality_level', 'unknown')
                }
        return summary
    
    def _summarize_fusion(self, fusion_result: Optional[Any]) -> Dict[str, Any]:
        """Résumé de l'étape de fusion"""
        if not fusion_result:
            return {"status": "skipped", "reason": "Insufficient sources or error"}
        
        return {
            "status": "completed",
            "records_merged": fusion_result.records_merged,
            "fusion_strategy": fusion_result.fusion_metadata.get('fusion_strategy'),
            "sources_involved": fusion_result.fusion_metadata.get('sources_used', []),
            "quality_metrics": fusion_result.quality_metrics,
            "conflicts_resolved": fusion_result.conflicts_resolved
        }
    
    def _summarize_documentation(self, documentation: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Résumé de l'étape de documentation"""
        if not documentation:
            return {"status": "failed", "reason": "Documentation generation error"}
        
        return {
            "status": "completed",
            "sources_documented": len(documentation.get('source_documentation', {})),
            "fusion_documented": 'fusion_documentation' in documentation,
            "total_fields_documented": len(documentation.get('global_schema', {}).get('unified_schema', {})),
            "transformations_documented": len(documentation.get('transformation_summary', {}).get('unique_transformations', []))
        }
    
    async def get_pipeline_status(self) -> Dict[str, Any]:
        """Retourne le statut actuel du pipeline"""
        return {
            "is_running": self.is_running,
            "last_run": self.last_run,
            "sources_configured": len(self.source_manager.list_sources()),
            "source_list": [
                {
                    "key": key,
                    "name": source.name,
                    "description": source.description,
                    "update_frequency": source.update_frequency
                }
                for key, source in self.source_manager.list_sources().items()
            ]
        }
    
    async def run_partial_pipeline(self, source_keys: List[str], use_mock_data: bool = False) -> Dict[str, Any]:
        """Execute le pipeline pour des sources spécifiques seulement"""
        if self.is_running:
            return {"error": "Pipeline déjà en cours d'exécution"}
        
        # Filtre les sources disponibles
        available_sources = self.source_manager.list_sources()
        filtered_sources = {k: v for k, v in available_sources.items() if k in source_keys}
        
        if not filtered_sources:
            return {"error": f"Aucune source valide dans: {source_keys}"}
        
        logger.info(f"🎯 Pipeline partiel pour sources: {list(filtered_sources.keys())}")
        
        # Temporairement remplace les sources du manager
        original_sources = self.source_manager.sources
        self.source_manager.sources = filtered_sources
        
        try:
            result = await self.run_full_pipeline(use_mock_data)
            return result
        finally:
            # Restaure les sources originales
            self.source_manager.sources = original_sources


# Instance globale
pipeline = DataPipeline() 