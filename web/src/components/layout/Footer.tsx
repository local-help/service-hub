'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, MessageCircle } from 'lucide-react';
import { useSupport } from '../../contexts/SupportContext';

export const Footer: React.FC = () => {
  const { supportInfo, getCallUrl, getWhatsAppUrl } = useSupport();

  return (
    <footer className="border-t border-slate-100 bg-white mt-0">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <img
                src="/local-logo.svg"
                alt="LocalHelp"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connecting homeowners and car owners with verified local technicians through an instant, seamless matching experience.
            </p>
            <p className="text-xs text-slate-400">
              Prayagraj (Allahabad), Uttar Pradesh
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-medium text-slate-900 mb-3">Services</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/categories/1" className="hover:text-slate-600 transition">Car Detailing</Link></li>
              <li><Link href="/categories/2" className="hover:text-slate-600 transition">Home Cleaning</Link></li>
              <li><Link href="/categories/3" className="hover:text-slate-600 transition">Plumbing</Link></li>
              <li><Link href="/categories/4" className="hover:text-slate-600 transition">Electrical</Link></li>
              <li><Link href="/categories/5" className="hover:text-slate-600 transition">AC & Appliance</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-medium text-slate-900 mb-3">Account</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/bookings" className="hover:text-slate-600 transition">My Bookings</Link></li>
              <li><Link href="/addresses" className="hover:text-slate-600 transition">Saved Addresses</Link></li>
              <li><Link href="/login" className="hover:text-slate-600 transition">Sign In</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-medium text-slate-900 mb-3">Support</h4>
            <div className="space-y-2">
              <a
                href={getCallUrl()}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{supportInfo.phone}</span>
              </a>
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{supportInfo.whatsapp}</span>
              </a>
              <p className="text-[11px] text-slate-300 pt-1">
                8 AM – 9 PM, all days
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-300">
        <p>© {new Date().getFullYear()} LocalHelp Technologies Pvt. Ltd.</p>
      </div>
    </footer>
  );
};
