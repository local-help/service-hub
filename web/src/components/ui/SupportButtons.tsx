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
      <div className={`fixed bottom-5 right-5 flex items-center gap-2 z-40 ${className}`}>
        <a
          href={getWhatsAppUrl(referenceNumber, serviceName)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 px-3 py-2 rounded-full shadow-sm text-xs font-medium transition"
          title="Chat on WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>WhatsApp</span>
        </a>
        <a
          href={getCallUrl()}
          className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-full shadow-sm text-xs font-medium transition"
          title="Call Customer Care"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Support</span>
        </a>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Need assistance or custom coordination?</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Our support desk is ready to assist with quotations, custom bookings, and queries.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a
            href={getCallUrl()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-medium transition"
          >
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span>Call {supportInfo.phone}</span>
          </a>
          <a
            href={getWhatsAppUrl(referenceNumber, serviceName)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition shadow-xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <a
        href={getCallUrl()}
        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
      >
        <Phone className="w-3.5 h-3.5 text-slate-500" />
        <span>Call</span>
      </a>
      <a
        href={getWhatsAppUrl(referenceNumber, serviceName)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
      >
        <MessageCircle className="w-3.5 h-3.5 text-slate-600" />
        <span>WhatsApp</span>
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
        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
        title="Open phone dialer"
      >
        <Phone className="w-3.5 h-3.5 text-slate-500" />
        <span>Call</span>
      </a>
      <a
        href={getAdminWhatsAppUrl(customerPhone, referenceNumber)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
        <span>WhatsApp</span>
      </a>
      {onOpenLogModal && (
        <button
          onClick={onOpenLogModal}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
          title="Record communication note"
        >
          <span>Log Note</span>
        </button>
      )}
    </div>
  );
};
