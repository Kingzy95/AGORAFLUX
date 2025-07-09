"""
Schémas Pydantic pour les datasets
Validation et sérialisation des données publiques
"""

from pydantic import BaseModel, validator, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.models.dataset import DatasetType, DatasetStatus, DataQuality
from app.schemas.user import UserPublic


class DatasetBase(BaseModel):
    """Schéma de base pour les datasets"""
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    source_url: Optional[HttpUrl] = None
    dataset_type: DatasetType

    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Le nom du dataset ne peut pas être vide')
        return v.strip()


class DatasetCreate(DatasetBase):
    """Schéma pour la création d'un dataset"""
    project_id: int
    # Le fichier sera géré séparément via upload


class DatasetUpdate(BaseModel):
    """Schéma pour la mise à jour d'un dataset"""
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    source_url: Optional[HttpUrl] = None
    validation_rules: Optional[Dict[str, Any]] = None
    is_exportable: Optional[bool] = None
    export_formats: Optional[str] = None

    @validator('export_formats')
    def validate_export_formats(cls, v):
        if v:
            valid_formats = {'csv', 'json', 'xlsx', 'xml', 'parquet'}
            formats = [fmt.strip().lower() for fmt in v.split(',')]
            invalid_formats = set(formats) - valid_formats
            if invalid_formats:
                raise ValueError(f'Formats non supportés: {", ".join(invalid_formats)}')
            return ', '.join(formats)
        return v


class DatasetInDB(DatasetBase):
    """Schéma pour les datasets en base de données"""
    id: int
    file_path: Optional[str]
    original_filename: Optional[str]
    file_size: Optional[int]
    status: DatasetStatus
    quality: DataQuality
    project_id: int
    uploaded_by_id: int
    
    # Métadonnées de traitement
    row_count: Optional[int]
    column_count: Optional[int]
    missing_values_count: Optional[int]
    duplicate_rows_count: Optional[int]
    
    # Scores de qualité
    completeness_score: Optional[float]
    consistency_score: Optional[float]
    validity_score: Optional[float]
    
    # Configuration
    processing_config: Optional[Dict[str, Any]]
    validation_rules: Optional[Dict[str, Any]]
    column_metadata: Optional[Dict[str, Any]]
    
    # Logs
    processing_log: Optional[str]
    error_log: Optional[str]
    
    # Export
    is_exportable: bool
    export_formats: str
    
    # Métadonnées temporelles
    created_at: datetime
    updated_at: Optional[datetime]
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True


class DatasetPublic(BaseModel):
    """Schéma public pour les datasets"""
    id: int
    name: str
    description: Optional[str]
    source_url: Optional[str]
    dataset_type: DatasetType = Field(alias="type")
    status: DatasetStatus
    quality: DataQuality
    project_id: int
    uploaded_by: UserPublic
    
    # Métadonnées publiques
    row_count: Optional[int] = Field(alias="rows_count")
    column_count: Optional[int] = Field(alias="columns_count")
    file_size: Optional[int]
    
    # Scores de qualité
    completeness_score: Optional[float]
    consistency_score: Optional[float]
    validity_score: Optional[float]
    
    # Export
    is_exportable: bool
    export_formats: str
    
    # Métadonnées temporelles
    created_at: datetime
    updated_at: Optional[datetime]
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True
        populate_by_name = True
        allow_population_by_field_name = True

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
        return round(sum(valid_scores) / len(valid_scores), 2)

    @property
    def export_format_list(self) -> List[str]:
        """Retourne la liste des formats d'export"""
        if not self.export_formats:
            return []
        return [fmt.strip() for fmt in self.export_formats.split(',')]

    @property
    def file_size_human(self) -> str:
        """Retourne la taille du fichier formatée"""
        if not self.file_size:
            return "Inconnue"
        
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


class DatasetSummary(BaseModel):
    """Résumé de dataset pour les listes"""
    id: int
    name: str
    type: DatasetType = Field(alias="type")
    status: DatasetStatus
    quality: DataQuality
    rows_count: Optional[int]
    columns_count: Optional[int]
    file_size: Optional[int]
    overall_quality_score: float = Field(default=0.0)
    created_at: datetime
    uploaded_by: UserPublic

    class Config:
        from_attributes = True
        populate_by_name = True
        allow_population_by_field_name = True


class DatasetStats(BaseModel):
    """Statistiques détaillées d'un dataset"""
    row_count: int = 0
    column_count: int = 0
    missing_values_count: int = 0
    duplicate_rows_count: int = 0
    completeness_score: float = 0.0
    consistency_score: float = 0.0
    validity_score: float = 0.0
    processing_duration: Optional[float] = None  # en secondes
    last_processed: Optional[datetime] = None


class DatasetProcessingConfig(BaseModel):
    """Configuration de traitement d'un dataset"""
    separator: str = ","
    encoding: str = "utf-8"
    header_row: int = 0
    skip_rows: List[int] = []
    column_mapping: Dict[str, str] = {}
    data_types: Dict[str, str] = {}
    clean_data: bool = True
    remove_duplicates: bool = True
    handle_missing: str = "keep"  # keep, drop, fill
    validation_rules: Dict[str, Any] = {}


class DatasetValidationResult(BaseModel):
    """Résultat de validation d'un dataset"""
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    quality_scores: Dict[str, float] = {}
    column_analysis: Dict[str, Any] = {}
    recommendations: List[str] = []


class DatasetUpload(BaseModel):
    """Informations d'upload d'un dataset"""
    filename: str
    file_size: int
    content_type: str
    project_id: int
    processing_config: Optional[DatasetProcessingConfig] = None


class DatasetList(BaseModel):
    """Liste paginée de datasets"""
    datasets: List[DatasetSummary]
    total: int
    page: int
    per_page: int
    pages: int


class DatasetExport(BaseModel):
    """Configuration d'export d'un dataset"""
    format: str = Field(..., pattern="^(csv|json|xlsx|xml|parquet)$")
    include_metadata: bool = False
    filters: Optional[Dict[str, Any]] = None
    columns: Optional[List[str]] = None


class DatasetSearch(BaseModel):
    """Paramètres de recherche de datasets"""
    q: Optional[str] = Field(None, max_length=100)
    project_id: Optional[int] = None
    dataset_type: Optional[DatasetType] = None
    status: Optional[DatasetStatus] = None
    quality: Optional[DataQuality] = None
    uploaded_by_id: Optional[int] = None
    min_quality_score: Optional[float] = Field(None, ge=0, le=100)
    sort_by: str = Field("created_at", pattern="^(created_at|name|quality|file_size|row_count)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100) 