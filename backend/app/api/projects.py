"""
API des projets collaboratifs pour AgoraFlux
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_, func
from typing import Optional, List
from datetime import datetime
import uuid
import asyncio
import os
import shutil
import re

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.project import Project, ProjectStatus, ProjectVisibility
from app.models.comment import Comment, CommentType, CommentStatus
from app.models.permissions import ProjectPermission, ProjectRole
from app.models.dataset import Dataset
from app.services.permission_service import PermissionService
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectPublic, ProjectSummary,
    ProjectList, ProjectStatusUpdate, ProjectSearch
)

router = APIRouter()


def apply_access_filters(query, current_user: User):
    """
    Applique les filtres d'accès selon les permissions de l'utilisateur
    """
    if current_user.role.value == 'admin':
        # Les admins peuvent voir tous les projets
        return query
    else:
        # Les utilisateurs normaux ne peuvent voir que :
        # 1. Les projets ACTIVE et COMPLETED (publics)
        # 2. Leurs propres projets (tous statuts)
        return query.filter(
            or_(
                # Projets publics (active/completed)
                Project.status.in_([ProjectStatus.ACTIVE, ProjectStatus.COMPLETED]),
                # Leurs propres projets (tous statuts)
                Project.owner_id == current_user.id
            )
        )


def generate_slug(title: str) -> str:
    """Génère un slug unique à partir du titre"""
    # Convertir en minuscules et remplacer les espaces et caractères spéciaux
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


@router.get("/")
async def get_all_projects(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    visibility: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste de tous les projets avec pagination
    Filtre automatiquement les projets selon les permissions d'accès
    """
    query = db.query(Project)
    
    # RESTRICTION D'ACCÈS : Appliquer les filtres selon les permissions
    query = apply_access_filters(query, current_user)
    
    # Filtres optionnels
    if status:
        try:
            status_enum = ProjectStatus(status)
            query = query.filter(Project.status == status_enum)
        except ValueError:
            pass
    
    if visibility:
        try:
            visibility_enum = ProjectVisibility(visibility)
            query = query.filter(Project.visibility == visibility_enum)
        except ValueError:
            pass
    
    # Ordre par date de mise à jour (plus récents en premier)
    query = query.order_by(Project.updated_at.desc())
    
    # Compter le total avant pagination
    total = query.count()
    
    # Pagination
    projects = query.offset(skip).limit(limit).all()
    
    # Recalculer les compteurs pour chaque projet
    for project in projects:
        actual_datasets_count = db.query(Dataset).filter(Dataset.project_id == project.id).count()
        actual_comments_count = db.query(Comment).filter(Comment.project_id == project.id).count()
        
        if project.datasets_count != actual_datasets_count:
            project.datasets_count = actual_datasets_count
            
        if project.comments_count != actual_comments_count:
            project.comments_count = actual_comments_count
    
    # Sauvegarder les corrections
    db.commit()
    
    # Retourner la structure attendue par le frontend
    return {
        "projects": [ProjectPublic.from_orm(project) for project in projects],
        "total": total,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "per_page": limit
    }


