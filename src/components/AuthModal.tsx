import React, { useState } from 'react';
import { User, BrandingConfig, UserRole } from '../types';
import { getUsers, saveUsers, saveSession } from '../utils/storage';
import { UserPlus, LogIn, Bike, ShieldCheck, CheckCircle2, AlertCircle, Download, Smartphone } from 'lucide-react';

interface AuthModalProps {
  branding: BrandingConfig;
  onLoginSuccess: (user: User) => void;
  onOpenDownloadModal?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ branding, onLoginSuccess, onOpenDownloadModal }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'reg-customer' | 'reg-driver'>('login');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Customer register form state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custPass, setCustPass] = useState('');

  // Driver register form state
  const [drvName, setDrvName] = useState('');
  const [drvNik, setDrvNik] = useState('');
  const [drvPhone, setDrvPhone] = useState('');
  const [drvPlat, setDrvPlat] = useState('');
  const [drvSim, setDrvSim] = useState('');
  const [drvPass, setDrvPass] = useState('');
  const [drvAgree, setDrvAgree] = useState(false);
  const [drvKtpDoc, setDrvKtpDoc] = useState<string>('');
  const [drvStnkDoc, setDrvStnkDoc] = useState<string>('');
  const [drvSimDoc, setDrvSimDoc] = useState<string>('');
  const [drvSkckDoc, setDrvSkckDoc] = useState<string>('');

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedId = loginId.trim();
    const trimmedPass = loginPass.trim();

    // Secret Admin / Owner official check
    if (
      (trimmedId === 'AhmadadipMST0000' || trimmedId.toLowerCase() === 'admin' || trimmedId === '081933000000') &&
      (trimmedPass === '081933Ae' || trimmedPass === 'admin' || trimmedPass === 'admin123')
    ) {
      const adminUser: User = {
        id: 'AhmadadipMST0000',
        name: 'Pemilik Pusat (Ahmad Adip)',
        phone: '081933000000',
        password: '081933Ae',
        role: 'ADMIN',
        status: 'AKTIF',
        registeredAt: new Date().toISOString(),
      };
      saveSession(adminUser);
      onLoginSuccess(adminUser);
      return;
    }

    // Normal user check
    const users = getUsers();
    const lowerId = trimmedId.toLowerCase();
    const isAdminAttempt =
      lowerId === 'admin' || lowerId === 'ahmadadipmst0000' || trimmedId === '081933000000';

    const foundUser = users.find((u) => {
      const matchId =
        u.id.toLowerCase() === lowerId ||
        u.phone === trimmedId ||
        (isAdminAttempt && u.role === 'ADMIN');
      const matchPass =
        u.password === trimmedPass ||
        (!u.password && trimmedPass === 'password123') ||
        (u.role === 'ADMIN' &&
          (trimmedPass === 'admin' || trimmedPass === 'admin123' || trimmedPass === '081933Ae'));
      return matchId && matchPass;
    });

    if (foundUser) {
      if (foundUser.status === 'NONAKTIF') {
        setErrorMessage('Akun Anda sedang dinonaktifkan oleh Admin Pusat.');
        return;
      }
      saveSession(foundUser);
      onLoginSuccess(foundUser);
      return;
    }

    // Fallback: If not found, provide clear helpful message
    setErrorMessage(
      isAdminAttempt
        ? 'Login Pemilik Pusat gagal. Pastikan ID Admin dan Kata Sandi benar.'
        : 'Nomor WhatsApp atau Password salah. Anda juga dapat mendaftar baru di tab atas atau gunakan tombol demo pelanggan/driver di bawah.'
    );
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const users = getUsers();
    if (role === 'ADMIN') {
      // Admin is reserved for official owner login only
      setErrorMessage('Akses Admin hanya bisa lewat Login Resmi dengan ID Pemilik.');
      return;
    } else if (role === 'DRIVER') {
      const driver = users.find((u) => u.role === 'DRIVER') || {
        id: '081234567891',
        name: 'Cak Slamet Raharjo',
        phone: '081234567891',
        role: 'DRIVER',
        status: 'AKTIF',
        platMotor: 'AG 4521 WZ',
        deposit: 65000,
        dailyIncome: 32000,
      };
      saveSession(driver);
      onLoginSuccess(driver);
    } else {
      const customer = users.find((u) => u.role === 'CUSTOMER') || {
        id: '081234567890',
        name: 'Budi Santoso',
        phone: '081234567890',
        role: 'CUSTOMER',
        status: 'AKTIF',
      };
      saveSession(customer);
      onLoginSuccess(customer);
    }
  };

  const handleRegisterCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedPhone = custPhone.trim();
    const users = getUsers();
    if (users.some((u) => u.phone === trimmedPhone)) {
      setErrorMessage('Nomor WhatsApp ini sudah terdaftar. Silakan langsung login.');
      return;
    }

    const newUser: User = {
      id: trimmedPhone,
      name: custName.trim(),
      phone: trimmedPhone,
      password: custPass,
      role: 'CUSTOMER',
      status: 'AKTIF',
      registeredAt: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);
    saveSession(newUser);
    setSuccessMessage('Pendaftaran Pelanggan berhasil! Akun langsung aktif.');
    setTimeout(() => {
      onLoginSuccess(newUser);
    }, 600);
  };

  const handleRegisterDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!drvAgree) {
      setErrorMessage('Anda harus menyetujui aturan komisi platform 10% dan kejujuran berkas.');
      return;
    }

    const trimmedPhone = drvPhone.trim();
    const users = getUsers();
    if (users.some((u) => u.phone === trimmedPhone)) {
      setErrorMessage('Nomor WhatsApp ini sudah terdaftar.');
      return;
    }

    const newDriver: User = {
      id: trimmedPhone,
      name: drvName.trim(),
      phone: trimmedPhone,
      password: drvPass,
      nik: drvNik.trim(),
      platMotor: drvPlat.trim().toUpperCase(),
      simNo: drvSim.trim(),
      role: 'DRIVER',
      status: 'AKTIF', // Default langsung aktif agar mitra baru bisa segera kerja online
      deposit: 50000,
      dailyIncome: 0,
      completedOrdersCount: 0,
      registeredAt: new Date().toISOString(),
      documents: {
        ktp: drvKtpDoc || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        stnk: drvStnkDoc || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        sim: drvSimDoc || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        skck: drvSkckDoc || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      },
    };

    saveUsers([...users, newDriver]);
    saveSession(newDriver);
    setSuccessMessage('Pendaftaran mitra driver berhasil! Akun langsung aktif & siap terima orderan.');
    setTimeout(() => {
      onLoginSuccess(newDriver);
    }, 600);
  };

  return (
    <section className="card-ui bg-white p-5 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-4">
        <div className="relative inline-block">
          <img
            src="/assets/aistudio/Maskot_Ojek_Serba_Bisa_Mas_Tolong_67e2d33f.png"
            alt="Mascot Ojek Serba Bisa Mas Tolong"
            className="h-24 w-24 mx-auto rounded-2xl mb-2 object-contain drop-shadow-md bg-blue-50 p-1 border-2 border-blue-600"
            onError={(e) => {
              (e.target as HTMLImageElement).src = branding.logoUrl;
            }}
          />
        </div>
        <h2 className="text-xl font-black text-slate-950 tracking-tight uppercase leading-tight">
          OJEK SERBA BISA
        </h2>
        <p className="text-xs font-black text-blue-700 uppercase tracking-wide">
          MAS TOLONG MAS SOLUSINYA!!!
        </p>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
          Ojek Motor, Express Paket, Kuliner &amp; Jastip Pasar Terpadu Kertosono - Jombang
        </p>
      </div>

      {/* 4-Services Showcase Banner */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-blue-200 shadow-xs">
        <img
          src="/assets/aistudio/ChatGPT_Image_20_Okt_2026__15.25.43_d4b3e57f.png"
          alt="4 Layanan Ojek Serba Bisa: Antar Orang, Kirim Paket, Titip Makanan, Belanja Pasar"
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Universal Compatibility & Download Quick Action */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] font-black text-blue-950">
            <Smartphone className="w-4 h-4 text-blue-700" />
            <span>Berbasis Online - Mendukung Semua HP Android &amp; iPhone</span>
          </div>
          <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
            Bebas Daftar
          </span>
        </div>
        <p className="text-[11px] text-blue-900 leading-snug">
          Semua orang bisa langsung mendaftar sebagai Pelanggan Baru atau Mitra Driver Baru secara online dan cepat.
        </p>
        {onOpenDownloadModal && (
          <button
            type="button"
            onClick={onOpenDownloadModal}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition active:scale-98"
          >
            <Download className="w-3.5 h-3.5 text-blue-200" />
            <span>📥 Unduh / Pasang Aplikasi Ojek Serba Bisa di HP</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setActiveTab('login');
            setErrorMessage(null);
          }}
          className={`flex-1 py-2.5 text-center border-b-2 transition ${
            activeTab === 'login'
              ? 'border-blue-600 text-blue-700 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('reg-customer');
            setErrorMessage(null);
          }}
          className={`flex-1 py-2.5 text-center border-b-2 transition ${
            activeTab === 'reg-customer'
              ? 'border-blue-600 text-blue-700 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Daftar Pelanggan
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('reg-driver');
            setErrorMessage(null);
          }}
          className={`flex-1 py-2.5 text-center border-b-2 transition ${
            activeTab === 'reg-driver'
              ? 'border-blue-600 text-blue-700 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Daftar Driver
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-2.5 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-xs text-green-700">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. LOGIN FORM */}
      {activeTab === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              No. WhatsApp / ID Admin Pemilik
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Contoh: 081234567890 atau ID Admin"
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi / Password
            </label>
            <input
              type="password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 font-black text-white py-3 rounded-xl shadow-md transition text-sm flex items-center justify-center space-x-1.5 active:scale-98"
          >
            <LogIn className="w-4 h-4" />
            <span>MASUK SEKARANG</span>
          </button>

          {/* Owner official login note */}
          <div className="bg-slate-900 text-blue-100 text-[11px] p-2.5 rounded-xl border border-blue-400/30 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Khusus Pemilik / Owner Resmi:</strong> Akses admin hanya melalui login resmi dengan ID Admin (<strong>admin</strong>) dan Kata Sandi terdaftar.
            </span>
          </div>

          {/* Quick Demo Access Bar (Only Customer & Driver - Admin removed for owner security) */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 text-center mb-2 uppercase tracking-wide">
              ⚡ Akses Cepat Uji Coba Demo (1-Klik):
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('CUSTOMER')}
                className="py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-black text-blue-900 transition active:scale-95 shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <span>👤</span>
                <span>Pelanggan</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('DRIVER')}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-black text-emerald-800 transition active:scale-95 shadow-2xs flex items-center justify-center space-x-1.5"
              >
                <span>🛵</span>
                <span>Mitra Driver</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 2. DAFTAR PELANGGAN BARU */}
      {activeTab === 'reg-customer' && (
        <form onSubmit={handleRegisterCustomerSubmit} className="space-y-3">
          <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-xs text-blue-950">
            ⚡ <strong>Pendaftaran Bebas &amp; Cepat:</strong> Masukkan Nama &amp; WhatsApp aktif untuk memesan ojek, kirim paket express, dan jastip pasar.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap / Panggilan
            </label>
            <input
              type="text"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor WhatsApp Aktif
            </label>
            <input
              type="tel"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              placeholder="081234567890"
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              value={custPass}
              onChange={(e) => setCustPass(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 font-black text-white py-2.5 rounded-xl shadow transition text-sm flex items-center justify-center space-x-1.5 active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>DAFTAR PELANGGAN SEKARANG</span>
          </button>
        </form>
      )}

      {/* 3. DAFTAR MITRA DRIVER BARU */}
      {activeTab === 'reg-driver' && (
        <form onSubmit={handleRegisterDriverSubmit} className="space-y-3">
          <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-xs text-blue-900">
            🛵 <strong>Pendaftaran Mitra Driver Baru:</strong> Isi data dan berkas foto identitas Anda. Akun langsung aktif untuk segera menerima orderan.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap (Sesuai KTP)
            </label>
            <input
              type="text"
              value={drvName}
              onChange={(e) => setDrvName(e.target.value)}
              placeholder="Sesuai kartu identitas"
              required
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIK (16 Digit KTP)
              </label>
              <input
                type="text"
                maxLength={16}
                value={drvNik}
                onChange={(e) => setDrvNik(e.target.value)}
                placeholder="3518xxxxxxxxxxxx"
                required
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. WhatsApp
              </label>
              <input
                type="tel"
                value={drvPhone}
                onChange={(e) => setDrvPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                required
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Plat Motor
              </label>
              <input
                type="text"
                value={drvPlat}
                onChange={(e) => setDrvPlat(e.target.value)}
                placeholder="AG 1234 XX"
                required
                className="w-full px-3 py-1.5 text-xs uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. SIM C
              </label>
              <input
                type="text"
                value={drvSim}
                onChange={(e) => setDrvSim(e.target.value)}
                placeholder="No SIM C Aktif"
                required
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Upload Inputs */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <label className="block font-bold text-slate-700 mb-0.5">Foto E-KTP Asli</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setDrvKtpDoc)}
                className="w-full text-[10px] text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-blue-100 file:text-blue-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-0.5">Foto STNK Motor</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setDrvStnkDoc)}
                className="w-full text-[10px] text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-blue-100 file:text-blue-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-0.5">Foto SIM C Aktif</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setDrvSimDoc)}
                className="w-full text-[10px] text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-blue-100 file:text-blue-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-0.5">Foto SKCK Resmi</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setDrvSkckDoc)}
                className="w-full text-[10px] text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-blue-100 file:text-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi Akun
            </label>
            <input
              type="password"
              value={drvPass}
              onChange={(e) => setDrvPass(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-start space-x-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
            <input
              type="checkbox"
              id="drv-agree-check"
              checked={drvAgree}
              onChange={(e) => setDrvAgree(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="drv-agree-check" className="cursor-pointer">
              Saya menyetujui aturan komisi platform 10%, kejujuran berkas resmi, dan sistem saldo deposit.
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 font-black text-white py-2.5 rounded-xl shadow transition text-sm flex items-center justify-center space-x-1.5 active:scale-98"
          >
            <Bike className="w-4 h-4 text-white" />
            <span>KIRIM BERKAS &amp; DAFTAR MITRA DRIVER</span>
          </button>
        </form>
      )}
    </section>
  );
};
