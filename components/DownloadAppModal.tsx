import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Smartphone,
  Share2,
  CheckCircle2,
  FileCode,
  HardDriveDownload,
  Apple,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { BrandingConfig } from '../types';
import { getOrders, getUsers } from '../utils/storage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface DownloadAppModalProps {
  branding: BrandingConfig;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ branding, onClose }) => {
  const [deviceTab, setDeviceTab] = useState<'android' | 'iphone' | 'file'>('android');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleNativeInstall = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallStatus('Aplikasi berhasil dipasang di layar utama handphone Anda!');
        } else {
          setInstallStatus('Pemasangan dibatalkan.');
        }
      } catch {
        setInstallStatus('Silakan gunakan cara manual di bawah.');
      }
    } else {
      setInstallStatus('Browser Anda mendukung pemasangan manual melalui menu browser.');
    }
  };

  // Generate & download offline launcher HTML file
  const handleDownloadOfflineFile = () => {
    const currentUrl = window.location.href;
    const offlineHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${branding.appName || 'Mas Tolong'} - Kertosono Jombang</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .card {
      background: white;
      padding: 32px 24px;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      width: 100%;
      border: 2px solid #fbbf24;
    }
    .logo {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid #000;
      margin-bottom: 16px;
      object-fit: cover;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 22px;
      font-weight: 900;
    }
    p {
      color: #475569;
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn {
      display: block;
      background: #f59e0b;
      color: #000;
      text-decoration: none;
      font-weight: 900;
      padding: 14px 20px;
      border-radius: 16px;
      font-size: 14px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: background 0.2s;
    }
    .btn:hover { background: #d97706; }
    .badge {
      display: inline-block;
      margin-top: 18px;
      font-size: 11px;
      font-weight: bold;
      background: #dcfce7;
      color: #166534;
      padding: 4px 12px;
      border-radius: 9999px;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${branding.logoUrl}" class="logo" alt="Logo">
    <h1>${branding.appName || 'MAS TOLONG'}</h1>
    <p>Aplikasi Resmi Transportasi & Jastip Kertosono - Jombang.<br>Ketuk tombol di bawah untuk membuka aplikasi secara langsung di layar penuh handphone Anda:</p>
    <a href="${currentUrl}" class="btn">🚀 BUKA APLIKASI SEKARANG</a>
    <div class="badge">✅ Mendukung Semua HP Android &amp; iPhone</div>
  </div>
  <script>
    // Auto redirect after 1.5s
    setTimeout(function() {
      window.location.href = "${currentUrl}";
    }, 1500);
  </script>
</body>
</html>`;

    const blob = new Blob([offlineHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Mas-Tolong-Kertosono-App.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setInstallStatus('File aplikasi Mas-Tolong-Kertosono-App.html berhasil diunduh ke HP Anda!');
  };

  // Download App Backup & Orders Data
  const handleDownloadBackupData = () => {
    const data = {
      appName: branding.appName,
      exportedAt: new Date().toISOString(),
      orders: getOrders(),
      usersCount: getUsers().length,
      device: navigator.userAgent,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mas-tolong-backup-${Date.now().toString().slice(-4)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setInstallStatus('File backup data aplikasi berhasil diunduh!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 border-amber-400 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 px-5 py-4 flex items-center justify-between border-b border-amber-400">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-950 text-amber-300 rounded-xl shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-950 leading-tight">
                Unduh &amp; Pasang Aplikasi
              </h3>
              <p className="text-[11px] font-bold text-slate-800">
                Kompatibel untuk Semua Merk Handphone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-950/10 hover:bg-slate-950/20 text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 bg-slate-100 p-1.5 gap-1 border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setDeviceTab('android')}
            className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-1 ${
              deviceTab === 'android'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceTab('iphone')}
            className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-1 ${
              deviceTab === 'iphone'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone / iOS</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceTab('file')}
            className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-1 ${
              deviceTab === 'file'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh File</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {installStatus && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-2xl flex items-center space-x-2 font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{installStatus}</span>
            </div>
          )}

          {/* Android Tab Content */}
          {deviceTab === 'android' && (
            <div className="space-y-3.5">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                  Semua Merk HP Android
                </span>
                <p className="text-slate-800 text-xs font-medium mt-1.5 leading-relaxed">
                  Bisa dipasang di semua handphone Android: <strong>Samsung, Xiaomi, Oppo, Vivo, Realme, Infinix, Poco</strong>, dll tanpa perlu download dari PlayStore.
                </p>
              </div>

              {/* Direct Install Button if supported */}
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-md transition active:scale-98"
              >
                <HardDriveDownload className="w-4 h-4" />
                <span>📱 Pasang Aplikasi ke Layar Utama Sekarang</span>
              </button>

              {/* Step by Step Guide for Android Chrome */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                <h4 className="font-black text-slate-900 flex items-center space-x-1.5">
                  <span>Petunjuk Pasang di Google Chrome Android:</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 font-medium leading-relaxed pl-1">
                  <li>
                    Ketuk tanda <strong className="text-slate-900">titik tiga (⋮)</strong> di pojok kanan atas browser Google Chrome.
                  </li>
                  <li>
                    Pilih menu <strong className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-black">"Pasang aplikasi"</strong> atau <strong className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-black">"Tambahkan ke Layar Utama"</strong>.
                  </li>
                  <li>
                    Ketuk <strong>"Instal"</strong>. Ikon <strong>Mas Tolong</strong> akan langsung muncul di menu dan layar depan HP Anda seperti aplikasi bawaan!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* iPhone Tab Content */}
          {deviceTab === 'iphone' && (
            <div className="space-y-3.5">
              <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-2xl">
                <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                  Apple iPhone &amp; iPad
                </span>
                <p className="text-slate-800 text-xs font-medium mt-1.5 leading-relaxed">
                  Tidak memerlukan Apple App Store. Bisa langsung dipasang secara instan melalui browser <strong>Safari</strong>.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                <h4 className="font-black text-slate-900 flex items-center space-x-1.5">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>Langkah Pasang di Safari iPhone:</span>
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-700 font-medium leading-relaxed pl-1">
                  <li>
                    Buka link aplikasi ini di browser <strong className="text-slate-900">Safari</strong> iPhone Anda.
                  </li>
                  <li>
                    Ketuk tombol <strong className="text-blue-700 font-black">Bagikan (Share)</strong> berbentuk kotak dengan panah ke atas di bilah bawah Safari.
                  </li>
                  <li>
                    Gulir ke bawah dan ketuk opsi <strong className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-black">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                  </li>
                  <li>
                    Ketuk <strong className="text-slate-900">"Tambah"</strong> di pojok kanan atas. Aplikasi siap dibuka kapan saja!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* File Download Tab Content */}
          {deviceTab === 'file' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl">
                <h4 className="font-black text-amber-950 flex items-center space-x-1.5">
                  <Download className="w-4 h-4 text-amber-700" />
                  <span>Unduh Berkas Aplikasi ke Penyimpanan HP:</span>
                </h4>
                <p className="text-amber-900 text-xs font-medium mt-1 leading-relaxed">
                  Anda dapat mengunduh berkas web launcher mandiri (.html) untuk disimpan di memori HP Anda sehingga bisa dibuka kapan pun secara langsung.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadOfflineFile}
                className="w-full bg-slate-900 hover:bg-slate-800 text-amber-300 font-black py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-md transition active:scale-98"
              >
                <FileCode className="w-4 h-4" />
                <span>📥 Unduh Berkas Aplikasi (.html Web Launcher)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadBackupData}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-2.5 rounded-2xl text-xs flex items-center justify-center space-x-2 border border-slate-300 transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>📥 Unduh Arsip Data Pesanan &amp; Transaksi (JSON)</span>
              </button>
            </div>
          )}

          {/* Guaranteed Universal Compatibility Banner */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-[11px] text-blue-900 space-y-1">
            <div className="flex items-center space-x-1.5 font-black">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Akses Bebas Untuk Semua Orang:</span>
            </div>
            <p className="text-slate-600">
              Semua orang dapat langsung mendaftar sebagai Pelanggan atau Mitra Driver dari handphone apa saja tanpa batasan tipe HP.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-800 transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
