import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { ArrowLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react-native';
import { Category, Service, Subcategory } from '../types';
import { apiRequest } from '../api/client';
import { colors } from '../theme/colors';

interface Props {
  category: Category;
  onBack: () => void;
  onSelectService: (svc: Service) => void;
}

export const CategoryScreen: React.FC<Props> = ({ category, onBack, onSelectService }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<any>(`/categories/${category.id}`)
      .then((data) => {
        const cat = data.category || data;
        const list: Service[] = Array.isArray(data)
          ? data
          : cat.active_services || cat.services || data.services || [];
        setServices(list);
        if (cat.subcategories && cat.subcategories.length > 0) {
          setSubcategories(cat.subcategories);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category.id]);

  const filteredServices = selectedSubcategoryId
    ? services.filter((s) => s.subcategory_id === selectedSubcategoryId)
    : services;

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{category.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Banner */}
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            {category.description && (
              <Text style={styles.categoryDesc}>{category.description}</Text>
            )}
            {category.coming_soon && (
              <View style={styles.comingSoonBanner}>
                <AlertTriangle size={14} color={colors.warningText} />
                <Text style={styles.comingSoonBannerText}>
                  Onboarding technicians in Prayagraj. Bookings open shortly!
                </Text>
              </View>
            )}
          </View>

          {/* Subcategories Filter Chips */}
          {subcategories.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.subcatScroll}
              contentContainerStyle={styles.subcatContent}
            >
              <TouchableOpacity
                style={[styles.subcatChip, selectedSubcategoryId === null && styles.subcatChipActive]}
                onPress={() => setSelectedSubcategoryId(null)}
              >
                <Text style={[styles.subcatChipText, selectedSubcategoryId === null && styles.subcatChipTextActive]}>
                  All Services
                </Text>
              </TouchableOpacity>
              {subcategories.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subcatChip, selectedSubcategoryId === sub.id && styles.subcatChipActive]}
                  onPress={() => setSelectedSubcategoryId(sub.id)}
                >
                  <Text style={[styles.subcatChipText, selectedSubcategoryId === sub.id && styles.subcatChipTextActive]}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.servicesHeader}>
            Available Services ({filteredServices.length})
          </Text>

          <View style={styles.list}>
            {filteredServices.map((svc) => {
              const isComingSoon = svc.coming_soon || category.coming_soon;
              const price = svc.fixed_price || svc.base_price;

              return (
                <TouchableOpacity
                  key={svc.id}
                  style={styles.card}
                  onPress={() => onSelectService(svc)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardInfo}>
                    <Text style={styles.serviceName}>{svc.name}</Text>
                    {svc.description && (
                      <Text style={styles.serviceDesc} numberOfLines={2}>
                        {svc.short_description || svc.description}
                      </Text>
                    )}
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, isComingSoon ? styles.soonBadge : styles.fixedBadge]}>
                        <Text style={[styles.badgeText, isComingSoon ? styles.soonBadgeText : styles.fixedBadgeText]}>
                          {isComingSoon
                            ? 'Coming Soon'
                            : price
                            ? `₹${price}`
                            : svc.booking_type === 'time_based'
                            ? 'Hourly Package'
                            : 'Fixed Rate'}
                        </Text>
                      </View>
                      {svc.estimated_duration_minutes && (
                        <Text style={styles.duration}>
                          ⏱ ~{svc.estimated_duration_minutes} mins
                        </Text>
                      )}
                      {svc.supported_vehicle_types && svc.supported_vehicle_types.length > 0 && (
                        <Text style={styles.vehicleTag}>
                          🚗 {svc.supported_vehicle_types.join(' • ')}
                        </Text>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textLight} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 6,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  categoryInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  categoryDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  comingSoonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningLight,
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  comingSoonBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warningText,
    flex: 1,
  },
  subcatScroll: {
    marginBottom: 14,
  },
  subcatContent: {
    gap: 8,
    paddingRight: 16,
  },
  subcatChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  subcatChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subcatChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subcatChipTextActive: {
    color: '#ffffff',
  },
  servicesHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
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
  duration: {
    fontSize: 11,
    color: colors.textMuted,
  },
  vehicleTag: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
