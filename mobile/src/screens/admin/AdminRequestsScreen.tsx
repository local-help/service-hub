import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import {
  Inbox,
  Filter,
  ChevronRight,
  Clock,
  User,
  Phone,
  Briefcase,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import { ServiceRequest } from '../../types';
import { apiRequest } from '../../api/client';
import { colors } from '../../theme/colors';

interface Props {
  initialFilter?: string;
  onSelectRequest: (reqId: number) => void;
}

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending_review', label: 'Needs Match' },
  { id: 'contacting_provider', label: 'Assigned' },
  { id: 'quotation_sent', label: 'Quoted' },
  { id: 'booking_confirmed', label: 'Confirmed' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const AdminRequestsScreen: React.FC<Props> = ({ initialFilter = 'all', onSelectRequest }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const data = await apiRequest<ServiceRequest[] | { service_requests: ServiceRequest[] }>('/admin/service_requests');
      const list = Array.isArray(data) ? data : (data as any).service_requests || [];
      setRequests(list);
    } catch (err) {
      console.error('Failed to load admin requests', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const filteredRequests = requests.filter((r) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'confirmed') return r.status === 'booking_confirmed' || r.status === 'customer_approved';
    return r.status === activeFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return { bg: colors.warningLight, text: colors.warningText, border: colors.warningBorder, label: 'Needs Match' };
      case 'contacting_provider':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', label: 'Assigned' };
      case 'quotation_sent':
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'Quote Sent' };
      case 'booking_confirmed':
      case 'customer_approved':
        return { bg: colors.successLight, text: colors.successText, border: colors.successBorder, label: 'Confirmed' };
      case 'in_progress':
        return { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe', label: 'In Progress' };
      case 'completed':
        return { bg: colors.borderSubtle, text: colors.textSecondary, border: colors.border, label: 'Completed' };
      case 'cancelled':
        return { bg: colors.dangerLight, text: colors.dangerText, border: colors.dangerBorder, label: 'Cancelled' };
      default:
        return { bg: colors.borderSubtle, text: colors.textMuted, border: colors.border, label: status.replace(/_/g, ' ') };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Triage Queue...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fulfillment Queue</Text>
        <Text style={styles.subtitle}>Triage, provider matching, and quotation dispatch</Text>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Inbox size={36} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No matching requests</Text>
            <Text style={styles.emptySubtitle}>No requests found for the selected stage filter.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredRequests.map((req) => {
              const badge = getStatusBadge(req.status);
              const isUnassigned = !req.provider_name && !req.provider;

              return (
                <TouchableOpacity
                  key={req.id}
                  style={styles.card}
                  onPress={() => onSelectRequest(req.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.refNumber}>{req.reference_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.serviceName}>{req.service_name || req.service?.name || 'Home Service'}</Text>

                  {/* Customer row */}
                  <View style={styles.metaRow}>
                    <User size={13} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      <Text style={styles.metaBold}>{req.customer_name || 'Customer'}</Text>
                      {req.customer_phone ? ` • ${req.customer_phone}` : ''}
                    </Text>
                  </View>

                  {/* Provider row */}
                  <View style={styles.metaRow}>
                    <Briefcase size={13} color={isUnassigned ? colors.warningText : colors.primary} />
                    <Text style={[styles.metaText, isUnassigned && { color: colors.warningText, fontWeight: '700' }]}>
                      {req.provider_name || req.provider?.name || req.provider?.business_name || '⚠️ Unassigned (Needs Match)'}
                    </Text>
                  </View>

                  {/* Scheduled time */}
                  {req.preferred_at && (
                    <View style={styles.metaRow}>
                      <Clock size={13} color={colors.textMuted} />
                      <Text style={styles.metaText}>
                        Scheduled: {new Date(req.preferred_at).toLocaleDateString()} at{' '}
                        {new Date(req.preferred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.footerDate}>
                      Received {new Date(req.created_at).toLocaleDateString()}
                    </Text>
                    <View style={styles.triageAction}>
                      <Text style={styles.triageActionText}>Open Triage</Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

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
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  filterScroll: {
    marginHorizontal: -16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 6,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.borderSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  refNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  footerDate: {
    fontSize: 10,
    color: colors.textLight,
  },
  triageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  triageActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});

