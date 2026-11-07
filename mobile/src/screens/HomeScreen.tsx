import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { Search, Sparkles, Wrench, ShieldCheck, Clock, ChevronRight, Bell, MapPin } from 'lucide-react-native';
import { Category, Service } from '../types';
import { apiRequest } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';
import { colors } from '../theme/colors';

interface Props {
  onSelectCategory: (cat: Category) => void;
  onSelectService: (svc: Service) => void;
  onOpenNotifications?: () => void;
  unreadNotifications?: number;
}

export const HomeScreen: React.FC<Props> = ({ 
  onSelectCategory, 
  onSelectService, 
  onOpenNotifications,
  unreadNotifications = 0 
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [catsRes, svcsRes] = await Promise.all([
        apiRequest<{ categories: Category[] } | Category[]>('/categories'),
        apiRequest<{ services: Service[] } | Service[]>('/services')
      ]);

      const catList = Array.isArray(catsRes) ? catsRes : (catsRes as any).categories || [];
      const svcList: Service[] = Array.isArray(svcsRes) ? svcsRes : (svcsRes as any).services || [];

      setCategories(catList);
      setFeaturedServices(svcList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredServices = searchQuery.trim()
    ? featuredServices.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.short_description && s.short_description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.category_name && s.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : featuredServices.slice(0, 8);

  const filteredCategories = searchQuery.trim()
    ? categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : categories;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading local services...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.cityPill}>
            <MapPin size={12} color="#ffffff" />
            <Text style={styles.cityPillText}>Prayagraj (Allahabad)</Text>
          </View>
          {onOpenNotifications && (
            <TouchableOpacity onPress={onOpenNotifications} style={styles.bellBtn} activeOpacity={0.8}>
              <Bell size={20} color="#ffffff" />
              {unreadNotifications > 0 && (
                <View style={styles.badgeWrap}>
                  <Text style={styles.badgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.heroTitle}>Local Services, Coordinated with Care</Text>
        <Text style={styles.heroSubtitle}>
          Verified technicians, upfront transparent pricing, and instant doorstep service booking.
        </Text>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textLight} />
          <TextInput
            placeholder="Search car wash, electrician, driver, repairs..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.content}>
        {/* Support Banner */}
        <SupportBanner compact />

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
        </View>

        <View style={styles.categoriesGrid}>
          {filteredCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => onSelectCategory(cat)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIconWrap}>
                <Wrench size={20} color={colors.primary} />
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
              <Text style={styles.categoryCount}>
                {cat.coming_soon ? 'Coming Soon' : `${cat.services_count || 'Explore'} services`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Services Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim() ? `Search Results (${filteredServices.length})` : 'Popular Services'}
          </Text>
        </View>

        <View style={styles.servicesList}>
          {filteredServices.map((svc) => {
            const isComingSoon = svc.coming_soon;
            const price = svc.fixed_price || svc.base_price;

            return (
              <TouchableOpacity
                key={svc.id}
                style={styles.serviceCard}
                onPress={() => onSelectService(svc)}
                activeOpacity={0.7}
              >
                <View style={styles.serviceInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.serviceName}>{svc.name}</Text>
                    {isComingSoon && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Coming Soon</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.serviceDesc} numberOfLines={2}>
                    {svc.short_description || svc.description || 'Reliable local home service'}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.pricingBadge, isComingSoon ? styles.soonBadge : styles.fixedBadge]}>
                      <Text style={[styles.pricingBadgeText, isComingSoon ? styles.soonBadgeText : styles.fixedBadgeText]}>
                        {isComingSoon
                          ? 'Launching Soon'
                          : price
                          ? `₹${price}`
                          : svc.booking_type === 'time_based'
                          ? 'From ₹800'
                          : 'Fixed Price'}
                      </Text>
                    </View>
                    {svc.estimated_duration_minutes && (
                      <Text style={styles.durationText}>
                        ⏱ {svc.estimated_duration_minutes} mins
                      </Text>
                    )}
                    {svc.supported_vehicle_types && svc.supported_vehicle_types.length > 0 && (
                      <Text style={styles.vehicleTag}>
                        🚗 {svc.supported_vehicle_types.length} vehicle types
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={18} color={colors.textLight} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
  },
  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cityPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  bellBtn: {
    position: 'relative',
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
  },
  badgeWrap: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#D1FAE5',
    marginTop: 6,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoryCount: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  servicesList: {
    gap: 10,
    paddingBottom: 24,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  comingSoonBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warningText,
  },
  serviceDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pricingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pricingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fixedBadge: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  fixedBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  soonBadge: {
    backgroundColor: colors.borderSubtle,
  },
  soonBadgeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  durationText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  vehicleTag: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
