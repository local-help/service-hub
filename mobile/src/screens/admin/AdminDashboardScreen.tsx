import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  Inbox,
  Calendar,
  Users,
  Briefcase,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react-native';
import { AdminDashboardData, ServiceRequest } from '../../types';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';

interface Props {
  onSelectRequest: (reqId: number) => void;
  onGoToRequests: (statusFilter?: string) => void;
  onGoToBookings: () => void;
  onGoToProviders: () => void;
}

export const AdminDashboardScreen: React.FC<Props> = ({
  onSelectRequest,
  onGoToRequests,
  onGoToBookings,
  onGoToProviders,
}) => {
  const { user, setViewMode } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await apiRequest<AdminDashboardData>('/admin/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return { bg: colors.warningLight, text: colors.warningText, border: colors.warningBorder, label: 'Needs Match' };
      case 'contacting_provider':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', label: 'Assigned' };
      case 'booking_confirmed':
      case 'customer_approved':
        return { bg: colors.successLight, text: colors.successText, border: colors.successBorder, label: 'Confirmed' };
      case 'in_progress':
        return { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe', label: 'In Progress' };
      case 'completed':
        return { bg: colors.borderSubtle, text: colors.textSecondary, border: colors.border, label: 'Completed' };
      default:
        return { bg: colors.borderSubtle, text: colors.textMuted, border: colors.border, label: status.replace(/_/g, ' ') };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Operations Workspace...</Text>
      </View>
    );
  }

  const m = data?.metrics;

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <View style={styles.roleBadgeRow}>
            <View style={styles.adminRolePill}>
              <Text style={styles.adminRoleText}>OPERATIONS WORKSPACE</Text>
            </View>
          </View>
          <Text style={styles.topTitle}>Admin Console</Text>
          <Text style={styles.topSub}>Central dispatch & fulfillment queue • Prayagraj</Text>
        </View>

        <TouchableOpacity
          style={styles.switchModeBtn}
          onPress={() => setViewMode('customer')}
          activeOpacity={0.8}
        >
          <Eye size={14} color={colors.primary} />
          <Text style={styles.switchModeText}>Customer App</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Metrics Grid */}
        <View style={styles.kpiGrid}>
          <TouchableOpacity
            style={[styles.kpiCard, { borderColor: '#fef3c7' }]}
            onPress={() => onGoToRequests('pending_review')}
            activeOpacity={0.7}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Needs Match</Text>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#fef3c7' }]}>
                <AlertCircle size={14} color="#b45309" />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: '#b45309' }]}>{m?.pending_review || 0}</Text>
            <Text style={styles.kpiSub}>Pending review</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { borderColor: '#e0f2fe' }]}
            onPress={() => onGoToRequests('contacting_provider')}
            activeOpacity={0.7}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Assigned</Text>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#e0f2fe' }]}>
                <Clock size={14} color="#0369a1" />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: '#0369a1' }]}>{m?.contacting_provider || 0}</Text>
            <Text style={styles.kpiSub}>Awaiting specialist</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { borderColor: colors.successBorder }]}
            onPress={onGoToBookings}
            activeOpacity={0.7}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Confirmed</Text>
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.successLight }]}>
                <CheckCircle2 size={14} color={colors.successText} />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: colors.successText }]}>{m?.confirmed_bookings || 0}</Text>
            <Text style={styles.kpiSub}>Active appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { borderColor: colors.primaryBorder }]}
            onPress={onGoToProviders}
            activeOpacity={0.7}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Providers</Text>
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Briefcase size={14} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: colors.primary }]}>{m?.active_providers || 0}</Text>
            <Text style={styles.kpiSub}>Active technicians</Text>
          </TouchableOpacity>
        </View>

        {/* Pipeline Stages Quick Filter Row */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pipeline Stage Shortcuts</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pipelineScroll}>
          {[
            { label: 'Pending Review', count: m?.pending_review || 0, status: 'pending_review' },
            { label: 'Assigned', count: m?.contacting_provider || 0, status: 'contacting_provider' },
            { label: 'Confirmed', count: m?.confirmed_bookings || 0, status: 'confirmed' },
            { label: 'In Progress', count: m?.in_progress_bookings || 0, status: 'in_progress' },
            { label: 'Completed', count: m?.completed_bookings || 0, status: 'completed' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.pipelinePill}
              onPress={() => onGoToRequests(item.status)}
              activeOpacity={0.7}
            >
              <Text style={styles.pipelinePillText}>{item.label}</Text>
              <View style={styles.pipelinePillCount}>
                <Text style={styles.pipelinePillCountText}>{item.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent Triage Queue */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Triage Queue</Text>
          <TouchableOpacity onPress={() => onGoToRequests()} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {!data?.recent_requests || data.recent_requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Inbox size={32} color={colors.textLight} />
            <Text style={styles.emptyText}>No requests in queue</Text>
          </View>
        ) : (
          <View style={styles.requestList}>
            {data.recent_requests.map((req) => {
              const badge = getStatusBadge(req.status);
              return (
                <TouchableOpacity
                  key={req.id}
                  style={styles.requestCard}
                  onPress={() => onSelectRequest(req.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.reqCardTop}>
                    <Text style={styles.reqRef}>{req.reference_number}</Text>
                    <View style={[styles.badgePill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.reqService}>{req.service_name || 'Home Service'}</Text>
                  <Text style={styles.reqCustomer}>
                    Customer: <Text style={styles.reqBold}>{req.customer_name || 'Customer'}</Text>{' '}
                    {req.customer_phone ? `(${req.customer_phone})` : ''}
                  </Text>

                  {req.description ? (
                    <Text style={styles.reqDesc} numberOfLines={2}>
                      {req.description}
                    </Text>
                  ) : null}

                  <View style={styles.reqCardBottom}>
                    <Text style={styles.reqDate}>
                      {new Date(req.created_at).toLocaleDateString()} at{' '}
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <View style={styles.triageAction}>
                      <Text style={styles.triageActionText}>Triage</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  adminRolePill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  adminRoleText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  topSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.borderSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchModeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  kpiIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  pipelineScroll: {
    marginBottom: 16,
  },
  pipelinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  pipelinePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pipelinePillCount: {
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  pipelinePillCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  requestList: {
    gap: 10,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reqCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reqRef: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  reqService: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  reqCustomer: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  reqBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reqDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  reqCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  reqDate: {
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
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
});

