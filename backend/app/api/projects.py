"""
Endpoints API pour les projets AgoraFlux
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import re

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.project import Project, ProjectStatus, ProjectVisibility
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectPublic, ProjectSummary,
    ProjectList, ProjectStatusUpdate, ProjectSearch
)

router = APIRouter(prefix="/projects", tags=["Projets"])


def generate_slug(title: str) -> str:
    """Génère un slug unique à partir du titre"""
    # Convertir en minuscules et remplacer les espaces et caractères spéciaux
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


@router.get("/", response_model=ProjectList)
async def get_projects(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[ProjectStatus] = None,
    visibility: Optional[ProjectVisibility] = None,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|updated_at|title|view_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste paginée des projets
    """
    query = db.query(Project)
    
    # Filtres
    if status:
        query = query.filter(Project.status == status)
    
    if visibility:
        query = query.filter(Project.visibility == visibility)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Project.title.ilike(search_term) |
            Project.description.ilike(search_term) |
            Project.tags.ilike(search_term)
        )
    
    if tags:
        tag_filter = f"%{tags}%"
        query = query.filter(Project.tags.ilike(tag_filter))
    
    # Tri
    if sort_order == "desc":
        query = query.order_by(getattr(Project, sort_by).desc())
    else:
        query = query.order_by(getattr(Project, sort_by).asc())
    
    # Pagination
    total = query.count()
    projects = query.offset((page - 1) * per_page).limit(per_page).all()
    
    return ProjectList(
        projects=[ProjectSummary.from_orm(project) for project in projects],
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )


@router.get("/{project_id}", response_model=ProjectPublic)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupère un projet par son ID
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Incrémenter le compteur de vues
    project.view_count += 1
    db.commit()
    
    return ProjectPublic.from_orm(project)


@router.post("/", response_model=ProjectPublic, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crée un nouveau projet
    """
    # Générer un slug unique
    base_slug = generate_slug(project_data.title)
    slug = base_slug
    counter = 1
    
    while db.query(Project).filter(Project.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Créer le projet
    project = Project(
        title=project_data.title,
        slug=slug,
        description=project_data.description,
        objectives=project_data.objectives,
        methodology=project_data.methodology,
        expected_outcomes=project_data.expected_outcomes,
        tags=project_data.tags,
        visibility=project_data.visibility,
        allow_comments=project_data.allow_comments,
        allow_contributions=project_data.allow_contributions,
        moderation_enabled=project_data.moderation_enabled,
        owner_id=current_user.id,
        status=ProjectStatus.DRAFT,
        created_at=datetime.utcnow()
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return ProjectPublic.from_orm(project)


@router.put("/{project_id}", response_model=ProjectPublic)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour un projet (propriétaire uniquement)
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier que l'utilisateur est propriétaire
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le propriétaire peut modifier ce projet"
        )
    
    # Mettre à jour les champs modifiés
    update_data = project_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(project, field, value)
    
    # Si le titre change, regénérer le slug
    if 'title' in update_data:
        base_slug = generate_slug(project_data.title)
        slug = base_slug
        counter = 1
        
        while db.query(Project).filter(
            Project.slug == slug,
            Project.id != project_id
        ).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        project.slug = slug
    
    project.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(project)
    
    return ProjectPublic.from_orm(project)


@router.patch("/{project_id}/status", response_model=ProjectPublic)
async def update_project_status(
    project_id: int,
    status_update: ProjectStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour le statut d'un projet
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier les permissions
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le propriétaire peut modifier le statut"
        )
    
    project.status = status_update.status
    project.updated_at = datetime.utcnow()
    
    # Mettre à jour les timestamps spécifiques
    if status_update.status == ProjectStatus.ACTIVE and not project.published_at:
        project.published_at = datetime.utcnow()
    elif status_update.status == ProjectStatus.COMPLETED:
        project.completed_at = datetime.utcnow()
    elif status_update.status == ProjectStatus.ARCHIVED:
        project.archived_at = datetime.utcnow()
    
    db.commit()
    db.refresh(project)
    
    return ProjectPublic.from_orm(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprime un projet (propriétaire uniquement)
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier les permissions
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le propriétaire peut supprimer ce projet"
        )
    
    db.delete(project)
    db.commit()


@router.post("/{project_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def like_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ajoute un like à un projet
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # TODO: Implémenter la table des likes pour éviter les doublons
    project.likes_count += 1
    db.commit()


@router.delete("/{project_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retire un like d'un projet
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # TODO: Implémenter la table des likes pour éviter les incohérences
    if project.likes_count > 0:
        project.likes_count -= 1
        db.commit()


@router.get("/search", response_model=ProjectList)
async def search_projects(
    search_params: ProjectSearch = Depends(),
    db: Session = Depends(get_db)
):
    """
    Recherche avancée de projets
    """
    query = db.query(Project)
    
    # Application des filtres de recherche
    if search_params.q:
        search_term = f"%{search_params.q}%"
        query = query.filter(
            Project.title.ilike(search_term) |
            Project.description.ilike(search_term) |
            Project.tags.ilike(search_term)
        )
    
    if search_params.tags:
        tag_filter = f"%{search_params.tags}%"
        query = query.filter(Project.tags.ilike(tag_filter))
    
    if search_params.status:
        query = query.filter(Project.status == search_params.status)
    
    if search_params.visibility:
        query = query.filter(Project.visibility == search_params.visibility)
    
    if search_params.owner_id:
        query = query.filter(Project.owner_id == search_params.owner_id)
    
    # Tri
    sort_column = getattr(Project, search_params.sort_by)
    if search_params.sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Pagination
    total = query.count()
    projects = query.offset((search_params.page - 1) * search_params.per_page).limit(search_params.per_page).all()
    
    return ProjectList(
        projects=[ProjectSummary.from_orm(project) for project in projects],
        total=total,
        page=search_params.page,
        per_page=search_params.per_page,
        pages=(total + search_params.per_page - 1) // search_params.per_page
    ) 