import React, { useState, useEffect, useRef } from 'react';
import { User, Order, ChatMessage } from '../types';
import {
  getChats,
  sendChatMessage,
  subscribeToDataChanges,
  playChatAudioSound,
} from '../utils/storage';
import {
  X,
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCheck,
  Sparkles,
  Camera,
  CornerDownLeft,
} from 'lucide-react';

interface LiveChatModalProps {
  order: Order;
  currentUser: User;
  onClose: () => void;
}

export const LiveChatModal: React.FC<LiveChatModalProps> = ({
  order,
  currentUser,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChats(order.id));
  const [inputText, setInputText] = useState('');
  const [photoAttachment, setPhotoAttachment] = useState<string>('');
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isCustomer = currentUser.role === 'CUSTOMER';
  const counterpartyName = isCustomer
    ? order.driverName || 'Cak Slamet Raharjo (Driver)'
    : order.customerName || 'Pelanggan Ojek Serba Bisa';
  const counterpartySub = isCustomer
    ? `🛵 Motor: ${order.driverPlat || 'AG 4521 WZ'}`
    : `👤 Pemesan: ${order.customerPhone || '081234567890'}`;
  const counterpartyPhoto = isCustomer
    ? order.driverPhoto ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';

  // Preset quick replies based on role
  const quickReplies = isCustomer
    ? [
        'Halo mas, sudah jalan?',
        'Saya tunggu di depan rumah/gerbang ya!',
        'Tolong bawa helm satu lagi mas',
        'Belanjaan sesuai list ya mas!',
        'Siap ditunggu, hati-hati di jalan ya!',
      ]
    : [
        'Halo kak, saya meluncur sekarang!',
        'Saya sudah sampai di titik jemput ya!',
        'Sedang antri di warung/toko belanja',
        'Tunggu sebentar, terjebak palang kereta Kertosono',
        'Pesanan sudah siap diantarkan!',
      ];

  // Auto-scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  // Listen for real-time messages across tabs and local state
  useEffect(() => {
    const unsubscribe = subscribeToDataChanges((type) => {
      if (type === 'chats_updated' || type === 'reset_all') {
        const updated = getChats(order.id);
        setMessages((prev) => {
          if (updated.length > prev.length) {
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.senderId !== currentUser.id) {
              playChatAudioSound('incoming');
            }
          }
          return updated;
        });
        setTimeout(() => scrollToBottom(true), 80);
      }
    });

    return () => unsubscribe();
  }, [order.id, currentUser.id]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text && !photoAttachment) return;

    // Send immediately via storage helper
    const newMsg = sendChatMessage({
      orderId: order.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: text,
      photoUrl: photoAttachment || undefined,
    });

    // Ensure immediate optimistic update in local state
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === newMsg.id);
      return exists ? prev : [...prev, newMsg];
    });

    setInputText('');
    setPhotoAttachment('');
    setShowPhotoInput(false);
    setTimeout(() => scrollToBottom(true), 60);

    // Dynamic intelligent auto-reply for simulated driver-customer conversation:
    if (currentUser.role === 'CUSTOMER') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const driverName = order.driverName || 'Cak Slamet Raharjo';
        let replyText = 'Siap kak, langsung gaspol menuju lokasi jemput!';
        const lower = text.toLowerCase();
        if (lower.includes('jalan') || lower.includes('posisi')) {
          replyText = 'Sudah jalan kak, posisi dekat pertigaan Kertosono, estimasi 2-3 menit sampai!';
        } else if (lower.includes('helm')) {
          replyText = 'Siap kak! Sudah saya siapkan helm SNI bersih dan wangi untuk kakak.';
        } else if (lower.includes('tunggu') || lower.includes('gerbang') || lower.includes('depan')) {
          replyText = 'Baik kak, nanti kalau sudah sampai saya kabari & klakson halus di depan gerbang.';
        } else if (lower.includes('belanja') || lower.includes('struk') || lower.includes('list')) {
          replyText = 'Siap kak, belanjaan sudah saya periksa lengkap sesuai pesanan. Segera meluncur!';
        } else if (lower.includes('hati')) {
          replyText = 'Terima kasih banyak kak, tetap utamakan keselamatan. Ditunggu ya!';
        }

        const replyMsg = sendChatMessage({
          orderId: order.id,
          senderId: order.driverId || '081234567891',
          senderName: driverName,
          senderRole: 'DRIVER',
          text: replyText,
        });

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === replyMsg.id);
          return exists ? prev : [...prev, replyMsg];
        });
        playChatAudioSound('incoming');
        setTimeout(() => scrollToBottom(true), 80);
      }, 1500);
    } else if (currentUser.role === 'DRIVER') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyText = 'Terima kasih infonya mas driver! Hati-hati di jalan ya.';
        const replyMsg = sendChatMessage({
          orderId: order.id,
          senderId: order.customerId,
          senderName: order.customerName,
          senderRole: 'CUSTOMER',
          text: replyText,
        });

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === replyMsg.id);
          return exists ? prev : [...prev, replyMsg];
        });
        playChatAudioSound('incoming');
        setTimeout(() => scrollToBottom(true), 80);
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md h-[92vh] max-h-[680px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header in Blue Branding */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 p-3.5 border-b border-blue-500/30 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <img
                src={counterpartyPhoto}
                alt={counterpartyName}
                className="w-11 h-11 rounded-full object-cover border-2 border-white bg-white shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="font-black text-sm text-white leading-tight">
                  {counterpartyName}
                </h4>
                <span className="bg-white/20 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                  {isCustomer ? 'Driver' : 'Pelanggan'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-blue-100 flex items-center space-x-1">
                <span>{counterpartySub}</span>
                <span className="text-emerald-300 font-extrabold">• Online</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={onClose}
              className="bg-white/15 hover:bg-white/25 p-2 rounded-full text-white transition active:scale-95 cursor-pointer"
              aria-label="Tutup Live Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Info Strip */}
        <div className="bg-blue-50 px-4 py-2 border-b border-blue-200/80 flex items-center justify-between text-[11px] font-bold text-blue-950 shrink-0">
          <div className="flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
            <span>Order #{order.id} ({order.serviceType})</span>
          </div>
          <span className="bg-blue-200/90 text-blue-900 px-2 py-0.5 rounded-full font-black text-[10px]">
            Rp {order.totalOngkir.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {/* Privacy & Safety Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center text-[11px] text-blue-900 flex items-center justify-center space-x-1.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Live Chat Ojek Serba Bisa</strong> terhubung langsung. Aman &amp; privasi nomor WA terjaga!
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-700 shadow-inner">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h5 className="font-black text-slate-800 text-sm">Belum ada obrolan</h5>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Kirim pesan atau gunakan pilihan cepat di bawah untuk koordinasi dengan {counterpartyName}.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                >
                  <div className="flex items-baseline space-x-1 mb-0.5 px-1">
                    <span className="text-[10px] font-bold text-slate-400">
                      {isMe ? 'Anda' : msg.senderName}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs ${
                      isMe
                        ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                        : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-none font-normal'
                    }`}
                  >
                    {msg.photoUrl && (
                      <div className="mb-2 overflow-hidden rounded-xl border border-black/10">
                        <img
                          src={msg.photoUrl}
                          alt="Lampiran"
                          className="max-h-48 w-full object-cover"
                        />
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.text}</p>
                    <div className="flex justify-end items-center mt-1 space-x-1 text-[9px] opacity-80">
                      <CheckCheck className={`w-3 h-3 ${isMe ? 'text-blue-100' : 'text-slate-500'}`} />
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-2xl w-fit shadow-2xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
              <span className="text-[11px] font-medium">{counterpartyName} sedang mengetik...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Chips */}
        <div className="bg-slate-100/90 px-3 py-2 border-t border-slate-200 overflow-x-auto whitespace-nowrap space-x-1.5 flex items-center shrink-0">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center mr-1">
            <Sparkles className="w-3 h-3 mr-1 text-blue-600" /> Balas:
          </span>
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(reply)}
              className="inline-block bg-white hover:bg-blue-50 active:scale-95 text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs transition shrink-0 cursor-pointer"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Optional Photo Attachment Preview & Input */}
        {showPhotoInput && (
          <div className="bg-blue-50/60 p-2.5 border-t border-blue-200 flex items-center space-x-2 shrink-0 animate-fade-in">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white"
            />
            {photoAttachment && (
              <span className="text-[11px] text-emerald-700 font-bold">✓ Foto terlampir</span>
            )}
            <button
              type="button"
              onClick={() => setShowPhotoInput(false)}
              className="text-xs text-slate-500 font-bold px-2 py-1 cursor-pointer"
            >
              Batal
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-white px-3 py-3 border-t border-slate-200 flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPhotoInput(!showPhotoInput)}
            title="Kirim Foto"
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              showPhotoInput || photoAttachment
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pesan langsung di live chat..."
              className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-300 focus:border-blue-500 rounded-2xl pl-3.5 pr-9 py-2.5 text-xs font-medium outline-none transition shadow-inner"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputText.trim() && !photoAttachment}
              className="absolute right-1 top-1 bottom-1 px-2.5 rounded-xl text-slate-400 hover:text-blue-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim() && !photoAttachment}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 p-2.5 rounded-2xl shadow transition font-black active:scale-95 disabled:active:scale-100 shrink-0 cursor-pointer"
            aria-label="Kirim Pesan"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
