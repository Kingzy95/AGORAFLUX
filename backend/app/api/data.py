"""
API endpoints pour le pipeline de données AgoraFlux
Gestion de l'acquisition, traitement, fusion et documentation des données publiques
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from ..models.user import User
from ..api.dependencies import require_admin
from ..data.pipeline import pipeline
from ..data.fusion import data_fusion
from ..data.documentation import auto_doc_generator


router = APIRouter(prefix="/data", tags=["Data Pipeline"])


class PipelineRunRequest(BaseModel):
    use_mock_data: bool = True
    source_keys: Optional[List[str]] = None


class FusionTestRequest(BaseModel):
    use_mock_data: bool = True
    fusion_type: str = "civic_engagement"


@router.get("/status")
async def get_pipeline_status():
    """
    Récupère le statut actuel du pipeline de données
    """
    try:
        status = await pipeline.get_pipeline_status()
        return status
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération du statut: {str(e)}"
        )


@router.get("/sources")
async def list_data_sources():
    """
    Liste toutes les sources de données configurées
    """
    try:
        sources = pipeline.source_manager.list_sources()
        return {
            "sources": [
                {
                    "key": key,
                    "name": source.name,
                    "url": source.url,
                    "format": source.format,
                    "description": source.description,
                    "update_frequency": source.update_frequency
                }
                for key, source in sources.items()
            ],
            "total_sources": len(sources)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des sources: {str(e)}"
        )


@router.post("/run")
async def run_pipeline(
    request: PipelineRunRequest,
    background_tasks: BackgroundTasks,
    admin_user: User = Depends(require_admin)
):
    """
    Lance le pipeline de données complet (admin seulement)
    Execution en arrière-plan pour éviter timeout
    """
    if pipeline.is_running:
        raise HTTPException(
            status_code=409,
            detail="Pipeline déjà en cours d'exécution"
        )
    
    # Lance en arrière-plan
    if request.source_keys:
        background_tasks.add_task(
            _run_partial_pipeline,
            request.source_keys,
            request.use_mock_data
        )
        message = f"Pipeline partiel lancé pour sources: {request.source_keys}"
    else:
        background_tasks.add_task(
            _run_full_pipeline,
            request.use_mock_data
        )
        message = "Pipeline complet lancé en arrière-plan"
    
    return JSONResponse(
        status_code=202,
        content={
            "message": message,
            "use_mock_data": request.use_mock_data,
            "requested_by": admin_user.email,
            "started_at": pipeline.last_run.get('started_at') if pipeline.last_run else None
        }
    )


@router.post("/run-sync")
async def run_pipeline_sync(
    request: PipelineRunRequest,
    admin_user: User = Depends(require_admin)
):
    """
    Lance le pipeline de données de manière synchrone (admin seulement)
    Attention: peut prendre du temps
    """
    if pipeline.is_running:
        raise HTTPException(
            status_code=409,
            detail="Pipeline déjà en cours d'exécution"
        )
    
    try:
        if request.source_keys:
            result = await pipeline.run_partial_pipeline(
                request.source_keys,
                request.use_mock_data
            )
        else:
            result = await pipeline.run_full_pipeline(request.use_mock_data)
        
        return {
            "message": "Pipeline executé avec succès",
            "requested_by": admin_user.email,
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'exécution du pipeline: {str(e)}"
        )


@router.post("/test-fusion")
async def test_fusion(
    request: FusionTestRequest,
    admin_user: User = Depends(require_admin)
):
    """
    Test spécifique de la fusion de données (admin seulement)
    """
    try:
        # Simuler des données traitées pour le test
        from ..data.sources import get_mock_budget_data, get_mock_participation_data
        from ..data.processor import data_processor
        
        # Préparer des données de test
        mock_processed_data = {}
        
        # Données de participation
        if request.use_mock_data:
            participation_raw = {
                'source': 'Mock Participation Data',
                'data': get_mock_participation_data(),
                'retrieved_at': '2024-01-01T00:00:00'
            }
            participation_processed = await data_processor.process_data(participation_raw, 'participation')
            mock_processed_data['paris_participation'] = participation_processed
            
            # Données de budget
            budget_raw = {
                'source': 'Mock Budget Data', 
                'data': get_mock_budget_data(),
                'retrieved_at': '2024-01-01T00:00:00'
            }
            budget_processed = await data_processor.process_data(budget_raw, 'budget')
            mock_processed_data['paris_budget'] = budget_processed
        
        # Test de fusion
        fusion_result = await data_fusion.fuse_sources(
            mock_processed_data,
            fusion_type=request.fusion_type
        )
        
        return {
            "message": "Test de fusion réussi",
            "fusion_type": request.fusion_type,
            "sources_used": list(mock_processed_data.keys()),
            "records_merged": fusion_result.records_merged,
            "fusion_quality": fusion_result.quality_metrics,
            "sample_fused_data": fusion_result.fused_data[:3] if fusion_result.fused_data else [],
            "source_mapping": fusion_result.source_mapping
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du test de fusion: {str(e)}"
        )


@router.post("/test-documentation")
async def test_documentation(
    request: PipelineRunRequest,
    admin_user: User = Depends(require_admin)
):
    """
    Test spécifique de la génération de documentation (admin seulement)
    """
    try:
        # Simuler des données traitées pour le test
        from ..data.sources import get_mock_budget_data, get_mock_participation_data
        from ..data.processor import data_processor
        
        # Préparer des données de test
        mock_processed_data = {}
        
        if request.use_mock_data:
            # Données de participation
            participation_raw = {
                'source': 'Mock Participation Data',
                'data': get_mock_participation_data(),
                'retrieved_at': '2024-01-01T00:00:00'
            }
            participation_processed = await data_processor.process_data(participation_raw, 'participation')
            mock_processed_data['paris_participation'] = participation_processed
            
            # Données de budget  
            budget_raw = {
                'source': 'Mock Budget Data',
                'data': get_mock_budget_data(), 
                'retrieved_at': '2024-01-01T00:00:00'
            }
            budget_processed = await data_processor.process_data(budget_raw, 'budget')
            mock_processed_data['paris_budget'] = budget_processed
        
        # Test de fusion pour documentation complète
        fusion_result = None
        try:
            fusion_result = await data_fusion.fuse_sources(mock_processed_data, 'civic_engagement')
        except:
            pass  # Documentation fonctionne aussi sans fusion
        
        # Test de documentation
        documentation = await auto_doc_generator.generate_comprehensive_documentation(
            mock_processed_data,
            fusion_result
        )
        
        return {
            "message": "Test de documentation réussi",
            "sources_documented": len(documentation['source_documentation']),
            "fusion_documented": 'fusion_documentation' in documentation,
            "total_fields": len(documentation['global_schema']['unified_schema']),
            "documentation_summary": {
                "generation_metadata": documentation['generation_metadata'],
                "transformation_summary": documentation['transformation_summary'],
                "sample_field_docs": dict(list(documentation['global_schema']['unified_schema'].items())[:3])
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du test de documentation: {str(e)}"
        )


@router.get("/documentation/{source_name}")
async def get_source_documentation(source_name: str):
    """
    Récupère la documentation d'une source spécifique
    """
    # TODO: Implémenter récupération depuis base de données
    # Pour l'instant, retourne un exemple
    return {
        "message": f"Documentation pour {source_name}",
        "note": "À implémenter: récupération depuis base de données"
    }


async def _run_full_pipeline(use_mock_data: bool):
    """Fonction helper pour exécution pipeline complet en arrière-plan"""
    try:
        result = await pipeline.run_full_pipeline(use_mock_data)
        return result
    except Exception as e:
        print(f"Erreur pipeline complet: {e}")
        return {"error": str(e)}


async def _run_partial_pipeline(source_keys: List[str], use_mock_data: bool):
    """Fonction helper pour exécution pipeline partiel en arrière-plan"""
    try:
        result = await pipeline.run_partial_pipeline(source_keys, use_mock_data)
        return result
    except Exception as e:
        print(f"Erreur pipeline partiel: {e}")
        return {"error": str(e)}


@router.get("/datasets/{dataset_id}/data")
async def get_dataset_data(dataset_id: int, limit: int = 100):
    """
    Retourne les données d'un dataset pour les visualisations
    """
    from ..core.database import get_db
    from ..models.dataset import Dataset
    from sqlalchemy.orm import Session
    
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        
        if not dataset:
            raise HTTPException(
                status_code=404,
                detail=f"Dataset {dataset_id} non trouvé"
            )
        
        # Retourne les données depuis processing_config
        data = []
        if dataset.processing_config and 'data' in dataset.processing_config:
            data = dataset.processing_config['data'][:limit]
        
        return {
            "dataset_id": dataset_id,
            "dataset_name": dataset.name,
            "data_type": dataset.processing_config.get('data', [{}])[0].get('data_type', 'unknown') if data else 'unknown',
            "total_records": len(data),
            "data": data,
            "quality_score": dataset.overall_quality_score,
            "retrieved_at": dataset.processing_config.get('last_processed') if dataset.processing_config else None
        }
        
    finally:
        db.close()


@router.get("/datasets/{dataset_id}/documentation")
async def get_dataset_documentation(dataset_id: int):
    """
    Récupère la documentation complète d'un dataset
    """
    from ..core.database import get_db
    from ..models.dataset import Dataset
    from sqlalchemy.orm import Session
    
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        
        if not dataset:
            raise HTTPException(
                status_code=404,
                detail=f"Dataset {dataset_id} non trouvé"
            )
        
        # Extraire documentation depuis processing_config
        documentation = {}
        if dataset.processing_config:
            documentation = dataset.processing_config.get('documentation', {})
        
        return {
            "dataset_id": dataset_id,
            "dataset_name": dataset.name,
            "dataset_type": dataset.type.value if dataset.type else 'unknown',
            "quality_scores": {
                "completeness": dataset.completeness_score,
                "consistency": dataset.consistency_score,
                "validity": dataset.validity_score,
                "overall": dataset.overall_quality_score
            },
            "metadata": {
                "rows_count": dataset.rows_count,
                "columns_count": dataset.columns_count,
                "file_size_mb": dataset.file_size_mb,
                "created_at": dataset.created_at.isoformat() if dataset.created_at else None,
                "processed_at": dataset.processed_at.isoformat() if dataset.processed_at else None
            },
            "documentation": documentation,
            "processing_log": dataset.processing_log
        }
        
    finally:
        db.close() 