"""
Modèle Comment pour AgoraFlux
Système de collaboration asynchrone et discussions
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base


class CommentStatus(enum.Enum):
    """
    Statut des commentaires
    """
    ACTIVE = "active"
    HIDDEN = "hidden"
    FLAGGED = "flagged"
    DELETED = "deleted"


class CommentType(enum.Enum):
    """
    Types de commentaires
    """
    COMMENT = "comment"
    SUGGESTION = "suggestion"
    QUESTION = "question"
    ANNOTATION = "annotation"


class Comment(Base):
    """
    Modèle commentaire pour la collaboration asynchrone
    """
    __tablename__ = "comments"
    
    # Identification
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    
    # Type et statut
    type = Column(Enum(CommentType), default=CommentType.COMMENT, nullable=False)
    status = Column(Enum(CommentStatus), default=CommentStatus.ACTIVE, nullable=False)
    
    # Relations
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Thread de discussion
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    thread_depth = Column(Integer, default=0, nullable=False)
    
    # Interactions
    likes_count = Column(Integer, default=0, nullable=False)
    replies_count = Column(Integer, default=0, nullable=False)
    flags_count = Column(Integer, default=0, nullable=False)
    
    # Modération
    is_edited = Column(Boolean, default=False, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_highlighted = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    edited_at = Column(DateTime, nullable=True)
    
    # Relations
    author = relationship("User", back_populates="comments")
    project = relationship("Project", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    
    def __repr__(self):
        return f"<Comment(id={self.id}, type={self.type.value}, author_id={self.author_id})>"
    
    @property
    def is_active(self):
        """Vérifie si le commentaire est actif"""
        return self.status == CommentStatus.ACTIVE
    
    @property
    def is_hidden(self):
        """Vérifie si le commentaire est masqué"""
        return self.status == CommentStatus.HIDDEN
    
    @property
    def is_flagged(self):
        """Vérifie si le commentaire est signalé"""
        return self.status == CommentStatus.FLAGGED
    
    @property
    def is_deleted(self):
        """Vérifie si le commentaire est supprimé"""
        return self.status == CommentStatus.DELETED
    
    @property
    def is_top_level(self):
        """Vérifie si c'est un commentaire de premier niveau"""
        return self.parent_id is None
    
    @property
    def is_reply(self):
        """Vérifie si c'est une réponse"""
        return self.parent_id is not None
    
    @property
    def content_preview(self):
        """Retourne un aperçu du contenu (100 premiers caractères)"""
        if len(self.content) <= 100:
            return self.content
        return self.content[:97] + "..."
    
    def increment_likes(self):
        """Incrémente le nombre de likes"""
        self.likes_count += 1
    
    def decrement_likes(self):
        """Décrémente le nombre de likes"""
        if self.likes_count > 0:
            self.likes_count -= 1
    
    def increment_replies(self):
        """Incrémente le nombre de réponses"""
        self.replies_count += 1
    
    def decrement_replies(self):
        """Décrémente le nombre de réponses"""
        if self.replies_count > 0:
            self.replies_count -= 1
    
    def flag_comment(self):
        """Signale le commentaire"""
        self.flags_count += 1
        if self.flags_count >= 3:  # Seuil pour masquer automatiquement
            self.status = CommentStatus.FLAGGED
    
    def hide_comment(self):
        """Masque le commentaire"""
        self.status = CommentStatus.HIDDEN
    
    def delete_comment(self):
        """Supprime le commentaire"""
        self.status = CommentStatus.DELETED
    
    def restore_comment(self):
        """Restaure le commentaire"""
        self.status = CommentStatus.ACTIVE
    
    def pin_comment(self):
        """Épingle le commentaire"""
        self.is_pinned = True
    
    def unpin_comment(self):
        """Désépingle le commentaire"""
        self.is_pinned = False
    
    def highlight_comment(self):
        """Met en évidence le commentaire"""
        self.is_highlighted = True
    
    def unhighlight_comment(self):
        """Retire la mise en évidence"""
        self.is_highlighted = False
    
    def edit_content(self, new_content: str):
        """Modifie le contenu du commentaire"""
        self.content = new_content
        self.is_edited = True
        self.edited_at = datetime.utcnow() 