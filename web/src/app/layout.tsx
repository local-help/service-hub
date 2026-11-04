import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { SupportProvider } from '../contexts/SupportContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'LocalHelp — Local Services Booking & Coordination',
  description: 'Doorstep car detailing, home deep cleaning, plumbing, electrical and appliance repairs in Bengaluru.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <SupportProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </SupportProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

