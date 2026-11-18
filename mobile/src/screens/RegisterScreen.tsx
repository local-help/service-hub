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
  Image,
} from 'react-native';
import { User, Mail, Phone, Lock, Eye, EyeOff, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

interface Props {
  onSuccess: () => void;
  onGoToLogin: () => void;
  onCancel?: () => void;
}

export const RegisterScreen: React.FC<Props> = ({ onSuccess, onGoToLogin, onCancel }) => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!email.trim() && (!phone.trim() || phone.trim() === '+91')) {
      Alert.alert('Required', 'Please enter your email address or phone number.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords mismatch', 'Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() !== '+91' ? phone.trim() : '',
        password,
      });
      Alert.alert('Welcome!', 'Your account has been created successfully.');
      onSuccess();
    } catch (err: any) {
      Alert.alert('Registration Failed', err.error || err.message || 'Unable to register');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.title}>Join LocalHelp</Text>
          <Text style={styles.subtitle}>
            Create your account to book verified home services with central customer care in Prayagraj.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputWrapper}>
            <User size={18} color={colors.textLight} />
            <TextInput
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Email Address *</Text>
          <View style={styles.inputWrapper}>
            <Mail size={18} color={colors.textLight} />
            <TextInput
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@example.com"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Mobile Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Phone size={18} color={colors.textLight} />
            <TextInput
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.textLight}
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Password (Min 8 Characters) *</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color={colors.textLight} />
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password *</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color={colors.textLight} />
            <TextInput
              secureTextEntry={!showConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textLight}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
              {showConfirmPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>

          <View style={styles.trustRow}>
            <ShieldCheck size={16} color={colors.primary} />
            <Text style={styles.trustText}>
              Verified local professionals • Transparent rates • Dedicated care
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Social / Google Sign-Up */}
          <View style={styles.socialSection}>
            <View style={styles.orDividerRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR JOIN WITH</Text>
              <View style={styles.orLine} />
            </View>
            <GoogleSignInButton
              mode="signup"
              onSuccess={() => onSuccess()}
            />
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={onGoToLogin}>
            <Text style={styles.footerLink}>Sign in</Text>
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
  form: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
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
    marginBottom: 4,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  eyeBtn: {
    padding: 6,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  trustText: {
    fontSize: 11,
    color: colors.primaryDark,
    flex: 1,
    fontWeight: '500',
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
