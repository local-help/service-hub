import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { User, Phone, Mail, MapPin, Plus, LogOut, CheckCircle, Shield } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';
import { apiRequest } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';

interface Props {
  onLogout: () => void;
}

export const ProfileScreen: React.FC<Props> = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrLine, setAddrLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Prayagraj');
  const [pincode, setPincode] = useState('211001');

  const fetchAddresses = async () => {
    try {
      const data = await apiRequest<{ addresses: Address[] } | Address[]>('/addresses');
      const list = Array.isArray(data) ? data : (data as any).addresses || [];
      setAddresses(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = async () => {
    if (!addrLine.trim()) {
      Alert.alert('Required', 'Address line is required.');
      return;
    }
    try {
      await apiRequest('/addresses', {
        method: 'POST',
        body: JSON.stringify({
          address: {
            address_line: addrLine,
            landmark: landmark || null,
            city,
            postal_code: pincode,
            state: 'Uttar Pradesh',
            is_default: addresses.length === 0,
          }
        })
      });
      setShowAddAddr(false);
      setAddrLine('');
      setLandmark('');
      fetchAddresses();
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to save address');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            onLogout();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Card */}
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
          <Text style={styles.userRole}>
            {user?.role.toUpperCase()} • Prayagraj
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Phone size={16} color="#64748b" />
            <Text style={styles.infoText}>{user?.phone || 'No phone'}</Text>
            {user?.phone_verified && (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={12} color="#16a34a" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          {user?.email && (
            <View style={styles.infoRow}>
              <Mail size={16} color="#64748b" />
              <Text style={styles.infoText}>{user.email}</Text>
            </View>
          )}
        </View>

        {/* Addresses */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Saved Service Addresses</Text>
            {!showAddAddr && (
              <TouchableOpacity onPress={() => setShowAddAddr(true)} style={styles.addBtn}>
                <Plus size={14} color="#2563eb" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {showAddAddr && (
            <View style={styles.addForm}>
              <TextInput
                placeholder="Street / House No *"
                placeholderTextColor="#94a3b8"
                value={addrLine}
                onChangeText={setAddrLine}
                style={styles.input}
              />
              <TextInput
                placeholder="Landmark (Optional)"
                placeholderTextColor="#94a3b8"
                value={landmark}
                onChangeText={setLandmark}
                style={styles.input}
              />
              <View style={styles.row}>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  style={[styles.input, { flex: 1 }]}
                />
                <TextInput
                  value={pincode}
                  onChangeText={setPincode}
                  style={[styles.input, { width: 100 }]}
                />
              </View>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.cancelFormBtn}
                  onPress={() => setShowAddAddr(false)}
                >
                  <Text style={styles.cancelFormText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveFormBtn}
                  onPress={handleAddAddress}
                >
                  <Text style={styles.saveFormText}>Save Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {addresses.length === 0 && !showAddAddr ? (
            <Text style={styles.emptyText}>No addresses saved yet.</Text>
          ) : (
            <View style={styles.addressList}>
              {addresses.map((a) => (
                <View key={a.id} style={styles.addressItem}>
                  <MapPin size={16} color="#2563eb" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressLine}>{a.address_line}</Text>
                    <Text style={styles.addressSub}>{a.city} - {a.postal_code}</Text>
                  </View>
                  {a.is_default && (
                    <View style={styles.defaultPill}>
                      <Text style={styles.defaultPillText}>Default</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Support Banner */}
        <SupportBanner compact />

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={16} color="#dc2626" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563eb',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  userRole: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  addressList: {
    gap: 8,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  defaultPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  addForm: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelFormBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  cancelFormText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  saveFormBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  saveFormText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 40,
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
});

