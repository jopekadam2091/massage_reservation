'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { X, CalendarX, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  userId: string;
  language: string;
};

export default function CancelRequestModal({
  isOpen,
  onClose,
  booking,
  userId,
  language,
}: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !booking) return null;

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // 🚀 1. ZAMKNUTIE PRI OPAKOVANOM KLIKU

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const bookingRef = booking.bookingRef || 'RES-UNKNOWN';

      // 🚀 2. KONTROLA: SKONTROLUJEME, ČI UŽ NEEXISTUJE ČAKAJÚCA ŽIADOSŤ PRE TÚTO REZERVÁCIU
      const { data: existingReq } = await supabase
        .from('cancellation_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('booking_ref', bookingRef)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingReq) {
        setErrorMsg(
          language === 'sk'
            ? 'Žiadosť o storno pre túto rezerváciu už bola odoslaná a čaká na schválenie.'
            : 'A cancellation request for this booking has already been submitted.'
        );
        setLoading(false);
        return;
      }

      // 3. Vloženie novej žiadosti
      const { error } = await supabase.from('cancellation_requests').insert([
        {
          user_id: userId,
          booking_ref: bookingRef,
          booking_summary: booking.summary,
          reason: reason.trim() || null,
          status: 'pending',
        },
      ]);

      if (error) {
        setErrorMsg('Chyba pri odosielaní žiadosti: ' + error.message);
      } else {
        setSuccessMsg(
          language === 'sk'
            ? 'Vaša žiadosť o storno bola úspešne odoslaná na schválenie.'
            : 'Cancellation request sent for approval.'
        );
        setTimeout(() => {
          onClose();
          setSuccessMsg('');
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg('Nepodarilo sa spojiť s databázou.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 font-sans animate-fadeIn">
      <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 relative text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow">
          <CalendarX size={22} />
        </div>

        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
            {language === 'sk' ? 'Požiadať o storno rezervácie' : 'Request Booking Cancellation'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono font-bold">
            {booking.bookingRef ? `#${booking.bookingRef}` : booking.summary}
          </p>
        </div>

        <form onSubmit={handleSendRequest} className="space-y-3 pt-2 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'sk' ? 'Dôvod storna (nepovinné):' : 'Reason for cancellation (optional):'}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'sk' ? 'Uveďte dôvod zrušenia...' : 'Reason...'}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              {language === 'sk' ? 'Zrušiť' : 'Close'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CalendarX size={14} />}
              <span>{language === 'sk' ? 'Odoslať žiadosť' : 'Send Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}