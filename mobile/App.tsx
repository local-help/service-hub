import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import {
  Compass,
  FileText,
  Calendar,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  ClipboardList,
  Briefcase,
  Settings,
} from 'lucide-react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SupportProvider } from './src/contexts/SupportContext';
import { Category, Service, ServiceRequest, Booking } from './src/types';
import { apiRequest } from './src/api/client';
import { colors } from './src/theme/colors';

import { HomeScreen } from './src/screens/HomeScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { ServiceDetailScreen, BookingOptions } from './src/screens/ServiceDetailScreen';
import { CreateRequestScreen } from './src/screens/CreateRequestScreen';
import { RequestsScreen } from './src/screens/RequestsScreen';
import { RequestDetailScreen } from './src/screens/RequestDetailScreen';
import { BookingsScreen } from './src/screens/BookingsScreen';
import { BookingDetailScreen } from './src/screens/BookingDetailScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';

// Admin screens
import { AdminDashboardScreen } from './src/screens/admin/AdminDashboardScreen';
import { AdminRequestsScreen } from './src/screens/admin/AdminRequestsScreen';
import { AdminRequestDetailScreen } from './src/screens/admin/AdminRequestDetailScreen';
import { AdminBookingsScreen } from './src/screens/admin/AdminBookingsScreen';
import { AdminProvidersScreen } from './src/screens/admin/AdminProvidersScreen';
import { AdminMoreScreen } from './src/screens/admin/AdminMoreScreen';

type Tab = 'explore' | 'requests' | 'bookings' | 'profile';
type AdminTab = 'dashboard' | 'requests' | 'bookings' | 'providers' | 'more';

interface GuestPromptProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onSignIn: () => void;
  onExplore: () => void;
}

const GuestGatePrompt: React.FC<GuestPromptProps> = ({
  icon,
  title,
  description,
  onSignIn,
  onExplore,
}) => (
  <View style={styles.guestContainer}>
    <View style={styles.guestCard}>
      <View style={styles.guestIconWrap}>{icon}</View>
      <Text style={styles.guestTitle}>{title}</Text>
      <Text style={styles.guestDesc}>{description}</Text>

      <TouchableOpacity style={styles.guestPrimaryBtn} onPress={onSignIn} activeOpacity={0.8}>
        <Text style={styles.guestPrimaryBtnText}>Sign In or Register</Text>
        <ArrowRight size={16} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.guestSecondaryBtn} onPress={onExplore} activeOpacity={0.7}>
        <Text style={styles.guestSecondaryBtnText}>Explore Services</Text>
      </TouchableOpacity>

      <View style={styles.guestTrustRow}>
        <ShieldCheck size={14} color={colors.primary} />
        <Text style={styles.guestTrustText}>Guaranteed Fixed Tariffs in Prayagraj</Text>
      </View>
    </View>
  </View>
);

