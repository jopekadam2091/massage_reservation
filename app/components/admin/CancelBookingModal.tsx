'use client';

import { useState } from 'react';
import { X, CalendarX, Search, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  language: string;
};

export default function CancelBookingModal({ isOpen, onClose, language }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/cancel-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        setSearchQuery('');
      } else {
        setErrorMsg(data.error || 'Nenašla sa žiadna rezervácia.');
      }
    } catch (err) {
      setErrorMsg('Nepodarilo sa spojiť so serverom.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 font-sans animate-fadeIn">
      <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow">
            <CalendarX size={22} />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {language === 'sk' ? 'Zrušiť / Stornovať rezerváciu' : 'Cancel Reservation'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {language === 'sk'
              ? 'Zadajte číslo rezervácie (napr. RES-K8A92) alebo meno klienta'
              : 'Enter reservation number (e.g. RES-K8A92) or client name'}
          </p>
        </div>

        <form onSubmit={handleCancelBooking} className="space-y-3 pt-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              required
              placeholder="napr. RES-K8A92 alebo Janko Hraško"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 uppercase font-mono"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
              <AlertCircle size={14} className="shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle2 size={14} className="shrink-0" />
              <p>{successMsg}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {language === 'sk' ? 'Zavrieť' : 'Close'}
            </button>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CalendarX size={14} />}
              <span>{language === 'sk' ? 'Stornovať' : 'Cancel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}