#!/usr/bin/env python3
"""
Script de migration vers le système de sécurité simplifié
Mise à jour des rôles et ajout des tables de sécurité
"""

import sys
import os
from datetime import timedelta

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base
from app.models.permissions import ProjectPermission, ProjectRole
from app.core.security_logging import SecurityLog, SecurityEventType
from app.models.user import User
from app.models.project import Project


def update_security_system():
    """
    Met à jour le système de sécurité avec les 3 rôles simplifiés
    """
    print("🔄 Mise à jour du système de sécurité vers les 3 rôles simplifiés")
    print("=" * 70)
    
    # Créer le moteur de base de données
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        # 1. Créer les nouvelles tables
        print("1. 📊 Création des tables de sécurité...")
        Base.metadata.create_all(
            bind=engine, 
            tables=[ProjectPermission.__table__, SecurityLog.__table__]
        )
        print("    Tables créées : project_permissions, security_logs")
        
        with engine.connect() as conn:
            trans = conn.begin()
            
            try:
                # 2. Migrer les permissions existantes
                print("\n2. 🔄 Migration des permissions existantes...")
                
                # Supprimer les anciennes permissions invalides (s'il y en a)
                conn.execute(text("DELETE FROM project_permissions WHERE role NOT IN ('admin', 'moderator', 'user')"))
                
                # Récupérer tous les projets
                projects_result = conn.execute(text("SELECT id, owner_id FROM projects"))
                projects = projects_result.fetchall()
                
                print(f"   📂 {len(projects)} projet(s) trouvé(s)")
                
                for project_id, owner_id in projects:
                    # Vérifier si le propriétaire a déjà une permission
                    existing = conn.execute(
                        text("SELECT id FROM project_permissions WHERE user_id = :user_id AND project_id = :project_id"),
                        {"user_id": owner_id, "project_id": project_id}
                    ).fetchone()
                    
                    if not existing:
                        # Créer la permission admin pour le propriétaire
                        conn.execute(
                            text("""
                                INSERT INTO project_permissions (
                                    user_id, project_id, role, granted_by_id, granted_at, is_active,
                                    can_view_project, can_view_datasets, can_view_comments,
                                    can_edit_project, can_delete_project, can_upload_datasets, can_delete_datasets,
                                    can_create_comments, can_edit_comments, can_delete_comments, can_moderate_comments,
                                    can_manage_users, can_export_data
                                ) VALUES (
                                    :user_id, :project_id, 'admin', :granted_by_id, NOW(), TRUE,
                                    TRUE, TRUE, TRUE,
                                    TRUE, TRUE, TRUE, TRUE,
                                    TRUE, TRUE, TRUE, TRUE,
                                    TRUE, TRUE
                                )
                            """),
                            {
                                "user_id": owner_id,
                                "project_id": project_id,
                                "granted_by_id": owner_id
                            }
                        )
                
                print("    Permissions des propriétaires créées")
                
                # 3. Vérifier et corriger les rôles utilisateur
                print("\n3. 👥 Vérification des rôles utilisateur...")
                
                # Compter les utilisateurs par rôle
                roles_result = conn.execute(text("SELECT role, COUNT(*) FROM users GROUP BY role"))
                role_counts = dict(roles_result.fetchall())
                
                print("   📊 Répartition actuelle des rôles :")
                for role, count in role_counts.items():
                    print(f"      - {role}: {count}")
                
                # Corriger les rôles invalides (s'il y en a)
                invalid_roles = [role for role in role_counts.keys() if role not in ['admin', 'moderateur', 'utilisateur']]
                if invalid_roles:
                    print(f"   ⚠️  Rôles invalides détectés : {invalid_roles}")
                    # Les convertir en 'utilisateur' par défaut
                    for invalid_role in invalid_roles:
                        conn.execute(
                            text("UPDATE users SET role = 'utilisateur' WHERE role = :invalid_role"),
                            {"invalid_role": invalid_role}
                        )
                    print("    Rôles invalides corrigés vers 'utilisateur'")
                
                # 4. Créer un log de migration
                print("\n4. 📝 Création du log de migration...")
                
                conn.execute(
                    text("""
                        INSERT INTO security_logs (
                            event_type, user_email, ip_address, resource_type, action, 
                            success, additional_data, timestamp
                        ) VALUES (
                            'admin_access', 'system@agoraflux.fr', '127.0.0.1', 'system', 'security_migration',
                            TRUE, '{"migration": "simplified_roles", "version": "1.0"}', NOW()
                        )
                    """)
                )
                
                # Valider la transaction
                trans.commit()
                print("    Migration terminée avec succès")
                
            except Exception as e:
                trans.rollback()
                raise e
        
        # 5. Vérifications post-migration
        print("\n5. 🔍 Vérifications post-migration...")
        verify_migration(engine)
        
        print("\n" + "=" * 70)
        print(" Système de sécurité mis à jour avec succès !")
        print("\n📋 Résumé des changements :")
        print("   • Système simplifié à 3 rôles : admin/modérateur/utilisateur")
        print("   • Permissions granulaires par projet")
        print("   • Journalisation des événements de sécurité")
        print("   • Audit automatique des accès sensibles")
        
        return True
        
    except Exception as e:
        print(f"\n Erreur lors de la migration : {str(e)}")
        return False


