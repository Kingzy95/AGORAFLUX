"""
Endpoints API pour les exports AgoraFlux
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/exports", tags=["Exports"])


# Modèles Pydantic pour les requêtes/réponses
class ExportCreate(BaseModel):
    chart_id: str
    chart_title: str
    format: str  # 'PDF' | 'PNG' | 'XLSX' | 'JSON'
    file_name: str
    file_size: int
    
class ExportResponse(BaseModel):
    id: str
    chart_id: str
    chart_title: str
    format: str
    file_name: str
    file_size: int
    timestamp: datetime
    download_count: int
    download_url: Optional[str] = None
    user_id: str
    user_name: str

class ExportStatistics(BaseModel):
    total_exports: int
    total_data_transferred: float  # en MB
    average_file_size: float  # en MB
    exports_by_format: Dict[str, int]
    exports_by_chart: Dict[str, int]
    popular_formats: List[Dict[str, Any]]
    export_trends: List[Dict[str, Any]]
    top_charts: List[Dict[str, Any]]

class ExportNotification(BaseModel):
    id: str
    type: str  # 'success' | 'error' | 'warning' | 'info'
    title: str
    message: str
    timestamp: datetime
    auto_hide: bool = True
    duration: int = 5000


# Store en mémoire pour les données d'export (à remplacer par BDD)
export_store = {
    "exports": [],
    "notifications": []
}


@router.get("/history", response_model=List[ExportResponse])
async def get_export_history(
    limit: int = 50,
    offset: int = 0,
    format_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère l'historique des exports de l'utilisateur
    """
    # Générer des exports exemple basés sur l'utilisateur actuel
    if not export_store["exports"]:
        # Initialiser avec des données exemple
        current_time = datetime.now()
        example_exports = [
            {
                "id": str(uuid.uuid4()),
                "chart_id": "budget-municipal",
                "chart_title": "Budget Municipal Paris 2024",
                "format": "PDF",
                "file_name": "budget_municipal_2024.pdf",
                "file_size": 2621440,  # 2.5 MB
                "timestamp": current_time - timedelta(hours=2),
                "download_count": 3,
                "download_url": "/exports/budget_municipal_2024.pdf",
                "user_id": str(current_user.id),
                "user_name": f"{current_user.first_name} {current_user.last_name}"
            },
            {
                "id": str(uuid.uuid4()),
                "chart_id": "participation-evolution",
                "chart_title": "Évolution Participation Citoyenne",
                "format": "PNG",
                "file_name": "participation_evolution.png",
                "file_size": 1887437,  # 1.8 MB
                "timestamp": current_time - timedelta(hours=4),
                "download_count": 1,
                "download_url": "/exports/participation_evolution.png",
                "user_id": str(current_user.id),
                "user_name": f"{current_user.first_name} {current_user.last_name}"
            },
            {
                "id": str(uuid.uuid4()),
                "chart_id": "carte-participation",
                "chart_title": "Carte Participation Géographique",
                "format": "JSON",
                "file_name": "participation_geo_data.json",
                "file_size": 524288,  # 0.5 MB
                "timestamp": current_time - timedelta(hours=6),
                "download_count": 2,
                "download_url": "/exports/participation_geo_data.json",
                "user_id": str(current_user.id),
                "user_name": f"{current_user.first_name} {current_user.last_name}"
            },
            {
                "id": str(uuid.uuid4()),
                "chart_id": "demographics-chart",
                "chart_title": "Données Démographiques",
                "format": "XLSX",
                "file_name": "demographics_2024.xlsx",
                "file_size": 838861,  # 0.8 MB
                "timestamp": current_time - timedelta(days=1),
                "download_count": 0,
                "download_url": "/exports/demographics_2024.xlsx",
                "user_id": str(current_user.id),
                "user_name": f"{current_user.first_name} {current_user.last_name}"
            },
            {
                "id": str(uuid.uuid4()),
                "chart_id": "satisfaction-survey",
                "chart_title": "Enquête Satisfaction",
                "format": "PDF",
                "file_name": "satisfaction_report.pdf",
                "file_size": 3355443,  # 3.2 MB
                "timestamp": current_time - timedelta(days=2),
                "download_count": 5,
                "download_url": "/exports/satisfaction_report.pdf",
                "user_id": str(current_user.id),
                "user_name": f"{current_user.first_name} {current_user.last_name}"
            }
        ]
        export_store["exports"] = example_exports
    
    # Filtrer par format si spécifié
    exports = export_store["exports"]
    if format_filter:
        exports = [e for e in exports if e["format"].lower() == format_filter.lower()]
    
    # Filtrer par utilisateur
    exports = [e for e in exports if e["user_id"] == str(current_user.id)]
    
    # Pagination
    exports = exports[offset:offset + limit]
    
    return [ExportResponse(**export) for export in exports]


