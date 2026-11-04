import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Phone, MessageCircle } from 'lucide-react-native';
import { useSupport } from '../contexts/SupportContext';

interface Props {
  referenceNumber?: string;
  serviceName?: string;
  compact?: boolean;
}

export const SupportBanner: React.FC<Props> = ({ referenceNumber, serviceName, compact }) => {
  const { supportInfo, callSupport, openWhatsApp } = useSupport();

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Need Immediate Help?</Text>
        <Text style={styles.subtitle}>
          LocalHelp customer care is ready to coordinate via call or WhatsApp.
        </Text>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.button, styles.callButton]}
          onPress={callSupport}
          activeOpacity={0.8}
        >
          <Phone size={16} color="#176B65" />
          <Text style={styles.callButtonText}>Call Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.whatsappButton]}
          onPress={() => openWhatsApp(referenceNumber, serviceName)}
          activeOpacity={0.8}
        >
          <MessageCircle size={16} color="#F7F5EF" />
          <Text style={styles.whatsappButtonText}>WhatsApp Us</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F8F7',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#B0DCD7',
  },
  compactContainer: {
    padding: 12,
    marginVertical: 8,
  },
  textContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#176B65',
  },
  subtitle: {
    fontSize: 12,
    color: '#4A5854',
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  callButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E2D8',
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#176B65',
  },
  whatsappButton: {
    backgroundColor: '#25877C',
  },
  whatsappButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F7F5EF',
  },
});
