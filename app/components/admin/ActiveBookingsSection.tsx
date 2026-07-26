'use client';

import React from 'react';
import { 
  Calendar, Clock, Tag, User, Package, Mail, Phone, Coins, Gift, CalendarX, 
  ChevronDown, ChevronUp, Loader2 
} from 'lucide-react';

// Vlastná SVG ikonka Instagramu (keďže Lucide nemá značkové ikonky)
const InstagramIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

function parseBookingDetails(summary: string, description: string) {
  const desc = description || '';

  const refMatch = (summary + ' ' + desc).match(/#?(RES-[A-Z0-9]+)/i);
  const bookingRef = refMatch ? refMatch[1].toUpperCase() : null;

  const getLine = (keyword: string) => {
    const line = desc.split('\n').find((l) => l.toLowerCase().startsWith(keyword.toLowerCase()));
    if (!line) return null;
    return line.split(':').slice(1).join(':').trim();
  };

  const name = getLine('Meno') || summary.replace(/^REZERVÁCIA:\s*/i, '').split('-')[0]?.trim() || 'Hosť';
  const email = getLine('Email');
  const phone = getLine('Tel');
  const instagram = getLine('IG');
  const packageType = getLine('Balíček');
  const basePrice = getLine('Pôvodná cena');
  const finalPrice = getLine('Finálna cena');
  const notes = getLine('Poznámky & Odmeny') || getLine('Poznámka klienta');

  return {
    bookingRef,
    name,
    email,
    phone,
    instagram,
    packageType,
    basePrice,
    finalPrice,
    notes,
  };
}

type Props = {
  activeBookings: any[];
  loadingBookings: boolean;
  isBookingsCollapsed: boolean;
  setIsBookingsCollapsed: (collapsed: boolean) => void;
  fetchActiveBookings: () => void;
  handleCancelDirectBooking: (eventId: string) => void;
  language: string;
};

export default function ActiveBookingsSection({
  activeBookings,
  loadingBookings,
  isBookingsCollapsed,
  setIsBookingsCollapsed,
  fetchActiveBookings,
  handleCancelDirectBooking,
  language,
}: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden text-left font-sans">
      <button
        type="button"
        onClick={() => setIsBookingsCollapsed(!isBookingsCollapsed)}
        className="w-full p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <Calendar size={14} />
          <span>{language === 'sk' ? `Aktívne rezervácie (${activeBookings.length})` : `Active bookings (${activeBookings.length})`}</span>
        </h2>
        <div className="text-slate-400 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fetchActiveBookings();
            }}
            className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mr-2"
          >
            {language === 'sk' ? 'Obnoviť' : 'Refresh'}
          </button>
          <span>{isBookingsCollapsed ? (language === 'sk' ? 'Rozbaliť' : 'Expand') : (language === 'sk' ? 'Schovať' : 'Collapse')}</span>
          {isBookingsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {!isBookingsCollapsed && (
        <div className="p-4">
          {loadingBookings ? (
            <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-indigo-600" />
              <span>{language === 'sk' ? 'Načítavam kalendár...' : 'Loading calendar...'}</span>
            </div>
          ) : activeBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBookings.map((b) => {
                const parsed = parseBookingDetails(b.summary, b.description);
                const startDate = new Date(b.start);
                const formattedDate = startDate.toLocaleDateString('sk-SK');
                const formattedTime = startDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={b.id} className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4 shadow-sm text-left flex flex-col justify-between">
                    <div className="space-y-3">
                      
                      {/* ČÍSLO REZERVÁCIE + 2X VÄČŠIA BUBLINA S ČASOM */}
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-3 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                            <Tag size={16} />
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight truncate">
                              {parsed.bookingRef ? `#${parsed.bookingRef}` : b.summary}
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                              <Calendar size={12} />
                              <span>{formattedDate}</span>
                            </p>
                          </div>
                        </div>

                        <div className="px-3.5 py-1.5 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-md flex items-center gap-1.5 shrink-0">
                          <Clock size={16} />
                          <span>{formattedTime}</span>
                        </div>
                      </div>

                      {/* FORMULÁROVÉ POLÍČKA S IKONAMI */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                          <User size={14} className="text-indigo-500 shrink-0" />
                          <span className="text-slate-400 font-medium">Meno:</span>
                          <strong className="text-slate-800 dark:text-slate-100 truncate">{parsed.name}</strong>
                        </div>

                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                          <Package size={14} className="text-purple-500 shrink-0" />
                          <span className="text-slate-400 font-medium">Balíček:</span>
                          <strong className="text-slate-800 dark:text-slate-100 truncate">{parsed.packageType || b.summary}</strong>
                        </div>

                        {parsed.email && parsed.email !== '-' && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                            <Mail size={14} className="text-sky-500 shrink-0" />
                            <span className="text-slate-400 font-medium">Email:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{parsed.email}</span>
                          </div>
                        )}

                        {parsed.phone && parsed.phone !== '-' && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                            <Phone size={14} className="text-emerald-500 shrink-0" />
                            <span className="text-slate-400 font-medium">Tel:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{parsed.phone}</span>
                          </div>
                        )}

                        {parsed.instagram && parsed.instagram !== '-' && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                            <InstagramIcon size={14} className="text-pink-500 shrink-0" />
                            <span className="text-slate-400 font-medium">IG:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{parsed.instagram}</span>
                          </div>
                        )}

                        {parsed.basePrice && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                            <Tag size={14} className="text-slate-400 shrink-0" />
                            <span className="text-slate-400 font-medium">Pôvodná:</span>
                            <span className="text-slate-400 line-through font-medium">{parsed.basePrice}</span>
                          </div>
                        )}

                        {parsed.finalPrice && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                            <Coins size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-emerald-700 dark:text-emerald-300 font-medium">Cena:</span>
                            <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">{parsed.finalPrice}</strong>
                          </div>
                        )}
                      </div>

                      {parsed.notes && (
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs">
                          <Gift size={14} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <strong className="text-purple-900 dark:text-purple-300 font-bold block mb-0.5">Poznámky & Odmeny:</strong>
                            <p className="text-purple-800 dark:text-purple-200 font-medium leading-relaxed">{parsed.notes}</p>
                          </div>
                        </div>
                      )}

                    </div>

                    <button
                      type="button"
                      onClick={() => handleCancelDirectBooking(b.id)}
                      className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm mt-2 cursor-pointer"
                    >
                      <CalendarX size={15} />
                      <span>{language === 'sk' ? 'Stornovať túto rezerváciu' : 'Cancel booking'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400 py-6">
              {language === 'sk' ? 'Žiadne nadchádzajúce rezervácie.' : 'No upcoming bookings.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}