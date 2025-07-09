"""
Schémas Pydantic pour les projets
Validation et sérialisation des projets de collaboration citoyenne
"""

from pydantic import BaseModel, validator, Field
from typing import Optional, List
from datetime import datetime

from app.models.project import ProjectStatus, ProjectVisibility
from app.schemas.user import UserPublic


class ProjectBase(BaseModel):
    """Schéma de base pour les projets"""
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=20, max_length=5000)
    objectives: Optional[str] = Field(None, max_length=2000)
    methodology: Optional[str] = Field(None, max_length=2000)
    expected_outcomes: Optional[str] = Field(None, max_length=2000)
    tags: Optional[str] = Field(None, max_length=500)
    visibility: ProjectVisibility = ProjectVisibility.PUBLIC
    allow_comments: bool = True
    allow_contributions: bool = True
    moderation_enabled: bool = False

    @validator('tags')
    def validate_tags(cls, v):
        if v:
            # Vérifier que les tags sont séparés par des virgules
            tags = [tag.strip() for tag in v.split(',') if tag.strip()]
            if len(tags) > 10:
                raise ValueError('Maximum 10 tags autorisés')
            for tag in tags:
                if len(tag) < 2 or len(tag) > 50:
                    raise ValueError('Chaque tag doit contenir entre 2 et 50 caractères')
            return ', '.join(tags)
        return v


class ProjectCreate(ProjectBase):
    """Schéma pour la création d'un projet"""
    
    @validator('title')
    def generate_slug(cls, v):
        # Le slug sera généré automatiquement côté serveur
        return v
    
    @property
    def tag_list(self) -> List[str]:
        """Retourne la liste des tags"""
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]


class ProjectUpdate(BaseModel):
    """Schéma pour la mise à jour d'un projet"""
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    description: Optional[str] = Field(None, min_length=20, max_length=5000)
    objectives: Optional[str] = Field(None, max_length=2000)
    methodology: Optional[str] = Field(None, max_length=2000)
    expected_outcomes: Optional[str] = Field(None, max_length=2000)
    tags: Optional[str] = Field(None, max_length=500)
    visibility: Optional[ProjectVisibility] = None
    allow_comments: Optional[bool] = None
    allow_contributions: Optional[bool] = None
    moderation_enabled: Optional[bool] = None

    @validator('tags')
    def validate_tags(cls, v):
        if v is not None:
            tags = [tag.strip() for tag in v.split(',') if tag.strip()]
            if len(tags) > 10:
                raise ValueError('Maximum 10 tags autorisés')
            for tag in tags:
                if len(tag) < 2 or len(tag) > 50:
                    raise ValueError('Chaque tag doit contenir entre 2 et 50 caractères')
            return ', '.join(tags)
        return v


class ProjectInDB(ProjectBase):
    """Schéma pour les projets en base de données"""
    id: int
    slug: str
    status: ProjectStatus
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    view_count: int
    contributor_count: int

    class Config:
        from_attributes = True


class ProjectPublic(BaseModel):
    """Schéma public pour les projets"""
    id: int
    title: str
    slug: str
    description: str
    status: ProjectStatus
    visibility: ProjectVisibility
    objectives: Optional[str]
    methodology: Optional[str]
    expected_outcomes: Optional[str]
    tags: Optional[str]
    allow_comments: bool
    allow_contributions: bool
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    view_count: int
    contributor_count: int
    owner: UserPublic

    class Config:
        from_attributes = True

    @property
    def tag_list(self) -> List[str]:
        """Retourne la liste des tags"""
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]


class ProjectSummary(BaseModel):
    """Résumé de projet pour les listes"""
    id: int
    title: str
    slug: str
    description: str
    status: ProjectStatus
    visibility: ProjectVisibility
    tags: Optional[str]
    created_at: datetime
    view_count: int
    contributor_count: int
    owner: UserPublic

    class Config:
        from_attributes = True

    @property
    def description_preview(self) -> str:
        """Version tronquée de la description"""
        if len(self.description) <= 200:
            return self.description
        return self.description[:200] + "..."


class ProjectStats(BaseModel):
    """Statistiques d'un projet"""
    datasets_count: int = 0
    comments_count: int = 0
    contributors_count: int = 0
    views_count: int = 0
    likes_count: int = 0
    last_activity: Optional[datetime] = None


class ProjectWithStats(ProjectPublic):
    """Projet avec ses statistiques"""
    stats: ProjectStats


class ProjectList(BaseModel):
    """Liste paginée de projets"""
    projects: List[ProjectSummary]
    total: int
    page: int
    per_page: int
    pages: int


class ProjectStatusUpdate(BaseModel):
    """Mise à jour du statut d'un projet"""
    status: ProjectStatus
    reason: Optional[str] = Field(None, max_length=500)


class ProjectContributor(BaseModel):
    """Contributeur d'un projet"""
    user: UserPublic
    contributions_count: int
    first_contribution: datetime
    last_contribution: datetime
    role: str = "contributor"  # contributor, maintainer, etc.


class ProjectSearch(BaseModel):
    """Paramètres de recherche de projets"""
    q: Optional[str] = Field(None, max_length=100)  # Terme de recherche
    tags: Optional[str] = None  # Tags filtrés
    status: Optional[ProjectStatus] = None
    visibility: Optional[ProjectVisibility] = None
    owner_id: Optional[int] = None
    sort_by: str = Field("created_at", pattern="^(created_at|updated_at|view_count|contributor_count|title)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100) 