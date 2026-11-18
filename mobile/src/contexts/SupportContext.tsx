import React, { createContext, useContext, useEffect, useState } from 'react';
import { Linking, Alert } from 'react-native';
import { SupportInfo } from '../types';
import { apiRequest } from '../api/client';

interface SupportContextType {
  supportInfo: SupportInfo;
  loading: boolean;
  callSupport: () => Promise<void>;
  openWhatsApp: (referenceNumber?: string, serviceName?: string) => Promise<void>;
}

const defaultSupport: SupportInfo = {
  phone: '+919876543210',
  whatsapp: '919876543210',
  platform_name: 'LocalHelp',
};

const SupportContext = createContext<SupportContextType>({
  supportInfo: defaultSupport,
  loading: false,
  callSupport: async () => {},
  openWhatsApp: async () => {},
});

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supportInfo, setSupportInfo] = useState<SupportInfo>(defaultSupport);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiRequest<SupportInfo>('/platform/support_info')
      .then((data) => {
        if (data.phone && data.whatsapp) {
          setSupportInfo(data);
        }
      })
      .catch((err) => console.warn('Could not load dynamic support info:', err))
      .finally(() => setLoading(false));
  }, []);

  const cleanPhone = (phone?: string | null) => (phone ? phone.replace(/[^\d]/g, '') : '');

  const callSupport = async () => {
    const url = `tel:${supportInfo.phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Call Support', `Please dial: ${supportInfo.phone}`);
    }
  };

  const openWhatsApp = async (referenceNumber?: string, serviceName?: string) => {
    const rawNumber = cleanPhone(supportInfo.whatsapp);
    let message = `Hi ${supportInfo.platform_name}, I need assistance`;

    if (referenceNumber) {
      message += ` with my service request ${referenceNumber}`;
    }
    if (serviceName) {
      message += ` (${serviceName})`;
    }
    message += '.';

    const url = `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('WhatsApp Not Installed', `You can reach LocalHelp support directly at: ${supportInfo.phone}`);
    }
  };

  return (
    <SupportContext.Provider
      value={{
        supportInfo,
        loading,
        callSupport,
        openWhatsApp,
      }}
    >
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = () => useContext(SupportContext);

