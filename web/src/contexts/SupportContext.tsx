'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupportInfo } from '../types';
import { apiRequest } from '../api/client';

interface SupportContextType {
  supportInfo: SupportInfo;
  loading: boolean;
  refreshSupport: () => Promise<void>;
  getCallUrl: () => string;
  getWhatsAppUrl: (referenceNumber?: string, serviceName?: string) => string;
  getAdminWhatsAppUrl: (customerPhone?: string | null, referenceNumber?: string, customMessage?: string) => string;
}

const defaultSupport: SupportInfo = {
  phone: '+919876543210',
  whatsapp: '+919876543210',
  platform_name: 'LocalHelp',
};

const SupportContext = createContext<SupportContextType>({
  supportInfo: defaultSupport,
  loading: false,
  refreshSupport: async () => {},
  getCallUrl: () => `tel:${defaultSupport.phone}`,
  getWhatsAppUrl: () => '',
  getAdminWhatsAppUrl: () => '',
});

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supportInfo, setSupportInfo] = useState<SupportInfo>(defaultSupport);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSupportInfo = async () => {
    try {
      const data = await apiRequest<SupportInfo>('/platform/support_info');
      if (data.phone && data.whatsapp) {
        setSupportInfo(data);
      }
    } catch (err) {
      console.warn('Could not load dynamic support info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportInfo();
  }, []);

  const cleanPhone = (phone?: string | null) => (phone ? String(phone).replace(/[^\d]/g, '') : '');

  const getCallUrl = () => `tel:${supportInfo.phone}`;

  const getWhatsAppUrl = (referenceNumber?: string, serviceName?: string) => {
    const rawNumber = cleanPhone(supportInfo.whatsapp);
    let message = `Hi ${supportInfo.platform_name}, I need assistance`;

    if (referenceNumber) {
      message += ` with my service request ${referenceNumber}`;
    }
    if (serviceName) {
      message += ` (${serviceName})`;
    }
    message += '.';

    return `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`;
  };

  const getAdminWhatsAppUrl = (customerPhone?: string | null, referenceNumber?: string, customMessage?: string) => {
    const rawNumber = cleanPhone(customerPhone);
    const message = customMessage || `Hi, this is ${supportInfo.platform_name} customer support. We are contacting you regarding your service request ${referenceNumber || ''}.`;
    return rawNumber ? `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}` : '#';
  };

  return (
    <SupportContext.Provider
      value={{
        supportInfo,
        loading,
        refreshSupport: fetchSupportInfo,
        getCallUrl,
        getWhatsAppUrl,
        getAdminWhatsAppUrl,
      }}
    >
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = () => useContext(SupportContext);

