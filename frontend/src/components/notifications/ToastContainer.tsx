import React from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications, NotificationToast } from '../../hooks/useNotifications';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm w-full border rounded-lg shadow-lg p-4 
            ${getToastStyles(toast.type)}
            animate-in slide-in-from-right-full duration-300
          `}
        >
          <div className="flex items-start">
            {/* Icône */}
            <div className="flex-shrink-0">
              {getToastIcon(toast.type)}
            </div>
            
            {/* Contenu */}
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium">
                {toast.title}
              </h4>
              <p className="mt-1 text-sm opacity-90">
                {toast.message}
              </p>
              
              {/* Action */}
              {toast.action && (
                <div className="mt-3">
                  <button
                    onClick={toast.action.onClick}
                    className="text-sm font-medium underline hover:no-underline"
                  >
                    {toast.action.label}
                  </button>
                </div>
              )}
            </div>
            
            {/* Bouton de fermeture */}
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer; 