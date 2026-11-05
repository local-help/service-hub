import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { SupportProvider } from '../contexts/SupportContext';
import { LocationProvider } from '../contexts/LocationContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { LocationModal } from '../components/ui/LocationModal';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'LocalHelp — Local Services Booking & Coordination',
  description: 'Doorstep car detailing, home deep cleaning, plumbing, electrical and appliance repairs in Prayagraj (Allahabad).',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <NotificationProvider>
            <SupportProvider>
              <LocationProvider>
                <Navbar />
                <LocationModal />
                <main className="flex-1">{children}</main>
                <Footer />
              </LocationProvider>
            </SupportProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
