export interface Reply {
  id: string;
  parentId: string; // ID de l'annotation ou réponse parent
  userId: string | number;
  userName: string;
  userRole: 'admin' | 'moderateur' | 'utilisateur';
  content: string;
  timestamp: Date;
  mentions?: Mention[];
  isEdited?: boolean;
  editedAt?: Date;
  reactions?: Reaction[];
}

export interface Mention {
  id: string;
  userId: string | number;
  userName: string;
  position: {
    start: number;
    end: number;
  };
}

export interface Reaction {
  id: string;
  userId: string | number;
  userName: string;
  emoji: string;
  timestamp: Date;
}

export interface Thread {
  id: string;
  annotationId: string;
  replies: Reply[];
  totalReplies: number;
  lastActivity: Date;
  participants: ThreadParticipant[];
  isResolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface ThreadParticipant {
  userId: string | number;
  userName: string;
  userRole: 'admin' | 'moderateur' | 'utilisateur';
  joinedAt: Date;
  lastSeen?: Date;
}

export interface AnnotationWithThread {
  id: string;
  userId: string | number;
  userName: string;
  userRole: 'admin' | 'moderateur' | 'utilisateur';
  x: number;
  y: number;
  content: string;
  category: 'question' | 'insight' | 'concern' | 'suggestion';
  timestamp: Date;
  isPrivate?: boolean;
  isResolved?: boolean;
  thread?: Thread;
  reactions?: Reaction[];
}

export interface NotificationPreferences {
  mentions: boolean;
  replies: boolean;
  reactions: boolean;
  resolutions: boolean;
  emailNotifications: boolean;
}

export interface CollaborationSettings {
  allowMentions: boolean;
  allowReactions: boolean;
  autoResolveThreads: boolean;
  notificationPreferences: NotificationPreferences;
}

// Événements temps réel
export interface RealtimeEvent {
  type: 'reply_added' | 'reaction_added' | 'mention_created' | 'thread_resolved' | 'annotation_updated';
  payload: any;
  userId: string | number;
  timestamp: Date;
  channelId: string; // ID du projet ou dashboard
}

// Utilitaires pour les mentions
export interface MentionSuggestion {
  userId: string;
  userName: string;
  userRole: 'admin' | 'moderateur' | 'utilisateur';
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

// Statistiques de collaboration
export interface CollaborationStats {
  totalAnnotations: number;
  activeDiscussions: number;
  resolvedDiscussions: number;
  totalParticipants: number;
  totalReplies: number;
  avgResponseTime: string;
  participationRate: number;
  topContributors: {
    userName: string;
    contributionCount: number;
    userRole: string;
  }[];
}

// Options de filtrage
export interface FilterOptions {
  category?: 'question' | 'insight' | 'concern' | 'suggestion';
  status?: ('active' | 'resolved')[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  userId?: string;
  userRole?: 'admin' | 'moderateur' | 'utilisateur';
} 