function MainNavigator() {
  const { user, loading, isAdmin, viewMode, setViewMode } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('explore');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [selectedAdminRequestId, setSelectedAdminRequestId] = useState<number | null>(null);
  const [adminRequestsFilter, setAdminRequestsFilter] = useState<string>('all');
  const [selectedAdminBookingId, setSelectedAdminBookingId] = useState<number | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<'booking' | 'tab' | 'general'>('general');

  // Navigation Stack State
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBookingOptions, setSelectedBookingOptions] = useState<BookingOptions | undefined>(undefined);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch unread notifications
  const fetchUnread = async () => {
    if (!user) return;
    try {
      const data = await apiRequest<{ unread_count: number }>('/notifications/unread_count');
      if (data && typeof data.unread_count === 'number') {
        setUnreadNotifications(data.unread_count);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnread();
  }, [user, activeTab, refreshKey]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Initializing LocalHelp...</Text>
      </View>
    );
  }

  // Handle Auth Modal
  if (isAuthOpen) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {authMode === 'login' ? (
          <LoginScreen
            onSuccess={() => {
              setIsAuthOpen(false);
              if (authIntent === 'booking' && selectedService) {
                setIsCreatingRequest(true);
              }
              setAuthIntent('general');
            }}
            onGoToRegister={() => setAuthMode('register')}
            onCancel={() => {
              setIsAuthOpen(false);
              setAuthIntent('general');
            }}
          />
        ) : (
          <RegisterScreen
            onSuccess={() => {
              setIsAuthOpen(false);
              if (authIntent === 'booking' && selectedService) {
                setIsCreatingRequest(true);
              }
              setAuthIntent('general');
            }}
            onGoToLogin={() => setAuthMode('login')}
            onCancel={() => {
              setIsAuthOpen(false);
              setAuthIntent('general');
            }}
          />
        )}
      </SafeAreaView>
    );
  }

  // Notifications Modal / Screen
  if (isNotificationsOpen) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <NotificationsScreen
          onBack={() => {
            setIsNotificationsOpen(false);
            fetchUnread();
          }}
          onSelectBooking={(bId) => {
            setIsNotificationsOpen(false);
            setSelectedBookingId(bId);
            setActiveTab('bookings');
          }}
          onSelectRequest={(rId) => {
            setIsNotificationsOpen(false);
            setSelectedRequestId(rId);
            setActiveTab('requests');
          }}
        />
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'explore':
        if (isCreatingRequest && selectedService) {
          return (
            <CreateRequestScreen
              service={selectedService}
              options={selectedBookingOptions}
              onBack={() => setIsCreatingRequest(false)}
              onComplete={(req) => {
                setIsCreatingRequest(false);
                setSelectedService(null);
                setSelectedCategory(null);
                setSelectedBookingOptions(undefined);
                if (req.booking?.id) {
                  setSelectedBookingId(req.booking.id);
                  setActiveTab('bookings');
                } else {
                  setSelectedRequestId(req.id);
                  setActiveTab('requests');
                }
              }}
            />
          );
        }
        if (selectedService) {
          return (
            <ServiceDetailScreen
              service={selectedService}
              onBack={() => setSelectedService(null)}
              onRequestBooking={(options) => {
                setSelectedBookingOptions(options);
                if (!user) {
                  setAuthIntent('booking');
                  setIsAuthOpen(true);
                } else {
                  setIsCreatingRequest(true);
                }
              }}
            />
          );
        }
        if (selectedCategory) {
          return (
            <CategoryScreen
              category={selectedCategory}
              onBack={() => setSelectedCategory(null)}
              onSelectService={(svc) => setSelectedService(svc)}
            />
          );
        }
        return (
          <HomeScreen
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onSelectService={(svc) => setSelectedService(svc)}
            onOpenNotifications={() => {
              if (!user) {
                setAuthIntent('general');
                setIsAuthOpen(true);
              } else {
                setIsNotificationsOpen(true);
              }
            }}
            unreadNotifications={unreadNotifications}
          />
        );

      case 'requests':
        if (!user) {
          return (
            <GuestGatePrompt
              icon={<FileText size={32} color={colors.primary} />}
              title="Track Your Requests"
              description="Sign in to monitor live estimates, technician dispatches, and schedule updates in Prayagraj."
              onSignIn={() => {
                setAuthIntent('tab');
                setIsAuthOpen(true);
              }}
              onExplore={() => setActiveTab('explore')}
            />
          );
        }
        if (selectedRequestId) {
          return (
            <RequestDetailScreen
              requestId={selectedRequestId}
              onBack={() => setSelectedRequestId(null)}
              onRefreshList={() => setRefreshKey((k) => k + 1)}
              onGoToBooking={(bId) => {
                setSelectedRequestId(null);
                setSelectedBookingId(bId);
                setActiveTab('bookings');
              }}
            />
          );
        }
        return (
          <RequestsScreen
            key={refreshKey}
            onSelectRequest={(r) => setSelectedRequestId(r.id)}
            onExploreServices={() => setActiveTab('explore')}
          />
        );

      case 'bookings':
        if (!user) {
          return (
            <GuestGatePrompt
              icon={<Calendar size={32} color={colors.primary} />}
              title="Manage Your Bookings"
              description="Sign in to view scheduled technician appointments, reschedule dates, and view invoices."
              onSignIn={() => {
                setAuthIntent('tab');
                setIsAuthOpen(true);
              }}
              onExplore={() => setActiveTab('explore')}
            />
          );
        }
        if (selectedBookingId) {
          return (
            <BookingDetailScreen
              bookingId={selectedBookingId}
              onBack={() => setSelectedBookingId(null)}
              onRefreshList={() => setRefreshKey((k) => k + 1)}
            />
          );
        }
        return (
          <BookingsScreen
            key={refreshKey}
            onSelectBooking={(b) => setSelectedBookingId(b.id)}
            onExploreServices={() => setActiveTab('explore')}
          />
        );

      case 'profile':
        if (!user) {
          return (
            <GuestGatePrompt
              icon={<User size={32} color={colors.primary} />}
              title="Your LocalHelp Profile"
              description="Sign in to manage your saved doorstep addresses and contact information in Prayagraj."
              onSignIn={() => {
                setAuthIntent('tab');
                setIsAuthOpen(true);
              }}
              onExplore={() => setActiveTab('explore')}
            />
          );
        }
        return (
          <ProfileScreen
            onLogout={() => {
              setActiveTab('explore');
              setAuthMode('login');
            }}
          />
        );
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Reset inner stack on tab change
    if (tab === 'explore') {
      setSelectedCategory(null);
      setSelectedService(null);
      setSelectedBookingOptions(undefined);
      setIsCreatingRequest(false);
    } else if (tab === 'requests') {
      setSelectedRequestId(null);
    } else if (tab === 'bookings') {
      setSelectedBookingId(null);
    }
  };

  const handleAdminTabChange = (tab: AdminTab) => {
    setAdminTab(tab);
    if (tab === 'requests') {
      setSelectedAdminRequestId(null);
    } else if (tab === 'bookings') {
      setSelectedAdminBookingId(null);
    }
  };

  const renderAdminContent = () => {
    switch (adminTab) {
      case 'dashboard':
        return (
          <AdminDashboardScreen
            onSelectRequest={(reqId) => {
              setSelectedAdminRequestId(reqId);
              setAdminTab('requests');
            }}
            onGoToRequests={(statusFilter) => {
              setAdminRequestsFilter(statusFilter || 'all');
              setSelectedAdminRequestId(null);
              setAdminTab('requests');
            }}
            onGoToBookings={() => {
              setSelectedAdminBookingId(null);
              setAdminTab('bookings');
            }}
            onGoToProviders={() => {
              setAdminTab('providers');
            }}
          />
        );

      case 'requests':
        if (selectedAdminRequestId) {
          return (
            <AdminRequestDetailScreen
              requestId={selectedAdminRequestId}
              onBack={() => setSelectedAdminRequestId(null)}
              onRefreshList={() => setRefreshKey((k) => k + 1)}
            />
          );
        }
        return (
          <AdminRequestsScreen
            key={`${refreshKey}-${adminRequestsFilter}`}
            initialFilter={adminRequestsFilter}
            onSelectRequest={(reqId) => setSelectedAdminRequestId(reqId)}
          />
        );

      case 'bookings':
        if (selectedAdminBookingId) {
          return (
            <BookingDetailScreen
              bookingId={selectedAdminBookingId}
              onBack={() => setSelectedAdminBookingId(null)}
              onRefreshList={() => setRefreshKey((k) => k + 1)}
            />
          );
        }
        return (
          <AdminBookingsScreen
            key={refreshKey}
            onSelectBooking={(bId) => setSelectedAdminBookingId(bId)}
          />
        );

      case 'providers':
        return <AdminProvidersScreen key={refreshKey} />;

      case 'more':
        return <AdminMoreScreen />;
    }
  };

  // If Admin in Admin Mode, render the full Admin Workspace
  if (isAdmin && viewMode === 'admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <View style={styles.screenContent}>
            {renderAdminContent()}
          </View>

          {/* Admin Bottom Navigation Bar */}
          <View style={styles.adminTabBar}>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => handleAdminTabChange('dashboard')}
              activeOpacity={0.7}
            >
              <LayoutDashboard
                size={22}
                color={adminTab === 'dashboard' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  adminTab === 'dashboard' && styles.tabLabelActive,
                ]}
              >
                Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => handleAdminTabChange('requests')}
              activeOpacity={0.7}
            >
              <ClipboardList
                size={22}
                color={adminTab === 'requests' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  adminTab === 'requests' && styles.tabLabelActive,
                ]}
              >
                Requests
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => handleAdminTabChange('bookings')}
              activeOpacity={0.7}
            >
              <Calendar
                size={22}
                color={adminTab === 'bookings' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  adminTab === 'bookings' && styles.tabLabelActive,
                ]}
              >
                Bookings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => handleAdminTabChange('providers')}
              activeOpacity={0.7}
            >
              <Briefcase
                size={22}
                color={adminTab === 'providers' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  adminTab === 'providers' && styles.tabLabelActive,
                ]}
              >
                Providers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => handleAdminTabChange('more')}
              activeOpacity={0.7}
            >
              <Settings
                size={22}
                color={adminTab === 'more' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  adminTab === 'more' && styles.tabLabelActive,
                ]}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Floating preview banner if admin is in customer view mode */}
        {isAdmin && viewMode === 'customer' && (
          <View style={styles.adminBanner}>
            <View style={styles.adminBannerLeft}>
              <ShieldCheck size={16} color="#38bdf8" />
              <Text style={styles.adminBannerText}>Admin Previewing Customer View</Text>
            </View>
            <TouchableOpacity
              style={styles.adminBannerBtn}
              onPress={() => setViewMode('admin')}
              activeOpacity={0.8}
            >
              <Text style={styles.adminBannerBtnText}>Open Console</Text>
              <ArrowRight size={12} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.screenContent}>
          {renderContent()}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleTabChange('explore')}
            activeOpacity={0.7}
          >
            <Compass
              size={22}
              color={activeTab === 'explore' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'explore' && styles.tabLabelActive,
              ]}
            >
              Explore
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleTabChange('requests')}
            activeOpacity={0.7}
          >
            <FileText
              size={22}
              color={activeTab === 'requests' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'requests' && styles.tabLabelActive,
              ]}
            >
              Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleTabChange('bookings')}
            activeOpacity={0.7}
          >
            <Calendar
              size={22}
              color={activeTab === 'bookings' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'bookings' && styles.tabLabelActive,
              ]}
            >
              Bookings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleTabChange('profile')}
            activeOpacity={0.7}
          >
            <User
              size={22}
              color={activeTab === 'profile' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'profile' && styles.tabLabelActive,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SupportProvider>
        <MainNavigator />
      </SupportProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  adminTabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  adminBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  adminBannerText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  adminBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  adminBannerBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Guest Gate Prompt
  guestContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestCard: {
    backgroundColor: '#ffffff',
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  guestIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  guestDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  guestPrimaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  guestPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  guestSecondaryBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  guestSecondaryBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  guestTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  guestTrustText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
