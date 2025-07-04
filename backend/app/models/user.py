"""
Modèle User pour AgoraFlux
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class UserRole(enum.Enum):
    """
    Énumération des rôles utilisateur
    """
    ADMIN = "admin"
    MODERATOR = "moderateur"
    USER = "utilisateur"


class User(Base):
    """
    Modèle utilisateur avec authentification et rôles
    """
    __tablename__ = "users"
    
    # Identification
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Informations personnelles
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Rôle et permissions
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    
    # Statuts
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    
    # Sécurité
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    last_failed_login = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    locked_at = Column(DateTime, nullable=True)
    deactivated_at = Column(DateTime, nullable=True)
    
    # Relations
    projects = relationship("Project", back_populates="owner")
    comments = relationship("Comment", back_populates="author")
    datasets = relationship("Dataset", back_populates="uploaded_by")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role.value})>"
    
    @property
    def full_name(self):
        """Nom complet de l'utilisateur"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_admin(self):
        """Vérifie si l'utilisateur est administrateur"""
        return self.role == UserRole.ADMIN
    
    @property
    def is_moderator(self):
        """Vérifie si l'utilisateur est modérateur"""
        return self.role == UserRole.MODERATOR
    
    @property
    def can_moderate(self):
        """Vérifie si l'utilisateur peut modérer"""
        return self.role in [UserRole.ADMIN, UserRole.MODERATOR] 