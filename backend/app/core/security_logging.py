"""
Système de journalisation des accès sensibles pour AgoraFlux
Conforme aux exigences de sécurité & confidentialité
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, Session
from sqlalchemy.ext.declarative import declarative_base
import enum
import json
from loguru import logger
from fastapi import Request

from app.core.database import Base


class SecurityEventType(enum.Enum):
    """
    Types d'événements de sécurité à journaliser
    """
    # Authentification
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    
    # Accès sensibles
    ADMIN_ACCESS = "admin_access"
    MODERATOR_ACCESS = "moderator_access"
    PROJECT_ACCESS_DENIED = "project_access_denied"
    PERMISSION_GRANTED = "permission_granted"
    PERMISSION_REVOKED = "permission_revoked"
    
    # Actions sensibles
    PROJECT_CREATED = "project_created"
    PROJECT_DELETED = "project_deleted"
    USER_INVITED = "user_invited"
    USER_REMOVED = "user_removed"
    DATA_EXPORTED = "data_exported"
    COMMENT_MODERATED = "comment_moderated"
    
    # Sécurité
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    MULTIPLE_FAILED_LOGINS = "multiple_failed_logins"
    UNAUTHORIZED_ACCESS_ATTEMPT = "unauthorized_access_attempt"


class SecurityLog(Base):
    """
    Journal des événements de sécurité
    """
    __tablename__ = "security_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Type d'événement
    event_type = Column(Enum(SecurityEventType), nullable=False, index=True)
    
    # Utilisateur concerné
    user_id = Column(Integer, nullable=True, index=True)  # Suppression de ForeignKey pour éviter les dépendances circulaires
    user_email = Column(String(255), nullable=True, index=True)
    user_role = Column(String(50), nullable=True)
    
    # Informations de session
    session_id = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True, index=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    
    # Détails de l'événement
    resource_type = Column(String(100), nullable=True)  # project, user, comment, etc.
    resource_id = Column(Integer, nullable=True)
    action = Column(String(100), nullable=True)
    
    # Résultat
    success = Column(Boolean, nullable=False, default=True)
    error_message = Column(Text, nullable=True)
    
    # Données additionnelles (JSON)
    additional_data = Column(Text, nullable=True)
    
    # Métadonnées
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relations
    # user = relationship("User", foreign_keys=[user_id])  # Commenté pour éviter la dépendance circulaire
    
    def __repr__(self):
        return f"<SecurityLog(id={self.id}, event_type={self.event_type.value}, user_id={self.user_id})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertit le log en dictionnaire"""
        return {
            "id": self.id,
            "event_type": self.event_type.value,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "user_role": self.user_role,
            "ip_address": self.ip_address,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "action": self.action,
            "success": self.success,
            "error_message": self.error_message,
            "additional_data": json.loads(self.additional_data) if self.additional_data else None,
            "timestamp": self.timestamp.isoformat()
        }


