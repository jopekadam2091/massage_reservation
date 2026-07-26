'use client';

import { CheckCircle2, Calendar, Download } from 'lucide-react';

type BookingDetails = {
  slot: string;
  duration: number;
  type: string;
} | null;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  t: {
    successTitle: string;
    successText: string;
    successHomeBtn: string;
  };
  bookingDetails?: BookingDetails;
  language?: string;
};

export default function SuccessModal({ isOpen, onClose, t, bookingDetails, language = 'sk' }: Props) {
  if (!isOpen) return null;

  // Generovanie odkazov pre kalendáre
  let googleCalendarUrl = '#';
  let icsDataUrl = '#';

  if (bookingDetails?.slot) {
    const start = new Date(bookingDetails.slot);
    const end = new Date(start.getTime() + (bookingDetails.duration || 60) * 60000);

    const formatIsoForCal = (date: Date) =>
      date.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const startTimeIso = formatIsoForCal(start);
    const endTimeIso = formatIsoForCal(end);

    const title = encodeURIComponent(`Masáž: ${bookingDetails.type || 'Privátna masáž'}`);
    const details = encodeURIComponent('Rezervácia masáže bola úspešne potvrdená.');

    googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTimeIso}/${endTimeIso}&details=${details}`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Privatne Masaze//SK
BEGIN:VEVENT
SUMMARY:Masáž: ${bookingDetails.type || 'Privátna masáž'}
DESCRIPTION:Rezervácia masáže bola potvrdená.
DTSTART:${startTimeIso}
DTEND:${endTimeIso}
END:VEVENT
END:VCALENDAR`;

    icsDataUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fadeIn font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
        
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
          <CheckCircle2 size={36} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {t.successTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.successText}
          </p>
        </div>

        {/* 🚀 ODCHYT TLAČIDIEL KALENDÁRA */}
        {bookingDetails?.slot && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2 text-left">
            <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide text-center">
              {language === 'sk' ? 'Pridať termín do vášho kalendára:' : 'Add appointment to your calendar:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-indigo-50 transition shadow-sm active:scale-95"
              >
                <Calendar size={14} />
                <span>Google Calendar</span>
              </a>

              <a
                href={icsDataUrl}
                download="masaz-termin.ics"
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 transition shadow-sm active:scale-95"
              >
                <Download size={14} />
                <span>Apple / iCal</span>
              </a>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm transition shadow-md active:scale-95"
        >
          {t.successHomeBtn}
        </button>
      </div>
    </div>
  );
}