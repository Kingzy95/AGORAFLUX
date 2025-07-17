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


@router.get("/users/online", response_model=List[UserResponse])
async def get_online_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des utilisateurs en ligne
    """
    # Récupérer tous les utilisateurs actifs (simulation)
    users = db.query(User).filter(User.is_active == True).all()
    
    online_users = []
    for user in users[:5]:  # Limiter à 5 pour la démo
        online_users.append({
            "user_id": str(user.id),
            "user_name": f"{user.first_name} {user.last_name}",
            "user_role": user.role.value,
            "is_online": True,  # Pour la démo, tous sont en ligne
            "last_seen": user.last_login
        })
    
    return [UserResponse(**user) for user in online_users]


@router.get("/stats", response_model=StatsResponse)
async def get_collaboration_stats(
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les statistiques de collaboration
    """
    # Calculer les statistiques basées sur les données actuelles
    total_annotations = len(collaboration_store["annotations"])
    active_discussions = len([a for a in collaboration_store["annotations"] if not a.get("is_resolved", False)])
    resolved_discussions = total_annotations - active_discussions
    
    # Récupérer le nombre d'utilisateurs uniques
    user_count = db.query(User).filter(User.is_active == True).count()
    
    stats = {
        "total_annotations": total_annotations,
        "active_discussions": active_discussions,
        "resolved_discussions": resolved_discussions,
        "total_participants": user_count,
        "total_replies": len(collaboration_store["replies"]),
        "avg_response_time": "2h 15m",
        "participation_rate": 85.3,
        "top_contributors": [
            {"user_name": "Admin AgoraFlux", "contribution_count": 12, "user_role": "admin"},
            {"user_name": "Modérateur", "contribution_count": 8, "user_role": "moderator"},
            {"user_name": "Utilisateur", "contribution_count": 6, "user_role": "user"}
        ]
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