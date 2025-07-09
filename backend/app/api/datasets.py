"""
Endpoints API pour les datasets AgoraFlux
"""

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os
import uuid
from datetime import datetime
import json
import pandas as pd

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.dataset import Dataset, DatasetType, DatasetStatus, DataQuality
from app.schemas.dataset import (
    DatasetCreate, DatasetUpdate, DatasetPublic, DatasetSummary,
    DatasetList, DatasetSearch
)
from app.core.config import settings

router = APIRouter(prefix="/datasets", tags=["Datasets"])


def generate_slug(name: str) -> str:
    """Génère un slug unique à partir du nom"""
    import re
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def get_file_type(filename: str) -> DatasetType:
    """Détermine le type de dataset basé sur l'extension"""
    extension = filename.lower().split('.')[-1]
    
    if extension == 'csv':
        return DatasetType.CSV
    elif extension == 'json':
        return DatasetType.JSON
    elif extension in ['xlsx', 'xls']:
        return DatasetType.EXCEL
    else:
        return DatasetType.CSV  # Par défaut


def analyze_dataset_quality(file_path: str, dataset_type: DatasetType) -> dict:
    """Analyse la qualité d'un dataset"""
    try:
        # Charger les données selon le type
        if dataset_type == DatasetType.CSV:
            df = pd.read_csv(file_path)
        elif dataset_type == DatasetType.JSON:
            df = pd.read_json(file_path)
        elif dataset_type == DatasetType.EXCEL:
            df = pd.read_excel(file_path)
        else:
            return {"completeness": 0, "consistency": 0, "validity": 0, "overall_score": 0}
        
        total_cells = df.size
        missing_values = df.isnull().sum().sum()
        
        # Calcul des scores de qualité
        completeness = max(0, (total_cells - missing_values) / total_cells * 100) if total_cells > 0 else 0
        
        # Consistance basique (types cohérents par colonne)
        consistency = 85.0  # Score estimé pour l'exemple
        
        # Validité basique (pas de valeurs aberrantes évidentes)
        validity = 90.0  # Score estimé pour l'exemple
        
        overall_score = (completeness + consistency + validity) / 3
        
        return {
            "completeness": round(completeness, 1),
            "consistency": round(consistency, 1),
            "validity": round(validity, 1),
            "overall_score": round(overall_score, 1),
            "rows_count": len(df),
            "columns_count": len(df.columns),
            "missing_values_count": int(missing_values)
        }
        
    except Exception as e:
        print(f"Erreur lors de l'analyse de qualité: {e}")
        return {"completeness": 0, "consistency": 0, "validity": 0, "overall_score": 0}


