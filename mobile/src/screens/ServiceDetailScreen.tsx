import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Car, 
  Truck, 
  Check, 
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Wrench
} from 'lucide-react-native';
import { Service, ServiceVariant, BuilderPackage, ServiceAddon } from '../types';
import { apiRequest } from '../api/client';
import { colors } from '../theme/colors';

export interface BookingOptions {
  selectedVariant?: ServiceVariant | null;
  selectedVehicle?: string | null;
  packageName?: string | null;
  packagePrice?: number | null;
  stepKey?: string | null;
  selectedAddons?: string[];
  addonsTotal?: number;
  driverHours?: number | null;
  pickupDrop?: boolean;
  totalPrice?: number | null;
}

interface Props {
  service: Service;
  onBack: () => void;
  onRequestBooking: (options?: BookingOptions) => void;
}

export const ServiceDetailScreen: React.FC<Props> = ({ service, onBack, onRequestBooking }) => {
  const [fullService, setFullService] = useState<Service>(service);
  const [loading, setLoading] = useState(false);

  // Dynamic step selections
  const [selectedStep, setSelectedStep] = useState<string>('hatchback_sedan');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('standard');
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    apiRequest<Service>(`/services/${service.slug || service.id}`)
      .then((data) => {
        setFullService(data);
        if (data.builder_config?.steps && data.builder_config.steps.length > 0) {
          const firstStep = data.builder_config.steps[0];
          const defaultOpt = firstStep.default_value || firstStep.options[0]?.id || 'hatchback_sedan';
          setSelectedStep(defaultOpt);
        } else if (data.supported_vehicle_types && data.supported_vehicle_types.length > 0) {
          setSelectedStep(data.supported_vehicle_types[0]);
        }

        if (data.builder_config?.packages && data.builder_config.packages.length > 0) {
          setSelectedPackageId(data.builder_config.packages[0].id);
        } else if (data.variants && data.variants.length > 0) {
          setSelectedVariantId(data.variants[0].id);
        }
      })
      .catch((err) => console.error('Failed to load full service details', err))
      .finally(() => setLoading(false));
  }, [service.slug, service.id]);

  const isComingSoon = fullService.coming_soon || fullService.category?.coming_soon;
  const builderConfig = fullService.builder_config;
  const packagesList: BuilderPackage[] = builderConfig?.packages || [];
  const addonsList: ServiceAddon[] = fullService.addons || [];
  const primaryStep = builderConfig?.steps?.[0];

  // Active package calculation
  const activePackage = packagesList.find((p) => p.id === selectedPackageId) || packagesList[0];
  const activeVariant = fullService.variants?.find((v) => v.id === selectedVariantId) || fullService.variants?.[0];

  const packagePrice = useMemo(() => {
    if (activePackage) {
      const priceMap = activePackage.prices || {};
      return priceMap[selectedStep] || priceMap['default'] || Object.values(priceMap)[0] || 0;
    }
    if (activeVariant?.primary_price) {
      return activeVariant.primary_price;
    }
    return fullService.fixed_price || fullService.base_price || 399;
  }, [activePackage, selectedStep, activeVariant, fullService]);

  const activePackageName = activePackage?.name || activeVariant?.name || fullService.name;

  const addonsTotal = useMemo(() => {
    return addonsList
      .filter((a) => selectedAddonIds.includes(a.id))
      .reduce((sum, a) => sum + (a.price || 0), 0);
  }, [addonsList, selectedAddonIds]);

  const platformFee = builderConfig?.platform_fee || 25;
  const calculatedTotal = packagePrice + addonsTotal + platformFee;

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleProceed = () => {
    if (isComingSoon) return;
    onRequestBooking({
      selectedVariant: activeVariant || null,
      selectedVehicle: selectedStep,
      packageName: activePackageName,
      packagePrice,
      stepKey: selectedStep,
      selectedAddons: selectedAddonIds,
      addonsTotal,
      totalPrice: calculatedTotal,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{fullService.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>
                {fullService.category?.name || fullService.category_name || 'Doorstep Service'}
              </Text>
            </View>
            {fullService.estimated_duration_minutes && (
              <View style={styles.durationPill}>
                <Clock size={12} color={colors.textMuted} />
                <Text style={styles.durationPillText}>~{fullService.estimated_duration_minutes} mins</Text>
              </View>
            )}
          </View>

          <Text style={styles.serviceTitle}>{fullService.name}</Text>
          <Text style={styles.serviceDescription}>
            {fullService.description || fullService.short_description || 'Certified doorstep assistance with verified specialists, upfront pricing, and guaranteed dispatch.'}
          </Text>

          <View style={styles.verifiedStrip}>
            <ShieldCheck size={16} color={colors.primary} />
            <Text style={styles.verifiedStripText}>LocalHelp Certified Dispatch Guarantee</Text>
          </View>
        </View>

        {/* Coming Soon Notice */}
        {isComingSoon && (
          <View style={styles.comingSoonBox}>
            <AlertTriangle size={18} color={colors.warningText} />
            <View style={{ flex: 1 }}>
              <Text style={styles.comingSoonTitle}>Launching Soon in Prayagraj</Text>
              <Text style={styles.comingSoonDesc}>
                We are onboarding verified specialist providers for this category. Bookings will open shortly.
              </Text>
            </View>
          </View>
        )}

        {!isComingSoon && (
          <>
            {/* Step 1: Vehicle / Parameter Selection */}
            {primaryStep && primaryStep.options.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.stepCircle}><Text style={styles.stepNum}>1</Text></View>
                  <View>
                    <Text style={styles.sectionTitle}>{primaryStep.title || 'Select Parameter'}</Text>
                    {primaryStep.subtitle && <Text style={styles.sectionSubtitle}>{primaryStep.subtitle}</Text>}
                  </View>
                </View>

                <View style={styles.stepOptionsGrid}>
                  {primaryStep.options.map((opt) => {
                    const isSelected = selectedStep === opt.id;
                    const isSuv = opt.id.includes('suv');
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.stepOptionCard, isSelected && styles.stepOptionCardActive]}
                        onPress={() => setSelectedStep(opt.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.stepIconWrap, isSelected && styles.stepIconWrapActive]}>
                          {isSuv ? (
                            <Truck size={18} color={isSelected ? '#FFFFFF' : colors.primary} />
                          ) : (
                            <Car size={18} color={isSelected ? '#FFFFFF' : colors.primary} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.stepOptionLabel, isSelected && styles.stepOptionLabelActive]}>
                            {opt.label}
                          </Text>
                          {opt.subtext && (
                            <Text style={styles.stepOptionSub} numberOfLines={1}>{opt.subtext}</Text>
                          )}
                        </View>
                        {isSelected && (
                          <View style={styles.checkCircle}>
                            <Check size={11} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Step 2: Package Selection */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepCircle}><Text style={styles.stepNum}>2</Text></View>
                <View>
                  <Text style={styles.sectionTitle}>Select Package</Text>
                  <Text style={styles.sectionSubtitle}>
                    Pricing automatically tailored for your selection
                  </Text>
                </View>
              </View>

              <View style={styles.packagesList}>
                {packagesList.length > 0 ? (
                  packagesList.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id;
                    const priceMap = pkg.prices || {};
                    const price = priceMap[selectedStep] || priceMap['default'] || Object.values(priceMap)[0] || 0;

                    return (
                      <TouchableOpacity
                        key={pkg.id}
                        style={[styles.packageCard, isSelected && styles.packageCardActive]}
                        onPress={() => setSelectedPackageId(pkg.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.packageCardTop}>
                          <View style={{ flex: 1 }}>
                            <View style={styles.pkgTitleRow}>
                              <Text style={[styles.pkgName, isSelected && styles.pkgNameActive]}>{pkg.name}</Text>
                              {pkg.badge && (
                                <View style={styles.pkgBadge}>
                                  <Text style={styles.pkgBadgeText}>{pkg.badge}</Text>
                                </View>
                              )}
                            </View>
                            {pkg.short_description && (
                              <Text style={styles.pkgDesc}>{pkg.short_description}</Text>
                            )}
                          </View>
                          <View style={styles.pkgPriceWrap}>
                            <Text style={styles.pkgPriceLabel}>Fixed Price</Text>
                            <Text style={styles.pkgPriceVal}>₹{price}</Text>
                          </View>
                        </View>

                        <View style={styles.pkgFooter}>
                          <View style={[styles.selectRadio, isSelected && styles.selectRadioActive]}>
                            {isSelected && <View style={styles.selectRadioDot} />}
                          </View>
                          <Text style={[styles.selectText, isSelected && styles.selectTextActive]}>
                            {isSelected ? 'Package Selected' : 'Tap to Select'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  (fullService.variants || []).map((v) => {
                    const isSelected = selectedVariantId === v.id;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={[styles.packageCard, isSelected && styles.packageCardActive]}
                        onPress={() => setSelectedVariantId(v.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.packageCardTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.pkgName, isSelected && styles.pkgNameActive]}>{v.name}</Text>
                            {v.description && <Text style={styles.pkgDesc}>{v.description}</Text>}
                          </View>
                          <View style={styles.pkgPriceWrap}>
                            <Text style={styles.pkgPriceLabel}>Fixed Price</Text>
                            <Text style={styles.pkgPriceVal}>₹{v.primary_price || fullService.fixed_price || 399}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>

            {/* Step 3: Optional Add-ons */}
            {addonsList.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.stepCircle}><Text style={styles.stepNum}>3</Text></View>
                  <View>
                    <Text style={styles.sectionTitle}>Optional Add-ons</Text>
                    <Text style={styles.sectionSubtitle}>Add extra treatments to your doorstep service</Text>
                  </View>
                </View>

                <View style={styles.addonsList}>
                  {addonsList.map((addon) => {
                    const isChecked = selectedAddonIds.includes(addon.id);
                    return (
                      <TouchableOpacity
                        key={addon.id}
                        style={[styles.addonItem, isChecked && styles.addonItemActive]}
                        onPress={() => toggleAddon(addon.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                          {isChecked && <Check size={12} color="#FFFFFF" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.addonTitleRow}>
                            <Text style={styles.addonName}>{addon.name}</Text>
                            <Text style={styles.addonPrice}>+₹{addon.price}</Text>
                          </View>
                          {addon.description && (
                            <Text style={styles.addonDesc}>{addon.description}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Trust & Guarantee Box */}
            <View style={styles.guaranteeBox}>
              <View style={styles.guaranteeRow}>
                <CheckCircle2 size={16} color={colors.primary} />
                <Text style={styles.guaranteeText}>30-Day Doorstep Service Guarantee</Text>
              </View>
              <View style={styles.guaranteeRow}>
                <ShieldCheck size={16} color={colors.primary} />
                <Text style={styles.guaranteeText}>Pre-vetted Technicians with Background Check</Text>
              </View>
              <View style={styles.guaranteeRow}>
                <Clock size={16} color={colors.primary} />
                <Text style={styles.guaranteeText}>Transparent Pricing with Zero Hidden Charges</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom Conversion Bar (Matching Web Fix) */}
      {!isComingSoon && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            <Text style={styles.bottomBarPackage} numberOfLines={1}>{activePackageName}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.bottomBarTotal}>₹{calculatedTotal.toLocaleString('en-IN')}</Text>
              <Text style={styles.bottomBarSub}>total</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleProceed}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <ArrowRight size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  catBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  catBadgeText: {
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
  durationPillText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  verifiedStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifiedStripText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  stepOptionsGrid: {
    gap: 8,
  },
  stepOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 14,
    gap: 10,
  },
  stepOptionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  stepIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconWrapActive: {
    backgroundColor: colors.primary,
  },
  stepOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepOptionLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  stepOptionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packagesList: {
    gap: 10,
  },
  packageCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  packageCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  packageCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  pkgTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pkgName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pkgNameActive: {
    color: colors.primaryDark,
  },
  pkgBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  pkgBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.warningText,
  },
  pkgDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 3,
  },
  pkgPriceWrap: {
    alignItems: 'flex-end',
  },
  pkgPriceLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pkgPriceVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pkgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 8,
    gap: 8,
  },
  selectRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectRadioActive: {
    borderColor: colors.primary,
  },
  selectRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  selectText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  selectTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  addonsList: {
    gap: 8,
  },
  addonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  addonItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  addonTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addonName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addonPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  addonDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
    marginTop: 2,
  },
  guaranteeBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guaranteeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  comingSoonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  comingSoonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warningText,
  },
  comingSoonDesc: {
    fontSize: 11,
    color: colors.warningText,
    lineHeight: 16,
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomBarPackage: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bottomBarTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  bottomBarSub: {
    fontSize: 11,
    color: colors.textLight,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
