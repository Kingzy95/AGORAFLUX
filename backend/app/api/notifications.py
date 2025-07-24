"""
Module API pour les notifications temps réel AgoraFlux
"""

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid
import json
import asyncio
from collections import defaultdict

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

# Modèles Pydantic
class NotificationBase(BaseModel):
    type: str  # 'comment', 'export', 'project', 'system', 'mention'
    title: str
    message: str
    data: Dict[str, Any] = {}
    priority: str = "normal"  # 'low', 'normal', 'high', 'urgent'

class NotificationCreate(NotificationBase):
    recipient_id: str
    sender_id: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    data: Dict[str, Any]
    priority: str
    recipient_id: str
    sender_id: Optional[str]
    sender_name: Optional[str]
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]

class NotificationUpdate(BaseModel):
    is_read: bool

class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]

# Gestionnaire WebSocket
class NotificationManager:
    def __init__(self):
        # Connexions actives par user_id
        self.active_connections: Dict[str, List[WebSocket]] = defaultdict(list)
        # Store des notifications en mémoire
        self.notifications_store: List[Dict] = []
        
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accepter une nouvelle connexion WebSocket"""
        await websocket.accept()
        self.active_connections[user_id].append(websocket)
        
        # Envoyer les notifications non lues
        await self.send_unread_notifications(user_id, websocket)
        
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Supprimer une connexion WebSocket"""
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_unread_notifications(self, user_id: str, websocket: WebSocket):
        """Envoyer les notifications non lues à une connexion"""
        unread_notifications = [
            notif for notif in self.notifications_store 
            if notif["recipient_id"] == user_id and not notif["is_read"]
        ]
        
        if unread_notifications:
            message = {
                "type": "unread_notifications",
                "data": {
                    "notifications": unread_notifications,
                    "count": len(unread_notifications)
                }
            }
            await websocket.send_text(json.dumps(message, default=str))
    
    async def send_notification(self, notification: Dict):
        """Envoyer une notification à un utilisateur spécifique"""
        user_id = notification["recipient_id"]
        
        # Ajouter au store
        self.notifications_store.append(notification)
        
        # Envoyer à toutes les connexions actives de cet utilisateur
        if user_id in self.active_connections:
            message = {
                "type": "new_notification",
                "data": notification
            }
            
            # Envoyer à toutes les connexions de cet utilisateur
            disconnected_connections = []
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message, default=str))
                except:
                    disconnected_connections.append(websocket)
            
            # Nettoyer les connexions fermées
            for websocket in disconnected_connections:
                self.active_connections[user_id].remove(websocket)
    
    async def broadcast_notification(self, notification: Dict, exclude_user: Optional[str] = None):
        """Diffuser une notification à tous les utilisateurs connectés"""
        message = {
            "type": "broadcast_notification",
            "data": notification
        }
        
        for user_id, connections in self.active_connections.items():
            if exclude_user and user_id == exclude_user:
                continue
                
            disconnected_connections = []
            for websocket in connections:
                try:
                    await websocket.send_text(json.dumps(message, default=str))
                except:
                    disconnected_connections.append(websocket)
            
            # Nettoyer les connexions fermées
            for websocket in disconnected_connections:
                connections.remove(websocket)
    
    def get_user_notifications(self, user_id: str, limit: int = 50, offset: int = 0) -> List[Dict]:
        """Récupérer les notifications d'un utilisateur"""
        user_notifications = [
            notif for notif in self.notifications_store 
            if notif["recipient_id"] == user_id
        ]
        
        # Trier par date (plus récentes en premier)
        user_notifications.sort(key=lambda x: x["created_at"], reverse=True)
        
        return user_notifications[offset:offset + limit]
    
    def mark_notification_read(self, notification_id: str, user_id: str) -> bool:
        """Marquer une notification comme lue"""
        for notif in self.notifications_store:
            if notif["id"] == notification_id and notif["recipient_id"] == user_id:
                notif["is_read"] = True
                notif["read_at"] = datetime.now()
                return True
        return False
    
    def get_unread_count(self, user_id: str) -> int:
        """Compter les notifications non lues"""
        return len([
            notif for notif in self.notifications_store 
            if notif["recipient_id"] == user_id and not notif["is_read"]
        ])

# Instance globale du gestionnaire
notification_manager = NotificationManager()

# Fonction utilitaire pour créer des notifications
async def create_notification(
    type: str,
    title: str,
    message: str,
    recipient_id: str,
    sender_id: Optional[str] = None,
    data: Dict[str, Any] = None,
    priority: str = "normal"
):
    """Créer et envoyer une notification"""
    
    # Prévenir la création de notifications de test (sauf si explicitement autorisé)
    test_keywords = ["test", "Test", "TEST", "demo", "Demo", "DEMO", "exemple", "Exemple"]
    if any(keyword in title or keyword in message for keyword in test_keywords):
        # Permettre uniquement si c'est explicitement marqué comme autorisé
        if not data or not data.get("allow_test_notification", False):
            print(f"⚠️ Tentative de création d'une notification de test bloquée: {title}")
            return None
    
    notification = {
        "id": str(uuid.uuid4()),
        "type": type,
        "title": title,
        "message": message,
        "data": data or {},
        "priority": priority,
        "recipient_id": recipient_id,
        "sender_id": sender_id,
        "sender_name": None,  # À remplir si nécessaire
        "is_read": False,
        "created_at": datetime.now(),
        "read_at": None
    }
    
    await notification_manager.send_notification(notification)
    return notification

