import { 
  AnnotationWithThread, 
  Thread, 
  Reply, 
  Reaction, 
  MentionSuggestion,
  ThreadParticipant 
} from '../../types/collaboration';

// Utilisateurs disponibles pour les mentions
export const mockUsers: MentionSuggestion[] = [
  {
    id: 1,
    name: 'Sophie Martin',
    role: 'admin',
    isOnline: true
  },
  {
    id: 2,
    name: 'Pierre Dubois',
    role: 'moderateur',
    isOnline: false
  },
  {
    id: 3,
    name: 'Marie Lefebvre',
    role: 'utilisateur',
    isOnline: true
  },
  {
    id: 4,
    name: 'Jean Moreau',
    role: 'utilisateur',
    isOnline: true
  },
  {
    id: 5,
    name: 'Claire Bernard',
    role: 'moderateur',
    isOnline: false
  },
  {
    id: 6,
    name: 'Thomas Petit',
    role: 'utilisateur',
    isOnline: true
  }
];

// Réactions de test
const mockReactions: Reaction[] = [
  {
    id: 'reaction-1',
    userId: 1,
    userName: 'Sophie Martin',
    emoji: '👍',
    timestamp: new Date('2024-01-15T10:30:00')
  },
  {
    id: 'reaction-2',
    userId: 3,
    userName: 'Marie Lefebvre',
    emoji: '❤️',
    timestamp: new Date('2024-01-15T11:15:00')
  },
  {
    id: 'reaction-3',
    userId: 4,
    userName: 'Jean Moreau',
    emoji: '🎉',
    timestamp: new Date('2024-01-15T14:20:00')
  }
];

// Participants de thread
const mockParticipants: ThreadParticipant[] = [
  {
    userId: 1,
    userName: 'Sophie Martin',
    userRole: 'admin',
    joinedAt: new Date('2024-01-15T09:00:00'),
    lastSeen: new Date('2024-01-15T16:30:00')
  },
  {
    userId: 2,
    userName: 'Pierre Dubois',
    userRole: 'moderateur',
    joinedAt: new Date('2024-01-15T10:15:00'),
    lastSeen: new Date('2024-01-15T15:45:00')
  },
  {
    userId: 3,
    userName: 'Marie Lefebvre',
    userRole: 'utilisateur',
    joinedAt: new Date('2024-01-15T11:30:00'),
    lastSeen: new Date('2024-01-15T16:00:00')
  }
];

// Réponses de test
const mockReplies: Reply[] = [
  {
    id: 'reply-1',
    parentId: 'annotation-1',
    userId: 2,
    userName: 'Pierre Dubois',
    userRole: 'moderateur',
    content: 'Excellente observation ! Les données montrent effectivement une corrélation intéressante entre les investissements en transport et la participation citoyenne.',
    timestamp: new Date('2024-01-15T10:15:00'),
    reactions: [
      {
        id: 'reaction-reply-1',
        userId: 1,
        userName: 'Sophie Martin',
        emoji: '👍',
        timestamp: new Date('2024-01-15T10:30:00')
      }
    ]
  },
  {
    id: 'reply-2',
    parentId: 'annotation-1',
    userId: 3,
    userName: 'Marie Lefebvre',
    userRole: 'utilisateur',
    content: '@PierreDubois Avez-vous des données sur l\'impact à long terme ? Il serait intéressant de voir l\'évolution sur 5 ans.',
    timestamp: new Date('2024-01-15T11:30:00'),
    mentions: [
      {
        id: 'mention-1',
        userId: 2,
        userName: 'Pierre Dubois',
        position: { start: 0, end: 12 }
      }
    ]
  },
  {
    id: 'reply-3',
    parentId: 'annotation-1',
    userId: 1,
    userName: 'Sophie Martin',
    userRole: 'admin',
    content: 'Je peux fournir ces données historiques. @MarieLefebvre, je vous envoie le rapport complet par email.',
    timestamp: new Date('2024-01-15T12:45:00'),
    mentions: [
      {
        id: 'mention-2',
        userId: 3,
        userName: 'Marie Lefebvre',
        position: { start: 52, end: 66 }
      }
    ],
    reactions: [
      {
        id: 'reaction-reply-2',
        userId: 3,
        userName: 'Marie Lefebvre',
        emoji: '🙏',
        timestamp: new Date('2024-01-15T13:00:00')
      }
    ]
  }
];

// Threads de test
const mockThreads: Thread[] = [
  {
    id: 'thread-1',
    annotationId: 'annotation-1',
    replies: mockReplies,
    totalReplies: 3,
    lastActivity: new Date('2024-01-15T12:45:00'),
    participants: mockParticipants,
    isResolved: false
  },
  {
    id: 'thread-2',
    annotationId: 'annotation-2',
    replies: [
      {
        id: 'reply-4',
        parentId: 'annotation-2',
        userId: 4,
        userName: 'Jean Moreau',
        userRole: 'utilisateur',
        content: 'Cette préoccupation est légitime. Les données sur la sécurité devraient être prises en compte.',
        timestamp: new Date('2024-01-14T16:20:00')
      }
    ],
    totalReplies: 1,
    lastActivity: new Date('2024-01-14T16:20:00'),
    participants: [
      {
        userId: 4,
        userName: 'Jean Moreau',
        userRole: 'utilisateur',
        joinedAt: new Date('2024-01-14T16:20:00'),
        lastSeen: new Date('2024-01-15T14:30:00')
      }
    ],
    isResolved: true,
    resolvedBy: 'Sophie Martin',
    resolvedAt: new Date('2024-01-15T09:00:00')
  }
];

