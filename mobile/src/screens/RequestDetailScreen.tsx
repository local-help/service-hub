import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { ArrowLeft, Check, X, Phone, MessageCircle, AlertCircle, FileText, Calendar, MapPin } from 'lucide-react-native';
import { ServiceRequest } from '../types';
import { apiRequest } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';

interface Props {
  requestId: number;
  onBack: () => void;
  onRefreshList: () => void;
}

export const RequestDetailScreen: React.FC<Props> = ({ requestId, onBack, onRefreshList }) => {
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
      `Confirm acceptance of quotation amount ₹${request?.quotation?.amount}? This will confirm your booking.`,
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
              Alert.alert('Approved!', 'Booking confirmed successfully.');
              await fetchDetail();
              onRefreshList();
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to approve quotation');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRejectQuote = async () => {
    Alert.alert(
      'Reject Quotation',
      'Are you sure you want to reject this quotation?',
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
                body: JSON.stringify({ reason: 'Price or scope rejected by customer' })
              });
              Alert.alert('Quotation Rejected', 'Our care team will review alternative solutions.');
              await fetchDetail();
              onRefreshList();
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to reject quotation');
            } finally {
              setActionLoading(false);
            }
          }
        }
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
                body: JSON.stringify({ reason: 'Cancelled by customer' })
              });
              await fetchDetail();
              onRefreshList();
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to cancel request');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading || !request) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const quote = request.quotation;
  const canActOnQuote = quote && request.status === 'quotation_sent';
  const canCancel = ['submitted', 'pending_review', 'provider_contacted', 'quotation_sent'].includes(request.status);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{request.reference_number}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Current Status</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{request.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.serviceName}>{request.service?.name}</Text>
          <Text style={styles.desc}>{request.description}</Text>

          {request.preferred_date && (
            <View style={styles.metaRow}>
              <Calendar size={14} color="#64748b" />
              <Text style={styles.metaText}>
                Preferred Date: {request.preferred_date} ({request.preferred_time_slot})
              </Text>
            </View>
          )}

          {request.address && (
            <View style={styles.metaRow}>
              <MapPin size={14} color="#64748b" />
              <Text style={styles.metaText}>
                {request.address.address_line}, {request.address.city}
              </Text>
            </View>
          )}
        </View>

        {/* Quotation Section */}
        {quote && (
          <View style={[styles.card, canActOnQuote && styles.quoteCardActive]}>
            <Text style={styles.quoteCardTitle}>Service Quotation</Text>
            
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Estimated Total</Text>
              <Text style={styles.amountText}>₹{quote.amount}</Text>
            </View>

            {quote.description && (
              <View style={styles.quoteField}>
                <Text style={styles.fieldLabel}>Quotation Scope / Description</Text>
                <Text style={styles.fieldValue}>{quote.description}</Text>
              </View>
            )}

            {quote.valid_until && (
              <Text style={styles.validText}>
                Valid Until: {new Date(quote.valid_until).toLocaleDateString()}
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
                  <X size={18} color="#dc2626" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Support Options */}
        <SupportBanner 
          referenceNumber={request.reference_number} 
          serviceName={request.service?.name} 
        />

        {/* Cancel Button */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelLink}
            onPress={handleCancelRequest}
            disabled={actionLoading}
          >
            <Text style={styles.cancelLinkText}>Cancel Service Request</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 6,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'monospace',
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
    borderColor: '#e2e8f0',
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
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statusPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  desc: {
    fontSize: 13,
    color: '#475569',
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
    color: '#64748b',
  },
  quoteCardActive: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffdf5',
  },
  quoteCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  amountBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 2,
  },
  quoteField: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  fieldValue: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
  },
  validText: {
    fontSize: 11,
    color: '#94a3b8',
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
    backgroundColor: '#16a34a',
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  rejectBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelLink: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelLinkText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '600',
  },
});

