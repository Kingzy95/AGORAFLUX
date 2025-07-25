#!/usr/bin/env python
"""
Test simple pour valider le schéma d'inscription
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_registration_schema():
    """Test du schéma UserRegistration"""
    try:
        from app.schemas.auth import UserRegistration
        
        # Données exactes du frontend qui échouent
        data = {
            'first_name': 'Emmanuel',
            'last_name': 'Mingui',
            'email': 'emmannuelmingui@gmail.com',
            'password': 'Mpaka120!',
            'confirmPassword': 'Mpaka120!'
        }
        
        print("🧪 Test du schéma UserRegistration...")
        print(f"Données d'entrée: {data}")
        
        # Créer l'objet UserRegistration
        user_reg = UserRegistration(**data)
        
        print("✅ VALIDATION RÉUSSIE!")
        print(f"   Email: {user_reg.email}")
        print(f"   Nom: {user_reg.first_name} {user_reg.last_name}")
        print(f"   Mot de passe: ***")
        print(f"   Confirmation: {'OK' if user_reg.confirmPassword else 'MANQUANT'}")
        print(f"   Bio: {user_reg.bio or 'Non renseignée'}")
        
        return True
        
    except Exception as e:
        print(f"❌ ERREUR DE VALIDATION: {e}")
        import traceback
        print("Traceback complet:")
        traceback.print_exc()
        return False

def test_service_registration():
    """Test du service d'inscription"""
    try:
        from app.core.database import SessionLocal
        from app.services.auth_service import AuthService
        from app.schemas.auth import UserRegistration
        
        print("\n🧪 Test du service d'inscription...")
        
        data = UserRegistration(
            first_name='Emmanuel',
            last_name='Mingui',
            email='test@example.com',
            password='Mpaka120!',
            confirmPassword='Mpaka120!'
        )
        
        db = SessionLocal()
        try:
            auth_service = AuthService(db)
            
            # Supprimer l'utilisateur test s'il existe
            existing = auth_service.get_user_by_email(data.email)
            if existing:
                db.delete(existing)
                db.commit()
                print(f"   Utilisateur test supprimé: {data.email}")
            
            # Créer l'utilisateur
            user = auth_service.register_user(data)
            print(f"✅ UTILISATEUR CRÉÉ!")
            print(f"   ID: {user.id}")
            print(f"   Email: {user.email}")
            print(f"   Nom: {user.first_name} {user.last_name}")
            print(f"   Bio: {user.bio or 'Non renseignée'}")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ ERREUR SERVICE: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Test de l'inscription AgoraFlux\n")
    
    # Test 1: Schéma
    schema_ok = test_registration_schema()
    
    # Test 2: Service (seulement si le schéma fonctionne)
    if schema_ok:
        service_ok = test_service_registration()
        
        if service_ok:
            print("\n🎉 TOUS LES TESTS RÉUSSIS! L'inscription devrait fonctionner.")
        else:
            print("\n⚠️  Schéma OK mais problème service.")
    else:
        print("\n❌ Échec du test schéma - à corriger d'abord.")