#!/usr/bin/env python3
"""
Script pour supprimer toutes les notifications de test
"""

import sys
import os

# Ajouter le répertoire parent au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.notifications import notification_manager, clean_test_notifications

def main():
    """
    Supprime toutes les notifications de test du système
    """
    print("🧹 NETTOYAGE DES NOTIFICATIONS DE TEST")
    print("=" * 50)
    
    # Afficher l'état initial
    initial_count = len(notification_manager.notifications_store)
    print(f"📊 Notifications actuelles : {initial_count}")
    
    # Afficher les notifications actuelles
    if initial_count > 0:
        print("\n📋 Notifications actuelles :")
        for i, notif in enumerate(notification_manager.notifications_store, 1):
            print(f"  {i}. {notif.get('title', 'Sans titre')} - {notif.get('type', 'unknown')}")
    
    # Nettoyer les notifications de test
    print(f"\n🗑️  Suppression des notifications de test...")
    removed_count = clean_test_notifications()
    
    # Afficher le résultat
    final_count = len(notification_manager.notifications_store)
    print(f"✅ {removed_count} notification(s) de test supprimée(s)")
    print(f"📊 Notifications restantes : {final_count}")
    
    if final_count > 0:
        print("\n📋 Notifications restantes :")
        for i, notif in enumerate(notification_manager.notifications_store, 1):
            print(f"  {i}. {notif.get('title', 'Sans titre')} - {notif.get('type', 'unknown')}")
    else:
        print("\n🎉 Aucune notification dans le système")
    
    print(f"\n✨ Nettoyage terminé !")

if __name__ == "__main__":
    main() 