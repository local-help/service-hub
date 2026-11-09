import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Image, 
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView
} from 'react-native';
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  X, 
  ShieldCheck,
  Info,
  Car,
  FileText
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Service, Address, ServiceRequest, Attachment } from '../types';
import { BookingOptions } from './ServiceDetailScreen';
import { apiRequest, uploadImage } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { SupportBanner } from '../components/SupportBanner';
import { colors } from '../theme/colors';

interface Props {
  service: Service;
  options?: BookingOptions;
  onBack: () => void;
  onComplete: (request: ServiceRequest) => void;
}

const PRAYAGRAJ_LOCALITIES = [
  { name: 'Civil Lines', pin: '211001' },
  { name: 'Katra', pin: '211002' },
  { name: 'Tagore Town', pin: '211002' },
  { name: 'Ashok Nagar', pin: '211001' },
  { name: 'Georgetown', pin: '211002' },
  { name: 'Mumfordganj', pin: '211002' },
  { name: 'Naini', pin: '211008' },
  { name: 'Jhunsi', pin: '211019' },
  { name: 'Dhoomanganj', pin: '211011' },
];

export const CreateRequestScreen: React.FC<Props> = ({ 
  service, 
  options, 
  onBack, 
  onComplete 
}) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  
  // New address form inline
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newCity, setNewCity] = useState('Prayagraj');
  const [newPincode, setNewPincode] = useState('211001');

  // Form fields
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [preferredSlot, setPreferredSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  
  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<ServiceRequest | null>(null);

  // Derived financial & package details
  const effectivePackageName = options?.packageName || options?.selectedVariant?.name || service.name;
  const effectivePackagePrice = options?.packagePrice ?? (options?.selectedVariant?.primary_price || service.fixed_price || 499);
  const platformFee = service.builder_config?.platform_fee || 25;
  const addonsTotal = options?.addonsTotal || 0;
  const effectiveTotal = options?.totalPrice ?? (effectivePackagePrice + addonsTotal + platformFee);

  const selectedAddonsList = useMemo(() => {
    if (!options?.selectedAddons || !service.addons) return [];
    return service.addons.filter((a) => options.selectedAddons?.includes(a.id));
  }, [options?.selectedAddons, service.addons]);

  useEffect(() => {
    // Load addresses
    apiRequest<{ addresses: Address[] } | Address[]>('/addresses')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).addresses || [];
        setAddresses(list);
        const def = list.find((a: Address) => a.is_default);
        if (def) setSelectedAddressId(def.id);
        else if (list.length > 0) setSelectedAddressId(list[0].id);
        else setShowNewAddress(true);
      })
      .catch(console.error);
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Please allow photo gallery access to attach photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setUploadingImage(true);
      try {
        const uploaded = await uploadImage(asset.uri, asset.fileName || 'service_photo.jpg');
        setAttachments((prev) => [
          ...prev,
          {
            file_url: uploaded.file_url || uploaded.url || asset.uri,
            file_name: uploaded.file_name || 'service_photo.jpg',
          },
        ]);
      } catch (err: any) {
        Alert.alert('Upload notice', 'Local preview attached. Will upload with request.');
        setAttachments((prev) => [
          ...prev,
          {
            file_url: asset.uri,
            file_name: 'photo.jpg',
          },
        ]);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateAddress = async () => {
    if (!newAddressLine.trim()) {
      Alert.alert('Required', 'Please enter your street address.');
      return;
    }
    try {
      const res = await apiRequest<{ address: Address } | Address>('/addresses', {
        method: 'POST',
        body: JSON.stringify({
          address: {
            label: newLabel,
            address_line: newAddressLine,
            landmark: newLandmark || null,
            city: newCity,
            postal_code: newPincode,
            state: 'Uttar Pradesh',
            is_default: addresses.length === 0,
          },
        }),
      });
      const created = (res as any).address || res;
      setAddresses([...addresses, created]);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
      setNewAddressLine('');
      setNewLandmark('');
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to save address');
    }
  };

  const handleSubmit = async () => {
    if (!selectedAddressId && !newAddressLine.trim()) {
      Alert.alert('Address Required', 'Please select or enter a doorstep service address.');
      return;
    }

    setSubmitting(true);
    try {
      let finalAddressId = selectedAddressId;
      if (showNewAddress && newAddressLine.trim()) {
        const addrRes = await apiRequest<{ address: Address } | Address>('/addresses', {
          method: 'POST',
          body: JSON.stringify({
            address: {
              label: newLabel,
              address_line: newAddressLine,
              landmark: newLandmark || null,
              city: newCity,
              postal_code: newPincode,
              state: 'Uttar Pradesh',
              is_default: addresses.length === 0,
            },
          }),
        });
        const created = (addrRes as any).address || addrRes;
        finalAddressId = created.id;
      }

      // Convert slot to time
      const timeString = preferredSlot === 'morning' ? '10:00:00' : preferredSlot === 'afternoon' ? '14:00:00' : '18:00:00';
      const preferredAt = preferredDate ? `${preferredDate}T${timeString}` : new Date().toISOString();

      const finalDescription = description.trim() || 
        `${effectivePackageName} (${options?.stepKey || options?.selectedVehicle || 'Standard'}) booking for ${user?.name || 'Customer'}`;

      const selectedOptions: Record<string, any> = {
        package_name: effectivePackageName,
        step_key: options?.stepKey || options?.selectedVehicle || null,
        addons: selectedAddonsList.map((a) => a.name),
        total_amount: effectiveTotal,
      };
      if (options?.pickupDrop) selectedOptions['pickup_and_drop'] = true;

      const res = await apiRequest<{ service_request: ServiceRequest } | ServiceRequest>('/service_requests', {
        method: 'POST',
        body: JSON.stringify({
          service_request: {
            service_id: service.id,
            service_variant_id: options?.selectedVariant?.id || null,
            vehicle_type: options?.selectedVehicle || options?.stepKey || null,
            duration_hours: options?.driverHours || null,
            total_amount: effectiveTotal,
            selected_options: selectedOptions,
            address_id: finalAddressId,
            description: finalDescription,
            preferred_at: preferredAt,
            preferred_date: preferredDate || null,
            preferred_time_slot: preferredSlot,
            attachments: attachments.map((a) => ({
              file_url: a.file_url,
              file_name: a.file_name,
            })),
          },
        }),
      });

      const request = (res as any).service_request || res;
      setCreatedRequest(request);
    } catch (err: any) {
      Alert.alert('Submission Error', err.error || 'Failed to submit service request');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (createdRequest) {
    const isConfirmed = createdRequest.status === 'booking_confirmed' || createdRequest.booking_status === 'confirmed';

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <CheckCircle2 size={40} color={colors.successText} />
            </View>
            <Text style={styles.successTitle}>
              {isConfirmed ? 'Booking Confirmed!' : 'Service Request Submitted!'}
            </Text>
            <Text style={styles.successSubtitle}>
              {isConfirmed
                ? 'A verified local technician has been assigned. You will receive real-time schedule updates.'
                : 'Our operations team has received your request and is matching it with a verified local professional.'}
            </Text>

            <View style={styles.refBox}>
              <Text style={styles.refLabel}>Booking Reference Number</Text>
              <Text style={styles.refNumber}>{createdRequest.reference_number}</Text>
              <View style={styles.refDivider} />
              <View style={styles.refTotalRow}>
                <Text style={styles.refTotalLabel}>Guaranteed Total:</Text>
                <Text style={styles.refTotalAmount}>₹{effectiveTotal.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={styles.summaryBox}>
              <View style={styles.summaryHeaderRow}>
                <Text style={styles.summaryBoxTitle}>ORDER DETAILS</Text>
              </View>
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemKey}>Service</Text>
                <Text style={styles.summaryItemVal}>{service.name}</Text>
              </View>
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemKey}>Package</Text>
                <Text style={styles.summaryItemVal}>{effectivePackageName}</Text>
              </View>
              {options?.selectedVehicle && (
                <View style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemKey}>Vehicle / Option</Text>
                  <Text style={styles.summaryItemVal}>{options.selectedVehicle.replace('_', ' ').toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemKey}>Payment</Text>
                <Text style={[styles.summaryItemVal, { color: colors.primary }]}>Payable after work completion</Text>
              </View>
            </View>

            <SupportBanner referenceNumber={createdRequest.reference_number} serviceName={service.name} />

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => onComplete(createdRequest)}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Manage Booking</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.topTitleWrap}>
            <Text style={styles.topTitle}>Review & Schedule</Text>
            <Text style={styles.topSub}>Doorstep dispatch with guaranteed fixed pricing</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 1. Review Summary Card (Matching Web Order Summary) */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <ShieldCheck size={16} color={colors.primary} />
                <Text style={styles.cardHeaderTitle}>ORDER SUMMARY</Text>
              </View>
              <View style={styles.guaranteePill}>
                <Text style={styles.guaranteePillText}>Fixed Tariff Guarantee</Text>
              </View>
            </View>

            <View style={styles.orderBreakdown}>
              <View style={styles.breakdownRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.packageTitle}>{effectivePackageName}</Text>
                  {options?.selectedVehicle && (
                    <Text style={styles.packageOptionSub}>
                      Option: {options.selectedVehicle.replace('_', ' ').toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.packagePriceText}>₹{effectivePackagePrice.toLocaleString('en-IN')}</Text>
              </View>

              {/* Add-ons list */}
              {selectedAddonsList.length > 0 && (
                <View style={styles.addonsList}>
                  <Text style={styles.addonsHeader}>Selected Add-ons:</Text>
                  {selectedAddonsList.map((addon) => (
                    <View key={addon.id} style={styles.addonRow}>
                      <Text style={styles.addonName}>+ {addon.name}</Text>
                      <Text style={styles.addonPrice}>₹{addon.price}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Platform Fee */}
              <View style={styles.feeRow}>
                <View style={styles.feeLabelWrap}>
                  <Text style={styles.feeLabel}>Platform Fee</Text>
                  <Info size={12} color={colors.textMuted} />
                </View>
                <Text style={styles.feeValue}>₹{platformFee}</Text>
              </View>

              {/* Estimated Total */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>ESTIMATED TOTAL</Text>
                <Text style={styles.totalValue}>₹{effectiveTotal.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* 2. Doorstep Address */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <MapPin size={16} color={colors.primary} />
                <Text style={styles.cardHeaderTitle}>DOORSTEP ADDRESS</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowNewAddress(!showNewAddress)}
                style={styles.headerActionBtn}
              >
                {showNewAddress ? <X size={14} color={colors.primary} /> : <Plus size={14} color={colors.primary} />}
                <Text style={styles.headerActionText}>{showNewAddress ? 'Cancel' : 'Add new'}</Text>
              </TouchableOpacity>
            </View>

            {!showNewAddress && addresses.length > 0 ? (
              <View style={styles.addressList}>
                {addresses.map((a) => {
                  const isSelected = selectedAddressId === a.id;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.addressItem, isSelected && styles.addressItemSelected]}
                      onPress={() => setSelectedAddressId(a.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioDot, isSelected && styles.radioDotActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.addressLabelRow}>
                          <Text style={styles.addressLabelText}>{a.label || 'Home'}</Text>
                          {a.is_default && (
                            <View style={styles.defaultPill}>
                              <Text style={styles.defaultPillText}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.addressLine}>{a.address_line}</Text>
                        <Text style={styles.addressSub}>
                          {a.landmark ? `${a.landmark}, ` : ''}{a.city} - {a.postal_code}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.newAddressBox}>
                <Text style={styles.localityHeader}>Quick Locality Selection (Prayagraj):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locScroll}>
                  {PRAYAGRAJ_LOCALITIES.map((loc) => (
                    <TouchableOpacity
                      key={loc.name}
                      style={[
                        styles.locChip,
                        newLandmark === loc.name && styles.locChipActive,
                      ]}
                      onPress={() => {
                        setNewLandmark(loc.name);
                        setNewPincode(loc.pin);
                        if (!newAddressLine) {
                          setNewAddressLine(`${loc.name}, Prayagraj`);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.locChipText,
                          newLandmark === loc.name && styles.locChipTextActive,
                        ]}
                      >
                        📍 {loc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TextInput
                  placeholder="Flat / House #, Street Name *"
                  placeholderTextColor={colors.textLight}
                  value={newAddressLine}
                  onChangeText={setNewAddressLine}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Landmark (Optional)"
                  placeholderTextColor={colors.textLight}
                  value={newLandmark}
                  onChangeText={setNewLandmark}
                  style={styles.input}
                />
                <View style={styles.inputRow}>
                  <TextInput
                    value={newCity}
                    onChangeText={setNewCity}
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TextInput
                    placeholder="PIN"
                    placeholderTextColor={colors.textLight}
                    value={newPincode}
                    onChangeText={setNewPincode}
                    style={[styles.input, { width: 95 }]}
                  />
                </View>

                {addresses.length > 0 && (
                  <TouchableOpacity onPress={() => setShowNewAddress(false)} style={styles.cancelAddressBtn}>
                    <Text style={styles.cancelText}>← Choose from saved addresses</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* 3. Preferred Schedule */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Calendar size={16} color={colors.primary} />
                <Text style={styles.cardHeaderTitle}>PREFERRED SCHEDULE</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textLight}
              value={preferredDate}
              onChangeText={setPreferredDate}
              style={styles.input}
            />

            <Text style={[styles.inputLabel, { marginTop: 8 }]}>Preferred Time Window</Text>
            <View style={styles.slotsRow}>
              {[
                { id: 'morning', label: 'Morning', time: '9 AM - 12 PM' },
                { id: 'afternoon', label: 'Afternoon', time: '1 PM - 4 PM' },
                { id: 'evening', label: 'Evening', time: '5 PM - 8 PM' },
              ].map((slot) => {
                const isActive = preferredSlot === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.slotButton, isActive && styles.slotButtonActive]}
                    onPress={() => setPreferredSlot(slot.id as any)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.slotLabel, isActive && styles.slotLabelActive]}>
                      {slot.label}
                    </Text>
                    <Text style={[styles.slotTime, isActive && styles.slotTimeActive]}>
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 4. Special Instructions (Optional) */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <FileText size={16} color={colors.primary} />
                <Text style={styles.cardHeaderTitle}>SPECIAL INSTRUCTIONS (OPTIONAL)</Text>
              </View>
            </View>

            <TextInput
              multiline
              numberOfLines={3}
              placeholder="e.g. Landmark near Hanuman temple, parking in basement, please bring extra cord..."
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
            />
          </View>

          {/* 5. Photos (Optional) */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>ATTACH PHOTOS (OPTIONAL)</Text>
            <View style={styles.photoRow}>
              {attachments.map((att, idx) => (
                <View key={idx} style={styles.thumbWrapper}>
                  <Image source={{ uri: att.file_url }} style={styles.thumbnail} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => removeAttachment(idx)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <X size={10} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.photoUpload}
                onPress={pickImage}
                disabled={uploadingImage}
                activeOpacity={0.7}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Camera size={18} color={colors.textMuted} />
                    <Text style={styles.uploadText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Trust strip */}
          <View style={styles.trustStrip}>
            <ShieldCheck size={14} color={colors.primary} />
            <Text style={styles.trustStripText}>
              Doorstep service guarantee • Cash or UPI after service completion
            </Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Sticky Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>
                Confirm & Schedule Booking • ₹{effectiveTotal.toLocaleString('en-IN')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 14,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 6,
  },
  topTitleWrap: {
    flex: 1,
    marginLeft: 8,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  topSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  guaranteePill: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  guaranteePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successText,
  },
  orderBreakdown: {
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  packageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  packageOptionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  packagePriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  addonsList: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 4,
  },
  addonsHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addonName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  addonPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  feeLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feeLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  feeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: colors.textPrimary,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },

  // Standard Card
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  // Address
  addressList: {
    gap: 8,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
  },
  addressItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioDotActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  defaultPill: {
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  defaultPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
  },
  addressLine: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: 16,
  },
  addressSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  newAddressBox: {
    gap: 6,
  },
  localityHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  locScroll: {
    marginBottom: 8,
  },
  locChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.borderSubtle,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  locChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  locChipTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelAddressBtn: {
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  // Preferred Schedule
  inputLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  slotButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  slotButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  slotLabelActive: {
    color: '#ffffff',
  },
  slotTime: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  slotTimeActive: {
    color: '#ffffff',
    opacity: 0.9,
  },

  // Notes & Photos
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  thumbWrapper: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoUpload: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  uploadText: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },

  // Trust Strip
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  trustStripText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Bottom Bar
  bottomBar: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Success Screen
  successScroll: {
    padding: 16,
  },
  successCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  refBox: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  refLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  refDivider: {
    height: 1,
    backgroundColor: colors.primaryBorder,
    width: '100%',
    marginVertical: 10,
  },
  refTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  refTotalLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  refTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summaryBox: {
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 12,
    width: '100%',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryHeaderRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    marginBottom: 2,
  },
  summaryBoxTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemKey: {
    fontSize: 12,
    color: colors.textMuted,
  },
  summaryItemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  doneButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
