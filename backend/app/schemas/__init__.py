"""
Module des schémas Pydantic pour AgoraFlux
Validation et sérialisation des données API
"""

# Schémas utilisateur
from app.schemas.user import (
    UserBase, UserCreate, UserUpdate, UserPasswordChange,
    UserInDB, UserPublic, UserAdmin, UserStats, UserWithStats,
    UserList, UserLogin, UserModerationAction
)

# Schémas projet
from app.schemas.project import (
    ProjectBase, ProjectCreate, ProjectUpdate, ProjectInDB,
    ProjectPublic, ProjectSummary, ProjectStats, ProjectWithStats,
    ProjectList, ProjectStatusUpdate, ProjectContributor, ProjectSearch
)

# Schémas dataset
from app.schemas.dataset import (
    DatasetBase, DatasetCreate, DatasetUpdate, DatasetInDB,
    DatasetPublic, DatasetSummary, DatasetStats, DatasetProcessingConfig,
    DatasetValidationResult, DatasetUpload, DatasetList, DatasetExport,
    DatasetSearch
)

# Schémas commentaire
from app.schemas.comment import (
    CommentBase, CommentCreate, CommentUpdate, CommentInDB,
    CommentPublic, CommentSummary, CommentModeration, CommentReaction,
    CommentThread, CommentList, CommentStats, CommentSearch,
    CommentModerationQueue, CommentExport
)

# Export de tous les schémas
__all__ = [
    # User schemas
    "UserBase", "UserCreate", "UserUpdate", "UserPasswordChange",
    "UserInDB", "UserPublic", "UserAdmin", "UserStats", "UserWithStats",
    "UserList", "UserLogin", "UserModerationAction",
    
    # Project schemas
    "ProjectBase", "ProjectCreate", "ProjectUpdate", "ProjectInDB",
    "ProjectPublic", "ProjectSummary", "ProjectStats", "ProjectWithStats",
    "ProjectList", "ProjectStatusUpdate", "ProjectContributor", "ProjectSearch",
    
    # Dataset schemas
    "DatasetBase", "DatasetCreate", "DatasetUpdate", "DatasetInDB",
    "DatasetPublic", "DatasetSummary", "DatasetStats", "DatasetProcessingConfig",
    "DatasetValidationResult", "DatasetUpload", "DatasetList", "DatasetExport",
    "DatasetSearch",
    
    # Comment schemas
    "CommentBase", "CommentCreate", "CommentUpdate", "CommentInDB",
    "CommentPublic", "CommentSummary", "CommentModeration", "CommentReaction",
    "CommentThread", "CommentList", "CommentStats", "CommentSearch",
    "CommentModerationQueue", "CommentExport"
] 