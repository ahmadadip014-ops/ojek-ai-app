import React from 'react';
import { User } from '../types';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface DocumentViewerModalProps {
  user: User | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ user, onClose }) => {
  if (!user) return null;

  const docs = user.documents || {};

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Berkas Verifikasi: {user.name}</span>
            </h4>
            <p className="text-[11px] text-slate-500 font-mono">
              NIK: {user.nik || 'Tidak tercatat'} • Role: {user.role}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* E-KTP */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-black text-xs text-slate-800 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Foto E-KTP Asli:</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {docs.ktp ? 'Tersedia' : 'Belum diunggah'}
              </span>
            </div>
            {docs.ktp ? (
              <img
                src={docs.ktp}
                alt="Foto E-KTP"
                className="w-full max-h-48 object-contain rounded-lg border border-slate-300 bg-white"
              />
            ) : (
              <p className="text-[11px] text-slate-400 italic">User belum mengunggah foto E-KTP.</p>
            )}
          </div>

          {user.role === 'DRIVER' && (
            <>
              {/* STNK Motor */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs text-slate-800 flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>2. Foto STNK Motor (Plat: {user.platMotor || '-'}):</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {docs.stnk ? 'Tersedia' : 'Belum diunggah'}
                  </span>
                </div>
                {docs.stnk ? (
                  <img
                    src={docs.stnk}
                    alt="Foto STNK"
                    className="w-full max-h-48 object-contain rounded-lg border border-slate-300 bg-white"
                  />
                ) : (
                  <p className="text-[11px] text-slate-400 italic">User belum mengunggah foto STNK.</p>
                )}
              </div>

              {/* SIM C */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs text-slate-800 flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span>3. Foto SIM C Aktif (No: {user.simNo || '-'}):</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {docs.sim ? 'Tersedia' : 'Belum diunggah'}
                  </span>
                </div>
                {docs.sim ? (
                  <img
                    src={docs.sim}
                    alt="Foto SIM C"
                    className="w-full max-h-48 object-contain rounded-lg border border-slate-300 bg-white"
                  />
                ) : (
                  <p className="text-[11px] text-slate-400 italic">User belum mengunggah foto SIM C.</p>
                )}
              </div>

              {/* SKCK */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs text-slate-800 flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    <span>4. Foto SKCK Resmi Kepolisian:</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {docs.skck ? 'Tersedia' : 'Belum diunggah'}
                  </span>
                </div>
                {docs.skck ? (
                  <img
                    src={docs.skck}
                    alt="Foto SKCK"
                    className="w-full max-h-48 object-contain rounded-lg border border-slate-300 bg-white"
                  />
                ) : (
                  <p className="text-[11px] text-slate-400 italic">User belum mengunggah foto SKCK.</p>
                )}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-slate-900 text-white font-black py-2.5 rounded-xl text-xs uppercase transition hover:bg-black"
        >
          Tutup Penampil Berkas
        </button>
      </div>
    </div>
  );
};
