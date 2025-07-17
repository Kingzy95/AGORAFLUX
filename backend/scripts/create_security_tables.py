#!/usr/bin/env python3
"""
Script pour créer les tables de sécurité d'AgoraFlux
Version simplifiée sans migration de données
"""

import sys
import os

# Ajouter le répertoire parent au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models.permissions import ProjectPermission, ProjectRole  
from app.core.security_logging import SecurityLog, SecurityEventType
from sqlalchemy import text

def main():
    """
    Crée toutes les tables de sécurité
    """
    print("🔐 CRÉATION DES TABLES DE SÉCURITÉ AGORAFLUX")
    print("=" * 50)
    
    try:
        # 1. Créer toutes les tables
        print("📊 Création des tables...")
        Base.metadata.create_all(bind=engine)
        print("   ✅ Tables créées avec succès")
        
        # 2. Vérifier les tables créées
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('security_logs', 'project_permissions')
            """))
            
            tables = [row[0] for row in result]
            
            for table in ['security_logs', 'project_permissions']:
                if table in tables:
                    print(f"   ✅ Table {table} créée")
                else:
                    print(f"   ❌ Table {table} manquante")
        
        print("\n🎉 Configuration de sécurité terminée !")
        print("\nPrêt pour :")
        print("   • Journalisation automatique des connexions")
        print("   • Audit des accès sensibles") 
        print("   • Gestion des permissions par projet")
        print("   • Protection contre les attaques")
        
    except Exception as e:
        print(f"\n❌ Erreur : {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 