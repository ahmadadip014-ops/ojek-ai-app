import React from 'react';
import { Order, User } from '../types';
import { LeafletMap, LocationCoord } from './LeafletMap';
import {
  Radar,
  UserCheck,
  Bike,
  MapPin,
  CheckCircle2,
  Clock,
  Navigation,
  MessageSquare,
  Star,
  ShieldCheck,
  FileDown,
} from 'lucide-react';

interface OrderStatusTrackerProps {
  order: Order;
  currentUser: User;
  onOpenLiveChat: () => void;
  onCancelOrder?: () => void;
  onRateDriver: () => void;
  onDownloadInvoice: () => void;
}

export type TrackingStepKey = 'MENCARI' | 'DITUGASKAN' | 'DALAM_PERJALANAN' | 'TIBA' | 'SELESAI';

interface StepDef {
  key: TrackingStepKey;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
}

const STEPS: StepDef[] = [
  {
    key: 'MENCARI',
    label: 'Mencari Radar',
    shortLabel: 'Cari Driver',
    icon: <Radar className="w-4 h-4" />,
    description: 'Menghubungi radar driver terdekat di Kertosono & Jombang',
  },
  {
    key: 'DITUGASKAN',
    label: 'Pengemudi Ditugaskan',
    shortLabel: 'Ditugaskan',
    icon: <UserCheck className="w-4 h-4" />,
    description: 'Driver telah menerima pesanan dan bersiap jalan',
  },
  {
    key: 'DALAM_PERJALANAN',
    label: 'Dalam Perjalanan',
    shortLabel: 'Meluncur',
    icon: <Bike className="w-4 h-4" />,
    description: 'Driver sedang mengendarai motor menuju titik penjemputan',
  },
  {
    key: 'TIBA',
    label: 'Tiba di Lokasi',
    shortLabel: 'Tiba',
    icon: <MapPin className="w-4 h-4" />,
    description: 'Driver telah sampai di depan gerbang / titik jemput',
  },
  {
    key: 'SELESAI',
    label: 'Pesanan Selesai',
    shortLabel: 'Selesai',
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: 'Perjalanan aman selesai, siap beri penilaian driver',
  },
];

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  order,
  currentUser,
  onOpenLiveChat,
  onCancelOrder,
  onRateDriver,
  onDownloadInvoice,
}) => {
  // Determine current step index
  let currentStepKey: TrackingStepKey = 'MENCARI';
  if (order.status === 'SELESAI') {
    currentStepKey = 'SELESAI';
  } else if (order.trackingStage === 'TIBA') {
    currentStepKey = 'TIBA';
  } else if (order.trackingStage === 'DALAM_PERJALANAN' || order.status === 'SEDANG_DIJALANKAN') {
    currentStepKey = 'DALAM_PERJALANAN';
  } else if (order.driverId || order.status === 'DITERIMA' || order.trackingStage === 'DITUGASKAN') {
    currentStepKey = 'DITUGASKAN';
  } else {
    currentStepKey = 'MENCARI';
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStepKey);

  // Simulated live driver coordinates approximating journey towards pickup
  const driverLiveCoord: LocationCoord | undefined = order.driverId
    ? {
        lat:
          currentStepKey === 'TIBA' || currentStepKey === 'SELESAI'
            ? order.pickupLat
            : currentStepKey === 'DALAM_PERJALANAN'
            ? order.pickupLat + 0.003
            : order.pickupLat + 0.007,
        lng:
          currentStepKey === 'TIBA' || currentStepKey === 'SELESAI'
            ? order.pickupLng
            : currentStepKey === 'DALAM_PERJALANAN'
            ? order.pickupLng + 0.002
            : order.pickupLng + 0.005,
        name: `Posisi Driver (${order.driverName || 'Cak Slamet'})`,
      }
    : undefined;

  const pickupCoord: LocationCoord = {
    lat: order.pickupLat,
    lng: order.pickupLng,
    name: order.pickupAddress,
  };

  const dropoffCoord: LocationCoord = {
    lat: order.dropoffLat,
    lng: order.dropoffLng,
    name: order.dropoffAddress,
  };

  const etaMin =
    order.etaMinutes ||
    (currentStepKey === 'TIBA' ? 0 : currentStepKey === 'DALAM_PERJALANAN' ? 3 : 6);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xl border-2 border-blue-400 space-y-4 animate-fade-in">
      {/* Tracker Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
            Status Pelacakan Real-Time
          </span>
          <h3 className="font-black text-base text-slate-950 mt-1 flex items-center space-x-1.5">
            <span>Order #{order.id}</span>
            <span className="text-xs font-bold text-slate-500">({order.serviceType})</span>
          </h3>
        </div>

        <div className="text-right">
          <span className="text-xs font-black text-blue-800 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
            Rp {order.totalOngkir.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Visual Stepper Bar */}
      <div className="pt-1 pb-2">
        <div className="relative flex items-center justify-between">
          {/* Connecting Background Line */}
          <div className="absolute left-3 right-3 top-4 h-1 bg-slate-200 -z-0 rounded-full" />
          {/* Active Filled Progress Line */}
          <div
            className="absolute left-3 top-4 h-1 bg-blue-600 -z-0 rounded-full transition-all duration-500"
            style={{
              width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
            }}
          />

          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-2 border-blue-800 shadow-md ring-4 ring-blue-200 scale-110'
                      : isCompleted
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-white" /> : step.icon}
                </div>

                <span
                  className={`text-[9px] mt-1.5 text-center font-bold tracking-tight max-w-[62px] leading-tight ${
                    isCurrent
                      ? 'text-blue-900 font-black'
                      : isCompleted
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  {step.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Callout */}
      <div
        className={`p-3 rounded-2xl border transition-all ${
          currentStepKey === 'SELESAI'
            ? 'bg-emerald-50 border-emerald-300'
            : currentStepKey === 'TIBA'
            ? 'bg-blue-50 border-blue-300'
            : currentStepKey === 'DALAM_PERJALANAN'
            ? 'bg-blue-50/80 border-blue-300'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              {currentStepKey !== 'SELESAI' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  currentStepKey === 'SELESAI'
                    ? 'bg-emerald-500'
                    : currentStepKey === 'TIBA'
                    ? 'bg-blue-600'
                    : 'bg-blue-500'
                }`}
              ></span>
            </span>
            <h4 className="font-black text-xs sm:text-sm text-slate-950 uppercase tracking-tight">
              {STEPS[currentStepIndex].label}
            </h4>
          </div>

          {currentStepKey !== 'SELESAI' && currentStepKey !== 'MENCARI' && (
            <div className="flex items-center space-x-1 text-[11px] font-black text-blue-900 bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {currentStepKey === 'TIBA' ? 'Driver Sudah Tiba!' : `~${etaMin} Menit`}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-600 mt-1 font-medium">
          {STEPS[currentStepIndex].description}
        </p>
      </div>

      {/* Assigned Driver Box with Photo, Rating & Live Chat */}
      {order.driverId ? (
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={
                    order.driverPhoto ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
                  }
                  alt={order.driverName || 'Driver'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-600 bg-white shadow-xs"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                  Mitra Driver Resmi
                </span>
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-black text-sm text-slate-950">
                    {order.driverName || 'Mitra Driver'}
                  </h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex items-center space-x-2 text-xs mt-0.5">
                  <span className="font-mono font-bold bg-blue-50 text-blue-950 px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                    🛵 {order.driverPlat || 'AG 4521 WZ'}
                  </span>
                  <span className="font-black text-amber-600 flex items-center text-[11px]">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                    <span>4.9 (Mitra Unggulan)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Live Chat Button */}
            <button
              type="button"
              onClick={onOpenLiveChat}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs px-3.5 py-2.5 rounded-2xl shadow-md transition flex flex-col items-center justify-center shrink-0 border border-blue-500 cursor-pointer"
            >
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Chat</span>
              </div>
              <span className="text-[9px] bg-emerald-400 text-slate-950 font-bold px-1 rounded-sm mt-0.5">
                Online
              </span>
            </button>
          </div>

          {/* Rating Display if order already rated */}
          {order.rating && (
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-blue-900">Nilai Anda:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= order.rating! ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                {order.reviewComment && (
                  <span className="text-slate-600 italic font-normal truncate max-w-[150px]">
                    "{order.reviewComment}"
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onRateDriver}
                className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
              >
                Ubah
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-dashed border-blue-300 text-center space-y-2">
          <div className="flex justify-center">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600"></span>
            </span>
          </div>
          <h5 className="font-black text-xs text-blue-950">
            📡 Radar Ojek Serba Bisa Sedang Mencari Driver Terdekat...
          </h5>
          <p className="text-[11px] text-slate-600">
            Driver pangkalan Stasiun Kertosono, Pasar Baru, dan RSUD akan segera menyambar pesanan Anda!
          </p>
          <button
            type="button"
            onClick={onOpenLiveChat}
            className="inline-flex items-center space-x-1 text-xs font-black text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 px-3 py-1.5 rounded-xl shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>💬 Live Chat Bantuan / CS Mas Tolong</span>
          </button>
        </div>
      )}

      {/* Real-time Map Navigation Preview */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-black text-slate-900 flex items-center space-x-1">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Peta Pergerakan Real-Time Driver &amp; Rute:</span>
          </span>
          <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            GPS Aktif
          </span>
        </div>

        <LeafletMap
          pickup={pickupCoord}
          dropoff={dropoffCoord}
          driverLocation={driverLiveCoord}
          driverName={order.driverName}
          isReadOnly={true}
          height="190px"
        />
      </div>

      {/* Action Footer */}
      <div className="flex items-center space-x-2 pt-1">
        {order.status === 'SELESAI' ? (
          <>
            <button
              type="button"
              onClick={onRateDriver}
              className="flex-1 bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow transition cursor-pointer"
            >
              <Star className="w-4 h-4 fill-slate-950" />
              <span>{order.rating ? 'Ubah Penilaian Driver' : '⭐ Beri Bintang Driver'}</span>
            </button>
            <button
              type="button"
              onClick={onDownloadInvoice}
              className="bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center space-x-1 shadow transition cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-white" />
              <span>Struk</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onOpenLiveChat}
              className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>💬 Koordinasi di Live Chat</span>
            </button>

            {onCancelOrder && (
              <button
                type="button"
                onClick={onCancelOrder}
                className="text-red-700 hover:bg-red-50 border border-red-200 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer"
              >
                Batalkan
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
