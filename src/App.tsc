import React, { useState, useEffect, useCallback } from 'react';
import { User, Order, TariffConfig, BrandingConfig } from './types';
import {
  getSession,
  saveSession,
  getTariffConfig,
  getBrandingConfig,
  getOrders,
  getUsers,
  subscribeToDataChanges,
} from './utils/storage';
import { unlockAudioEngine } from './utils/audioAlert';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { DriverProfileModal } from './components/DriverProfileModal';
import { DownloadAppModal } from './components/DownloadAppModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getSession());
  const [tariff, setTariff] = useState<TariffConfig>(() => getTariffConfig());
  const [branding, setBranding] = useState<BrandingConfig>(() => getBrandingConfig());
  const [orders, setOrders] = useState<Order[]>(() => getOrders());

  // Modal states
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(false);
  const [isDriverProfileOpen, setIsDriverProfileOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Global Audio Gesture Unlocker
  useEffect(() => {
    const handleGesture = () => {
      unlockAudioEngine();
    };
    window.addEventListener('pointerdown', handleGesture, { once: true });
    window.addEventListener('touchstart', handleGesture, { once: true });
    window.addEventListener('click', handleGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('click', handleGesture);
    };
  }, []);

  // Sync layout style on body
  useEffect(() => {
    document.body.className = `${branding.layoutStyle || 'layout-modern'} text-slate-800 antialiased min-h-screen pb-12 bg-slate-100`;
  }, [branding.layoutStyle]);

  // Refresh callback
  const refreshAllState = useCallback(() => {
    setOrders(getOrders());
    setTariff(getTariffConfig());
    setBranding(getBrandingConfig());
    const session = getSession();
    if (session) {
      // Refresh current user data from users list
      const allUsers = getUsers();
      const updated = allUsers.find((u) => u.id === session.id);
      if (updated) {
        setCurrentUser(updated);
        saveSession(updated);
      } else {
        setCurrentUser(session);
      }
    } else {
      setCurrentUser(null);
    }
  }, []);

  // Listen to multi-tab & cross-component changes
  useEffect(() => {
    const unsubscribe = subscribeToDataChanges((type) => {
      if (type === 'orders_updated' || type === 'reset_all') {
        setOrders(getOrders());
      }
      if (type === 'tariff_updated' || type === 'reset_all') {
        setTariff(getTariffConfig());
      }
      if (type === 'branding_updated' || type === 'reset_all') {
        setBranding(getBrandingConfig());
      }
      if (type === 'users_updated' || type === 'session_updated' || type === 'reset_all') {
        refreshAllState();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshAllState]);

  const handleLogout = () => {
    saveSession(null);
    setCurrentUser(null);
  };

  const handleQuickSwitchUser = (role: 'CUSTOMER' | 'DRIVER' | 'ADMIN') => {
    if (role === 'ADMIN') {
      // Admin is reserved for official owner login only
      return;
    }
    const users = getUsers();
    let target = users.find((u) => u.role === role);
    if (!target) {
      if (role === 'DRIVER') {
        target = {
          id: '081234567891',
          name: 'Cak Slamet Raharjo',
          phone: '081234567891',
          role: 'DRIVER',
          status: 'AKTIF',
          platMotor: 'AG 4521 WZ',
          deposit: 65000,
          dailyIncome: 32000,
        };
      } else {
        target = {
          id: '081234567890',
          name: 'Budi Santoso',
          phone: '081234567890',
          role: 'CUSTOMER',
          status: 'AKTIF',
        };
      }
    }
    saveSession(target);
    setCurrentUser(target);
  };

  return (
    <div className="min-h-screen">
      {/* Header / Navbar */}
      <Navbar
        currentUser={currentUser}
        branding={branding}
        onLogout={handleLogout}
        onQuickSwitchUser={handleQuickSwitchUser}
        onOpenDownloadApp={() => setIsDownloadModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-4">
        {!currentUser ? (
          <AuthModal
            branding={branding}
            onLoginSuccess={(u) => setCurrentUser(u)}
            onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          />
        ) : currentUser.role === 'ADMIN' ? (
          <AdminDashboard
            tariff={tariff}
            branding={branding}
            orders={orders}
            onTariffChange={setTariff}
            onBrandingChange={setBranding}
            onRefreshAll={refreshAllState}
          />
        ) : currentUser.role === 'DRIVER' ? (
          <DriverDashboard
            currentUser={currentUser}
            tariff={tariff}
            activeOrders={orders}
            onOpenProfileModal={() => setIsDriverProfileOpen(true)}
            onRefreshOrders={refreshAllState}
            onUpdateCurrentUser={(u) => setCurrentUser(u)}
          />
        ) : (
          <CustomerDashboard
            currentUser={currentUser}
            tariff={tariff}
            activeOrders={orders}
            onOpenProfileModal={() => setIsCustomerProfileOpen(true)}
            onRefreshOrders={refreshAllState}
          />
        )}

        {/* Global Logout Footer Link when logged in */}
        {currentUser && (
          <div className="text-center mt-6 mb-8">
            <button
              type="button"
              onClick={handleLogout}
              className="bg-red-100/80 hover:bg-red-200 text-red-700 font-black text-xs px-5 py-2.5 rounded-2xl transition shadow-sm border border-red-200"
            >
              🚪 Keluar / Ganti Akun Sesi
            </button>
          </div>
        )}
      </main>

      {/* Customer E-KTP Verification Modal */}
      {isCustomerProfileOpen && currentUser && (
        <CustomerProfileModal
          currentUser={currentUser}
          onClose={() => setIsCustomerProfileOpen(false)}
          onUpdateUser={(u) => setCurrentUser(u)}
        />
      )}

      {/* Driver Settings Modal */}
      {isDriverProfileOpen && currentUser && (
        <DriverProfileModal
          currentUser={currentUser}
          onClose={() => setIsDriverProfileOpen(false)}
          onUpdateUser={(u) => setCurrentUser(u)}
        />
      )}

      {/* Download & Install App Modal */}
      {isDownloadModalOpen && (
        <DownloadAppModal
          branding={branding}
          onClose={() => setIsDownloadModalOpen(false)}
        />
      )}
    </div>
  );
}