def verify_migration(engine):
    """
    Vérifie que la migration s'est bien passée
    """
    with engine.connect() as conn:
        # Vérifier les permissions
        perm_count = conn.execute(text("SELECT COUNT(*) FROM project_permissions")).scalar()
        print(f"   📊 {perm_count} permission(s) de projet créée(s)")
        
        # Vérifier les rôles
        role_summary = conn.execute(text("""
            SELECT role, COUNT(*) 
            FROM project_permissions 
            GROUP BY role
        """)).fetchall()
        
        print("   📋 Répartition des rôles de projet :")
        for role, count in role_summary:
            print(f"      - {role}: {count}")
        
        # Vérifier les logs de sécurité
        log_count = conn.execute(text("SELECT COUNT(*) FROM security_logs")).scalar()
        print(f"   📝 {log_count} entrée(s) dans les logs de sécurité")
        
        # Vérifier les rôles utilisateur
        user_roles = conn.execute(text("""
            SELECT role, COUNT(*) 
            FROM users 
            GROUP BY role
        """)).fetchall()
        
        print("   👥 Répartition des rôles utilisateur :")
        for role, count in user_roles:
            print(f"      - {role}: {count}")


def create_security_documentation():
    """
    Affiche la documentation du nouveau système de sécurité
    """
    print("\n" + "=" * 70)
    print("📚 DOCUMENTATION DU SYSTÈME DE SÉCURITÉ")
    print("=" * 70)
    
    print("\n🔐 RÔLES SIMPLIFIÉS :")
    print("   1. admin        → Tous les droits sur la plateforme")
    print("   2. moderateur   → Modération + accès étendu")
    print("   3. utilisateur  → Utilisateur standard")
    
    print("\n🛡️ PERMISSIONS PAR PROJET :")
    print("   • admin     → Gestion complète du projet")
    print("   • moderator → Modération + contribution")
    print("   • user      → Lecture + contribution de base")
    
    print("\n📊 JOURNALISATION AUTOMATIQUE :")
    print("   • Connexions/déconnexions")
    print("   • Accès aux routes sensibles")
    print("   • Modifications de permissions")
    print("   • Actions administratives")
    
    print("\n🚨 SÉCURITÉ RENFORCÉE :")
    print("   • Limitation des tentatives de connexion")
    print("   • Détection d'activités suspectes")
    print("   • Audit automatique des accès")
    print("   • Rate limiting par IP")
    
    print("\n📋 ROUTES SÉCURISÉES :")
    print("   • /api/v1/auth/*         → Authentification")
    print("   • /api/v1/admin/*        → Administration") 
    print("   • /api/v1/permissions/*  → Gestion permissions")
    print("   • /api/v1/exports/*      → Exports de données")
    
    print("\n💡 PROCHAINES ÉTAPES :")
    print("   1. Intégrer les middlewares de sécurité")
    print("   2. Configurer la journalisation")
    print("   3. Tester les permissions")
    print("   4. Former les utilisateurs")


def main():
    """
    Fonction principale
    """
    print("🚀 MIGRATION SYSTÈME DE SÉCURITÉ AGORAFLUX")
    print("Passage aux 3 rôles simplifiés + journalisation")
    print("=" * 70)
    
    # Demander confirmation
    response = input("Voulez-vous procéder à la migration ? [y/N]: ")
    if response.lower() not in ['y', 'yes', 'oui']:
        print(" Migration annulée par l'utilisateur")
        return
    
    # Effectuer la migration
    success = update_security_system()
    
    if success:
        create_security_documentation()
        print("\n🎉 Migration terminée avec succès !")
        print("Le système de sécurité est maintenant conforme aux exigences.")
    else:
        print("\n💥 Migration échouée. Vérifiez les logs d'erreur.")
        sys.exit(1)


if __name__ == "__main__":
    main() 