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

# Endpoints pour créer des notifications (pour testing)
@router.post("/test")
async def create_test_notification(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une notification de test"""
    await create_notification(
        type="system",
        title="Notification de test",
        message="Ceci est une notification de test pour vérifier le système temps réel",
        recipient_id=str(current_user.id),
        data={"test": True},
        priority="normal"
    )
    
    return {"message": "Notification de test créée"}

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