import React, { useState } from 'react';
import { User, DriverReview } from '../types';
import { getUsers, saveUsers, saveSession } from '../utils/storage';
import { X, Settings, CheckCircle2, Star, MessageSquare, Sparkles, ShieldCheck } from 'lucide-react';

interface DriverProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateUser: (u: User) => void;
}

export const DriverProfileModal: React.FC<DriverProfileModalProps> = ({
  currentUser,
  onClose,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'reputation' | 'edit'>('reputation');
  const [photoUrl, setPhotoUrl] = useState(currentUser.photoUrl || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [platMotor, setPlatMotor] = useState(currentUser.platMotor || '');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const avgRating = currentUser.rating ? currentUser.rating.toFixed(1) : '5.0';
  const totalReviews = currentUser.ratingCount || (currentUser.reviews ? currentUser.reviews.length : 12);
  const reviews: DriverReview[] = currentUser.reviews && currentUser.reviews.length > 0 ? currentUser.reviews : [
    {
      orderId: 'MT-8812',
      customerId: '081234567890',
      customerName: 'Budi Santoso',
      rating: 5,
      tags: ['⚡ Tepat Waktu', '🛵 Motor Bersih & Nyaman', '😊 Driver Ramah & Sopan'],
      comment: 'Driver sangat ramah, helm bersih wangi, jalanan hafal banget area Kertosono!',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      orderId: 'MT-7643',
      customerId: '085711223344',
      customerName: 'Siti Aminah',
      rating: 5,
      tags: ['📦 Belanjaan / Paket Utuh', '⏱️ Gaspol Cepat Sampai'],
      comment: 'Jastip sayur dan daging pasarnya komplit sesuai pesanan tanpa kurang sedikitpun.',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...currentUser,
      photoUrl: photoUrl || currentUser.photoUrl,
      phone: phone.trim(),
      platMotor: platMotor.trim().toUpperCase(),
      password: password.trim() ? password.trim() : currentUser.password,
    };

    const allUsers = getUsers();
    const updatedList = allUsers.map((u) => (u.id === currentUser.id ? updatedUser : u));
    saveUsers(updatedList);
    saveSession(updatedUser);
    onUpdateUser(updatedUser);

    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 p-4 border-b border-blue-500/30 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <img
              src={currentUser.photoUrl || '/assets/aistudio/Maskot_Ojek_Serba_Bisa_Mas_Tolong_67e2d33f.png'}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white bg-white"
            />
            <div>
              <h4 className="font-black text-sm text-white flex items-center space-x-1.5">
                <span>{currentUser.name}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </h4>
              <p className="text-[11px] font-bold text-blue-200">
                Mitra Driver • Plat: {currentUser.platMotor || 'AG 4521 WZ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('reputation')}
            className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 transition ${
              activeTab === 'reputation'
                ? 'border-blue-600 text-blue-700 bg-white font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Reputasi Bintang Driver</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 transition ${
              activeTab === 'edit'
                ? 'border-blue-600 text-blue-700 bg-white font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span>Pengaturan Akun</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 space-y-4">
          {activeTab === 'reputation' ? (
            <div className="space-y-4">
              {/* Rating Hero Card */}
              <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white p-4 rounded-2xl shadow-md text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full inline-block">
                  ⭐ Skor Bintang Mitra Resmi
                </span>

                <div className="flex justify-center items-baseline space-x-1">
                  <span className="text-4xl font-black tracking-tight">{avgRating}</span>
                  <span className="text-sm font-bold opacity-80">/ 5.0</span>
                </div>

                <div className="flex justify-center space-x-1 text-amber-300">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 fill-amber-300 text-amber-300 drop-shadow-xs" />
                  ))}
                </div>

                <p className="text-xs font-bold opacity-90 text-blue-100">
                  Berdasarkan total <strong>{totalReviews} ulasan</strong> dari pelanggan puas di Kertosono &amp; Jombang
                </p>
              </div>

              {/* Driver Strengths & Badges */}
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-black text-blue-950">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Paling Sering Dipuji Pelanggan:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-xl border border-blue-200 flex items-center space-x-1.5 shadow-2xs">
                    <span className="text-sm">⚡</span>
                    <span className="font-bold text-slate-800">Tepat Waktu (98%)</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-blue-200 flex items-center space-x-1.5 shadow-2xs">
                    <span className="text-sm">😊</span>
                    <span className="font-bold text-slate-800">Ramah &amp; Sopan (100%)</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-blue-200 flex items-center space-x-2 shadow-2xs">
                    <span className="text-sm">🛵</span>
                    <span className="font-bold text-slate-800">Motor Bersih (95%)</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-blue-200 flex items-center space-x-2 shadow-2xs">
                    <span className="text-sm">🛡️</span>
                    <span className="font-bold text-slate-800">Aman &amp; Tertib (99%)</span>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-900 flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ulasan Pelanggan Terakhir:</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold">
                    {reviews.length} Ulasan
                  </span>
                </div>

                <div className="space-y-2.5">
                  {reviews.map((rev, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-black text-xs text-slate-950">
                            {rev.customerName}
                          </h5>
                          <span className="text-[10px] text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-0.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-black text-amber-900">
                            {rev.rating}.0
                          </span>
                        </div>
                      </div>

                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rev.tags.map((t, tidx) => (
                            <span
                              key={tidx}
                              className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {rev.comment && (
                        <p className="text-xs text-slate-700 italic bg-slate-50 p-2 rounded-xl">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {success && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Profil driver berhasil diperbarui!</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ganti Foto Profil Driver
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-900"
                  />
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover mt-2 border border-blue-400"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Plat Motor
                  </label>
                  <input
                    type="text"
                    value={platMotor}
                    onChange={(e) => setPlatMotor(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ganti Kata Sandi (Opsional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl shadow transition text-xs uppercase cursor-pointer"
                >
                  SIMPAN PERUBAHAN PROFIL
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
