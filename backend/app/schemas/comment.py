"""
Schémas Pydantic pour les commentaires
Validation et sérialisation de la collaboration asynchrone
"""

from pydantic import BaseModel, validator, Field
from typing import Optional, List
from datetime import datetime

from app.models.comment import CommentStatus, CommentType
from app.schemas.user import UserPublic


class CommentBase(BaseModel):
    """Schéma de base pour les commentaires"""
    content: str = Field(..., min_length=1, max_length=5000)
    comment_type: CommentType = CommentType.COMMENT
    annotation_target: Optional[str] = Field(None, max_length=255)
    annotation_position: Optional[str] = Field(None, max_length=100)

    @validator('content')
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError('Le contenu du commentaire ne peut pas être vide')
        return v.strip()

    @validator('annotation_target')
    def validate_annotation_target(cls, v, values):
        if v and values.get('comment_type') != CommentType.ANNOTATION:
            raise ValueError('annotation_target ne peut être défini que pour les annotations')
        return v


class CommentCreate(CommentBase):
    """Schéma pour la création d'un commentaire"""
    project_id: int
    parent_id: Optional[int] = None  # Pour les réponses


class CommentUpdate(BaseModel):
    """Schéma pour la mise à jour d'un commentaire"""
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    
    @validator('content')
    def validate_content(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Le contenu du commentaire ne peut pas être vide')
        return v.strip() if v else None


class CommentInDB(CommentBase):
    """Schéma pour les commentaires en base de données"""
    id: int
    author_id: int
    project_id: int
    parent_id: Optional[int]
    status: CommentStatus
    moderated_by_id: Optional[int]
    moderated_at: Optional[datetime]
    moderation_reason: Optional[str]
    is_edited: bool
    edit_count: int
    is_pinned: bool
    like_count: int
    flag_count: int
    reply_count: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class CommentPublic(BaseModel):
    """Schéma public pour les commentaires"""
    id: int
    content: str
    comment_type: CommentType
    author: UserPublic
    project_id: int
    parent_id: Optional[int]
    status: CommentStatus
    is_edited: bool
    edit_count: int
    is_pinned: bool
    like_count: int
    flag_count: int
    reply_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    annotation_target: Optional[str]
    annotation_position: Optional[str]
    
    # Relations
    replies: List['CommentPublic'] = []  # Commentaires enfants

    class Config:
        from_attributes = True

    @property
    def is_reply(self) -> bool:
        """Vérifie si c'est une réponse"""
        return self.parent_id is not None

    @property
    def needs_moderation(self) -> bool:
        """Vérifie si le commentaire nécessite une modération"""
        return self.status == CommentStatus.PENDING or self.flag_count > 0

    @property
    def age_in_minutes(self) -> int:
        """Âge du commentaire en minutes"""
        return int((datetime.utcnow() - self.created_at).total_seconds() / 60)


class CommentSummary(BaseModel):
    """Résumé de commentaire pour les listes"""
    id: int
    content: str
    comment_type: CommentType
    author: UserPublic
    status: CommentStatus
    like_count: int
    reply_count: int
    created_at: datetime
    is_pinned: bool

    class Config:
        from_attributes = True

    @property
    def content_preview(self) -> str:
        """Version tronquée du contenu"""
        if len(self.content) <= 100:
            return self.content
        return self.content[:100] + "..."


class CommentModeration(BaseModel):
    """Informations de modération d'un commentaire"""
    comment_id: int
    status: CommentStatus
    reason: Optional[str] = Field(None, max_length=500)


class CommentReaction(BaseModel):
    """Réaction à un commentaire (like/flag)"""
    comment_id: int
    action: str = Field(..., pattern="^(like|unlike|flag|unflag)$")


class CommentThread(BaseModel):
    """Thread de commentaires avec réponses"""
    parent: CommentPublic
    replies: List[CommentPublic]
    total_replies: int


class CommentList(BaseModel):
    """Liste paginée de commentaires"""
    comments: List[CommentPublic]
    total: int
    page: int
    per_page: int
    pages: int


class CommentStats(BaseModel):
    """Statistiques des commentaires d'un projet"""
    total_comments: int = 0
    pending_moderation: int = 0
    flagged_comments: int = 0
    top_contributors: List[UserPublic] = []
    recent_activity: List[CommentSummary] = []


class CommentSearch(BaseModel):
    """Paramètres de recherche de commentaires"""
    q: Optional[str] = Field(None, max_length=100)  # Terme de recherche
    project_id: Optional[int] = None
    author_id: Optional[int] = None
    comment_type: Optional[CommentType] = None
    status: Optional[CommentStatus] = None
    parent_id: Optional[int] = None  # Pour filtrer réponses/commentaires principaux
    min_likes: Optional[int] = Field(None, ge=0)
    is_pinned: Optional[bool] = None
    sort_by: str = Field("created_at", pattern="^(created_at|like_count|reply_count)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)


class CommentModerationQueue(BaseModel):
    """File d'attente de modération"""
    pending_comments: List[CommentPublic]
    flagged_comments: List[CommentPublic]
    total_pending: int
    total_flagged: int


class CommentExport(BaseModel):
    """Configuration d'export des commentaires"""
    project_id: int
    format: str = Field("csv", pattern="^(csv|json|xlsx)$")
    include_replies: bool = True
    include_metadata: bool = False
    status_filter: Optional[CommentStatus] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


# Mise à jour des références forward
CommentPublic.update_forward_refs() 