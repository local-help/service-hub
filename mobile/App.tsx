import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Compass, FileText, Calendar, User } from 'lucide-react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SupportProvider } from './src/contexts/SupportContext';
import { Category, Service, ServiceRequest, Booking } from './src/types';

import { HomeScreen } from './src/screens/HomeScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { ServiceDetailScreen } from './src/screens/ServiceDetailScreen';
import { CreateRequestScreen } from './src/screens/CreateRequestScreen';
import { RequestsScreen } from './src/screens/RequestsScreen';
import { RequestDetailScreen } from './src/screens/RequestDetailScreen';
import { BookingsScreen } from './src/screens/BookingsScreen';
import { BookingDetailScreen } from './src/screens/BookingDetailScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

type Tab = 'explore' | 'requests' | 'bookings' | 'profile';

function MainNavigator() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('explore');

  // Navigation Stack State
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Initializing LocalHelp...</Text>
      </View>
    );
  }

  // Not logged in -> Show Login
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoginScreen
          onSuccess={() => setActiveTab('explore')}
          onGoToRegister={() => {}}
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
              onBack={() => setIsCreatingRequest(false)}
              onComplete={(req) => {
                setIsCreatingRequest(false);
                setSelectedService(null);
                setSelectedCategory(null);
                setSelectedRequestId(req.id);
                setActiveTab('requests');
              }}
            />
          );
        }
        if (selectedService) {
          return (
            <ServiceDetailScreen
              service={selectedService}
              onBack={() => setSelectedService(null)}
              onRequestBooking={() => setIsCreatingRequest(true)}
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
          />
        );

      case 'requests':
        if (selectedRequestId) {
          return (
            <RequestDetailScreen
              requestId={selectedRequestId}
              onBack={() => setSelectedRequestId(null)}
              onRefreshList={() => setRefreshKey(k => k + 1)}
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
              onRefreshList={() => setRefreshKey(k => k + 1)}
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
              color={activeTab === 'explore' ? '#176B65' : '#6C7B77'}
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
              color={activeTab === 'requests' ? '#176B65' : '#6C7B77'}
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
              color={activeTab === 'bookings' ? '#176B65' : '#6C7B77'}
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
              color={activeTab === 'profile' ? '#176B65' : '#6C7B77'}
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
    backgroundColor: '#FDFCF9',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F5EF',
  },
  screenContent: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F5EF',
  },
  loadingText: {
    fontSize: 14,
    color: '#6C7B77',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E2D8',
    paddingVertical: 8,
    paddingBottom: 14,
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
    color: '#6C7B77',
  },
  tabLabelActive: {
    color: '#176B65',
    fontWeight: '700',
  },
});

