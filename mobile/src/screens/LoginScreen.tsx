import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView 
} from 'react-native';
import { Phone, Lock, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onSuccess: () => void;
  onGoToRegister: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onSuccess, onGoToRegister }) => {
  const { sendOtp, verifyOtp, loginWithPassword } = useAuth();

  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Password fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      Alert.alert('Phone Required', 'Please enter your phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      setOtpSent(true);
      setCooldown(res.cooldown || 30);
      Alert.alert('OTP Sent', 'Use OTP: 123456 in local development');
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('OTP Required', 'Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(phone, otp);
      onSuccess();
    } catch (err: any) {
      Alert.alert('Verification Failed', err.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!loginEmail.trim() || !loginPass.trim()) {
      Alert.alert('Required', 'Please enter your email/phone and password.');
      return;
    }
    setLoading(true);
    try {
      await loginWithPassword(loginEmail, loginPass);
      onSuccess();
    } catch (err: any) {
      Alert.alert('Login Failed', err.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = async (role: 'customer' | 'admin') => {
    if (role === 'customer') {
      setMode('otp');
      setPhone('+919876543210');
      setOtp('123456');
      setOtpSent(true);
    } else {
      setMode('password');
      setLoginEmail('admin@localhelp.in');
      setLoginPass('password123');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>LH</Text>
          </View>
          <Text style={styles.title}>Welcome to LocalHelp</Text>
          <Text style={styles.subtitle}>
            Book verified local home services with central customer care support.
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'otp' && styles.activeTab]}
            onPress={() => setMode('otp')}
          >
            <Text style={[styles.tabText, mode === 'otp' && styles.activeTabText]}>
              Mobile OTP
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'password' && styles.activeTab]}
            onPress={() => setMode('password')}
          >
            <Text style={[styles.tabText, mode === 'password' && styles.activeTabText]}>
              Password
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'otp' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Mobile Phone Number</Text>
            <TextInput
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              placeholderTextColor="#94a3b8"
              value={phone}
              onChangeText={setPhone}
              editable={!otpSent}
              style={styles.input}
            />

            {!otpSent ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Verification OTP</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.label}>Enter 6-Digit OTP</Text>
                <TextInput
                  keyboardType="number-pad"
                  placeholder="123456"
                  placeholderTextColor="#94a3b8"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                  style={[styles.input, styles.otpInput]}
                />
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.changePhone}
                  onPress={() => { setOtpSent(false); setOtp(''); }}
                >
                  <Text style={styles.changePhoneText}>Change phone number</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Email or Phone</Text>
            <TextInput
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="customer@example.com"
              placeholderTextColor="#94a3b8"
              value={loginEmail}
              onChangeText={setLoginEmail}
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={loginPass}
              onChangeText={setLoginPass}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handlePasswordLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Demo Credentials */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Quick Demo Credentials</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => handleFillDemo('customer')}
            >
              <Text style={styles.demoBtnText}>Fill Customer (OTP)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => handleFillDemo('admin')}
            >
              <Text style={styles.demoBtnText}>Fill Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Prompt */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to LocalHelp?</Text>
          <TouchableOpacity onPress={onGoToRegister}>
            <Text style={styles.footerLink}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 8,
  },
  otpInput: {
    fontFamily: 'monospace',
    letterSpacing: 6,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  changePhone: {
    alignItems: 'center',
    marginTop: 12,
  },
  changePhoneText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  demoSection: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginTop: 28,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 13,
    color: '#64748b',
  },
  footerLink: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '700',
  },
});