class SecurityLogger:
    """
    Service de journalisation des événements de sécurité
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def log_event(
        self,
        event_type: SecurityEventType,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        user_role: Optional[str] = None,
        session_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        action: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ) -> SecurityLog:
        """
        Enregistre un événement de sécurité
        """
        # Extraire les informations de la requête si fournie
        if request:
            if not ip_address:
                ip_address = self._get_client_ip(request)
            if not user_agent:
                user_agent = request.headers.get("user-agent")
            if not session_id:
                session_id = request.headers.get("x-session-id")
        
        # Créer l'entrée de log
        security_log = SecurityLog(
            event_type=event_type,
            user_id=user_id,
            user_email=user_email,
            user_role=user_role,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            success=success,
            error_message=error_message,
            additional_data=json.dumps(additional_data) if additional_data else None
        )
        
        # Sauvegarder en base
        self.db.add(security_log)
        self.db.commit()
        self.db.refresh(security_log)
        
        # Log également avec loguru pour les fichiers
        log_message = self._format_log_message(security_log)
        
        if success:
            if event_type in [SecurityEventType.LOGIN_SUCCESS, SecurityEventType.LOGOUT]:
                logger.info(log_message)
            elif event_type in [SecurityEventType.ADMIN_ACCESS, SecurityEventType.PERMISSION_GRANTED]:
                logger.warning(log_message)
            else:
                logger.info(log_message)
        else:
            if event_type in [SecurityEventType.LOGIN_FAILED, SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT]:
                logger.warning(log_message)
            else:
                logger.error(log_message)
        
        return security_log
    
    def log_login_success(self, user, request: Optional[Request] = None) -> SecurityLog:
        """Log d'une connexion réussie"""
        return self.log_event(
            event_type=SecurityEventType.LOGIN_SUCCESS,
            user_id=user.id,
            user_email=user.email,
            user_role=user.role.value,
            request=request,
            additional_data={
                "user_full_name": f"{user.first_name} {user.last_name}",
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
        )
    
    def log_login_failed(self, email: str, reason: str, request: Optional[Request] = None) -> SecurityLog:
        """Log d'une tentative de connexion échouée"""
        return self.log_event(
            event_type=SecurityEventType.LOGIN_FAILED,
            user_email=email,
            success=False,
            error_message=reason,
            request=request,
            additional_data={"failure_reason": reason}
        )
    
    def log_logout(self, user, request: Optional[Request] = None) -> SecurityLog:
        """Log d'une déconnexion"""
        return self.log_event(
            event_type=SecurityEventType.LOGOUT,
            user_id=user.id,
            user_email=user.email,
            user_role=user.role.value,
            request=request
        )
    
    def log_admin_access(self, user, resource_type: str, resource_id: int, action: str, request: Optional[Request] = None) -> SecurityLog:
        """Log d'un accès administrateur"""
        return self.log_event(
            event_type=SecurityEventType.ADMIN_ACCESS,
            user_id=user.id,
            user_email=user.email,
            user_role=user.role.value,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            request=request
        )
    
    def log_moderator_access(self, user, resource_type: str, resource_id: int, action: str, request: Optional[Request] = None) -> SecurityLog:
        """Log d'un accès modérateur"""
        return self.log_event(
            event_type=SecurityEventType.MODERATOR_ACCESS,
            user_id=user.id,
            user_email=user.email,
            user_role=user.role.value,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            request=request
        )
    
    def log_permission_change(self, granter_user, target_user, project_id: int, new_role: str, action: str, request: Optional[Request] = None) -> SecurityLog:
        """Log d'un changement de permission"""
        event_type = SecurityEventType.PERMISSION_GRANTED if action == "granted" else SecurityEventType.PERMISSION_REVOKED
        
        return self.log_event(
            event_type=event_type,
            user_id=granter_user.id,
            user_email=granter_user.email,
            user_role=granter_user.role.value,
            resource_type="project",
            resource_id=project_id,
            action=f"{action}_permission",
            request=request,
            additional_data={
                "target_user_id": target_user.id,
                "target_user_email": target_user.email,
                "new_role": new_role,
                "action": action
            }
        )
    
    def log_access_denied(self, user, resource_type: str, resource_id: int, reason: str, request: Optional[Request] = None) -> SecurityLog:
        """Log d'un accès refusé"""
        return self.log_event(
            event_type=SecurityEventType.PROJECT_ACCESS_DENIED,
            user_id=user.id,
            user_email=user.email,
            user_role=user.role.value,
            resource_type=resource_type,
            resource_id=resource_id,
            success=False,
            error_message=reason,
            request=request
        )
    
    def log_data_export(self, user, export_type: str, project_id: Optional[int] = None, request: Optional[Request] = None) -> SecurityLog:
        """Log d'un export de données"""
        return self.log_event(
            event_type=SecurityEventType.DATA_EXPORTED,
            user_id=user.id,
            user_email=user.email,
            user_role=user.role.value,
            resource_type="project" if project_id else "global",
            resource_id=project_id,
            action=f"export_{export_type}",
            request=request,
            additional_data={"export_type": export_type}
        )
    
    def log_suspicious_activity(self, description: str, user_id: Optional[int] = None, request: Optional[Request] = None) -> SecurityLog:
        """Log d'une activité suspecte"""
        return self.log_event(
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            user_id=user_id,
            success=False,
            error_message=description,
            request=request,
            additional_data={"description": description}
        )
    
    def get_user_activity_logs(self, user_id: int, limit: int = 50) -> list:
        """Récupère les logs d'activité d'un utilisateur"""
        logs = self.db.query(SecurityLog).filter(
            SecurityLog.user_id == user_id
        ).order_by(SecurityLog.timestamp.desc()).limit(limit).all()
        
        return [log.to_dict() for log in logs]
    
    def get_failed_login_attempts(self, email: str, hours: int = 1) -> int:
        """Compte les tentatives de connexion échouées récentes"""
        since = datetime.utcnow() - timedelta(hours=hours)
        
        count = self.db.query(SecurityLog).filter(
            SecurityLog.event_type == SecurityEventType.LOGIN_FAILED,
            SecurityLog.user_email == email,
            SecurityLog.timestamp >= since
        ).count()
        
        return count
    
    def get_security_summary(self, days: int = 7) -> Dict[str, Any]:
        """Retourne un résumé de sécurité sur N jours"""
        
        since = datetime.utcnow() - timedelta(days=days)
        
        # Compter par type d'événement
        event_counts = {}
        for event_type in SecurityEventType:
            count = self.db.query(SecurityLog).filter(
                SecurityLog.event_type == event_type,
                SecurityLog.timestamp >= since
            ).count()
            event_counts[event_type.value] = count
        
        # Top des IP
        from sqlalchemy import func
        top_ips = self.db.query(
            SecurityLog.ip_address,
            func.count(SecurityLog.id).label('count')
        ).filter(
            SecurityLog.timestamp >= since,
            SecurityLog.ip_address.isnot(None)
        ).group_by(SecurityLog.ip_address).order_by(func.count(SecurityLog.id).desc()).limit(10).all()
        
        # Tentatives échouées
        failed_attempts = self.db.query(SecurityLog).filter(
            SecurityLog.success == False,
            SecurityLog.timestamp >= since
        ).count()
        
        return {
            "period_days": days,
            "event_counts": event_counts,
            "top_ips": [{"ip": ip, "count": count} for ip, count in top_ips],
            "failed_attempts": failed_attempts,
            "total_events": sum(event_counts.values())
        }
    
    def _get_client_ip(self, request: Request) -> str:
        """Extrait l'adresse IP du client"""
        # Vérifier les headers de proxy
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # IP directe
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"
    
    def _format_log_message(self, security_log: SecurityLog) -> str:
        """Formate un message de log"""
        msg = f"[SECURITY] {security_log.event_type.value.upper()}"
        
        if security_log.user_email:
            msg += f" | User: {security_log.user_email}"
        
        if security_log.user_role:
            msg += f" ({security_log.user_role})"
        
        if security_log.ip_address:
            msg += f" | IP: {security_log.ip_address}"
        
        if security_log.resource_type and security_log.resource_id:
            msg += f" | Resource: {security_log.resource_type}#{security_log.resource_id}"
        
        if security_log.action:
            msg += f" | Action: {security_log.action}"
        
        if not security_log.success and security_log.error_message:
            msg += f" | Error: {security_log.error_message}"
        
        return msg 