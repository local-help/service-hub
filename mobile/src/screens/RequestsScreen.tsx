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
import { FileText, ChevronRight, Clock, AlertCircle } from 'lucide-react-native';
import { ServiceRequest } from '../types';
import { apiRequest } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';
import { colors } from '../theme/colors';

interface Props {
  onSelectRequest: (req: ServiceRequest) => void;
  onExploreServices: () => void;
}

type FilterTab = 'all' | 'pending' | 'quoted' | 'confirmed';

export const RequestsScreen: React.FC<Props> = ({ onSelectRequest, onExploreServices }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const data = await apiRequest<{ service_requests: ServiceRequest[] } | ServiceRequest[]>('/service_requests');
      const list = Array.isArray(data) ? data : (data as any).service_requests || [];
      setRequests(list);
    } catch (err) {
      console.error(err);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quotation_sent':
        return { bg: colors.warningLight, text: colors.warningText, border: colors.warningBorder };
      case 'customer_approved':
      case 'booking_confirmed':
        return { bg: colors.successLight, text: colors.successText, border: colors.successBorder };
      case 'cancelled':
      case 'customer_rejected':
        return { bg: colors.dangerLight, text: colors.dangerText, border: colors.dangerBorder };
      default:
        return { bg: colors.primaryLight, text: colors.primary, border: colors.primaryBorder };
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'quoted') return r.status === 'quotation_sent';
    if (filter === 'confirmed') return ['customer_approved', 'booking_confirmed'].includes(r.status);
    if (filter === 'pending') return ['submitted', 'pending_review', 'provider_contacted'].includes(r.status);
    return true;
  });

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
        <Text style={styles.headerTitle}>My Service Requests</Text>
        <Text style={styles.headerSubtitle}>
          Track quotations, coordination status, and approvals
        </Text>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {[
            { id: 'all', label: 'All' },
            { id: 'quoted', label: 'Quoted' },
            { id: 'pending', label: 'Pending' },
            { id: 'confirmed', label: 'Confirmed' },
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
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <FileText size={44} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No service requests found</Text>
            <Text style={styles.emptyText}>
              Find a service in the explore tab and submit a booking request.
            </Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={onExploreServices}>
              <Text style={styles.exploreBtnText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredRequests.map((r) => {
              const statusStyle = getStatusColor(r.status);
              const hasQuote = r.quotation && r.status === 'quotation_sent';

              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.card, hasQuote && styles.cardHighlight]}
                  onPress={() => onSelectRequest(r)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.refNumber}>{r.reference_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {r.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.serviceName}>{r.service?.name || 'Service'}</Text>
                  <Text style={styles.desc} numberOfLines={2}>{r.description}</Text>

                  {hasQuote && (
                    <View style={styles.quoteAlert}>
                      <AlertCircle size={15} color={colors.warningText} />
                      <Text style={styles.quoteAlertText}>
                        Quotation received: ₹{r.quotation?.amount} (Action Required)
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>
                      Requested: {new Date(r.created_at).toLocaleDateString()}
                    </Text>
                    <View style={styles.viewRow}>
                      <Text style={styles.viewText}>View details</Text>
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
  cardHighlight: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningLight,
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
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  desc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  quoteAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  quoteAlertText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warningText,
    flex: 1,
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
  dateText: {
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
