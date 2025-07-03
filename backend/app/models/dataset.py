"""
Modèle Dataset pour AgoraFlux
Gestion des données publiques avec traitement et fusion
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class DatasetType(str, enum.Enum):
    """
    Types de datasets supportés
    """
    CSV = "csv"
    JSON = "json"
    API = "api"
    EXCEL = "excel"


class DatasetStatus(str, enum.Enum):
    """
    Statut de traitement des datasets
    """
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    ERROR = "error"
    VALIDATED = "validated"


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
    description = Column(Text, nullable=True)
    source_url = Column(String(500), nullable=True)
    
    # Type et format
    dataset_type = Column(Enum(DatasetType), nullable=False)
    file_path = Column(String(500), nullable=True)
    original_filename = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)  # en bytes
    
    # Statut et qualité
    status = Column(Enum(DatasetStatus), default=DatasetStatus.UPLOADED, nullable=False)
    quality = Column(Enum(DataQuality), default=DataQuality.UNKNOWN, nullable=False)
    
    # Relations
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    project = relationship("Project", back_populates="datasets")
    
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_by = relationship("User", back_populates="datasets")
    
    # Métadonnées de traitement
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    missing_values_count = Column(Integer, nullable=True)
    duplicate_rows_count = Column(Integer, nullable=True)
    
    # Statistiques de qualité (pourcentages)
    completeness_score = Column(Float, nullable=True)  # % de données complètes
    consistency_score = Column(Float, nullable=True)   # % de cohérence
    validity_score = Column(Float, nullable=True)      # % de validité
    
    # Configuration de traitement
    processing_config = Column(JSON, nullable=True)
    validation_rules = Column(JSON, nullable=True)
    
    # Métadonnées des colonnes
    column_metadata = Column(JSON, nullable=True)  # Types, distributions, etc.
    
    # Informations temporelles
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Logs de traitement
    processing_log = Column(Text, nullable=True)
    error_log = Column(Text, nullable=True)
    
    # Configuration d'export
    is_exportable = Column(Boolean, default=True)
    export_formats = Column(String(255), default="csv,json")  # Formats supportés
    
    def __repr__(self):
        return f"<Dataset(id={self.id}, name='{self.name}', type='{self.dataset_type}', status='{self.status}')>"
    
    @property
    def is_processed(self) -> bool:
        """Vérifie si le dataset a été traité"""
        return self.status in [DatasetStatus.PROCESSED, DatasetStatus.VALIDATED]
    
    @property
    def has_errors(self) -> bool:
        """Vérifie si le dataset a des erreurs"""
        return self.status == DatasetStatus.ERROR or bool(self.error_log)
    
    @property
    def overall_quality_score(self) -> float:
        """Calcule le score de qualité global"""
        scores = [
            self.completeness_score,
            self.consistency_score,
            self.validity_score
        ]
        valid_scores = [s for s in scores if s is not None]
        if not valid_scores:
            return 0.0
        return sum(valid_scores) / len(valid_scores)
    
    @property
    def export_format_list(self) -> list:
        """Retourne la liste des formats d'export supportés"""
        if not self.export_formats:
            return []
        return [fmt.strip() for fmt in self.export_formats.split(",")]
    
    def update_quality_assessment(self, completeness: float, consistency: float, validity: float):
        """Met à jour l'évaluation de la qualité"""
        self.completeness_score = completeness
        self.consistency_score = consistency
        self.validity_score = validity
        
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
    
    def add_processing_log(self, message: str):
        """Ajoute une entrée au log de traitement"""
        timestamp = func.now()
        log_entry = f"[{timestamp}] {message}"
        if self.processing_log:
            self.processing_log += f"\n{log_entry}"
        else:
            self.processing_log = log_entry 