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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#010314]/80 backdrop-blur-md p-6 animate-fadeIn font-sans text-[#DDE0F2]">
      <div className="bg-[#0B0D22] rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-[#2B2F49] space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
        
        <div className="w-14 h-14 mx-auto rounded-full bg-[#6633EE] text-white flex items-center justify-center shadow-[0_0_20px_rgba(102,51,238,0.5)]">
          <CheckCircle2 size={30} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#FFFFFF] tracking-tight">
            {t.successTitle}
          </h2>
          <p className="text-xs text-[#C7CAE0] leading-relaxed font-normal">
            {t.successText}
          </p>
        </div>

        {/* 🚀 TLAČIDLÁ KALENDÁRA */}
        {bookingDetails?.slot && (
          <div className="p-3.5 rounded-xl bg-[#010314] border border-[#2B2F49] space-y-2 text-left">
            <p className="text-[11px] font-medium text-[#A78BFA] uppercase tracking-wide text-center">
              {language === 'sk' ? 'Pridať termín do vášho kalendára:' : 'Add appointment to your calendar:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-[#0B0D22] border border-[#2B2F49] text-[#FFFFFF] font-medium text-xs flex items-center justify-center gap-1.5 hover:border-[#6633EE]/60 transition shadow-sm active:scale-95"
              >
                <Calendar size={13} className="text-[#A78BFA]" />
                <span>Google Calendar</span>
              </a>

              <a
                href={icsDataUrl}
                download="masaz-termin.ics"
                className="p-2.5 rounded-full bg-[#0B0D22] border border-[#2B2F49] text-[#FFFFFF] font-medium text-xs flex items-center justify-center gap-1.5 hover:border-[#6633EE]/60 transition shadow-sm active:scale-95"
              >
                <Download size={13} className="text-[#A78BFA]" />
                <span>Apple / iCal</span>
              </a>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full btn-primary text-xs uppercase tracking-wider"
        >
          {t.successHomeBtn}
        </button>
      </div>
    </div>
  );
}