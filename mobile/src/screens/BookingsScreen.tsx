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

interface Props {
  onSelectBooking: (booking: Booking) => void;
  onExploreServices: () => void;
}

export const BookingsScreen: React.FC<Props> = ({ onSelectBooking, onExploreServices }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
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
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No confirmed bookings yet</Text>
            <Text style={styles.emptyText}>
              Once you approve a quotation or book a fixed-price service, your scheduled jobs will appear here.
            </Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={onExploreServices}>
              <Text style={styles.exploreBtnText}>Explore Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {bookings.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.card}
                onPress={() => onSelectBooking(b)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.refNumber}>{b.reference_number}</Text>
                  <View style={[styles.statusBadge, b.status === 'completed' ? styles.statusCompleted : styles.statusConfirmed]}>
                    <Text style={[styles.statusText, b.status === 'completed' ? styles.statusTextCompleted : styles.statusTextConfirmed]}>
                      {b.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.serviceName}>{b.service_name || 'Confirmed Service'}</Text>

                <View style={styles.metaRow}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.metaText}>
                    {b.scheduled_at ? `Scheduled: ${new Date(b.scheduled_at).toLocaleDateString()}` : 'Date confirmed with admin'}
                  </Text>
                </View>

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentText}>
                    Paid: <Text style={styles.paidAmount}>₹{b.total_paid}</Text> {b.fully_paid ? '✓ Fully Paid' : '(Pending balance)'}
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
                    <ChevronRight size={14} color="#2563eb" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <SupportBanner compact />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
    borderColor: '#e2e8f0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  exploreBtn: {
    backgroundColor: '#2563eb',
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
    borderColor: '#e2e8f0',
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
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusConfirmed: {
    backgroundColor: '#dbeafe',
  },
  statusTextConfirmed: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '800',
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
  },
  statusTextCompleted: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  paymentRow: {
    marginTop: 8,
  },
  paymentText: {
    fontSize: 12,
    color: '#475569',
  },
  paidAmount: {
    fontWeight: '700',
    color: '#16a34a',
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
    borderTopColor: '#f1f5f9',
  },
  footerDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
});
