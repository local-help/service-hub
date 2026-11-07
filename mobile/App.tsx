import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Compass, FileText, Calendar, User } from 'lucide-react-native';

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

type Tab = 'explore' | 'requests' | 'bookings' | 'profile';

function MainNavigator() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('explore');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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

  // Not logged in -> Show Login or Register
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {authMode === 'login' ? (
          <LoginScreen
            onSuccess={() => setActiveTab('explore')}
            onGoToRegister={() => setAuthMode('register')}
          />
        ) : (
          <RegisterScreen
            onSuccess={() => setActiveTab('explore')}
            onGoToLogin={() => setAuthMode('login')}
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
                setIsCreatingRequest(true);
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
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            unreadNotifications={unreadNotifications}
          />
        );

      case 'requests':
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
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
});
