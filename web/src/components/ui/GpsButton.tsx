'use client';

import React from 'react';
import { Crosshair, Loader2 } from 'lucide-react';
import { useLocation, LocationData } from '../../contexts/LocationContext';

interface GpsButtonProps {
  onLocationDetected?: (data: LocationData) => void;
  className?: string;
  label?: string;
}

export const GpsButton: React.FC<GpsButtonProps> = ({
  onLocationDetected,
  className = '',
  label = 'Use GPS Location',
}) => {
  const { detectLocation, isDetecting } = useLocation();

  const handleClick = async () => {
    try {
      const loc = await detectLocation();
      if (onLocationDetected) {
        onLocationDetected(loc);
      }
    } catch (err) {
      // Handled in context
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDetecting}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer disabled:opacity-50 ${className}`}
      title="Fetch exact coordinates from your device GPS"
    >
      {isDetecting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
          <span>Locating…</span>
        </>
      ) : (
        <>
          <Crosshair className="w-3.5 h-3.5 text-slate-500" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
