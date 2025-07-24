"""
API Dashboard Personnalisé pour AgoraFlux
Statistiques et données personnalisées pour chaque utilisateur
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.project import Project, ProjectStatus
from app.models.dataset import Dataset, DatasetStatus
from app.models.comment import Comment, CommentStatus
from app.models.permissions import ProjectPermission


router = APIRouter()


@router.get("/personal")
async def get_personal_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dashboard personnalisé avec toutes les statistiques de l'utilisateur
    """
    user_id = current_user.id
    now = datetime.utcnow()
    
    # === STATISTIQUES PERSONNELLES ===
    
    # Projets créés par l'utilisateur
    user_projects = db.query(Project).filter(Project.owner_id == user_id).all()
    projects_count = len(user_projects)
    active_projects = [p for p in user_projects if p.status == ProjectStatus.ACTIVE]
    completed_projects = [p for p in user_projects if p.status == ProjectStatus.COMPLETED]
    
    # Datasets uploadés par l'utilisateur
    user_datasets = db.query(Dataset).filter(Dataset.uploaded_by_id == user_id).all()
    datasets_count = len(user_datasets)
    processed_datasets = [d for d in user_datasets if d.status == DatasetStatus.PROCESSED]
    
    # Commentaires écrits par l'utilisateur
    user_comments = db.query(Comment).filter(Comment.author_id == user_id).all()
    comments_count = len(user_comments)
    active_comments = [c for c in user_comments if c.status == CommentStatus.ACTIVE]
    
    # Calculer les interactions reçues
    total_replies_received = sum(c.replies_count for c in user_comments)
    total_likes_received = sum(c.likes_count for c in user_comments)
    
    # Total contributions
    total_contributions = projects_count + datasets_count + comments_count
    
    # Calculer l'activité (contributions par jour depuis inscription)
    days_since_creation = max(1, (now - current_user.created_at).days)
    activity_rate = round(total_contributions / days_since_creation, 2)
    
    # === POSITION DANS LA COMMUNAUTÉ ===
    
    # Récupérer tous les utilisateurs avec leurs contributions
    all_users_contributions = db.query(
        User.id,
        func.count(Project.id).label('projects'),
        func.count(Dataset.id).label('datasets'),
        func.count(Comment.id).label('comments')
    ).outerjoin(Project, User.id == Project.owner_id)\
     .outerjoin(Dataset, User.id == Dataset.uploaded_by_id)\
     .outerjoin(Comment, User.id == Comment.author_id)\
     .filter(User.is_active == True)\
     .group_by(User.id).all()
    
    # Calculer le classement
    user_contributions_list = []
    for user_contrib in all_users_contributions:
        total_user_contrib = user_contrib.projects + user_contrib.datasets + user_contrib.comments
        user_contributions_list.append({
            'user_id': user_contrib.id,
            'total_contributions': total_user_contrib
        })
    
    # Trier par contributions décroissantes
    user_contributions_list.sort(key=lambda x: x['total_contributions'], reverse=True)
    
    # Trouver le rang de l'utilisateur actuel
    user_ranking = 1
    for i, user_contrib in enumerate(user_contributions_list):
        if user_contrib['user_id'] == user_id:
            user_ranking = i + 1
            break
    
    total_active_users = len(user_contributions_list)
    community_average = sum(u['total_contributions'] for u in user_contributions_list) / max(1, total_active_users)
    
    # === ACTIVITÉ RÉCENTE ===
    
    # Projets récents (ses propres projets + ceux où il a commenté récemment)
    recent_own_projects = db.query(Project)\
        .filter(Project.owner_id == user_id)\
        .order_by(desc(Project.updated_at))\
        .limit(5).all()
    
    recent_commented_projects = db.query(Project)\
        .join(Comment, Project.id == Comment.project_id)\
        .filter(Comment.author_id == user_id)\
        .filter(Comment.created_at >= now - timedelta(days=30))\
        .order_by(desc(Comment.created_at))\
        .limit(5).all()
    
    # Combiner et dédupliquer
    recent_projects_ids = set()
    recent_projects = []
    for project in recent_own_projects + recent_commented_projects:
        if project.id not in recent_projects_ids:
            recent_projects_ids.add(project.id)
            recent_projects.append({
                'id': project.id,
                'title': project.title,
                'status': project.status.value,
                'updated_at': project.updated_at.isoformat(),
                'is_owner': project.owner_id == user_id,
                'contributor_count': project.contributor_count,
                'comments_count': project.comments_count
            })
    
    # Derniers commentaires
    recent_comments = db.query(Comment)\
        .filter(Comment.author_id == user_id)\
        .order_by(desc(Comment.created_at))\
        .limit(5).all()
    
    recent_comments_data = []
    for comment in recent_comments:
        project = db.query(Project).filter(Project.id == comment.project_id).first()
        recent_comments_data.append({
            'id': comment.id,
            'content': comment.content[:100] + '...' if len(comment.content) > 100 else comment.content,
            'created_at': comment.created_at.isoformat(),
            'project_title': project.title if project else 'Projet supprimé',
            'project_id': comment.project_id,
            'likes_count': comment.likes_count,
            'replies_count': comment.replies_count
        })
    
    # Derniers datasets
    recent_datasets = db.query(Dataset)\
        .filter(Dataset.uploaded_by_id == user_id)\
        .order_by(desc(Dataset.created_at))\
        .limit(5).all()
    
    recent_datasets_data = []
    for dataset in recent_datasets:
        project = db.query(Project).filter(Project.id == dataset.project_id).first()
        recent_datasets_data.append({
            'id': dataset.id,
            'name': dataset.name,
            'status': dataset.status.value,
            'created_at': dataset.created_at.isoformat(),
            'project_title': project.title if project else 'Projet supprimé',
            'project_id': dataset.project_id,
            'file_size_mb': dataset.file_size_mb,
            'quality_score': dataset.overall_quality_score
        })
    
    # === COLLABORATEURS FRÉQUENTS ===
    
    # Utilisateurs qui ont commenté sur ses projets
    frequent_collaborators = db.query(User)\
        .join(Comment, User.id == Comment.author_id)\
        .join(Project, Comment.project_id == Project.id)\
        .filter(Project.owner_id == user_id)\
        .filter(User.id != user_id)\
        .group_by(User.id)\
        .order_by(desc(func.count(Comment.id)))\
        .limit(5).all()
    
    collaborators_data = []
    for collaborator in frequent_collaborators:
        collaborators_data.append({
            'id': collaborator.id,
            'name': f"{collaborator.first_name} {collaborator.last_name}",
            'role': collaborator.role.value,
            'avatar': f"{collaborator.first_name[0]}{collaborator.last_name[0]}"
        })
    
    # === SUGGESTIONS DE PROJETS ===
    
    # Tags favoris de l'utilisateur (basés sur ses projets)
    user_tags = []
    for project in user_projects:
        if project.tags:
            user_tags.extend(project.tag_list)
    
    # Compter les tags les plus fréquents
    tag_counts = {}
    for tag in user_tags:
        tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    favorite_tags = sorted(tag_counts.keys(), key=lambda x: tag_counts[x], reverse=True)[:3]
    
    # Projets suggérés basés sur les tags favoris
    suggested_projects = []
    if favorite_tags:
        for tag in favorite_tags:
            projects_with_tag = db.query(Project)\
                .filter(Project.owner_id != user_id)\
                .filter(Project.status == ProjectStatus.ACTIVE)\
                .filter(Project.tags.contains(tag))\
                .limit(3).all()
            
            for project in projects_with_tag:
                if project.id not in [p['id'] for p in suggested_projects]:
                    suggested_projects.append({
                        'id': project.id,
                        'title': project.title,
                        'description': project.description[:150] + '...' if len(project.description) > 150 else project.description,
                        'tags': project.tag_list,
                        'contributor_count': project.contributor_count,
                        'matching_tag': tag
                    })
    
    # === DONNÉES TEMPORELLES POUR GRAPHIQUES ===
    
    # Contributions au fil du temps (derniers 30 jours)
    contributions_timeline = []
    for i in range(30):
        date = now - timedelta(days=29-i)
        date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date_start + timedelta(days=1)
        
        daily_projects = db.query(Project)\
            .filter(Project.owner_id == user_id)\
            .filter(Project.created_at >= date_start)\
            .filter(Project.created_at < date_end).count()
        
        daily_datasets = db.query(Dataset)\
            .filter(Dataset.uploaded_by_id == user_id)\
            .filter(Dataset.created_at >= date_start)\
            .filter(Dataset.created_at < date_end).count()
        
        daily_comments = db.query(Comment)\
            .filter(Comment.author_id == user_id)\
            .filter(Comment.created_at >= date_start)\
            .filter(Comment.created_at < date_end).count()
        
        contributions_timeline.append({
            'date': date.strftime('%Y-%m-%d'),
            'projects': daily_projects,
            'datasets': daily_datasets,
            'comments': daily_comments,
            'total': daily_projects + daily_datasets + daily_comments
        })
    
    # Progression des projets (par statut)
    projects_progress = {
        'draft': len([p for p in user_projects if p.status == ProjectStatus.DRAFT]),
        'active': len([p for p in user_projects if p.status == ProjectStatus.ACTIVE]),
        'completed': len([p for p in user_projects if p.status == ProjectStatus.COMPLETED]),
        'archived': len([p for p in user_projects if p.status == ProjectStatus.ARCHIVED])
    }
    
    # === RÉPONSE FINALE ===
    
    return {
        "profile": {
            "id": current_user.id,
            "name": f"{current_user.first_name} {current_user.last_name}",
            "email": current_user.email,
            "role": current_user.role.value,
            "member_since": current_user.created_at.isoformat(),
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
            "avatar": f"{current_user.first_name[0]}{current_user.last_name[0]}",
            "bio": current_user.bio,
            "stats": {
                "projects_created": projects_count,
                "datasets_uploaded": datasets_count,
                "comments_written": comments_count,
                "total_contributions": total_contributions,
                "replies_received": total_replies_received,
                "likes_received": total_likes_received,
                "activity_rate": activity_rate,
                "active_projects": len(active_projects),
                "completed_projects": len(completed_projects),
                "processed_datasets": len(processed_datasets)
            }
        },
        "community": {
            "ranking": user_ranking,
            "total_users": total_active_users,
            "community_average": round(community_average, 2),
            "percentile": round((1 - (user_ranking - 1) / total_active_users) * 100, 1) if total_active_users > 0 else 0,
            "favorite_tags": favorite_tags
        },
        "activity": {
            "recent_projects": recent_projects[:5],
            "recent_comments": recent_comments_data,
            "recent_datasets": recent_datasets_data,
            "collaborators": collaborators_data,
            "suggested_projects": suggested_projects[:6]
        },
        "charts": {
            "contributions_timeline": contributions_timeline,
            "projects_progress": projects_progress,
            "interaction_stats": {
                "comments_per_project": round(comments_count / max(1, projects_count), 2),
                "replies_per_comment": round(total_replies_received / max(1, comments_count), 2),
                "likes_per_comment": round(total_likes_received / max(1, comments_count), 2),
                "datasets_per_project": round(datasets_count / max(1, projects_count), 2)
            }
        },
        "metadata": {
            "generated_at": now.isoformat(),
            "data_freshness": "real-time",
            "calculations_based_on": "user_real_data"
        }
    } 