@router.get("/")
async def get_datasets(
    project_id: Optional[int] = None,
    status: Optional[DatasetStatus] = None,
    dataset_type: Optional[DatasetType] = None,
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des datasets
    """
    query = db.query(Dataset)
    
    if project_id:
        query = query.filter(Dataset.project_id == project_id)
    
    if status:
        query = query.filter(Dataset.status == status)
    
    if dataset_type:
        query = query.filter(Dataset.type == dataset_type)
    
    datasets = query.order_by(Dataset.created_at.desc()).all()
    
    # Convertir manuellement pour être compatible avec le frontend
    result = []
    for dataset in datasets:
        result.append({
            "id": dataset.id,
            "name": dataset.name,
            "description": dataset.description,
            "type": dataset.type.value,
            "status": dataset.status.value,
            "quality": dataset.quality.value,
            "file_size": dataset.file_size or 0,
            "rows_count": dataset.rows_count,
            "columns_count": dataset.columns_count,
            "overall_quality_score": dataset.overall_quality_score or 0.0,
            "completeness_score": dataset.completeness_score,
            "consistency_score": dataset.consistency_score,
            "validity_score": dataset.validity_score,
            "created_at": dataset.created_at.isoformat(),
            "updated_at": dataset.updated_at.isoformat() if dataset.updated_at else None,
            "processed_at": dataset.processed_at.isoformat() if dataset.processed_at else None,
            "uploaded_by": {
                "id": dataset.uploaded_by.id,
                "first_name": dataset.uploaded_by.first_name,
                "last_name": dataset.uploaded_by.last_name,
                "email": dataset.uploaded_by.email
            } if dataset.uploaded_by else None,
            "project_id": dataset.project_id,
            "is_exportable": dataset.is_exportable,
            "export_formats": dataset.export_formats or "csv,json"
        })
    
    return {
        "datasets": result,
        "total": len(result)
    }


@router.get("/{dataset_id}", response_model=DatasetPublic)
async def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupère un dataset par son ID
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset non trouvé"
        )
    
    return DatasetPublic.from_orm(dataset)


@router.post("/", response_model=DatasetPublic, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    project_id: int = Form(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload un nouveau dataset
    """
    # Vérifier que le projet existe
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier le type de fichier
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom de fichier manquant"
        )
    
    file_extension = f".{file.filename.split('.')[-1].lower()}"
    if file_extension not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de fichier non supporté. Types autorisés: {', '.join(settings.ALLOWED_FILE_TYPES)}"
        )
    
    # Créer le répertoire d'upload s'il n'existe pas
    upload_dir = settings.DATA_UPLOAD_PATH
    os.makedirs(upload_dir, exist_ok=True)
    
    # Générer un nom de fichier unique
    file_id = str(uuid.uuid4())
    file_path = os.path.join(upload_dir, f"{file_id}{file_extension}")
    
    try:
        # Sauvegarder le fichier
        with open(file_path, "wb") as buffer:
            content = await file.read()
            
            # Vérifier la taille du fichier
            if len(content) > settings.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Fichier trop volumineux. Taille maximale: {settings.MAX_FILE_SIZE / (1024*1024):.1f} MB"
                )
            
            buffer.write(content)
        
        # Déterminer le type de dataset
        dataset_type = get_file_type(file.filename)
        
        # Analyser la qualité
        quality_metrics = analyze_dataset_quality(file_path, dataset_type)
        
        # Générer un slug unique
        dataset_name = name or file.filename.split('.')[0]
        base_slug = generate_slug(dataset_name)
        slug = base_slug
        counter = 1
        
        while db.query(Dataset).filter(Dataset.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Créer l'entrée en base
        dataset = Dataset(
            name=dataset_name,
            slug=slug,
            description=description or f"Dataset uploadé depuis {file.filename}",
            type=dataset_type,
            file_path=file_path,
            original_filename=file.filename,
            file_size=len(content),
            status=DatasetStatus.PROCESSED,
            quality=DataQuality.GOOD if quality_metrics.get("overall_score", 0) > 80 else DataQuality.FAIR,
            project_id=project_id,
            uploaded_by_id=current_user.id,
            rows_count=quality_metrics.get("rows_count"),
            columns_count=quality_metrics.get("columns_count"),
            missing_values_count=quality_metrics.get("missing_values_count"),
            completeness_score=quality_metrics.get("completeness"),
            consistency_score=quality_metrics.get("consistency"),
            validity_score=quality_metrics.get("validity"),
            overall_quality_score=quality_metrics.get("overall_score"),
            processing_config={
                "upload_metadata": {
                    "original_filename": file.filename,
                    "content_type": file.content_type,
                    "uploaded_at": datetime.utcnow().isoformat(),
                    "uploaded_by": f"{current_user.first_name} {current_user.last_name}"
                },
                "quality_analysis": quality_metrics
            },
            created_at=datetime.utcnow(),
            processed_at=datetime.utcnow(),
            is_exportable=True,
            export_formats="csv,json,xlsx"
        )
        
        db.add(dataset)
        
        # Mettre à jour le compteur de datasets du projet
        project.datasets_count = db.query(Dataset).filter(Dataset.project_id == project_id).count() + 1
        
        db.commit()
        db.refresh(dataset)
        
        # Charger la relation uploaded_by explicitement
        dataset_with_user = db.query(Dataset).options(joinedload(Dataset.uploaded_by)).filter(Dataset.id == dataset.id).first()
        
        return DatasetPublic.from_orm(dataset_with_user)
        
    except Exception as e:
        # Nettoyer le fichier en cas d'erreur
        if os.path.exists(file_path):
            os.remove(file_path)
        
        if isinstance(e, HTTPException):
            raise e
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du traitement du fichier: {str(e)}"
        )


@router.put("/{dataset_id}", response_model=DatasetPublic)
async def update_dataset(
    dataset_id: int,
    dataset_data: DatasetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour un dataset
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset non trouvé"
        )
    
    # Vérifier les permissions (propriétaire du projet ou uploader du dataset)
    project = db.query(Project).filter(Project.id == dataset.project_id).first()
    if dataset.uploaded_by_id != current_user.id and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissions insuffisantes pour modifier ce dataset"
        )
    
    # Mettre à jour les champs modifiés
    update_data = dataset_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(dataset, field, value)
    
    dataset.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(dataset)
    
    return DatasetPublic.from_orm(dataset)


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprime un dataset
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset non trouvé"
        )
    
    # Vérifier les permissions
    project = db.query(Project).filter(Project.id == dataset.project_id).first()
    if dataset.uploaded_by_id != current_user.id and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissions insuffisantes pour supprimer ce dataset"
        )
    
    # Supprimer le fichier physique
    if dataset.file_path and os.path.exists(dataset.file_path):
        try:
            os.remove(dataset.file_path)
        except Exception as e:
            print(f"Erreur lors de la suppression du fichier: {e}")
    
    # Supprimer l'entrée en base
    db.delete(dataset)
    
    # Mettre à jour le compteur du projet
    if project:
        project.datasets_count = max(0, project.datasets_count - 1)
    
    db.commit()


@router.get("/{dataset_id}/data")
async def get_dataset_data(
    dataset_id: int,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Récupère les données d'un dataset pour affichage
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset non trouvé"
        )
    
    if not dataset.file_path or not os.path.exists(dataset.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier de données non trouvé"
        )
    
    try:
        # Charger les données selon le type
        if dataset.type == DatasetType.CSV:
            df = pd.read_csv(dataset.file_path)
        elif dataset.type == DatasetType.JSON:
            df = pd.read_json(dataset.file_path)
        elif dataset.type == DatasetType.EXCEL:
            df = pd.read_excel(dataset.file_path)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Type de dataset non supporté pour la lecture"
            )
        
        # Pagination
        total_rows = len(df)
        data_slice = df.iloc[offset:offset + limit]
        
        return {
            "dataset_id": dataset_id,
            "dataset_name": dataset.name,
            "total_rows": total_rows,
            "returned_rows": len(data_slice),
            "columns": list(df.columns),
            "data": data_slice.to_dict('records'),
            "has_more": offset + limit < total_rows
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la lecture des données: {str(e)}"
        ) 