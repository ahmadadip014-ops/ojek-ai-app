import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Order, ServiceType, TariffConfig, Voucher } from '../types';
import { LeafletMap, LocationCoord } from './LeafletMap';
import { EastJavaAddressInput } from './EastJavaAddressInput';
import { getVouchers, saveOrders, getOrders } from '../utils/storage';
import confetti from 'canvas-confetti';
import {
  Shield,
  Sparkles,
  Send,
  Clock,
  Phone,
  AlertCircle,
  ShoppingBag,
  History,
  RotateCcw,
  Image as ImageIcon,
  Calendar,
  X,
  CheckCircle,
  XCircle,
  MapPin,
  Receipt,
  XSquare,
  Bike,
  CheckCircle2,
  MessageSquare,
  Download,
  FileDown,
  Star,
} from 'lucide-react';
import { LiveChatModal } from './LiveChatModal';
import { OrderStatusTracker } from './OrderStatusTracker';
import { DriverRatingModal } from './DriverRatingModal';
import { getChats } from '../utils/storage';

interface CustomerDashboardProps {
  currentUser: User;
  tariff: TariffConfig;
  activeOrders: Order[];
  onOpenProfileModal: () => void;
  onRefreshOrders: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  tariff,
  activeOrders,
  onOpenProfileModal,
  onRefreshOrders,
}) => {
  const [selectedService, setSelectedService] = useState<ServiceType>('OJEK');

  // Map Coordinates (Default: Pasar Kertosono)
  const [pickupCoord, setPickupCoord] = useState<LocationCoord>({
    lat: -7.5925,
    lng: 112.1008,
    name: 'Pasar Kertosono, Jl. Gatot Subroto',
  });
  const [dropoffCoord, setDropoffCoord] = useState<LocationCoord>({
    lat: -7.5810,
    lng: 112.1110,
    name: 'Jl. Raya Kertosono - Jombang No. 45',
  });

  const [pickupText, setPickupText] = useState('Pasar Kertosono');
  const [dropoffText, setDropoffText] = useState('Jl. Raya Kertosono - Jombang No. 45');
  const [notes, setNotes] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order History Filter & Receipt Modal State
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'SELESAI' | 'BATAL'>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<{ photo: string; orderId: string; amount?: number } | null>(null);
  const [reorderNotice, setReorderNotice] = useState<string | null>(null);

  // Driver Found Notification Popup Modal State
  const [driverFoundModalData, setDriverFoundModalData] = useState<{
    driverName: string;
    driverPlat: string;
    driverPhoto: string;
    driverPhone: string;
    orderId: string;
  } | null>(null);

  // Track previous driverId to trigger notification popup as soon as driver takes the order!
  const prevDriverIdRef = useRef<string | null>(null);

  // Active Live Chat Modal State
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);

  // Active Driver Rating Modal State
  const [ratingModalOrder, setRatingModalOrder] = useState<Order | null>(null);

  const handleDownloadInvoice = (order: Order) => {
    const totalSemua = (order.grandTotalCash || ((order.receiptAmount || 0) + order.totalOngkir));
    const content = `================================================
OJEK SERBA BISA - MAS TOLONG MAS SOLUSINYA!!!
Wilayah: Kertosono - Jombang & Seluruh Jawa Timur
================================================
BUKTI RESMI TRANSAKSI & PEMBAYARAN
------------------------------------------------
No. Pesanan     : ${order.id}
Waktu Transaksi : ${new Date(order.createdAt).toLocaleString('id-ID')}
Layanan         : ${order.serviceType}
Status Pesanan  : ${order.status}
------------------------------------------------
DATA PELANGGAN:
Nama Pelanggan  : ${order.customerName}
Kontak          : ${order.customerPhone}

DATA MITRA DRIVER:
Nama Driver     : ${order.driverName || 'Belum ditugaskan'}
Nomor Plat Motor: ${order.driverPlat || '-'}
------------------------------------------------
RUTE PENGANTARAN:
Titik Jemput    : ${order.pickupAddress}
Titik Tujuan    : ${order.dropoffAddress}
Jarak Rute Jalan: ${order.distanceKm} KM
${order.notes ? `Catatan Khusus  : ${order.notes}\n` : ''}------------------------------------------------
RINCIAN BIAYA & TARIF:
Ongkir Dasar    : Rp ${order.baseOngkir.toLocaleString('id-ID')}
Diskon Voucher  : -Rp ${order.voucherDiscount.toLocaleString('id-ID')}
Total Ongkos    : Rp ${order.totalOngkir.toLocaleString('id-ID')}
${order.receiptAmount ? `Biaya Belanja   : Rp ${order.receiptAmount.toLocaleString('id-ID')}\n` : ''}------------------------------------------------
TOTAL DIBAYAR   : Rp ${totalSemua.toLocaleString('id-ID')}
Metode Bayar    : Tunai (Cash on Delivery)
================================================
Aplikasi PWA Ojek Serba Bisa Mas Tolong
Terima kasih telah mempercayai layanan kami!
================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Struk-OjekSerbaBisa-${order.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Real Road Distance from Road Routing Engine (Following Roads, not straight lines)
  const [roadDistanceKm, setRoadDistanceKm] = useState<number>(2.4);
  const [roadDurationMin, setRoadDurationMin] = useState<number>(6);

  // Haversine Straight-line Distance Fallback (km)
  const estimatedDistance = useMemo(() => {
    const R = 6371; // Earth radius in km
    const dLat = ((dropoffCoord.lat - pickupCoord.lat) * Math.PI) / 180;
    const dLon = ((dropoffCoord.lng - pickupCoord.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickupCoord.lat * Math.PI) / 180) *
        Math.cos((dropoffCoord.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return Math.max(0.6, parseFloat(dist.toFixed(1)));
  }, [pickupCoord, dropoffCoord]);

  // Fare Calculation based on REAL ROAD DISTANCE (ikut alur jalan raya)
  const { baseOngkir, finalOngkir } = useMemo(() => {
    let ongkir = 0;
    const actualKm = roadDistanceKm > 0 ? roadDistanceKm : estimatedDistance;
    if (actualKm <= 3) {
      ongkir = tariff.minTariff;
    } else {
      const extraKm = Math.ceil(actualKm - 3);
      ongkir = tariff.minTariff + extraKm * tariff.ratePerKm;
    }

    if (selectedService === 'SHOP') {
      ongkir += tariff.jastipFee;
    }

    const discount = appliedVoucher ? appliedVoucher.discount : 0;
    const finalVal = Math.max(1000, ongkir - discount);

    return {
      baseOngkir: ongkir,
      finalOngkir: finalVal,
    };
  }, [roadDistanceKm, estimatedDistance, tariff, selectedService, appliedVoucher]);

  // Current active order for this user
  const currentActiveOrder = activeOrders.find(
    (o) =>
      (o.customerId === currentUser.id || o.customerPhone === currentUser.phone) &&
      (o.status === 'MENCARI_DRIVER' ||
        o.status === 'DITERIMA' ||
        o.status === 'SEDANG_DIJALANKAN')
  );

  // Detect Driver Found in Real-Time!
  useEffect(() => {
    if (currentActiveOrder && currentActiveOrder.driverId) {
      // If we just got a driver assigned that wasn't there before
      if (prevDriverIdRef.current !== currentActiveOrder.driverId) {
        prevDriverIdRef.current = currentActiveOrder.driverId;
        setDriverFoundModalData({
          driverName: currentActiveOrder.driverName || 'Mitra Driver Mas Tolong',
          driverPlat: currentActiveOrder.driverPlat || 'AG ---- XX',
          driverPhoto:
            currentActiveOrder.driverPhoto ||
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          driverPhone: currentActiveOrder.driverPhone || '',
          orderId: currentActiveOrder.id,
        });

        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 70,
            spread: 50,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }
    } else {
      prevDriverIdRef.current = null;
    }
  }, [currentActiveOrder]);

  // Filter Completed & Past Orders for this Customer
  const myPastOrders = useMemo(() => {
    return activeOrders
      .filter((o) => {
        const isMine = o.customerId === currentUser.id || o.customerPhone === currentUser.phone;
        if (!isMine) return false;
        if (historyFilter === 'ALL') {
          return o.status === 'SELESAI' || o.status === 'BATAL';
        }
        return o.status === historyFilter;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeOrders, currentUser, historyFilter]);

  // Counts for Tabs
  const counts = useMemo(() => {
    const mine = activeOrders.filter(
      (o) => o.customerId === currentUser.id || o.customerPhone === currentUser.phone
    );
    return {
      all: mine.filter((o) => o.status === 'SELESAI' || o.status === 'BATAL').length,
      completed: mine.filter((o) => o.status === 'SELESAI').length,
      canceled: mine.filter((o) => o.status === 'BATAL').length,
    };
  }, [activeOrders, currentUser]);

  const handleApplyVoucher = () => {
    setVoucherError(null);
    setVoucherSuccess(null);
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;

    const vouchers = getVouchers();
    const found = vouchers.find((v) => v.code === code && v.active);

    if (found) {
      setAppliedVoucher(found);
      setVoucherSuccess(`Voucher ${found.code} aktif! Hemat Rp ${found.discount.toLocaleString('id-ID')}`);
    } else {
      setVoucherError('Kode voucher tidak valid atau sudah kedaluwarsa.');
      setAppliedVoucher(null);
    }
  };

  const handleSubmitOrder = () => {
    if (!pickupText.trim() || !dropoffText.trim()) {
      alert('Silakan masukkan lokasi penjemputan dan tujuan pengantaran.');
      return;
    }

    setIsSubmitting(true);
    const allOrders = getOrders();

    const newOrder: Order = {
      id: `MT-${Date.now().toString().slice(-5)}`,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      serviceType: selectedService,
      pickupAddress: pickupText,
      dropoffAddress: dropoffText,
      pickupLat: pickupCoord.lat,
      pickupLng: pickupCoord.lng,
      dropoffLat: dropoffCoord.lat,
      dropoffLng: dropoffCoord.lng,
      notes: notes.trim(),
      distanceKm: roadDistanceKm > 0 ? roadDistanceKm : estimatedDistance,
      baseOngkir: baseOngkir,
      voucherDiscount: appliedVoucher ? appliedVoucher.discount : 0,
      totalOngkir: finalOngkir,
      status: 'MENCARI_DRIVER',
      createdAt: new Date().toISOString(),
    };

    saveOrders([newOrder, ...allOrders]);
    setIsSubmitting(false);
    onRefreshOrders();
  };

  const handleCancelOrder = (orderId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return;
    const allOrders = getOrders();
    const updated = allOrders.map((o) =>
      o.id === orderId ? { ...o, status: 'BATAL' as const } : o
    );
    saveOrders(updated);
    onRefreshOrders();
  };

  const handleReorder = (order: Order) => {
    setSelectedService(order.serviceType);
    setPickupText(order.pickupAddress);
    setDropoffText(order.dropoffAddress);
    setPickupCoord({ lat: order.pickupLat, lng: order.pickupLng, name: order.pickupAddress });
    setDropoffCoord({ lat: order.dropoffLat, lng: order.dropoffLng, name: order.dropoffAddress });
    setNotes(order.notes || '');

    setReorderNotice(`Rute dari ${order.id} berhasil dimuat kembali ke formulir pemesanan!`);
    setTimeout(() => setReorderNotice(null), 5000);

    // Smooth scroll to booking card
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const formatOrderDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getServiceLabel = (type: ServiceType) => {
    switch (type) {
      case 'OJEK':
        return { icon: '🛵', label: 'Ojek Motor', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'EXPRESS':
        return { icon: '📦', label: 'Express Kirim', badgeBg: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'FOOD':
        return { icon: '🍜', label: 'Jastip Kuliner', badgeBg: 'bg-orange-100 text-orange-900 border-orange-300' };
      case 'SHOP':
        return { icon: '🛒', label: 'Jastip Pasar', badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 p-4 rounded-2xl shadow-lg text-white flex justify-between items-center border border-blue-500/30">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-200">
            Pelanggan Setia Ojek Serba Bisa
          </p>
          <h3 className="text-base font-black leading-tight text-white">
            Halo, {currentUser.name}!
          </h3>
          <p className="text-[11px] font-medium text-blue-100">
            Kertosono - Jombang &amp; Seluruh Jawa Timur
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenProfileModal}
          className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-xl font-black border border-white/20 shadow-sm transition flex items-center space-x-1 cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-blue-200" />
          <span>Pengaturan Akun</span>
        </button>
      </div>

      {/* Reorder Notification Toast */}
      {reorderNotice && (
        <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-xs font-bold text-blue-950 shadow-md flex items-center space-x-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{reorderNotice}</span>
        </div>
      )}

      {/* 1. Real-time Order Status Tracking View on Customer Dashboard */}
      {currentActiveOrder && (
        <div className="space-y-3">
          <OrderStatusTracker
            order={currentActiveOrder}
            currentUser={currentUser}
            onOpenLiveChat={() => setActiveChatOrder(currentActiveOrder)}
            onCancelOrder={
              currentActiveOrder.status === 'MENCARI_DRIVER'
                ? () => handleCancelOrder(currentActiveOrder.id)
                : undefined
            }
            onRateDriver={() => setRatingModalOrder(currentActiveOrder)}
            onDownloadInvoice={() => handleDownloadInvoice(currentActiveOrder)}
          />

          {/* Real-time Jastip Receipt Display */}
          {currentActiveOrder.receiptPhoto && (
            <div className="bg-blue-50/70 border-2 border-blue-300 p-3.5 rounded-2xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center">
                <p className="text-xs font-black text-blue-950 flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-1 text-blue-600" />
                  <span>📸 Foto Struk Belanja dari Driver:</span>
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedReceipt({
                      photo: currentActiveOrder.receiptPhoto!,
                      orderId: currentActiveOrder.id,
                      amount: currentActiveOrder.receiptAmount,
                    })
                  }
                  className="text-[11px] font-bold text-blue-700 hover:underline flex items-center cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3 mr-0.5" />
                  <span>Perbesar Struk</span>
                </button>
              </div>
              <img
                src={currentActiveOrder.receiptPhoto}
                alt="Struk Belanja Jastip"
                onClick={() =>
                  setSelectedReceipt({
                    photo: currentActiveOrder.receiptPhoto!,
                    orderId: currentActiveOrder.id,
                    amount: currentActiveOrder.receiptAmount,
                  })
                }
                className="w-full max-h-52 object-contain rounded-xl border border-blue-300 bg-black/5 cursor-pointer hover:opacity-95 transition"
              />
              <div className="bg-blue-900 border-2 border-blue-950 p-3 rounded-xl text-center space-y-0.5 text-white">
                <span className="text-[11px] font-extrabold block text-blue-200 uppercase">
                  TOTAL CASH BAYAR DI TEMPAT (Barang + Ongkir):
                </span>
                <span className="text-xl font-black text-white">
                  Rp {(currentActiveOrder.grandTotalCash || (currentActiveOrder.receiptAmount || 0) + currentActiveOrder.totalOngkir).toLocaleString('id-ID')}
                </span>
                <p className="text-[10px] text-blue-200 font-bold">
                  (Rincian: Belanjaan Rp {(currentActiveOrder.receiptAmount || 0).toLocaleString('id-ID')} + Ongkir Rp {currentActiveOrder.totalOngkir.toLocaleString('id-ID')})
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Service Selection Cards */}
      <div className="card-ui bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h4 className="font-black text-sm mb-3 text-slate-900 flex items-center justify-between">
          <span>Pilih Layanan Transportasi &amp; Jastip:</span>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Tarif Transparan
          </span>
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {/* Ojek */}
          <button
            type="button"
            onClick={() => setSelectedService('OJEK')}
            className={`p-2.5 rounded-xl flex flex-col items-center justify-center transition border-2 cursor-pointer ${
              selectedService === 'OJEK'
                ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <span className="text-2xl mb-1">🛵</span>
            <span className="text-[11px] font-black text-slate-900">Ojek Motor</span>
            <span className="text-[9px] text-slate-500 font-semibold">Cepat &amp; Murah</span>
          </button>

          {/* Express Kirim */}
          <button
            type="button"
            onClick={() => setSelectedService('EXPRESS')}
            className={`p-2.5 rounded-xl flex flex-col items-center justify-center transition border-2 cursor-pointer ${
              selectedService === 'EXPRESS'
                ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <span className="text-2xl mb-1">📦</span>
            <span className="text-[11px] font-black text-slate-900">Express Kirim</span>
            <span className="text-[9px] text-slate-500 font-semibold">Antar Paket</span>
          </button>

          {/* Jastip Kuliner */}
          <button
            type="button"
            onClick={() => setSelectedService('FOOD')}
            className={`p-2.5 rounded-xl flex flex-col items-center justify-center transition border-2 cursor-pointer ${
              selectedService === 'FOOD'
                ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <span className="text-2xl mb-1">🍜</span>
            <span className="text-[11px] font-black text-slate-900">Jastip Kuliner</span>
            <span className="text-[9px] text-slate-500 font-semibold">Makanan Enak</span>
          </button>

          {/* Jastip Pasar */}
          <button
            type="button"
            onClick={() => setSelectedService('SHOP')}
            className={`p-2.5 rounded-xl flex flex-col items-center justify-center transition border-2 cursor-pointer ${
              selectedService === 'SHOP'
                ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <span className="text-2xl mb-1">🛒</span>
            <span className="text-[11px] font-black text-slate-900">Jastip Pasar</span>
            <span className="text-[9px] text-slate-500 font-semibold">Belanja Sayur</span>
          </button>
        </div>
      </div>

      {/* 3. Address & Tariff Calculation Card with Google Maps Jawa Timur Autocomplete */}
      <div className="card-ui bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3.5">
        <div className="text-xs bg-blue-50/80 border-l-4 border-blue-600 text-blue-950 p-2.5 rounded-r-xl">
          <strong>🛵 Skema Tarif Ojek Serba Bisa:</strong>
          <br />• Minimum 0 - 3 km pertama: <strong>Rp {tariff.minTariff.toLocaleString('id-ID')}</strong>
          <br />• Di atas 3 km: <strong>+Rp {tariff.ratePerKm.toLocaleString('id-ID')} / km</strong>
          {selectedService === 'SHOP' && (
            <div className="mt-1 pt-1 border-t border-blue-200 text-blue-900 font-black">
              🛒 Jastip Belanja Pasar / Sembako: <strong>+Rp {tariff.jastipFee.toLocaleString('id-ID')}</strong> (Antre &amp; Belanja)
            </div>
          )}
        </div>

        {/* East Java Google Maps Autocomplete for Pickup */}
        <EastJavaAddressInput
          label="📍 Titik Penjemputan / Nama Toko Warung"
          value={pickupText}
          icon="📍"
          placeholder="Ketik alamat atau kota di Jawa Timur (Kertosono, Jombang, Surabaya, dll)..."
          onChange={setPickupText}
          onSelectLocation={(loc) => {
            setPickupCoord({ lat: loc.lat, lng: loc.lng, name: loc.name });
            setPickupText(loc.name);
          }}
        />

        {/* East Java Google Maps Autocomplete for Dropoff */}
        <EastJavaAddressInput
          label="🎯 Titik Pengantaran / Tujuan Anda"
          value={dropoffText}
          icon="🎯"
          placeholder="Ketik alamat tujuan atau kota di Jawa Timur..."
          onChange={setDropoffText}
          onSelectLocation={(loc) => {
            setDropoffCoord({ lat: loc.lat, lng: loc.lng, name: loc.name });
            setDropoffText(loc.name);
          }}
        />

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1">
            📝 Catatan / Rincian Belanjaan (Opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={
              selectedService === 'SHOP'
                ? 'Contoh: Beli beras 5kg & minyakita di Pasar Kertosono Blok C'
                : 'Patokan rumah pagar hitam, depan masjid...'
            }
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Interactive Google Maps Jawa Timur Map */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-black text-slate-700">Peta Rute Google Maps Jawa Timur:</span>
            <span className="text-[10px] text-slate-500 font-semibold">Tarik pin atau klik lokasi</span>
          </div>
          <LeafletMap
            pickup={pickupCoord}
            dropoff={dropoffCoord}
            onPickupChange={(coords) => {
              setPickupCoord(coords);
              if (coords.name) setPickupText(coords.name);
            }}
            onDropoffChange={(coords) => {
              setDropoffCoord(coords);
              if (coords.name) setDropoffText(coords.name);
            }}
            onRouteCalculated={(route) => {
              setRoadDistanceKm(route.distanceKm);
              setRoadDurationMin(route.durationMinutes);
            }}
          />
        </div>

        {/* Promo Voucher Input */}
        <div className="space-y-1">
          <div className="flex space-x-2">
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value)}
              placeholder="KODE PROMO (mis: MASTOLONG, HEMAT2K)"
              className="uppercase px-3 py-2 border border-slate-300 rounded-xl text-xs flex-1 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
            />
            <button
              type="button"
              onClick={handleApplyVoucher}
              className="bg-blue-700 hover:bg-blue-800 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow cursor-pointer"
            >
              Klaim
            </button>
          </div>
          {voucherSuccess && (
            <p className="text-[11px] font-bold text-emerald-700">{voucherSuccess}</p>
          )}
          {voucherError && (
            <p className="text-[11px] font-bold text-red-600">{voucherError}</p>
          )}
        </div>

        {/* Billing Box (Blue High-Contrast) - Calculated from Real Road Network Distance */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white p-3.5 rounded-2xl flex justify-between items-center shadow-md border-2 border-blue-500">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-black text-blue-200">
              Estimasi Total Ongkir (Jalur Jalan Raya):
            </p>
            <p className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
              <span>🛣️ Jarak Jalan: <strong>{roadDistanceKm} km</strong></span>
              <span className="text-blue-200 font-bold">(~{roadDurationMin} mnt)</span>
            </p>
            {appliedVoucher && (
              <p className="text-[10px] text-emerald-300 font-extrabold mt-0.5">
                Diskon Voucher: -Rp {appliedVoucher.discount.toLocaleString('id-ID')}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white tracking-tight">
              Rp {finalOngkir.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* DYNAMIC ACTION BUTTON:
            If user has an active order searching for driver (or in progress),
            the button IMMEDIATELY transforms into CANCEL ORDER! */}
        {currentActiveOrder && currentActiveOrder.status === 'MENCARI_DRIVER' ? (
          <div className="space-y-1.5 animate-fade-in">
            <button
              type="button"
              onClick={() => handleCancelOrder(currentActiveOrder.id)}
              className="w-full bg-red-600 hover:bg-red-700 font-black text-white py-3.5 rounded-2xl shadow-xl text-sm tracking-wide uppercase transition flex items-center justify-center space-x-2 border-2 border-red-800 active:scale-[0.99] cursor-pointer"
            >
              <XSquare className="w-5 h-5 text-white" />
              <span>⚠️ BATALKAN PESANAN (CANCEL)</span>
            </button>
            <p className="text-center text-[11px] font-bold text-blue-800 animate-pulse">
              Sedang mencari driver terdekat... Klik tombol merah di atas jika ingin membatalkan.
            </p>
          </div>
        ) : currentActiveOrder && (currentActiveOrder.status === 'DITERIMA' || currentActiveOrder.status === 'SEDANG_DIJALANKAN') ? (
          <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-2xl text-center space-y-1">
            <span className="text-xs font-black text-emerald-900 block">
              ✅ Driver Sedang Mengerjakan Pesanan Anda!
            </span>
            <p className="text-[11px] text-slate-600">
              Driver: <strong>{currentActiveOrder.driverName}</strong> (Plat: {currentActiveOrder.driverPlat})
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 font-black text-white py-3.5 rounded-2xl shadow-lg text-sm tracking-wide uppercase transition flex items-center justify-center space-x-2 border-2 border-blue-700 active:scale-[0.99] cursor-pointer"
          >
            <Send className="w-4 h-4 text-white" />
            <span>🚀 PESAN OJEK SERBA BISA SEKARANG</span>
          </button>
        )}
      </div>

      {/* ==================== 4. ORDER HISTORY SECTION ==================== */}
      <section className="card-ui bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3.5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-100 text-amber-900 rounded-xl">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 leading-tight">
                Riwayat Pesanan Saya
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Transaksi lampau, status selesai, &amp; struk belanja jastip
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200">
            {myPastOrders.length} Pesanan
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setHistoryFilter('ALL')}
            className={`flex-1 py-1.5 rounded-lg transition text-center ${
              historyFilter === 'ALL'
                ? 'bg-white text-slate-950 font-black shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            Semua ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setHistoryFilter('SELESAI')}
            className={`flex-1 py-1.5 rounded-lg transition text-center ${
              historyFilter === 'SELESAI'
                ? 'bg-emerald-600 text-white font-black shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            Selesai ({counts.completed})
          </button>
          <button
            type="button"
            onClick={() => setHistoryFilter('BATAL')}
            className={`flex-1 py-1.5 rounded-lg transition text-center ${
              historyFilter === 'BATAL'
                ? 'bg-red-600 text-white font-black shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            Dibatalkan ({counts.canceled})
          </button>
        </div>

        {/* Order History Items */}
        {myPastOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-1.5">
            <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-xl">
              📦
            </div>
            <p className="text-xs font-bold text-slate-600">Belum ada riwayat transaksi pada kategori ini</p>
            <p className="text-[11px] text-slate-400">
              Semua orderan yang selesai atau dibatalkan akan otomatis tercatat di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myPastOrders.map((ord) => {
              const srv = getServiceLabel(ord.serviceType);
              const isCompleted = ord.status === 'SELESAI';
              const isCanceled = ord.status === 'BATAL';

              return (
                <div
                  key={ord.id}
                  className="p-3.5 border border-slate-200 rounded-2xl bg-white hover:border-amber-300 hover:shadow-md transition space-y-2.5"
                >
                  {/* Item Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{srv.icon}</span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${srv.badgeBg}`}>
                            {srv.label}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-500">
                            #{ord.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium flex items-center mt-0.5">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          <span>{formatOrderDate(ord.createdAt)}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isCanceled
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {isCompleted && <CheckCircle className="w-3 h-3 mr-0.5" />}
                      {isCanceled && <XCircle className="w-3 h-3 mr-0.5" />}
                      <span>{ord.status}</span>
                    </span>
                  </div>

                  {/* Route Addresses */}
                  <div className="text-xs space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700">
                    <div className="flex items-start space-x-1.5">
                      <span className="text-emerald-600 font-bold shrink-0 mt-0.5">📍</span>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">
                          Titik Jemput:
                        </span>
                        <span className="font-semibold text-slate-900 leading-tight block">
                          {ord.pickupAddress}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-1.5 pt-1 border-t border-slate-200">
                      <span className="text-red-500 font-bold shrink-0 mt-0.5">🎯</span>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">
                          Tujuan Pengantaran:
                        </span>
                        <span className="font-semibold text-slate-900 leading-tight block">
                          {ord.dropoffAddress}
                        </span>
                      </div>
                    </div>

                    {ord.notes && (
                      <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-600">
                        <span className="font-bold text-slate-500">Catatan:</span> {ord.notes}
                      </div>
                    )}
                  </div>

                  {/* Driver Info if completed */}
                  {ord.driverName && (
                    <div className="flex items-center justify-between text-xs bg-slate-100/70 px-2.5 py-1.5 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <img
                          src={
                            ord.driverPhoto ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={ord.driverName}
                          className="w-6 h-6 rounded-full object-cover border border-slate-300"
                        />
                        <span className="font-bold text-slate-800">
                          Driver: {ord.driverName} ({ord.driverPlat || 'AG ---- XX'})
                        </span>
                      </div>
                      {ord.driverPhone && (
                        <a
                          href={`https://wa.me/${ord.driverPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center"
                        >
                          <Phone className="w-2.5 h-2.5 mr-0.5" />
                          <span>Hubungi</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Jastip Receipt Preview if available */}
                  {ord.receiptPhoto && (
                    <div className="p-2.5 bg-yellow-50/70 border border-yellow-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={ord.receiptPhoto}
                          alt="Struk Belanja"
                          onClick={() =>
                            setSelectedReceipt({
                              photo: ord.receiptPhoto!,
                              orderId: ord.id,
                              amount: ord.receiptAmount,
                            })
                          }
                          className="w-12 h-12 object-cover rounded-lg border border-yellow-400 bg-white cursor-pointer hover:opacity-90 transition"
                        />
                        <div>
                          <span className="text-[10px] font-black text-amber-900 uppercase block">
                            📸 Struk Nota Belanja Pasar:
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            Rp {(ord.receiptAmount || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedReceipt({
                            photo: ord.receiptPhoto!,
                            orderId: ord.id,
                            amount: ord.receiptAmount,
                          })
                        }
                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1.5 rounded-lg shadow-sm transition"
                      >
                        Lihat Nota
                      </button>
                    </div>
                  )}

                  {/* Price & Action Row */}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">
                        {ord.receiptAmount ? 'Total Cash COD (Belanjaan + Ongkir):' : 'Total Ongkir:'}
                      </span>
                      <span className="text-sm font-black text-slate-950">
                        Rp {((ord.grandTotalCash || (ord.receiptAmount || 0) + ord.totalOngkir)).toLocaleString('id-ID')}
                      </span>
                      {ord.voucherDiscount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 block">
                          Hemat Voucher: -Rp {ord.voucherDiscount.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      {ord.status === 'SELESAI' && ord.driverId && (
                        <button
                          type="button"
                          onClick={() => setRatingModalOrder(ord)}
                          title="Beri penilaian bintang dan ulasan driver"
                          className={`font-black text-[11px] px-2.5 py-1.5 rounded-lg border flex items-center space-x-1 transition active:scale-95 cursor-pointer ${
                            ord.rating
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                              : 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${ord.rating ? 'fill-amber-500 text-amber-500' : 'fill-slate-950'}`} />
                          <span>{ord.rating ? `${ord.rating} ★ (Ubah)` : '⭐ Nilai Driver'}</span>
                        </button>
                      )}

                      {ord.driverId && (
                        <button
                          type="button"
                          onClick={() => setActiveChatOrder(ord)}
                          title="Lihat riwayat obrolan dengan driver"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] px-2 py-1.5 rounded-lg border border-blue-200 flex items-center space-x-1 transition"
                        >
                          <MessageSquare className="w-3 h-3 text-blue-600" />
                          <span>Chat</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(ord)}
                        title="Unduh berkas struk resmi transaksi"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-2 py-1.5 rounded-lg border border-slate-300 flex items-center space-x-1 transition"
                      >
                        <Download className="w-3 h-3 text-slate-600" />
                        <span>Struk</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReorder(ord)}
                        className="bg-slate-900 hover:bg-black text-amber-300 font-black text-xs px-2.5 py-1.5 rounded-xl shadow transition flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-400" />
                        <span>Pesan Lagi</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==================== 5. MODAL NOTIFIKASI DRIVER DITEMUKAN ==================== */}
      {driverFoundModalData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl border-4 border-blue-600 text-center relative overflow-hidden">
            {/* Header Ribbon */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 -mx-5 -mt-5 py-3 px-4 border-b border-blue-500/30 flex items-center justify-center space-x-2 text-white">
              <span className="text-xl">🎉</span>
              <h4 className="font-black text-base text-white tracking-tight uppercase">
                DRIVER DITEMUKAN!
              </h4>
            </div>

            {/* Driver Profile Section */}
            <div className="pt-2 flex flex-col items-center">
              <div className="relative">
                <img
                  src={driverFoundModalData.driverPhoto}
                  alt={driverFoundModalData.driverName}
                  className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover shadow-xl bg-slate-100"
                />
                <span className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-2 border-white">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>

              <h3 className="font-black text-lg text-slate-950 mt-3 leading-tight">
                {driverFoundModalData.driverName}
              </h3>

              <div className="mt-1.5 inline-flex items-center space-x-1.5 bg-blue-900 text-white px-3.5 py-1 rounded-full font-mono font-black text-sm shadow">
                <Bike className="w-4 h-4 text-blue-200" />
                <span>PLAT: {driverFoundModalData.driverPlat}</span>
              </div>

              <p className="text-xs text-slate-600 mt-2 font-medium px-2">
                Mitra Driver sedang bergerak menuju titik penjemputan Anda dengan motor resmi Ojek Serba Bisa!
              </p>
            </div>

            {/* In-App Live Chat Action Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = activeOrders.find((o) => o.id === driverFoundModalData.orderId) || currentActiveOrder;
                  if (target) {
                    setActiveChatOrder(target);
                  }
                  setDriverFoundModalData(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black py-3.5 rounded-2xl shadow-lg text-xs uppercase tracking-wide transition flex items-center justify-center space-x-2 border-2 border-blue-500"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>💬 BUKA LIVE CHAT DENGAN DRIVER SEKARANG</span>
              </button>

              <button
                type="button"
                onClick={() => setDriverFoundModalData(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-2.5 rounded-2xl text-xs uppercase transition"
              >
                TUTUP &amp; PANTAU STATUS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Receipt Modal Viewer */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 space-y-3 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h5 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <span>Struk Belanja #{selectedReceipt.orderId}</span>
                </h5>
                {selectedReceipt.amount && (
                  <p className="text-xs font-bold text-emerald-700">
                    Nominal Nota: Rp {selectedReceipt.amount.toLocaleString('id-ID')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl overflow-hidden p-1 flex items-center justify-center">
              <img
                src={selectedReceipt.photo}
                alt="Foto Struk Nota"
                className="w-full max-h-96 object-contain rounded-lg"
              />
            </div>

            <div className="flex space-x-2">
              <a
                href={selectedReceipt.photo}
                download={`Struk-${selectedReceipt.orderId}.jpg`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Struk</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 bg-slate-900 hover:bg-black text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wide transition shadow"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time In-App Live Chat Modal */}
      {activeChatOrder && (
        <LiveChatModal
          order={activeChatOrder}
          currentUser={currentUser}
          onClose={() => setActiveChatOrder(null)}
        />
      )}

      {/* Driver Rating & Review Modal */}
      {ratingModalOrder && (
        <DriverRatingModal
          order={ratingModalOrder}
          currentUser={currentUser}
          onClose={() => setRatingModalOrder(null)}
          onRatingSubmitted={() => {
            onRefreshOrders();
          }}
        />
      )}
    </div>
  );
};