# Fonction pour nettoyer les notifications de test
def clean_test_notifications():
    """Supprime toutes les notifications de test"""
    test_keywords = ["test", "Test", "TEST", "demo", "Demo", "DEMO", "exemple", "Exemple"]
    
    initial_count = len(notification_manager.notifications_store)
    
    # Filtrer les notifications qui ne contiennent pas de mots-clés de test
    notification_manager.notifications_store = [
        notif for notif in notification_manager.notifications_store
        if not any(keyword in notif.get("title", "") or keyword in notif.get("message", "") 
                  for keyword in test_keywords)
    ]
    
    final_count = len(notification_manager.notifications_store)
    removed_count = initial_count - final_count
    
    return removed_count

# WebSocket endpoint
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Endpoint WebSocket pour les notifications temps réel"""
    await notification_manager.connect(websocket, user_id)
    
    try:
        while True:
            # Maintenir la connexion active
            data = await websocket.receive_text()
            
            # Traiter les messages du client si nécessaire
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif message.get("type") == "mark_read":
                    notification_id = message.get("notification_id")
                    if notification_id:
                        notification_manager.mark_notification_read(notification_id, user_id)
            except json.JSONDecodeError:
                pass
                
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket, user_id)

# Endpoints REST
@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    limit: int = 50,
    offset: int = 0,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les notifications de l'utilisateur"""
    notifications = notification_manager.get_user_notifications(
        str(current_user.id), limit, offset
    )
    
    if unread_only:
        notifications = [notif for notif in notifications if not notif["is_read"]]
    
    return [NotificationResponse(**notif) for notif in notifications]

@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer le nombre de notifications non lues"""
    count = notification_manager.get_unread_count(str(current_user.id))
    return {"unread_count": count}

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marquer une notification comme lue"""
    success = notification_manager.mark_notification_read(notification_id, str(current_user.id))
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    
    return {"message": "Notification marquée comme lue"}

@router.put("/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marquer toutes les notifications comme lues"""
    user_id = str(current_user.id)
    count = 0
    
    for notif in notification_manager.notifications_store:
        if notif["recipient_id"] == user_id and not notif["is_read"]:
            notif["is_read"] = True
            notif["read_at"] = datetime.now()
            count += 1
    
    return {"message": f"{count} notifications marquées comme lues"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une notification"""
    user_id = str(current_user.id)
    
    for i, notif in enumerate(notification_manager.notifications_store):
        if notif["id"] == notification_id and notif["recipient_id"] == user_id:
            notification_manager.notifications_store.pop(i)
            return {"message": "Notification supprimée"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Notification non trouvée"
    )

@router.get("/admin/all")
async def get_all_notifications_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lister toutes les notifications du système (pour debug/admin)
    Réservé aux administrateurs et modérateurs
    """
    # Vérifier les permissions
    if current_user.role not in ["admin", "moderateur"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé : seuls les administrateurs et modérateurs peuvent voir toutes les notifications"
        )
    
    notifications = notification_manager.notifications_store
    
    # Analyser les notifications
    total_count = len(notifications)
    unread_count = len([n for n in notifications if not n["is_read"]])
    
    # Grouper par type
    by_type = {}
    for notif in notifications:
        type_name = notif.get("type", "unknown")
        if type_name not in by_type:
            by_type[type_name] = 0
        by_type[type_name] += 1
    
    # Détecter les notifications de test
    test_keywords = ["test", "Test", "TEST", "demo", "Demo", "DEMO", "exemple", "Exemple"]
    test_notifications = [
        notif for notif in notifications
        if any(keyword in notif.get("title", "") or keyword in notif.get("message", "") 
               for keyword in test_keywords)
    ]
    
    return {
        "total_notifications": total_count,
        "unread_notifications": unread_count,
        "notifications_by_type": by_type,
        "test_notifications_count": len(test_notifications),
        "test_notifications": [
            {
                "id": notif["id"],
                "title": notif["title"],
                "message": notif["message"],
                "type": notif["type"],
                "recipient_id": notif["recipient_id"],
                "created_at": notif["created_at"]
            }
            for notif in test_notifications
        ],
        "all_notifications": [
            {
                "id": notif["id"],
                "title": notif["title"],
                "message": notif["message"][:100] + "..." if len(notif["message"]) > 100 else notif["message"],
                "type": notif["type"],
                "recipient_id": notif["recipient_id"],
                "is_read": notif["is_read"],
                "created_at": notif["created_at"]
            }
            for notif in notifications
        ]
    }

@router.delete("/test-notifications")
async def delete_test_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprimer toutes les notifications de test
    Réservé aux administrateurs et modérateurs
    """
    # Vérifier les permissions
    if current_user.role not in ["admin", "moderateur"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé : seuls les administrateurs et modérateurs peuvent supprimer les notifications de test"
        )
    
    removed_count = clean_test_notifications()
    
    return {
        "message": f"{removed_count} notification(s) de test supprimée(s)",
        "removed_count": removed_count,
        "remaining_notifications": len(notification_manager.notifications_store)
    }

@router.get("/health")
async def notifications_health():
    """Point de santé pour le module notifications"""
    return {
        "status": "healthy",
        "module": "notifications",
        "active_connections": len(notification_manager.active_connections),
        "total_notifications": len(notification_manager.notifications_store),
        "features": {
            "websocket": True,
            "real_time": True,
            "persistence": False,  # En mémoire pour l'instant
            "broadcasting": True
        }
    } 