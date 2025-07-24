#!/usr/bin/env python3
"""
Script de test pour vérifier tous les endpoints de collaboration
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_endpoint(method, endpoint, description, payload=None):
    """Test un endpoint et affiche le résultat"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=payload, timeout=5)
        else:
            print(f"❓ {description}: Méthode {method} non supportée")
            return
        
        # Vérifier le code de statut
        if response.status_code == 404:
            print(f" {description}: Endpoint introuvable (404)")
        elif response.status_code == 401:
            print(f"🔐 {description}: Authentification requise (401) - Endpoint existe")
        elif response.status_code == 422:
            print(f"📝 {description}: Paramètres invalides (422) - Endpoint existe")
        elif response.status_code < 300:
            print(f" {description}: Succès ({response.status_code})")
        else:
            print(f"⚠️ {description}: Code {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print(f"🔌 {description}: Serveur non disponible")
    except requests.exceptions.Timeout:
        print(f"⏰ {description}: Timeout")
    except Exception as e:
        print(f" {description}: Erreur - {str(e)}")

def main():
    """Tester tous les endpoints de collaboration"""
    print("🧪 TEST DES ENDPOINTS DE COLLABORATION")
    print("=" * 50)
    print()
    
    # Endpoints à tester
    endpoints = [
        ("GET", "/collaboration/annotations", "Récupérer les annotations"),
        ("POST", "/collaboration/annotations", "Créer une annotation", {
            "x": 100,
            "y": 200,
            "content": "Test annotation",
            "category": "question"
        }),
        ("GET", "/collaboration/online-users", "Utilisateurs en ligne"),
        ("GET", "/collaboration/stats", "Statistiques de collaboration"),
        ("POST", "/collaboration/replies", "Créer une réponse", {
            "annotation_id": "test",
            "content": "Test reply"
        }),
        ("POST", "/collaboration/reactions", "Ajouter une réaction", {
            "target_id": "test",
            "target_type": "annotation",
            "emoji": "👍"
        }),
        ("GET", "/collaboration/health", "Santé du module collaboration")
    ]
    
    # Tester chaque endpoint
    for method, endpoint, description, *payload in endpoints:
        payload_data = payload[0] if payload else None
        test_endpoint(method, endpoint, description, payload_data)
    
    print()
    print("🎯 Endpoints problématiques identifiés :")
    print("   - Les endpoints avec 🔐 ou 📝 existent mais nécessitent une authentification")
    print("   - Les endpoints avec  sont introuvables (vérifier les routes)")
    print("   - Les endpoints avec  fonctionnent parfaitement")

if __name__ == "__main__":
    main() 