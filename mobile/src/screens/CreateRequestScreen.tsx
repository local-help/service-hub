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
  ActivityIndicator 
} from 'react-native';
import { ArrowLeft, Camera, CheckCircle2, MapPin, Calendar, Clock, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Service, Address, ServiceRequest } from '../types';
import { apiRequest } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { SupportBanner } from '../components/SupportBanner';

interface Props {
  service: Service;
  onBack: () => void;
  onComplete: (request: ServiceRequest) => void;
}

export const CreateRequestScreen: React.FC<Props> = ({ service, onBack, onComplete }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  
  // New address form inline if none exists
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newCity, setNewCity] = useState('Bengaluru');
  const [newPincode, setNewPincode] = useState('560034');

  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('morning');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Success Confirmation State
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
      Alert.alert('Permission Denied', 'Please allow camera roll access to attach photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0].uri]);
    }
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
            address_line: newAddressLine,
            landmark: newLandmark || null,
            city: newCity,
            postal_code: newPincode,
            state: 'Karnataka',
            is_default: addresses.length === 0,
          }
        })
      });
      const created = (res as any).address || res;
      setAddresses([...addresses, created]);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
      setNewAddressLine('');
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to save address');
    }
  };

  const handleSubmit = async () => {
    if (!selectedAddressId && !newAddressLine.trim()) {
      Alert.alert('Address Required', 'Please select or enter a service address.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please briefly describe your service requirement.');
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
              address_line: newAddressLine,
              landmark: newLandmark || null,
              city: newCity,
              postal_code: newPincode,
              state: 'Karnataka',
              is_default: addresses.length === 0,
            }
          })
        });
        const created = (addrRes as any).address || addrRes;
        finalAddressId = created.id;
      }

      const res = await apiRequest<{ service_request: ServiceRequest } | ServiceRequest>('/service_requests', {
        method: 'POST',
        body: JSON.stringify({
          service_request: {
            service_id: service.id,
            address_id: finalAddressId,
            description: description.trim(),
            preferred_date: preferredDate || null,
            preferred_time_slot: preferredSlot,
          }
        })
      });

      const request = (res as any).service_request || res;
      setCreatedRequest(request);
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to submit service request');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (createdRequest) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.successCard}>
          <View style={styles.successIconWrap}>
            <CheckCircle2 size={48} color="#16a34a" />
          </View>
          <Text style={styles.successTitle}>Service Request Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Your request has been received by our central care team.
          </Text>

          <View style={styles.refBox}>
            <Text style={styles.refLabel}>Request Reference Number</Text>
            <Text style={styles.refNumber}>{createdRequest.reference_number}</Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryItem}>• Service: <Text style={styles.bold}>{service.name}</Text></Text>
            <Text style={styles.summaryItem}>• Status: <Text style={styles.bold}>{createdRequest.status.replace('_', ' ').toUpperCase()}</Text></Text>
            <Text style={styles.summaryItem}>• What's Next: An admin is reviewing your request and contacting a verified local provider for availability and quote.</Text>
          </View>

          <SupportBanner referenceNumber={createdRequest.reference_number} serviceName={service.name} />

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => onComplete(createdRequest)}
          >
            <Text style={styles.doneButtonText}>View My Requests</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Request {service.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Service Summary */}
        <View style={styles.serviceBanner}>
          <Text style={styles.serviceBannerName}>{service.name}</Text>
          <Text style={styles.serviceBannerPrice}>
            {service.pricing_model === 'fixed' ? `₹${service.base_price} (Fixed Rate)` : 'Requires Local Provider Quotation'}
          </Text>
        </View>

        {/* Address Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Service Address</Text>
          {!showNewAddress && addresses.length > 0 ? (
            <View style={styles.addressList}>
              {addresses.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.addressItem, selectedAddressId === a.id && styles.addressItemSelected]}
                  onPress={() => setSelectedAddressId(a.id)}
                >
                  <MapPin size={18} color={selectedAddressId === a.id ? '#2563eb' : '#64748b'} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressLine}>{a.address_line}</Text>
                    <Text style={styles.addressSub}>{a.city} - {a.postal_code}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addAddressLink}
                onPress={() => setShowNewAddress(true)}
              >
                <Plus size={16} color="#2563eb" />
                <Text style={styles.addAddressLinkText}>Add New Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.newAddressBox}>
              <TextInput
                placeholder="Flat / House #, Street Name *"
                placeholderTextColor="#94a3b8"
                value={newAddressLine}
                onChangeText={setNewAddressLine}
                style={styles.input}
              />
              <TextInput
                placeholder="Landmark (Optional)"
                placeholderTextColor="#94a3b8"
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
                  placeholder="Pincode"
                  value={newPincode}
                  onChangeText={setNewPincode}
                  style={[styles.input, { width: 100 }]}
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

        {/* Requirement Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Describe Your Requirement *</Text>
          <TextInput
            multiline
            numberOfLines={4}
            placeholder="e.g. Tap leaking under the kitchen sink, need washer replacement or tap repair..."
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.textArea]}
          />
        </View>

        {/* Preferred Date & Time Slot */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferred Date (YYYY-MM-DD)</Text>
          <TextInput
            placeholder="2026-11-05"
            placeholderTextColor="#94a3b8"
            value={preferredDate}
            onChangeText={setPreferredDate}
            style={styles.input}
          />

          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Preferred Time Slot</Text>
          <View style={styles.slotsRow}>
            {['morning', 'afternoon', 'evening'].map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.slotButton, preferredSlot === slot && styles.slotButtonActive]}
                onPress={() => setPreferredSlot(slot)}
              >
                <Text style={[styles.slotText, preferredSlot === slot && styles.slotTextActive]}>
                  {slot.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Attach Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Attach Photos (Optional)</Text>
          <View style={styles.photoRow}>
            {images.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={styles.thumbnail} />
            ))}
            <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
              <Camera size={22} color="#64748b" />
              <Text style={styles.uploadText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Service Request</Text>
          )}
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  content: {
    padding: 16,
  },
  serviceBanner: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  serviceBannerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  serviceBannerPrice: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
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
    marginBottom: 8,
  },
  textArea: {
    height: 90,
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
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  addressItemSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  addressLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  addressSub: {
    fontSize: 11,
    color: '#64748b',
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
    color: '#2563eb',
    fontWeight: '600',
  },
  newAddressBox: {
    gap: 4,
  },
  cancelText: {
    fontSize: 12,
    color: '#64748b',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  slotButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  slotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  slotTextActive: {
    color: '#ffffff',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  photoUpload: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  uploadText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 14,
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
    borderColor: '#e2e8f0',
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  refBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  refLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e3a8a',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    width: '100%',
    gap: 6,
    marginBottom: 16,
  },
  summaryItem: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#0f172a',
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
