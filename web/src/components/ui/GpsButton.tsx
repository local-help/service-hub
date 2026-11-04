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
  label = 'Use Current GPS Location',
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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E6F3F1] text-[#176B65] border border-[#B0DCD7] hover:bg-[#D6ECE9] transition cursor-pointer active:scale-95 disabled:opacity-50 ${className}`}
      title="Fetch exact coordinates from your device GPS"
    >
      {isDetecting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Locating...</span>
        </>
      ) : (
        <>
          <Crosshair className="w-3.5 h-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
