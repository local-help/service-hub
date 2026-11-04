import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { useSupport } from '../../contexts/SupportContext';

interface CustomerSupportButtonsProps {
  referenceNumber?: string;
  serviceName?: string;
  variant?: 'inline' | 'floating' | 'banner' | 'card';
  className?: string;
}

export const CustomerSupportButtons: React.FC<CustomerSupportButtonsProps> = ({
  referenceNumber,
  serviceName,
  variant = 'inline',
  className = '',
}) => {
  const { supportInfo, getCallUrl, getWhatsAppUrl } = useSupport();

  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-6 right-6 flex flex-col gap-3 z-40 ${className}`}>
        <a
          href={getWhatsAppUrl(referenceNumber, serviceName)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#25877C] hover:bg-[#176B65] text-[#F7F5EF] px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 font-medium text-sm border border-[#8BE3D9]/40"
          title="Chat with Support on WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">WhatsApp Help</span>
        </a>
        <a
          href={getCallUrl()}
          className="flex items-center gap-2 bg-[#176B65] hover:bg-[#135752] text-[#F7F5EF] px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 font-medium text-sm"
          title="Call Customer Care"
        >
          <Phone className="w-5 h-5" />
          <span className="hidden sm:inline">Call Support</span>
        </a>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-[#F0F8F7] to-[#F7F5EF] border border-[#B0DCD7] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs ${className}`}>
        <div>
          <h4 className="text-base font-bold text-[#242D2B]">Need immediate assistance or coordination?</h4>
          <p className="text-sm text-slate-600 mt-0.5">
            Our central LocalHelp support desk is ready to answer questions and coordinate your booking.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <a
            href={getCallUrl()}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-white border border-[#E7E2D8] hover:bg-[#F7F5EF] text-[#242D2B] px-4 py-2.5 rounded-xl font-medium text-sm shadow-xs transition"
          >
            <Phone className="w-4 h-4 text-[#176B65]" />
            <span>Call {supportInfo.phone}</span>
          </a>
          <a
            href={getWhatsAppUrl(referenceNumber, serviceName)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-[#25877C] hover:bg-[#176B65] text-[#F7F5EF] px-4 py-2.5 rounded-xl font-medium text-sm shadow-xs transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Us</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <a
        href={getCallUrl()}
        className="inline-flex items-center gap-2 bg-white border border-[#E7E2D8] hover:border-[#B0DCD7] hover:bg-[#F0F8F7] text-[#242D2B] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition"
      >
        <Phone className="w-4 h-4 text-[#176B65]" />
        <span>Call Support</span>
      </a>
      <a
        href={getWhatsAppUrl(referenceNumber, serviceName)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#F0F8F7] border border-[#B0DCD7] hover:bg-[#D6ECE9] text-[#176B65] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition"
      >
        <MessageCircle className="w-4 h-4 text-[#25877C]" />
        <span>WhatsApp Support</span>
      </a>
    </div>
  );
};

interface AdminCommunicationButtonsProps {
  customerPhone: string;
  referenceNumber: string;
  onOpenLogModal?: () => void;
  className?: string;
}

export const AdminCommunicationButtons: React.FC<AdminCommunicationButtonsProps> = ({
  customerPhone,
  referenceNumber,
  onOpenLogModal,
  className = '',
}) => {
  const { getAdminWhatsAppUrl } = useSupport();

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <a
        href={`tel:${customerPhone}`}
        className="inline-flex items-center gap-1.5 bg-[#F0F8F7] border border-[#B0DCD7] hover:bg-[#D6ECE9] text-[#176B65] px-3 py-1.5 rounded-lg text-xs font-semibold transition"
        title="Open phone dialer"
      >
        <Phone className="w-3.5 h-3.5" />
        <span>Call Customer</span>
      </a>
      <a
        href={getAdminWhatsAppUrl(customerPhone, referenceNumber)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 bg-[#D6ECE9] border border-[#7EC4BC] hover:bg-[#B0DCD7] text-[#104642] px-3 py-1.5 rounded-lg text-xs font-semibold transition"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span>WhatsApp</span>
      </a>
      {onOpenLogModal && (
        <button
          onClick={onOpenLogModal}
          className="inline-flex items-center gap-1.5 bg-white border border-[#E7E2D8] hover:bg-[#F7F5EF] text-[#242D2B] px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          title="Record communication outcome in request history"
        >
          <span>Log Note</span>
        </button>
      )}
    </div>
  );
};
