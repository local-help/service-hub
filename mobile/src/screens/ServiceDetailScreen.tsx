import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import { 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  Car, 
  Moon, 
  AlertTriangle 
} from 'lucide-react-native';
import { Service, ServiceVariant } from '../types';
import { apiRequest } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';
import { colors } from '../theme/colors';

export interface BookingOptions {
  selectedVariant?: ServiceVariant | null;
  selectedVehicle?: string | null;
  driverHours?: number | null;
  pickupDrop?: boolean;
  totalPrice?: number | null;
}

interface Props {
  service: Service;
  onBack: () => void;
  onRequestBooking: (options?: BookingOptions) => void;
}

export const ServiceDetailScreen: React.FC<Props> = ({ service, onBack, onRequestBooking }) => {
  const [fullService, setFullService] = useState<Service>(service);
  const [loading, setLoading] = useState(false);

  // User selections
  const [selectedVehicle, setSelectedVehicle] = useState<string>('hatchback');
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [pickupDrop, setPickupDrop] = useState(false);

  // Time-based driver controls
  const [driverHours, setDriverHours] = useState<number>(8);
  const [extendsPastNight, setExtendsPastNight] = useState<boolean>(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);

  useEffect(() => {
    // Fetch detailed service (with full variants)
    setLoading(true);
    apiRequest<Service>(`/services/${service.id}`)
      .then((data) => {
        setFullService(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariantId(data.variants[0].id);
        }
        if (data.supported_vehicle_types && data.supported_vehicle_types.length > 0) {
          setSelectedVehicle(data.supported_vehicle_types[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [service.id]);

  // Dynamic calculation for time-based services
  useEffect(() => {
    if (!fullService || fullService.booking_type !== 'time_based') return;
    setCalcLoading(true);
    const nightHrs = extendsPastNight ? Math.max(driverHours - 8, 2) : 0;

    apiRequest<any>(`/services/${fullService.id}/calculate_price`, {
      method: 'POST',
      body: JSON.stringify({
        variant_id: selectedVariantId,
        hours: driverHours,
        extends_past_night: extendsPastNight,
        night_hours: nightHrs,
      }),
    })
      .then((res) => {
        if (res && res.total_price) {
          setCalculatedPrice(res.total_price);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setCalcLoading(false));
  }, [fullService, selectedVariantId, driverHours, extendsPastNight]);

  const isComingSoon = fullService.coming_soon || fullService.category?.coming_soon;
  const bType = fullService.booking_type || fullService.pricing_type;
  const hasVariants = fullService.variants && fullService.variants.length > 0;

  // Filter variants by vehicle type
  const matchingVariants = hasVariants
    ? fullService.variants!.filter((v) => {
        const vTypes = (v.variant_attributes || {})['vehicle_types'];
        if (!vTypes || vTypes.length === 0) return true;
        if (selectedVehicle === 'hatchback' || selectedVehicle === 'sedan') {
          return vTypes.includes('hatchback') || vTypes.includes('sedan');
        }
        return vTypes.includes(selectedVehicle);
      })
    : [];

  const displayVariants = matchingVariants.length > 0 ? matchingVariants : (fullService.variants || []);
  const selectedVariant = fullService.variants?.find((v) => v.id === selectedVariantId);

  // Compute final price
  const finalPrice = bType === 'time_based'
    ? (calculatedPrice || 800)
    : (selectedVariant?.primary_price || fullService.fixed_price || fullService.base_price || 299);

  const handleProceed = () => {
    if (isComingSoon) return;
    onRequestBooking({
      selectedVariant: selectedVariant || null,
      selectedVehicle: fullService.supported_vehicle_types && fullService.supported_vehicle_types.length > 0 ? selectedVehicle : null,
      driverHours: bType === 'time_based' ? driverHours : null,
      pickupDrop,
      totalPrice: finalPrice,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Service Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.serviceName}>{fullService.name}</Text>
          <Text style={styles.categoryBadge}>{fullService.category_name || fullService.category?.name || 'Local Service'}</Text>
          
          <Text style={styles.descText}>
            {fullService.description || fullService.short_description || 'Professional home service coordinated by LocalHelp expert care team.'}
          </Text>

          {fullService.estimated_duration_minutes && (
            <View style={styles.durationRow}>
              <Clock size={16} color={colors.textMuted} />
              <Text style={styles.durationText}>
                Estimated completion: ~{fullService.estimated_duration_minutes} minutes
              </Text>
            </View>
          )}
        </View>

        {/* Coming Soon Notice */}
        {isComingSoon && (
          <View style={styles.comingSoonBox}>
            <AlertTriangle size={18} color={colors.warningText} />
            <View style={{ flex: 1 }}>
              <Text style={styles.comingSoonTitle}>Launching Soon in Prayagraj</Text>
              <Text style={styles.comingSoonDesc}>
                We are onboarding verified providers. Online bookings will open shortly.
              </Text>
            </View>
          </View>
        )}

        {/* Vehicle Type Selector */}
        {!isComingSoon && fullService.supported_vehicle_types && fullService.supported_vehicle_types.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Car size={16} color={colors.textMuted} />
              <Text style={styles.cardTitle}>Select Vehicle Type</Text>
            </View>
            <View style={styles.vehicleGrid}>
              {fullService.supported_vehicle_types.map((vt) => (
                <TouchableOpacity
                  key={vt}
                  style={[styles.vehicleBtn, selectedVehicle === vt && styles.vehicleBtnActive]}
                  onPress={() => setSelectedVehicle(vt)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.vehicleBtnText, selectedVehicle === vt && styles.vehicleBtnTextActive]}>
                    {vt === 'suv_muv'
                      ? 'SUV / MUV'
                      : vt === 'bike_scooter'
                      ? 'Bike / Scooter'
                      : vt.charAt(0).toUpperCase() + vt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Service Package / Variant Selection */}
        {!isComingSoon && displayVariants.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Choose Package</Text>
            <View style={styles.variantsList}>
              {displayVariants.map((variant) => {
                const isSelected = selectedVariantId === variant.id;
                const price = variant.primary_price;

                return (
                  <TouchableOpacity
                    key={variant.id}
                    style={[styles.variantItem, isSelected && styles.variantItemActive]}
                    onPress={() => setSelectedVariantId(variant.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioWrap}>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.variantName}>{variant.name}</Text>
                        {variant.description && (
                          <Text style={styles.variantDesc}>{variant.description}</Text>
                        )}
                      </View>
                    </View>
                    {price && (
                      <Text style={styles.variantPrice}>₹{price}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional Pickup & Drop */}
            {fullService.slug === 'car-wash' && (
              <TouchableOpacity
                style={styles.addonRow}
                onPress={() => setPickupDrop(!pickupDrop)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, pickupDrop && styles.checkboxActive]}>
                  {pickupDrop && <CheckCircle2 size={16} color="#ffffff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addonTitle}>Doorstep Pickup & Return Delivery</Text>
                  <Text style={styles.addonSub}>Technician drives car to center and returns cleaned</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Time-Based Service Duration Controls */}
        {!isComingSoon && bType === 'time_based' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Duty Shift Duration</Text>
            <View style={styles.vehicleGrid}>
              {[4, 8, 10, 12].map((hrs) => (
                <TouchableOpacity
                  key={hrs}
                  style={[styles.vehicleBtn, driverHours === hrs && styles.vehicleBtnActive]}
                  onPress={() => setDriverHours(hrs)}
                >
                  <Text style={[styles.vehicleBtnText, driverHours === hrs && styles.vehicleBtnTextActive]}>
                    {hrs} Hours
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.addonRow, { marginTop: 12 }]}
              onPress={() => setExtendsPastNight(!extendsPastNight)}
              activeOpacity={0.7}
            >
              <Moon size={18} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addonTitle}>Duty Extends Past 10:00 PM</Text>
                <Text style={styles.addonSub}>Late night duty includes fixed driver night allowance</Text>
              </View>
              <View style={[styles.checkbox, extendsPastNight && styles.checkboxActive]}>
                {extendsPastNight && <CheckCircle2 size={16} color="#ffffff" />}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* How It Works */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How LocalHelp Coordination Works</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <Text style={styles.stepText}>Select package and doorstep schedule</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <Text style={styles.stepText}>Verified local professional is assigned & arrives with tools</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <Text style={styles.stepText}>Inspect work & pay safely upon completion</Text>
          </View>
        </View>

        <SupportBanner serviceName={fullService.name} compact />
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>Estimated Rate</Text>
          {calcLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.priceValue}>
              {isComingSoon ? 'Unavailable' : `₹${finalPrice}`}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.bookButton, isComingSoon && { backgroundColor: colors.textLight }]}
          onPress={handleProceed}
          disabled={isComingSoon}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>
            {isComingSoon ? 'Coming Soon' : 'Proceed to Booking'}
          </Text>
          {!isComingSoon && <ChevronRight size={18} color="#ffffff" />}
        </TouchableOpacity>
      </View>
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 12,
  },
  descText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  durationText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  comingSoonBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  comingSoonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warningText,
  },
  comingSoonDesc: {
    fontSize: 12,
    color: colors.warningText,
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  vehicleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  vehicleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vehicleBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  variantsList: {
    gap: 8,
  },
  variantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
  },
  variantItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radioWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.primary,
  },
  variantName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  variantDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  variantPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  addonTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addonSub: {
    fontSize: 10,
    color: colors.textMuted,
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
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceCol: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bookButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
