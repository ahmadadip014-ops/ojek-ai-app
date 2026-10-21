import React, { useState } from 'react';
import { User, Order, TariffConfig, Voucher, BrandingConfig, LayoutStyle } from '../types';
import {
  saveTariffConfig,
  saveVouchers,
  getVouchers,
  saveBrandingConfig,
  saveUsers,
  getUsers,
  getTotalCommission,
  resetAllData,
  INITIAL_USERS,
  INITIAL_ORDERS,
  saveOrders,
} from '../utils/storage';
import { DocumentViewerModal } from './DocumentViewerModal';
import {
  ShieldAlert,
  Palette,
  Coins,
  Users,
  BarChart3,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  FileSearch,
  Sparkles,
} from 'lucide-react';

interface AdminDashboardProps {
  tariff: TariffConfig;
  branding: BrandingConfig;
  orders: Order[];
  onTariffChange: (t: TariffConfig) => void;
  onBrandingChange: (b: BrandingConfig) => void;
  onRefreshAll: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tariff,
  branding,
  orders,
  onTariffChange,
  onBrandingChange,
  onRefreshAll,
}) => {
  // Branding Inputs
  const [logoInput, setLogoInput] = useState(branding.logoUrl);
  const [layoutInput, setLayoutInput] = useState<LayoutStyle>(branding.layoutStyle);

  // Tariff Inputs
  const [minTariff, setMinTariff] = useState(tariff.minTariff);
  const [ratePerKm, setRatePerKm] = useState(tariff.ratePerKm);
  const [jastipFee, setJastipFee] = useState(tariff.jastipFee);
  const [bonusDriver, setBonusDriver] = useState(tariff.driverBonus);
  const [commissionPercent, setCommissionPercent] = useState(tariff.commissionPercent || 10);

  // Voucher Inputs
  const [vouchers, setVouchers] = useState<Voucher[]>(getVouchers());
  const [newVouchCode, setNewVouchCode] = useState('');
  const [newVouchDiscount, setNewVouchDiscount] = useState('');

  // Users State
  const [allUsers, setAllUsers] = useState<User[]>(getUsers());
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'DRIVER'>('ALL');
  const [searchUser, setSearchUser] = useState('');
  const [inspectUser, setInspectUser] = useState<User | null>(null);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. Branding Save
  const handleUpdateLogo = () => {
    if (!logoInput.trim()) return;
    const updated: BrandingConfig = { ...branding, logoUrl: logoInput.trim() };
    saveBrandingConfig(updated);
    onBrandingChange(updated);
    showToast('Logo aplikasi berhasil diperbarui di seluruh platform!');
  };

  const handleUpdateLayout = (style: LayoutStyle) => {
    setLayoutInput(style);
    const updated: BrandingConfig = { ...branding, layoutStyle: style };
    saveBrandingConfig(updated);
    onBrandingChange(updated);
    document.body.className = `${style} text-slate-800 antialiased min-h-screen pb-12`;
    showToast(`Tata letak berhasil diubah ke: ${style}`);
  };

  // 2. Tariff Save
  const handleSaveTariff = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TariffConfig = {
      minTariff: Number(minTariff),
      ratePerKm: Number(ratePerKm),
      jastipFee: Number(jastipFee),
      driverBonus: Number(bonusDriver),
      commissionPercent: Number(commissionPercent),
    };
    saveTariffConfig(updated);
    onTariffChange(updated);
    showToast('Pengaturan tarif operasional berhasil disimpan!');
  };

  // 3. Voucher Management
  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newVouchCode.trim().toUpperCase();
    const discount = parseInt(newVouchDiscount, 10);
    if (!code || isNaN(discount) || discount <= 0) {
      alert('Masukkan kode voucher dan nominal diskon yang valid.');
      return;
    }
    const current = getVouchers();
    if (current.some((v) => v.code === code)) {
      alert('Kode voucher ini sudah ada.');
      return;
    }
    const updated = [...current, { code, discount, active: true }];
    saveVouchers(updated);
    setVouchers(updated);
    setNewVouchCode('');
    setNewVouchDiscount('');
    showToast(`Voucher ${code} berhasil dibuat!`);
  };

  const handleDeleteVoucher = (code: string) => {
    const updated = vouchers.filter((v) => v.code !== code);
    saveVouchers(updated);
    setVouchers(updated);
    showToast(`Voucher ${code} dihapus.`);
  };

  // 4. Admin 3 Special Buttons Handler
  const handleSetUserStatus = (userId: string, newStatus?: 'AKTIF' | 'NONAKTIF', toggleRole?: boolean) => {
    const updatedUsers = allUsers.map((u) => {
      if (u.id === userId) {
        const nextRole = toggleRole ? (u.role === 'DRIVER' ? 'CUSTOMER' : 'DRIVER') : u.role;
        const nextStatus = newStatus || u.status;
        return {
          ...u,
          role: nextRole,
          status: nextStatus,
        };
      }
      return u;
    });

    saveUsers(updatedUsers);
    setAllUsers(updatedUsers);
    showToast(`Akun ${userId} berhasil diperbarui.`);
    onRefreshAll();
  };

  const handleTopupDeposit = (userId: string) => {
    const amount = prompt('Masukkan nominal penambahan saldo deposit driver (Rp):', '50000');
    if (!amount) return;
    const num = parseInt(amount, 10);
    if (isNaN(num) || num <= 0) return;

    const updatedUsers = allUsers.map((u) => {
      if (u.id === userId) {
        const cur = u.deposit ?? 0;
        return { ...u, deposit: cur + num };
      }
      return u;
    });

    saveUsers(updatedUsers);
    setAllUsers(updatedUsers);
    showToast(`Saldo deposit berhasil ditambah Rp ${num.toLocaleString('id-ID')}!`);
    onRefreshAll();
  };

  // 5. Master Database Reset
  const handleMasterReset = () => {
    if (
      confirm(
        'APAKAH ANDA YAKIN INGIN MERESET TOTAL DATABASE MASTER TRANSAKSI & MENGEMBALIKAN KE PENGATURAN AWAL?'
      )
    ) {
      resetAllData();
      saveOrders([]);
      setAllUsers(INITIAL_USERS);
      setVouchers(getVouchers());
      showToast('Database master riwayat orderan berhasil dibersihkan!');
      onRefreshAll();
    }
  };

  const handleSeedSampleData = () => {
    saveUsers(INITIAL_USERS);
    saveOrders(INITIAL_ORDERS);
    setAllUsers(INITIAL_USERS);
    showToast('Data demo pelanggan, driver, dan pesanan aktif berhasil dimuat!');
    onRefreshAll();
  };

  const totalCommission = getTotalCommission();
  const completedOrders = orders.filter((o) => o.status === 'SELESAI');
  const grossVolume = completedOrders.reduce((sum, o) => sum + o.totalOngkir, 0);

  const filteredUsers = allUsers.filter((u) => {
    if (u.role === 'ADMIN') return false; // don't list admin for role toggle
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchUser) {
      const q = searchUser.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.platMotor && u.platMotor.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Admin Central Header */}
      <div className="bg-slate-950 text-white p-4 rounded-2xl shadow-xl border-2 border-blue-500 flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-1.5 text-blue-400 text-xs font-black uppercase tracking-wider mb-0.5">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <span>Control Panel Pemilik &amp; Admin Pusat</span>
          </div>
          <h3 className="font-black text-lg text-white">OJEK SERBA BISA</h3>
          <p className="text-[11px] text-blue-200 font-bold">
            MAS TOLONG MAS SOLUSINYA!!! • Kertosono - Jombang &amp; Seluruh Jawa Timur
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Akses Resmi Pemilik: Kelola Tarif, Berkas Driver, Branding &amp; Pembukuan Kas
          </p>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 shadow-md flex items-center space-x-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. BRANDING & LAYOUT MANAGER */}
      <div className="card-ui bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
          <Palette className="w-4 h-4 text-blue-600" />
          <span>🎨 Pengaturan Branding Logo &amp; Tata Letak</span>
        </h4>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            URL Logo Aplikasi Baru
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={logoInput}
              onChange={(e) => setLogoInput(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleUpdateLogo}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3.5 py-2 rounded-xl transition shadow cursor-pointer"
            >
              Update Logo
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Gaya Tata Letak Tampilan (Layout Style)
          </label>
          <select
            value={layoutInput}
            onChange={(e) => handleUpdateLayout(e.target.value as LayoutStyle)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-amber-400 focus:outline-none"
          >
            <option value="layout-modern">Layout Modern Rounded (Default PWA)</option>
            <option value="layout-compact">Layout Minimalis Compact</option>
            <option value="layout-bold">Layout Card Bold Neo-Brutalist (High Contrast)</option>
          </select>
        </div>
      </div>

      {/* 2. TARIFF & PROMO VOUCHERS CONTROL */}
      <div className="card-ui bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
          <Coins className="w-4 h-4 text-emerald-600" />
          <span>💰 Pengaturan Tarif Operasional & Voucher Real-Time</span>
        </h4>

        <form onSubmit={handleSaveTariff} className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 mb-0.5 block">
                Tarif Minimum (0 - 3 km)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 text-[10px]">Rp</span>
                <input
                  type="number"
                  value={minTariff}
                  onChange={(e) => setMinTariff(Number(e.target.value))}
                  required
                  className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-0.5 block">
                Tarif / km (&gt; 3 km)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 text-[10px]">Rp</span>
                <input
                  type="number"
                  value={ratePerKm}
                  onChange={(e) => setRatePerKm(Number(e.target.value))}
                  required
                  className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-0.5 block">
                Biaya Jastip Pasar
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 text-[10px]">Rp</span>
                <input
                  type="number"
                  value={jastipFee}
                  onChange={(e) => setJastipFee(Number(e.target.value))}
                  required
                  className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-0.5 block">
                Komisi Platform (%)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 text-[10px]">%</span>
                <input
                  type="number"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(Number(e.target.value))}
                  required
                  className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-black text-white font-black py-2 rounded-xl text-xs transition shadow"
          >
            Simpan Pengaturan Tarif
          </button>
        </form>

        {/* Voucher Manager */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-black text-slate-800">
            Buat Voucher Promo Baru:
          </label>
          <form onSubmit={handleCreateVoucher} className="flex space-x-2">
            <input
              type="text"
              value={newVouchCode}
              onChange={(e) => setNewVouchCode(e.target.value)}
              placeholder="KODE"
              className="uppercase px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs w-28 font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
            <input
              type="number"
              value={newVouchDiscount}
              onChange={(e) => setNewVouchDiscount(e.target.value)}
              placeholder="Diskon (Rp)"
              className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-1.5 rounded-lg transition shadow"
            >
              Buat
            </button>
          </form>

          {/* List of active vouchers */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {vouchers.map((v) => (
              <div
                key={v.code}
                className="bg-amber-100 border border-amber-300 px-2 py-1 rounded-md text-[11px] font-bold text-amber-950 flex items-center space-x-1.5"
              >
                <span>
                  {v.code} (-Rp {v.discount.toLocaleString('id-ID')})
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteVoucher(v.code)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. USERS MANAGEMENT WITH 3 SPECIAL STATUS BUTTONS */}
      <div className="card-ui bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            <span>👥 Kelola Pengguna & Status 3 Tombol Khusus</span>
          </h4>
          <span className="text-[11px] font-bold text-slate-500">
            {filteredUsers.length} Akun
          </span>
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            placeholder="Cari nama, no WA, plat..."
            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
          <div className="flex border border-slate-200 rounded-lg overflow-hidden text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-2 py-1 ${
                roleFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('CUSTOMER')}
              className={`px-2 py-1 ${
                roleFilter === 'CUSTOMER' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'
              }`}
            >
              Pelanggan
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('DRIVER')}
              className={`px-2 py-1 ${
                roleFilter === 'DRIVER' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'
              }`}
            >
              Driver
            </button>
          </div>
        </div>

        {/* User Rows */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="p-3 border border-slate-200 rounded-xl text-xs bg-slate-50/70 space-y-2 hover:bg-white hover:shadow-sm transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <strong className="text-slate-900 font-black">{u.name}</strong>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        u.role === 'DRIVER'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {u.role}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        u.status === 'AKTIF'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {u.status || 'AKTIF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    WA: {u.phone} {u.platMotor && `• Plat: ${u.platMotor}`}
                  </p>
                  {u.role === 'DRIVER' && (
                    <p className="text-[11px] text-amber-900 font-bold">
                      Saldo Deposit: Rp {(u.deposit ?? 50000).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <a
                    href={`https://wa.me/${u.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded text-[11px] font-bold"
                  >
                    💬 WA
                  </a>
                  {u.role === 'DRIVER' && (
                    <button
                      type="button"
                      onClick={() => handleTopupDeposit(u.id)}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-2 py-1 rounded text-[11px] font-black"
                    >
                      + Topup
                    </button>
                  )}
                </div>
              </div>

              {/* Document verification inspector button */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setInspectUser(u)}
                  className="text-blue-700 hover:underline font-bold flex items-center space-x-1"
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  <span>
                    Lihat Berkas Identitas (
                    {u.documents?.ktp ? 'E-KTP ✓' : 'Belum KTP'}
                    {u.role === 'DRIVER' && `, ${u.documents?.sim ? 'SIM ✓' : 'Belum SIM'}`})
                  </span>
                </button>
              </div>

              {/* 3 Tombol Khusus Admin */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSetUserStatus(u.id, 'AKTIF', false)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-1.5 rounded-lg text-[10px] uppercase shadow-sm transition"
                >
                  🟢 DEMO / AKTIF
                </button>
                <button
                  type="button"
                  onClick={() => handleSetUserStatus(u.id, undefined, true)}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-1.5 rounded-lg text-[10px] uppercase shadow-sm transition"
                >
                  🟡 TOGGLE ROLE
                </button>
                <button
                  type="button"
                  onClick={() => handleSetUserStatus(u.id, 'NONAKTIF', false)}
                  className="bg-red-600 hover:bg-red-700 text-white font-black py-1.5 rounded-lg text-[10px] uppercase shadow-sm transition"
                >
                  🔴 NONAKTIF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. FINANCIAL LEDGER & MASTER RESET */}
      <div className="card-ui bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
          <BarChart3 className="w-4 h-4 text-purple-600" />
          <span>📊 Buku Kas & Master Reset</span>
        </h4>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              Total Komisi Platform (10%):
            </span>
            <span className="text-base font-black text-emerald-700">
              Rp {totalCommission.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              Gross Omzet Selesai:
            </span>
            <span className="text-base font-black text-slate-900">
              Rp {grossVolume.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="pt-2 flex space-x-2">
          <button
            type="button"
            onClick={handleSeedSampleData}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition"
          >
            Muat Ulang Data Sampel
          </button>
          <button
            type="button"
            onClick={handleMasterReset}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-2 rounded-xl text-xs uppercase tracking-wider transition shadow"
          >
            ⚠️ Reset Database Master
          </button>
        </div>
      </div>

      {/* Inspection Modal */}
      {inspectUser && (
        <DocumentViewerModal user={inspectUser} onClose={() => setInspectUser(null)} />
      )}
    </div>
  );
};
