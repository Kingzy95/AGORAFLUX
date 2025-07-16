import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export interface Notification {
  id: string;
  type: 'comment' | 'export' | 'project' | 'system' | 'mention';
  title: string;
  message: string;
  data: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recipient_id: string;
  sender_id?: string;
  sender_name?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Fonction pour se connecter au WebSocket
  const connectWebSocket = useCallback(() => {
    if (!user?.id) return;

    const wsUrl = `ws://localhost:8000/api/v1/notifications/ws/${user.id}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connecté');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Envoyer un ping pour maintenir la connexion
        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping toutes les 30 secondes
        
        // Stocker l'interval pour le nettoyer plus tard
        (wsRef.current as any).pingInterval = pingInterval;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'new_notification':
              handleNewNotification(message.data);
              break;
            case 'unread_notifications':
              handleUnreadNotifications(message.data);
              break;
            case 'broadcast_notification':
              handleBroadcastNotification(message.data);
              break;
            case 'pong':
              // Réponse au ping
              break;
            default:
              console.log('Message WebSocket non géré:', message);
          }
        } catch (error) {
          console.error('Erreur lors du parsing du message WebSocket:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket fermé');
        setIsConnected(false);
        
        // Nettoyer l'interval de ping
        if (wsRef.current && (wsRef.current as any).pingInterval) {
          clearInterval((wsRef.current as any).pingInterval);
        }
        
        // Tentative de reconnexion
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Tentative de reconnexion ${reconnectAttempts.current}/${maxReconnectAttempts}`);
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Erreur lors de la connexion WebSocket:', error);
      setIsConnected(false);
    }
  }, [user?.id]);

  // Gestionnaires de messages WebSocket
  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Afficher un toast
    showToast({
      id: notification.id,
      type: getToastType(notification.type),
      title: notification.title,
      message: notification.message,
      duration: notification.priority === 'urgent' ? 10000 : 5000,
      action: notification.data.download_url ? {
        label: 'Voir',
        onClick: () => {
          if (notification.data.download_url) {
            window.open(`http://localhost:8000${notification.data.download_url}`, '_blank');
          }
        }
      } : undefined
    });
  };

  const handleUnreadNotifications = (data: { notifications: Notification[], count: number }) => {
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const newNotifications = data.notifications.filter(n => !existingIds.has(n.id));
      return [...newNotifications, ...prev];
    });
    setUnreadCount(data.count);
  };

  const handleBroadcastNotification = (notification: Notification) => {
    // Gérer les notifications broadcast (système, annonces, etc.)
    showToast({
      id: notification.id,
      type: 'info',
      title: notification.title,
      message: notification.message,
      duration: 8000
    });
  };

  // Fonction utilitaire pour convertir le type de notification en type de toast
  const getToastType = (notificationType: string): 'success' | 'error' | 'info' | 'warning' => {
    switch (notificationType) {
      case 'export':
        return 'success';
      case 'comment':
        return 'info';
      case 'project':
        return 'info';
      case 'system':
        return 'warning';
      case 'mention':
        return 'info';
      default:
        return 'info';
    }
  };

  // Fonctions pour gérer les toasts
  const showToast = (toast: NotificationToast) => {
    setToasts(prev => [...prev, toast]);
    
    // Auto-suppression après la durée spécifiée
    setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration || 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fonctions pour gérer les notifications
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Envoyer via WebSocket aussi
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'mark_read',
            notification_id: notificationId
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        setUnreadCount(prev => {
          const deletedNotif = notifications.find(n => n.id === notificationId);
          return deletedNotif && !deletedNotif.is_read ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  };

  // Charger les notifications initiales
  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/notifications/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  // Effets
  useEffect(() => {
    if (user?.id) {
      connectWebSocket();
      loadNotifications();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user?.id, connectWebSocket]);

  return {
    notifications,
    unreadCount,
    toasts,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    removeToast,
    showToast,
    loadNotifications
  };
}; 