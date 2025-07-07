"""
Module de gestion des données AgoraFlux
Pipeline complet pour l'acquisition, traitement et injection de données publiques
"""

from .sources import data_source_manager, DataSource, get_mock_budget_data, get_mock_participation_data
from .processor import data_processor, DataProcessor, DataQuality, QualityMetrics
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
    
    # Pipeline
    'pipeline',
    'DataPipeline'
]
