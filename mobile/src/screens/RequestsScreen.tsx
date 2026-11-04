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

interface Props {
  onSelectRequest: (req: ServiceRequest) => void;
  onExploreServices: () => void;
}

export const RequestsScreen: React.FC<Props> = ({ onSelectRequest, onExploreServices }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
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
        return { bg: '#fef3c7', text: '#b45309' };
      case 'customer_approved':
      case 'booking_confirmed':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'cancelled':
      case 'customer_rejected':
        return { bg: '#fee2e2', text: '#b91c1c' };
      default:
        return { bg: '#eff6ff', text: '#1d4ed8' };
    }
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
        <Text style={styles.headerTitle}>My Service Requests</Text>
        <Text style={styles.headerSubtitle}>
          Track quotations, coordination status, and approvals
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <FileText size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No service requests yet</Text>
            <Text style={styles.emptyText}>
              Find a service in the explore tab and submit a request to get started.
            </Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={onExploreServices}>
              <Text style={styles.exploreBtnText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {requests.map((r) => {
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
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {r.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.serviceName}>{r.service?.name || 'Service'}</Text>
                  <Text style={styles.desc} numberOfLines={2}>{r.description}</Text>

                  {hasQuote && (
                    <View style={styles.quoteAlert}>
                      <AlertCircle size={14} color="#b45309" />
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
                      <ChevronRight size={14} color="#2563eb" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
  cardHighlight: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
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
    color: '#2563eb',
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
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  desc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  quoteAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  quoteAlertText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
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
  dateText: {
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

