"""
Module des modèles de données pour AgoraFlux
Importe tous les modèles pour SQLAlchemy
"""

# Import de tous les modèles pour que SQLAlchemy les reconnaisse
from app.models.user import User, UserRole, UserStatus
from app.models.project import Project, ProjectStatus, ProjectVisibility
from app.models.dataset import Dataset, DatasetType, DatasetStatus, DataQuality
from app.models.comment import Comment, CommentStatus, CommentType

# Export de tous les modèles pour faciliter les imports
__all__ = [
    "User", "UserRole", "UserStatus",
    "Project", "ProjectStatus", "ProjectVisibility", 
    "Dataset", "DatasetType", "DatasetStatus", "DataQuality",
    "Comment", "CommentStatus", "CommentType"
] 