@router.get("/discussions")
async def get_all_discussions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    comment_type: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|likes_count|replies_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère toutes les discussions/commentaires avec pagination
    Filtre selon les projets accessibles à l'utilisateur
    """
    # Construire la requête de base pour les commentaires
    query = db.query(Comment).filter(
        # Comment.status == CommentStatus.ACTIVE,  # Commenté temporairement pour voir tous les statuts
        Comment.parent_id.is_(None)  # Seulement les commentaires de premier niveau
    )
    
    # RESTRICTION D'ACCÈS : Ne montrer que les commentaires des projets accessibles
    if current_user.role.value != 'admin':
        # Jointure avec les projets et application des filtres d'accès
        query = query.join(Project, Comment.project_id == Project.id)
        query = query.filter(
            or_(
                # Projets publics (active/completed)
                Project.status.in_([ProjectStatus.ACTIVE, ProjectStatus.COMPLETED]),
                # Projets de l'utilisateur (tous statuts)
                Project.owner_id == current_user.id
            )
        )
    else:
        # Admin peut voir tous les commentaires, mais on joint quand même pour optimiser
        query = query.join(Project, Comment.project_id == Project.id)
    
    # Filtres
    if comment_type:
        try:
            comment_type_enum = CommentType(comment_type)
            query = query.filter(Comment.type == comment_type_enum)
        except ValueError:
            pass
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(Comment.content.ilike(search_term))
    
    # Jointure avec l'auteur pour optimiser les requêtes
    query = query.join(Comment.author)
    
    # Tri avec priorité aux commentaires épinglés
    if sort_order == "desc":
        query = query.order_by(
            Comment.is_pinned.desc(),  # Épinglés en premier (True > False)
            getattr(Comment, sort_by).desc()  # Puis tri normal
        )
    else:
        query = query.order_by(
            Comment.is_pinned.desc(),  # Épinglés en premier (True > False)
            getattr(Comment, sort_by).asc()  # Puis tri normal
        )
    
    # Pagination
    total = query.count()
    comments = query.offset((page - 1) * per_page).limit(per_page).all()
    
    # Formater les commentaires pour le frontend
    formatted_comments = []
    for comment in comments:
        formatted_comments.append({
            "id": comment.id,
            "content": comment.content,
            "type": comment.type.value,
            "status": comment.status.value,
            "project": {
                "id": comment.project.id,
                "title": comment.project.title,
                "slug": comment.project.slug
            },
            "author": {
                "id": comment.author.id,
                "name": f"{comment.author.first_name} {comment.author.last_name}",
                "avatar": f"{comment.author.first_name[0]}{comment.author.last_name[0]}",
                "role": comment.author.role.value
            },
            "created_at": comment.created_at.isoformat(),
            "updated_at": comment.updated_at.isoformat() if comment.updated_at else None,
            "likes_count": comment.likes_count,
            "replies_count": comment.replies_count,
            "is_edited": comment.is_edited,
            "is_pinned": comment.is_pinned
        })
    
    return {
        "discussions": formatted_comments,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
        "stats": {
            "total_discussions": total,
            "active_discussions": len([c for c in formatted_comments if c["replies_count"] > 0]),
            "by_type": {
                "comment": len([c for c in formatted_comments if c["type"] == "comment"]),
                "question": len([c for c in formatted_comments if c["type"] == "question"]),
                "suggestion": len([c for c in formatted_comments if c["type"] == "suggestion"]),
                "annotation": len([c for c in formatted_comments if c["type"] == "annotation"])
            }
        }
    }


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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste paginée des projets avec restriction d'accès
    """
    query = db.query(Project)
    
    # RESTRICTION D'ACCÈS : Appliquer les filtres selon les permissions
    query = apply_access_filters(query, current_user)
    
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère un projet par son ID avec vérification des permissions d'accès
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )

    # VÉRIFICATION DES PERMISSIONS D'ACCÈS
    if current_user.role.value != 'admin':
        # Si ce n'est pas un admin, vérifier les permissions
        if project.status in [ProjectStatus.DRAFT, ProjectStatus.ARCHIVED]:
            # Seul le propriétaire peut voir ses projets en brouillon/archivé
            if project.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Projet non trouvé"  # Ne pas révéler que le projet existe
                )
    
    # Recalculer les compteurs en temps réel pour s'assurer qu'ils sont corrects
    actual_datasets_count = db.query(Dataset).filter(Dataset.project_id == project_id).count()
    actual_comments_count = db.query(Comment).filter(Comment.project_id == project_id).count()
    
    # Mettre à jour les compteurs si ils sont incorrects
    if project.datasets_count != actual_datasets_count:
        project.datasets_count = actual_datasets_count
        
    if project.comments_count != actual_comments_count:
        project.comments_count = actual_comments_count
    
    # Incrémenter le compteur de vues
    project.view_count += 1
    
    # Sauvegarder les modifications
    db.commit()
    db.refresh(project)
    
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
    
    # Créer les permissions par défaut pour le propriétaire
    permission_service = PermissionService(db)
    permission_service.grant_default_permissions(project)
    
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


