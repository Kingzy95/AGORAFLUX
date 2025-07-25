"""
Service de récupération des données réelles pour les rapports AgoraFlux
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.comment import Comment, CommentStatus, CommentType
from app.models.dataset import Dataset, DatasetStatus
from app.core.database import get_db

logger = logging.getLogger(__name__)


class ReportsDataService:
    """Service pour récupérer les données réelles des rapports"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_global_stats(self, period_start: datetime, period_end: datetime) -> Dict[str, Any]:
        """
        Récupère les statistiques globales de la plateforme pour une période donnée
        """
        try:
            # Projets actifs dans la période
            active_projects = self.db.query(Project).filter(
                Project.status == ProjectStatus.ACTIVE,
                or_(
                    Project.created_at.between(period_start, period_end),
                    Project.updated_at.between(period_start, period_end)
                )
            ).count()
            
            # Participants uniques (utilisateurs actifs avec au moins une contribution)
            unique_participants = self.db.query(User.id).join(
                Comment, User.id == Comment.author_id
            ).filter(
                Comment.created_at.between(period_start, period_end),
                Comment.status == CommentStatus.ACTIVE,
                User.is_active == True
            ).distinct().count()
            
            # Commentaires publiés dans la période
            comments_count = self.db.query(Comment).filter(
                Comment.created_at.between(period_start, period_end),
                Comment.status == CommentStatus.ACTIVE
            ).count()
            
            # Datasets analysés dans la période
            datasets_count = self.db.query(Dataset).filter(
                Dataset.created_at.between(period_start, period_end),
                Dataset.status.in_([DatasetStatus.PROCESSED, DatasetStatus.PROCESSING])
            ).count()
            
            # Total des utilisateurs actifs
            total_users = self.db.query(User).filter(User.is_active == True).count()
            
            # Projets créés dans la période
            new_projects = self.db.query(Project).filter(
                Project.created_at.between(period_start, period_end)
            ).count()
            
            # Évolutions par rapport à la période précédente
            previous_period_start = period_start - (period_end - period_start)
            previous_period_end = period_start
            
            prev_active_projects = self.db.query(Project).filter(
                Project.status == ProjectStatus.ACTIVE,
                or_(
                    Project.created_at.between(previous_period_start, previous_period_end),
                    Project.updated_at.between(previous_period_start, previous_period_end)
                )
            ).count()
            
            prev_participants = self.db.query(User.id).join(
                Comment, User.id == Comment.author_id
            ).filter(
                Comment.created_at.between(previous_period_start, previous_period_end),
                Comment.status == CommentStatus.ACTIVE,
                User.is_active == True
            ).distinct().count()
            
            prev_comments = self.db.query(Comment).filter(
                Comment.created_at.between(previous_period_start, previous_period_end),
                Comment.status == CommentStatus.ACTIVE
            ).count()
            
            # Calculer les évolutions
            projects_evolution = self._calculate_evolution(active_projects, prev_active_projects)
            participants_evolution = self._calculate_evolution(unique_participants, prev_participants)
            comments_evolution = self._calculate_evolution(comments_count, prev_comments)
            
            return {
                'active_projects': active_projects,
                'unique_participants': unique_participants, 
                'comments_published': comments_count,
                'datasets_analyzed': datasets_count,
                'new_projects': new_projects,
                'total_users': total_users,
                'evolution': {
                    'projects': projects_evolution,
                    'participants': participants_evolution,
                    'comments': comments_evolution
                }
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques globales: {str(e)}")
            # Retourner des valeurs par défaut en cas d'erreur
            return {
                'active_projects': 0,
                'unique_participants': 0,
                'comments_published': 0,
                'datasets_analyzed': 0,
                'new_projects': 0,
                'total_users': 0,
                'evolution': {
                    'projects': 0,
                    'participants': 0,
                    'comments': 0
                }
            }
    
    def get_user_engagement_stats(self, period_start: datetime, period_end: datetime) -> Dict[str, Any]:
        """
        Récupère les statistiques d'engagement des utilisateurs
        """
        try:
            # Top contributeurs
            top_contributors = self.db.query(
                User.first_name,
                User.last_name,
                User.role,
                func.count(Comment.id).label('comments_count')
            ).join(
                Comment, User.id == Comment.author_id
            ).filter(
                Comment.created_at.between(period_start, period_end),
                Comment.status == CommentStatus.ACTIVE
            ).group_by(
                User.id, User.first_name, User.last_name, User.role
            ).order_by(
                desc('comments_count')
            ).limit(10).all()
            
            # Répartition par type de commentaire
            comment_types_stats = self.db.query(
                Comment.type,
                func.count(Comment.id).label('count')
            ).filter(
                Comment.created_at.between(period_start, period_end),
                Comment.status == CommentStatus.ACTIVE
            ).group_by(Comment.type).all()
            
            # Statistiques de modération
            flagged_comments = self.db.query(Comment).filter(
                Comment.status == CommentStatus.FLAGGED,
                Comment.created_at.between(period_start, period_end)
            ).count()
            
            hidden_comments = self.db.query(Comment).filter(
                Comment.status == CommentStatus.HIDDEN,
                Comment.created_at.between(period_start, period_end)
            ).count()
            
            return {
                'top_contributors': [
                    {
                        'name': f"{contrib.first_name} {contrib.last_name}",
                        'role': contrib.role.value,
                        'comments_count': contrib.comments_count
                    }
                    for contrib in top_contributors
                ],
                'comment_types': {
                    comment_type.type.value: comment_type.count
                    for comment_type in comment_types_stats
                },
                'moderation': {
                    'flagged': flagged_comments,
                    'hidden': hidden_comments
                }
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des stats d'engagement: {str(e)}")
            return {
                'top_contributors': [],
                'comment_types': {},
                'moderation': {'flagged': 0, 'hidden': 0}
            }
    
    def get_project_stats(self, period_start: datetime, period_end: datetime) -> Dict[str, Any]:
        """
        Récupère les statistiques des projets
        """
        try:
            # Projets par statut
            projects_by_status = self.db.query(
                Project.status,
                func.count(Project.id).label('count')
            ).filter(
                Project.created_at.between(period_start, period_end)
            ).group_by(Project.status).all()
            
            # Projets les plus actifs (par nombre de commentaires)
            most_active_projects = self.db.query(
                Project.title,
                Project.id,
                func.count(Comment.id).label('comments_count')
            ).join(
                Comment, Project.id == Comment.project_id
            ).filter(
                Comment.created_at.between(period_start, period_end),
                Comment.status == CommentStatus.ACTIVE
            ).group_by(
                Project.id, Project.title
            ).order_by(
                desc('comments_count')
            ).limit(10).all()
            
            # Moyenne de commentaires par projet
            avg_comments_per_project = self.db.query(
                func.avg(Project.comments_count)
            ).scalar() or 0
            
            return {
                'by_status': {
                    status.status.value: status.count
                    for status in projects_by_status
                },
                'most_active': [
                    {
                        'title': project.title,
                        'id': project.id,
                        'comments_count': project.comments_count
                    }
                    for project in most_active_projects
                ],
                'avg_comments_per_project': round(float(avg_comments_per_project), 2)
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des stats projets: {str(e)}")
            return {
                'by_status': {},
                'most_active': [],
                'avg_comments_per_project': 0
            }
    
    def get_datasets_stats(self, period_start: datetime, period_end: datetime) -> Dict[str, Any]:
        """
        Récupère les statistiques des datasets
        """
        try:
            # Datasets par statut
            datasets_by_status = self.db.query(
                Dataset.status,
                func.count(Dataset.id).label('count')
            ).filter(
                Dataset.created_at.between(period_start, period_end)
            ).group_by(Dataset.status).all()
            
            # Score de qualité moyen
            avg_quality_score = self.db.query(
                func.avg(Dataset.overall_quality_score)
            ).filter(
                Dataset.created_at.between(period_start, period_end),
                Dataset.overall_quality_score.isnot(None)
            ).scalar() or 0
            
            # Total des lignes de données traitées
            total_rows_processed = self.db.query(
                func.sum(Dataset.rows_count)
            ).filter(
                Dataset.created_at.between(period_start, period_end),
                Dataset.rows_count.isnot(None)
            ).scalar() or 0
            
            return {
                'by_status': {
                    status.status.value: status.count
                    for status in datasets_by_status
                },
                'avg_quality_score': round(float(avg_quality_score), 2),
                'total_rows_processed': int(total_rows_processed)
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des stats datasets: {str(e)}")
            return {
                'by_status': {},
                'avg_quality_score': 0,
                'total_rows_processed': 0
            }
    
    def _calculate_evolution(self, current: int, previous: int) -> float:
        """
        Calcule l'évolution en pourcentage entre deux périodes
        """
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)
    
    def get_activity_timeline(self, period_start: datetime, period_end: datetime, granularity: str = 'day') -> List[Dict[str, Any]]:
        """
        Récupère la timeline d'activité pour une période donnée
        """
        try:
            timeline = []
            
            if granularity == 'day':
                delta = timedelta(days=1)
            elif granularity == 'week':
                delta = timedelta(weeks=1)
            else:  # month
                delta = timedelta(days=30)
            
            current_date = period_start
            while current_date < period_end:
                next_date = min(current_date + delta, period_end)
                
                # Compter les activités pour cette période
                comments_count = self.db.query(Comment).filter(
                    Comment.created_at.between(current_date, next_date),
                    Comment.status == CommentStatus.ACTIVE
                ).count()
                
                projects_count = self.db.query(Project).filter(
                    Project.created_at.between(current_date, next_date)
                ).count()
                
                datasets_count = self.db.query(Dataset).filter(
                    Dataset.created_at.between(current_date, next_date)
                ).count()
                
                timeline.append({
                    'date': current_date.strftime('%Y-%m-%d'),
                    'comments': comments_count,
                    'projects': projects_count,
                    'datasets': datasets_count,
                    'total_activity': comments_count + projects_count + datasets_count
                })
                
                current_date = next_date
            
            return timeline
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de la timeline: {str(e)}")
            return []


def get_reports_data_service(db: Session) -> ReportsDataService:
    """Factory pour créer une instance du service de données de rapports"""
    return ReportsDataService(db)
