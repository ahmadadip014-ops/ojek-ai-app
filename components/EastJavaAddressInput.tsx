import React, { useState, useEffect, useRef } from 'react';
import { EastJavaLocation, searchEastJavaLocations, geocodeEastJavaOnline } from '../utils/jawaTimurLocations';
import { Search, MapPin, X, Building, Train, ShoppingCart, Crosshair, Loader2 } from 'lucide-react';

interface EastJavaAddressInputProps {
  label: string;
  value: string;
  placeholder?: string;
  icon?: string;
  onChange: (val: string) => void;
  onSelectLocation: (loc: EastJavaLocation) => void;
}

export const EastJavaAddressInput: React.FC<EastJavaAddressInputProps> = ({
  label,
  value,
  placeholder,
  icon = '📍',
  onChange,
  onSelectLocation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<EastJavaLocation[]>([]);
  const [isLoadingOnline, setIsLoadingOnline] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions when user types
  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    // 1. Instant local search from East Java database
    const localMatches = searchEastJavaLocations(value);
    setSuggestions(localMatches);

    // 2. If fewer than 4 matches and query has at least 3 characters, do quick online fallback
    if (localMatches.length < 3 && value.trim().length >= 3) {
      const timer = setTimeout(async () => {
        setIsLoadingOnline(true);
        const onlineMatches = await geocodeEastJavaOnline(value);
        setIsLoadingOnline(false);
        if (onlineMatches.length > 0) {
          // Merge avoiding duplicates
          setSuggestions((prev) => {
            const combined = [...prev];
            onlineMatches.forEach((om) => {
              if (!combined.some((c) => c.name.toLowerCase() === om.name.toLowerCase())) {
                combined.push(om);
              }
            });
            return combined.slice(0, 7);
          });
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [value]);

  const handleSelect = (loc: EastJavaLocation) => {
    onChange(loc.name);
    onSelectLocation(loc);
    setIsOpen(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Stasiun':
        return '🚉';
      case 'Pasar':
      case 'Pusat Belanja':
        return '🛒';
      case 'RSUD':
        return '🏥';
      case 'Terminal':
        return '🚌';
      case 'Wisata / Alun-alun':
        return '🌳';
      default:
        return '🏙️';
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-1">
      <label className="block text-xs font-black text-slate-700 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
          🗺️ Google Maps Jawa Timur
        </span>
      </label>

      <div className="relative flex items-center">
        <span className="absolute left-3 text-base pointer-events-none select-none">{icon}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (value.trim().length > 0) setIsOpen(true);
          }}
          placeholder={placeholder || 'Ketik alamat atau kota di Jawa Timur...'}
          className="w-full pl-9 pr-9 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white text-slate-900 shadow-sm"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSuggestions([]);
            }}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Google Maps Style Autocomplete Dropdown */}
      {isOpen && (suggestions.length > 0 || isLoadingOnline) && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 max-h-64 overflow-y-auto animate-fade-in divide-y divide-slate-100">
          <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 flex justify-between items-center">
            <span>Saran Alamat Jawa Timur (Google Maps):</span>
            {isLoadingOnline && (
              <span className="flex items-center text-amber-700">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Mencari...
              </span>
            )}
          </div>

          {suggestions.map((loc, idx) => (
            <button
              key={`${loc.name}-${idx}`}
              type="button"
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-amber-50/80 transition flex items-start space-x-2.5 group"
            >
              <div className="text-lg shrink-0 mt-0.5 p-1 bg-slate-100 group-hover:bg-amber-200 rounded-lg transition">
                {getCategoryIcon(loc.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-xs text-slate-900 group-hover:text-amber-950 truncate">
                    {loc.name}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                    {loc.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate group-hover:text-slate-700">
                  {loc.city} &bull; {loc.address}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
