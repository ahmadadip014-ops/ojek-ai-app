import React, { useState } from 'react';
import { User } from '../types';
import { getUsers, saveUsers, saveSession } from '../utils/storage';
import { X, ShieldCheck, Upload, CheckCircle2 } from 'lucide-react';

interface CustomerProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateUser: (u: User) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  currentUser,
  onClose,
  onUpdateUser,
}) => {
  const [email, setEmail] = useState(currentUser.email || '');
  const [ktpName, setKtpName] = useState(currentUser.name || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [ktpFile, setKtpFile] = useState(currentUser.documents?.ktp || '');
  const [success, setSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setKtpFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...currentUser,
      email: email.trim(),
      name: ktpName.trim(),
      address: address.trim(),
      documents: {
        ...currentUser.documents,
        ktp: ktpFile,
      },
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
          <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>🛡️ Pengaturan Identitas Resmi (E-KTP)</span>
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Berkas verifikasi identitas berhasil disimpan!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Verifikasi Email Aktif
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lengkap Sesuai KTP
            </label>
            <input
              type="text"
              value={ktpName}
              onChange={(e) => setKtpName(e.target.value)}
              placeholder="Nama lengkap sesuai kartu identitas"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Alamat Lengkap KTP / Domisili
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Nama jalan, RT/RW, Desa/Kelurahan, Kertosono/Jombang"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Unggah Foto E-KTP Asli
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-900"
            />
            {ktpFile && (
              <div className="mt-2">
                <img
                  src={ktpFile}
                  alt="Preview E-KTP"
                  className="w-full h-32 object-contain rounded-lg border border-slate-300 bg-slate-50"
                />
              </div>
            )}
          </div>

          <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            🔒 Data E-KTP terlindungi dengan enkripsi dan <strong>HANYA BISA DILIHAT OLEH ADMIN PUSAT</strong> untuk verifikasi pencegahan order fiktif.
          </div>

          <button
            type="submit"
            className="w-full bg-amber-400 hover:bg-amber-500 font-black py-2.5 rounded-xl text-slate-950 uppercase tracking-wide transition shadow"
          >
            SIMPAN BERKAS VERIFIKASI
          </button>
        </form>
      </div>
    </div>
  );
};
