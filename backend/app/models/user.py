"""
Modèle User pour AgoraFlux
Gestion des utilisateurs avec rôles et authentification
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base


class UserRole(str, enum.Enum):
    """
    Énumération des rôles utilisateur selon le cahier des charges
    """
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"


class UserStatus(str, enum.Enum):
    """
    Statut de l'utilisateur
    """
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class User(Base):
    """
    Modèle utilisateur pour la plateforme AgoraFlux
    Support des rôles et de la collaboration citoyenne
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    # Informations de base
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    
    # Authentification
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Rôles et permissions
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    
    # Informations complémentaires
    bio = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    
    # Métadonnées temporelles
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Paramètres de sécurité
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), default=func.now())
    
    # Relations avec d'autres modèles
    projects = relationship("Project", back_populates="owner")
    comments = relationship("Comment", back_populates="author", foreign_keys="Comment.author_id")
    datasets = relationship("Dataset", back_populates="uploaded_by")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
    
    @property
    def is_admin(self) -> bool:
        """Vérifie si l'utilisateur est administrateur"""
        return self.role == UserRole.ADMIN
    
    @property
    def is_moderator(self) -> bool:
        """Vérifie si l'utilisateur est modérateur"""
        return self.role == UserRole.MODERATOR
    
    @property
    def can_moderate(self) -> bool:
        """Vérifie si l'utilisateur peut modérer"""
        return self.role in [UserRole.ADMIN, UserRole.MODERATOR]
    
    @property
    def is_locked(self) -> bool:
        """Vérifie si le compte est verrouillé"""
        if not self.locked_until:
            return False
        return datetime.utcnow() < self.locked_until
    
    def update_last_login(self):
        """Met à jour la dernière connexion"""
        self.last_login = func.now()
        self.failed_login_attempts = 0
        self.locked_until = None 