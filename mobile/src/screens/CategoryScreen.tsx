import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { ArrowLeft, ChevronRight, Clock, ShieldCheck } from 'lucide-react-native';
import { Category, Service } from '../types';
import { apiRequest } from '../api/client';

interface Props {
  category: Category;
  onBack: () => void;
  onSelectService: (svc: Service) => void;
}

export const CategoryScreen: React.FC<Props> = ({ category, onBack, onSelectService }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ services: Service[] } | Service[]>(`/categories/${category.id}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).services || (data as any).category?.services || [];
        setServices(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category.id]);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{category.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            {category.description && (
              <Text style={styles.categoryDesc}>{category.description}</Text>
            )}
          </View>

          <Text style={styles.servicesHeader}>Available Services ({services.length})</Text>

          <View style={styles.list}>
            {services.map((svc) => (
              <TouchableOpacity
                key={svc.id}
                style={styles.card}
                onPress={() => onSelectService(svc)}
                activeOpacity={0.7}
              >
                <View style={styles.cardInfo}>
                  <Text style={styles.serviceName}>{svc.name}</Text>
                  {svc.description && (
                    <Text style={styles.serviceDesc} numberOfLines={2}>{svc.description}</Text>
                  )}
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, svc.pricing_model === 'fixed' ? styles.fixedBadge : styles.quoteBadge]}>
                      <Text style={[styles.badgeText, svc.pricing_model === 'fixed' ? styles.fixedBadgeText : styles.quoteBadgeText]}>
                        {svc.pricing_model === 'fixed' ? `₹${svc.base_price}` : 'Quotation Required'}
                      </Text>
                    </View>
                    {svc.estimated_duration_minutes && (
                      <Text style={styles.duration}>
                        ⏱ ~{svc.estimated_duration_minutes} mins
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={18} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 6,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
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
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  categoryDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },
  servicesHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
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
    borderColor: '#e2e8f0',
  },
  cardInfo: {
    flex: 1,
    paddingRight: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  serviceDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  duration: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
