import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Edit, 
  Trash2, 
  Clock, 
  Check, 
  X,
  AlertTriangle,
  Settings,
  Crown,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string; // admin, moderateur, utilisateur
}

interface ProjectPermission {
  id: number;
  user: User;
  project_id: number;
  role: string; // admin, moderator, user (rôles projet)
  
  // Permissions essentielles (simplifiées)
  can_view_project: boolean;
  can_view_datasets: boolean;
  can_view_comments: boolean;
  can_edit_project: boolean;
  can_delete_project: boolean;
  can_upload_datasets: boolean;
  can_delete_datasets: boolean;
  can_create_comments: boolean;
  can_edit_comments: boolean;
  can_delete_comments: boolean;
  can_moderate_comments: boolean;
  can_manage_users: boolean;
  can_export_data: boolean;
  
  granted_by?: User;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
  is_expired: boolean;
}

interface ProjectPermissionsList {
  project_id: number;
  permissions: ProjectPermission[];
  role_summary: Record<string, number>;
  total_users: number;
}

interface ProjectPermissionsManagerProps {
  projectId: number;
  currentUserId: number;
  onPermissionUpdated?: () => void;
}

// Rôles simplifiés selon les exigences
const PROJECT_ROLES = [
  { 
    value: 'admin', 
    label: 'Administrateur', 
    description: 'Gestion complète du projet',
    icon: Crown,
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    value: 'moderator', 
    label: 'Modérateur', 
    description: 'Modération et contribution',
    icon: ShieldCheck,
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    value: 'user', 
    label: 'Utilisateur', 
    description: 'Lecture et contribution de base',
    icon: UserIcon,
    color: 'bg-green-100 text-green-800'
  }
];

// Permissions par catégorie (simplifiées)
const PERMISSION_CATEGORIES = {
  'Lecture': [
    { key: 'can_view_project', label: 'Voir le projet' },
    { key: 'can_view_datasets', label: 'Voir les données' },
    { key: 'can_view_comments', label: 'Voir les commentaires' }
  ],
  'Contribution': [
    { key: 'can_create_comments', label: 'Créer des commentaires' },
    { key: 'can_upload_datasets', label: 'Ajouter des données' },
    { key: 'can_export_data', label: 'Exporter les données' }
  ],
  'Modération': [
    { key: 'can_edit_comments', label: 'Modifier les commentaires' },
    { key: 'can_delete_comments', label: 'Supprimer les commentaires' },
    { key: 'can_moderate_comments', label: 'Modérer les commentaires' }
  ],
  'Administration': [
    { key: 'can_edit_project', label: 'Modifier le projet' },
    { key: 'can_delete_project', label: 'Supprimer le projet' },
    { key: 'can_manage_users', label: 'Gérer les utilisateurs' },
    { key: 'can_delete_datasets', label: 'Supprimer des données' }
  ]
};

