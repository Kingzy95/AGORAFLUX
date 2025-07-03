"""
Modèle Comment pour AgoraFlux
Système de collaboration asynchrone et discussions
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class CommentStatus(str, enum.Enum):
    """
    Statut des commentaires pour la modération
    """
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    FLAGGED = "flagged"


class CommentType(str, enum.Enum):
    """
    Types de commentaires
    """
    COMMENT = "comment"
    SUGGESTION = "suggestion"
    QUESTION = "question"
    ANNOTATION = "annotation"


class Comment(Base):
    """
    Modèle pour les commentaires et discussions asynchrones
    Support de la modération et des threads selon le cahier des charges
    """
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Contenu
    content = Column(Text, nullable=False)
    comment_type = Column(Enum(CommentType), default=CommentType.COMMENT, nullable=False)
    
    # Relations
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author = relationship("User", foreign_keys=[author_id], back_populates="comments")
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    project = relationship("Project", back_populates="comments")
    
    # Support des threads (commentaires imbriqués)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    parent = relationship("Comment", remote_side=[id], backref="replies")
    
    # Modération
    status = Column(Enum(CommentStatus), default=CommentStatus.APPROVED, nullable=False)
    moderated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    moderated_by = relationship("User", foreign_keys=[moderated_by_id])
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    moderation_reason = Column(Text, nullable=True)
    
    # Métadonnées
    is_edited = Column(Boolean, default=False)
    edit_count = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    
    # Interactions
    like_count = Column(Integer, default=0)
    flag_count = Column(Integer, default=0)
    reply_count = Column(Integer, default=0)
    
    # Informations temporelles
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Métadonnées pour annotations (optionnel)
    annotation_target = Column(String(255), nullable=True)  # ID de l'élément annoté
    annotation_position = Column(String(100), nullable=True)  # Position dans l'interface

    def __repr__(self):
        return f"<Comment(id={self.id}, type='{self.comment_type}')>"
    
    @property
    def is_reply(self) -> bool:
        """Vérifie si c'est une réponse à un autre commentaire"""
        return self.parent_id is not None
    
    @property
    def is_top_level(self) -> bool:
        """Vérifie si c'est un commentaire de premier niveau"""
        return self.parent_id is None
    
    @property
    def needs_moderation(self) -> bool:
        """Vérifie si le commentaire nécessite une modération"""
        return self.status == CommentStatus.PENDING or self.flag_count > 0
    
    @property
    def is_visible(self) -> bool:
        """Vérifie si le commentaire est visible publiquement"""
        return self.status == CommentStatus.APPROVED
    
    def mark_as_edited(self):
        """Marque le commentaire comme édité"""
        self.is_edited = True
        self.edit_count += 1
        self.updated_at = func.now()
    
    def add_like(self):
        """Ajoute un like au commentaire"""
        self.like_count += 1
    
    def remove_like(self):
        """Retire un like du commentaire"""
        if self.like_count > 0:
            self.like_count -= 1
    
    def add_flag(self):
        """Signale le commentaire"""
        self.flag_count += 1
        if self.flag_count >= 3:  # Seuil de modération automatique
            self.status = CommentStatus.FLAGGED
    
    def approve(self, moderator_id: int, reason: str = None):
        """Approuve le commentaire"""
        self.status = CommentStatus.APPROVED
        self.moderated_by_id = moderator_id
        self.moderated_at = func.now()
        self.moderation_reason = reason
    
    def reject(self, moderator_id: int, reason: str):
        """Rejette le commentaire"""
        self.status = CommentStatus.REJECTED
        self.moderated_by_id = moderator_id
        self.moderated_at = func.now()
        self.moderation_reason = reason 