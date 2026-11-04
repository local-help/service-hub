'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench, Phone, MessageCircle, Shield, Clock, Award } from 'lucide-react';
import { useSupport } from '../../contexts/SupportContext';

export const Footer: React.FC = () => {
  const { supportInfo, getCallUrl, getWhatsAppUrl } = useSupport();

  return (
    <footer className="bg-[#242D2B] text-[#D5CEC0] mt-20 border-t border-[#384441]">
      {/* Trust Badges */}
      <div className="border-b border-[#384441] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#25877C]/20 text-[#8BE3D9] flex items-center justify-center shrink-0 border border-[#25877C]/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-[#F7F5EF]">Central Coordination</h5>
              <p className="text-xs text-[#D5CEC0]/80 mt-0.5">Verified local providers supervised by our support desk.</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#176B65]/30 text-[#8BE3D9] flex items-center justify-center shrink-0 border border-[#176B65]/40">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-[#F7F5EF]">Fast Phone & WhatsApp Support</h5>
              <p className="text-xs text-[#D5CEC0]/80 mt-0.5">Instant human contact for quotations, updates & queries.</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#25877C]/20 text-[#8BE3D9] flex items-center justify-center shrink-0 border border-[#25877C]/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-[#F7F5EF]">Transparent Pricing</h5>
              <p className="text-xs text-[#D5CEC0]/80 mt-0.5">Clear upfront prices or approved quotations before booking.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-4 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#176B65] flex items-center justify-center text-[#F7F5EF]">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="text-lg font-extrabold text-[#F7F5EF]">
              Local<span className="text-[#8BE3D9]">Help</span>
            </span>
          </Link>
          <p className="text-xs leading-relaxed text-[#D5CEC0]/90">
            Connecting homeowners and car owners with verified local technicians through a coordinated customer service experience.
          </p>
          <p className="text-xs text-[#9DA8A4]">
            Operating exclusively in Bengaluru, Karnataka.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F5EF] mb-3">Popular Services</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/categories/1" className="hover:text-[#F7F5EF] transition">Doorstep Car Detailing</Link></li>
            <li><Link href="/categories/2" className="hover:text-[#F7F5EF] transition">Home Deep Cleaning</Link></li>
            <li><Link href="/categories/3" className="hover:text-[#F7F5EF] transition">Emergency Plumbing</Link></li>
            <li><Link href="/categories/4" className="hover:text-[#F7F5EF] transition">Electrical Installations</Link></li>
            <li><Link href="/categories/5" className="hover:text-[#F7F5EF] transition">AC & Appliance Repair</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F5EF] mb-3">Customer Care</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/requests" className="hover:text-[#F7F5EF] transition">Track Service Request</Link></li>
            <li><Link href="/bookings" className="hover:text-[#F7F5EF] transition">Manage Bookings</Link></li>
            <li><Link href="/login" className="hover:text-[#F7F5EF] transition">Customer Sign In</Link></li>
            <li><Link href="/login" className="hover:text-[#F7F5EF] transition">Admin Portal Login</Link></li>
          </ul>
        </div>

        {/* Direct Contact */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F5EF] mb-3">Contact Support</h4>
          <a
            href={getCallUrl()}
            className="flex items-center gap-2.5 text-xs text-[#E7E2D8] hover:text-[#F7F5EF] transition"
          >
            <Phone className="w-4 h-4 text-[#8BE3D9] shrink-0" />
            <span>Call: {supportInfo.phone}</span>
          </a>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 text-xs text-[#E7E2D8] hover:text-[#F7F5EF] transition"
          >
            <MessageCircle className="w-4 h-4 text-[#25877C] shrink-0" />
            <span>WhatsApp: {supportInfo.whatsapp}</span>
          </a>
          <p className="text-[11px] text-[#9DA8A4] pt-2">
            Support Desk Hours: 8:00 AM – 9:00 PM, All Days
          </p>
        </div>
      </div>

      <div className="border-t border-[#384441] py-6 text-center text-xs text-[#9DA8A4]">
        <p>© {new Date().getFullYear()} LocalHelp Technologies Pvt. Ltd. All rights reserved.</p>
      </div>
    </footer>
  );
};
