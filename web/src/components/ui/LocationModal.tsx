'use client';

import React, { useState } from 'react';
import { 
  Crosshair, 
  X, 
  Check, 
  MapPin, 
  AlertCircle, 
  Loader2
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext';

const PRAYAGRAJ_LOCALITIES = [
  { name: 'Civil Lines', lat: 25.4519, lon: 81.8340, pincode: '211001' },
  { name: 'Katra', lat: 25.4612, lon: 81.8540, pincode: '211002' },
  { name: 'Tagore Town', lat: 25.4468, lon: 81.8596, pincode: '211002' },
  { name: 'Ashok Nagar', lat: 25.4552, lon: 81.8214, pincode: '211001' },
  { name: 'Georgetown', lat: 25.4402, lon: 81.8611, pincode: '211002' },
  { name: 'Mumfordganj', lat: 25.4674, lon: 81.8378, pincode: '211002' },
  { name: 'Naini', lat: 25.3854, lon: 81.8672, pincode: '211008' },
  { name: 'Jhunsi', lat: 25.4312, lon: 81.9056, pincode: '211019' },
  { name: 'Dhoomanganj', lat: 25.4389, lon: 81.7942, pincode: '211011' },
];

export const LocationModal: React.FC = () => {
  const { 
    location, 
    isDetecting, 
    error, 
    isModalOpen, 
    setIsModalOpen, 
    detectLocation, 
    setLocationManually 
  } = useLocation();

  const [customAddress, setCustomAddress] = useState(location.address_line);
  const [customLandmark, setCustomLandmark] = useState(location.landmark || '');
  const [customPincode, setCustomPincode] = useState(location.postal_code || '211001');

  if (!isModalOpen) return null;

  const handleGpsClick = async () => {
    try {
      const loc = await detectLocation();
      setCustomAddress(loc.address_line);
      setCustomLandmark(loc.landmark || '');
      setCustomPincode(loc.postal_code || '211001');
    } catch (err) {
      // Error handled in context
    }
  };

  const handleSelectLocality = (loc: typeof PRAYAGRAJ_LOCALITIES[0]) => {
    setLocationManually({
      latitude: loc.lat,
      longitude: loc.lon,
      locality: loc.name,
      address_line: loc.name,
      landmark: `${loc.name} Chauraha`,
      postal_code: loc.pincode,
      formatted_address: `${loc.name}, Prayagraj, Uttar Pradesh ${loc.pincode}`,
    });
    setCustomAddress(loc.name);
    setCustomLandmark(`${loc.name} Chauraha`);
    setCustomPincode(loc.pincode);
  };

  const handleSave = () => {
    setLocationManually({
      address_line: customAddress,
      landmark: customLandmark,
      postal_code: customPincode,
      formatted_address: `${customAddress}${customLandmark ? ', ' + customLandmark : ''}, ${location.locality || 'Prayagraj'}, Prayagraj, ${customPincode}`,
    });
    setIsModalOpen(false);
  };

  const lat = location.latitude || 25.4519;
  const lon = location.longitude || 81.8340;
  const bbox = `${lon - 0.005},${lat - 0.004},${lon + 0.005},${lat + 0.004}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-lg space-y-4 max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Select Doorstep Location</h3>
            <p className="text-xs text-slate-500">Prayagraj (Allahabad) coverage</p>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Location Permission Needed</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* GPS Button */}
        <button
          type="button"
          onClick={handleGpsClick}
          disabled={isDetecting}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
        >
          {isDetecting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Detecting GPS location…</span>
            </>
          ) : (
            <>
              <Crosshair className="w-3.5 h-3.5" />
              <span>Use Current GPS Location</span>
            </>
          )}
        </button>

        {/* Map Preview */}
        <div className="rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100 h-40">
          <iframe
            key={`${lat}-${lon}`}
            title="Location Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={mapSrc}
            className="w-full h-full"
          />
          <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-medium text-slate-600">
            {lat.toFixed(4)}, {lon.toFixed(4)}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Address / Flat / Street
            </label>
            <input
              type="text"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="e.g. 14 MG Marg, Civil Lines"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Landmark
              </label>
              <input
                type="text"
                value={customLandmark}
                onChange={(e) => setCustomLandmark(e.target.value)}
                placeholder="e.g. Near High Court"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={customPincode}
                onChange={(e) => setCustomPincode(e.target.value)}
                placeholder="211001"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Localities chips */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 block">
            Popular Localities
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRAYAGRAJ_LOCALITIES.map((loc) => {
              const isSelected = location.locality === loc.name;
              return (
                <button
                  type="button"
                  key={loc.name}
                  onClick={() => handleSelectLocality(loc)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 font-medium'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {loc.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 truncate max-w-[240px]">
            Selected: <span className="font-medium text-slate-800">{location.locality || 'Prayagraj'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
