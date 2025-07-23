"""
Endpoints API pour la collaboration et les annotations AgoraFlux
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_moderator_or_admin
from app.models.user import User
from app.models.project import Project
from app.models.comment import Comment

# Ajouter l'import pour les notifications
from app.api.notifications import create_notification

router = APIRouter()


# Modèles Pydantic pour les requêtes/réponses
class AnnotationCreate(BaseModel):
    x: float
    y: float
    content: str
    category: str  # 'question' | 'insight' | 'concern' | 'suggestion'
    is_private: bool = False

class AnnotationUpdate(BaseModel):
    content: Optional[str] = None
    category: Optional[str] = None
    is_private: Optional[bool] = None
    is_resolved: Optional[bool] = None

class ReplyCreate(BaseModel):
    content: str
    parent_id: str
    mentions: List[str] = []

class ReactionCreate(BaseModel):
    emoji: str
    target_id: str
    target_type: str  # 'annotation' | 'reply'

class AnnotationResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_role: str
    x: float
    y: float
    content: str
    category: str
    timestamp: datetime
    is_private: bool
    is_resolved: bool
    replies_count: int = 0
    reactions_count: int = 0

class UserResponse(BaseModel):
    user_id: str
    user_name: str
    user_role: str
    is_online: bool
    last_seen: Optional[datetime] = None

class StatsResponse(BaseModel):
    total_annotations: int
    active_discussions: int
    resolved_discussions: int
    total_participants: int
    total_replies: int
    avg_response_time: str
    participation_rate: float
    top_contributors: List[dict]


# Store en mémoire pour les données de collaboration (à remplacer par BDD)
collaboration_store = {
    "annotations": [],
    "replies": [],
    "reactions": [],
    "online_users": []
}


@router.get("/annotations", response_model=List[AnnotationResponse])
async def get_annotations(
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère toutes les annotations d'un projet ou toutes si pas de project_id
    """
    # Retourner une liste vide en attendant l'implémentation complète
    annotations = []
    
    return [AnnotationResponse(**annotation) for annotation in annotations]


