"""
Sources de données publiques pour AgoraFlux
Connecteurs pour acquisition automatique de données réelles
"""

import aiohttp
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import csv
import json
from io import StringIO
from loguru import logger
from dataclasses import dataclass


@dataclass
class DataSource:
    """Configuration d'une source de données"""
    name: str
    url: str
    format: str  # 'csv', 'json', 'api'
    description: str
    update_frequency: str  # 'daily', 'weekly', 'monthly'
    last_updated: Optional[datetime] = None


class DataSourceManager:
    """Gestionnaire des sources de données publiques"""
    
    def __init__(self):
        self.sources = {
            'energy_paris': DataSource(
                name="Consommation Énergie Paris",
                url="https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/energies-energie-totale-consommee-a-paris/exports/csv?limit=100",
                format="csv",
                description="Consommation énergétique totale à Paris",
                update_frequency="yearly"
            ),
            'bike_counting': DataSource(
                name="Comptage Vélos Paris",
                url="https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/comptage-velo-compteurs/exports/csv?limit=200",
                format="csv", 
                description="Compteurs de vélos permanents à Paris",
                update_frequency="daily"
            ),
            'city_incidents': DataSource(
                name="Anomalies Urbaines Paris",
                url="https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/dans-ma-rue/exports/csv?limit=500",
                format="csv",
                description="Anomalies signalées via l'app Dans Ma Rue",
                update_frequency="daily"
            ),
            'transport_data': DataSource(
                name="Transport Vélib' Paris",
                url="https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/exports/csv?limit=100",
                format="csv",
                description="Disponibilité Vélib' en temps réel",
                update_frequency="daily"
            ),
            'equipment_paris': DataSource(
                name="Équipements Culturels Paris",
                url="https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/exports/csv?limit=300",
                format="csv",
                description="Événements et équipements culturels parisiens",
                update_frequency="weekly"
            )
        }
    
    async def fetch_data(self, source_key: str) -> Dict[str, Any]:
        """
        Récupère les données d'une source spécifique
        """
        if source_key not in self.sources:
            raise ValueError(f"Source inconnue: {source_key}")
        
        source = self.sources[source_key]
        logger.info(f"🔄 Récupération des données: {source.name}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(source.url) as response:
                    if response.status == 200:
                        content = await response.text()
                        
                        if source.format == 'csv':
                            return self._parse_csv(content, source.name)
                        elif source.format == 'json':
                            return json.loads(content)
                        else:
                            return {"raw_content": content}
                    else:
                        logger.error(f" Erreur HTTP {response.status} pour {source.name}")
                        return {"error": f"HTTP {response.status}"}
                        
        except Exception as e:
            logger.error(f" Erreur lors de la récupération {source.name}: {str(e)}")
            return {"error": str(e)}
    
    def _parse_csv(self, content: str, source_name: str) -> Dict[str, Any]:
        """Parse un contenu CSV"""
        try:
            csv_reader = csv.DictReader(StringIO(content))
            data = list(csv_reader)
            
            logger.info(f" {len(data)} lignes parsées pour {source_name}")
            
            return {
                "source": source_name,
                "format": "csv",
                "rows_count": len(data),
                "data": data[:100],  # Limite pour éviter surcharge mémoire
                "sample": data[:5] if data else [],
                "retrieved_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f" Erreur parsing CSV {source_name}: {str(e)}")
            return {"error": f"CSV parsing error: {str(e)}"}
    
    async def fetch_all_sources(self) -> Dict[str, Any]:
        """
        Récupère toutes les sources en parallèle
        """
        logger.info("🚀 Récupération de toutes les sources de données...")
        
        tasks = []
        for source_key in self.sources.keys():
            task = asyncio.create_task(self.fetch_data(source_key))
            tasks.append((source_key, task))
        
        results = {}
        for source_key, task in tasks:
            try:
                results[source_key] = await task
            except Exception as e:
                logger.error(f" Erreur pour {source_key}: {str(e)}")
                results[source_key] = {"error": str(e)}
        
        logger.info(f" {len(results)} sources récupérées")
        return results
    
    def get_source_info(self, source_key: str) -> Optional[DataSource]:
        """Retourne les informations d'une source"""
        return self.sources.get(source_key)
    
    def list_sources(self) -> Dict[str, DataSource]:
        """Liste toutes les sources disponibles"""
        return self.sources


# Instance globale
data_source_manager = DataSourceManager()


# Données de test réalistes pour développement
def get_mock_budget_data() -> List[Dict[str, Any]]:
    """Données budgétaires de test réalistes"""
    return [
        {
            "secteur": "Éducation",
            "montant": 1240000000,
            "pourcentage": 31.2,
            "annee": 2024,
            "description": "Enseignement primaire et secondaire"
        },
        {
            "secteur": "Transport", 
            "montant": 890000000,
            "pourcentage": 22.4,
            "annee": 2024,
            "description": "Métro, RER, bus et mobilités douces"
        },
        {
            "secteur": "Logement",
            "montant": 650000000, 
            "pourcentage": 16.4,
            "annee": 2024,
            "description": "Logement social et rénovation urbaine"
        },
        {
            "secteur": "Santé",
            "montant": 520000000,
            "pourcentage": 13.1, 
            "annee": 2024,
            "description": "Hôpitaux publics et centres de santé"
        },
        {
            "secteur": "Environnement",
            "montant": 420000000,
            "pourcentage": 10.6,
            "annee": 2024,
            "description": "Espaces verts et transition énergétique"
        },
        {
            "secteur": "Culture et Sports",
            "montant": 250000000,
            "pourcentage": 6.3,
            "annee": 2024,
            "description": "Équipements culturels et sportifs"
        }
    ]


def get_mock_participation_data() -> List[Dict[str, Any]]:
    """Données de participation citoyenne de test"""
    return [
        {
            "arrondissement": "75011",
            "nom": "11e arrondissement",
            "participants": 634,
            "projets_actifs": 12,
            "commentaires": 289,
            "satisfaction": 4.2,
            "mois": "2024-01"
        },
        {
            "arrondissement": "75015", 
            "nom": "15e arrondissement",
            "participants": 567,
            "projets_actifs": 8,
            "commentaires": 234,
            "satisfaction": 4.0,
            "mois": "2024-01"
        },
        {
            "arrondissement": "75010",
            "nom": "10e arrondissement", 
            "participants": 521,
            "projets_actifs": 10,
            "commentaires": 198,
            "satisfaction": 4.1,
            "mois": "2024-01"
        },
        {
            "arrondissement": "75018",
            "nom": "18e arrondissement",
            "participants": 512, 
            "projets_actifs": 9,
            "commentaires": 167,
            "satisfaction": 3.9,
            "mois": "2024-01"
        },
        {
            "arrondissement": "75012",
            "nom": "12e arrondissement",
            "participants": 478,
            "projets_actifs": 7,
            "commentaires": 145,
            "satisfaction": 4.0,
            "mois": "2024-01"
        }
    ] 