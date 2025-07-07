import { useState, useCallback } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = notification.id || Date.now().toString();
    const newNotification = {
      ...notification,
      id,
      onDismiss: () => removeNotification(id)
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss after 5 seconds if dismissible
    if (notification.dismissible !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
};
