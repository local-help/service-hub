import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ArrowLeft, Bell, Check, CheckCheck, Clock, ChevronRight } from 'lucide-react-native';
import { Notification } from '../types';
import { apiRequest } from '../api/client';
import { colors } from '../theme/colors';

interface Props {
  onBack: () => void;
  onSelectBooking?: (bookingId: number) => void;
  onSelectRequest?: (requestId: number) => void;
}

export const NotificationsScreen: React.FC<Props> = ({
  onBack,
  onSelectBooking,
  onSelectRequest,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest<{ notifications: Notification[]; meta?: { unread_count: number } } | Notification[]>('/notifications');
      const list = Array.isArray(data) ? data : (data as any).notifications || [];
      const unread = (data as any).meta?.unread_count ?? list.filter((n: Notification) => !n.is_read).length;
      setNotifications(list);
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notif: Notification) => {
    if (notif.is_read) {
      handleNavigate(notif);
      return;
    }

    try {
      await apiRequest(`/notifications/${notif.id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
    handleNavigate(notif);
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read_all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (notif: Notification) => {
    const meta = notif.metadata || {};
    if (meta.booking_id && onSelectBooking) {
      onSelectBooking(Number(meta.booking_id));
    } else if (meta.service_request_id && onSelectRequest) {
      onSelectRequest(Number(meta.service_request_id));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <CheckCheck size={16} color={colors.primary} />
            <Text style={styles.markAllText}>Mark all</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Bell size={36} color={colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                We'll notify you when providers submit quotations, confirm appointments, or when service updates arrive.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.card, !n.is_read && styles.cardUnread]}
                  onPress={() => handleMarkAsRead(n)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                      {!n.is_read && <View style={styles.unreadDot} />}
                      <Text style={[styles.title, !n.is_read && styles.titleUnread]}>
                        {n.title}
                      </Text>
                    </View>
                    <Text style={styles.timeText}>
                      {new Date(n.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <Text style={styles.bodyText}>{n.body}</Text>

                  {(n.metadata?.booking_id || n.metadata?.service_request_id) && (
                    <View style={styles.actionRow}>
                      <Text style={styles.actionText}>
                        {n.metadata?.booking_id ? 'View booking details' : 'View service request'}
                      </Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 6,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  list: {
    gap: 10,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  titleUnread: {
    fontWeight: '800',
    color: colors.primaryDark,
  },
  timeText: {
    fontSize: 11,
    color: colors.textLight,
  },
  bodyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
