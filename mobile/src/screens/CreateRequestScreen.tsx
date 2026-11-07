import React, { useEffect, useState } from 'react';
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
  Platform 
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
  Car 
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
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('morning'); // 'morning' | 'afternoon' | 'evening'
  
  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<ServiceRequest | null>(null);

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

    // Default preferred date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPreferredDate(tomorrow.toISOString().split('T')[0]);
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
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please briefly describe your service requirements.');
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

      const selectedOptions: Record<string, any> = {};
      if (options?.pickupDrop) selectedOptions['pickup_and_drop'] = true;

      const res = await apiRequest<{ service_request: ServiceRequest } | ServiceRequest>('/service_requests', {
        method: 'POST',
        body: JSON.stringify({
          service_request: {
            service_id: service.id,
            service_variant_id: options?.selectedVariant?.id || null,
            vehicle_type: options?.selectedVehicle || null,
            duration_hours: options?.driverHours || null,
            selected_options: selectedOptions,
            address_id: finalAddressId,
            description: description.trim(),
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.successCard}>
          <View style={styles.successIconWrap}>
            <CheckCircle2 size={44} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>
            {isConfirmed ? 'Booking Confirmed!' : 'Service Request Submitted!'}
          </Text>
          <Text style={styles.successSubtitle}>
            {isConfirmed
              ? 'A verified local professional has been assigned. You will receive real-time schedule updates.'
              : 'Our central care team has received your request and is matching it with a verified provider.'}
          </Text>

          <View style={styles.refBox}>
            <Text style={styles.refLabel}>Booking Reference</Text>
            <Text style={styles.refNumber}>{createdRequest.reference_number}</Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryItem}>
              • Service: <Text style={styles.bold}>{service.name}</Text>
            </Text>
            {options?.selectedVariant && (
              <Text style={styles.summaryItem}>
                • Package: <Text style={styles.bold}>{options.selectedVariant.name}</Text>
              </Text>
            )}
            <Text style={styles.summaryItem}>
              • Status: <Text style={styles.bold}>{createdRequest.status.replace('_', ' ').toUpperCase()}</Text>
            </Text>
            {options?.totalPrice && (
              <Text style={styles.summaryItem}>
                • Amount: <Text style={styles.bold}>₹{options.totalPrice}</Text> (Payable after work completion)
              </Text>
            )}
          </View>

          <SupportBanner referenceNumber={createdRequest.reference_number} serviceName={service.name} />

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => onComplete(createdRequest)}
          >
            <Text style={styles.doneButtonText}>View My Bookings & Requests</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Book {service.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Package Summary Banner */}
        <View style={styles.serviceBanner}>
          <View style={styles.bannerHeader}>
            <Text style={styles.serviceBannerName}>{service.name}</Text>
            {options?.totalPrice && (
              <Text style={styles.serviceBannerPrice}>₹{options.totalPrice}</Text>
            )}
          </View>
          {options?.selectedVariant && (
            <Text style={styles.selectedVariantText}>
              Package: {options.selectedVariant.name}
            </Text>
          )}
          {options?.selectedVehicle && (
            <Text style={styles.selectedOptionText}>
              🚗 Vehicle: {options.selectedVehicle.toUpperCase()}
            </Text>
          )}
          {options?.driverHours && (
            <Text style={styles.selectedOptionText}>
              ⏱ Shift: {options.driverHours} Hours
            </Text>
          )}
        </View>

        {/* Step 1: Address Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.sectionLabel}>Doorstep Address</Text>
          </View>

          {!showNewAddress && addresses.length > 0 ? (
            <View style={styles.addressList}>
              {addresses.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.addressItem, selectedAddressId === a.id && styles.addressItemSelected]}
                  onPress={() => setSelectedAddressId(a.id)}
                  activeOpacity={0.7}
                >
                  <MapPin size={16} color={selectedAddressId === a.id ? colors.primary : colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressLine}>{a.label ? `[${a.label}] ` : ''}{a.address_line}</Text>
                    <Text style={styles.addressSub}>{a.city} - {a.postal_code}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addAddressLink}
                onPress={() => setShowNewAddress(true)}
              >
                <Plus size={16} color={colors.primary} />
                <Text style={styles.addAddressLinkText}>Add New Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.newAddressBox}>
              <Text style={styles.localityHeader}>Quick Locality Selection (Prayagraj):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
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
              <View style={styles.row}>
                <TextInput
                  value={newCity}
                  onChangeText={setNewCity}
                  style={[styles.input, { flex: 1 }]}
                />
                <TextInput
                  placeholder="PIN"
                  value={newPincode}
                  onChangeText={setNewPincode}
                  style={[styles.input, { width: 90 }]}
                />
              </View>

              {addresses.length > 0 && (
                <TouchableOpacity onPress={() => setShowNewAddress(false)}>
                  <Text style={styles.cancelText}>Select from saved addresses</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Step 2: Preferred Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Calendar size={16} color={colors.primary} />
            <Text style={styles.sectionLabel}>Preferred Schedule</Text>
          </View>

          <Text style={styles.inputLabel}>Date (YYYY-MM-DD) *</Text>
          <TextInput
            placeholder="2026-11-07"
            placeholderTextColor={colors.textLight}
            value={preferredDate}
            onChangeText={setPreferredDate}
            style={styles.input}
          />

          <Text style={[styles.inputLabel, { marginTop: 10 }]}>Time Window *</Text>
          <View style={styles.slotsRow}>
            {[
              { id: 'morning', label: 'Morning\n9 AM - 12 PM' },
              { id: 'afternoon', label: 'Afternoon\n1 PM - 4 PM' },
              { id: 'evening', label: 'Evening\n5 PM - 8 PM' },
            ].map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotButton, preferredSlot === slot.id && styles.slotButtonActive]}
                onPress={() => setPreferredSlot(slot.id)}
              >
                <Text style={[styles.slotText, preferredSlot === slot.id && styles.slotTextActive]}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 3: Requirements Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Requirement Details *</Text>
          <TextInput
            multiline
            numberOfLines={3}
            placeholder="e.g. Tap leaking under the kitchen sink, parking in basement, electricity available..."
            placeholderTextColor={colors.textLight}
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.textArea]}
          />
        </View>

        {/* Step 4: Attach Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Attach Photos (Optional)</Text>
          <View style={styles.photoRow}>
            {attachments.map((att, idx) => (
              <View key={idx} style={styles.thumbWrapper}>
                <Image source={{ uri: att.file_url }} style={styles.thumbnail} />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => removeAttachment(idx)}
                >
                  <X size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.photoUpload}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Camera size={20} color={colors.textMuted} />
                  <Text style={styles.uploadText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {options?.totalPrice ? `Confirm Booking • ₹${options.totalPrice}` : 'Submit Booking Request'}
            </Text>
          )}
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    padding: 16,
  },
  serviceBanner: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceBannerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  serviceBannerPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  selectedVariantText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 4,
  },
  selectedOptionText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  addressList: {
    gap: 8,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
  },
  addressItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  addressLine: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addressSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  addAddressLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  addAddressLinkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  newAddressBox: {
    gap: 4,
  },
  localityHeader: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
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
  cancelText: {
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  slotButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  slotTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  thumbWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  thumbnail: {
    width: 64,
    height: 64,
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
    width: 64,
    height: 64,
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
  bottomBar: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  successCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  refBox: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 14,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
  },
  refLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 12,
    width: '100%',
    gap: 6,
    marginBottom: 16,
  },
  summaryItem: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  doneButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
