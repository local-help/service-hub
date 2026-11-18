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
import { 
  Calendar, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Star, 
  Sparkles,
  MapPin,
  ArrowRight
} from 'lucide-react-native';
import { Booking, ServiceRequest } from '../types';
import { apiRequest } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';
import { colors } from '../theme/colors';

export type UnifiedOrderItem =
  | {
      kind: 'booking';
      id: string;
      data: Booking;
      serviceName: string;
      referenceNumber: string;
      status: string;
      createdAt: string;
      scheduledAt?: string | null;
      amount?: number | null;
      fullyPaid?: boolean;
      rating?: number | null;
      providerName?: string | null;
      address?: string | null;
    }
  | {
      kind: 'request';
      id: string;
      data: ServiceRequest;
      serviceName: string;
      referenceNumber: string;
      status: string;
      createdAt: string;
      preferredAt?: string | null;
      quotationAmount?: number | null;
      hasQuotation: boolean;
      quotationStatus?: string | null;
      providerName?: string | null;
      address?: string | null;
    };

interface Props {
  onSelectBooking: (booking: Booking) => void;
  onSelectRequest: (request: ServiceRequest) => void;
  onExploreServices: () => void;
  initialFilter?: FilterTab;
}

export type FilterTab = 'all' | 'active' | 'in_review' | 'completed';