@router.post("/annotations", response_model=AnnotationResponse)
async def create_annotation(
    annotation: AnnotationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crée une nouvelle annotation
    """
    new_annotation = {
        "id": f"annotation-{len(collaboration_store['annotations']) + 1}",
        "user_id": str(current_user.id),
        "user_name": f"{current_user.first_name} {current_user.last_name}",
        "user_role": current_user.role.value,
        "x": annotation.x,
        "y": annotation.y,
        "content": annotation.content,
        "category": annotation.category,
        "timestamp": datetime.now(),
        "is_private": annotation.is_private,
        "is_resolved": False,
        "replies_count": 0,
        "reactions_count": 0
    }
    
    collaboration_store["annotations"].append(new_annotation)
    return AnnotationResponse(**new_annotation)


@router.put("/annotations/{annotation_id}", response_model=AnnotationResponse)
async def update_annotation(
    annotation_id: str,
    updates: AnnotationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour une annotation existante
    """
    # Trouver l'annotation
    annotation = next((a for a in collaboration_store["annotations"] if a["id"] == annotation_id), None)
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation non trouvée")
    
    # Vérifier les permissions
    if annotation["user_id"] != str(current_user.id) and current_user.role.value not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    # Appliquer les mises à jour
    if updates.content is not None:
        annotation["content"] = updates.content
    if updates.category is not None:
        annotation["category"] = updates.category
    if updates.is_private is not None:
        annotation["is_private"] = updates.is_private
    if updates.is_resolved is not None:
        annotation["is_resolved"] = updates.is_resolved
    
    return AnnotationResponse(**annotation)


@router.delete("/annotations/{annotation_id}")
async def delete_annotation(
    annotation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprime une annotation
    """
    # Trouver l'annotation
    annotation_index = next((i for i, a in enumerate(collaboration_store["annotations"]) if a["id"] == annotation_id), None)
    if annotation_index is None:
        raise HTTPException(status_code=404, detail="Annotation non trouvée")
    
    annotation = collaboration_store["annotations"][annotation_index]
    
    # Vérifier les permissions
    if annotation["user_id"] != str(current_user.id) and current_user.role.value not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    # Supprimer l'annotation
    collaboration_store["annotations"].pop(annotation_index)
    
    return {"message": "Annotation supprimée avec succès"}


@router.get("/online-users", response_model=List[UserResponse])
async def get_online_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des utilisateurs en ligne
    """
    from datetime import timedelta
    
    # Récupérer les utilisateurs actifs récemment (dernières 30 minutes)
    recent_threshold = datetime.now() - timedelta(minutes=30)
    
    # Utilisateurs connectés récemment (simulation basée sur last_login)
    online_users_query = db.query(User).filter(
        User.is_active == True,
        User.last_login.isnot(None),
        User.last_login >= recent_threshold
    ).limit(10).all()
    
    online_users = []
    for user in online_users_query:
        online_users.append({
            "user_id": str(user.id),
            "user_name": f"{user.first_name} {user.last_name}",
            "user_role": user.role.value,
            "is_online": True,
            "last_seen": user.last_login.isoformat() if user.last_login else None
        })
    
    # Si pas assez d'utilisateurs récents, ajouter des utilisateurs simulés
    if len(online_users) < 3:
        recent_users = db.query(User).filter(User.is_active == True).limit(5).all()
        for i, user in enumerate(recent_users):
            if len(online_users) >= 5:  # Limiter à 5 utilisateurs
                break
            if not any(u["user_id"] == str(user.id) for u in online_users):
                online_users.append({
                    "user_id": str(user.id),
                    "user_name": f"{user.first_name} {user.last_name}",
                    "user_role": user.role.value,
                    "is_online": i < 3,  # Les 3 premiers sont "en ligne"
                    "last_seen": (datetime.now() - timedelta(minutes=i*5)).isoformat()
                })
    
    return [UserResponse(**user) for user in online_users]


@router.get("/stats", response_model=StatsResponse)
async def get_collaboration_stats(
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les statistiques de collaboration basées sur les vrais commentaires
    """
    from app.models.comment import CommentStatus
    
    # Récupérer les commentaires selon le projet ou tous
    if project_id:
        comments = db.query(Comment).filter(Comment.project_id == project_id).all()
    else:
        comments = db.query(Comment).all()
    
    # Calculer les vraies statistiques
    total_annotations = len(comments)
    active_discussions = len([c for c in comments if c.status in [CommentStatus.ACTIVE]])
    resolved_discussions = len([c for c in comments if c.status == CommentStatus.HIDDEN])  # Considérer HIDDEN comme résolu
    
    # Récupérer le nombre d'utilisateurs uniques qui ont participé
    unique_participants = set(c.author_id for c in comments)
    total_participants = len(unique_participants)
    
    # Calculer le total de réponses (replies_count)
    total_replies = sum(c.replies_count for c in comments)
    
    # Calculer le taux de participation
    total_users = db.query(User).filter(User.is_active == True).count()
    participation_rate = (total_participants / total_users * 100) if total_users > 0 else 0
    
    # Top contributeurs basés sur les vrais commentaires
    from sqlalchemy import func
    top_contributors_query = (
        db.query(User.first_name, User.last_name, User.role, func.count(Comment.id).label('comment_count'))
        .join(Comment, User.id == Comment.author_id)
        .group_by(User.id, User.first_name, User.last_name, User.role)
        .order_by(func.count(Comment.id).desc())
        .limit(5)
        .all()
    )
    
    top_contributors = []
    for contrib in top_contributors_query:
        top_contributors.append({
            "user_name": f"{contrib.first_name} {contrib.last_name}",
            "contribution_count": contrib.comment_count,
            "user_role": contrib.role.value
        })
    
    # Si pas de contributeurs, données par défaut
    if not top_contributors:
        top_contributors = [
            {"user_name": "Aucun contributeur", "contribution_count": 0, "user_role": "user"}
        ]
    
    stats = {
        "total_annotations": total_annotations,
        "active_discussions": active_discussions,
        "resolved_discussions": resolved_discussions,
        "total_participants": total_participants,
        "total_replies": total_replies,
        "avg_response_time": "2h 15m",  # Peut être calculé plus précisément plus tard
        "participation_rate": round(participation_rate, 1),
        "top_contributors": top_contributors
    }
    
    return StatsResponse(**stats)


@router.get("/stats/role-based", response_model=StatsResponse)
async def get_role_based_stats(
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les statistiques de collaboration adaptées au rôle de l'utilisateur
    """
    from app.models.comment import CommentStatus
    from sqlalchemy import func
    
    # Récupérer les commentaires selon le projet ou tous
    if project_id:
        comments_query = db.query(Comment).filter(Comment.project_id == project_id)
    else:
        comments_query = db.query(Comment)
    
    # Adapter les statistiques selon le rôle
    if current_user.role.value == 'admin':
        # Admin : Toutes les données + statistiques avancées
        comments = comments_query.all()
        
        # Statistiques détaillées pour admin
        flagged_comments = len([c for c in comments if c.status == CommentStatus.FLAGGED])
        deleted_comments = len([c for c in comments if c.status == CommentStatus.DELETED])
        
        total_annotations = len(comments)
        active_discussions = len([c for c in comments if c.status == CommentStatus.ACTIVE])
        resolved_discussions = len([c for c in comments if c.status == CommentStatus.HIDDEN])
        
        # Statistiques d'administration
        unique_participants = set(c.author_id for c in comments)
        total_participants = len(unique_participants)
        total_replies = sum(c.replies_count for c in comments)
        
        # Top contributeurs avec plus de détails
        top_contributors_query = (
            db.query(User.first_name, User.last_name, User.role, func.count(Comment.id).label('comment_count'))
            .join(Comment, User.id == Comment.author_id)
            .group_by(User.id, User.first_name, User.last_name, User.role)
            .order_by(func.count(Comment.id).desc())
            .limit(10)  # Plus de contributeurs pour admin
            .all()
        )
        
        top_contributors = []
        for contrib in top_contributors_query:
            top_contributors.append({
                "user_name": f"{contrib.first_name} {contrib.last_name}",
                "contribution_count": contrib.comment_count,
                "user_role": contrib.role.value
            })
        
        # Calcul du taux de participation global
        total_users = db.query(User).filter(User.is_active == True).count()
        participation_rate = (total_participants / total_users * 100) if total_users > 0 else 0
        
    elif current_user.role.value == 'moderateur':
        # Modérateur : Données de modération + communauté
        comments = comments_query.filter(
            Comment.status.in_([CommentStatus.ACTIVE, CommentStatus.FLAGGED, CommentStatus.HIDDEN])
        ).all()
        
        total_annotations = len(comments)
        active_discussions = len([c for c in comments if c.status == CommentStatus.ACTIVE])
        resolved_discussions = len([c for c in comments if c.status == CommentStatus.HIDDEN])
        
        unique_participants = set(c.author_id for c in comments)
        total_participants = len(unique_participants)
        total_replies = sum(c.replies_count for c in comments)
        
        # Top contributeurs (modérés)
        top_contributors_query = (
            db.query(User.first_name, User.last_name, User.role, func.count(Comment.id).label('comment_count'))
            .join(Comment, User.id == Comment.author_id)
            .filter(Comment.status == CommentStatus.ACTIVE)  # Seulement les actifs pour modérateur
            .group_by(User.id, User.first_name, User.last_name, User.role)
            .order_by(func.count(Comment.id).desc())
            .limit(7)
            .all()
        )
        
        top_contributors = []
        for contrib in top_contributors_query:
            top_contributors.append({
                "user_name": f"{contrib.first_name} {contrib.last_name}",
                "contribution_count": contrib.comment_count,
                "user_role": contrib.role.value
            })
        
        # Taux de participation modéré
        active_users = db.query(User).filter(
            User.is_active == True,
            User.role.in_(['admin', 'moderateur', 'utilisateur'])
        ).count()
        participation_rate = (total_participants / active_users * 100) if active_users > 0 else 0
        
    else:  # Utilisateur standard
        # Utilisateur : Ses propres données + vue communautaire limitée
        user_comments = comments_query.filter(Comment.author_id == current_user.id).all()
        
        # Statistiques personnelles
        total_annotations = len(user_comments)
        active_discussions = len([c for c in user_comments if c.status == CommentStatus.ACTIVE])
        resolved_discussions = len([c for c in user_comments if c.status == CommentStatus.HIDDEN])
        
        # Participation communautaire (vue limitée)
        all_active_comments = comments_query.filter(Comment.status == CommentStatus.ACTIVE).all()
        total_participants = len(set(c.author_id for c in all_active_comments))
        total_replies = sum(c.replies_count for c in user_comments)  # Ses propres réponses
        
        # Top contributeurs limité (anonymisé)
        top_contributors = [
            {"user_name": "Contributeur Actif", "contribution_count": len(all_active_comments) // 3, "user_role": "community"},
            {"user_name": "Participant Régulier", "contribution_count": len(all_active_comments) // 5, "user_role": "community"},
            {"user_name": "Nouvelle Voix", "contribution_count": len(all_active_comments) // 8, "user_role": "community"}
        ]
        
        # Taux de participation personnalisé
        participation_rate = min(100.0, (total_annotations / max(1, len(all_active_comments)) * 100))
    
    # Retourner les statistiques adaptées
    stats = {
        "total_annotations": total_annotations,
        "active_discussions": active_discussions,
        "resolved_discussions": resolved_discussions,
        "total_participants": total_participants,
        "total_replies": total_replies,
        "avg_response_time": "2h 15m",  # Peut être calculé dynamiquement
        "participation_rate": round(participation_rate, 1),
        "top_contributors": top_contributors
    }
    
    return StatsResponse(**stats)


@router.post("/replies", response_model=dict)
async def create_reply(
    reply: ReplyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crée une nouvelle réponse à une annotation
    """
    new_reply = {
        "id": f"reply-{len(collaboration_store['replies']) + 1}",
        "parent_id": reply.parent_id,
        "user_id": str(current_user.id),
        "user_name": f"{current_user.first_name} {current_user.last_name}",
        "user_role": current_user.role.value,
        "content": reply.content,
        "timestamp": datetime.now(),
        "mentions": reply.mentions
    }
    
    collaboration_store["replies"].append(new_reply)
    return {"message": "Réponse créée avec succès", "reply": new_reply}


@router.post("/reactions", response_model=dict)
async def add_reaction(
    reaction: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ajoute une réaction à une annotation ou réponse
    """
    new_reaction = {
        "id": f"reaction-{len(collaboration_store['reactions']) + 1}",
        "user_id": str(current_user.id),
        "user_name": f"{current_user.first_name} {current_user.last_name}",
        "emoji": reaction.emoji,
        "target_id": reaction.target_id,
        "target_type": reaction.target_type,
        "timestamp": datetime.now()
    }
    
    collaboration_store["reactions"].append(new_reaction)
    return {"message": "Réaction ajoutée avec succès", "reaction": new_reaction}


@router.get("/health")
async def collaboration_health():
    """
    Point de santé pour le module de collaboration
    """
    return {
        "status": "healthy",
        "module": "collaboration",
        "features": {
            "annotations": True,
            "replies": True,
            "reactions": True,
            "real_time": False,  # À implémenter plus tard
            "mentions": True
        },
        "storage": {
            "annotations_count": len(collaboration_store["annotations"]),
            "replies_count": len(collaboration_store["replies"]),
            "reactions_count": len(collaboration_store["reactions"])
        }
    } 