@router.get("/{project_id}/comments")
async def get_project_comments(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupère tous les commentaires d'un projet avec structure hiérarchique
    """
    # Vérifier que le projet existe
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Récupérer tous les commentaires actifs du projet, épinglés en premier
    comments = db.query(Comment).filter(
        Comment.project_id == project_id,
        Comment.status == CommentStatus.ACTIVE
    ).order_by(
        Comment.is_pinned.desc(),  # Épinglés en premier
        Comment.created_at.asc()   # Puis par ordre chronologique pour construire l'arbre
    ).all()
    
    def format_comment(comment):
        """Formater un commentaire pour le frontend"""
        return {
            "id": comment.id,
            "content": comment.content,
            "type": comment.type.value,
            "status": comment.status.value,
            "parent_id": comment.parent_id,
            "thread_depth": comment.thread_depth,
            "author": {
                "id": comment.author.id,
                "name": f"{comment.author.first_name} {comment.author.last_name}",
                "avatar": f"{comment.author.first_name[0]}{comment.author.last_name[0]}",
                "role": comment.author.role.value
            },
            "created_at": comment.created_at.isoformat(),
            "updated_at": comment.updated_at.isoformat() if comment.updated_at else None,
            "likes_count": comment.likes_count,
            "replies_count": comment.replies_count,
            "is_edited": comment.is_edited,
            "is_pinned": comment.is_pinned,
            "replies": []  # Sera rempli par build_comment_tree
        }
    
    def build_comment_tree(comments_list):
        """Construire l'arbre hiérarchique des commentaires"""
        # Organiser les commentaires par ID pour un accès rapide
        comments_by_id = {comment.id: format_comment(comment) for comment in comments_list}
        
        # Séparer les commentaires racine des réponses
        root_comments = []
        
        for comment in comments_list:
            formatted_comment = comments_by_id[comment.id]
            
            if comment.parent_id is None:
                # Commentaire racine
                root_comments.append(formatted_comment)
            else:
                # Réponse - l'ajouter au parent
                parent_comment = comments_by_id.get(comment.parent_id)
                if parent_comment:
                    parent_comment["replies"].append(formatted_comment)
        
        # Trier les commentaires racine : épinglés en premier, puis par date (plus récent en premier)
        def sort_key(comment):
            # Les épinglés ont priorité 0, les non-épinglés ont priorité 1
            priority = 0 if comment.get("is_pinned", False) else 1
            # Date en négatif pour avoir les plus récents en premier
            from datetime import datetime
            date_obj = datetime.fromisoformat(comment["created_at"].replace('Z', '+00:00'))
            timestamp = -date_obj.timestamp()
            return (priority, timestamp)
        
        root_comments.sort(key=sort_key)
        
        # Trier les réponses par date (plus ancien en premier pour suivre la conversation)
        def sort_replies_recursively(comment):
            comment["replies"].sort(key=lambda x: x["created_at"])
            for reply in comment["replies"]:
                sort_replies_recursively(reply)
        
        for comment in root_comments:
            sort_replies_recursively(comment)
        
        return root_comments
    
    # Construire l'arbre des commentaires
    threaded_comments = build_comment_tree(comments)
    
    # Calculer les statistiques
    total_comments = len(comments)
    total_threads = len([c for c in comments if c.parent_id is None])
    max_depth = max([c.thread_depth for c in comments], default=0)
    
    return {
        "comments": threaded_comments,
        "stats": {
            "total_comments": total_comments,
            "total_threads": total_threads,
            "max_depth": max_depth
        }
    }


@router.post("/{project_id}/comments")
async def create_project_comment(
    project_id: int,
    comment_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crée un nouveau commentaire sur un projet (avec support des threads)
    """
    # Vérifier que le projet existe
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier les permissions avec le nouveau système
    permission_service = PermissionService(db)
    permission_service.require_permission(current_user, project, "create_comments")
    
    # Vérifier que les commentaires sont autorisés
    if not project.allow_comments:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Les commentaires ne sont pas autorisés sur ce projet"
        )
    
    # Déterminer le type de commentaire
    comment_type = CommentType.COMMENT
    if comment_data.get("type"):
        try:
            comment_type = CommentType(comment_data["type"])
        except ValueError:
            comment_type = CommentType.COMMENT
    
    # Gérer les threads (réponses)
    parent_id = comment_data.get("parent_id")
    thread_depth = 0
    
    if parent_id:
        # Vérifier que le commentaire parent existe
        parent_comment = db.query(Comment).filter(
            Comment.id == parent_id,
            Comment.project_id == project_id,
            Comment.status == CommentStatus.ACTIVE
        ).first()
        
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commentaire parent non trouvé"
            )
        
        # Calculer la profondeur (limiter à 5 niveaux max)
        thread_depth = min(parent_comment.thread_depth + 1, 5)
        
        # Incrémenter le compteur de réponses du parent
        parent_comment.replies_count += 1
    
    # Créer le commentaire
    comment = Comment(
        content=comment_data["content"],
        type=comment_type,
        status=CommentStatus.ACTIVE,
        author_id=current_user.id,
        project_id=project_id,
        parent_id=parent_id,
        thread_depth=thread_depth,
        created_at=datetime.utcnow()
    )
    
    db.add(comment)
    
    # Mettre à jour le compteur de commentaires du projet
    project.comments_count += 1
    
    # Incrémenter le compteur de contributeurs si c'est un nouveau contributeur
    existing_contributor = db.query(Comment).filter(
        Comment.project_id == project_id,
        Comment.author_id == current_user.id,
        Comment.id != comment.id if hasattr(comment, 'id') else True
    ).first()
    
    if not existing_contributor:
        # C'est le premier commentaire de cet utilisateur sur ce projet
        project.contributor_count += 1
    
    db.commit()
    
    # Créer une notification pour le propriétaire du projet (si différent)
    if project.owner_id != current_user.id:
        from app.api.notifications import create_notification
        await create_notification(
            type="comment",
            title="Nouveau commentaire",
            message=f"{current_user.first_name} {current_user.last_name} a commenté votre projet '{project.title}'",
            recipient_id=str(project.owner_id),
            sender_id=str(current_user.id),
            data={
                "project_id": project_id,
                "project_name": project.title,
                "comment_id": comment.id,
                "comment_type": comment_type.value,
                "comment_preview": comment_data["content"][:100] + "..." if len(comment_data["content"]) > 100 else comment_data["content"],
                "is_reply": parent_id is not None,
                "thread_depth": thread_depth
            },
            priority="normal"
        )
    
    # Si c'est une réponse, notifier l'auteur du commentaire parent
    if parent_id:
        parent_comment = db.query(Comment).filter(Comment.id == parent_id).first()
        if parent_comment and parent_comment.author_id != current_user.id:
            from app.api.notifications import create_notification
            await create_notification(
                type="comment",
                title="Réponse à votre commentaire",
                message=f"{current_user.first_name} {current_user.last_name} a répondu à votre commentaire",
                recipient_id=str(parent_comment.author_id),
                sender_id=str(current_user.id),
                data={
                    "project_id": project_id,
                    "project_name": project.title,
                    "comment_id": comment.id,
                    "parent_comment_id": parent_id,
                    "comment_preview": comment_data["content"][:100] + "..." if len(comment_data["content"]) > 100 else comment_data["content"],
                    "thread_depth": thread_depth
                },
                priority="normal"
            )
    
    # Retourner le commentaire formaté
    return {
        "id": comment.id,
        "content": comment.content,
        "type": comment.type.value,
        "status": comment.status.value,
        "parent_id": comment.parent_id,
        "thread_depth": comment.thread_depth,
        "author": {
            "id": current_user.id,
            "name": f"{current_user.first_name} {current_user.last_name}",
            "avatar": f"{current_user.first_name[0]}{current_user.last_name[0]}",
            "role": current_user.role.value
        },
        "created_at": comment.created_at.isoformat(),
        "likes_count": comment.likes_count,
        "replies_count": comment.replies_count,
        "is_edited": comment.is_edited,
        "is_pinned": comment.is_pinned,
        "replies": []
    }


@router.put("/{project_id}/comments/{comment_id}")
async def update_project_comment(
    project_id: int,
    comment_id: int,
    comment_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour un commentaire
    """
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.project_id == project_id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commentaire non trouvé"
        )
    
    # Vérifier les permissions
    if comment.author_id != current_user.id and current_user.role.value not in ['admin', 'moderateur']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissions insuffisantes"
        )
    
    # Mettre à jour le commentaire
    comment.content = comment_data["content"]
    comment.is_edited = True
    comment.edited_at = datetime.utcnow()
    comment.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(comment)
    
    return {
        "id": comment.id,
        "content": comment.content,
        "type": comment.type.value,
        "status": comment.status.value,
        "author": {
            "id": comment.author.id,
            "name": f"{comment.author.first_name} {comment.author.last_name}",
            "avatar": f"{comment.author.first_name[0]}{comment.author.last_name[0]}",
            "role": comment.author.role.value
        },
        "created_at": comment.created_at.isoformat(),
        "updated_at": comment.updated_at.isoformat(),
        "likes_count": comment.likes_count,
        "replies_count": comment.replies_count,
        "is_edited": comment.is_edited,
        "is_pinned": comment.is_pinned
    }


