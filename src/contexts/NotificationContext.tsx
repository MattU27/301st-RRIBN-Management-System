"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import { WebSocketEventType } from '@/utils/websocketService';

// Notification type definitions
export interface Notification {
  _id: string;
  title: string;
  content: string;
  type: 'announcement' | 'document' | 'training' | 'personnel' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  isRead: boolean;
  targetUrl?: string;
  icon?: string;
}

// Context type definition
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  isLoading: boolean;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user]);

  // Set up WebSocket listeners for real-time notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated && user) {
      // Import websocketService dynamically to avoid SSR issues
      import('@/utils/websocketService').then((module) => {
        const websocketService = module.default;
        
        // Handle new announcement notification
        const handleNewAnnouncement = (payload: any) => {
          const newNotification: Notification = {
            _id: payload._id || `temp-${Date.now()}`,
            title: payload.title || 'New Announcement',
            content: payload.content || 'You have a new announcement.',
            type: 'announcement',
            priority: payload.priority || 'medium',
            createdAt: new Date().toISOString(),
            isRead: false,
            targetUrl: `/announcements/${payload._id}`,
            icon: 'MegaphoneIcon'
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for high priority notifications
          if (payload.priority === 'high' || payload.priority === 'urgent') {
            toast.custom(
              <div className="flex items-center p-4 bg-blue-50 border-l-4 border-blue-500 rounded shadow-md">
                <div className="mr-3 text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">{payload.title}</p>
                  <p className="text-sm">{payload.content.substring(0, 100)}{payload.content.length > 100 ? '...' : ''}</p>
                </div>
              </div>,
              { duration: 5000 }
            );
          }
        };
        
        // Add event listeners
        if (websocketService) {
          // Create custom event type for announcements if not in the enum
          const ANNOUNCEMENT_CREATED = 'ANNOUNCEMENT_CREATED' as any;
          websocketService.addEventListener(ANNOUNCEMENT_CREATED, handleNewAnnouncement);
          
          // Cleanup
          return () => {
            if (websocketService) {
              websocketService.removeEventListener(ANNOUNCEMENT_CREATED, handleNewAnnouncement);
            }
          };
        }
      });
    }
  }, [isAuthenticated, user]);

  // Fetch all notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) return;
    
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data || []);
        // Count unread notifications
        const unread = data.data?.filter((notification: Notification) => !notification.isRead).length || 0;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === id 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!isAuthenticated || !user || notifications.length === 0) return;
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Clear notifications (only from state, not from database)
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isLoading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook for using the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 