// Annotations avec threads
export const mockAnnotationsWithThreads: AnnotationWithThread[] = [
  {
    id: 'annotation-1',
    userId: 1,
    userName: 'Sophie Martin',
    userRole: 'admin',
    x: 45,
    y: 30,
    content: 'Les investissements en transport semblent avoir un impact direct sur la participation citoyenne dans les arrondissements concernés.',
    category: 'insight',
    timestamp: new Date('2024-01-15T09:00:00'),
    isPrivate: false,
    isResolved: false,
    thread: mockThreads[0],
    reactions: mockReactions
  },
  {
    id: 'annotation-2',
    userId: 3,
    userName: 'Marie Lefebvre',
    userRole: 'utilisateur',
    x: 70,
    y: 60,
    content: 'Y a-t-il des données sur l\'impact environnemental de ces projets de transport ?',
    category: 'concern',
    timestamp: new Date('2024-01-14T14:30:00'),
    isPrivate: false,
    isResolved: true,
    thread: mockThreads[1],
    reactions: [
      {
        id: 'reaction-4',
        userId: 2,
        userName: 'Pierre Dubois',
        emoji: '🤔',
        timestamp: new Date('2024-01-14T15:00:00')
      }
    ]
  },
  {
    id: 'annotation-3',
    userId: 4,
    userName: 'Jean Moreau',
    userRole: 'utilisateur',
    x: 25,
    y: 80,
    content: 'Suggestion : ajouter un indicateur de satisfaction des usagers pour compléter ces données.',
    category: 'suggestion',
    timestamp: new Date('2024-01-13T11:15:00'),
    isPrivate: false,
    isResolved: false,
    reactions: [
      {
        id: 'reaction-5',
        userId: 1,
        userName: 'Sophie Martin',
        emoji: '💡',
        timestamp: new Date('2024-01-13T11:30:00')
      },
      {
        id: 'reaction-6',
        userId: 5,
        userName: 'Claire Bernard',
        emoji: '👍',
        timestamp: new Date('2024-01-13T12:00:00')
      }
    ]
  },
  {
    id: 'annotation-4',
    userId: 2,
    userName: 'Pierre Dubois',
    userRole: 'moderateur',
    x: 85,
    y: 25,
    content: 'Question : les données incluent-elles les projets en cours de planification ?',
    category: 'question',
    timestamp: new Date('2024-01-12T16:45:00'),
    isPrivate: false,
    isResolved: false,
    reactions: []
  }
];

// Fonction pour générer des réactions aléatoires
export const generateRandomReaction = (): Reaction => {
  const emojis = ['👍', '👎', '❤️', '😊', '😮', '😢', '🎉', '🚀', '💡', '🤔'];
  const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
  
  return {
    id: `reaction-${Date.now()}-${Math.random()}`,
    userId: randomUser.id,
    userName: randomUser.name,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    timestamp: new Date()
  };
};

// Fonction pour générer une réponse aléatoire
export const generateRandomReply = (annotationId: string): Reply => {
  const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
  const contents = [
    'Très intéressant ! Pouvez-vous partager plus de détails ?',
    'Je suis d\'accord avec cette analyse.',
    'Il faudrait peut-être considérer d\'autres facteurs.',
    'Excellente observation, merci pour le partage.',
    'Cela soulève une question importante.',
    'Avez-vous des données supplémentaires à ce sujet ?'
  ];
  
  return {
    id: `reply-${Date.now()}-${Math.random()}`,
    parentId: annotationId,
    userId: randomUser.id,
    userName: randomUser.name,
    userRole: randomUser.role,
    content: contents[Math.floor(Math.random() * contents.length)],
    timestamp: new Date(),
    reactions: Math.random() > 0.7 ? [generateRandomReaction()] : []
  };
};

// Fonction pour créer un nouveau thread
export const createNewThread = (annotationId: string): Thread => {
  return {
    id: `thread-${Date.now()}-${Math.random()}`,
    annotationId,
    replies: [],
    totalReplies: 0,
    lastActivity: new Date(),
    participants: [],
    isResolved: false
  };
};

// Statistiques de collaboration
export const mockCollaborationStats = {
  totalAnnotations: mockAnnotationsWithThreads.length,
  totalThreads: mockThreads.length,
  totalReplies: mockReplies.length,
  totalReactions: mockReactions.length,
  activeUsers: mockUsers.filter(u => u.isOnline).length,
  resolvedThreads: mockThreads.filter(t => t.isResolved).length,
  averageRepliesPerThread: mockReplies.length / mockThreads.length,
  mostActiveUser: 'Sophie Martin',
  recentActivity: [
    {
      type: 'reply_added',
      user: 'Sophie Martin',
      content: 'Nouvelle réponse ajoutée',
      timestamp: new Date('2024-01-15T12:45:00')
    },
    {
      type: 'reaction_added',
      user: 'Marie Lefebvre',
      content: 'Réaction ajoutée',
      timestamp: new Date('2024-01-15T11:15:00')
    },
    {
      type: 'thread_resolved',
      user: 'Pierre Dubois',
      content: 'Discussion marquée comme résolue',
      timestamp: new Date('2024-01-15T09:00:00')
    }
  ]
}; 