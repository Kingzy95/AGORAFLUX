"""
Modèle Project pour AgoraFlux
Gestion des projets de collaboration citoyenne
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ProjectStatus(str, enum.Enum):
    """
    Statut des projets de collaboration
    """
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"


class ProjectVisibility(str, enum.Enum):
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
    
    # Paramètres de collaboration
    allow_comments = Column(Boolean, default=True)
    allow_contributions = Column(Boolean, default=True)
    moderation_enabled = Column(Boolean, default=False)
    
    # Métadonnées temporelles
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Statistiques
    view_count = Column(Integer, default=0)
    contributor_count = Column(Integer, default=0)
    
    # Relations avec d'autres modèles
    datasets = relationship("Dataset", back_populates="project", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="project", cascade="all, delete-orphan")
    # visualizations = relationship("Visualization", back_populates="project")

    def __repr__(self):
        return f"<Project(id={self.id}, title='{self.title}', status='{self.status}')>"
    
    @property
    def is_published(self) -> bool:
        """Vérifie si le projet est publié"""
        return self.status == ProjectStatus.ACTIVE and self.published_at is not None
    
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