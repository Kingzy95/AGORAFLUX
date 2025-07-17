"""
Modèle Project pour AgoraFlux
Gestion des projets de collaboration citoyenne
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class ProjectStatus(enum.Enum):
    """
    Statut des projets
    """
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"


class ProjectVisibility(enum.Enum):
    """
    Visibilité des projets
    """
    PUBLIC = "public"
    PRIVATE = "private"
    RESTRICTED = "restricted"


class Project(Base):
    """
    Modèle pour les projets de collaboration citoyenne
    Intègre données publiques et simulation
    """
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    
    # Informations de base
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    
    # Métadonnées
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT, nullable=False)
    visibility = Column(Enum(ProjectVisibility), default=ProjectVisibility.PUBLIC, nullable=False)
    
    # Relations utilisateur
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="projects")
    
    # Configuration du projet
    tags = Column(String(500), nullable=True)  # Tags séparés par virgules
    objectives = Column(Text, nullable=True)
    methodology = Column(Text, nullable=True)
    expected_outcomes = Column(Text, nullable=True)
    
    # Paramètres de collaboration
    allow_comments = Column(Boolean, default=True)
    allow_contributions = Column(Boolean, default=True)
    moderation_enabled = Column(Boolean, default=False)
    
    # Métadonnées temporelles
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    archived_at = Column(DateTime, nullable=True)
    
    # Statistiques
    view_count = Column(Integer, default=0)
    contributor_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    datasets_count = Column(Integer, default=0)
    
    # Relations avec d'autres modèles
    datasets = relationship("Dataset", back_populates="project", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="project", cascade="all, delete-orphan")
    permissions = relationship("ProjectPermission", back_populates="project", cascade="all, delete-orphan")
    # visualizations = relationship("Visualization", back_populates="project")

    def __repr__(self):
        return f"<Project(id={self.id}, title='{self.title}', status='{self.status.value}')>"
    
    @property
    def is_published(self) -> bool:
        """Vérifie si le projet est publié"""
        return self.status == ProjectStatus.ACTIVE and self.published_at is not None
    
    @property
    def is_public(self):
        """Vérifie si le projet est public"""
        return self.visibility == ProjectVisibility.PUBLIC
    
    @property
    def is_active(self):
        """Vérifie si le projet est actif"""
        return self.status == ProjectStatus.ACTIVE
    
    @property
    def is_completed(self):
        """Vérifie si le projet est terminé"""
        return self.status == ProjectStatus.COMPLETED
    
    @property
    def tag_list(self) -> list:
        """Retourne la liste des tags"""
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(",") if tag.strip()]
    
    def add_tag(self, tag: str):
        """Ajoute un tag au projet"""
        current_tags = self.tag_list
        if tag not in current_tags:
            current_tags.append(tag)
            self.tags = ", ".join(current_tags)
    
    def remove_tag(self, tag: str):
        """Supprime un tag du projet"""
        current_tags = self.tag_list
        if tag in current_tags:
            current_tags.remove(tag)
            self.tags = ", ".join(current_tags)
    
    def increment_view(self):
        """Incrémente le compteur de vues"""
        self.view_count += 1
    
    def increment_views(self):
        """Incrémente le compteur de vues"""
        self.views_count += 1 