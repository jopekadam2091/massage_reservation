'use client';
import React, { useState, useEffect } from 'react';
import { LangType, MassageType, TimeSlot, DiscountTheme, ContactMethod } from '@/app/types';
import { PRICES } from '@/app/constants/config';
import { getDateKey, isValidSlotDuration } from '@/app/utils/calendar';
import { supabase } from '@/app/lib/supabase';
import { useTheme } from '@/app/lib/ThemeContext';
import { Step3CalendarSkeleton } from '@/app/components/ui/Skeleton';
import { ChevronLeft, ChevronRight, Gift, Sparkles, Tag, Info, RotateCw, Flame, ArrowLeft } from 'lucide-react';

interface ActiveGift {
  id: string;
  gift_type: string;
  custom_code?: string | null;
}

type Props = {
  lang: LangType;
  t: any;
  selectedType: MassageType;
  selectedDuration: number;
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  slotsByDate: Record<string, TimeSlot[]>;
  loadingCalendar: boolean;
  selectedDateKey: string | null;
  setSelectedDateKey: (key: string | null) => void;
  selectedSlot: string | null;
  setSelectedSlot: (slot: string | null) => void;
  discountTheme: DiscountTheme;
  onBack: () => void;
  onSuccess: (bookingDetails?: any) => void;
  onRefreshCalendar?: () => void;
};