const ProjectPermissionsManager: React.FC<ProjectPermissionsManagerProps> = ({
  projectId,
  currentUserId,
  onPermissionUpdated
}) => {
  const [permissions, setPermissions] = useState<ProjectPermissionsList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<ProjectPermission | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // État pour l'invitation
  const [inviteData, setInviteData] = useState({
    user_email: '',
    role: 'user',
    expires_in_days: 0,
    message: ''
  });

  useEffect(() => {
    loadPermissions();
  }, [projectId]);

  const loadPermissions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/permissions/projects/${projectId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des permissions');
      }
      
      const data = await response.json();
      setPermissions(data);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    try {
      const response = await fetch(`/api/v1/permissions/projects/${projectId}/permissions/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...inviteData,
          expires_in_days: inviteData.expires_in_days || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors de l\'invitation');
      }

      setShowInviteModal(false);
      setInviteData({ user_email: '', role: 'user', expires_in_days: 0, message: '' });
      await loadPermissions();
      onPermissionUpdated?.();
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    }
  };

  const handleUpdatePermission = async (permissionId: number, newRole: string) => {
    try {
      const permission = permissions?.permissions.find(p => p.id === permissionId);
      if (!permission) return;

      const response = await fetch(`/api/v1/permissions/projects/${projectId}/permissions/${permission.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors de la mise à jour');
      }

      await loadPermissions();
      onPermissionUpdated?.();
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    }
  };

  const handleRemovePermission = async (permission: ProjectPermission) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${permission.user.first_name} ${permission.user.last_name} du projet ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/permissions/projects/${projectId}/permissions/${permission.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors de la suppression');
      }

      await loadPermissions();
      onPermissionUpdated?.();
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    }
  };

  const getRoleInfo = (role: string) => {
    return PROJECT_ROLES.find(r => r.value === role) || PROJECT_ROLES[2]; // Default to user
  };

  const getGlobalRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      moderateur: 'bg-yellow-100 text-yellow-800',
      utilisateur: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!permissions) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Permissions du projet</h3>
            <p className="text-sm text-slate-600">
              {permissions.total_users} utilisateur(s) avec des permissions
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Inviter un utilisateur
        </button>
      </div>

      {/* Résumé des rôles simplifiés */}
      <div className="grid grid-cols-3 gap-4">
        {PROJECT_ROLES.map((roleInfo) => {
          const count = permissions.role_summary[roleInfo.value] || 0;
          const IconComponent = roleInfo.icon;
          
          return (
            <div key={roleInfo.value} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${roleInfo.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{roleInfo.label}</div>
                  <div className="text-2xl font-bold text-slate-900">{count}</div>
                  <div className="text-xs text-slate-600">{roleInfo.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Liste des permissions */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h4 className="font-medium text-slate-900">Utilisateurs et permissions</h4>
        </div>
        
        <div className="divide-y divide-slate-200">
          {permissions.permissions.map((permission) => {
            const roleInfo = getRoleInfo(permission.role);
            const IconComponent = roleInfo.icon;
            
            return (
              <div key={permission.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {permission.user.first_name[0]}{permission.user.last_name[0]}
                      </span>
                    </div>
                    
                    <div>
                      <div className="font-medium text-slate-900">
                        {permission.user.first_name} {permission.user.last_name}
                      </div>
                      <div className="text-sm text-slate-600">{permission.user.email}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        {/* Rôle global */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getGlobalRoleColor(permission.user.role)}`}>
                          {permission.user.role}
                        </span>
                        {/* Rôle projet */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {roleInfo.label}
                        </span>
                        {permission.expires_at && (
                          <span className="inline-flex items-center text-xs text-amber-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Expire le {new Date(permission.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        {permission.is_expired && (
                          <span className="inline-flex items-center text-xs text-red-600">
                            <X className="h-3 w-3 mr-1" />
                            Expiré
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Sélecteur de rôle rapide */}
                    <select
                      value={permission.role}
                      onChange={(e) => handleUpdatePermission(permission.id, e.target.value)}
                      className="text-sm border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {PROJECT_ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={() => {
                        setSelectedPermission(permission);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Voir les détails"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    {permission.user.id !== currentUserId && permission.role !== 'admin' && (
                      <button
                        onClick={() => handleRemovePermission(permission)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Retirer du projet"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal d'invitation */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Inviter un utilisateur</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email de l'utilisateur
                </label>
                <input
                  type="email"
                  value={inviteData.user_email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, user_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="utilisateur@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rôle dans le projet
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PROJECT_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expiration (jours, optionnel)
                </label>
                <input
                  type="number"
                  value={inviteData.expires_in_days}
                  onChange={(e) => setInviteData(prev => ({ ...prev, expires_in_days: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="30"
                  min="0"
                  max="365"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleInviteUser}
                disabled={!inviteData.user_email}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Envoyer l'invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails des permissions */}
      {showEditModal && selectedPermission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Permissions détaillées - {selectedPermission.user.first_name} {selectedPermission.user.last_name}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-slate-900 border-b border-slate-200 pb-2">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {perms.map(perm => (
                      <div key={perm.key} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{perm.label}</span>
                        <div className="flex items-center">
                          {selectedPermission[perm.key as keyof ProjectPermission] ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPermissionsManager; 