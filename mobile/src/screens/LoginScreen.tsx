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
  ScrollView,
  Image 
} from 'react-native';
import { Phone, Lock, Sparkles, CheckCircle2, Mail, ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

interface Props {
  onSuccess: () => void;
  onGoToRegister: () => void;
  onCancel?: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onSuccess, onGoToRegister, onCancel }) => {
  const { sendOtp, verifyOtp, loginWithPassword } = useAuth();

  const [mode, setMode] = useState<'otp' | 'password'>('password');
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Password fields (Default to customer demo)
  const [loginEmail, setLoginEmail] = useState('customer@example.com');
  const [loginPass, setLoginPass] = useState('Customer@123456');

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

  const setDemoAccount = (email: string, pass: string) => {
    setMode('password');
    setLoginEmail(email);
    setLoginPass(pass);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {onCancel && (
        <View style={styles.topCancelBar}>
          <TouchableOpacity onPress={onCancel} style={styles.topCancelBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={20} color={colors.textPrimary} />
            <Text style={styles.topCancelText}>Browse as Guest</Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome to LocalHelp</Text>
          <Text style={styles.subtitle}>
            Book verified local home services with central customer care support in Prayagraj.
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'password' && styles.activeTab]}
            onPress={() => setMode('password')}
          >
            <Text style={[styles.tabText, mode === 'password' && styles.activeTabText]}>
              Password
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'otp' && styles.activeTab]}
            onPress={() => setMode('otp')}
          >
            <Text style={[styles.tabText, mode === 'otp' && styles.activeTabText]}>
              Mobile OTP
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'password' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Email or Phone</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={colors.textLight} />
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="customer@example.com"
                placeholderTextColor={colors.textLight}
                value={loginEmail}
                onChangeText={setLoginEmail}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={colors.textLight} />
              <TextInput
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.textLight}
                value={loginPass}
                onChangeText={setLoginPass}
                style={styles.input}
              />
            </View>

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
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Mobile Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={18} color={colors.textLight} />
              <TextInput
                keyboardType="phone-pad"
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textLight}
                value={phone}
                onChangeText={setPhone}
                editable={!otpSent}
                style={styles.input}
              />
            </View>

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
                  placeholderTextColor={colors.textLight}
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                  style={[styles.inputSingle, styles.otpInput]}
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
        )}

        {/* Social / Google Sign-In */}
        <View style={styles.socialSection}>
          <View style={styles.orDividerRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR CONTINUE WITH</Text>
            <View style={styles.orLine} />
          </View>
          <GoogleSignInButton
            mode="signin"
            onSuccess={() => onSuccess()}
          />
        </View>

        {/* Quick Demo Logins Box */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>One-Click Demo Credentials</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => setDemoAccount('customer@example.com', 'Customer@123456')}
            >
              <Text style={styles.demoBtnText}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => setDemoAccount('apex_provider@localhelp.in', 'Provider@123456')}
            >
              <Text style={styles.demoBtnText}>Provider</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => setDemoAccount('admin@localhelp.in', 'Admin@123456')}
            >
              <Text style={styles.demoBtnText}>Admin</Text>
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
  topCancelBar: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  topCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  scroll: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.borderSubtle,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
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
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  form: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 6,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputSingle: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  otpInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 6,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
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
    color: colors.primary,
    fontWeight: '600',
  },
  socialSection: {
    marginTop: 20,
    marginBottom: 4,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 0.8,
  },
  demoSection: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderColor: colors.border,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
});
