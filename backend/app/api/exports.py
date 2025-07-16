"""
Endpoints API pour les exports AgoraFlux
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid
import os
import tempfile
import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Backend non-interactif

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.api.notifications import create_notification

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
    duration: int = 5000  # ms


class ReportTemplate(BaseModel):
    id: str
    name: str
    description: str
    template_type: str  # 'monthly' | 'quarterly' | 'annual' | 'custom'
    sections: List[str]
    charts_included: List[str]
    default_params: Dict[str, Any]


class ReportGenerateRequest(BaseModel):
    template_id: str
    title: str
    period_start: datetime
    period_end: datetime
    sections: List[str]
    include_charts: List[str]
    custom_params: Dict[str, Any] = {}


class ReportResponse(BaseModel):
    id: str
    title: str
    template_id: str
    template_name: str
    period_start: datetime
    period_end: datetime
    file_name: str
    file_size: int
    generated_at: datetime
    download_url: str
    user_id: str
    user_name: str
    status: str  # 'generating' | 'completed' | 'error'


# Store en mémoire pour les données d'export (à remplacer par BDD)
export_store = {
    "exports": [],
    "notifications": [],
    "reports": [],
    "templates": [
        {
            "id": "monthly-summary",
            "name": "Rapport Mensuel",
            "description": "Synthèse mensuelle des activités et statistiques",
            "template_type": "monthly",
            "sections": ["overview", "analytics", "community", "projects"],
            "charts_included": ["budget-municipal", "participation-evolution", "demographics"],
            "default_params": {"include_details": True, "format": "detailed"}
        },
        {
            "id": "quarterly-report",
            "name": "Rapport Trimestriel",
            "description": "Analyse trimestrielle approfondie",
            "template_type": "quarterly",
            "sections": ["executive-summary", "analytics", "community", "projects", "recommendations"],
            "charts_included": ["budget-municipal", "participation-evolution", "satisfaction-survey"],
            "default_params": {"include_details": True, "include_trends": True}
        },
        {
            "id": "annual-report",
            "name": "Rapport Annuel",
            "description": "Bilan annuel complet de la plateforme",
            "template_type": "annual",
            "sections": ["executive-summary", "year-overview", "analytics", "community", "projects", "achievements", "next-year-goals"],
            "charts_included": ["budget-municipal", "participation-evolution", "demographics", "satisfaction-survey"],
            "default_params": {"include_details": True, "include_trends": True, "include_comparisons": True}
        },
        {
            "id": "project-report",
            "name": "Rapport de Projet",
            "description": "Rapport spécifique à un projet",
            "template_type": "custom",
            "sections": ["project-overview", "analytics", "community-engagement", "outcomes"],
            "charts_included": ["project-specific"],
            "default_params": {"project_focused": True}
        }
    ]
}


def generate_professional_pdf(report_data: dict, file_path: str):
    """
    Génère un PDF professionnel avec ReportLab
    """
    doc = SimpleDocTemplate(file_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Style personnalisé pour le titre
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1e40af')
    )
    
    # Style pour les sous-titres
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=20,
        textColor=colors.HexColor('#374151')
    )
    
    # Style pour le texte normal
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        textColor=colors.HexColor('#4b5563')
    )
    
    # En-tête du rapport
    story.append(Paragraph("AGORAFLUX", title_style))
    story.append(Paragraph("Plateforme de Simulation et Collaboration Citoyenne", normal_style))
    story.append(Spacer(1, 0.5*inch))
    
    # Titre du rapport
    story.append(Paragraph(report_data['title'], subtitle_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Informations du rapport
    info_data = [
        ['Type de rapport:', report_data['template_name']],
        ['Période:', f"{report_data['period_start'].strftime('%d/%m/%Y')} - {report_data['period_end'].strftime('%d/%m/%Y')}"],
        ['Généré le:', report_data['generated_at'].strftime('%d/%m/%Y à %H:%M')],
        ['Généré par:', report_data['user_name']]
    ]
    
    info_table = Table(info_data, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    story.append(info_table)
    story.append(Spacer(1, 0.5*inch))
    
    # Résumé exécutif
    story.append(Paragraph("Résumé Exécutif", subtitle_style))
    executive_summary = f"""
    Ce rapport présente une analyse complète des données de la plateforme AgoraFlux pour la période du 
    {report_data['period_start'].strftime('%d/%m/%Y')} au {report_data['period_end'].strftime('%d/%m/%Y')}. 
    Les indicateurs clés montrent une participation citoyenne active avec {len(export_store.get('exports', []))} exports réalisés 
    et {len(export_store.get('reports', []))} rapports générés.
    """
    story.append(Paragraph(executive_summary, normal_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Statistiques principales
    story.append(Paragraph("Statistiques Principales", subtitle_style))
    
    # Données simulées basées sur le type de rapport
    if report_data['template_id'] == 'monthly-summary':
        stats_data = [
            ['Métrique', 'Valeur', 'Évolution'],
            ['Projets actifs', '24', '+12%'],
            ['Participants uniques', '1,847', '+8%'],
            ['Commentaires publiés', '156', '+23%'],
            ['Datasets analysés', '12', '+15%'],
            ['Exports réalisés', str(len(export_store.get('exports', []))), '+18%']
        ]
    elif report_data['template_id'] == 'quarterly-report':
        stats_data = [
            ['Métrique', 'Valeur', 'Évolution'],
            ['Projets créés', '72', '+28%'],
            ['Participants totaux', '5,234', '+15%'],
            ['Heures d\'engagement', '12,450', '+32%'],
            ['Satisfaction moyenne', '4.2/5', '+0.3'],
            ['Taux de participation', '68%', '+5%']
        ]
    else:  # annual ou custom
        stats_data = [
            ['Métrique', 'Valeur', 'Évolution'],
            ['Projets totaux', '287', '+45%'],
            ['Utilisateurs actifs', '15,623', '+62%'],
            ['Données analysées (GB)', '2.8', '+125%'],
            ['Rapports générés', '145', '+89%'],
            ['Impact citoyen', 'Élevé', '+2 niveaux']
        ]
    
    stats_table = Table(stats_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    story.append(stats_table)
    story.append(Spacer(1, 0.4*inch))
    
    # Analyse des tendances
    story.append(Paragraph("Analyse des Tendances", subtitle_style))
    trends_text = f"""
    L'analyse des données révèle plusieurs tendances importantes :
    
    <b>• Participation croissante :</b> Une augmentation constante de l'engagement citoyen avec un pic 
    d'activité observé durant la période analysée.
    
    <b>• Diversification des projets :</b> Les citoyens s'intéressent à une gamme plus large de sujets, 
    notamment l'environnement et l'urbanisme.
    
    <b>• Qualité des contributions :</b> Les commentaires et propositions montrent une amélioration 
    qualitative significative.
    
    <b>• Adoption technologique :</b> L'utilisation des outils d'export et de visualisation est en 
    forte progression.
    """
    story.append(Paragraph(trends_text, normal_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Recommandations
    story.append(Paragraph("Recommandations", subtitle_style))
    recommendations = f"""
    Basé sur l'analyse des données, nous recommandons :
    
    <b>1. Renforcement de l'engagement :</b> Développer de nouveaux mécanismes d'interaction pour 
    maintenir la dynamique positive observée.
    
    <b>2. Amélioration des outils :</b> Continuer à enrichir les fonctionnalités d'analyse et 
    d'export pour répondre aux besoins croissants.
    
    <b>3. Formation et support :</b> Proposer des sessions de formation pour maximiser l'utilisation 
    des outils disponibles.
    
    <b>4. Expansion thématique :</b> Explorer de nouveaux domaines d'application en fonction des 
    intérêts exprimés par la communauté.
    """
    story.append(Paragraph(recommendations, normal_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Pied de page avec informations techniques
    story.append(Spacer(1, 0.5*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER
    )
    
    story.append(Paragraph("___", footer_style))
    story.append(Paragraph(f"Rapport généré automatiquement par AgoraFlux • {datetime.now().strftime('%d/%m/%Y %H:%M')}", footer_style))
    story.append(Paragraph("Plateforme de Simulation et Collaboration Citoyenne", footer_style))
    
    # Construire le PDF
    doc.build(story)


@router.get("/reports/templates", response_model=List[ReportTemplate])
async def get_report_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des templates de rapports disponibles
    """
    return [ReportTemplate(**template) for template in export_store["templates"]]


