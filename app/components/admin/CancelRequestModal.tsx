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
    <div className="fixed inset-0 z-[100] bg-[#010314]/80 backdrop-blur-sm flex items-center justify-center p-6 font-sans animate-fadeIn text-[#DDE0F2]">
      <div className="w-full max-w-md p-6 sm:p-7 rounded-2xl bg-[#0B0D22] border border-[#2B2F49] shadow-2xl space-y-4 relative text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#C7CAE0] hover:text-white transition cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 mx-auto rounded-full bg-[#FF5A7A]/15 text-[#FF5A7A] flex items-center justify-center shadow">
          <CalendarX size={20} />
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-base text-[#FFFFFF]">
            {language === 'sk' ? 'Požiadať o storno rezervácie' : 'Request Booking Cancellation'}
          </h3>
          <p className="text-xs text-[#A78BFA] font-mono font-medium">
            {booking.bookingRef ? `#${booking.bookingRef}` : booking.summary}
          </p>
        </div>

        <form onSubmit={handleSendRequest} className="space-y-3 pt-2 text-left">
          <div>
            <label className="block text-xs font-medium text-[#C7CAE0] mb-1">
              {language === 'sk' ? 'Dôvod storna (nepovinné):' : 'Reason for cancellation (optional):'}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'sk' ? 'Uveďte dôvod zrušenia...' : 'Reason...'}
              className="w-full p-3 rounded-xl border border-[#2B2F49] bg-[#010314] text-[#FFFFFF] text-xs focus:border-[#6633EE] focus:outline-none placeholder-[#C7CAE0]/50"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] text-xs font-medium flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-full bg-[#6633EE]/15 border border-[#6633EE]/30 text-[#A78BFA] text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary text-xs uppercase tracking-wider"
            >
              {language === 'sk' ? 'Zrušiť' : 'Close'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-danger text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
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