@router.delete("/{project_id}/comments/{comment_id}")
async def delete_project_comment(
    project_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprime un commentaire
    """
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.project_id == project_id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commentaire non trouvé"
        )
    
    # Vérifier les permissions
    if comment.author_id != current_user.id and current_user.role.value not in ['admin', 'moderateur']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissions insuffisantes"
        )
    
    # Marquer comme supprimé au lieu de supprimer définitivement
    comment.status = CommentStatus.DELETED
    comment.updated_at = datetime.utcnow()
    
    # Décrémenter le compteur de commentaires du projet
    project = db.query(Project).filter(Project.id == project_id).first()
    if project:
        project.comments_count = max(0, project.comments_count - 1)
    
    db.commit()
    
    return {"message": "Commentaire supprimé"}


@router.post("/{project_id}/comments/{comment_id}/like")
async def like_project_comment(
    project_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Like un commentaire
    """
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.project_id == project_id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commentaire non trouvé"
        )
    
    # TODO: Vérifier si l'utilisateur a déjà liké (table de liaison)
    comment.likes_count += 1
    db.commit()
    
    return {"message": "Commentaire liké", "likes_count": comment.likes_count}


# === ENDPOINTS DE MODÉRATION ===

@router.patch("/{project_id}/comments/{comment_id}/moderate")
async def moderate_comment(
    project_id: int,
    comment_id: int,
    action: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actions de modération sur un commentaire
    Actions possibles: hide, show, pin, unpin, resolve
    """
    # Vérifier les permissions de modération
    if current_user.role.value not in ['admin', 'moderateur']:
        # Vérifier si c'est le propriétaire du projet
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project or project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes pour modérer"
            )
    
    # Récupérer le commentaire
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.project_id == project_id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commentaire non trouvé"
        )
    
    # Récupérer les informations du projet pour les notifications
    project = db.query(Project).filter(Project.id == project_id).first()
    action_type = action.get("action")
    reason = action.get("reason", "")
    
    # Appliquer l'action de modération
    notification_data = {
        "project_id": project_id,
        "project_name": project.title,
        "comment_id": comment_id,
        "comment_preview": comment.content[:100] + "..." if len(comment.content) > 100 else comment.content,
        "moderator_name": f"{current_user.first_name} {current_user.last_name}",
        "reason": reason
    }
    
    if action_type == "hide":
        comment.status = CommentStatus.HIDDEN
        comment.updated_at = datetime.utcnow()
        
        # Notifier l'auteur du commentaire
        if comment.author_id != current_user.id:
            from app.api.notifications import create_notification
            await create_notification(
                type="moderation",
                title="Commentaire masqué",
                message=f"Votre commentaire sur '{project.title}' a été masqué par un modérateur.",
                recipient_id=str(comment.author_id),
                sender_id=str(current_user.id),
                data={**notification_data, "action": "hidden"},
                priority="high"
            )
        
        message = "Commentaire masqué"
        
    elif action_type == "show":
        comment.status = CommentStatus.ACTIVE
        comment.updated_at = datetime.utcnow()
        
        # Notifier l'auteur du commentaire
        if comment.author_id != current_user.id:
            from app.api.notifications import create_notification
            await create_notification(
                type="moderation",
                title="Commentaire restauré",
                message=f"Votre commentaire sur '{project.title}' a été restauré.",
                recipient_id=str(comment.author_id),
                sender_id=str(current_user.id),
                data={**notification_data, "action": "restored"},
                priority="normal"
            )
        
        message = "Commentaire restauré"
        
    elif action_type == "pin":
        comment.is_pinned = True
        comment.updated_at = datetime.utcnow()
        message = "Commentaire épinglé"
        
    elif action_type == "unpin":
        comment.is_pinned = False
        comment.updated_at = datetime.utcnow()
        message = "Commentaire désépinglé"
        
    elif action_type == "resolve":
        comment.status = CommentStatus.HIDDEN  # Marquer comme résolu = masqué
        comment.updated_at = datetime.utcnow()
        
        # Notifier l'auteur du commentaire
        if comment.author_id != current_user.id:
            from app.api.notifications import create_notification
            await create_notification(
                type="moderation", 
                title="Discussion résolue",
                message=f"Votre discussion sur '{project.title}' a été marquée comme résolue.",
                recipient_id=str(comment.author_id),
                sender_id=str(current_user.id),
                data={**notification_data, "action": "resolved"},
                priority="normal"
            )
        
        message = "Discussion marquée comme résolue"
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action de modération non valide"
        )
    
    db.commit()
    db.refresh(comment)
    
    return {
        "message": message,
        "comment": {
            "id": comment.id,
            "status": comment.status.value,
            "is_pinned": comment.is_pinned,
            "updated_at": comment.updated_at.isoformat()
        }
    }


@router.delete("/{project_id}/comments/{comment_id}/moderate")
async def delete_comment_permanently(
    project_id: int,
    comment_id: int,
    reason: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Suppression définitive d'un commentaire (réservé aux admins)
    """
    # Vérifier les permissions (admin uniquement)
    if current_user.role.value != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent supprimer définitivement"
        )
    
    # Récupérer le commentaire
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.project_id == project_id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commentaire non trouvé"
        )
    
    # Récupérer les informations du projet
    project = db.query(Project).filter(Project.id == project_id).first()
    
    # Marquer comme supprimé définitivement
    comment.status = CommentStatus.DELETED
    comment.updated_at = datetime.utcnow()
    
    # Décrémenter les compteurs
    if project:
        project.comments_count = max(0, project.comments_count - 1)
    
    # Notifier l'auteur du commentaire
    if comment.author_id != current_user.id:
        from app.api.notifications import create_notification
        await create_notification(
            type="moderation",
            title="Commentaire supprimé",
            message=f"Votre commentaire sur '{project.title}' a été supprimé définitivement par un administrateur.",
            recipient_id=str(comment.author_id),
            sender_id=str(current_user.id),
            data={
                "project_id": project_id,
                "project_name": project.title,
                "comment_id": comment_id,
                "comment_preview": comment.content[:100] + "..." if len(comment.content) > 100 else comment.content,
                "moderator_name": f"{current_user.first_name} {current_user.last_name}",
                "reason": reason,
                "action": "deleted"
            },
            priority="high"
        )
    
    db.commit()
    
    return {"message": "Commentaire supprimé définitivement"} 


