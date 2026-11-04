import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { ArrowLeft, Clock, ShieldCheck, CheckCircle2, ChevronRight, FileText } from 'lucide-react-native';
import { Service } from '../types';
import { SupportBanner } from '../components/SupportBanner';

interface Props {
  service: Service;
  onBack: () => void;
  onRequestBooking: () => void;
}

export const ServiceDetailScreen: React.FC<Props> = ({ service, onBack, onRequestBooking }) => {
  const isQuotation = service.pricing_model === 'quotation' || service.pricing_type === 'quotation' || service.booking_type === 'quotation';

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Service Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.categoryBadge}>{service.category_name || 'Home Maintenance'}</Text>
          
          <View style={styles.pricingSection}>
            <Text style={styles.pricingLabel}>Pricing Model</Text>
            {isQuotation ? (
              <View style={styles.quotePricingWrap}>
                <Text style={styles.quoteAmount}>Quotation-Based</Text>
                <Text style={styles.priceSubtitle}>
                  Direct online booking is reserved for fixed-price and hourly packages. Please call or WhatsApp LocalHelp support to arrange custom quotation requests.
                </Text>
              </View>
            ) : (
              <View style={styles.fixedPricingWrap}>
                <Text style={styles.priceAmount}>
                  {service.fixed_price || service.base_price ? `₹${service.fixed_price || service.base_price}` : 'Hourly Package'}
                </Text>
                <Text style={styles.priceSubtitle}>
                  {service.booking_type === 'time_based' ? 'Time-based package pricing' : 'Transparent standard rate'}
                </Text>
              </View>
            )}
          </View>

          {service.estimated_duration_minutes && (
            <View style={styles.durationRow}>
              <Clock size={16} color="#64748b" />
              <Text style={styles.durationText}>
                Estimated completion: ~{service.estimated_duration_minutes} minutes
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About This Service</Text>
          <Text style={styles.descText}>
            {service.description || 'Professional home service coordinated by LocalHelp expert care team.'}
          </Text>
        </View>

        {/* How LocalHelp Works */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How LocalHelp Coordination Works</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <Text style={styles.stepText}>Select service package & doorstep address</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <Text style={styles.stepText}>Your request is automatically assigned to a verified local professional, who reviews the details</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <Text style={styles.stepText}>Pay securely after work completion & inspect</Text>
          </View>
        </View>

        <SupportBanner serviceName={service.name} compact />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bookButton, isQuotation && { backgroundColor: '#94a3b8' }]}
          onPress={isQuotation ? undefined : onRequestBooking}
          disabled={isQuotation}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>
            {isQuotation ? 'Online Booking Paused' : 'Book Service Now'}
          </Text>
          {!isQuotation && <ChevronRight size={18} color="#ffffff" />}
        </TouchableOpacity>
      </View>
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
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  content: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 16,
  },
  pricingSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pricingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fixedPricingWrap: {
    marginTop: 4,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16a34a',
  },
  quotePricingWrap: {
    marginTop: 4,
  },
  quoteAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#d97706',
  },
  priceSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  durationText: {
    fontSize: 13,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  descText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bookButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

