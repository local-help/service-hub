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
import { Search, Sparkles, Wrench, ShieldCheck, Clock, ChevronRight } from 'lucide-react-native';
import { Category, Service } from '../types';
import { apiRequest } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';

interface Props {
  onSelectCategory: (cat: Category) => void;
  onSelectService: (svc: Service) => void;
}

export const HomeScreen: React.FC<Props> = ({ onSelectCategory, onSelectService }) => {
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
      const svcList = Array.isArray(svcsRes) ? svcsRes : (svcsRes as any).services || [];

      setCategories(catList);
      setFeaturedServices(svcList.slice(0, 6));
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
    ? featuredServices.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : featuredServices;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading local services...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.cityPill}>
          <Text style={styles.cityPillText}>📍 Bengaluru</Text>
        </View>
        <Text style={styles.heroTitle}>Local Services, Coordinated with Care</Text>
        <Text style={styles.heroSubtitle}>
          Verified technicians, upfront quotation coordination, and dedicated phone support.
        </Text>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search cleaning, plumbing, repairs..."
            placeholderTextColor="#94a3b8"
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
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => onSelectCategory(cat)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIconWrap}>
                <Wrench size={22} color="#2563eb" />
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
              <Text style={styles.categoryCount}>
                {cat.services_count || 'Explore'} services
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Services Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
        </View>

        <View style={styles.servicesList}>
          {filteredServices.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={styles.serviceCard}
              onPress={() => onSelectService(svc)}
              activeOpacity={0.7}
            >
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {svc.description || 'Reliable local home service'}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.pricingBadge, svc.pricing_model === 'fixed' ? styles.fixedBadge : styles.quoteBadge]}>
                    <Text style={[styles.pricingBadgeText, svc.pricing_model === 'fixed' ? styles.fixedBadgeText : styles.quoteBadgeText]}>
                      {svc.pricing_model === 'fixed' ? `₹${svc.base_price}` : 'Quotation Required'}
                    </Text>
                  </View>
                  {svc.estimated_duration_minutes && (
                    <Text style={styles.durationText}>
                      ⏱ {svc.estimated_duration_minutes} mins
                    </Text>
                  )}
                </View>
              </View>
              <ChevronRight size={18} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  cityPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  cityPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#bfdbfe',
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
    color: '#0f172a',
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
    color: '#0f172a',
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
    borderColor: '#e2e8f0',
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  categoryCount: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  servicesList: {
    gap: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 10,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  serviceDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#dbeafe',
  },
  fixedBadgeText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '700',
  },
  quoteBadge: {
    backgroundColor: '#fef3c7',
  },
  quoteBadgeText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
  },
  durationText: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
