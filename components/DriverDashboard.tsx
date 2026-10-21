import React, { useState, useEffect, useRef } from 'react';
import { User, Order, TariffConfig } from '../types';
import {
  saveOrders,
  getOrders,
  saveUsers,
  getUsers,
  addCommission,
  sendChatMessage,
  updateOrderTrackingStage,
  subscribeToDataChanges,
} from '../utils/storage';
import { LeafletMap, LocationCoord } from './LeafletMap';
import { playOrderIncomingVoice, unlockAudioEngine } from '../utils/audioAlert';
import confetti from 'canvas-confetti';
import {
  MapPin,
  Navigation,
  Phone,
  CheckCircle2,
  ShoppingBag,
  Settings,
  Wallet,
  DollarSign,
  TrendingUp,
  Sparkles,
  Compass,
  Footprints,
  Volume2,
  Receipt,
  MessageSquare,
  Download,
  Star,
  Bike,
  X,
  ShieldCheck,
} from 'lucide-react';
import { LiveChatModal } from './LiveChatModal';

interface DriverDashboardProps {
  currentUser: User;
  tariff: TariffConfig;
  activeOrders: Order[];
  onOpenProfileModal: () => void;
  onRefreshOrders: () => void;
  onUpdateCurrentUser: (updatedUser: User) => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  currentUser,
  tariff,
  activeOrders,
  onOpenProfileModal,
  onRefreshOrders,
  onUpdateCurrentUser,
}) => {
  const [strukFile, setStrukFile] = useState<string>('');
  const [strukAmount, setStrukAmount] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);

  // Rejected orders by this driver (X button)
  const [rejectedOrderIds, setRejectedOrderIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`mas_tolong_rejected_${currentUser.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const handleDownloadDriverReceipt = (order: Order) => {
    const receiptNum = order.receiptAmount || (strukAmount ? parseInt(strukAmount, 10) : 0);
    const totalCash = order.grandTotalCash || order.totalOngkir + receiptNum;
    const content = `================================================
OJEK SERBA BISA - MAS TOLONG MAS SOLUSINYA!!!
BUKTI PENAGIHAN CASH DRIVER
Wilayah: Kertosono - Jombang & Seluruh Jawa Timur
================================================
No. Order       : ${order.id}
Nama Driver     : ${currentUser.name} (${currentUser.platMotor || 'Mitra Driver'})
Nama Pelanggan  : ${order.customerName}
Tanggal         : ${new Date().toLocaleString('id-ID')}
------------------------------------------------
RINCIAN TAGIHAN:
Biaya Ongkos    : Rp ${order.totalOngkir.toLocaleString('id-ID')}
${receiptNum > 0 ? `Nominal Struk   : Rp ${receiptNum.toLocaleString('id-ID')}\n` : ''}------------------------------------------------
TOTAL DITERIMA  : Rp ${totalCash.toLocaleString('id-ID')}
================================================
Aplikasi PWA Ojek Serba Bisa Mas Tolong
================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tagihan-Cash-${order.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Active order currently taken by this driver
  const myCurrentOrder = activeOrders.find(
    (o) =>
      o.driverId === currentUser.id &&
      (o.status === 'DITERIMA' || o.status === 'SEDANG_DIJALANKAN')
  );

  // Simulated / Live GPS Location for the Driver
  const [driverGps, setDriverGps] = useState<LocationCoord>({
    lat: -7.596,
    lng: 112.1025,
    name: `Posisi GPS ${currentUser.name}`,
  });

  // Radar orders waiting for drivers, excluding rejected by this driver
  const pendingOrders = activeOrders.filter(
    (o) => o.status === 'MENCARI_DRIVER' && !rejectedOrderIds.includes(o.id)
  );

  // Audio voice alarm trigger when a new order arrives on radar
  const knownOrderIdsRef = useRef<Set<string>>(new Set(pendingOrders.map((o) => o.id)));

  // Real-time audio trigger on new order arrival
  useEffect(() => {
    const newArrivals = pendingOrders.filter((o) => !knownOrderIdsRef.current.has(o.id));
    if (newArrivals.length > 0) {
      unlockAudioEngine();
      playOrderIncomingVoice();
      setActionMessage('🚨 Orderan baru masuk ke radar! Segera ambil pesanan!');
    }
    knownOrderIdsRef.current = new Set(pendingOrders.map((o) => o.id));
  }, [pendingOrders]);

  // Polling fallback every 2.5s to ensure instant detection even across windows / tabs
  useEffect(() => {
    const interval = setInterval(() => {
      const all = getOrders();
      const freshPending = all.filter(
        (o) => o.status === 'MENCARI_DRIVER' && !rejectedOrderIds.includes(o.id)
      );
      const newArrivals = freshPending.filter((o) => !knownOrderIdsRef.current.has(o.id));
      if (newArrivals.length > 0) {
        unlockAudioEngine();
        playOrderIncomingVoice();
        newArrivals.forEach((o) => knownOrderIdsRef.current.add(o.id));
        onRefreshOrders();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [rejectedOrderIds, onRefreshOrders]);

  // Handle rejecting an order (Tanda X)
  const handleRejectOrder = (orderId: string) => {
    const updated = [...rejectedOrderIds, orderId];
    setRejectedOrderIds(updated);
    try {
      localStorage.setItem(`mas_tolong_rejected_${currentUser.id}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setActionMessage(`❌ Pesanan #${orderId} telah ditolak dari radar Anda.`);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Audio Test Button Handler
  const handleTestAudio = () => {
    unlockAudioEngine();
    playOrderIncomingVoice();
    setActionMessage('📢 Memutar suara kencang: Mas Tolong Mas! Ada order masuk nihhhhh!');
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Instant simulation of an incoming order to test the loud voice alarm
  const handleSimulateNewOrder = () => {
    unlockAudioEngine();
    const simOrder: Order = {
      id: `MT-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: '081234567890',
      customerName: 'Budi Santoso',
      customerPhone: '081234567890',
      serviceType: 'OJEK',
      pickupAddress: 'Stasiun Kertosono, Pintu Keluar Timur',
      dropoffAddress: 'RSUD Kertosono, Jl. Panglima Sudirman No. 16',
      pickupLat: -7.5955,
      pickupLng: 112.103,
      dropoffLat: -7.588,
      dropoffLng: 112.095,
      notes: 'Tolong bawa helm SNI bersih ya mas.',
      distanceKm: 1.8,
      baseOngkir: 6000,
      voucherDiscount: 0,
      totalOngkir: 6000,
      status: 'MENCARI_DRIVER',
      createdAt: new Date().toISOString(),
    };
    saveOrders([simOrder, ...getOrders()]);
    playOrderIncomingVoice();
    setActionMessage('⚡ Orderan simulasi baru berhasil masuk ke radar driver!');
    setTimeout(() => setActionMessage(null), 5000);
    onRefreshOrders();
  };

  // Update real-time progress stage for customer tracker
  const handleUpdateStage = (stage: Order['trackingStage'], etaMin?: number) => {
    if (!myCurrentOrder) return;
    updateOrderTrackingStage(myCurrentOrder.id, stage, etaMin);
    setActionMessage(
      `Pembaruan status: ${
        stage === 'DALAM_PERJALANAN'
          ? '🛵 Dalam Perjalanan (Meluncur ke Jemput)'
          : stage === 'TIBA'
          ? '📍 Tiba di Lokasi Jemput'
          : 'Selesai'
      }`
    );
    setTimeout(() => setActionMessage(null), 4000);
    onRefreshOrders();
  };

  // Handle Taking Order
  const handleTakeOrder = (orderId: string) => {
    if (myCurrentOrder) {
      alert('Anda masih memiliki pesanan yang sedang berjalan. Selesaikan terlebih dahulu!');
      return;
    }

    // Check deposit balance
    const currentDeposit = currentUser.deposit ?? 50000;
    if (currentDeposit < 5000) {
      alert('Saldo deposit Anda kurang dari Rp 5.000. Silakan hubungi Admin Pusat untuk top up saldo.');
      return;
    }

    const allOrders = getOrders();
    const updated = allOrders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'DITERIMA' as const,
          trackingStage: 'DITUGASKAN' as const,
          etaMinutes: 5,
          driverId: currentUser.id,
          driverName: currentUser.name,
          driverPhone: currentUser.phone,
          driverPlat: currentUser.platMotor || 'AG 4521 WZ',
          driverPhoto: currentUser.photoUrl,
        };
      }
      return o;
    });

    saveOrders(updated);
    setActionMessage('Berhasil mengambil orderan! Peta navigasi langsung aktif menuju pelanggan.');
    setTimeout(() => setActionMessage(null), 5000);
    onRefreshOrders();
  };

  // Turn-By-Turn Google Maps
  const handleOpenGoogleMapsRoute = () => {
    if (!myCurrentOrder) return;
    const origin = `${driverGps.lat},${driverGps.lng}`;
    const waypoint = `${myCurrentOrder.pickupLat},${myCurrentOrder.pickupLng}`;
    const destination = `${myCurrentOrder.dropoffLat},${myCurrentOrder.dropoffLng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoint}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Simulate GPS step moving closer to pickup/dropoff
  const handleSimulateGpsMove = () => {
    if (!myCurrentOrder) return;
    const targetLat = myCurrentOrder.status === 'DITERIMA' ? myCurrentOrder.pickupLat : myCurrentOrder.dropoffLat;
    const targetLng = myCurrentOrder.status === 'DITERIMA' ? myCurrentOrder.pickupLng : myCurrentOrder.dropoffLng;

    const nextLat = driverGps.lat + (targetLat - driverGps.lat) * 0.45;
    const nextLng = driverGps.lng + (targetLng - driverGps.lng) * 0.45;

    setDriverGps({
      lat: nextLat,
      lng: nextLng,
      name: `Posisi GPS ${currentUser.name}`,
    });

    setActionMessage('📍 Posisi GPS driver diperbarui mendekat ke tujuan!');
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Start Delivery (Arrived at Pickup)
  const handleStartDelivery = () => {
    if (!myCurrentOrder) return;
    const allOrders = getOrders();
    const updated = allOrders.map((o) => {
      if (o.id === myCurrentOrder.id) {
        return {
          ...o,
          status: 'SEDANG_DIJALANKAN' as const,
        };
      }
      return o;
    });
    saveOrders(updated);
    setActionMessage('Memulai pengantaran ke titik tujuan pelanggan!');
    setTimeout(() => setActionMessage(null), 4000);
    onRefreshOrders();
  };

  // Upload Struk Jastip
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setStrukFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitJastipStruk = () => {
    if (!myCurrentOrder) return;
    const amount = parseInt(strukAmount, 10);
    if (isNaN(amount) || amount < 0) {
      alert('Silakan masukkan total nominal belanja yang valid pada struk.');
      return;
    }

    const allOrders = getOrders();
    const grandTotal = amount + myCurrentOrder.totalOngkir;

    const updated = allOrders.map((o) => {
      if (o.id === myCurrentOrder.id) {
        return {
          ...o,
          receiptPhoto:
            strukFile ||
            o.receiptPhoto ||
            'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80',
          receiptAmount: amount,
          grandTotalCash: grandTotal,
          status: 'SEDANG_DIJALANKAN' as const,
        };
      }
      return o;
    });

    saveOrders(updated);
    setActionMessage('Struk belanja berhasil dikirimkan ke layar aplikasi pelanggan!');
    setTimeout(() => setActionMessage(null), 4000);
    onRefreshOrders();
  };

  // Complete Order
  const handleCompleteOrder = () => {
    if (!myCurrentOrder) return;
    if (
      (myCurrentOrder.serviceType === 'SHOP' || myCurrentOrder.serviceType === 'FOOD') &&
      !myCurrentOrder.receiptPhoto &&
      !strukFile
    ) {
      const proceed = confirm(
        'Anda belum mengunggah struk belanja untuk jastip. Lanjutkan penyelesaian order?'
      );
      if (!proceed) return;
    }

    const commissionPercent = tariff.commissionPercent || 10;
    const commissionFee = Math.round((myCurrentOrder.totalOngkir * commissionPercent) / 100);
    const netEarning = myCurrentOrder.totalOngkir - commissionFee;

    // Deduct 10% commission from deposit, add net earnings to daily income
    const currentDeposit = currentUser.deposit ?? 50000;
    const currentIncome = currentUser.dailyIncome ?? 0;
    const completedCount = (currentUser.completedOrdersCount ?? 0) + 1;

    const updatedUser: User = {
      ...currentUser,
      deposit: Math.max(0, currentDeposit - commissionFee),
      dailyIncome: currentIncome + netEarning,
      completedOrdersCount: completedCount,
    };

    // Update User in DB
    const allUsers = getUsers();
    const updatedUsersList = allUsers.map((u) => (u.id === currentUser.id ? updatedUser : u));
    saveUsers(updatedUsersList);
    onUpdateCurrentUser(updatedUser);

    // Add to platform ledger
    addCommission(commissionFee);

    // Update order status to SELESAI
    const allOrders = getOrders();
    const updatedOrdersList = allOrders.map((o) => {
      if (o.id === myCurrentOrder.id) {
        return {
          ...o,
          status: 'SELESAI' as const,
        };
      }
      return o;
    });
    saveOrders(updatedOrdersList);

    // Celebrate with confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Confetti fallback
    }

    setStrukFile('');
    setStrukAmount('');
    setActionMessage(
      `Orderan selesai! Anda menerima cash Rp ${myCurrentOrder.totalOngkir.toLocaleString(
        'id-ID'
      )}. Bersih: Rp ${netEarning.toLocaleString(
        'id-ID'
      )} (Potong komisi 10%: Rp ${commissionFee.toLocaleString('id-ID')}).`
    );
    setTimeout(() => setActionMessage(null), 6000);
    onRefreshOrders();
  };

  const driverRatingScore = currentUser.rating ? currentUser.rating.toFixed(1) : '5.0';
  const driverReviewCount = currentUser.ratingCount || (currentUser.reviews ? currentUser.reviews.length : 12);

  return (
    <div className="space-y-4">
      {/* Driver Official Identity Card in Royal Blue Theme */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white p-4 rounded-2xl shadow-xl border-2 border-blue-400 relative overflow-hidden">
        <div className="absolute -right-4 -bottom-8 opacity-10 text-9xl font-black select-none pointer-events-none">
          OSB
        </div>
        <div className="flex items-center space-x-3.5 relative z-10">
          <img
            src={
              currentUser.photoUrl ||
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
            }
            alt={currentUser.name}
            className="w-16 h-16 rounded-full border-2 border-white object-cover shadow-md bg-blue-900"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
            }}
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  currentUser.status === 'AKTIF'
                    ? 'bg-emerald-400 text-slate-950 font-black'
                    : 'bg-red-500 text-white'
                }`}
              >
                {currentUser.status || 'AKTIF'}
              </span>
              <span className="text-[10px] font-mono text-blue-200 font-bold">
                ID: DRV-{currentUser.phone.slice(-6)}
              </span>
            </div>
            <h3 className="font-black text-base leading-tight mt-0.5 text-white">
              {currentUser.name}
            </h3>
            <div className="flex items-center space-x-2 mt-0.5 flex-wrap gap-1">
              <p className="text-xs font-mono font-extrabold text-blue-200">
                Plat: {currentUser.platMotor || 'AG 4521 WZ'}
              </p>
              {/* Driver Star Rating Pill - Clicking opens Driver Profile & Reviews */}
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="bg-amber-400 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-lg flex items-center space-x-1 shadow-xs hover:bg-amber-300 transition cursor-pointer"
                title="Lihat ulasan & bintang driver"
              >
                <Star className="w-3 h-3 fill-slate-950" />
                <span>
                  {driverRatingScore} ★ ({driverReviewCount} ulasan)
                </span>
              </button>
            </div>
            <p className="text-[11px] text-blue-100 font-mono mt-0.5">
              SIM C: {currentUser.simNo || '3518-SIM-C'}
            </p>
          </div>
        </div>
      </div>

      {/* Audio Voice Alert & Order Simulation Control Bar */}
      <div className="bg-blue-50/80 border-2 border-blue-200 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h5 className="font-black text-xs text-blue-950">
              Notifikasi Suara Mas Mas Tolong!
            </h5>
            <p className="text-[11px] text-blue-900 font-medium">
              Sirine &amp; suara teriak kencang real-time otomatis bunyi saat orderan masuk.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleTestAudio}
            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs px-3 py-2 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer border border-blue-600"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>🔊 Tes Suara Order</span>
          </button>
          <button
            type="button"
            onClick={handleSimulateNewOrder}
            className="flex-1 sm:flex-initial bg-slate-900 hover:bg-black active:scale-95 text-blue-200 font-black text-xs px-3 py-2 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>⚡ Uji Order Masuk</span>
          </button>
        </div>
      </div>

      {/* Driver Balances and Daily Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card-ui bg-white p-3 rounded-2xl shadow-sm text-center border border-slate-100">
          <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px] font-black uppercase mb-1">
            <Wallet className="w-3 h-3 text-blue-600" />
            <span>Deposit</span>
          </div>
          <p className="text-sm font-black text-slate-950">
            Rp {(currentUser.deposit ?? 50000).toLocaleString('id-ID')}
          </p>
          <span className="text-[9px] text-slate-400 font-semibold">Komisi 10%</span>
        </div>

        <div className="card-ui bg-white p-3 rounded-2xl shadow-sm text-center border border-slate-100">
          <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px] font-black uppercase mb-1">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span>Bersih Hari Ini</span>
          </div>
          <p className="text-sm font-black text-emerald-600">
            Rp {(currentUser.dailyIncome ?? 0).toLocaleString('id-ID')}
          </p>
          <span className="text-[9px] text-emerald-700 font-semibold">Siap Kantong</span>
        </div>

        <div className="card-ui bg-white p-3 rounded-2xl shadow-sm text-center border border-slate-100">
          <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px] font-black uppercase mb-1">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            <span>Total Trip</span>
          </div>
          <p className="text-sm font-black text-slate-900">
            {currentUser.completedOrdersCount ?? 0}
          </p>
          <span className="text-[9px] text-blue-600 font-semibold">Order Selesai</span>
        </div>
      </div>

      {/* Driver Profile & Reputation Button */}
      <button
        type="button"
        onClick={onOpenProfileModal}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-2.5 rounded-2xl text-xs flex items-center justify-center space-x-2 border border-blue-600 shadow transition active:scale-98"
      >
        <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
        <span>⭐ Profil Mitra Driver &amp; Ulasan Bintang Pelanggan</span>
      </button>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-xs font-bold text-blue-950 shadow-sm animate-fade-in flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ==================== ACTIVE ORDER BEING WORKED ON ==================== */}
      {myCurrentOrder && (
        <div className="card-ui bg-white p-4 rounded-2xl shadow-lg border-2 border-blue-500 space-y-3.5 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Orderan Sedang Dikerjakan
              </span>
              <h4 className="font-black text-sm text-slate-900">ID: {myCurrentOrder.id}</h4>
            </div>
            <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
              {myCurrentOrder.serviceType}
            </span>
          </div>

          {/* Customer & Route Details */}
          <div className="text-xs space-y-1.5 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <p>
                <strong className="text-slate-900">Pelanggan:</strong> {myCurrentOrder.customerName}
              </p>
              <button
                type="button"
                onClick={() => setActiveChatOrder(myCurrentOrder)}
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm border border-blue-500 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Chat Pelanggan</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>
            </div>
            <p>
              <strong>📍 Jemput / Toko:</strong> {myCurrentOrder.pickupAddress}
            </p>
            <p>
              <strong>🎯 Tujuan:</strong> {myCurrentOrder.dropoffAddress}
            </p>
            {myCurrentOrder.notes && (
              <p className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800">
                <strong>📝 Catatan:</strong> {myCurrentOrder.notes}
              </p>
            )}
            <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold">
              <span>Ongkir Cash:</span>
              <span className="text-blue-900 font-black">
                Rp {myCurrentOrder.totalOngkir.toLocaleString('id-ID')} ({myCurrentOrder.distanceKm} km)
              </span>
            </div>
          </div>

          {/* ==================== REAL-TIME LIVE NAVIGATION MAP ==================== */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-black text-slate-900 flex items-center space-x-1">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Peta Navigasi Real-Time Driver &amp; Pelanggan:</span>
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Live GPS Aktif
              </span>
            </div>

            <LeafletMap
              pickup={{ lat: myCurrentOrder.pickupLat, lng: myCurrentOrder.pickupLng }}
              dropoff={{ lat: myCurrentOrder.dropoffLat, lng: myCurrentOrder.dropoffLng }}
              driverLocation={driverGps}
              driverName={currentUser.name}
              isReadOnly={true}
              height="280px"
              showNavigationStep={true}
              navigationStepText={
                myCurrentOrder.status === 'DITERIMA'
                  ? `Menuju Titik Penjemputan: ${myCurrentOrder.pickupAddress}`
                  : `Sedang Mengantar ke Tujuan: ${myCurrentOrder.dropoffAddress}`
              }
            />

            {/* Visual Tracking Stage Updater for Driver */}
            <div className="bg-blue-50/70 p-3 rounded-2xl border-2 border-blue-300 space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase text-blue-950 flex items-center space-x-1">
                  <Bike className="w-3.5 h-3.5 text-blue-700" />
                  <span>Update Kemajuan Perjalanan Real-Time:</span>
                </span>
                <span className="text-[10px] font-black bg-blue-900 text-white px-2 py-0.5 rounded-full">
                  {myCurrentOrder.trackingStage === 'TIBA'
                    ? '📍 Sudah Tiba'
                    : myCurrentOrder.trackingStage === 'DALAM_PERJALANAN'
                    ? '🛣️ Dalam Perjalanan'
                    : '🛵 Ditugaskan'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStage('DALAM_PERJALANAN', 3)}
                  className={`py-2.5 px-2 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition active:scale-95 cursor-pointer border ${
                    myCurrentOrder.trackingStage === 'DALAM_PERJALANAN'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                      : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-300'
                  }`}
                >
                  <Bike className="w-4 h-4 text-blue-700" />
                  <span>1. Dalam Perjalanan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStage('TIBA', 0)}
                  className={`py-2.5 px-2 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition active:scale-95 cursor-pointer border ${
                    myCurrentOrder.trackingStage === 'TIBA'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                      : 'bg-white hover:bg-indigo-50 text-slate-800 border-slate-300'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>2. Tiba di Lokasi</span>
                </button>
              </div>
            </div>

            {/* GPS Simulation Tool for testing live movement */}
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={handleSimulateGpsMove}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-slate-300 transition cursor-pointer"
              >
                <Footprints className="w-3.5 h-3.5 text-blue-600" />
                <span>📍 Perbarui Gerak GPS (Mendekati Titik)</span>
              </button>
            </div>
          </div>

          {/* Google Maps Turn-By-Turn Navigation Button */}
          <button
            type="button"
            onClick={handleOpenGoogleMapsRoute}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition"
          >
            <Navigation className="w-4 h-4" />
            <span>🗺️ Buka Rute Google Maps Akurat (Driver &rarr; Jemput &rarr; Antar)</span>
          </button>

          {/* Jastip Receipt Upload Box */}
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 space-y-2">
            <label className="block text-xs font-black text-blue-950 flex items-center">
              <ShoppingBag className="w-4 h-4 mr-1 text-blue-700" />
              <span>🛍️ Upload Struk Belanja &amp; Nominal Nota (Khusus Jastip):</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-900"
            />
            {strukFile && (
              <img
                src={strukFile}
                alt="Preview Struk"
                className="w-full h-32 object-contain rounded-lg border border-blue-300 bg-white"
              />
            )}
            <div className="flex space-x-2">
              <input
                type="number"
                value={strukAmount}
                onChange={(e) => setStrukAmount(e.target.value)}
                placeholder="Total Uang di Struk Rp..."
                className="w-full px-3 py-2 border border-blue-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSubmitJastipStruk}
                className="bg-blue-700 hover:bg-blue-800 text-white font-black px-3 py-2 rounded-xl text-xs whitespace-nowrap transition shadow"
              >
                Kirim Struk
              </button>
            </div>

            {/* Automatically Summed Receipt Breakdown Card for Driver */}
            {myCurrentOrder.receiptAmount ? (
              <div className="bg-white p-3 rounded-xl border-2 border-blue-500 space-y-2 text-slate-900 shadow-md mt-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-950 flex items-center">
                    🧾 BUKTI TAGIHAN CASH KE PELANGGAN
                  </span>
                  <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded">
                    TERJUMLAH OTOMATIS
                  </span>
                </div>

                <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-700">🛍️ Uang Belanja di Struk:</span>
                    <span className="font-black text-slate-900">
                      Rp {myCurrentOrder.receiptAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-700">🛵 Biaya Ongkir Ojek Serba Bisa:</span>
                    <span className="font-black text-slate-900">
                      + Rp {myCurrentOrder.totalOngkir.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-1.5 flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase text-blue-950">
                      TOTAL CASH BAYAR DI TEMPAT (COD):
                    </span>
                    <span className="text-base font-black text-white bg-blue-700 px-2 py-0.5 rounded shadow-xs">
                      Rp{' '}
                      {(
                        myCurrentOrder.grandTotalCash ||
                        myCurrentOrder.receiptAmount + myCurrentOrder.totalOngkir
                      ).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Live Chat Invoice sender & File Download */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const totalCash =
                        myCurrentOrder.grandTotalCash ||
                        myCurrentOrder.receiptAmount! + myCurrentOrder.totalOngkir;
                      const text = `🧾 RINCIAN STRUK & TAGIHAN:\n• Struk Belanja: Rp ${myCurrentOrder.receiptAmount!.toLocaleString(
                        'id-ID'
                      )}\n• Ongkir Ojek Serba Bisa: Rp ${myCurrentOrder.totalOngkir.toLocaleString(
                        'id-ID'
                      )}\n• TOTAL CASH (COD): Rp ${totalCash.toLocaleString(
                        'id-ID'
                      )}\n\nDriver (${currentUser.name}) segera sampai. Mohon siapkan uang pas ya kak!`;
                      sendChatMessage({
                        orderId: myCurrentOrder.id,
                        senderId: currentUser.id,
                        senderName: currentUser.name,
                        senderRole: 'DRIVER',
                        text: text,
                        photoUrl: myCurrentOrder.receiptPhoto,
                      });
                      setActiveChatOrder(myCurrentOrder);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-2 rounded-xl text-[11px] flex items-center justify-center space-x-1.5 shadow transition active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>💬 Kirim ke Live Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadDriverReceipt(myCurrentOrder)}
                    className="bg-slate-900 hover:bg-black text-white font-black py-2.5 px-2 rounded-xl text-[11px] flex items-center justify-center space-x-1.5 shadow transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-300" />
                    <span>📥 Unduh Berkas Struk</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Complete Order Button */}
          <button
            type="button"
            onClick={handleCompleteOrder}
            className="w-full bg-emerald-600 hover:bg-emerald-700 font-black text-white py-3.5 rounded-2xl shadow-lg text-sm uppercase tracking-wide transition flex items-center justify-center space-x-2 border-2 border-black/10 active:scale-98"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>✅ SELESAIKAN ORDERAN (TERIMA CASH)</span>
          </button>
        </div>
      )}

      {/* RADAR AVAILABLE ORDERS LIST */}
      <div className="card-ui bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
              <span>📡 Radar Orderan Masuk</span>
            </h4>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              ({pendingOrders.length} Order)
            </span>
          </div>
          <button
            type="button"
            onClick={handleTestAudio}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] rounded-lg shadow-sm flex items-center space-x-1 transition active:scale-95 border border-blue-500"
            title="Klik untuk mengetes suara notifikasi orderan masuk"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>🔊 Tes Suara Order</span>
          </button>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <p className="text-3xl mb-1">🛵</p>
            <p className="font-bold text-slate-700">Belum ada orderan baru yang masuk ke radar...</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Suara sirine otomatis berbunyi kencang saat ada pesanan masuk dari pelanggan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 border-2 border-blue-300 bg-blue-50/40 rounded-2xl space-y-2.5 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-200 px-2 py-0.5 rounded-full">
                      {ord.serviceType}
                    </span>
                    <h5 className="font-black text-xs text-slate-900 mt-1">
                      {ord.customerName} ({ord.customerPhone})
                    </h5>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-blue-900">
                      Rp {ord.totalOngkir.toLocaleString('id-ID')}
                    </span>
                    <p className="text-[10px] text-slate-500 font-bold">{ord.distanceKm} km</p>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-slate-700 bg-white p-2.5 rounded-xl border border-blue-200">
                  <p className="flex items-start">
                    <span className="font-bold w-16 shrink-0 text-slate-500">📍 Jemput:</span>
                    <span className="font-medium text-slate-900">{ord.pickupAddress}</span>
                  </p>
                  <p className="flex items-start">
                    <span className="font-bold w-16 shrink-0 text-slate-500">🎯 Tujuan:</span>
                    <span className="font-medium text-slate-900">{ord.dropoffAddress}</span>
                  </p>
                  {ord.notes && (
                    <p className="flex items-start">
                      <span className="font-bold w-16 shrink-0 text-slate-500">📝 Catatan:</span>
                      <span className="text-slate-800">{ord.notes}</span>
                    </p>
                  )}
                </div>

                {/* Accept Button and X (Tolak Pesanan) Button next to it */}
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleTakeOrder(ord.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider transition shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>TERIMA PESANAN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRejectOrder(ord.id)}
                    className="bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center space-x-1 transition shadow border border-red-600 cursor-pointer"
                    title="Tolak pesanan ini dari radar (Tanda X)"
                  >
                    <X className="w-4 h-4" />
                    <span className="font-bold">Tolak</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time In-App Live Chat Modal */}
      {activeChatOrder && (
        <LiveChatModal
          order={activeChatOrder}
          currentUser={currentUser}
          onClose={() => setActiveChatOrder(null)}
        />
      )}
    </div>
  );
};
