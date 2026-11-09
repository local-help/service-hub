import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import {
  User,
  ShieldCheck,
  Eye,
  LogOut,
  Building,
  Mail,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';

export const AdminMoreScreen: React.FC = () => {
  const { user, setViewMode, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Admin Workspace?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workspace Settings</Text>
        <Text style={styles.subtitle}>Account administration & platform configurations</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Admin Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.email || 'AD').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.rolePill}>
              <ShieldCheck size={12} color={colors.primary} />
              <Text style={styles.roleText}>
                {user?.role === 'super_admin' ? 'SUPER ADMIN' : 'OPERATIONS LEAD'}
              </Text>
            </View>
            <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Mode Switcher Action Card */}
        <View style={styles.modeCard}>
          <View style={styles.modeIconWrap}>
            <Eye size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.modeTitle}>Switch to Customer App</Text>
            <Text style={styles.modeSubtitle}>
              Experience service browsing and test booking directly as a customer in Prayagraj.
            </Text>
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => setViewMode('customer')}
              activeOpacity={0.8}
            >
              <Text style={styles.switchBtnText}>Open Customer View</Text>
              <ChevronRight size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Platform Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>OPERATIONAL PLATFORM DETAILS</Text>

          <View style={styles.infoRow}>
            <Building size={14} color={colors.textMuted} />
            <Text style={styles.infoKey}>Platform:</Text>
            <Text style={styles.infoVal}>LocalHelp Technologies Private Limited</Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={14} color={colors.textMuted} />
            <Text style={styles.infoKey}>City:</Text>
            <Text style={styles.infoVal}>Prayagraj, Uttar Pradesh (PIN 211001)</Text>
          </View>

          <View style={styles.infoRow}>
            <Mail size={14} color={colors.textMuted} />
            <Text style={styles.infoKey}>Support:</Text>
            <Text style={styles.infoVal}>care@localhelp.in</Text>
          </View>

          <View style={styles.infoRow}>
            <Sparkles size={14} color={colors.textMuted} />
            <Text style={styles.infoKey}>Tariff Rule:</Text>
            <Text style={styles.infoVal}>Fixed Pricing with No Bargaining</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color={colors.danger} />
          <Text style={styles.logoutBtnText}>Sign Out from Workspace</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  modeCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
    marginBottom: 10,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  switchBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoKey: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});

