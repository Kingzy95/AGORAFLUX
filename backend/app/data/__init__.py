"""
Module de gestion des données AgoraFlux
Pipeline complet pour l'acquisition, traitement, fusion et documentation de données publiques
"""

from .sources import data_source_manager, DataSource, get_mock_budget_data, get_mock_participation_data
from .processor import data_processor, DataProcessor, DataQuality, QualityMetrics
from .fusion import data_fusion, DataFusion, FusionStrategy, FusionConfig, FusionResult
from .documentation import auto_doc_generator, AutoDocumentationGenerator, DocumentationType
from .pipeline import pipeline, DataPipeline

__all__ = [
    # Sources
    'data_source_manager',
    'DataSource', 
    'get_mock_budget_data',
    'get_mock_participation_data',
    
    # Processor
    'data_processor',
    'DataProcessor',
    'DataQuality',
    'QualityMetrics',
    
    # Fusion
    'data_fusion',
    'DataFusion',
    'FusionStrategy',
    'FusionConfig',
    'FusionResult',
    
    # Documentation
    'auto_doc_generator',
    'AutoDocumentationGenerator',
    'DocumentationType',
    
    # Pipeline
    'pipeline',
    'DataPipeline'
]
