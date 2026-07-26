'use client';
import React, { useState, useEffect } from 'react';
import { LangType, MassageType, TimeSlot, DiscountTheme, ContactMethod } from '@/app/types';
import { PRICES } from '@/app/constants/config';
import { getDateKey, isValidSlotDuration } from '@/app/utils/calendar';
import { supabase } from '@/app/lib/supabase';
import { ChevronLeft, ChevronRight, Gift, Sparkles, Tag, Info } from 'lucide-react';

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
}: Props) {
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

    // 🚀 GENERUJEME UNIKÁTNE ČÍSLO REZERVÁCIE (napr. RES-K8A92)
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
      bookingRef: generatedBookingRef, // 🚀 ODOŠLEME ČÍSLO REZERVÁCIE
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
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 max-w-xl mx-auto shadow-sm font-sans">
      <h2 className="text-lg font-bold text-center text-slate-800 dark:text-slate-100 mb-2">{t.step3Title}</h2>
      
      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-xs text-center border border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-300 font-semibold mb-6">
        {t.selected}: <strong>{isVipUpgradeApplied ? 'VIP PREMIUM (Supreme Upgrade)' : selectedType === 'Klasik' ? 'CLASSIC' : 'VIP PREMIUM'} - {isVipUpgradeApplied ? 45 : selectedDuration} {t.minutes}</strong>
      </div>

      {loadingCalendar ? (
        <div className="text-center py-8 text-xs font-semibold text-slate-400 dark:text-slate-500 animate-pulse">{t.loading}</div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 mb-6">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {t.months[currentMonth]} {currentYear}
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 tracking-wider">
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
                  className={`relative aspect-square flex items-center justify-center text-xs font-semibold rounded-xl transition-all ${
                    hasValidSlots
                      ? hasDayDiscount
                        ? isSelectedDay
                          ? 'bg-sky-600 text-white font-bold shadow-md'
                          : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-800 hover:bg-sky-100'
                        : isSelectedDay
                          ? 'bg-indigo-600 text-white font-bold shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm'
                      : 'text-slate-300 dark:text-slate-700 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 cursor-not-allowed'
                  }`}
                >
                  {day}
                  {hasDayDiscount && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-sky-500 text-white shadow-sm leading-none min-w-[22px] text-center">
                      -{dayDiscount}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedDateKey && slotsByDate[selectedDateKey] && (
        <div className="animate-fadeIn space-y-2 mb-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.chooseTime}</p>
          <div className="grid grid-cols-3 gap-2">
            {slotsByDate[selectedDateKey].map((slot) => {
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
                  className={`relative p-2.5 text-xs text-center font-bold rounded-xl border transition active:scale-95 ${
                    isSelectedSlot
                      ? 'bg-[#0e74a4] text-white border-[#0e74a4] shadow-md'
                      : hasDiscount
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-500'
                  }`}
                >
                  {slot.formattedTime}
                  {hasDiscount && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-sky-500 text-white shadow-sm leading-none min-w-[22px] text-center">
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
        <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 animate-fadeIn">
          
          {/* 🎁 SEKCIA PRE REGISTROVANÝCH - UPLATNENIE ODMIEN */}
          {sessionUser && userGifts.length > 0 && (
            <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wide">
                <Gift size={16} />
                <span>{lang === 'SK' ? 'Máte k dispozícii vernostné odmeny!' : 'You have available loyalty rewards!'}</span>
              </div>

              <div className="space-y-2">
                {userGifts.map((gift) => {
                  if (gift.custom_code || gift.gift_type === 'discount_code' || gift.gift_type === 'referral_reward') {
                    const codeText = gift.custom_code || 'REFERRAL10';
                    return (
                      <div key={gift.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900 text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Tag size={14} className="text-purple-500" />
                          {lang === 'SK' ? 'Zľavový kód:' : 'Discount code:'} <strong>{codeText}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountCodeInput(codeText);
                            toggleGiftIdToBurn(gift.id, true);
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition"
                        >
                          {lang === 'SK' ? 'Aplikovať kód' : 'Apply code'}
                        </button>
                      </div>
                    );
                  }

                  if (gift.gift_type === 'next_visit_gift') {
                    return (
                      <label key={gift.id} className="flex items-center space-x-2.5 bg-white dark:bg-slate-800 p-3 rounded-xl border border-purple-100 dark:border-purple-900 text-xs font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={applyGiftReward}
                          onChange={(e) => {
                            setApplyGiftReward(e.target.checked);
                            toggleGiftIdToBurn(gift.id, e.target.checked);
                          }}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="flex items-center gap-1.5">
                          <Gift size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
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
                          className={`flex items-center space-x-2.5 bg-white dark:bg-slate-800 p-3 rounded-xl border border-purple-100 dark:border-purple-900 text-xs font-semibold ${
                            isEligible ? 'cursor-pointer text-slate-800 dark:text-slate-200' : 'text-slate-400 select-none'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!isEligible}
                            checked={applyVipUpgrade && isEligible}
                            onChange={(e) => {
                              setApplyVipUpgrade(e.target.checked);
                              toggleGiftIdToBurn(gift.id, e.target.checked);
                            }}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 disabled:opacity-40"
                          />
                          <span className="flex items-center gap-1.5 flex-1">
                            <Sparkles size={16} className="text-amber-500 fill-amber-400 shrink-0" />
                            <span>
                              {lang === 'SK'
                                ? 'Uplatniť VIP Upgrade (VIP 45 min za cenu Klasik 60 min - 45€)'
                                : 'Apply VIP Upgrade (VIP 45m for Classic 60m price - 45€)'}
                            </span>
                          </span>
                        </label>

                        {!isEligible && selectedType === 'Klasik' && (selectedDuration === 30 || selectedDuration === 45) && (
                          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/85 backdrop-blur-sm rounded-xl flex items-center justify-center p-3 text-center z-10 border border-amber-200 dark:border-amber-900/50 shadow-sm animate-fadeIn">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                              <Info size={16} className="text-amber-500 shrink-0" />
                              <span>
                                {lang === 'SK'
                                  ? 'Platí pri balíku Classic 60 minút (Full Experience) alebo VIP 45 minút (Supreme).'
                                  : 'Valid for Classic 60 minutes (Full Experience) or VIP 45 minutes (Supreme).'}
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

          <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400">{t.contactTitle}</h3>
          
          <div className="text-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {t.selectedTerm}: <span className="text-slate-800 dark:text-slate-100">{new Date(selectedSlot).toLocaleDateString('sk-SK')} o {new Date(selectedSlot).toLocaleTimeString('sk-SK', {hour: '2-digit', minute:'2-digit'})}</span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-3">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">{t.summaryTitle}</h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-slate-800 dark:text-slate-100">
                <span>
                  {isVipUpgradeApplied ? 'VIP PREMIUM (Supreme)' : selectedType === 'Klasik' ? t.klasikTitle : t.vipTitle} · {isVipUpgradeApplied ? 45 : selectedDuration} {t.minutes}
                </span>
                <span className={selectedDiscountPercent > 0 || appliedCodePercent > 0 || isVipUpgradeApplied ? 'line-through text-slate-400' : 'font-bold'}>
                  {fullOriginalPrice} €
                </span>
              </div>

              {isVipUpgradeApplied && (
                <div className="flex justify-between items-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles size={14} className="fill-purple-400/30" />
                    VIP Upgrade (Cena Klasik 60m)
                  </span>
                  <span>-20 €</span>
                </div>
              )}

              {selectedDiscountPercent > 0 && (
                <div className="flex justify-between items-center text-sm font-semibold text-sky-600 dark:text-sky-400">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wide bg-sky-500 text-white">
                      {t.discountBadgeShort}
                    </span>
                    {t.discountApplied} (-{selectedDiscountPercent}%)
                  </span>
                  <span>-{Math.round(basePrice - priceAfterSlotDiscount)} €</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              {!appliedCode ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t.discountCodeLabel}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCodeInput}
                      onChange={(e) => {
                        setDiscountCodeInput(e.target.value);
                        if (codeCheckStatus === 'invalid') setCodeCheckStatus('idle');
                      }}
                      placeholder={t.discountCodePlaceholder}
                      className="flex-grow p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscountCode}
                      disabled={!discountCodeInput.trim() || codeCheckStatus === 'checking'}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                    >
                      {t.applyCodeBtn}
                    </button>
                  </div>
                  {codeCheckStatus === 'checking' && (
                    <p className="text-[10px] text-slate-400">{t.codeCheckingMsg}</p>
                  )}
                  {codeCheckStatus === 'invalid' && (
                    <p className="text-[10px] text-red-500 font-medium">{t.codeInvalidMsg}</p>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                      {appliedCode}
                    </span>
                    {t.codeDiscountLabel} (-{appliedCodePercent}%)
                  </span>
                  <span className="flex items-center gap-2">
                    -{Math.round(priceAfterSlotDiscount - finalPrice)} €
                    <button
                      type="button"
                      onClick={handleRemoveDiscountCode}
                      className="text-[10px] underline text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {t.removeCodeBtn}
                    </button>
                  </span>
                </div>
              )}
            </div>

            {(selectedDiscountPercent > 0 || appliedCodePercent > 0 || isVipUpgradeApplied) && (
              <div className="flex justify-between items-center text-base font-extrabold text-slate-800 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>{t.finalPriceLabel}</span>
                <span className="text-indigo-600 dark:text-indigo-400">{finalPrice} €</span>
              </div>
            )}
          </div>

          <div className="space-y-3 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <input
              type="text"
              placeholder={t.name}
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t.contactNotice}</p>

            <div className="space-y-1.5">
              <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={activeContacts.phone} onChange={() => handleContactCheckboxChange('phone')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span>{t.phone}</span>
              </label>
              {activeContacts.phone && (
                <div className="flex space-x-2">
                  <select
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-sans focus:outline-none"
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
                    className="flex-grow p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 tracking-wider placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={activeContacts.instagram} onChange={() => handleContactCheckboxChange('instagram')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span>{t.instagram}</span>
              </label>
              {activeContacts.instagram && (
                <input
                  type="text"
                  required
                  placeholder="@uzivatel"
                  value={contactValues.instagram}
                  onChange={(e) => setContactValues((prev) => ({ ...prev, instagram: e.target.value }))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={activeContacts.email} onChange={() => handleContactCheckboxChange('email')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span>{t.email}</span>
              </label>
              {activeContacts.email && (
                <input
                  type="email"
                  required
                  placeholder="meno@domena.com"
                  value={contactValues.email}
                  onChange={(e) => setContactValues((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={wantsNote}
                onChange={() => setWantsNote((prev) => !prev)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>{t.noteCheckboxLabel}</span>
            </label>
            {wantsNote && (
              <textarea
                rows={3}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder={t.notePlaceholder}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={!isContactValid()}
            className={`w-full py-3.5 rounded-xl font-bold transition text-sm shadow-md active:scale-95 ${
              isContactValid() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            {t.bookBtn}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mx-auto mt-6 flex items-center justify-center px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs tracking-wider uppercase hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm active:scale-95"
      >
        {t.backToPackages}
      </button>
    </div>
  );
}