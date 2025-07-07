"""
Endpoints API pour le pipeline de données AgoraFlux
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

from ..data import pipeline
from ..api.dependencies import require_admin
from ..models.user import User

router = APIRouter(prefix="/data", tags=["Pipeline de données"])


class PipelineRunRequest(BaseModel):
    """Requête pour lancer le pipeline"""
    use_mock_data: bool = False
    source_keys: Optional[List[str]] = None


class PipelineStatusResponse(BaseModel):
    """Réponse de statut du pipeline"""
    is_running: bool
    sources_configured: int
    last_run: Optional[Dict[str, Any]]


@router.get("/sources", response_model=Dict[str, Any])
async def list_data_sources():
    """
    Liste toutes les sources de données configurées
    """
    sources = pipeline.source_manager.list_sources()
    
    return {
        "sources": [
            {
                "key": key,
                "name": source.name,
                "url": source.url,
                "format": source.format,
                "description": source.description,
                "update_frequency": source.update_frequency,
                "last_updated": source.last_updated.isoformat() if source.last_updated else None
            }
            for key, source in sources.items()
        ],
        "total_sources": len(sources)
    }


@router.get("/status", response_model=PipelineStatusResponse)
async def get_pipeline_status():
    """
    Retourne le statut actuel du pipeline de données
    """
    status = await pipeline.get_pipeline_status()
    return PipelineStatusResponse(**status)


@router.post("/run")
async def run_pipeline(
    request: PipelineRunRequest,
    background_tasks: BackgroundTasks,
    admin_user: User = Depends(require_admin)
):
    """
    Lance le pipeline de données (admin seulement)
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


@router.get("/last-run")
async def get_last_run():
    """
    Retourne les détails de la dernière exécution du pipeline
    """
    if not pipeline.last_run:
        return JSONResponse(
            status_code=404,
            content={"message": "Aucune exécution précédente trouvée"}
        )
    
    return pipeline.last_run


@router.get("/mock-data/{data_type}")
async def get_mock_data(data_type: str):
    """
    Retourne des données de test pour un type donné
    Utile pour tester les visualisations
    """
    from ..data.sources import get_mock_budget_data, get_mock_participation_data
    
    if data_type == "budget":
        return {
            "data_type": "budget",
            "data": get_mock_budget_data(),
            "description": "Données budgétaires de test pour Paris"
        }
    elif data_type == "participation":
        return {
            "data_type": "participation", 
            "data": get_mock_participation_data(),
            "description": "Données de participation citoyenne de test"
        }
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Type de données '{data_type}' non supporté. Types disponibles: budget, participation"
        )


@router.get("/datasets")
async def list_processed_datasets():
    """
    Liste tous les datasets traités par le pipeline
    """
    from ..core.database import get_db
    from ..models.dataset import Dataset
    from sqlalchemy.orm import Session
    
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        datasets = db.query(Dataset).all()
        
        return {
            "datasets": [
                {
                    "id": dataset.id,
                    "name": dataset.name,
                    "type": dataset.type.value,
                    "status": dataset.status.value,
                    "rows_count": dataset.rows_count,
                    "quality_score": dataset.overall_quality_score,
                    "created_at": dataset.created_at.isoformat() if dataset.created_at else None,
                    "project_id": dataset.project_id
                }
                for dataset in datasets
            ],
            "total": len(datasets)
        }
    finally:
        db.close()


@router.get("/datasets/{dataset_id}")
async def get_dataset_details(dataset_id: int):
    """
    Retourne les détails d'un dataset spécifique
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
        sample_data = []
        total_records = 0
        
        if dataset.processing_config:
            sample_data = dataset.processing_config.get('sample_data', [])
            total_records = dataset.processing_config.get('total_records', 0)
        
        return {
            "id": dataset.id,
            "name": dataset.name,
            "description": dataset.description,
            "type": dataset.type.value,
            "status": dataset.status.value,
            "rows_count": dataset.rows_count,
            "columns_count": dataset.columns_count,
            "quality_scores": {
                "completeness": dataset.completeness_score,
                "consistency": dataset.consistency_score,
                "validity": dataset.validity_score,
                "overall": dataset.overall_quality_score
            },
            "sample_data": sample_data,
            "total_records": total_records,
            "created_at": dataset.created_at.isoformat() if dataset.created_at else None,
            "project_id": dataset.project_id
        }
        
    finally:
        db.close()


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


# Fonctions d'aide pour Background Tasks
async def _run_full_pipeline(use_mock_data: bool):
    """Execute le pipeline complet en arrière-plan"""
    try:
        await pipeline.run_full_pipeline(use_mock_data)
    except Exception as e:
        # Log l'erreur mais ne lève pas d'exception dans background task
        from loguru import logger
        logger.error(f"❌ Erreur pipeline background: {str(e)}")


async def _run_partial_pipeline(source_keys: List[str], use_mock_data: bool):
    """Execute le pipeline partiel en arrière-plan"""
    try:
        await pipeline.run_partial_pipeline(source_keys, use_mock_data)
    except Exception as e:
        # Log l'erreur mais ne lève pas d'exception dans background task
        from loguru import logger
        logger.error(f"❌ Erreur pipeline partiel background: {str(e)}") 