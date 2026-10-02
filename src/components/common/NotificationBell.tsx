import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckCheck,
  Calendar,
  FileText,
  Sparkles,
  ArrowRight,
  Clock,
  X,
  Trash2,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { realNotificationService } from '../../services/realNotificationService';
import type { AppNotification } from '../../types';

interface NotificationBellProps {
  id?: string;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  id = 'global-notification-bell',
  className = '',
}) => {
  const { t, isRTL } = useTranslation();
  const isArabic = isRTL;
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [count, notifData] = await Promise.all([
        realNotificationService.getUnreadCount(),
        realNotificationService.getNotifications(),
      ]);
      setUnreadCount(count);
      setNotifications(notifData.results);
    } catch {
      // Graceful fallback
    }
  }, [user]);

  // Initial fetch and 15-second polling
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 15000);

    const handleUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('meetadr:notification_updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('meetadr:notification_updated', handleUpdate);
    };
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await realNotificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, unread: false, isRead: true }))
      );
      showToast(isArabic ? 'تم تحديد جميع الإشعارات كمقروءة' : 'All notifications marked as read', 'info');
    } catch {
      showToast('Failed to mark all as read', 'error');
    }
  };

  const handleClearAll = async () => {
    try {
      await realNotificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      showToast(isArabic ? 'تم مسح جميع الإشعارات' : 'All notifications cleared', 'info');
    } catch {
      showToast('Failed to clear notifications', 'error');
    }
  };

  const handleDeleteOne = async (e: React.MouseEvent, notifId: string, wasUnread: boolean) => {
    e.stopPropagation();
    try {
      await realNotificationService.deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      showToast(isArabic ? 'تم مسح الإشعار' : 'Notification cleared', 'info');
    } catch {
      showToast('Failed to delete notification', 'error');
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (notif.unread) {
      realNotificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, unread: false, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);

    if (notif.link) {
      navigate(notif.link);
    } else if (user?.role === 'doctor') {
      navigate('/doctor/bookings');
    } else {
      navigate('/patient/bookings');
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-[#2DA7B5]" />;
      case 'prescription':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'review':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const fallbackLink = user?.role === 'doctor' ? '/doctor/bookings' : '/patient/bookings';

  if (!user) return null;

  return (
    <div className={`relative ${className}`} ref={notifRef}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-[#E2EBF0]"
        aria-label={t('navigation.notifications') || 'Notifications'}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 rtl:-right-auto rtl:-left-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute -right-12 rtl:-right-auto rtl:-left-12 sm:right-0 sm:rtl:right-auto sm:rtl:left-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white rounded-2xl border border-[#E2EBF0] shadow-2xl p-4 z-50 backdrop-blur-xl text-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2EBF0]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {t('navigation.notifications') || 'Notifications'}
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {t('navigation.newNotifications', { count: unreadCount }) || `${unreadCount} new`}
                  </span>
                )}
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    title={t('navigation.markAllRead') || 'Mark all read'}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{t('navigation.markAllRead') || 'Mark all read'}</span>
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close notifications"
                  title={isArabic ? 'إغلاق' : 'Close'}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto mt-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">
                    {isArabic ? 'لا توجد إشعارات حالياً' : 'No notifications right now'}
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group relative p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                      notif.unread
                        ? 'bg-[#E8F6F8]/60 hover:bg-[#E8F6F8] border border-[#CDEBF0]/50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white border border-[#E2EBF0] shrink-0 mt-0.5 shadow-2xs">
                      {getNotificationIcon(notif.notificationType || notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-1 rtl:pr-0 rtl:pl-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-bold truncate ${
                            notif.unread ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {notif.time || 'Recently'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-snug line-clamp-2">
                        {notif.description}
                      </p>
                    </div>

                    {/* Unread indicator dot */}
                    {notif.unread && (
                      <span className="w-2 h-2 rounded-full bg-[#2DA7B5] shrink-0 mt-2 group-hover:hidden" />
                    )}

                    {/* Clear One button on hover (shows on hover for both read & unread messages) */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteOne(e, notif.id, notif.unread)}
                      title={isArabic ? 'مسح الإشعار' : 'Clear notification'}
                      aria-label="Clear notification"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer: View Portal Link & Clear All */}
            <div className="pt-3 mt-2 border-t border-[#E2EBF0] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate(fallbackLink);
                }}
                className="text-xs font-bold text-[#0E7490] hover:text-[#08596F] flex items-center gap-1.5 py-1 transition-colors cursor-pointer"
              >
                <span>
                  {user?.role === 'doctor'
                    ? (isArabic ? 'الانتقال إلى سجل الحجوزات' : 'Go to Bookings')
                    : (t('navigation.viewInPatientPortal') || 'View in Patient Portal')}
                </span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer py-1"
                  title={isArabic ? 'مسح جميع الإشعارات' : 'Clear all notifications'}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isArabic ? 'مسح الكل' : 'Clear all'}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
