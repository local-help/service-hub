'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RequestsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/bookings');
  }, [router]);

  return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-xs text-slate-500">Redirecting to My Bookings...</p>
    </div>
  );
}