export const BookingsScreen: React.FC<Props> = ({ 
  onSelectBooking, 
  onSelectRequest, 
  onExploreServices,
  initialFilter = 'all'
}) => {
  const [orders, setOrders] = useState<UnifiedOrderItem[]>([]);
  const [filter, setFilter] = useState<FilterTab>(initialFilter);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const [bookingsRes, requestsRes] = await Promise.all([
        apiRequest<{ bookings: Booking[] } | Booking[]>('/bookings').catch(() => []),
        apiRequest<{ service_requests: ServiceRequest[] } | ServiceRequest[]>('/service_requests').catch(() => [])
      ]);

      const bks: Booking[] = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes as any).bookings || [];
      const reqs: ServiceRequest[] = Array.isArray(requestsRes) ? requestsRes : (requestsRes as any).service_requests || [];

      // Collect request IDs that already have a confirmed Booking so we don't show duplicates
      const bookedRequestIds = new Set<number>();
      bks.forEach((b) => {
        if (b.service_request_id) bookedRequestIds.add(b.service_request_id);
      });

      const items: UnifiedOrderItem[] = [];

      // 1. Add all bookings
      bks.forEach((b) => {
        items.push({
          kind: 'booking',
          id: `booking_${b.id}`,
          data: b,
          serviceName: b.service_name || b.service?.name || 'Home Service',
          referenceNumber: b.reference_number || `BK-${b.id}`,
          status: b.status,
          createdAt: b.created_at,
          scheduledAt: b.scheduled_at || b.preferred_at,
          amount: b.total_paid !== undefined ? b.total_paid : (b.total_amount ? Number(b.total_amount) : null),
          fullyPaid: b.fully_paid,
          rating: b.rating,
          providerName: b.provider_name || b.provider?.name,
          address: b.address?.city || b.address?.address_line
        });
      });

      // 2. Add requests that have NOT yet converted to a booking
      reqs.forEach((r) => {
        if (bookedRequestIds.has(r.id) || r.booking_id || r.has_booking) {
          // Already represented in bookings list!
          return;
        }

        items.push({
          kind: 'request',
          id: `request_${r.id}`,
          data: r,
          serviceName: r.service_name || r.service?.name || 'Service Request',
          referenceNumber: r.reference_number || `LH-${r.id}`,
          status: r.status,
          createdAt: r.created_at,
          preferredAt: r.preferred_at,
          quotationAmount: r.quotation_amount || r.quotation?.amount ? Number(r.quotation_amount || r.quotation?.amount) : null,
          hasQuotation: Boolean(r.has_quotation || r.quotation),
          quotationStatus: r.quotation_status || r.quotation?.status,
          providerName: r.provider_name || r.provider?.name,
          address: r.address?.city || r.address?.address_line
        });
      });

      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setOrders(items);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter((item) => {
    if (filter === 'active') {
      if (item.kind === 'booking') {
        return ['confirmed', 'in_progress', 'rescheduled'].includes(item.status);
      }
      return ['submitted', 'pending_review', 'contacting_provider', 'quotation_sent'].includes(item.status);
    }
    if (filter === 'in_review') {
      return item.kind === 'request' || ['pending_review', 'contacting_provider', 'quotation_sent'].includes(item.status);
    }
    if (filter === 'completed') {
      return item.kind === 'booking' && item.status === 'completed';
    }
    return true;
  });

  const getBadgeStyle = (item: UnifiedOrderItem) => {
    if (item.kind === 'request') {
      if (item.hasQuotation && item.quotationStatus !== 'rejected') {
        return {
          bg: '#FAF5FF',
          text: '#7E22CE',
          border: '#E9D5FF',
          label: item.quotationAmount ? `Quote Ready: ₹${item.quotationAmount}` : 'Quote Ready',
          actionText: 'Review Quotation'
        };
      }
      if (item.status === 'contacting_provider') {
        return {
          bg: '#EFF6FF',
          text: '#1D4ED8',
          border: '#DBEAFE',
          label: 'Matching Specialist',
          actionText: 'Track Status'
        };
      }
      if (item.status === 'cancelled') {
        return {
          bg: colors.dangerLight,
          text: colors.dangerText,
          border: colors.dangerBorder,
          label: 'Cancelled',
          actionText: 'View Details'
        };
      }
      return {
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#FDE68A',
        label: 'Scope In Review',
        actionText: 'Track Status'
      };
    }

    // Booking status
    switch (item.status) {
      case 'completed':
        return {
          bg: colors.successLight,
          text: colors.successText,
          border: colors.successBorder,
          label: 'Completed',
          actionText: 'View Receipt & Details'
        };
      case 'in_progress':
        return {
          bg: '#EFF6FF',
          text: '#1E40AF',
          border: '#BFDBFE',
          label: 'Specialist On-Site',
          actionText: 'Track Job'
        };
      case 'cancelled':
        return {
          bg: colors.dangerLight,
          text: colors.dangerText,
          border: colors.dangerBorder,
          label: 'Cancelled',
          actionText: 'View Details'
        };
      default:
        return {
          bg: colors.primaryLight,
          text: colors.primary,
          border: colors.primaryBorder,
          label: 'Confirmed Appointment',
          actionText: 'Manage Booking'
        };
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings & Orders</Text>
        <Text style={styles.headerSubtitle}>
          All your scheduled appointments, quotes, and active jobs in Prayagraj
        </Text>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'active', label: 'Active' },
            { id: 'in_review', label: 'In Review / Quotes' },
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
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={44} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Your booked doorstep services, estimates, and repair requests will appear here.'
                : `No orders found in the "${filter.replace('_', ' ')}" section.`}
            </Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={onExploreServices}>
              <Text style={styles.exploreBtnText}>Explore Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredOrders.map((item) => {
              const badge = getBadgeStyle(item);
              const isQuoteReady = item.kind === 'request' && item.hasQuotation && item.quotationStatus !== 'rejected';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, isQuoteReady && styles.cardHighlight]}
                  onPress={() => {
                    if (item.kind === 'booking') {
                      onSelectBooking(item.data);
                    } else {
                      onSelectRequest(item.data);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {/* Top Bar: Reference & Badge */}
                  <View style={styles.cardHeader}>
                    <View style={styles.typeTagRow}>
                      {item.kind === 'booking' ? (
                        <Calendar size={13} color={colors.primary} />
                      ) : (
                        <FileText size={13} color="#7E22CE" />
                      )}
                      <Text style={styles.refNumber}>{item.referenceNumber}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.statusText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {/* Service Title */}
                  <Text style={styles.serviceName}>{item.serviceName}</Text>

                  {/* Scheduled or Preferred Date/Time */}
                  <View style={styles.metaRow}>
                    <Clock size={13} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      {item.kind === 'booking'
                        ? item.scheduledAt
                          ? `Scheduled: ${new Date(item.scheduledAt).toLocaleDateString()} at ${new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Schedule coordinating with specialist'
                        : item.preferredAt
                        ? `Requested slot: ${new Date(item.preferredAt).toLocaleDateString()} at ${new Date(item.preferredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Preferred slot pending review'}
                    </Text>
                  </View>

                  {/* Location / Locality */}
                  {item.address && (
                    <View style={styles.metaRow}>
                      <MapPin size={13} color={colors.textMuted} />
                      <Text style={styles.metaText}>Prayagraj • {item.address}</Text>
                    </View>
                  )}

                  {/* Quotation Ready Action Box */}
                  {isQuoteReady && (
                    <View style={styles.quoteNoticeBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quoteNoticeTitle}>Quotation Ready for Approval</Text>
                        <Text style={styles.quoteNoticeSub}>
                          Estimated Total: <Text style={styles.quoteAmountText}>₹{item.quotationAmount}</Text>
                        </Text>
                      </View>
                      <View style={styles.quoteActionBtn}>
                        <Text style={styles.quoteActionText}>Review Quote</Text>
                        <ArrowRight size={13} color="#FFFFFF" />
                      </View>
                    </View>
                  )}

                  {/* Booking Pricing & Rating */}
                  {item.kind === 'booking' && item.amount !== null && item.amount !== undefined && !isQuoteReady && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentText}>
                        Total: <Text style={styles.paidAmount}>₹{item.amount}</Text>{' '}
                        {item.fullyPaid ? '✓ Fully Settled' : '(Payable after doorstep service)'}
                      </Text>
                    </View>
                  )}

                  {item.kind === 'booking' && item.rating && (
                    <View style={styles.ratingRow}>
                      <Star size={13} color="#eab308" fill="#eab308" />
                      <Text style={styles.ratingText}>Rated {item.rating}/5</Text>
                    </View>
                  )}

                  {/* Card Footer */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.footerDate}>
                      {item.kind === 'booking' ? 'Booked' : 'Requested'}{' '}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={styles.viewRow}>
                      <Text style={[styles.viewText, isQuoteReady && { color: '#7E22CE' }]}>
                        {badge.actionText}
                      </Text>
                      <ChevronRight size={14} color={isQuoteReady ? '#7E22CE' : colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <SupportBanner compact />
        <View style={{ height: 24 }} />
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
    paddingBottom: 14,
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
    lineHeight: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHighlight: {
    borderColor: '#D8B4FE',
    borderWidth: 1.5,
    backgroundColor: '#FEFAFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  quoteNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 10,
  },
  quoteNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B21A8',
  },
  quoteNoticeSub: {
    fontSize: 12,
    color: '#7E22CE',
    marginTop: 1,
  },
  quoteAmountText: {
    fontWeight: '800',
    color: '#581C87',
  },
  quoteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7E22CE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quoteActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
