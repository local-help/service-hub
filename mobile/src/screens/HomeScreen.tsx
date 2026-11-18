import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Platform
} from 'react-native';
import { 
  Search, 
  Sparkles, 
  Wrench, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  Bell, 
  MapPin, 
  Car, 
  Laptop, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react-native';
import { Category, Service } from '../types';
import { apiRequest, API_BASE } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';
import { colors } from '../theme/colors';

const PRAYAGRAJ_LOCALITIES = [
  'Civil Lines',
  'Katra',
  'Tagore Town',
  'Ashok Nagar',
  'Georgetown',
  'Mumfordganj',
  'Naini',
  'Jhunsi',
  'Dhoomanganj'
];

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
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [selectedLocality, setSelectedLocality] = useState<string>('Civil Lines');
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setLoadError(null);
    try {
      const [catsRes, svcsRes] = await Promise.all([
        apiRequest<Category[]>('/categories'),
        apiRequest<{ services: Service[] } | Service[]>('/services?per_page=100')
      ]);

      const catList = Array.isArray(catsRes) ? catsRes : (catsRes as any).categories || [];
      const svcList: Service[] = Array.isArray(svcsRes) ? svcsRes : (svcsRes as any).services || [];

      setCategories(catList);
      setAllServices(svcList);
    } catch (err: any) {
      console.error('Failed to load home data', err);
      setLoadError(err?.error || err?.message || 'Could not connect to server');
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

  const getCategoryIcon = (slug?: string) => {
    const size = 15;
    if (slug === 'vehicle-services') return <Car size={size} color={colors.primary} />;
    if (slug === 'home-services') return <Sparkles size={size} color={colors.primary} />;
    if (slug === 'computer-services') return <Laptop size={size} color={colors.primary} />;
    if (slug === 'emergency-assistance') return <Zap size={size} color={colors.primary} />;
    return <Wrench size={size} color={colors.primary} />;
  };

  // Autocomplete search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allServices.filter((s) => {
      const catName = s.category?.name || categories.find((c) => c.id === s.category_id)?.name;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.short_description && s.short_description.toLowerCase().includes(q)) ||
        (catName && catName.toLowerCase().includes(q))
      );
    }).slice(0, 5);
  }, [searchQuery, allServices, categories]);

  // Selected Category Object
  const selectedCategoryObj = useMemo(() => {
    if (selectedCategorySlug === 'all') return null;
    return categories.find((c) => c.slug === selectedCategorySlug || c.id.toString() === selectedCategorySlug);
  }, [selectedCategorySlug, categories]);

  // Services displayed according to category filter
  const displayedServices = useMemo(() => {
    if (selectedCategorySlug === 'all' || !selectedCategoryObj) {
      // Return top priority services
      const priority = ['car-wash', 'car-detailing', 'ac-repair-servicing', 'deep-cleaning', 'electrical-repair', 'plumbing-repair', 'laptop-repair'];
      const curated: Service[] = [];
      priority.forEach((slug) => {
        const found = allServices.find((s) => s.slug === slug);
        if (found) curated.push(found);
      });
      allServices.forEach((s) => {
        if (!curated.some((c) => c.id === s.id) && curated.length < 12) {
          curated.push(s);
        }
      });
      return curated;
    }

    return allServices.filter((s) => 
      s.category_id === selectedCategoryObj.id || 
      s.category?.slug === selectedCategoryObj.slug ||
      s.category?.id === selectedCategoryObj.id
    );
  }, [selectedCategorySlug, selectedCategoryObj, allServices]);

  if (loading && categories.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Prayagraj services...</Text>
      </View>
    );
  }

  if (loadError && categories.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIconWrap}>
          <AlertCircle size={36} color="#DC2626" />
        </View>
        <Text style={styles.errorTitle}>Connection Problem</Text>
        <Text style={styles.errorSubtitle}>{loadError}</Text>
        <Text style={styles.errorHostText}>Target Host: {API_BASE}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            loadData();
          }}
          activeOpacity={0.8}
        >
          <RefreshCw size={16} color="#FFFFFF" />
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header & Doorstep Location */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity 
              style={styles.locationPill}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.pinCircle}>
                <MapPin size={13} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.locationSub}>Doorstep Location</Text>
                <Text style={styles.locationMain}>Prayagraj • {selectedLocality}</Text>
              </View>
              <ChevronRight size={14} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>

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

          {/* Hero Headline */}
          <Text style={styles.heroTitle}>Doorstep Services, Guaranteed Quality</Text>
          <Text style={styles.heroSubtitle}>
            Verified local specialists, guaranteed pricing, and instant dispatch.
          </Text>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <Search size={18} color={colors.textLight} />
            <TextInput
              placeholder="Search car wash, electrician, AC repair, driver..."
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Autocomplete Search Dropdown */}
        {isSearchFocused && searchResults.length > 0 && (
          <View style={styles.autocompleteCard}>
            <View style={styles.autocompleteHeader}>
              <Text style={styles.autocompleteHeaderText}>Matching Services ({searchResults.length})</Text>
            </View>
            {searchResults.map((svc) => (
              <TouchableOpacity
                key={svc.id}
                style={styles.autocompleteRow}
                onPress={() => {
                  setSearchQuery('');
                  setIsSearchFocused(false);
                  onSelectService(svc);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.autocompleteName}>{svc.name}</Text>
                  <Text style={styles.autocompleteMeta}>
                    {svc.category?.name || 'Local Service'} {svc.estimated_duration_minutes ? `• ~${svc.estimated_duration_minutes}m` : ''}
                  </Text>
                </View>
                <Text style={styles.autocompletePrice}>
                  {svc.fixed_price ? `₹${svc.fixed_price}` : 'Configurable'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Flat Category Pills Carousel (Matching Web) */}
        <View style={styles.categoryPillsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            <TouchableOpacity
              onPress={() => setSelectedCategorySlug('all')}
              style={[styles.categoryPill, selectedCategorySlug === 'all' && styles.categoryPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryPillText, selectedCategorySlug === 'all' && styles.categoryPillTextActive]}>
                All Top Services
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => {
              const isSelected = selectedCategorySlug === cat.slug || selectedCategorySlug === cat.id.toString();
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategorySlug(cat.slug || cat.id.toString())}
                  style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                  activeOpacity={0.8}
                >
                  <View style={styles.pillIcon}>{getCategoryIcon(cat.slug)}</View>
                  <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                    {cat.name}
                  </Text>
                  {cat.services_count !== undefined && (
                    <View style={[styles.pillCountBadge, isSelected && styles.pillCountBadgeActive]}>
                      <Text style={[styles.pillCountText, isSelected && styles.pillCountTextActive]}>
                        {cat.services_count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {/* Section Header */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>
                {selectedCategorySlug === 'all' || !selectedCategoryObj
                  ? 'Popular Doorstep Services'
                  : selectedCategoryObj.name}
              </Text>
              <Text style={styles.sectionHeaderSub}>
                1-click configuration, guaranteed pricing, and verified dispatch
              </Text>
            </View>
            {selectedCategorySlug !== 'all' && (
              <TouchableOpacity onPress={() => setSelectedCategorySlug('all')}>
                <Text style={styles.resetFilterText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Service Cards Grid */}
          <View style={styles.servicesGrid}>
            {displayedServices.map((svc) => {
              const isComingSoon = svc.coming_soon;
              const catName = svc.category?.name || categories.find((c) => c.id === svc.category_id)?.name || 'Local Service';

              return (
                <TouchableOpacity
                  key={svc.id}
                  style={styles.serviceCard}
                  onPress={() => onSelectService(svc)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText} numberOfLines={1}>{catName}</Text>
                    </View>
                    {svc.estimated_duration_minutes && (
                      <View style={styles.durationPill}>
                        <Clock size={11} color={colors.textLight} />
                        <Text style={styles.durationText}>{svc.estimated_duration_minutes}m</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.serviceName}>{svc.name}</Text>
                  <Text style={styles.serviceDesc} numberOfLines={2}>
                    {svc.short_description || svc.description || 'Verified doorstep technical assistance with guaranteed quality.'}
                  </Text>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.priceLabel}>Fixed from</Text>
                      <Text style={styles.priceValue}>
                        {svc.fixed_price ? `₹${svc.fixed_price}` : '₹299'}
                      </Text>
                    </View>

                    {isComingSoon ? (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Coming Soon</Text>
                      </View>
                    ) : (
                      <View style={styles.bookButton}>
                        <Text style={styles.bookButtonText}>Book</Text>
                        <ArrowRight size={13} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Support Banner */}
          <SupportBanner compact />

          {/* Guarantee Highlights (Matching Web) */}
          <View style={styles.trustCard}>
            <View style={styles.trustItem}>
              <View style={styles.trustIconWrap}>
                <CheckCircle2 size={16} color={colors.primary} />
              </View>
              <View style={styles.trustTextWrap}>
                <Text style={styles.trustTitle}>Verified Specialists</Text>
                <Text style={styles.trustDesc}>Background verified technicians dispatched with photo ID.</Text>
              </View>
            </View>

            <View style={styles.trustItem}>
              <View style={styles.trustIconWrap}>
                <ShieldCheck size={16} color={colors.primary} />
              </View>
              <View style={styles.trustTextWrap}>
                <Text style={styles.trustTitle}>Guaranteed Pricing</Text>
                <Text style={styles.trustDesc}>Upfront transparent estimates without hidden charges.</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Doorstep Location</Text>
                <Text style={styles.modalSub}>Coverage across Prayagraj (Allahabad)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.closeBtn}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={PRAYAGRAJ_LOCALITIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selectedLocality === item;
                return (
                  <TouchableOpacity
                    style={[styles.localityRow, isSelected && styles.localityRowSelected]}
                    onPress={() => {
                      setSelectedLocality(item);
                      setShowLocationModal(false);
                    }}
                  >
                    <View style={styles.localityLeft}>
                      <MapPin size={16} color={isSelected ? colors.primary : colors.textLight} />
                      <Text style={[styles.localityText, isSelected && styles.localityTextSelected]}>
                        {item}
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    backgroundColor: colors.primaryDark,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  pinCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSub: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationMain: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 17,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    padding: 0,
  },
  autocompleteCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  autocompleteHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.ivory,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  autocompleteHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  autocompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  autocompleteName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  autocompleteMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  autocompletePrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  categoryPillsSection: {
    paddingTop: 16,
    paddingBottom: 4,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pillCountBadge: {
    backgroundColor: colors.ivory,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  pillCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  pillCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  pillCountTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  servicesGrid: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '500',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 10,
  },
  priceLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  comingSoonBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warningText,
  },
  trustCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  trustIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  trustTextWrap: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trustDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  localityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  localityRowSelected: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
  },
  localityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  localityText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  localityTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
    marginBottom: 8,
  },
  errorHostText: {
    fontSize: 11,
    color: colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 20,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
