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
    <div className="bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-2xl shadow-sm overflow-hidden text-left font-sans text-[#1E293B] dark:text-[#DDE0F2]">
      <button
        type="button"
        onClick={() => setIsBookingsCollapsed(!isBookingsCollapsed)}
        className="w-full p-4 border-b border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50/50 dark:bg-[#010314]/50 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-[#010314] transition cursor-pointer"
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#6633EE] dark:text-[#A78BFA] flex items-center gap-2">
          <Calendar size={15} />
          <span>{language === 'sk' ? `Aktívne rezervácie (${activeBookings.length})` : `Active bookings (${activeBookings.length})`}</span>
        </h2>
        <div className="text-[#64748B] dark:text-[#C7CAE0]/60 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fetchActiveBookings();
            }}
            className="text-[11px] font-semibold text-[#6633EE] dark:text-[#A78BFA] hover:underline mr-2"
          >
            {language === 'sk' ? 'Obnoviť' : 'Refresh'}
          </button>
          <span>{isBookingsCollapsed ? (language === 'sk' ? 'Rozbaliť' : 'Expand') : (language === 'sk' ? 'Schovať' : 'Collapse')}</span>
          {isBookingsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {!isBookingsCollapsed && (
        <div className="p-4 sm:p-5">
          {loadingBookings ? (
            <div className="py-8 text-center text-[#64748B] dark:text-[#C7CAE0]/60 text-xs flex items-center justify-center gap-2 font-normal">
              <Loader2 size={18} className="animate-spin text-[#6633EE]" />
              <span>{language === 'sk' ? 'Načítavam kalendár...' : 'Loading calendar...'}</span>
            </div>
          ) : activeBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBookings.map((b) => {
                const parsed = parseBookingDetails(b.summary, b.description);
                const startDate = new Date(b.start);
                const formattedDate = startDate.toLocaleDateString('sk-SK', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric'
                });
                const formattedTime = startDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={b.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-3 shadow-xs text-left flex flex-col justify-between">
                    <div className="space-y-3">
                      
                      {/* ČÍSLO REZERVÁCIE + ČASOVÁ BUBLINA */}
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2B2F49] pb-3 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-2 rounded-xl bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] font-bold shrink-0 border border-[#6633EE]/30">
                            <Tag size={15} />
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-[#0B0D22] dark:text-[#FFFFFF] tracking-tight truncate">
                              {parsed.bookingRef ? `#${parsed.bookingRef}` : b.summary}
                            </h3>
                            <p className="text-[11px] font-normal text-[#64748B] dark:text-[#C7CAE0]/60 flex items-center gap-1">
                              <Calendar size={12} />
                              <span>{formattedDate}</span>
                            </p>
                          </div>
                        </div>

                        <div className="px-3 py-1.5 rounded-xl bg-[#6633EE] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 shrink-0">
                          <Clock size={14} />
                          <span>{formattedTime}</span>
                        </div>
                      </div>

                      {/* FORMULÁROVÉ POLÍČKA */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49]">
                          <User size={13} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                          <span className="text-[#64748B] dark:text-[#C7CAE0]/60 font-medium">Meno:</span>
                          <strong className="text-[#0B0D22] dark:text-[#FFFFFF] truncate font-semibold">{parsed.name}</strong>
                        </div>

                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49]">
                          <Package size={13} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                          <span className="text-[#64748B] dark:text-[#C7CAE0]/60 font-medium">Balíček:</span>
                          <strong className="text-[#0B0D22] dark:text-[#FFFFFF] truncate font-semibold">{parsed.packageType || b.summary}</strong>
                        </div>

                        {parsed.email && parsed.email !== '-' && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49]">
                            <Mail size={13} className="text-[#64748B] dark:text-[#C7CAE0]/60 shrink-0" />
                            <span className="text-[#64748B] dark:text-[#C7CAE0]/60 font-medium">Email:</span>
                            <span className="text-[#1E293B] dark:text-[#DDE0F2] font-medium truncate">{parsed.email}</span>
                          </div>
                        )}

                        {parsed.phone && parsed.phone !== '-' && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49]">
                            <Phone size={13} className="text-[#10B981] shrink-0" />
                            <span className="text-[#64748B] dark:text-[#C7CAE0]/60 font-medium">Tel:</span>
                            <span className="text-[#1E293B] dark:text-[#DDE0F2] font-medium truncate">{parsed.phone}</span>
                          </div>
                        )}

                        {parsed.instagram && parsed.instagram !== '-' && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49]">
                            <InstagramIcon size={13} className="text-pink-500 shrink-0" />
                            <span className="text-[#64748B] dark:text-[#C7CAE0]/60 font-medium">IG:</span>
                            <span className="text-[#1E293B] dark:text-[#DDE0F2] font-medium truncate">{parsed.instagram}</span>
                          </div>
                        )}

                        {parsed.finalPrice && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30">
                            <Coins size={13} className="text-[#10B981] shrink-0" />
                            <span className="text-[#10B981] font-medium">Cena:</span>
                            <strong className="text-[#10B981] font-bold text-xs">{parsed.finalPrice}</strong>
                          </div>
                        )}
                      </div>

                      {parsed.notes && (
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#6633EE]/10 border border-[#6633EE]/20 text-xs">
                          <Gift size={13} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <strong className="text-[#6633EE] dark:text-[#A78BFA] font-semibold block mb-0.5">Poznámky & Odmeny:</strong>
                            <p className="text-[#1E293B] dark:text-[#DDE0F2] font-normal leading-relaxed">{parsed.notes}</p>
                          </div>
                        </div>
                      )}

                    </div>

                    <button
                      type="button"
                      onClick={() => handleCancelDirectBooking(b.id)}
                      className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-[#FF5A7A]/15 border border-rose-200 dark:border-[#FF5A7A]/30 text-rose-600 dark:text-[#FF5A7A] font-semibold text-xs hover:bg-rose-100 transition active:scale-95 flex items-center justify-center gap-1.5 shadow-xs mt-2 cursor-pointer"
                    >
                      <CalendarX size={14} />
                      <span>{language === 'sk' ? 'Stornovať túto rezerváciu' : 'Cancel booking'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-xs text-[#64748B] dark:text-[#C7CAE0]/60 py-6 font-normal">
              {language === 'sk' ? 'Žiadne nadchádzajúce rezervácie.' : 'No upcoming bookings.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}