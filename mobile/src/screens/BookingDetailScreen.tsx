import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { ArrowLeft, Calendar, Clock, Star, MapPin, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { Booking } from '../types';
import { apiRequest } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';

interface Props {
  bookingId: number;
  onBack: () => void;
  onRefreshList: () => void;
}

export const BookingDetailScreen: React.FC<Props> = ({ bookingId, onBack, onRefreshList }) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reschedule Form
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Rating & Feedback Form
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fetchDetail = async () => {
    try {
      const data = await apiRequest<{ booking: Booking } | Booking>(`/bookings/${bookingId}`);
      const b = (data as any).booking || data;
      setBooking(b);
      if (b.rating) {
        setRating(b.rating);
        setFeedback(b.feedback || '');
        setFeedbackSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [bookingId]);

  const handleReschedule = async () => {
    if (!rescheduleDate.trim()) {
      Alert.alert('Required', 'Please enter your newly preferred date (YYYY-MM-DD).');
      return;
    }
    setActionLoading(true);
    try {
      await apiRequest(`/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          preferred_date: rescheduleDate,
          reason: rescheduleReason || 'Customer requested reschedule'
        })
      });
      Alert.alert('Reschedule Requested', 'Admin will coordinate with the assigned provider and update your schedule.');
      setShowReschedule(false);
      await fetchDetail();
      onRefreshList();
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to request reschedule');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this confirmed booking?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiRequest(`/bookings/${bookingId}/cancel`, {
                method: 'POST',
                body: JSON.stringify({ reason: 'Customer requested cancellation' })
              });
              Alert.alert('Booking Cancelled', 'Your booking was cancelled.');
              await fetchDetail();
              onRefreshList();
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to cancel booking');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmitFeedback = async () => {
    setActionLoading(true);
    try {
      await apiRequest(`/bookings/${bookingId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating, feedback })
      });
      setFeedbackSubmitted(true);
      Alert.alert('Thank You!', 'Your rating and feedback have been recorded.');
      await fetchDetail();
      onRefreshList();
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to submit feedback');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !booking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const isCompleted = booking.status === 'completed';
  const canRescheduleOrCancel = ['confirmed', 'rescheduled'].includes(booking.status);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{booking.reference_number}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Main Status Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Booking Status</Text>
            <View style={[styles.statusPill, isCompleted ? styles.pillCompleted : styles.pillActive]}>
              <Text style={[styles.statusText, isCompleted ? styles.textCompleted : styles.textActive]}>
                {booking.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.serviceName}>{booking.service_name}</Text>

          <View style={styles.infoRow}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.infoText}>
              {booking.scheduled_at ? `Scheduled for: ${new Date(booking.scheduled_at).toLocaleString()}` : 'Schedule coordinating with provider'}
            </Text>
          </View>

          <View style={styles.paymentBox}>
            <Text style={styles.paymentTitle}>Payment Status</Text>
            <Text style={styles.paymentAmount}>
              Paid: ₹{booking.total_paid} {booking.payment_amount ? `of ₹${booking.payment_amount}` : ''}
            </Text>
            <Text style={styles.paymentSubtitle}>
              {booking.fully_paid ? '✓ Fully settled' : 'Payment balance can be paid offline to technician upon service completion.'}
            </Text>
          </View>
        </View>

        {/* Reschedule Box */}
        {showReschedule ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Request Date/Time Reschedule</Text>
            <TextInput
              placeholder="Preferred Date (YYYY-MM-DD) *"
              placeholderTextColor="#94a3b8"
              value={rescheduleDate}
              onChangeText={setRescheduleDate}
              style={styles.input}
            />
            <TextInput
              placeholder="Reason for reschedule..."
              placeholderTextColor="#94a3b8"
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              style={styles.input}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowReschedule(false)}
              >
                <Text style={styles.cancelBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleReschedule}
                disabled={actionLoading}
              >
                <Text style={styles.confirmBtnText}>Submit Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : canRescheduleOrCancel ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Manage Appointment</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.rescheduleBtn}
                onPress={() => setShowReschedule(true)}
              >
                <Text style={styles.rescheduleBtnText}>Request Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBookingBtn}
                onPress={handleCancelBooking}
              >
                <Text style={styles.cancelBookingBtnText}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Customer Rating & Feedback (If completed) */}
        {isCompleted && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Feedback & Rating</Text>
            {feedbackSubmitted ? (
              <View style={styles.ratedBox}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={22}
                      color="#eab308"
                      fill={s <= rating ? '#eab308' : 'none'}
                    />
                  ))}
                </View>
                {feedback ? <Text style={styles.feedbackGiven}>"{feedback}"</Text> : null}
                <Text style={styles.thankYouText}>Thank you for your review!</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.rateLabel}>How was your service experience?</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                      <Star
                        size={28}
                        color="#eab308"
                        fill={s <= rating ? '#eab308' : 'none'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  multiline
                  numberOfLines={3}
                  placeholder="Share details about the technician, punctuality, and service quality..."
                  placeholderTextColor="#94a3b8"
                  value={feedback}
                  onChangeText={setFeedback}
                  style={[styles.input, { height: 75, marginTop: 10 }]}
                />
                <TouchableOpacity
                  style={styles.submitReviewBtn}
                  onPress={handleSubmitFeedback}
                  disabled={actionLoading}
                >
                  <Text style={styles.submitReviewBtnText}>Submit Feedback</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Support Banner */}
        <SupportBanner 
          referenceNumber={booking.reference_number} 
          serviceName={booking.service_name} 
        />
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pillActive: {
    backgroundColor: '#dbeafe',
  },
  textActive: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '800',
  },
  pillCompleted: {
    backgroundColor: '#dcfce7',
  },
  textCompleted: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
  },
  paymentBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 14,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803d',
    marginTop: 2,
  },
  paymentSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rescheduleBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  rescheduleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  cancelBookingBtn: {
    flex: 1,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBookingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  rateLabel: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  submitReviewBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitReviewBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  ratedBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  feedbackGiven: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  thankYouText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 6,
  },
});
