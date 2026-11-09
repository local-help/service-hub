import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Platform 
} from 'react-native';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  ArrowRight 
} from 'lucide-react-native';
import { ServiceRequest } from '../types';
import { apiRequest } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';
import { colors } from '../theme/colors';

interface Props {
  requestId: number;
  onBack: () => void;
  onRefreshList: () => void;
  onGoToBooking?: (bookingId: number) => void;
}

export const RequestDetailScreen: React.FC<Props> = ({ 
  requestId, 
  onBack, 
  onRefreshList,
  onGoToBooking 
}) => {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      const data = await apiRequest<{ service_request: ServiceRequest } | ServiceRequest>(`/service_requests/${requestId}`);
      const req = (data as any).service_request || data;
      setRequest(req);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [requestId]);

  const handleApproveQuote = async () => {
    Alert.alert(
      'Approve Quotation',
      `Confirm acceptance of quotation amount ₹${request?.quotation?.amount}? This will confirm your booking appointment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiRequest(`/service_requests/${requestId}/quotation/approve`, {
                method: 'POST',
              });
              Alert.alert('Approved!', 'Your service quotation is approved and booking confirmed.');
              await fetchDetail();
              onRefreshList();
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to approve quotation');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectQuote = async () => {
    Alert.alert(
      'Reject Quotation',
      'Are you sure you want to reject this quotation? Our central care team will review alternatives.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiRequest(`/service_requests/${requestId}/quotation/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason: 'Quotation rejected by customer' }),
              });
              Alert.alert('Quotation Rejected', 'We will review your request and follow up.');
              await fetchDetail();
              onRefreshList();
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to reject quotation');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = async () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this service request?',
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiRequest(`/service_requests/${requestId}/cancel`, {
                method: 'POST',
                body: JSON.stringify({ reason: 'Cancelled by customer' }),
              });
              Alert.alert('Cancelled', 'Your service request has been cancelled.');
              await fetchDetail();
              onRefreshList();
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to cancel request');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !request) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const quote = request.quotation;
  const canActOnQuote = quote && request.status === 'quotation_sent';
  const canCancel = ['submitted', 'pending_review', 'contacting_provider', 'quotation_sent', 'quotation_rejected'].includes(request.status);
  const isConfirmed = ['customer_approved', 'booking_confirmed'].includes(request.status) || request.booking != null;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{request.reference_number}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Request Status</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{request.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.serviceName}>{request.service?.name}</Text>
          {request.service_variant && (
            <Text style={styles.variantName}>Package: {request.service_variant.name}</Text>
          )}
          <Text style={styles.desc}>{request.description}</Text>

          {request.preferred_at && (
            <View style={styles.metaRow}>
              <Calendar size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>
                Scheduled: {new Date(request.preferred_at).toLocaleDateString()} at {new Date(request.preferred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}

          {request.address && (
            <View style={styles.metaRow}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {request.address.address_line}, {request.address.city}
              </Text>
            </View>
          )}
        </View>

        {/* Confirmed Booking Shortcut */}
        {isConfirmed && request.booking && (
          <TouchableOpacity
            style={styles.bookingCardShortcut}
            onPress={() => onGoToBooking && onGoToBooking(request.booking!.id)}
            activeOpacity={0.8}
          >
            <View style={styles.shortcutIconWrap}>
              <CheckCircle2 size={24} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shortcutTitle}>Booking Confirmed!</Text>
              <Text style={styles.shortcutSub}>
                Ref: {request.booking.reference_number} • Tap to view booking details
              </Text>
            </View>
            <ArrowRight size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Assigned Provider Info */}
        {(request.provider || request.current_assignment) && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <UserCheck size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>Assigned Professional</Text>
            </View>
            <Text style={styles.providerName}>
              {request.provider?.business_name || request.provider?.name || request.current_assignment?.provider_name || 'Verified Technician'}
            </Text>
            <Text style={styles.providerStatus}>
              Coordination status: {request.current_assignment?.status || 'Assigned'}
            </Text>
          </View>
        )}

        {/* Quotation Section */}
        {quote && (
          <View style={[styles.card, canActOnQuote && styles.quoteCardActive]}>
            <Text style={styles.quoteCardTitle}>Local Provider Quotation</Text>
            
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Total Quoted Amount</Text>
              <Text style={styles.amountText}>₹{quote.amount}</Text>
            </View>

            {quote.description && (
              <View style={styles.quoteField}>
                <Text style={styles.fieldLabel}>Scope of Work & Inclusions</Text>
                <Text style={styles.fieldValue}>{quote.description}</Text>
              </View>
            )}

            {quote.valid_until && (
              <Text style={styles.validText}>
                Quotation Valid Until: {new Date(quote.valid_until).toLocaleDateString()}
              </Text>
            )}

            {/* Approval / Rejection Buttons */}
            {canActOnQuote && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={handleApproveQuote}
                  disabled={actionLoading}
                >
                  <Check size={18} color="#ffffff" />
                  <Text style={styles.approveBtnText}>Approve Quote</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={handleRejectQuote}
                  disabled={actionLoading}
                >
                  <X size={18} color={colors.danger} />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Support Banner */}
        <SupportBanner 
          referenceNumber={request.reference_number} 
          serviceName={request.service?.name} 
        />

        {/* Cancel Request Link */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelLink}
            onPress={handleCancelRequest}
            disabled={actionLoading}
          >
            <Text style={styles.cancelLinkText}>Cancel Service Request</Text>
          </TouchableOpacity>
        )}

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
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  statusPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  variantName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  desc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  bookingCardShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 14,
  },
  shortcutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.successText,
  },
  shortcutSub: {
    fontSize: 11,
    color: colors.successText,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  providerStatus: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  quoteCardActive: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningLight,
  },
  quoteCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  amountBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 2,
  },
  quoteField: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  fieldValue: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: 18,
  },
  validText: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: colors.primary,
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  rejectBtnText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  cancelLink: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelLinkText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '600',
  },
});
