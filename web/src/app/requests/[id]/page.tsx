'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RequestDetailRedirectPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/bookings/${id}`);
    } else {
      router.replace('/bookings');
    }
  }, [id, router]);

  return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-xs text-slate-500">Loading Booking Details...</p>
    </div>
  );
}
