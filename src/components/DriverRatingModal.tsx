import React, { useState } from 'react';
import { Order, User } from '../types';
import { submitDriverRating } from '../utils/storage';
import { Star, X, CheckCircle2, Sparkles, MessageSquare, ThumbsUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DriverRatingModalProps {
  order: Order;
  currentUser: User;
  onClose: () => void;
  onRatingSubmitted?: (rating: number) => void;
}

const COMPLIMENT_OPTIONS = [
  '⚡ Tepat Waktu',
  '🛵 Motor Bersih & Nyaman',
  '😊 Driver Ramah & Sopan',
  '🛡️ Perjalanan Aman & Tertib',
  '📦 Belanjaan / Paket Utuh',
  '🗺️ Paham Rute Jalanan',
  '⏱️ Gaspol Cepat Sampai',
  '⭐ Komunikasi Jelas di Live Chat',
];

export const DriverRatingModal: React.FC<DriverRatingModalProps> = ({
  order,
  currentUser,
  onClose,
  onRatingSubmitted,
}) => {
  const [selectedRating, setSelectedRating] = useState<number>(order.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    order.reviewTags || ['⚡ Tepat Waktu', '😊 Driver Ramah & Sopan']
  );
  const [comment, setComment] = useState<string>(order.reviewComment || '');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 1:
        return { text: 'Kurang Memuaskan 😞', color: 'text-red-500' };
      case 2:
        return { text: 'Cukup 😐', color: 'text-amber-600' };
      case 3:
        return { text: 'Baik 🙂', color: 'text-blue-600' };
      case 4:
        return { text: 'Sangat Bagus 😊', color: 'text-emerald-600' };
      case 5:
      default:
        return { text: 'Luar Biasa Mantap! 🌟', color: 'text-amber-500 font-black' };
    }
  };

  const activeScore = hoverRating !== null ? hoverRating : selectedRating;
  const ratingInfo = getRatingLabel(activeScore);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitDriverRating(order.id, selectedRating, selectedTags, comment.trim());

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#10B981', '#F59E0B'],
      });
    } catch {
      // ignore
    }

    setIsSubmitted(true);
    if (onRatingSubmitted) {
      onRatingSubmitted(selectedRating);
    }
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 p-4 border-b border-blue-500/30 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 text-amber-300 p-1.5 rounded-xl shadow-xs">
              <Star className="w-5 h-5 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase leading-tight text-white">
                Penilaian Layanan Driver
              </h3>
              <p className="text-[11px] font-bold text-blue-100">
                Order #{order.id} • {order.serviceType}
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

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="font-black text-lg text-slate-900">
              Terima Kasih Banyak!
            </h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Penilaian Anda telah tersimpan dan langsung masuk ke profil bintang resmi driver{' '}
              <strong>{order.driverName || 'Mitra Driver'}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Driver Profile Preview */}
            <div className="flex items-center space-x-3.5 bg-blue-50/70 p-3 rounded-2xl border border-blue-200/80">
              <img
                src={
                  order.driverPhoto ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
                }
                alt={order.driverName || 'Driver'}
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-600 bg-white shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] bg-blue-700 text-white font-black px-1.5 py-0.5 rounded uppercase">
                  Mitra Driver Resmi
                </span>
                <h4 className="font-black text-sm text-slate-950 truncate mt-0.5">
                  {order.driverName || 'Cak Slamet Raharjo'}
                </h4>
                <p className="text-xs font-mono font-bold text-slate-600">
                  🛵 Plat: {order.driverPlat || 'AG 4521 WZ'}
                </p>
              </div>
            </div>

            {/* Interactive Star Rating */}
            <div className="text-center py-2 space-y-2">
              <p className="text-xs font-bold text-slate-700">
                Berapa bintang untuk pelayanan driver ini?
              </p>
              <div className="flex justify-center items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled =
                    hoverRating !== null ? star <= hoverRating : star <= selectedRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 rounded-xl hover:scale-125 transition-transform active:scale-95 cursor-pointer focus:outline-none"
                      aria-label={`Beri bintang ${star}`}
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-slate-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className={`text-xs font-black transition ${ratingInfo.color}`}>
                {activeScore} Bintang: {ratingInfo.text}
              </p>
            </div>

            {/* Compliment Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Pujian untuk Driver (Pilih yang sesuai):</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMPLIMENT_OPTIONS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Review */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Ulasan / Komentar untuk Profil Driver (Opsional):</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Contoh: Sangat puas! Driver ramah, helm bersih, sampai tujuan cepat dan aman."
                rows={2}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black py-3 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-xs uppercase tracking-wider cursor-pointer border border-blue-500"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Kirim Penilaian Driver ({selectedRating} ★)</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
