'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, MessageCircle } from 'lucide-react';
import { useSupport } from '../../contexts/SupportContext';

export const Footer: React.FC = () => {
  const { supportInfo, getCallUrl, getWhatsAppUrl } = useSupport();
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return (
      <footer className="border-t border-slate-200/80 bg-white py-3.5 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">LocalHelp Operations Console</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Prayagraj Hub</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">All systems operational</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <Link href="/admin/settings" className="hover:text-slate-900 transition">Team & Settings</Link>
            <span className="text-slate-200">•</span>
            <Link href="/admin/architecture" className="hover:text-slate-900 transition">API Specs</Link>
            <span className="text-slate-200">•</span>
            <span className="text-slate-400">© {new Date().getFullYear()} LocalHelp</span>
          </div>
        </div>
      </footer>
    );
  }

  if (pathname?.startsWith('/provider')) {
    return (
      <footer className="border-t border-[#25877C]/20 bg-[#176B65] py-3.5 text-xs text-[#E7E2D8]/80 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-medium text-white">Provider Partner Workspace</span>
            <span>•</span>
            <span>Prayagraj Division</span>
          </div>
          <p className="text-[11px]">LocalHelp Specialist Partner Network</p>
        </div>
      </footer>
    );
  }

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
              <li><Link href="/services/car-detailing" className="hover:text-slate-600 transition">Car Detailing</Link></li>
              <li><Link href="/categories/vehicle-services" className="hover:text-slate-600 transition">Vehicle Services</Link></li>
              <li><Link href="/categories/home-services" className="hover:text-slate-600 transition">Home Services</Link></li>
              <li><Link href="/services/ac-repair-servicing" className="hover:text-slate-600 transition">AC & Appliance Repair</Link></li>
              <li><Link href="/categories/computer-services" className="hover:text-slate-600 transition">Computer Services</Link></li>
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
