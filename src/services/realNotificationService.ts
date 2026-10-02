import { apiClient } from './api/apiClient';
import { API_ENDPOINTS } from '../config/api';
import type { AppNotification } from '../types';

export function formatNotificationTime(isoString?: string): string {
  if (!isoString) return 'Recently';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const realNotificationService = {
  /**
   * Fetch authenticated user's notifications.
   */
  async getNotifications(unreadOnly = false): Promise<{ count: number; results: AppNotification[] }> {
    try {
      const response = await apiClient.get<{ count: number; results: any[] }>(
        API_ENDPOINTS.NOTIFICATIONS.LIST,
        {
          params: unreadOnly ? { unread: 'true' } : undefined,
          requiresAuth: true,
        }
      );

      const items = Array.isArray(response) ? response : (response?.results || []);
      const mapped: AppNotification[] = items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        notificationType: item.notificationType || item.notification_type || item.type || 'appointment',
        type: item.type || item.notification_type || 'appointment',
        link: item.link || '',
        isRead: item.isRead ?? item.is_read ?? false,
        unread: item.unread ?? !(item.isRead ?? item.is_read),
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        time: formatNotificationTime(item.createdAt || item.created_at),
      }));

      return {
        count: typeof response?.count === 'number' ? response.count : mapped.length,
        results: mapped,
      };
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
      return { count: 0, results: [] };
    }
  },

  /**
   * Fetch real-time unread notification count.
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ unreadCount: number }>(
        API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
        { requiresAuth: true }
      );
      return response?.unreadCount ?? 0;
    } catch (err) {
      console.warn('Failed to fetch notification unread count:', err);
      return 0;
    }
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), undefined, { requiresAuth: true });
    } catch (err) {
      console.warn(`Failed to mark notification ${id} as read:`, err);
    }
  },

  /**
   * Bulk mark all notifications as read.
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, undefined, { requiresAuth: true });
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err);
    }
  },

  /**
   * Delete / dismiss an individual notification.
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id), { requiresAuth: true });
    } catch (err) {
      console.warn(`Failed to delete notification ${id}:`, err);
    }
  },

  /**
   * Delete / dismiss all notifications (Clear All).
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.CLEAR_ALL, { requiresAuth: true });
    } catch (err) {
      console.warn('Failed to clear all notifications:', err);
    }
  },
};
