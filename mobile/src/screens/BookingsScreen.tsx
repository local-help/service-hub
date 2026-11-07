import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { Calendar, ChevronRight, CheckCircle2, Clock, Star } from 'lucide-react-native';
import { Booking } from '../types';
import { apiRequest } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';
import { colors } from '../theme/colors';

interface Props {
  onSelectBooking: (booking: Booking) => void;
  onExploreServices: () => void;
}

type FilterTab = 'all' | 'confirmed' | 'in_progress' | 'completed';

export const BookingsScreen: React.FC<Props> = ({ onSelectBooking, onExploreServices }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const data = await apiRequest<{ bookings: Booking[] } | Booking[]>('/bookings');
      const list = Array.isArray(data) ? data : (data as any).bookings || [];
      setBookings(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'confirmed') return b.status === 'confirmed' || b.status === 'rescheduled';
    if (filter === 'in_progress') return b.status === 'in_progress';
    if (filter === 'completed') return b.status === 'completed';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: colors.successLight, text: colors.successText, border: colors.successBorder };
      case 'in_progress':
        return { bg: colors.warningLight, text: colors.warningText, border: colors.warningBorder };
      case 'cancelled':
        return { bg: colors.dangerLight, text: colors.dangerText, border: colors.dangerBorder };
      default:
        return { bg: colors.primaryLight, text: colors.primary, border: colors.primaryBorder };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>
          Confirmed service schedules and completion reports
        </Text>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {[
            { id: 'all', label: 'All' },
            { id: 'confirmed', label: 'Upcoming' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabChip, filter === tab.id && styles.tabChipActive]}
              onPress={() => setFilter(tab.id as FilterTab)}
            >
              <Text style={[styles.tabChipText, filter === tab.id && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={44} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>
              Once you book a service or approve a quotation, your confirmed jobs will appear here.
            </Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={onExploreServices}>
              <Text style={styles.exploreBtnText}>Explore Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredBookings.map((b) => {
              const statusStyle = getStatusBadge(b.status);

              return (
                <TouchableOpacity
                  key={b.id}
                  style={styles.card}
                  onPress={() => onSelectBooking(b)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.refNumber}>{b.reference_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {b.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.serviceName}>{b.service_name || b.service?.name || 'Home Service'}</Text>

                  <View style={styles.metaRow}>
                    <Clock size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      {b.scheduled_at
                        ? `Scheduled: ${new Date(b.scheduled_at).toLocaleDateString()} at ${new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Date coordinating with admin'}
                    </Text>
                  </View>

                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentText}>
                      Paid: <Text style={styles.paidAmount}>₹{b.total_paid}</Text>{' '}
                      {b.fully_paid ? '✓ Fully Settled' : '(Payable after service)'}
                    </Text>
                  </View>

                  {b.rating && (
                    <View style={styles.ratingRow}>
                      <Star size={14} color="#eab308" fill="#eab308" />
                      <Text style={styles.ratingText}>Rated {b.rating}/5</Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.footerDate}>
                      Booked {new Date(b.created_at).toLocaleDateString()}
                    </Text>
                    <View style={styles.viewRow}>
                      <Text style={styles.viewText}>Manage booking</Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <SupportBanner compact />
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.borderSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabChipTextActive: {
    color: '#ffffff',
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
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  refNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  paymentRow: {
    marginTop: 8,
  },
  paymentText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  paidAmount: {
    fontWeight: '700',
    color: colors.successText,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854d0e',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  footerDate: {
    fontSize: 11,
    color: colors.textLight,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
