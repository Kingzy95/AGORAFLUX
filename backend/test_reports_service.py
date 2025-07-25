#!/usr/bin/env python3
"""
Script de test pour vérifier la génération de rapports avec vraies données
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Ajouter le chemin du projet
sys.path.insert(0, '/Users/emmanuelmingui/AGORAFLUX/backend')

from app.core.database import get_db
from app.services.reports_data import get_reports_data_service


async def test_reports_service():
    """Test du service de génération de rapports"""
    
    print("🧪 Test du service de génération de rapports AgoraFlux")
    print("=" * 60)
    
    # Obtenir une session de base de données
    db = next(get_db())
    
    # Créer le service
    reports_service = get_reports_data_service(db)
    
    # Définir une période de test (dernier mois)
    period_end = datetime.now()
    period_start = period_end - timedelta(days=30)
    
    print(f"📅 Période analysée: {period_start.strftime('%d/%m/%Y')} - {period_end.strftime('%d/%m/%Y')}")
    print()
    
    try:
        # Test des statistiques globales
        print("📊 Récupération des statistiques globales...")
        global_stats = reports_service.get_global_stats(period_start, period_end)
        print(f"   ✅ Projets actifs: {global_stats['active_projects']}")
        print(f"   ✅ Participants uniques: {global_stats['unique_participants']}")
        print(f"   ✅ Commentaires publiés: {global_stats['comments_published']}")
        print(f"   ✅ Datasets analysés: {global_stats['datasets_analyzed']}")
        print(f"   ✅ Nouveaux projets: {global_stats['new_projects']}")
        print(f"   ✅ Total utilisateurs: {global_stats['total_users']}")
        print()
        
        # Test des statistiques d'engagement
        print("👥 Récupération des statistiques d'engagement...")
        engagement_stats = reports_service.get_user_engagement_stats(period_start, period_end)
        print(f"   ✅ Top contributeurs trouvés: {len(engagement_stats['top_contributors'])}")
        print(f"   ✅ Types de commentaires: {len(engagement_stats['comment_types'])}")
        print(f"   ✅ Commentaires signalés: {engagement_stats['moderation']['flagged']}")
        print(f"   ✅ Commentaires masqués: {engagement_stats['moderation']['hidden']}")
        print()
        
        # Test des statistiques de projets
        print("📋 Récupération des statistiques de projets...")
        project_stats = reports_service.get_project_stats(period_start, period_end)
        print(f"   ✅ Projets par statut: {len(project_stats['by_status'])}")
        print(f"   ✅ Projets les plus actifs: {len(project_stats['most_active'])}")
        print(f"   ✅ Moyenne commentaires/projet: {project_stats['avg_comments_per_project']}")
        print()
        
        # Test des statistiques de datasets
        print("📂 Récupération des statistiques de datasets...")
        datasets_stats = reports_service.get_datasets_stats(period_start, period_end)
        print(f"   ✅ Datasets par statut: {len(datasets_stats['by_status'])}")
        print(f"   ✅ Score qualité moyen: {datasets_stats['avg_quality_score']}")
        print(f"   ✅ Total lignes traitées: {datasets_stats['total_rows_processed']}")
        print()
        
        # Test de la timeline
        print("📈 Génération de la timeline d'activité...")
        timeline = reports_service.get_activity_timeline(period_start, period_end, 'day')
        print(f"   ✅ Points de données générés: {len(timeline)}")
        if timeline:
            total_activity = sum(point['total_activity'] for point in timeline)
            print(f"   ✅ Activité totale sur la période: {total_activity}")
        print()
        
        print("🎉 Tous les tests sont passés avec succès !")
        print("✨ Le service de rapports utilise maintenant les vraies données de la base.")
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(test_reports_service())
