#!/usr/bin/env python3
"""
Script de test pour les API du pipeline de données AgoraFlux
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

# Données de connexion admin
ADMIN_CREDENTIALS = {
    "email": "admin@agoraflux.fr",
    "password": "admin123"
}

def get_admin_token():
    """Récupère le token d'authentification admin"""
    print("🔐 Connexion admin...")
    
    response = requests.post(
        f"{API_URL}/auth/token",
        data={
            "username": ADMIN_CREDENTIALS["email"],
            "password": ADMIN_CREDENTIALS["password"]
        }
    )
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f" Token récupéré: {token[:20]}...")
        return token
    else:
        print(f" Erreur connexion: {response.status_code}")
        print(response.text)
        return None

def test_api_endpoints():
    """Test tous les endpoints du pipeline"""
    print("🚀 Test des API du pipeline de données AgoraFlux\n")
    
    # Récupération du token
    token = get_admin_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Liste des sources
    print("\n📊 Test 1: Liste des sources de données")
    response = requests.get(f"{API_URL}/data/sources")
    if response.status_code == 200:
        sources = response.json()
        print(f" {sources['total_sources']} sources configurées:")
        for source in sources['sources']:
            print(f"  - {source['name']}: {source['description']}")
    else:
        print(f" Erreur: {response.status_code}")
    
    # Test 2: Statut du pipeline
    print("\n⚙️ Test 2: Statut du pipeline")
    response = requests.get(f"{API_URL}/data/status")
    if response.status_code == 200:
        status = response.json()
        print(f" Pipeline en cours: {status['is_running']}")
        print(f"📊 Sources configurées: {status['sources_configured']}")
        if status['last_run']:
            print(f"🕐 Dernière exécution: {status['last_run'].get('started_at', 'N/A')}")
    else:
        print(f" Erreur: {response.status_code}")
    
    # Test 3: Données mock
    print("\n🧪 Test 3: Données de test")
    for data_type in ['budget', 'participation']:
        response = requests.get(f"{API_URL}/data/mock-data/{data_type}")
        if response.status_code == 200:
            data = response.json()
            print(f" {data_type}: {len(data['data'])} enregistrements")
        else:
            print(f" Erreur {data_type}: {response.status_code}")
    
    # Test 4: Exécution synchrone du pipeline (avec données mock)
    print("\n🔄 Test 4: Exécution pipeline synchrone")
    payload = {
        "use_mock_data": True,
        "source_keys": ["paris_budget"]  # Test partiel pour être plus rapide
    }
    
    response = requests.post(
        f"{API_URL}/data/run-sync",
        headers=headers,
        json=payload
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f" Pipeline exécuté avec succès")
        pipeline_result = result.get('result', {})
        print(f"📊 Enregistrements injectés: {pipeline_result.get('injected_records', 0)}")
        print(f"⏱️ Durée: {pipeline_result.get('duration_seconds', 0):.2f}s")
        if 'quality_scores' in pipeline_result:
            print("🎯 Scores de qualité:")
            for source, score in pipeline_result['quality_scores'].items():
                print(f"  - {source}: {score:.1f}%")
    else:
        print(f" Erreur: {response.status_code}")
        print(response.text)
    
    # Test 5: Liste des datasets
    print("\n📋 Test 5: Liste des datasets")
    response = requests.get(f"{API_URL}/data/datasets")
    if response.status_code == 200:
        datasets = response.json()
        print(f" {datasets['total']} datasets trouvés:")
        for dataset in datasets['datasets']:
            print(f"  - {dataset['name']} (ID: {dataset['id']}, Qualité: {dataset['quality_score']:.1f}%)")
        
        # Test 6: Détails d'un dataset
        if datasets['datasets']:
            dataset_id = datasets['datasets'][0]['id']
            print(f"\n🔍 Test 6: Détails dataset {dataset_id}")
            response = requests.get(f"{API_URL}/data/datasets/{dataset_id}")
            if response.status_code == 200:
                details = response.json()
                print(f" Dataset: {details['name']}")
                print(f"📊 Lignes: {details['rows_count']}")
                print(f"🎯 Qualité globale: {details['quality_scores']['overall']:.1f}%")
                print(f"📋 Échantillon: {len(details['sample_data'])} lignes")
            else:
                print(f" Erreur détails: {response.status_code}")
            
            # Test 7: Données du dataset
            print(f"\n📈 Test 7: Données dataset {dataset_id}")
            response = requests.get(f"{API_URL}/data/datasets/{dataset_id}/data?limit=5")
            if response.status_code == 200:
                data = response.json()
                print(f" {data['total_records']} enregistrements")
                print(f"📊 Type: {data['data_type']}")
                print(f"🎯 Qualité: {data['quality_score']:.1f}%")
                if data['data']:
                    print(f"📋 Premier enregistrement: {list(data['data'][0].keys())}")
            else:
                print(f" Erreur données: {response.status_code}")
    else:
        print(f" Erreur: {response.status_code}")
    
    # Test 8: Dernière exécution
    print("\n📜 Test 8: Dernière exécution")
    response = requests.get(f"{API_URL}/data/last-run")
    if response.status_code == 200:
        last_run = response.json()
        print(f" Exécution {last_run.get('pipeline_id', 'N/A')}")
        print(f"📊 Statut: {last_run.get('status', 'N/A')}")
        print(f"⏱️ Durée: {last_run.get('duration_seconds', 0):.2f}s")
    else:
        print(f" Erreur: {response.status_code}")
    
    print("\n Tests terminés avec succès !")

if __name__ == "__main__":
    try:
        test_api_endpoints()
    except requests.exceptions.ConnectionError:
        print(" Erreur: Impossible de se connecter au serveur")
        print("💡 Assurez-vous que le serveur FastAPI est démarré sur http://localhost:8000")
    except Exception as e:
        print(f" Erreur inattendue: {str(e)}") 