export default function Step3Calendar({
  lang,
  t,
  selectedType,
  selectedDuration,
  currentDate,
  setCurrentDate,
  slotsByDate,
  loadingCalendar,
  selectedDateKey,
  setSelectedDateKey,
  selectedSlot,
  setSelectedSlot,
  discountTheme,
  onBack,
  onSuccess,
  onRefreshCalendar,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeContacts, setActiveContacts] = useState<Record<ContactMethod, boolean>>({
    phone: true,
    instagram: false,
    email: false,
  });
  const [contactValues, setContactValues] = useState<Record<ContactMethod, string>>({
    phone: '',
    instagram: '',
    email: '',
  });
  const [phonePrefix, setPhonePrefix] = useState<string>('+421');
  const [clientName, setClientName] = useState('');
  const [wantsNote, setWantsNote] = useState(false);
  const [customerNote, setCustomerNote] = useState('');

  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [appliedCodePercent, setAppliedCodePercent] = useState<number>(0);
  const [codeCheckStatus, setCodeCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

  // --- REGISTROVANÉ ODMENY POUŽÍVATEĽA ---
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [userGifts, setUserGifts] = useState<ActiveGift[]>([]);
  const [applyGiftReward, setApplyGiftReward] = useState(false);
  const [applyVipUpgrade, setApplyVipUpgrade] = useState(false);
  const [appliedGiftIds, setAppliedGiftIds] = useState<string[]>([]);

  const toggleGiftIdToBurn = (giftId: string, apply: boolean) => {
    setAppliedGiftIds((prev) =>
      apply ? Array.from(new Set([...prev, giftId])) : prev.filter((id) => id !== giftId)
    );
  };

  useEffect(() => {
    const fetchUserAndGifts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser(session.user);
        setClientName(session.user.user_metadata?.full_name || '');
        
        if (session.user.email) {
          setActiveContacts((prev) => ({ ...prev, email: true }));
          setContactValues((prev) => ({ ...prev, email: session.user.email || '' }));
        }

        const { data: giftsData } = await supabase
          .from('gifts')
          .select('id, gift_type, custom_code')
          .eq('user_id', session.user.id)
          .eq('used', false)
          .is('revoked_at', null);

        if (giftsData) setUserGifts(giftsData);
      }
    };

    fetchUserAndGifts();
  }, []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonthCount = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const emptyCells = Array.from({ length: firstDayIndex }, (_, i) => i);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDateKey(null);
    setSelectedSlot(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDateKey(null);
    setSelectedSlot(null);
  };

  const isClassic60 = selectedType === 'Klasik' && selectedDuration === 60;
  const isVip45 = selectedType === 'VIP' && selectedDuration === 45;
  const isVipUpgradeApplied = applyVipUpgrade && (isClassic60 || isVip45);
  const isVip = selectedType === 'VIP' || isVipUpgradeApplied;

  const getBasePriceNumber = () => {
    if (!selectedType || !selectedDuration) return 0;
    if (isVipUpgradeApplied) {
      return 45;
    }

    const pricesForType = PRICES[selectedType];
    if (!pricesForType) return 0;
    const priceStr = (pricesForType as Record<number, string>)[selectedDuration];
    return priceStr ? parseInt(priceStr, 10) : 0;
  };

  const fullOriginalPrice = isVipUpgradeApplied
    ? 65
    : selectedType === 'VIP'
    ? parseInt(PRICES.VIP[selectedDuration as 45 | 60 | 90], 10)
    : parseInt(PRICES.Klasik[selectedDuration as 30 | 45 | 60], 10);

  const selectedSlotObj: TimeSlot | null =
    selectedDateKey && selectedSlot
      ? (slotsByDate[selectedDateKey] || []).find((s) => s.startIso === selectedSlot) || null
      : null;

  const selectedDiscountPercent = selectedSlotObj?.discountPercent || 0;
  const basePrice = getBasePriceNumber();
  const priceAfterSlotDiscount =
    selectedDiscountPercent > 0
      ? basePrice * (1 - selectedDiscountPercent / 100)
      : basePrice;
  const finalPrice =
    appliedCodePercent > 0
      ? Math.round(priceAfterSlotDiscount * (1 - appliedCodePercent / 100))
      : Math.round(priceAfterSlotDiscount);

  const handleApplyDiscountCode = async () => {
    const code = discountCodeInput.trim();
    if (!code) return;
    setCodeCheckStatus('checking');
    try {
      const url = `/api/discount-code?code=${encodeURIComponent(code)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.valid && typeof data.percent === 'number' && data.percent > 0) {
        setAppliedCode(code.toUpperCase());
        setAppliedCodePercent(Math.min(100, Math.max(0, data.percent)));
        setCodeCheckStatus('valid');
      } else {
        setAppliedCode(null);
        setAppliedCodePercent(0);
        setCodeCheckStatus('invalid');
      }
    } catch {
      setAppliedCode(null);
      setAppliedCodePercent(0);
      setCodeCheckStatus('invalid');
    }
  };

  const handleRemoveDiscountCode = () => {
    setDiscountCodeInput('');
    setAppliedCode(null);
    setAppliedCodePercent(0);
    setCodeCheckStatus('idle');
  };

  const handleContactCheckboxChange = (method: ContactMethod) => {
    setActiveContacts((prev) => ({ ...prev, [method]: !prev[method] }));
  };

  const handlePhoneChange = (value: string) => {
    const onlyNums = value.replace(/\D/g, '');
    if (onlyNums.length <= 9) {
      setContactValues((prev) => ({ ...prev, phone: onlyNums }));
    }
  };

  const isContactValid = () => {
    if (!clientName.trim()) return false;
    const hasAtLeastOneChecked = activeContacts.phone || activeContacts.instagram || activeContacts.email;
    if (!hasAtLeastOneChecked) return false;
    if (activeContacts.phone && contactValues.phone.length !== 9) return false;
    if (activeContacts.instagram && !contactValues.instagram.trim()) return false;
    if (activeContacts.email && !contactValues.email.trim()) return false;
    return true;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const generatedBookingRef = 'RES-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const finalPhoneNumber = activeContacts.phone ? `${phonePrefix}${contactValues.phone}` : '';

    const calendarNotes: string[] = [];
    calendarNotes.push(`Číslo rezervácie: #${generatedBookingRef}`);
    if (applyGiftReward) calendarNotes.push('Klient má dostať darček po masáži!');
    if (isVipUpgradeApplied) calendarNotes.push('Uplatnený VIP Upgrade: Získaná VIP Supreme 45m za cenu Klasik 60m (45€)');
    if (selectedDiscountPercent > 0) calendarNotes.push(`Zľava z termínu: ${selectedDiscountPercent}%`);
    if (appliedCode && appliedCodePercent > 0) calendarNotes.push(`Zľavový kód ${appliedCode}: -${appliedCodePercent}%`);
    if (wantsNote && customerNote.trim()) calendarNotes.push(`Poznámka klienta: ${customerNote.trim()}`);

    const finalType = isVipUpgradeApplied ? 'VIP PREMIUM' : (selectedType === 'Klasik' ? 'CLASSIC' : 'VIP PREMIUM');
    const finalDuration = isVipUpgradeApplied ? 45 : selectedDuration;

    const giftsToBurn = [...appliedGiftIds];
    if (appliedCode) {
      const matchingGift = userGifts.find(
        (g) => (g.custom_code || '').toUpperCase().trim() === appliedCode.toUpperCase().trim()
      );
      if (matchingGift && !giftsToBurn.includes(matchingGift.id)) {
        giftsToBurn.push(matchingGift.id);
      }
    }

    const payload = {
      name: clientName.trim(),
      email: activeContacts.email ? contactValues.email.trim() : '',
      phone: finalPhoneNumber,
      instagram: activeContacts.instagram ? contactValues.instagram.trim() : '',
      slot: selectedSlot,
      duration: finalDuration,
      type: finalType,
      basePrice,
      discountPercent: selectedDiscountPercent,
      discountCode: appliedCode,
      codeDiscountPercent: appliedCodePercent,
      finalPrice,
      customerNote: calendarNotes.join(' | '),
      bookingRef: generatedBookingRef,
      notes: `Plná cena VIP Supreme: 65€ -> Zľava VIP Upgrade: 45€ -> Finálna cena: ${finalPrice}€`,
      appliedGiftIds: giftsToBurn
    };

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        if (giftsToBurn.length > 0) {
          try {
            await supabase
              .from('gifts')
              .update({ used: true })
              .in('id', giftsToBurn);
          } catch (err) {
            console.error('Chyba pri označovaní darčeka ako použitý:', err);
          }
        }

        window.dispatchEvent(new Event('profileUpdated'));
        
        onSuccess({
          slot: selectedSlot,
          duration: finalDuration,
          type: finalType,
          bookingRef: generatedBookingRef
        });
      } else {
        alert(lang === 'SK' ? 'Chyba pri ukladaní rezervácie.' : 'Error saving appointment.');
      }
    } catch {
      alert(lang === 'SK' ? 'Nepodarilo sa spojiť so serverom.' : 'Connection error.');
    }
  };

  return (
    <div className={`p-6 sm:p-8 rounded-2xl max-w-xl mx-auto font-sans transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
      isVip
        ? isDark
          ? 'bg-[#18060F]/95 border border-[#FF5A7A]/35 shadow-[0_12px_45px_rgba(255,90,122,0.25)] text-[#FFE4E8]'
          : 'bg-gradient-to-b from-[#FFF5F7] via-[#FFF9FA] to-[#FFEFF3] border border-[#FF5A7A]/30 shadow-[0_8px_32px_rgba(255,90,122,0.08)] text-[#0B0D22]'
        : isDark
        ? 'bg-[#0B0D22]/95 border border-[#38BDF8]/35 shadow-[0_12px_45px_rgba(56,189,248,0.18)] text-[#DDE0F2]'
        : 'bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#EBF3FA] border border-[#0284C7]/25 shadow-[0_8px_32px_rgba(2,132,199,0.06)] text-[#0B0D22]'
    }`}>
      {/* 🔮 TEXTÚROVANÝ SVG WATERMARK VZOR PRE VIP KALENDÁR */}
      {isVip && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.05] dark:opacity-[0.08] text-[#FF5A7A]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="vip-calendar-pattern" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
                <path d="M18 18 C18 11 22 7 26 3 C27 8 31 10 33 15 C36 20 33 27 27 29 C21 30 18 24 18 18 Z" fill="currentColor" />
                <text x="68" y="28" fontSize="13" fontWeight="900" fontFamily="sans-serif" fill="currentColor">18+</text>
                <g transform="translate(18, 62)">
                  <rect x="0" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="8" y1="6" x2="8" y2="18" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="0" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 6 C4 3 6 2 8 6 C10 2 12 3 12 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </g>
                <path d="M74 72 L76 66 L78 72 L84 74 L78 76 L76 82 L74 76 L68 74 Z" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#vip-calendar-pattern)" />
          </svg>
        </div>
      )}

      <div className="relative z-10">
        <h2 className="text-xl font-semibold text-center tracking-tight mb-2 text-[#0B0D22] dark:text-white">
          {t.step3Title}
        </h2>
        
        {/* HORNÝ ŠTÍTOK VYBRANÉHO BALÍKA S 18+ */}
        <div className={`p-3 rounded-full text-xs text-center font-medium mb-6 flex items-center justify-center gap-2 ${
          isVip
            ? 'bg-[#FF5A7A]/15 border border-[#FF5A7A]/40 text-[#FF5A7A]'
            : 'bg-[#0284C7]/15 border border-[#0284C7]/40 text-[#0284C7] dark:text-[#38BDF8]'
        }`}>
          {isVip ? (
            <Flame size={15} className="text-[#FF5A7A] fill-[#FF5A7A]/30" />
          ) : (
            <Sparkles size={15} className="text-[#0284C7] dark:text-[#38BDF8]" />
          )}
          <span>
            {t.selected}: <strong>{isVipUpgradeApplied ? 'VIP PREMIUM (Supreme Upgrade)' : selectedType === 'Klasik' ? 'KLASIK' : 'VIP PREMIUM'} - {isVipUpgradeApplied ? 45 : selectedDuration} {t.minutes}</strong>
          </span>
          {isVip && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#FF5A7A]/25 border border-[#FF5A7A]/50 text-[#FF5A7A] text-[9px] font-black tracking-wider">
              18+
            </span>
          )}
        </div>

        {loadingCalendar ? (
          <Step3CalendarSkeleton isVip={isVip} />
        ) : (
          <div className={`border rounded-2xl p-4 mb-6 ${
            isVip 
              ? isDark 
                ? 'border-[#FF5A7A]/25 bg-[#0D0207]/90' 
                : 'border-[#FF5A7A]/30 bg-white shadow-sm' 
              : isDark 
              ? 'border-[#2B2F49] bg-[#010314]/90' 
              : 'border-[#0284C7]/20 bg-white shadow-sm'
          }`}>
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="text-base font-semibold tracking-tight text-[#0B0D22] dark:text-white">
                {t.months[currentMonth]} {currentYear}
              </span>
              <div className="flex space-x-2 items-center">
                {/* REFRESH TLAČIDLO */}
                {onRefreshCalendar && (
                  <button
                    type="button"
                    onClick={onRefreshCalendar}
                    disabled={loadingCalendar}
                    title={lang === 'SK' ? 'Obnoviť termíny' : 'Refresh slots'}
                    className={`p-2 border rounded-full text-xs font-medium transition-all active:scale-[0.97] cursor-pointer disabled:opacity-50 ${
                      isVip 
                        ? isDark
                          ? 'bg-[#1C0812] border-[#FF5A7A]/30 text-[#FF5A7A] hover:border-[#FF5A7A]'
                          : 'bg-[#FFF0F3] border-[#FF5A7A]/30 text-[#FF5A7A] hover:border-[#FF5A7A]'
                        : isDark
                        ? 'bg-[#0B0D22] border-[#2B2F49] text-[#DDE0F2] hover:border-[#38BDF8]'
                        : 'bg-[#F0F9FF] border-[#0284C7]/30 text-[#0284C7] hover:border-[#0284C7]'
                    }`}
                  >
                    <RotateCw size={15} className={loadingCalendar ? 'animate-spin' : ''} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className={`p-2 border rounded-full text-xs font-medium transition-all active:scale-[0.97] cursor-pointer ${
                    isVip 
                      ? isDark
                        ? 'bg-[#1C0812] border-[#FF5A7A]/30 text-[#FF5A7A] hover:border-[#FF5A7A]'
                        : 'bg-[#FFF0F3] border-[#FF5A7A]/30 text-[#FF5A7A] hover:border-[#FF5A7A]'
                      : isDark
                      ? 'bg-[#0B0D22] border-[#2B2F49] text-[#DDE0F2] hover:border-[#38BDF8]'
                      : 'bg-[#F0F9FF] border-[#0284C7]/30 text-[#0284C7] hover:border-[#0284C7]'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className={`p-2 border rounded-full text-xs font-medium transition-all active:scale-[0.97] cursor-pointer ${
                    isVip 
                      ? isDark
                        ? 'bg-[#1C0812] border-[#FF5A7A]/30 text-[#FF5A7A] hover:border-[#FF5A7A]'
                        : 'bg-[#FFF0F3] border-[#FF5A7A]/30 text-[#FF5A7A] hover:border-[#FF5A7A]'
                      : isDark
                      ? 'bg-[#0B0D22] border-[#2B2F49] text-[#DDE0F2] hover:border-[#38BDF8]'
                      : 'bg-[#F0F9FF] border-[#0284C7]/30 text-[#0284C7] hover:border-[#0284C7]'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-medium text-[#64748B] dark:text-[#C7CAE0]/60 mb-2 tracking-wider uppercase">
              <div>{t.mon}</div><div>{t.tue}</div><div>{t.wed}</div><div>{t.thu}</div><div>{t.fri}</div><div>{t.sat}</div><div>{t.sun}</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {emptyCells.map((_, idx) => (
                <div key={`empty-${idx}`} className="p-2"></div>
              ))}

              {daysArray.map((day) => {
                const dateKey = getDateKey(currentYear, currentMonth, day);
                const daySlots = slotsByDate[dateKey] || [];

                const validSlots = daySlots.filter((slot) =>
                  isValidSlotDuration(slot.availableMinutes, isVipUpgradeApplied ? 45 : selectedDuration)
                );
                const hasValidSlots = validSlots.length > 0;

                const dayDiscount = validSlots.reduce(
                  (max, s) => Math.max(max, s.discountPercent || 0),
                  0
                );

                const isSelectedDay = selectedDateKey === dateKey;
                const hasDayDiscount = hasValidSlots && dayDiscount > 0;

                return (
                  <button
                    type="button"
                    key={dateKey}
                    disabled={!hasValidSlots}
                    onClick={() => { setSelectedDateKey(dateKey); setSelectedSlot(null); }}
                    className={`relative aspect-square flex flex-col items-center justify-center text-xs font-medium rounded-xl transition-all duration-200 active:scale-[0.97] ${
                      hasValidSlots
                        ? isSelectedDay
                          ? isVip
                            ? 'bg-gradient-to-b from-[#E11D48] via-[#BE123C] to-[#881337] text-white font-bold shadow-[0_0_16px_rgba(225,29,72,0.7)] ring-2 ring-[#FF5A7A]'
                            : 'bg-gradient-to-b from-[#0284C7] via-[#0369A1] to-[#075985] text-white font-bold shadow-[0_0_16px_rgba(2,132,199,0.7)] ring-2 ring-[#38BDF8]'
                          : hasDayDiscount
                          ? isVip
                            ? 'bg-[#FF5A7A]/15 text-[#FF5A7A] border border-[#FF5A7A]/40 hover:bg-[#FF5A7A]/25'
                            : 'bg-[#0284C7]/15 text-[#0284C7] dark:text-[#38BDF8] border border-[#0284C7]/40 hover:bg-[#0284C7]/25'
                          : isVip
                          ? isDark
                            ? 'bg-[#1C0812] text-white border border-[#FF5A7A]/25 hover:border-[#FF5A7A]'
                            : 'bg-white text-[#1E293B] border border-[#FF5A7A]/20 hover:border-[#FF5A7A] hover:bg-[#FFF5F7]'
                          : isDark
                          ? 'bg-[#0B0D22] text-white border border-[#2B2F49] hover:border-[#38BDF8]'
                          : 'bg-white text-[#1E293B] border border-[#E2E8F0] hover:border-[#0284C7] hover:bg-[#F0F9FF]'
                        : 'text-[#94A3B8]/30 dark:text-[#C7CAE0]/20 bg-transparent border border-transparent cursor-not-allowed'
                    }`}
                  >
                    <span>{day}</span>
                    {hasValidSlots && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 shadow-sm ${
                        isVip ? 'bg-[#FF5A7A]' : 'bg-[#0284C7] dark:bg-[#38BDF8]'
                      }`}></span>
                    )}
                    {hasDayDiscount && (
                      <span className={`absolute -top-1 -right-1 text-[9px] font-medium px-1 rounded-full text-white shadow-sm leading-none min-w-[20px] text-center ${
                        isVip ? 'bg-[#E11D48]' : 'bg-[#0284C7]'
                      }`}>
                        -{dayDiscount}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VÝBER ČASOVÝCH SLOTTOV PRE ZVOLENÝ DEŇ */}
        {selectedDateKey && slotsByDate[selectedDateKey] && (
          <div className={`animate-fadeIn space-y-2 mb-6 p-4 rounded-2xl border ${
            isVip 
              ? isDark 
                ? 'bg-[#0D0207]/90 border-[#FF5A7A]/25' 
                : 'bg-white border-[#FF5A7A]/25 shadow-sm'
              : isDark 
              ? 'bg-[#010314]/90 border-[#2B2F49]' 
              : 'bg-white border-[#0284C7]/20 shadow-sm'
          }`}>
            <p className="text-xs font-medium tracking-tight text-[#0B0D22] dark:text-white">{t.chooseTime}</p>
            <div className="grid grid-cols-3 gap-2">
              {(slotsByDate[selectedDateKey] || [])
                .slice()
                .sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime())
                .map((slot) => {
                if (!isValidSlotDuration(slot.availableMinutes, isVipUpgradeApplied ? 45 : selectedDuration)) {
                  return null;
                }

                const hasDiscount = slot.discountPercent > 0;
                const isSelectedSlot = selectedSlot === slot.startIso;

                return (
                  <button
                    type="button"
                    key={slot.startIso}
                    onClick={() => setSelectedSlot(slot.startIso)}
                    className={`relative p-2.5 text-xs text-center font-medium rounded-full border transition-all duration-200 active:scale-[0.97] cursor-pointer ${
                      isSelectedSlot
                        ? isVip
                          ? 'bg-gradient-to-b from-[#E11D48] via-[#BE123C] to-[#881337] text-white border-[#FDA4AF]/70 shadow-[0_0_14px_rgba(225,29,72,0.6)] font-bold'
                          : 'bg-gradient-to-b from-[#0284C7] via-[#0369A1] to-[#075985] text-white border-[#38BDF8]/80 shadow-[0_0_14px_rgba(2,132,199,0.6)] font-bold'
                        : hasDiscount
                          ? isVip
                            ? 'bg-[#FF5A7A]/15 border-[#FF5A7A]/40 text-[#FF5A7A] hover:bg-[#FF5A7A]/25'
                            : 'bg-[#0284C7]/15 border-[#0284C7]/40 text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#0284C7]/25'
                          : isVip
                          ? isDark
                            ? 'bg-[#1C0812] border-[#FF5A7A]/25 text-white hover:border-[#FF5A7A]'
                            : 'bg-white border-[#FF5A7A]/20 text-[#1E293B] hover:border-[#FF5A7A] hover:bg-[#FFF5F7]'
                          : isDark
                          ? 'bg-[#0B0D22] border-[#2B2F49] text-white hover:border-[#38BDF8]'
                          : 'bg-white border-[#E2E8F0] text-[#1E293B] hover:border-[#0284C7] hover:bg-[#F0F9FF]'
                    }`}
                  >
                    {slot.formattedTime}
                    {hasDiscount && (
                      <span className={`absolute -top-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm leading-none min-w-[20px] text-center font-mono text-white ${
                        isVip ? 'bg-[#E11D48]' : 'bg-[#0284C7]'
                      }`}>
                        -{slot.discountPercent}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* REZERVAČNÝ FORMULÁR */}
        {selectedSlot && (
          <form onSubmit={handleBookingSubmit} className={`space-y-4 pt-4 border-t mt-4 animate-fadeIn ${
            isVip ? 'border-[#FF5A7A]/25' : 'border-[#E2E8F0] dark:border-[#2B2F49]'
          }`}>
            
            {/* 🎁 SEKCIA PRE REGISTROVANÝCH - UPLATNENIE ODMIEN */}
            {sessionUser && userGifts.length > 0 && (
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isVip 
                  ? isDark ? 'bg-[#0D0207] border-[#FF5A7A]/25' : 'bg-white border-[#FF5A7A]/30 shadow-sm'
                  : isDark ? 'bg-[#010314] border-[#2B2F49]' : 'bg-white border-[#0284C7]/20 shadow-sm'
              }`}>
                <div className={`flex items-center gap-2 font-medium text-xs uppercase tracking-wide ${
                  isVip ? 'text-[#FF5A7A]' : 'text-[#0284C7] dark:text-[#38BDF8]'
                }`}>
                  <Gift size={16} />
                  <span>{lang === 'SK' ? 'Máte k dispozícii vernostné odmeny!' : 'You have available loyalty rewards!'}</span>
                </div>

                <div className="space-y-2">
                  {userGifts.map((gift) => {
                    if (gift.custom_code || gift.gift_type === 'discount_code' || gift.gift_type === 'referral_reward') {
                      const codeText = gift.custom_code || 'REFERRAL10';
                      return (
                        <div key={gift.id} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                          isVip 
                            ? isDark ? 'bg-[#1C0812] border-[#FF5A7A]/25' : 'bg-white border-[#FF5A7A]/25'
                            : isDark ? 'bg-[#0B0D22] border-[#2B2F49]' : 'bg-white border-[#E2E8F0]'
                        }`}>
                          <span className="font-medium text-[#0B0D22] dark:text-white flex items-center gap-1.5">
                            <Tag size={14} className={isVip ? 'text-[#FF5A7A]' : 'text-[#0284C7] dark:text-[#38BDF8]'} />
                            {lang === 'SK' ? 'Zľavový kód:' : 'Discount code:'} <strong className={isVip ? 'text-[#FF5A7A]' : 'text-[#0284C7] dark:text-[#38BDF8]'}>{codeText}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountCodeInput(codeText);
                              toggleGiftIdToBurn(gift.id, true);
                            }}
                            className={`px-3 py-1 text-white rounded-full text-[11px] font-medium transition cursor-pointer ${
                              isVip ? 'bg-[#E11D48] hover:bg-[#F43F5E]' : 'bg-[#0284C7] hover:bg-[#0EA5E9]'
                            }`}
                          >
                            {lang === 'SK' ? 'Aplikovať kód' : 'Apply code'}
                          </button>
                        </div>
                      );
                    }

                    if (gift.gift_type === 'next_visit_gift') {
                      return (
                        <label key={gift.id} className={`flex items-center space-x-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer text-[#0B0D22] dark:text-white ${
                          isVip 
                            ? isDark ? 'bg-[#1C0812] border-[#FF5A7A]/25' : 'bg-white border-[#FF5A7A]/25'
                            : isDark ? 'bg-[#0B0D22] border-[#2B2F49]' : 'bg-white border-[#E2E8F0]'
                        }`}>
                          <input
                            type="checkbox"
                            checked={applyGiftReward}
                            onChange={(e) => {
                              setApplyGiftReward(e.target.checked);
                              toggleGiftIdToBurn(gift.id, e.target.checked);
                            }}
                            className={`rounded border-[#2B2F49] ${isVip ? 'text-[#E11D48] focus:ring-[#FF5A7A]' : 'text-[#0284C7] focus:ring-[#0284C7]'}`}
                          />
                          <span className="flex items-center gap-1.5">
                            <Gift size={16} className={isVip ? 'text-[#FF5A7A] shrink-0' : 'text-[#0284C7] dark:text-[#38BDF8] shrink-0'} />
                            <span>{lang === 'SK' ? 'Uplatniť darček pri tejto návšteve' : 'Claim gift on this visit'}</span>
                          </span>
                        </label>
                      );
                    }

                    if (gift.gift_type === 'vip_upgrade') {
                      const isEligible = isClassic60 || isVip45;
                      const isHidden = selectedType === 'VIP' && (selectedDuration === 60 || selectedDuration === 90);

                      if (isHidden) {
                        return null;
                      }

                      return (
                        <div key={gift.id} className="relative overflow-hidden rounded-xl">
                          <label
                            className={`flex items-center space-x-2.5 p-3 rounded-xl border text-xs font-medium ${
                              isVip 
                                ? isDark ? 'bg-[#1C0812] border-[#FF5A7A]/25' : 'bg-white border-[#FF5A7A]/25'
                                : isDark ? 'bg-[#0B0D22] border-[#2B2F49]' : 'bg-white border-[#E2E8F0]'
                            } ${isEligible ? 'cursor-pointer text-[#0B0D22] dark:text-white' : 'text-[#94A3B8] dark:text-[#C7CAE0]/40 select-none'}`}
                          >
                            <input
                              type="checkbox"
                              disabled={!isEligible}
                              checked={applyVipUpgrade && isEligible}
                              onChange={(e) => {
                                setApplyVipUpgrade(e.target.checked);
                                toggleGiftIdToBurn(gift.id, e.target.checked);
                              }}
                              className="rounded border-[#2B2F49] text-[#E11D48] focus:ring-[#FF5A7A] disabled:opacity-40"
                            />
                            <span className="flex items-center gap-1.5 flex-1">
                              <Sparkles size={16} className="text-[#FF5A7A] shrink-0" />
                              <span>
                                {lang === 'SK'
                                  ? 'Uplatniť VIP Upgrade (VIP 45 min za cenu Klasik 60 min - 45€)'
                                  : 'Apply VIP Upgrade (VIP 45m for Classic 60m price - 45€)'}
                              </span>
                            </span>
                          </label>

                          {!isEligible && selectedType === 'Klasik' && (selectedDuration === 30 || selectedDuration === 45) && (
                            <div className="absolute inset-0 bg-[#010314]/90 backdrop-blur-sm rounded-xl flex items-center justify-center p-3 text-center z-10 border border-[#2B2F49] animate-fadeIn">
                              <div className="flex items-center gap-2 text-xs font-medium text-white">
                                <Info size={16} className="text-[#FF5A7A] shrink-0" />
                                <span>
                                  {lang === 'SK'
                                    ? 'Platí pri balíku Classic 60 minút alebo VIP 45 minút.'
                                    : 'Valid for Classic 60 minutes or VIP 45 minutes.'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}

            <h3 className="font-medium text-xs text-[#64748B] dark:text-[#C7CAE0]">{t.contactTitle}</h3>
            
            <div className={`text-center text-sm font-semibold ${isVip ? 'text-[#FF5A7A]' : 'text-[#0284C7] dark:text-[#38BDF8]'}`}>
              {t.selectedTerm}: <span className="text-[#0B0D22] dark:text-white font-bold">{new Date(selectedSlot).toLocaleDateString(lang === 'EN' ? 'en-US' : 'sk-SK')} {lang === 'EN' ? 'at' : 'o'} {new Date(selectedSlot).toLocaleTimeString(lang === 'EN' ? 'en-US' : 'sk-SK', {hour: '2-digit', minute:'2-digit'})}</span>
            </div>

            {/* SÚHRN REZERVÁCIE */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isVip 
                ? isDark ? 'bg-[#0D0207] border-[#FF5A7A]/25' : 'bg-white border-[#FF5A7A]/30 shadow-sm'
                : isDark ? 'bg-[#010314] border-[#2B2F49]' : 'bg-white border-[#0284C7]/20 shadow-sm'
            }`}>
              <h3 className="font-medium text-[11px] uppercase tracking-wider text-[#64748B] dark:text-[#C7CAE0]/60">{t.summaryTitle}</h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm text-[#0B0D22] dark:text-white">
                  <span>
                    {isVipUpgradeApplied ? 'VIP PREMIUM (Supreme)' : selectedType === 'Klasik' ? t.klasikTitle : t.vipTitle} · {isVipUpgradeApplied ? 45 : selectedDuration} {t.minutes}
                  </span>
                  <span className={selectedDiscountPercent > 0 || appliedCodePercent > 0 || isVipUpgradeApplied ? 'line-through text-[#94A3B8] dark:text-[#C7CAE0]/50' : 'font-semibold'}>
                    {fullOriginalPrice} €
                  </span>
                </div>

                {isVipUpgradeApplied && (
                  <div className="flex justify-between items-center text-sm font-medium text-[#FF5A7A]">
                    <span className="inline-flex items-center gap-1">
                      <Sparkles size={14} className="text-[#FF5A7A]" />
                      {lang === 'EN' ? 'VIP Upgrade (Classic 60m Price)' : 'VIP Upgrade (Cena Klasik 60m)'}
                    </span>
                    <span>-20 €</span>
                  </div>
                )}

                {selectedDiscountPercent > 0 && (
                  <div className={`flex justify-between items-center text-sm font-medium ${isVip ? 'text-[#FF5A7A]' : 'text-[#0284C7] dark:text-[#38BDF8]'}`}>
                    <span className="inline-flex items-center gap-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wide text-white ${
                        isVip ? 'bg-[#E11D48]' : 'bg-[#0284C7]'
                      }`}>
                        {t.discountBadgeShort}
                      </span>
                      {t.discountApplied} (-{selectedDiscountPercent}%)
                    </span>
                    <span>-{Math.round(basePrice - priceAfterSlotDiscount)} €</span>
                  </div>
                )}
              </div>

              <div className={`pt-2 border-t ${isVip ? 'border-[#FF5A7A]/20' : 'border-[#E2E8F0] dark:border-[#2B2F49]'}`}>
                {!appliedCode ? (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-[#64748B] dark:text-[#C7CAE0]">{t.discountCodeLabel}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCodeInput}
                        onChange={(e) => {
                          setDiscountCodeInput(e.target.value);
                          if (codeCheckStatus === 'invalid') setCodeCheckStatus('idle');
                        }}
                        placeholder={t.discountCodePlaceholder}
                        className={`flex-grow py-2 px-4 border rounded-full text-xs focus:outline-none uppercase ${
                          isVip 
                            ? isDark ? 'bg-[#1C0812] border-[#FF5A7A]/30 text-white focus:border-[#FF5A7A]' : 'bg-[#FFF5F7] border-[#FF5A7A]/30 text-[#1E293B] focus:border-[#FF5A7A] focus:bg-white'
                            : isDark ? 'bg-[#0B0D22] border-[#2B2F49] text-white focus:border-[#38BDF8]' : 'bg-[#F0F9FF] border-[#CBD5E1] text-[#1E293B] focus:border-[#0284C7] focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscountCode}
                        disabled={!discountCodeInput.trim() || codeCheckStatus === 'checking'}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-white ${
                          isVip 
                            ? 'bg-gradient-to-b from-[#E11D48] via-[#BE123C] to-[#881337] hover:from-[#F43F5E]' 
                            : 'bg-gradient-to-b from-[#0284C7] via-[#0369A1] to-[#075985] hover:from-[#0EA5E9]'
                        }`}
                      >
                        {t.applyCodeBtn}
                      </button>
                    </div>
                    {codeCheckStatus === 'checking' && (
                      <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60">{t.codeCheckingMsg}</p>
                    )}
                    {codeCheckStatus === 'invalid' && (
                      <p className="text-[10px] text-[#FF5A7A] font-medium">{t.codeInvalidMsg}</p>
                    )}
                  </div>
                ) : (
                  <div className={`flex justify-between items-center text-sm font-medium ${isVip ? 'text-[#FF5A7A]' : 'text-[#0284C7] dark:text-[#38BDF8]'}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                        isVip ? 'bg-[#E11D48]' : 'bg-[#0284C7]'
                      }`}>
                        {appliedCode}
                      </span>
                      {t.codeDiscountLabel} (-{appliedCodePercent}%)
                    </span>
                    <span className="flex items-center gap-2">
                      -{Math.round(priceAfterSlotDiscount - finalPrice)} €
                      <button
                        type="button"
                        onClick={handleRemoveDiscountCode}
                        className="text-[10px] underline text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-white cursor-pointer"
                      >
                        {t.removeCodeBtn}
                      </button>
                    </span>
                  </div>
                )}
              </div>

              {(selectedDiscountPercent > 0 || appliedCodePercent > 0 || isVipUpgradeApplied) && (
                <div className={`flex justify-between items-center text-base font-bold text-[#0B0D22] dark:text-white pt-2 border-t ${
                  isVip ? 'border-[#FF5A7A]/20' : 'border-[#E2E8F0] dark:border-[#2B2F49]'
                }`}>
                  <span>{t.finalPriceLabel}</span>
                  <span className={`text-xl font-extrabold ${isVip ? 'text-[#FF5A7A] drop-shadow-[0_0_8px_rgba(255,90,122,0.4)]' : 'text-[#0284C7] dark:text-[#38BDF8]'}`}>
                    {finalPrice} €
                  </span>
                </div>
              )}
            </div>

            {/* KONTAKTNÉ POLIA */}
            <div className={`space-y-3 p-4 rounded-2xl border ${
              isVip 
                ? isDark ? 'bg-[#0D0207] border-[#FF5A7A]/25' : 'bg-white border-[#FF5A7A]/25 shadow-sm'
                : isDark ? 'bg-[#010314] border-[#2B2F49]' : 'bg-white border-[#0284C7]/20 shadow-sm'
            }`}>
              <input
                type="text"
                placeholder={t.name}
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={`w-full py-2 px-4 border rounded-full text-xs focus:outline-none ${
                  isVip 
                    ? isDark ? 'bg-[#1C0812] border-[#FF5A7A]/30 text-white focus:border-[#FF5A7A]' : 'bg-white border-[#E2E8F0] text-[#1E293B] focus:border-[#FF5A7A]'
                    : isDark ? 'bg-[#0B0D22] border-[#2B2F49] text-white focus:border-[#38BDF8]' : 'bg-white border-[#E2E8F0] text-[#1E293B] focus:border-[#0284C7]'
                }`}
              />

              <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 font-normal">{t.contactNotice}</p>

              <div className="space-y-1.5">
                <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-[#0B0D22] dark:text-white">
                  <input 
                    type="checkbox" 
                    checked={activeContacts.phone} 
                    onChange={() => handleContactCheckboxChange('phone')} 
                    className={`rounded border-[#2B2F49] ${isVip ? 'text-[#E11D48] focus:ring-[#FF5A7A]' : 'text-[#0284C7] focus:ring-[#0284C7]'}`} 
                  />
                  <span>{t.phone}</span>
                </label>
                {activeContacts.phone && (
                  <div className="flex space-x-2">
                    <select
                      value={phonePrefix}
                      onChange={(e) => setPhonePrefix(e.target.value)}
                      className={`p-2 border rounded-full text-xs font-sans focus:outline-none ${
                        isVip 
                          ? isDark ? 'bg-[#1C0812] border-[#FF5A7A]/30 text-white focus:border-[#FF5A7A]' : 'bg-white border-[#E2E8F0] text-[#1E293B] focus:border-[#FF5A7A]'
                          : isDark ? 'bg-[#0B0D22] border-[#2B2F49] text-white focus:border-[#38BDF8]' : 'bg-white border-[#E2E8F0] text-[#1E293B] focus:border-[#0284C7]'
                      }`}
                    >
                      <option value="+421">🇸🇰 +421</option>
                      <option value="+420">🇨🇿 +420</option>
                    </select>
                    <input
                      type="tel"
                      required
                      placeholder="905 123 456"
                      value={contactValues.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`flex-grow py-2 px-4 border rounded-full text-xs tracking-wider focus:outline-none ${
                        isVip 
                          ? isDark ? 'bg-[#1C0812] border-[#FF5A7A]/30 text-white placeholder-[#FFB3C1]/40 focus:border-[#FF5A7A]' : 'bg-white border-[#E2E8F0] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#FF5A7A]'
                          : isDark ? 'bg-[#0B0D22] border-[#2B2F49] text-white placeholder-[#C7CAE0]/50 focus:border-[#38BDF8]' : 'bg-white border-[#E2E8F0] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#0284C7]'
                      }`}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-[#0B0D22] dark:text-white">
                  <input 
                    type="checkbox" 
                    checked={activeContacts.instagram} 
                    onChange={() => handleContactCheckboxChange('instagram')} 
                    className={`rounded border-[#2B2F49] ${isVip ? 'text-[#E11D48] focus:ring-[#FF5A7A]' : 'text-[#0284C7] focus:ring-[#0284C7]'}`} 
                  />
                  <span>{t.instagram}</span>
                </label>
                {activeContacts.instagram && (
                  <input
                    type="text"
                    required
                    placeholder="@uzivatel"
                    value={contactValues.instagram}
                    onChange={(e) => setContactValues((prev) => ({ ...prev, instagram: e.target.value }))}
                    className={`w-full py-2 px-4 border rounded-full text-xs focus:outline-none ${
                      isVip 
                        ? isDark ? 'bg-[#1C0812] border-[#FF5A7A]/30 text-white placeholder-[#FFB3C1]/40 focus:border-[#FF5A7A]' : 'bg-white border-[#E2E8F0] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#FF5A7A]'
                        : isDark ? 'bg-[#0B0D22] border-[#2B2F49] text-white placeholder-[#C7CAE0]/50 focus:border-[#38BDF8]' : 'bg-white border-[#E2E8F0] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#0284C7]'
                    }`}
                  />
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-[#0B0D22] dark:text-white">
                  <input 
                    type="checkbox" 
                    checked={activeContacts.email} 
                    onChange={() => handleContactCheckboxChange('email')} 
                    className={`rounded border-[#2B2F49] ${isVip ? 'text-[#E11D48] focus:ring-[#FF5A7A]' : 'text-[#0284C7] focus:ring-[#0284C7]'}`} 
                  />
                  <span>{t.email}</span>
                </label>
                {activeContacts.email && (
                  <input
                    type="email"
                    required
                    placeholder="meno@domena.com"
                    value={contactValues.email}
                    onChange={(e) => setContactValues((prev) => ({ ...prev, email: e.target.value }))}
                    className={`w-full py-2 px-4 border rounded-full text-xs focus:outline-none ${
                      isVip 
                        ? isDark ? 'bg-[#1C0812] border-[#FF5A7A]/30 text-white placeholder-[#FFB3C1]/40 focus:border-[#FF5A7A]' : 'bg-white border-[#E2E8F0] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#FF5A7A]'
                        : isDark ? 'bg-[#0B0D22] border-[#2B2F49] text-white placeholder-[#C7CAE0]/50 focus:border-[#38BDF8]' : 'bg-white border-[#E2E8F0] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#0284C7]'
                    }`}
                  />
                )}
              </div>
            </div>

            <div className={`space-y-1.5 p-4 rounded-2xl border ${
              isVip 
                ? isDark ? 'bg-[#0D0207] border-[#FF5A7A]/25' : 'bg-white border-[#FF5A7A]/25 shadow-sm'
                : isDark ? 'bg-[#010314] border-[#2B2F49]' : 'bg-white border-[#0284C7]/20 shadow-sm'
            }`}>
              <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-[#0B0D22] dark:text-white">
                <input
                  type="checkbox"
                  checked={wantsNote}
                  onChange={() => setWantsNote((prev) => !prev)}
                  className={`rounded border-[#2B2F49] ${isVip ? 'text-[#E11D48] focus:ring-[#FF5A7A]' : 'text-[#0284C7] focus:ring-[#0284C7]'}`}
                />
                <span>{t.noteCheckboxLabel}</span>
              </label>
              {wantsNote && (
                <textarea
                  rows={3}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  className={`w-full p-3 border rounded-xl text-xs focus:outline-none ${
                    isVip 
                      ? isDark ? 'bg-[#1C0812] border-[#FF5A7A]/30 text-white placeholder-[#FFB3C1]/40 focus:border-[#FF5A7A]' : 'bg-white border-[#E2E8F0] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#FF5A7A]'
                      : isDark ? 'bg-[#0B0D22] border-[#2B2F49] text-white placeholder-[#C7CAE0]/50 focus:border-[#38BDF8]' : 'bg-white border-[#E2E8F0] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#0284C7]'
                  }`}
                />
              )}
            </div>

            {/* AKČNÉ REZERVAČNÉ TLAČIDLO S TRANSPARENTNOU CENOU */}
            <button
              type="submit"
              disabled={!isContactValid()}
              className={`w-full min-h-[50px] rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center relative overflow-hidden group/btn disabled:opacity-40 disabled:cursor-not-allowed ${
                isVip
                  ? 'bg-gradient-to-b from-[#E11D48] via-[#BE123C] to-[#881337] hover:from-[#F43F5E] hover:via-[#E11D48] hover:to-[#9F1239] text-white border border-[#FDA4AF]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_0_20px_rgba(225,29,72,0.35),0_4px_12px_rgba(0,0,0,0.35)]'
                  : 'bg-gradient-to-b from-[#0284C7] via-[#0369A1] to-[#075985] hover:from-[#0EA5E9] hover:via-[#0284C7] hover:to-[#0369A1] text-white border border-[#38BDF8]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(2,132,199,0.35),0_4px_12px_rgba(0,0,0,0.35)]'
              }`}
            >
              {/* Odlesk */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span>{t.bookBtn || 'Potvrdiť rezerváciu'} • {finalPrice} €</span>
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={onBack}
          className={`mx-auto mt-6 flex items-center justify-center gap-1.5 py-2.5 px-6 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer backdrop-blur-md ${
            isVip
              ? 'bg-[#FF5A7A]/10 hover:bg-[#FF5A7A]/20 text-[#FF5A7A] border border-[#FF5A7A]/30'
              : 'btn-secondary border border-slate-200 dark:border-slate-800'
          }`}
        >
          <ArrowLeft size={14} />
          <span>{t.backToPackages}</span>
        </button>
      </div>
    </div>
  );
}