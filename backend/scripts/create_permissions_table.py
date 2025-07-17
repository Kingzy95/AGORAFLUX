#!/usr/bin/env python3
"""
Script pour créer la table des permissions de projet
"""

import sys
import os

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base
from app.models.permissions import ProjectPermission, ProjectRole
from app.models.user import User
from app.models.project import Project


def create_permissions_table():
    """
    Crée la table des permissions et initialise les permissions pour les projets existants
    """
    print("🔧 Création de la table des permissions...")
    
    # Créer le moteur de base de données
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        # Créer la table des permissions
        Base.metadata.create_all(bind=engine, tables=[ProjectPermission.__table__])
        print("✅ Table project_permissions créée avec succès")
        
        # Initialiser les permissions pour les projets existants
        with engine.connect() as conn:
            # Commencer une transaction
            trans = conn.begin()
            
            try:
                # Récupérer tous les projets existants
                result = conn.execute(text("SELECT id, owner_id FROM projects"))
                projects = result.fetchall()
                
                print(f"📊 {len(projects)} projet(s) trouvé(s)")
                
                # Créer les permissions pour chaque propriétaire de projet
                for project in projects:
                    project_id, owner_id = project
                    
                    # Vérifier si une permission existe déjà
                    check_result = conn.execute(
                        text("SELECT id FROM project_permissions WHERE user_id = :user_id AND project_id = :project_id"),
                        {"user_id": owner_id, "project_id": project_id}
                    )
                    
                    if check_result.fetchone() is None:
                        # Insérer la permission du propriétaire
                        conn.execute(
                            text("""
                                INSERT INTO project_permissions (
                                    user_id, project_id, role, granted_by_id, granted_at, is_active,
                                    can_view_project, can_view_datasets, can_view_comments, can_view_analytics,
                                    can_edit_project, can_delete_project, can_upload_datasets, can_delete_datasets,
                                    can_create_comments, can_edit_own_comments, can_delete_own_comments,
                                    can_moderate_comments, can_pin_comments, can_hide_comments,
                                    can_manage_permissions, can_invite_users, can_remove_users,
                                    can_export_data, can_generate_reports
                                ) VALUES (
                                    :user_id, :project_id, 'owner', :granted_by_id, NOW(), TRUE,
                                    TRUE, TRUE, TRUE, TRUE,
                                    TRUE, TRUE, TRUE, TRUE,
                                    TRUE, TRUE, TRUE,
                                    TRUE, TRUE, TRUE,
                                    TRUE, TRUE, TRUE,
                                    TRUE, TRUE
                                )
                            """),
                            {
                                "user_id": owner_id,
                                "project_id": project_id,
                                "granted_by_id": owner_id
                            }
                        )
                        
                        print(f"✅ Permission créée pour le projet {project_id} (propriétaire: {owner_id})")
                
                # Valider la transaction
                trans.commit()
                print("✅ Toutes les permissions ont été créées avec succès")
                
            except Exception as e:
                # Annuler la transaction en cas d'erreur
                trans.rollback()
                raise e
                
    except Exception as e:
        print(f"❌ Erreur lors de la création des permissions: {str(e)}")
        return False
    
    return True


def verify_permissions():
    """
    Vérifie que les permissions ont été créées correctement
    """
    print("🔍 Vérification des permissions...")
    
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Compter les permissions
            result = conn.execute(text("SELECT COUNT(*) FROM project_permissions"))
            permission_count = result.scalar()
            
            # Compter les projets
            result = conn.execute(text("SELECT COUNT(*) FROM projects"))
            project_count = result.scalar()
            
            print(f"📊 {permission_count} permission(s) créée(s) pour {project_count} projet(s)")
            
            # Vérifier les rôles
            result = conn.execute(text("SELECT role, COUNT(*) FROM project_permissions GROUP BY role"))
            role_counts = result.fetchall()
            
            print("📋 Répartition des rôles:")
            for role, count in role_counts:
                print(f"   - {role}: {count}")
            
            return True
            
    except Exception as e:
        print(f"❌ Erreur lors de la vérification: {str(e)}")
        return False


def main():
    """
    Fonction principale
    """
    print("🚀 Initialisation du système de permissions granulaires")
    print("=" * 60)
    
    # Créer les tables et permissions
    if create_permissions_table():
        print("\n" + "=" * 60)
        verify_permissions()
        print("\n✅ Système de permissions initialisé avec succès!")
        print("\n📖 Les propriétaires de projets ont maintenant des permissions complètes.")
        print("   Vous pouvez maintenant inviter d'autres utilisateurs avec des rôles spécifiques.")
    else:
        print("\n❌ Échec de l'initialisation du système de permissions")
        sys.exit(1)


if __name__ == "__main__":
    main() 