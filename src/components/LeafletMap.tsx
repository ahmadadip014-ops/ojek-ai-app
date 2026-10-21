import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Navigation, Crosshair, MapPin, Route as RouteIcon, Loader2 } from 'lucide-react';
import { fetchRoadRoute, RouteResult } from '../utils/roadRouting';

export interface LocationCoord {
  lat: number;
  lng: number;
  name?: string;
}

interface LeafletMapProps {
  pickup: LocationCoord;
  dropoff: LocationCoord;
  onPickupChange?: (coords: LocationCoord) => void;
  onDropoffChange?: (coords: LocationCoord) => void;
  onRouteCalculated?: (route: RouteResult) => void;
  driverLocation?: LocationCoord;
  driverName?: string;
  isReadOnly?: boolean;
  height?: string;
  showNavigationStep?: boolean;
  navigationStepText?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
  onRouteCalculated,
  driverLocation,
  driverName,
  isReadOnly = false,
  height = '240px',
  showNavigationStep = false,
  navigationStepText,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const routeLineBgRef = useRef<L.Polyline | null>(null);
  const driverRouteLineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activePinSelect, setActivePinSelect] = useState<'pickup' | 'dropoff'>('dropoff');
  const [mapType, setMapType] = useState<'google_roadmap' | 'google_hybrid' | 'osm'>('google_roadmap');
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [activeRouteInfo, setActiveRouteInfo] = useState<{ distanceKm: number; durationMinutes: number } | null>(null);

  // Change Map Layer
  const setTileLayer = (type: 'google_roadmap' | 'google_hybrid' | 'osm') => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let attribution = 'Map data © Google';

    if (type === 'google_hybrid') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = 'Imagery © Google';
    } else if (type === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '© OpenStreetMap contributors';
    }

    const newLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
    setMapType(type);
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center map around Kertosono/Jawa Timur
    const initialCenter = [pickup.lat || -7.5925, pickup.lng || 112.1008] as [number, number];
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView(initialCenter, 14);

    // Google Maps Roadmap default
    const initialLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: 'Map data © Google',
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(map);
    tileLayerRef.current = initialLayer;

    // Custom Marker Icons
    const pickupIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div style="background-color: #10B981; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 2.5px solid white; font-weight: bold; font-size: 16px;">
          📍
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34],
    });

    const dropoffIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div style="background-color: #EF4444; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 2.5px solid white; font-weight: bold; font-size: 16px;">
          🎯
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34],
    });

    const pickupMarker = L.marker([pickup.lat, pickup.lng], {
      draggable: !isReadOnly,
      icon: pickupIcon,
    }).addTo(map).bindPopup('<b>Titik Jemput Pelanggan</b>');

    const dropoffMarker = L.marker([dropoff.lat, dropoff.lng], {
      draggable: !isReadOnly,
      icon: dropoffIcon,
    }).addTo(map).bindPopup('<b>Titik Antar Tujuan</b>');

    if (!isReadOnly) {
      pickupMarker.on('dragend', (e) => {
        const marker = e.target as L.Marker;
        const latLng = marker.getLatLng();
        onPickupChange?.({ lat: latLng.lat, lng: latLng.lng });
      });

      dropoffMarker.on('dragend', (e) => {
        const marker = e.target as L.Marker;
        const latLng = marker.getLatLng();
        onDropoffChange?.({ lat: latLng.lat, lng: latLng.lng });
      });

      map.on('click', (e) => {
        if (activePinSelect === 'pickup') {
          pickupMarker.setLatLng(e.latlng);
          onPickupChange?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        } else {
          dropoffMarker.setLatLng(e.latlng);
          onDropoffChange?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });
    }

    // Two-layer Google Maps route line (darker outer border + vibrant blue inner line)
    const routeLineBg = L.polyline([], {
      color: '#1E3A8A',
      weight: 8,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    const routeLine = L.polyline([], {
      color: '#3B82F6',
      weight: 5,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    mapInstanceRef.current = map;
    pickupMarkerRef.current = pickupMarker;
    dropoffMarkerRef.current = dropoffMarker;
    routeLineRef.current = routeLine;
    routeLineBgRef.current = routeLineBg;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Compute and draw Real Road Path whenever pickup or dropoff changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lng]);
    }
    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.setLatLng([dropoff.lat, dropoff.lng]);
    }

    let isSubscribed = true;
    setIsRoutingLoading(true);

    fetchRoadRoute(pickup, dropoff).then((routeResult) => {
      if (!isSubscribed || !mapInstanceRef.current) return;
      setIsRoutingLoading(false);
      setActiveRouteInfo({
        distanceKm: routeResult.distanceKm,
        durationMinutes: routeResult.durationMinutes,
      });

      // Update real road lines
      if (routeLineRef.current && routeLineBgRef.current) {
        routeLineRef.current.setLatLngs(routeResult.coordinates);
        routeLineBgRef.current.setLatLngs(routeResult.coordinates);
      }

      // Notify parent about actual road distance & time
      onRouteCalculated?.(routeResult);

      // Auto-fit to the full road route
      if (routeResult.coordinates.length > 0) {
        const bounds = L.latLngBounds(routeResult.coordinates);
        mapInstanceRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  // Driver Real-Time Road Route Navigation
  useEffect(() => {
    if (!driverLocation || !mapInstanceRef.current) return;

    const driverIcon = L.divIcon({
      className: 'custom-driver-icon',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="background-color: #0F172A; color: #F59E0B; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.6); border: 2.5px solid #F59E0B; font-size: 22px; animation: bounce 1s infinite alternate;">
            🛵
          </div>
          <div style="background-color: #0F172A; color: white; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 8px; margin-top: 2px; white-space: nowrap; border: 1.5px solid #F59E0B; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
            ${driverName || 'Mitra Driver'}
          </div>
        </div>
      `,
      iconSize: [46, 62],
      iconAnchor: [23, 44],
    });

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], {
        icon: driverIcon,
        zIndexOffset: 1000,
      }).addTo(mapInstanceRef.current).bindPopup(`<b>${driverName || 'Mitra Driver'}</b><br>Posisi Live GPS`);
    } else {
      driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
    }

    // Fetch road route for driver to pickup
    fetchRoadRoute(driverLocation, pickup).then((driverRoute) => {
      if (!mapInstanceRef.current) return;

      if (!driverRouteLineRef.current) {
        driverRouteLineRef.current = L.polyline(driverRoute.coordinates, {
          color: '#10B981',
          weight: 6,
          opacity: 0.95,
          dashArray: '8, 8',
          lineCap: 'round',
        }).addTo(mapInstanceRef.current);
      } else {
        driverRouteLineRef.current.setLatLngs(driverRoute.coordinates);
      }
    });
  }, [driverLocation, driverName, pickup]);

  const handleCenterMap = () => {
    if (!mapInstanceRef.current) return;
    if (routeLineRef.current && routeLineRef.current.getLatLngs().length > 0) {
      mapInstanceRef.current.fitBounds(routeLineRef.current.getBounds(), { padding: [40, 40] });
    } else {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <div
          ref={mapContainerRef}
          style={{ height, width: '100%', borderRadius: '0.85rem', zIndex: 10 }}
          className="border border-slate-300 shadow-inner overflow-hidden"
        />

        {/* Top Left: Google Maps layer switcher & Center */}
        <div className="absolute top-2 left-2 z-20 flex space-x-1.5">
          <div className="bg-white/95 backdrop-blur rounded-lg shadow-md border border-slate-200 p-0.5 flex text-[10px] font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setTileLayer('google_roadmap')}
              className={`px-2 py-1 rounded transition ${
                mapType === 'google_roadmap'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'hover:bg-slate-100'
              }`}
            >
              🗺️ Google Maps
            </button>
            <button
              type="button"
              onClick={() => setTileLayer('google_hybrid')}
              className={`px-2 py-1 rounded transition ${
                mapType === 'google_hybrid'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'hover:bg-slate-100'
              }`}
            >
              🛰️ Satelit
            </button>
          </div>

          <button
            type="button"
            onClick={handleCenterMap}
            title="Pusatkan Peta Rute"
            className="bg-white/95 backdrop-blur hover:bg-white text-slate-800 p-1.5 rounded-lg shadow-md border border-slate-200 transition"
          >
            <Crosshair className="w-3.5 h-3.5 text-slate-700" />
          </button>
        </div>

        {/* Top Right: Pin placement switcher (if editable) */}
        {!isReadOnly && (
          <div className="absolute top-2 right-2 z-20 flex bg-white/95 backdrop-blur rounded-lg shadow-md border border-slate-200 p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActivePinSelect('pickup')}
              className={`px-2 py-1 rounded transition ${
                activePinSelect === 'pickup'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              📍 Pasang Jemput
            </button>
            <button
              type="button"
              onClick={() => setActivePinSelect('dropoff')}
              className={`px-2 py-1 rounded transition ml-1 ${
                activePinSelect === 'dropoff'
                  ? 'bg-red-600 text-white shadow-sm font-black'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              🎯 Pasang Tujuan
            </button>
          </div>
        )}

        {/* Floating Road Route Badge Indicator (Google Maps Road Following) */}
        <div className="absolute bottom-2 left-2 z-20 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-300 shadow-md flex items-center space-x-1.5 text-[11px] font-black text-slate-900">
          <RouteIcon className="w-3.5 h-3.5 text-blue-600" />
          {isRoutingLoading ? (
            <span className="flex items-center text-slate-600 text-[10px]">
              <Loader2 className="w-3 h-3 animate-spin mr-1 text-blue-600" />
              Menghitung rute jalan raya...
            </span>
          ) : activeRouteInfo ? (
            <span>
              Rute Jalan: <strong>{activeRouteInfo.distanceKm} km</strong> (~{activeRouteInfo.durationMinutes} mnt)
            </span>
          ) : (
            <span>Rute Jalan Raya Terhubung</span>
          )}
        </div>

        {/* Live Navigation Overlay Banner for Driver */}
        {showNavigationStep && (
          <div className="absolute bottom-2 left-2 right-2 z-20 bg-slate-950/95 backdrop-blur text-white p-2.5 rounded-xl border border-blue-400 shadow-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg animate-pulse">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block">
                  Navigasi Jalur Jalan Raya Real-Time:
                </span>
                <span className="text-xs font-black text-white">
                  {navigationStepText || 'Mengikuti alur jalan raya menuju pelanggan...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
