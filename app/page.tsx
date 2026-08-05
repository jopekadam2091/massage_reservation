'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LangType, MassageType, TimeSlot } from '@/app/types';
import { DEFAULT_DISCOUNT_THEME } from '@/app/constants/config';
import { translations, packagesTranslations } from '@/app/constants/translations';
import { getDateKey } from '@/app/utils/calendar';
import { useLanguage } from '@/app/lib/LanguageContext';
import { supabase } from '@/app/lib/supabase';

import SuccessModal from '@/app/components/SuccessModal';
import Step1Level from '@/app/components/Step1Level';
import Step2Packages from '@/app/components/Step2Packages';
import Step3Calendar from '@/app/components/Step3Calendar';
import AdminReservationDashboard from '@/app/components/admin/AdminReservationDashboard';
import CancelRequestModal from '@/app/components/admin/CancelRequestModal';

import { 
  Gift, LogIn, ArrowRight, AlertCircle, Tag, Calendar, 
  Clock, CalendarX, RotateCw, CheckCircle2, X, ChevronDown, ChevronUp
} from 'lucide-react';

export default function Home() {
  const { language } = useLanguage();
  const lang: LangType = language.toUpperCase() as LangType;

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lastBookingDetails, setLastBookingDetails] = useState<any>(null);
  const [discountTheme, setDiscountTheme] = useState(DEFAULT_DISCOUNT_THEME);

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isUserBanned, setIsUserBanned] = useState<boolean>(false);
  const [showGuestNotice, setShowGuestNotice] = useState<boolean>(false);

  // 🚀 NOVÉ STAVY PRE VIACERO REZERVAČNÝCH TERMÍNOV A ROZBAĽOVANIE
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [isBookingsExpanded, setIsBookingsExpanded] = useState<boolean>(false);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState<any>(null);
  const [cancellationRequests, setCancellationRequests] = useState<any[]>([]);

  const [approvedStornoNotice, setApprovedStornoNotice] = useState<any>(null);
  const [dismissedApprovedRef, setDismissedApprovedRef] = useState<string | null>(null);

  const [loadingUserBooking, setLoadingUserBooking] = useState<boolean>(false);
  const [showAlreadyBookedNotice, setShowAlreadyBookedNotice] = useState<boolean>(false);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState<boolean>(false);
  const [pendingType, setPendingType] = useState<MassageType | null>(null);

  const [massageStep, setMassageStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<MassageType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [slotsByDate, setSlotsByDate] = useState<Record<string, TimeSlot[]>>({});
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const t = translations[lang] || translations.SK;
  const packagesData = packagesTranslations[lang] || packagesTranslations.SK;

  const handleDismissApprovedStorno = (bookingRef: string) => {
    if (!bookingRef) return;
    try {
      localStorage.setItem(`dismissed_storno_${bookingRef}`, 'true');
    } catch (err) {
      console.error('Chyba ukladania do localStorage:', err);
    }
    setApprovedStornoNotice(null);
  };

  // 🚀 NAČÍTANIE VŠETKÝCH REZERVAČNÝCH TERMÍNOV POUŽÍVATEĽA
  const refetchUserAppointments = async (email: string) => {
    setLoadingUserBooking(true);
    try {
      const res = await fetch(`/api/user/appointments?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const allActiveBookings = (res.ok && data.bookings) ? data.bookings : [];

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data: stornoList } = await supabase
          .from('cancellation_requests')
          .select('booking_ref, status, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (stornoList) {
          setCancellationRequests(stornoList);

          const latestApproved = stornoList.find((s) => s.status === 'approved');
          if (latestApproved) {
            const isMatchActive = allActiveBookings.some(
              (b: any) => b.bookingRef?.toUpperCase() === latestApproved.booking_ref?.toUpperCase()
            );

            if (!isMatchActive) {
              const isDismissed = typeof window !== 'undefined' && localStorage.getItem(`dismissed_storno_${latestApproved.booking_ref}`) === 'true';
              if (!isDismissed) {
                setApprovedStornoNotice(latestApproved);
              } else {
                setApprovedStornoNotice(null);
              }
            } else {
              setApprovedStornoNotice(null);
            }
          } else {
            setApprovedStornoNotice(null);
          }
        }
      }

      setUserBookings(allActiveBookings);
    } catch (err) {
      console.error('Chyba kontroly rezervácií:', err);
    } finally {
      setLoadingUserBooking(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser(session.user);
        setShowGuestNotice(false);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          if (session.user.email) {
            await refetchUserAppointments(session.user.email);
          }
        }

        // Bezpečná kontrola banu bez toho, aby chýbajúci stĺpec v DB zhodil prihlásenie
        try {
          const { data: banCheck, error: banErr } = await supabase
            .from('profiles')
            .select('is_banned')
            .eq('id', session.user.id)
            .maybeSingle();
          if (!banErr && banCheck?.is_banned) {
            setIsUserBanned(true);
          } else {
            setIsUserBanned(false);
          }
        } catch {
          setIsUserBanned(false);
        }
      } else {
        setSessionUser(null);
        setIsAdmin(false);
        setIsUserBanned(false);
        setShowGuestNotice(true);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        setShowGuestNotice(false);
      } else {
        setSessionUser(null);
        setIsAdmin(false);
        setShowGuestNotice(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionUser?.email || isAdmin) return;

    const interval = setInterval(() => {
      refetchUserAppointments(sessionUser.email);
    }, 12000);

    return () => clearInterval(interval);
  }, [sessionUser, isAdmin]);

  useEffect(() => {
    fetch('/api/discount-theme')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.found && data?.theme) setDiscountTheme(data.theme);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (massageStep === 3 && !isAdmin) {
      setLoadingCalendar(true);
      fetch('/api/appointments')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.events) {
            const discountRegex = /^FSM_D(\d{1,3})$/i;
            const allFsmRaw = data.events
              .filter(
                (e: any) =>
                  (e.summary || '').trim().toLowerCase().includes('fsm') &&
                  e.start?.dateTime &&
                  e.end?.dateTime
              )
              .map((e: any) => {
                const summary = (e.summary || '').trim();
                const match = summary.match(discountRegex);
                return {
                  start: new Date(e.start.dateTime),
                  end: new Date(e.end.dateTime),
                  isDiscount: !!match,
                  percent: match ? Math.min(100, Math.max(0, parseInt(match[1], 10))) : 0,
                };
              });

            const plainBlocks = allFsmRaw.filter((e: any) => !e.isDiscount);
            const discountEvents = allFsmRaw.filter((e: any) => e.isDiscount);

            const overlapsAny = (
              a: { start: Date; end: Date },
              list: { start: Date; end: Date }[]
            ) =>
              list.some(
                (b) => a.start.getTime() < b.end.getTime() && a.end.getTime() > b.start.getTime()
              );

            const nestedDiscountWindows = discountEvents.filter((d: any) =>
              overlapsAny(d, plainBlocks)
            );
            const standaloneDiscountBlocks = discountEvents.filter(
              (d: any) => !overlapsAny(d, plainBlocks)
            );

            const getNestedDiscountForSlot = (slotStart: Date) => {
              let maxPercent = 0;
              if (!selectedDuration) return maxPercent;
              const massageEndTime = slotStart.getTime() + selectedDuration * 60000;
              nestedDiscountWindows.forEach((w: any) => {
                if (
                  slotStart.getTime() >= w.start.getTime() &&
                  massageEndTime <= w.end.getTime()
                ) {
                  maxPercent = Math.max(maxPercent, w.percent);
                }
              });
              return maxPercent;
            };

            const processedSlots: Record<string, TimeSlot[]> = {};

            const generateSlotsForBlock = (
              event: { start: Date; end: Date },
              bakedPercent: number | null
            ) => {
              const dateKey = getDateKey(
                event.start.getFullYear(),
                event.start.getMonth(),
                event.start.getDate()
              );
              if (!processedSlots[dateKey]) processedSlots[dateKey] = [];

              let slotStart = new Date(event.start.getTime());
              const blockEnd = event.end.getTime();

              while (slotStart.getTime() < blockEnd) {
                const remainingMinutes = Math.round((blockEnd - slotStart.getTime()) / 60000);
                const formattedTime = slotStart.toLocaleTimeString('sk-SK', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });
                const discountPercent =
                  bakedPercent !== null ? bakedPercent : getNestedDiscountForSlot(slotStart);

                processedSlots[dateKey].push({
                  formattedTime,
                  startIso: slotStart.toISOString(),
                  availableMinutes: remainingMinutes,
                  discountPercent,
                });

                slotStart.setMinutes(slotStart.getMinutes() + 15);
              }
            };

            plainBlocks
              .sort((a: any, b: any) => a.start.getTime() - b.start.getTime())
              .forEach((event: any) => generateSlotsForBlock(event, null));

            standaloneDiscountBlocks
              .sort((a: any, b: any) => a.start.getTime() - b.start.getTime())
              .forEach((event: any) => generateSlotsForBlock(event, event.percent));

            setSlotsByDate(processedSlots);
          }
          setLoadingCalendar(false);
        })
        .catch(() => setLoadingCalendar(false));
    }
  }, [massageStep, selectedDuration, isAdmin]);

  const resetAll = () => {
    setMassageStep(1);
    setSelectedType(null);
    setSelectedDuration(null);
    setSelectedDateKey(null);
    setSelectedSlot(null);
  };

  const handleLevelSelect = (type: MassageType) => {
    if (userBookings.length > 0 && !isAdmin) {
      setPendingType(type);
      setShowAlreadyBookedNotice(true);
    } else {
      setSelectedType(type);
      setMassageStep(2);
    }
  };

  const confirmAndProceedToStep2 = () => {
    if (pendingType) {
      setSelectedType(pendingType);
      setMassageStep(2);
    }
    setShowAlreadyBookedNotice(false);
  };

  const formatFullDateText = (isoString: string) => {
    const d = new Date(isoString);
    const day = d.getDate();
    const monthSK = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
    const monthEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthText = lang === 'SK' ? monthSK[d.getMonth()] : monthEN[d.getMonth()];
    return `${day}. ${monthText} ${d.getFullYear()}`;
  };

  const format24hTimeText = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const earliestBooking = userBookings.length > 0 ? userBookings[0] : null;

  return (
    <div
      className="min-h-[calc(100vh-65px)] transition-colors duration-300 pb-20 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans relative"
      style={
        {
          '--discount-border': discountTheme.border,
          '--discount-border-hover': discountTheme.borderHover,
          '--discount-text': discountTheme.text,
          '--discount-text-accent': discountTheme.textAccent,
          '--discount-glow': discountTheme.glow,
          '--discount-glow-soft': discountTheme.glowSoft,
          '--discount-glow-hover': discountTheme.glowHover,
        } as React.CSSProperties
      }
    >
      {isUserBanned && (
        <div className="max-w-md mx-auto my-6 p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 shadow-xl text-center space-y-3 font-sans animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 mx-auto flex items-center justify-center shadow-md">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              {language === 'sk' ? 'Váš účet bol zablokovaný' : 'Your account is suspended'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'sk'
                ? 'Váš účet bol pozastavený. Nie je možné vytvárať nové rezervácie ani využívať výhody účtu.'
                : 'Your account has been suspended. New bookings are disabled.'}
            </p>
          </div>
          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-900/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
            {language === 'sk'
              ? 'Pre viac informácií alebo odblokovanie kontaktujte prosím podporu (support).'
              : 'For assistance or unblocking, please contact support.'}
          </p>
        </div>
      )}
      <SuccessModal
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        t={t}
        bookingDetails={lastBookingDetails}
        language={language}
      />

      {sessionUser && (
        <CancelRequestModal
          isOpen={showCancelRequestModal}
          onClose={() => {
            setShowCancelRequestModal(false);
            setSelectedCancelBooking(null);
            if (sessionUser?.email) refetchUserAppointments(sessionUser.email);
          }}
          booking={selectedCancelBooking || earliestBooking}
          userId={sessionUser.id}
          language={language}
        />
      )}

      {/* VAROVNÉ OKNO PRED VÝBEROM BALÍČKA */}
      {showAlreadyBookedNotice && earliestBooking && !isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 font-sans animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-2xl space-y-5 text-center relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <AlertCircle size={28} />
            </div>

            <div className="space-y-2 text-left">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 text-center tracking-tight">
                {lang === 'SK' ? 'Už máte aktívnu rezerváciu!' : 'You already have an active booking!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                {lang === 'SK'
                  ? `V systéme evidujeme vaše aktívne rezervácie (${userBookings.length}):`
                  : `We register your active appointments (${userBookings.length}):`}
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Tag size={12} />
                    <span>{earliestBooking.bookingRef ? `#${earliestBooking.bookingRef}` : 'Rezervácia'}</span>
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                    {format24hTimeText(earliestBooking.start)}
                  </span>
                </div>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-100 pt-0.5">
                  {formatFullDateText(earliestBooking.start)}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {earliestBooking.summary.replace(/^REZERVÁCIA:\s*/i, '')}
                </p>
              </div>

              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 text-center pt-2">
                {lang === 'SK'
                  ? 'Chcete si naozaj vytvoriť ďalšiu rezerváciu?'
                  : 'Do you really want to book an additional massage?'}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={confirmAndProceedToStep2}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-95 cursor-pointer"
              >
                {lang === 'SK' ? 'Áno, vytvoriť ďalšiu rezerváciu' : 'Yes, create additional booking'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAlreadyBookedNotice(false);
                  setPendingType(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {lang === 'SK' ? 'Späť' : 'Back'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SKLENENÉ OKNO PRE HOSŤA */}
      {showGuestNotice && !sessionUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 font-sans animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Gift size={28} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {lang === 'SK' ? 'Vitajte na rezervácii masáže!' : 'Welcome to Massage Booking!'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed px-1">
                {lang === 'SK'
                  ? 'Momentálne nie ste prihlásený. Môžete kedykoľvek pokračovať ako hosť a vytvoriť si rezerváciu, alebo sa prihlásiť a získať prístup k vernostným odmenám, zľavám a prekvapeniam!'
                  : 'You are currently not signed in. You can continue as a guest to make your reservation, or sign in / register to unlock loyalty rewards, discounts, and gifts!'}
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <Link
                href="/login"
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <LogIn size={16} />
                <span>{lang === 'SK' ? 'Prihlásiť sa & Získať výhody' : 'Sign In & Claim Benefits'}</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowGuestNotice(false)}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{lang === 'SK' ? 'Pokračovať ako hosť' : 'Continue as Guest'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 HLAVNÝ OBSAH REZERVÁCIE */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 pt-3 sm:pt-4">
        {isAdmin ? (
          <AdminReservationDashboard language={language} />
        ) : (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            
            {/* 1. KARTA ZRUŠENÉHO STORNA */}
            {approvedStornoNotice && dismissedApprovedRef !== approvedStornoNotice.booking_ref && (
              <div className="max-w-xl mx-auto p-4 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm text-left space-y-1.5 relative animate-in fade-in slide-in-from-top-3 duration-300">
                <button
                  type="button"
                  onClick={() => handleDismissApprovedStorno(approvedStornoNotice.booking_ref)}
                  className="absolute top-3.5 right-3.5 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 p-1 cursor-pointer"
                  title={lang === 'SK' ? 'Zatvoriť oznam' : 'Dismiss notice'}
                >
                  <X size={16} />
                </button>
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider pr-6">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={16} />
                    <span>{lang === 'SK' ? 'Rezervácia bola stornovaná' : 'Booking Cancelled'}</span>
                  </span>
                  <span className="font-mono">#{approvedStornoNotice.booking_ref}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-6">
                  {lang === 'SK'
                    ? `Vaša žiadosť o storno bola schválená. Rezervácia č. #${approvedStornoNotice.booking_ref} bola úspešne zrušená.`
                    : `Your cancellation request was approved. Booking #${approvedStornoNotice.booking_ref} has been cancelled.`}
                </p>
              </div>
            )}

            {/* 🚀 2. KARTA AKTÍVNYCH REZERVAČNÝCH TERMÍNOV (S MOŽNOSŤOU ROZBALENIA/ZBALENIA) */}
            {userBookings.length > 0 && (
              <div className="max-w-xl mx-auto p-4 rounded-3xl bg-violet-50/80 dark:bg-zinc-800/80 border border-violet-200/80 dark:border-violet-900/50 shadow-sm text-left space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-violet-700 dark:text-violet-300">
                    <Calendar size={16} />
                    <span>
                      {lang === 'SK' 
                        ? `Vaše aktívne rezervácie (${userBookings.length})` 
                        : `Your active appointments (${userBookings.length})`}
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Tlačidlo na rozbalenie/zbalenie ak je viac ako 1 rezervácia */}
                    {userBookings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIsBookingsExpanded(!isBookingsExpanded)}
                        className="flex items-center gap-1 text-[11px] font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/60 px-2.5 py-1 rounded-xl hover:bg-violet-200 transition cursor-pointer"
                      >
                        <span>
                          {isBookingsExpanded 
                            ? (lang === 'SK' ? 'Zbaliť' : 'Collapse') 
                            : (lang === 'SK' ? `Zobraziť všetky (${userBookings.length})` : `Show all (${userBookings.length})`)}
                        </span>
                        {isBookingsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => sessionUser?.email && refetchUserAppointments(sessionUser.email)}
                      disabled={loadingUserBooking}
                      className="flex items-center gap-1 text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                    >
                      <RotateCw size={12} className={loadingUserBooking ? 'animate-spin' : ''} />
                      <span>{lang === 'SK' ? 'Obnoviť' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>

                {/* ZOZNAM KARIET REZERVAČNÝCH TERMÍNOV */}
                <div className="space-y-3">
                  {(isBookingsExpanded ? userBookings : userBookings.slice(0, 1)).map((booking) => {
                    const matchingStornoReq = cancellationRequests.find(
                      (s) => s.booking_ref?.toUpperCase() === booking.bookingRef?.toUpperCase()
                    );
                    const stornoStatus = matchingStornoReq?.status;

                    return (
                      <div
                        key={booking.id || booking.bookingRef}
                        className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-violet-100 dark:border-violet-900/60 shadow-sm space-y-2.5 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-[11px] text-violet-600 dark:text-violet-400 flex items-center gap-1 mb-1">
                              <Tag size={12} />
                              <span>{booking.bookingRef ? `#${booking.bookingRef}` : 'Rezervácia'}</span>
                            </span>
                            <p className="font-bold text-slate-800 dark:text-zinc-100 text-sm">
                              {formatFullDateText(booking.start)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                              {booking.summary.replace(/^REZERVÁCIA:\s*/i, '')}
                            </p>
                          </div>
                          <span className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-black shrink-0 flex items-center gap-1">
                            <Clock size={14} />
                            <span>{format24hTimeText(booking.start)}</span>
                          </span>
                        </div>

                        {stornoStatus === 'rejected' && (
                          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0" />
                            <span>
                              {lang === 'SK'
                                ? 'Žiadosť o storno nebola akceptovaná adminom.'
                                : 'Cancellation request was rejected.'}
                            </span>
                          </div>
                        )}

                        {stornoStatus === 'pending' && (
                          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            <Clock size={15} className="shrink-0 animate-spin" />
                            <span>
                              {lang === 'SK'
                                ? 'Žiadosť o storno čaká na schválenie adminom...'
                                : 'Cancellation request pending admin approval...'}
                            </span>
                          </div>
                        )}

                        {stornoStatus !== 'pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCancelBooking(booking);
                              setShowCancelRequestModal(true);
                            }}
                            className="w-full py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CalendarX size={14} />
                            <span>{lang === 'SK' ? 'Požiadať o storno tejto rezervácie' : 'Request Cancellation'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* DOLNÁ LIŠTA AK JE VIAC REZERVAČNÝCH TERMÍNOV A SÚ ZBALENÉ */}
                {userBookings.length > 1 && !isBookingsExpanded && (
                  <button
                    type="button"
                    onClick={() => setIsBookingsExpanded(true)}
                    className="w-full py-2 text-center text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer flex items-center justify-center gap-1 pt-1"
                  >
                    <span>
                      {lang === 'SK'
                        ? `Zobraziť ďalšie rezervácie (${userBookings.length - 1})`
                        : `Show additional bookings (${userBookings.length - 1})`}
                    </span>
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>
            )}

            <div className="max-w-xl mx-auto text-center">
              <h1 className="text-3xl font-extrabold mb-1.5 text-slate-800 dark:text-slate-100 tracking-tight">
                {t.massageTitle}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t.massageSubtitle}</p>
            </div>

            <div className="flex justify-between max-w-xs mx-auto mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center space-x-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
                      massageStep === step
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700'
                    }`}
                  >
                    {step}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      massageStep === step ? 'text-violet-600 dark:text-violet-400 font-bold' : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {step === 1 ? t.step1 : step === 2 ? t.step2 : t.step3}
                  </span>
                </div>
              ))}
            </div>

            {massageStep === 1 && (
              <Step1Level
                t={t}
                onSelect={handleLevelSelect}
              />
            )}

            {massageStep === 2 && selectedType && (
              <Step2Packages
                selectedType={selectedType}
                packagesData={packagesData}
                t={t}
                onSelectDuration={(duration) => {
                  setSelectedDuration(duration);
                  setMassageStep(3);
                }}
                onBack={() => setMassageStep(1)}
              />
            )}

            {massageStep === 3 && selectedType && selectedDuration && (
              <Step3Calendar
                lang={lang}
                t={t}
                selectedType={selectedType}
                selectedDuration={selectedDuration}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                slotsByDate={slotsByDate}
                loadingCalendar={loadingCalendar}
                selectedDateKey={selectedDateKey}
                setSelectedDateKey={setSelectedDateKey}
                selectedSlot={selectedSlot}
                setSelectedSlot={setSelectedSlot}
                discountTheme={discountTheme}
                onBack={() => setMassageStep(2)}
                onSuccess={(details) => {
                  if (details) {
                    setLastBookingDetails(details);
                  }
                  setShowSuccessPopup(true);
                  resetAll();
                  if (sessionUser?.email) {
                    refetchUserAppointments(sessionUser.email);
                  }
                }}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}