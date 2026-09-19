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
import Stepper from '@/app/components/Stepper';
import AdminReservationDashboard from '@/app/components/admin/AdminReservationDashboard';
import CancelRequestModal from '@/app/components/admin/CancelRequestModal';
import LandingScreen from '@/app/components/LandingScreen';

import { 
  Gift, LogIn, ArrowRight, AlertCircle, Tag, Calendar, 
  Clock, CalendarX, RotateCw, CheckCircle2, X, ChevronDown, ChevronUp, Sparkles, ShieldCheck, Star
} from 'lucide-react';

export default function Home() {
  const { language } = useLanguage();
  const lang: LangType = language.toUpperCase() as LangType;

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('welcome_seen') !== 'true';
      } catch {}
    }
    return true;
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
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
    const handleOpenLanding = () => {
      setShowSplash(true);
    };
    window.addEventListener('open_landing_screen', handleOpenLanding);
    return () => window.removeEventListener('open_landing_screen', handleOpenLanding);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const welcomeSeen = typeof window !== 'undefined' && sessionStorage.getItem('welcome_seen') === 'true';
      if (welcomeSeen) {
        setShowSplash(false);
      }

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
        const isDismissed = typeof window !== 'undefined' && sessionStorage.getItem('guest_notice_dismissed') === 'true';
        if (!isDismissed) {
          setShowGuestNotice(true);
        }
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
        const isDismissed = typeof window !== 'undefined' && sessionStorage.getItem('guest_notice_dismissed') === 'true';
        if (!isDismissed) {
          setShowGuestNotice(true);
        }
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

            // Zabezpečíme prísne chronologické zoradenie slotov podľa času pre každý deň
            Object.keys(processedSlots).forEach((k) => {
              processedSlots[k].sort(
                (a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime()
              );
            });

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
      className="min-h-screen pt-[calc(env(safe-area-inset-top,16px)+3.75rem)] sm:pt-24 lg:pt-28 transition-colors duration-300 pb-28 sm:pb-36 bg-transparent text-[#0B0D22] dark:text-[#FFFFFF] font-sans relative overflow-x-hidden"
      style={
        {
          '--discount-border': '#2B2F49',
          '--discount-border-hover': '#6633EE',
          '--discount-text': '#FFFFFF',
          '--discount-text-accent': '#A78BFA',
          '--discount-glow': 'rgba(102,51,238,0.3)',
          '--discount-glow-soft': 'rgba(102,51,238,0.15)',
          '--discount-glow-hover': 'rgba(102,51,238,0.5)',
        } as React.CSSProperties
      }
    >
      {/* ONBOARDING SPLASH SCREEN */}
      {showSplash && !isAdmin ? (
        <LandingScreen
          onEnter={() => {
            setShowSplash(false);
            try {
              sessionStorage.setItem('welcome_seen', 'true');
            } catch {}
          }}
          sessionUser={sessionUser}
        />
      ) : (
        <>
          {isUserBanned && (
            <div className="max-w-md mx-auto my-6 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#FF5A7A]/30 shadow-xl text-center space-y-3 font-sans animate-in fade-in duration-300 text-[#1E293B] dark:text-[#DDE0F2]">
              <div className="w-12 h-12 rounded-full bg-[#FF5A7A]/15 text-[#FF5A7A] mx-auto flex items-center justify-center shadow-md">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="font-semibold text-base text-[#0B0D22] dark:text-[#FFFFFF]">
                  {language === 'sk' ? 'Váš účet bol zablokovaný' : 'Your account is suspended'}
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#C7CAE0] leading-relaxed">
                  {language === 'sk'
                    ? 'Váš účet bol pozastavený. Nie je možné vytvárať nové rezervácie ani využívať výhody účtu.'
                    : 'Your account has been suspended. New bookings are disabled.'}
                </p>
              </div>
              <p className="text-[11px] font-medium text-[#FF5A7A] bg-[#FF5A7A]/10 p-2.5 rounded-full border border-[#FF5A7A]/20">
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

          {/* 🚀 HLAVNÝ OBSAH REZERVÁCIE */}
          <main className="max-w-5xl lg:max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
            {isAdmin ? (
              <AdminReservationDashboard language={language} />
            ) : (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                
                {/* 1. KARTA ZRUŠENÉHO STORNA */}
                {approvedStornoNotice && dismissedApprovedRef !== approvedStornoNotice.booking_ref && (
                  <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm text-left space-y-1.5 relative animate-in fade-in slide-in-from-top-3 duration-300 text-[#1E293B] dark:text-[#DDE0F2]">
                    <button
                      type="button"
                      onClick={() => handleDismissApprovedStorno(approvedStornoNotice.booking_ref)}
                      className="absolute top-3.5 right-3.5 text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-white p-1 cursor-pointer"
                      title={lang === 'SK' ? 'Zatvoriť oznam' : 'Dismiss notice'}
                    >
                      <X size={16} />
                    </button>
                    <div className="flex items-center justify-between text-[#6633EE] dark:text-[#A78BFA] font-medium text-xs uppercase tracking-wider pr-6">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={16} />
                        <span>{lang === 'SK' ? 'Rezervácia bola stornovaná' : 'Booking Cancelled'}</span>
                      </span>
                      <span className="font-mono text-[#0B0D22] dark:text-[#FFFFFF]">#{approvedStornoNotice.booking_ref}</span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-[#C7CAE0] leading-relaxed pr-6 font-normal">
                      {lang === 'SK'
                        ? `Vaša žiadosť o storno bola schválená. Rezervácia č. #${approvedStornoNotice.booking_ref} bola úspešne zrušená.`
                        : `Your cancellation request was approved. Booking #${approvedStornoNotice.booking_ref} has been cancelled.`}
                    </p>
                  </div>
                )}

                {/* 🚀 2. KARTA AKTÍVNYCH REZERVAČNÝCH TERMÍNOV (ZOBRAZÍ SA LEN AK REÁLNE EXISTUJÚ) */}
                {userBookings.length > 0 && (
                  <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm dark:shadow-md text-left space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-xs uppercase tracking-wider text-[#6633EE] dark:text-[#A78BFA]">
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
                            className="flex items-center gap-1 text-[11px] font-medium text-[#0B0D22] dark:text-[#FFFFFF] bg-slate-50 dark:bg-[#010314] px-3 py-1 rounded-full border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE]/40 transition cursor-pointer shadow-xs"
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
                          className="flex items-center gap-1 text-[11px] font-medium text-[#6633EE] dark:text-[#A78BFA] hover:text-[#0B0D22] dark:hover:text-[#FFFFFF] cursor-pointer"
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
                            className="p-4 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-2.5 transition-all shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="font-medium text-[11px] text-[#6633EE] dark:text-[#A78BFA] flex items-center gap-1 mb-1">
                                  <Tag size={12} />
                                  <span>{booking.bookingRef ? `#${booking.bookingRef}` : 'Rezervácia'}</span>
                                </span>
                                <p className="font-medium text-[#0B0D22] dark:text-[#FFFFFF] text-sm">
                                  {formatFullDateText(booking.start)}
                                </p>
                                <p className="text-xs text-[#64748B] dark:text-[#C7CAE0] font-normal mt-0.5">
                                  {booking.summary.replace(/^REZERVÁCIA:\s*/i, '')}
                                </p>
                              </div>
                              <span className="px-3 py-1 rounded-full bg-[#6633EE] text-white text-xs font-medium shrink-0 flex items-center gap-1 shadow-[0_0_12px_rgba(102,51,238,0.5)]">
                                <Clock size={13} />
                                <span>{format24hTimeText(booking.start)}</span>
                              </span>
                            </div>

                            {stornoStatus === 'rejected' && (
                              <div className="p-2.5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-xs font-medium text-[#FF5A7A] flex items-center gap-2">
                                <AlertCircle size={15} className="shrink-0" />
                                <span>
                                  {lang === 'SK'
                                    ? 'Žiadosť o storno nebola akceptovaná adminom.'
                                    : 'Cancellation request was rejected.'}
                                </span>
                              </div>
                            )}

                            {stornoStatus === 'pending' && (
                              <div className="p-2.5 rounded-full bg-[#6633EE]/15 border border-[#6633EE]/30 text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] flex items-center gap-2">
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
                                className="w-full btn-danger text-xs flex items-center justify-center gap-1.5"
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
                        className="w-full py-2 text-center text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] hover:underline cursor-pointer flex items-center justify-center gap-1 pt-1"
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

                {/* 🌟 HLAVIČKA TITULKU REZERVÁCIE */}
                <div className="max-w-2xl mx-auto flex items-center justify-center mt-2 sm:mt-4 mb-3 sm:mb-4 px-1">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B0D22] dark:text-[#FFFFFF] tracking-tight text-center">
                    {t.massageTitle}
                  </h1>
                </div>

                {/* 🚀 EVERVAULT STEPPER */}
                <Stepper 
                  currentStep={massageStep} 
                  onStepClick={(step) => setMassageStep(step)} 
                  language={language} 
                  selectedType={selectedType}
                />

                {massageStep === 1 && (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <Step1Level
                      t={t}
                      onSelect={handleLevelSelect}
                    />
                  </div>
                )}

                {massageStep === 2 && selectedType && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
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
                  </div>
                )}

                {massageStep === 3 && selectedType && selectedDuration && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
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
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}

      {/* VAROVNÉ OKNO PRED VÝBEROM BALÍČKA */}
      {showAlreadyBookedNotice && earliestBooking && !isAdmin && (
        <div className="fixed inset-0 z-50 bg-[#0B0D22]/60 dark:bg-[#010314]/80 backdrop-blur-md flex items-center justify-center p-6 font-sans animate-fadeIn">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl space-y-5 text-center relative animate-in fade-in zoom-in-95 duration-200 text-[#1E293B] dark:text-[#DDE0F2]">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#6633EE]/15 dark:bg-[#6633EE]/20 text-[#6633EE] dark:text-[#A78BFA] flex items-center justify-center shadow-sm">
              <AlertCircle size={24} />
            </div>

            <div className="space-y-2 text-left">
              <h3 className="font-semibold text-lg text-[#0B0D22] dark:text-[#FFFFFF] text-center tracking-tight">
                {lang === 'SK' ? 'Už máte aktívnu rezerváciu!' : 'You already have an active booking!'}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#C7CAE0] text-center leading-relaxed font-normal">
                {lang === 'SK'
                  ? `V systéme evidujeme vaše aktívne rezervácie (${userBookings.length}):`
                  : `We register your active appointments (${userBookings.length}):`}
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-1 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-[#6633EE] dark:text-[#A78BFA] flex items-center gap-1">
                    <Tag size={12} />
                    <span>{earliestBooking.bookingRef ? `#${earliestBooking.bookingRef}` : 'Rezervácia'}</span>
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#6633EE] text-white">
                    {format24hTimeText(earliestBooking.start)}
                  </span>
                </div>
                <p className="font-medium text-xs text-[#0B0D22] dark:text-[#FFFFFF] pt-0.5">
                  {formatFullDateText(earliestBooking.start)}
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0] font-normal">
                  {earliestBooking.summary.replace(/^REZERVÁCIA:\s*/i, '')}
                </p>
              </div>

              <p className="text-xs font-medium text-[#0B0D22] dark:text-[#FFFFFF] text-center pt-2">
                {lang === 'SK'
                  ? 'Chcete si naozaj vytvoriť ďalšiu rezerváciu?'
                  : 'Do you really want to book an additional massage?'}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={confirmAndProceedToStep2}
                className="w-full btn-primary font-medium text-xs uppercase tracking-wider"
              >
                {lang === 'SK' ? 'Áno, vytvoriť ďalšiu rezerváciu' : 'Yes, create additional booking'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAlreadyBookedNotice(false);
                  setPendingType(null);
                }}
                className="w-full btn-secondary font-medium text-xs"
              >
                {lang === 'SK' ? 'Späť' : 'Back'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SKLENENÉ INFORMAČNÉ OKNO PRE HOSŤA */}
      {showGuestNotice && !sessionUser && !showSplash && (
        <div className="fixed inset-0 z-50 bg-[#0B0D22]/60 dark:bg-[#010314]/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-sans animate-fadeIn">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl space-y-5 text-center relative animate-in fade-in zoom-in-95 duration-200 text-[#1E293B] dark:text-[#DDE0F2]">
            
            {/* Ikona v hlavičke */}
            <div className="w-14 h-14 mx-auto rounded-full bg-[#6633EE] text-white flex items-center justify-center shadow-[0_0_24px_rgba(102,51,238,0.6)]">
              <Sparkles size={26} />
            </div>

            {/* Nadpis a Úvod */}
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#6633EE]/15 border border-[#6633EE]/30 text-[#6633EE] dark:text-[#A78BFA] text-[11px] font-medium uppercase tracking-wider">
                {lang === 'SK' ? 'Sekcia rezervácií' : 'Booking Section'}
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#0B0D22] dark:text-[#FFFFFF] tracking-tight pt-1">
                {lang === 'SK' ? 'Rezervujte si svoj relax' : 'Book Your Relaxation'}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#C7CAE0] leading-relaxed font-normal max-w-md mx-auto">
                {lang === 'SK'
                  ? 'Vytvorte si rezerváciu ako hosť, alebo sa prihláste a odomknite kompletný balík výhod.'
                  : 'Book as a guest, or sign in to unlock your full loyalty benefits package.'}
              </p>
            </div>

            {/* Zoznam výhod po prihlásení */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-1">
                <div className="flex items-center gap-2 text-[#6633EE] dark:text-[#A78BFA]">
                  <Gift size={15} />
                  <span className="text-xs font-medium text-[#0B0D22] dark:text-[#FFFFFF]">
                    {lang === 'SK' ? 'Vernostné pečiatky' : 'Loyalty Stamps'}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 font-normal leading-snug">
                  {lang === 'SK'
                    ? 'Zbierajte digitálne pečiatky za každú masáž a získajte odmeny.'
                    : 'Collect stamps for every visit and claim free rewards.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-1">
                <div className="flex items-center gap-2 text-[#6633EE] dark:text-[#A78BFA]">
                  <ShieldCheck size={15} />
                  <span className="text-xs font-medium text-[#0B0D22] dark:text-[#FFFFFF]">
                    {lang === 'SK' ? 'Rýchla rezervácia' : 'Instant Auto-fill'}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 font-normal leading-snug">
                  {lang === 'SK'
                    ? 'Automatické predvyplnenie vašich kontaktných údajov.'
                    : 'Auto-fill your details without typing every time.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-1">
                <div className="flex items-center gap-2 text-[#6633EE] dark:text-[#A78BFA]">
                  <Calendar size={15} />
                  <span className="text-xs font-medium text-[#0B0D22] dark:text-[#FFFFFF]">
                    {lang === 'SK' ? 'Prehľad & QR lístok' : 'Bookings & QR Pass'}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 font-normal leading-snug">
                  {lang === 'SK'
                    ? 'Správa termínov, digitálny QR vstup a jednoduché storno.'
                    : 'Manage appointments, access digital pass & easy storno.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-1">
                <div className="flex items-center gap-2 text-[#6633EE] dark:text-[#A78BFA]">
                  <Star size={15} />
                  <span className="text-xs font-medium text-[#0B0D22] dark:text-[#FFFFFF]">
                    {lang === 'SK' ? 'Odznaky & Bonusy' : 'Badges & Bonuses'}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 font-normal leading-snug">
                  {lang === 'SK'
                    ? 'Odomykanie medailí a špeciálny darček k narodeninám.'
                    : 'Unlock achievements and special birthday surprises.'}
                </p>
              </div>
            </div>

            {/* Akčné tlačidlá */}
            <div className="space-y-2.5 pt-2">
              <Link
                href="/login"
                className="w-full btn-primary text-xs uppercase tracking-wider flex items-center justify-center gap-2 font-medium"
              >
                <LogIn size={15} />
                <span>{lang === 'SK' ? 'Prihlásiť sa & Získať výhody' : 'Sign In & Claim Benefits'}</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowGuestNotice(false);
                  try {
                    sessionStorage.setItem('guest_notice_dismissed', 'true');
                  } catch {}
                }}
                className="w-full btn-secondary text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 font-medium cursor-pointer"
              >
                <span>{lang === 'SK' ? 'Pokračovať ako hosť' : 'Continue as Guest'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}