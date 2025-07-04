"""
Modèle Dataset pour AgoraFlux
Gestion des données publiques avec traitement et fusion
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base


class DatasetType(enum.Enum):
    """
    Types de datasets supportés
    """
    CSV = "csv"
    JSON = "json"
    API = "api"
    EXCEL = "excel"


class DatasetStatus(enum.Enum):
    """
    Statut de traitement des datasets
    """
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    ERROR = "error"
    ARCHIVED = "archived"


class DataQuality(str, enum.Enum):
    """
    Évaluation de la qualité des données
    """
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    UNKNOWN = "unknown"


class Dataset(Base):
    """
    Modèle pour les datasets de données publiques
    Support du traitement, nettoyage et fusion selon le cahier des charges
    """
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    
    # Informations de base
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    source_url = Column(String(1000), nullable=True)
    
    # Type et format
    type = Column(Enum(DatasetType), nullable=False)
    file_path = Column(String(500), nullable=True)
    original_filename = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)  # en bytes
    
    # Statut et qualité
    status = Column(Enum(DatasetStatus), default=DatasetStatus.PENDING, nullable=False)
    quality = Column(Enum(DataQuality), default=DataQuality.UNKNOWN, nullable=False)
    
    # Relations
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    project = relationship("Project", back_populates="datasets")
    
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_by = relationship("User", back_populates="datasets")
    
    # Métadonnées de traitement
    rows_count = Column(Integer, nullable=True)
    columns_count = Column(Integer, nullable=True)
    missing_values_count = Column(Integer, nullable=True)
    duplicate_rows_count = Column(Integer, nullable=True)
    
    # Statistiques de qualité (pourcentages)
    completeness_score = Column(Float, nullable=True)  # % de données complètes
    consistency_score = Column(Float, nullable=True)   # % de cohérence
    validity_score = Column(Float, nullable=True)      # % de validité
    overall_quality_score = Column(Float, nullable=True)  # % de qualité globale
    
    # Configuration de traitement
    processing_config = Column(JSON, nullable=True)
    validation_rules = Column(JSON, nullable=True)
    
    # Métadonnées des colonnes
    column_metadata = Column(JSON, nullable=True)  # Types, distributions, etc.
    
    # Informations temporelles
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    last_accessed = Column(DateTime, nullable=True)
    
    # Logs de traitement
    processing_log = Column(Text, nullable=True)
    error_log = Column(Text, nullable=True)
    
    # Configuration d'export
    is_exportable = Column(Boolean, default=True)
    export_formats = Column(String(255), default="csv,json")  # Formats supportés
    
    def __repr__(self):
        return f"<Dataset(id={self.id}, name='{self.name}', type='{self.type.value}', status='{self.status}')>"
    
    @property
    def is_processed(self) -> bool:
        """Vérifie si le dataset a été traité"""
        return self.status in [DatasetStatus.PROCESSED, DatasetStatus.ARCHIVED]
    
    @property
    def is_processing(self) -> bool:
        """Vérifie si le dataset est en cours de traitement"""
        return self.status == DatasetStatus.PROCESSING
    
    @property
    def has_error(self) -> bool:
        """Vérifie si le dataset a des erreurs"""
        return self.status == DatasetStatus.ERROR or bool(self.error_log)
    
    @property
    def file_size_mb(self) -> float:
        """Retourne la taille du fichier en MB"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return 0
    
    @property
    def quality_grade(self) -> str:
        """Retourne une note de qualité basée sur le score global"""
        if not self.overall_quality_score:
            return "Non évalué"
        
        if self.overall_quality_score >= 90:
            return "Excellent"
        elif self.overall_quality_score >= 80:
            return "Très bon"
        elif self.overall_quality_score >= 70:
            return "Bon"
        elif self.overall_quality_score >= 60:
            return "Acceptable"
        else:
            return "Médiocre"
    
    def update_quality_scores(self, completeness: float, consistency: float, validity: float):
        """Met à jour les scores de qualité des données"""
        self.completeness_score = completeness
        self.consistency_score = consistency
        self.validity_score = validity
        self.overall_quality_score = (completeness + consistency + validity) / 3
        
        # Détermine la qualité globale
        overall = self.overall_quality_score
        if overall >= 90:
            self.quality = DataQuality.EXCELLENT
        elif overall >= 75:
            self.quality = DataQuality.GOOD
        elif overall >= 50:
            self.quality = DataQuality.FAIR
        else:
            self.quality = DataQuality.POOR
    
    def mark_as_processed(self):
        """Marque le dataset comme traité"""
        self.status = DatasetStatus.PROCESSED
        self.processed_at = datetime.utcnow()
    
    def mark_as_error(self):
        """Marque le dataset comme ayant une erreur"""
        self.status = DatasetStatus.ERROR
    
    def update_access_time(self):
        """Met à jour le timestamp de dernier accès"""
        self.last_accessed = datetime.utcnow()
    
    @property
    def export_format_list(self) -> list:
        """Retourne la liste des formats d'export supportés"""
        if not self.export_formats:
            return []
        return [fmt.strip() for fmt in self.export_formats.split(",")]
    
    def add_processing_log(self, message: str):
        """Ajoute une entrée au log de traitement"""
        timestamp = func.now()
        log_entry = f"[{timestamp}] {message}"
        if self.processing_log:
            self.processing_log += f"\n{log_entry}"
        else:
            self.processing_log = log_entry 