import React from 'react';
import { User, BrandingConfig } from '../types';
import { LogOut, ShieldCheck, Bike, UserCheck, RefreshCw, Download } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  branding: BrandingConfig;
  onLogout: () => void;
  onQuickSwitchUser: (role: 'CUSTOMER' | 'DRIVER' | 'ADMIN') => void;
  onOpenDownloadApp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  branding,
  onLogout,
  onQuickSwitchUser,
  onOpenDownloadApp,
}) => {
  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 text-white sticky top-0 z-40 shadow-lg border-b border-blue-500/30">
      <div className="max-w-md mx-auto px-4 py-2.5 flex justify-between items-center">
        <div className="flex items-center space-x-2.5">
          <img
            src="/assets/aistudio/Maskot_Ojek_Serba_Bisa_Mas_Tolong_67e2d33f.png"
            alt="Logo Ojek Serba Bisa Mas Tolong"
            className="h-10 w-10 rounded-full border-2 border-white object-contain bg-white shadow-md p-0.5"
            onError={(e) => {
              (e.target as HTMLImageElement).src = branding.logoUrl;
            }}
          />
          <div>
            <h1 className="font-black text-base sm:text-lg tracking-tight leading-none text-white uppercase drop-shadow-xs">
              {branding.appName || 'OJEK SERBA BISA'}
            </h1>
            <p className="text-[10px] sm:text-[11px] font-black text-blue-100 leading-tight tracking-wide drop-shadow-xs">
              {branding.tagline || 'MAS TOLONG MAS SOLUSINYA!!!'}
            </p>
          </div>
        </div>

        {currentUser ? (
          <div className="flex items-center space-x-2">
            {/* Role indicator */}
            <div className="text-right">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-slate-900 text-amber-300 border border-amber-400/40'
                    : currentUser.role === 'DRIVER'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-white text-blue-900 font-black'
                }`}
              >
                {currentUser.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 mr-1" />}
                {currentUser.role === 'DRIVER' && <Bike className="w-3 h-3 mr-1" />}
                {currentUser.role === 'CUSTOMER' && <UserCheck className="w-3 h-3 mr-1" />}
                {currentUser.role}
              </span>
            </div>

            {/* Quick role test switcher dropdown (Only Customer & Driver demo - Admin is official owner only) */}
            <div className="relative group">
              <button
                type="button"
                title="Ganti Akun Demo (Pelanggan / Driver)"
                className="bg-white/15 hover:bg-white/25 p-1.5 rounded-lg text-white transition flex items-center border border-white/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 hidden group-hover:block z-50 text-xs text-slate-800">
                <div className="px-3 py-1 font-extrabold text-[10px] text-slate-400 uppercase">
                  Ganti Akun Demo:
                </div>
                <button
                  type="button"
                  onClick={() => onQuickSwitchUser('CUSTOMER')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 font-bold flex items-center text-slate-800"
                >
                  👤 Pelanggan (Budi)
                </button>
                <button
                  type="button"
                  onClick={() => onQuickSwitchUser('DRIVER')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 font-bold flex items-center text-slate-800"
                >
                  🛵 Driver (Cak Slamet)
                </button>
              </div>
            </div>

            {/* Unduh / Pasang Aplikasi button */}
            <button
              type="button"
              onClick={onOpenDownloadApp}
              title="Unduh & Pasang Aplikasi di HP"
              className="bg-white hover:bg-blue-50 text-blue-700 font-black text-xs px-2.5 py-1.5 rounded-xl shadow transition flex items-center space-x-1 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Unduh</span>
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={onLogout}
              title="Keluar"
              className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenDownloadApp}
              className="bg-white hover:bg-blue-50 text-blue-700 font-black text-xs px-3 py-1.5 rounded-xl shadow transition flex items-center space-x-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Unduh App</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