@router.post("/", response_model=ExportResponse)
async def create_export(
    export_data: ExportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enregistre un nouvel export
    """
    new_export = {
        "id": str(uuid.uuid4()),
        "chart_id": export_data.chart_id,
        "chart_title": export_data.chart_title,
        "format": export_data.format,
        "file_name": export_data.file_name,
        "file_size": export_data.file_size,
        "timestamp": datetime.now(),
        "download_count": 0,
        "download_url": f"/exports/{export_data.file_name}",
        "user_id": str(current_user.id),
        "user_name": f"{current_user.first_name} {current_user.last_name}"
    }
    
    export_store["exports"].append(new_export)
    
    # Créer une notification
    notification = {
        "id": str(uuid.uuid4()),
        "type": "success",
        "title": "Export terminé",
        "message": f"{export_data.chart_title} a été exporté avec succès",
        "timestamp": datetime.now(),
        "auto_hide": True,
        "duration": 5000
    }
    export_store["notifications"].append(notification)
    
    return ExportResponse(**new_export)


@router.delete("/{export_id}")
async def delete_export(
    export_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprime un export de l'historique
    """
    # Trouver l'export
    export_index = next((i for i, e in enumerate(export_store["exports"]) if e["id"] == export_id), None)
    if export_index is None:
        raise HTTPException(status_code=404, detail="Export non trouvé")
    
    export = export_store["exports"][export_index]
    
    # Vérifier les permissions
    if export["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    # Supprimer l'export
    removed_export = export_store["exports"].pop(export_index)
    
    # Créer une notification
    notification = {
        "id": str(uuid.uuid4()),
        "type": "info",
        "title": "Export supprimé",
        "message": f"{removed_export['chart_title']} a été supprimé de l'historique",
        "timestamp": datetime.now(),
        "auto_hide": True,
        "duration": 3000
    }
    export_store["notifications"].append(notification)
    
    return {"message": "Export supprimé avec succès"}


@router.get("/statistics", response_model=ExportStatistics)
async def get_export_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les statistiques d'export pour l'utilisateur
    """
    # Filtrer les exports de l'utilisateur
    user_exports = [e for e in export_store["exports"] if e["user_id"] == str(current_user.id)]
    
    if not user_exports:
        # Retourner des statistiques vides
        return ExportStatistics(
            total_exports=0,
            total_data_transferred=0.0,
            average_file_size=0.0,
            exports_by_format={},
            exports_by_chart={},
            popular_formats=[],
            export_trends=[],
            top_charts=[]
        )
    
    # Calculer les statistiques
    total_exports = len(user_exports)
    total_bytes = sum(e["file_size"] for e in user_exports)
    total_data_transferred = total_bytes / (1024 * 1024)  # en MB
    average_file_size = total_data_transferred / total_exports
    
    # Exports par format
    exports_by_format = {}
    for export in user_exports:
        fmt = export["format"]
        exports_by_format[fmt] = exports_by_format.get(fmt, 0) + 1
    
    # Exports par graphique
    exports_by_chart = {}
    for export in user_exports:
        chart = export["chart_id"]
        exports_by_chart[chart] = exports_by_chart.get(chart, 0) + 1
    
    # Formats populaires
    popular_formats = []
    for fmt, count in exports_by_format.items():
        popular_formats.append({
            "format": fmt,
            "count": count,
            "percentage": (count / total_exports) * 100
        })
    popular_formats.sort(key=lambda x: x["count"], reverse=True)
    
    # Tendances d'export (derniers 7 jours)
    current_date = datetime.now()
    export_trends = []
    for i in range(7):
        date = current_date - timedelta(days=6-i)
        day_exports = [
            e for e in user_exports 
            if e["timestamp"].date() == date.date()
        ]
        
        formats_for_day = {}
        for export in day_exports:
            fmt = export["format"]
            formats_for_day[fmt] = formats_for_day.get(fmt, 0) + 1
        
        export_trends.append({
            "date": date.strftime("%Y-%m-%d"),
            "count": len(day_exports),
            "formats": formats_for_day
        })
    
    # Top graphiques
    top_charts = []
    for chart_id, count in exports_by_chart.items():
        chart_title = next(
            (e["chart_title"] for e in user_exports if e["chart_id"] == chart_id), 
            chart_id
        )
        top_charts.append({
            "chart_id": chart_id,
            "chart_title": chart_title,
            "export_count": count
        })
    top_charts.sort(key=lambda x: x["export_count"], reverse=True)
    
    return ExportStatistics(
        total_exports=total_exports,
        total_data_transferred=total_data_transferred,
        average_file_size=average_file_size,
        exports_by_format=exports_by_format,
        exports_by_chart=exports_by_chart,
        popular_formats=popular_formats,
        export_trends=export_trends,
        top_charts=top_charts
    )


@router.get("/notifications", response_model=List[ExportNotification])
async def get_export_notifications(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les notifications d'export récentes
    """
    # Retourner les notifications les plus récentes
    notifications = export_store["notifications"][-limit:]
    notifications.reverse()  # Plus récentes en premier
    
    return [ExportNotification(**notif) for notif in notifications]


@router.delete("/history/clear")
async def clear_export_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Efface tout l'historique d'export de l'utilisateur
    """
    # Supprimer tous les exports de l'utilisateur
    export_store["exports"] = [
        e for e in export_store["exports"] 
        if e["user_id"] != str(current_user.id)
    ]
    
    # Créer une notification
    notification = {
        "id": str(uuid.uuid4()),
        "type": "warning",
        "title": "Historique effacé",
        "message": "L'historique des exports a été effacé",
        "timestamp": datetime.now(),
        "auto_hide": True,
        "duration": 3000
    }
    export_store["notifications"].append(notification)
    
    return {"message": "Historique d'export effacé avec succès"}


@router.get("/health")
async def export_health():
    """
    Point de santé pour le module d'export
    """
    return {
        "status": "healthy",
        "module": "exports",
        "features": {
            "export_history": True,
            "statistics": True,
            "notifications": True,
            "bulk_export": False,  # À implémenter plus tard
            "real_time": True
        },
        "storage": {
            "exports_count": len(export_store["exports"]),
            "notifications_count": len(export_store["notifications"])
        }
    } 