'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppNotification } from '../types';
import { apiRequest } from '../api/client';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await apiRequest<{ unread_count: number }>('/notifications/unread_count');
      setUnreadCount(res.unread_count || 0);
    } catch {
      // Ignore background poll errors
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<AppNotification[] | { data?: AppNotification[]; notifications?: AppNotification[]; meta?: any }>('/notifications?per_page=20');
      let items: AppNotification[] = [];
      if (Array.isArray(res)) {
        items = res;
      } else if (res && Array.isArray((res as any).notifications)) {
        items = (res as any).notifications;
      } else if (res && Array.isArray((res as any).data)) {
        items = (res as any).data;
      }
      setNotifications(items);
      const unread = items.filter((n) => !n.is_read).length;
      setUnreadCount((prev) => (res && (res as any).meta?.unread_count !== undefined ? (res as any).meta.unread_count : unread));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      await apiRequest<AppNotification>(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest<{ message: string; unread_count: number }>('/notifications/read_all', {
        method: 'POST',
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Fetch when user signs in
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchUnreadCount, fetchNotifications]);

  // Periodic polling for unread count (every 30 seconds)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