@router.post("/reports/generate", response_model=ReportResponse)
async def generate_report(
    report_request: ReportGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Génère un rapport PDF basé sur un template
    """
    # Trouver le template
    template = next((t for t in export_store["templates"] if t["id"] == report_request.template_id), None)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template de rapport non trouvé"
        )
    
    # Générer le rapport (simulation)
    report_id = str(uuid.uuid4())
    file_name = f"rapport_{template['template_type']}_{report_request.period_start.strftime('%Y%m%d')}.pdf"
    
    # Simuler la génération du rapport
    import time
    import random
    
    # Taille de fichier simulée basée sur le type de rapport
    base_sizes = {
        "monthly": 1.5 * 1024 * 1024,    # 1.5MB
        "quarterly": 3.2 * 1024 * 1024,  # 3.2MB
        "annual": 8.5 * 1024 * 1024,     # 8.5MB
        "custom": 2.1 * 1024 * 1024      # 2.1MB
    }
    
    file_size = int(base_sizes.get(template["template_type"], 2 * 1024 * 1024) * random.uniform(0.8, 1.2))
    
    new_report = {
        "id": report_id,
        "title": report_request.title,
        "template_id": report_request.template_id,
        "template_name": template["name"],
        "period_start": report_request.period_start,
        "period_end": report_request.period_end,
        "file_name": file_name,
        "file_size": file_size,
        "generated_at": datetime.now(),
        "download_url": f"/api/v1/exports/reports/{file_name}",
        "user_id": str(current_user.id),
        "user_name": f"{current_user.first_name} {current_user.last_name}",
        "status": "completed"
    }
    
    export_store["reports"].append(new_report)
    
    # Ajouter à l'historique des exports
    export_entry = {
        "id": report_id,
        "chart_id": f"report-{template['template_type']}",
        "chart_title": report_request.title,
        "format": "PDF",
        "file_name": file_name,
        "file_size": file_size,
        "timestamp": datetime.now(),
        "download_count": 0,
        "download_url": f"/api/v1/exports/reports/{file_name}",
        "user_id": str(current_user.id),
        "user_name": f"{current_user.first_name} {current_user.last_name}"
    }
    
    export_store["exports"].append(export_entry)
    
    # Créer une notification de succès
    await create_notification(
        type="export",
        title="Rapport généré avec succès",
        message=f"Votre rapport '{report_request.title}' a été généré et est prêt à télécharger",
        recipient_id=str(current_user.id),
        data={
            "report_id": report_id,
            "report_title": report_request.title,
            "template_name": template["name"],
            "file_name": file_name,
            "file_size": file_size,
            "download_url": f"/api/v1/exports/reports/{file_name}"
        },
        priority="normal"
    )
    
    return ReportResponse(**new_report)


@router.get("/reports/history", response_model=List[ReportResponse])
async def get_reports_history(
    limit: int = 50,
    offset: int = 0,
    template_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère l'historique des rapports générés
    """
    reports = export_store["reports"]
    
    # Filtrer par template si spécifié
    if template_filter:
        reports = [r for r in reports if r["template_id"] == template_filter]
    
    # Filtrer par utilisateur
    reports = [r for r in reports if r["user_id"] == str(current_user.id)]
    
    # Trier par date de génération (plus récent en premier)
    reports.sort(key=lambda x: x["generated_at"], reverse=True)
    
    # Pagination
    reports = reports[offset:offset + limit]
    
    return [ReportResponse(**report) for report in reports]


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


@router.get("/reports/{file_name}")
async def download_report(
    file_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Télécharge un fichier de rapport PDF
    """
    # Vérifier que le fichier existe dans les rapports de l'utilisateur
    user_reports = [r for r in export_store["reports"] if r["user_id"] == str(current_user.id)]
    report = next((r for r in user_reports if r["file_name"] == file_name), None)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier de rapport non trouvé"
        )
    
    try:
        # Créer un fichier temporaire pour le PDF
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_file.close()
        
        # Générer le PDF professionnel
        generate_professional_pdf(report, temp_file.name)
        
        # Incrémenter le compteur de téléchargements
        report["download_count"] = report.get("download_count", 0) + 1
        
        # Mettre à jour dans l'historique des exports aussi
        export_entry = next((e for e in export_store["exports"] if e["id"] == report["id"]), None)
        if export_entry:
            export_entry["download_count"] = export_entry.get("download_count", 0) + 1
        
        return FileResponse(
            temp_file.name,
            media_type='application/pdf',
            filename=file_name,
            headers={"Content-Disposition": f"attachment; filename={file_name}"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du téléchargement: {str(e)}"
        ) 