@router.post("/admin/fix-counters")
async def fix_all_counters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Corrige tous les compteurs de datasets et commentaires des projets
    Réservé aux administrateurs
    """
    # Vérifier les permissions admin
    if current_user.role.value != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé : seuls les administrateurs peuvent corriger les compteurs"
        )
    
    try:
        # Récupérer tous les projets
        projects = db.query(Project).all()
        corrections_made = 0
        
        for project in projects:
            # Recalculer le nombre réel de datasets
            actual_datasets_count = db.query(Dataset).filter(Dataset.project_id == project.id).count()
            
            # Recalculer le nombre réel de commentaires
            actual_comments_count = db.query(Comment).filter(Comment.project_id == project.id).count()
            
            # Vérifier s'il y a des différences
            datasets_changed = project.datasets_count != actual_datasets_count
            comments_changed = project.comments_count != actual_comments_count
            
            if datasets_changed or comments_changed:
                corrections_made += 1
                print(f"🔧 Correction projet {project.id} ({project.title}):")
                if datasets_changed:
                    print(f"   - Datasets: {project.datasets_count} → {actual_datasets_count}")
                    project.datasets_count = actual_datasets_count
                if comments_changed:
                    print(f"   - Commentaires: {project.comments_count} → {actual_comments_count}")
                    project.comments_count = actual_comments_count
        
        # Sauvegarder toutes les corrections
        db.commit()
        
        return {
            "message": f"Correction terminée : {corrections_made} projets corrigés",
            "total_projects": len(projects),
            "corrections_made": corrections_made,
            "status": "success"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la correction des compteurs: {str(e)}"
        ) 


@router.post("/{project_id}/comments/{comment_id}/flag")
async def flag_comment(
    project_id: int,
    comment_id: int,
    reason: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Signaler un commentaire comme inapproprié
    """
    # Récupérer le commentaire
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.project_id == project_id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commentaire non trouvé"
        )
    
    # Empêcher l'auto-signalement
    if comment.author_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas signaler votre propre commentaire"
        )
    
    # Récupérer les informations du projet
    project = db.query(Project).filter(Project.id == project_id).first()
    
    # Marquer comme signalé et incrémenter le compteur
    comment.status = CommentStatus.FLAGGED
    comment.flags_count += 1
    comment.updated_at = datetime.utcnow()
    
    # Notifier les modérateurs
    from app.api.notifications import create_notification
    moderators = db.query(User).filter(User.role.in_(['admin', 'moderator'])).all()
    
    for moderator in moderators:
        await create_notification(
            type="moderation",
            title="Commentaire signalé",
            message=f"Un commentaire sur '{project.title}' a été signalé par {current_user.name}",
            recipient_id=str(moderator.id),
            sender_id=str(current_user.id),
            data={
                "project_id": project_id,
                "project_name": project.title,
                "comment_id": comment_id,
                "reason": reason,
                "action": "flag"
            }
        )
    
    # Sauvegarder
    db.commit()
    
    return {
        "message": "Commentaire signalé avec succès",
        "comment_id": comment_id,
        "flags_count": comment.flags_count
    } 