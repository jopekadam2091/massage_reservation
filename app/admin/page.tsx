'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { Profile, StampRecord, GiftRecord } from '@/app/types';
import { findLatestBookingForUser, isWithinRegistrationPeriod } from '@/app/utils/bookingUtils';

import ScannerModal from '../components/ScannerModal';
import AddStampModal from '../components/admin/AddStampModal';
import GiveGiftModal from '../components/admin/GiveGiftModal';
import ClientHistoryModal from '../components/admin/ClientHistoryModal';
import ScanPriceModal from '../components/admin/ScanPriceModal';
import CancelBookingModal from '../components/admin/CancelBookingModal';
import ActiveBookingsSection from '../components/admin/ActiveBookingsSection';
import ClientListSection from '../components/admin/ClientListSection';
import AdminStatsSection from '../components/admin/AdminStatsSection';
import CancellationRequestsSection from '../components/admin/CancellationRequestsSection';
import AdminReviewsSection from '../components/admin/AdminReviewsSection';
import AdminDatabaseSection from '../components/admin/AdminDatabaseSection';

import { Users, Search, Camera, CheckCircle, Calendar, CalendarX, RotateCw, Coins, MessageSquare, Database, Sparkles, Power } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [pendingStornoRequests, setPendingStornoRequests] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientSortBy, setClientSortBy] = useState<string>('registered_desc');
  const [registrationFilter, setRegistrationFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Aktívny admin tab
  const [activeAdminTab, setActiveAdminTab] = useState<'clients' | 'bookings' | 'stats' | 'reviews' | 'database'>('clients');

  // Stav Kolesa Šťastia (Globálne nastavenie)
  const [luckyWheelEnabled, setLuckyWheelEnabled] = useState<boolean>(true);
  const [updatingWheel, setUpdatingWheel] = useState(false);

  // Zabaľovanie panelov
  const [isBookingsCollapsed, setIsBookingsCollapsed] = useState(false);
  const [isClientsCollapsed, setIsClientsCollapsed] = useState(false);

  // Stavy pre modaly
  const [stampProfile, setStampProfile] = useState<Profile | null>(null);
  const [stampPrice, setStampPrice] = useState<string>('');
  const [stampError, setStampError] = useState('');

  const [giftProfile, setGiftProfile] = useState<Profile | null>(null);
  const [selectedGift, setSelectedGift] = useState<string>('');
  const [customCode, setCustomCode] = useState<string>('');
  const [giftError, setGiftError] = useState('');

  const [historyProfile, setHistoryProfile] = useState<Profile | null>(null);

  const [showScanPriceModal, setShowScanPriceModal] = useState(false);
  const [showScannerCamera, setShowScannerCamera] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [scanStampPrice, setScanStampPrice] = useState('');
  const [scanFlowError, setScanFlowError] = useState('');
  const [scanSuccessMsg, setScanSuccessMsg] = useState('');

  // 🚀 OBNOVENIE VŠETKÝCH ADMIN DÁT JEDNÝM STLAČENÍM
  const refreshAllAdminData = async () => {
    setLoadingBookings(true);
    await Promise.all([
      fetchProfiles(),
      fetchActiveBookings(),
      fetchPendingStornos(),
      fetchSettings(),
    ]);
    setLoadingBookings(false);
  };

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || profileData?.role !== 'admin') {
        router.push('/profil');
        return;
      }

      // 🛡️ Dvojstupňové (2FA) overenie administrátora cez e-mail
      const is2FaVerified = typeof window !== 'undefined' && sessionStorage.getItem('admin_2fa_verified') === 'true';
      if (!is2FaVerified) {
        router.push('/login');
        return;
      }

      await refreshAllAdminData();
      setLoading(false);
    };

    checkAdminAndLoad();

    // 🚀 AUTOMATICKÁ KONTROLA NOVÝCH NOTIFIKÁCIÍ A ŽIADOSTÍ O STORNO KAŽDÝCH 12 SEKÚND
    const interval = setInterval(() => {
      fetchPendingStornos();
    }, 12000);

    return () => clearInterval(interval);
  }, [router]);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.users) {
        setProfiles(data.users);
      }
    } catch (err) {
      console.error('Chyba načítavania používateľov:', err);
    }
  };

  const fetchActiveBookings = async () => {
    try {
      const res = await fetch('/api/admin/appointments');
      const data = await res.json();
      if (res.ok && data.bookings) {
        setActiveBookings(data.bookings);
      }
    } catch (err) {
      console.error('Chyba načítavania rezervácií:', err);
    }
  };

  const fetchPendingStornos = async () => {
    const { data } = await supabase
      .from('cancellation_requests')
      .select('id, booking_ref, booking_summary, reason, created_at, profiles(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (data) setPendingStornoRequests(data);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        setLuckyWheelEnabled(data.settings.lucky_wheel_enabled !== false);
      }
    } catch (err) {
      console.error('Chyba načítavania nastavení:', err);
    }
  };

  const handleToggleLuckyWheel = async () => {
    setUpdatingWheel(true);
    try {
      const nextState = !luckyWheelEnabled;
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lucky_wheel_enabled: nextState }),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setLuckyWheelEnabled(data.settings.lucky_wheel_enabled !== false);
      }
    } catch (err) {
      console.error('Chyba prepnutia kolesa šťastia:', err);
    } finally {
      setUpdatingWheel(false);
    }
  };

  const handleApproveStorno = async (requestId: string, bookingRef: string) => {
    try {
      const res = await fetch('/api/admin/storno-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, bookingRef, action: 'approve' }),
      });

      if (res.ok) {
        await refreshAllAdminData();
        alert(language === 'sk' ? 'Storno bolo schválené, e-mail odoslaný a rezervácia vymazaná!' : 'Cancellation approved & email sent!');
      } else {
        alert(language === 'sk' ? 'Chyba pri schvaľovaní storna.' : 'Error approving cancellation.');
      }
    } catch {
      alert('Chyba pripojenia.');
    }
  };

  const handleRejectStorno = async (requestId: string, bookingRef: string) => {
    try {
      const res = await fetch('/api/admin/storno-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, bookingRef, action: 'reject' }),
      });

      if (res.ok) {
        await fetchPendingStornos();
        alert(language === 'sk' ? 'Storno žiadosť bola zamietnutá a e-mail odoslaný klientovi.' : 'Storno request rejected!');
      } else {
        alert(language === 'sk' ? 'Chyba pri zamietaní storna.' : 'Error rejecting cancellation.');
      }
    } catch {
      alert('Chyba pripojenia.');
    }
  };

  const handleCancelDirectBooking = async (eventId: string) => {
    if (!confirm(language === 'sk' ? 'Naozaj chcete stornovať túto rezerváciu?' : 'Cancel this booking?')) return;

    try {
      const res = await fetch('/api/admin/cancel-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (res.ok) {
        alert(language === 'sk' ? 'Rezervácia bola úspešne stornovaná!' : 'Booking cancelled!');
        await fetchActiveBookings();
      } else {
        alert(language === 'sk' ? 'Chyba pri rušení rezervácie.' : 'Error cancelling booking.');
      }
    } catch {
      alert('Chyba pripojenia.');
    }
  };

  const getActiveStamps = (profile: Profile) =>
    profile.stamps.filter((s) => !s.claimed && !s.removed_at);

  const getActiveGift = (profile: Profile): GiftRecord | null => {
    const active = profile.gifts.filter((g) => !g.used && !g.revoked_at);
    if (active.length === 0) return null;
    return [...active].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };

  const getReferrerName = (referredById: string | null) => {
    if (!referredById) return null;
    const referrer = profiles.find((p) => p.id === referredById);
    return referrer ? (referrer.full_name || referrer.email) : null;
  };

  const getGiftLabel = (giftType: string, customCodeValue?: string | null) => {
    if (giftType === 'discount_code' && customCodeValue) {
      return `${language === 'sk' ? 'Kód' : 'Code'}: ${customCodeValue}`;
    }
    if (giftType === 'referral_reward') {
      return language === 'sk' ? 'Odmena za odporučenie (20%)' : 'Referral reward (20%)';
    }
    if (giftType === 'next_visit_gift') return language === 'sk' ? 'Darček pri ďalšej návšteve' : 'Gift on next visit';
    if (giftType === 'vip_upgrade') return language === 'sk' ? 'VIP masáž za cenu Klasickej' : 'VIP Massage for price of Classic';
    return giftType;
  };

  const handleAddStamp = async () => {
    if (!stampProfile || !stampPrice) {
      setStampError(language === 'sk' ? 'Zadajte hodnotu masáže.' : 'Enter the massage price.');
      return;
    }

    const priceNum = parseFloat(stampPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setStampError(language === 'sk' ? 'Zadajte platnú kladnú sumu.' : 'Enter a valid positive amount.');
      return;
    }

    const currentCount = getActiveStamps(stampProfile).length;
    const maxStamps = 10;

    if (currentCount >= maxStamps) {
      setStampError(
        language === 'sk' 
          ? `Karta je plná (${currentCount}/${maxStamps}). Pred pridaním ďalšej pečiatky ju musíte resetovať.`
          : `Card is full (${currentCount}/${maxStamps}). You must reset it before adding more stamps.`
      );
      return;
    }

    const { error } = await supabase
      .from('stamps')
      .insert([{ user_id: stampProfile.id, price: priceNum, claimed: false }]);

    if (error) {
      setStampError('Chyba databázy: ' + error.message);
    } else {
      setStampProfile(null);
      setStampPrice('');
      setStampError('');
      await fetchProfiles();
      alert(language === 'sk' ? 'Pečiatka úspešne pridaná!' : 'Stamp successfully added!');
    }
  };

  const handleScanSuccess = async (scannedId: string) => {
    setShowScannerCamera(false);

    const foundProfile = profiles.find((p) => p.id === scannedId);
    if (!foundProfile) {
      setScanFlowError(language === 'sk' ? 'QR kód nepatrí žiadnemu klientovi.' : 'QR code does not match any client.');
      setShowScanPriceModal(true);
      return;
    }

    const activeCount = getActiveStamps(foundProfile).length;
    const maxStamps = 10;

    if (activeCount >= maxStamps) {
      setScanFlowError(
        language === 'sk'
          ? `Karta klienta ${foundProfile.full_name || foundProfile.email} je už plná (${activeCount}/${maxStamps}).`
          : `${foundProfile.full_name || foundProfile.email}'s card is already full (${activeCount}/${maxStamps}).`
      );
      setShowScanPriceModal(true);
      return;
    }

    const priceNum = parseFloat(scanStampPrice.replace(',', '.'));

    const { error } = await supabase
      .from('stamps')
      .insert([{ user_id: foundProfile.id, price: priceNum, claimed: false }]);

    if (error) {
      setScanFlowError('Chyba databázy: ' + error.message);
      setShowScanPriceModal(true);
      return;
    }

    setScanStampPrice('');
    setScanFlowError('');
    await fetchProfiles();
    setScanSuccessMsg(
      language === 'sk'
        ? `Pečiatka pripísaná: ${foundProfile.full_name || foundProfile.email}`
        : `Stamp added: ${foundProfile.full_name || foundProfile.email}`
    );
    setTimeout(() => setScanSuccessMsg(''), 4000);
  };

  const handleResetCard = async (profile: Profile) => {
    const confirmMessage = language === 'sk'
      ? `Naozaj chcete uplatniť odmenu pre: ${profile.full_name || profile.email}? Všetky doterajšie pečiatky sa označia ako uplatnené.`
      : `Are you sure you want to claim the reward for: ${profile.full_name || profile.email}? All active stamps will be marked as claimed.`;

    if (!confirm('⚠️ ' + confirmMessage)) return;

    const { error } = await supabase
      .from('stamps')
      .update({ claimed: true, claimed_at: new Date().toISOString() })
      .eq('user_id', profile.id)
      .eq('claimed', false)
      .is('removed_at', null);

    if (error) {
      alert('Chyba: ' + error.message);
    } else {
      await fetchProfiles();
      alert(language === 'sk' ? 'Odmena bola úspešne uplatnená!' : 'Reward successfully claimed!');
    }
  };

  const handleRemoveStamp = async (stamp: StampRecord) => {
    const confirmMessage = language === 'sk'
      ? `Naozaj chcete odstrániť túto pečiatku (${Number(stamp.price).toFixed(2)} €)?`
      : `Are you sure you want to remove this stamp (${Number(stamp.price).toFixed(2)} €)?`;

    if (!confirm(confirmMessage)) return;

    const { error } = await supabase
      .from('stamps')
      .update({ removed_at: new Date().toISOString() })
      .eq('id', stamp.id);

    if (error) {
      alert('Chyba: ' + error.message);
    } else {
      await fetchProfiles();
      if (historyProfile) {
        const refreshed = profiles.find((p) => p.id === historyProfile.id);
        if (refreshed) setHistoryProfile(refreshed);
      }
    }
  };

  const sendGift = async () => {
    if (!giftProfile || !selectedGift) {
      setGiftError(language === 'sk' ? 'Vyberte prekvapenie.' : 'Please select a gift.');
      return;
    }

    if (selectedGift === 'discount_code' && !customCode.trim()) {
      setGiftError(language === 'sk' ? 'Zadajte text zľavového kódu.' : 'Please enter the discount code text.');
      return;
    }

    const existingActive = getActiveGift(giftProfile);
    if (existingActive) {
      await supabase
        .from('gifts')
        .update({ used: true, revoked_at: new Date().toISOString() })
        .eq('id', existingActive.id);
    }

    const { error } = await supabase
      .from('gifts')
      .insert([{ 
        user_id: giftProfile.id, 
        gift_type: selectedGift, 
        custom_code: selectedGift === 'discount_code' ? customCode.trim() : null,
        used: false 
      }]);

    if (error) {
      setGiftError('Chyba: ' + error.message);
      return;
    }

    setGiftProfile(null);
    setSelectedGift('');
    setCustomCode('');
    setGiftError('');
    await fetchProfiles();
    alert(language === 'sk' ? 'Prekvapenie bolo úspešne venované!' : 'Surprise successfully sent!');
  };

  const handleRevokeGift = async (profile: Profile) => {
    const activeGift = getActiveGift(profile);
    if (!activeGift) return;

    if (!confirm(language === 'sk' ? `Zrušiť prekvapenie pre ${profile.full_name || profile.email}?` : `Revoke surprise for ${profile.full_name || profile.email}?`)) return;

    const { error } = await supabase
      .from('gifts')
      .update({ used: true, revoked_at: new Date().toISOString() })
      .eq('id', activeGift.id);

    if (error) alert('Chyba: ' + error.message);
    else await fetchProfiles();
  };

  const handleClaimReferralDiscount = async (profile: Profile) => {
    if (!confirm(language === 'sk' ? `Uplatniť 10% referal zľavu pre: ${profile.full_name || profile.email}?` : `Claim 10% referral discount?`)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ referral_discount_status: 'used' })
      .eq('id', profile.id);

    if (error) alert('Chyba: ' + error.message);
    else await fetchProfiles();
  };

  const profilesWithBookings = useMemo(() => {
    return profiles.map((p) => {
      const latest = findLatestBookingForUser(p, activeBookings);
      return {
        ...p,
        latestBooking: latest,
      };
    });
  }, [profiles, activeBookings]);

  const sortedAndFilteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = profilesWithBookings.filter(p => 
      (p.full_name || '').toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.referral_code || '').toLowerCase().includes(q)
    );

    // Filtrovanie podľa dátumu registrácie
    if (registrationFilter !== 'all') {
      list = list.filter(p => isWithinRegistrationPeriod(p.created_at, registrationFilter));
    }

    return list.sort((a, b) => {
      if (clientSortBy === 'registered_desc') {
        const regA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const regB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return regB - regA;
      }

      if (clientSortBy === 'registered_asc') {
        const regA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const regB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return regA - regB;
      }

      if (clientSortBy === 'name_asc') {
        return (a.full_name || a.email).localeCompare(b.full_name || b.email, 'sk');
      }

      if (clientSortBy === 'name_desc') {
        return (b.full_name || b.email).localeCompare(a.full_name || a.email, 'sk');
      }

      if (clientSortBy === 'stamps_desc') {
        const stampsA = getActiveStamps(a).length;
        const stampsB = getActiveStamps(b).length;
        return stampsB - stampsA;
      }

      if (clientSortBy === 'booking_created_desc') {
        const timeA = a.latestBooking?.created 
          ? new Date(a.latestBooking.created).getTime() 
          : a.latestBooking?.start 
            ? new Date(a.latestBooking.start).getTime()
            : 0;
        const timeB = b.latestBooking?.created 
          ? new Date(b.latestBooking.created).getTime() 
          : b.latestBooking?.start 
            ? new Date(b.latestBooking.start).getTime()
            : 0;

        if (timeA > 0 && timeB > 0) return timeB - timeA;
        if (timeA > 0) return -1;
        if (timeB > 0) return 1;

        const regA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const regB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return regB - regA;
      }

      return 0;
    });
  }, [profilesWithBookings, searchQuery, clientSortBy, registrationFilter]);

  const totalStampsCount = profiles.reduce((sum, p) => sum + p.stamps.length, 0);
  const estimatedRevenue = activeBookings.reduce((sum, b) => {
    const priceMatch = (b.description || '').match(/Finálna cena:\s*(\d+)€/i);
    return sum + (priceMatch ? parseInt(priceMatch[1], 10) : 45);
  }, 0);

  if (loading) {
    return (
      <main className="flex min-h-screen pt-24 md:pt-28 items-center justify-center bg-[#F4F6FB] dark:bg-[#010314] text-[#0B0D22] dark:text-[#FFFFFF] font-sans">
        <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60 font-medium">{language === 'sk' ? 'Načítavam admin panel...' : 'Loading admin panel...'}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 sm:pt-24 pb-28 bg-[#F4F6FB] dark:bg-[#010314] text-[#0B0D22] dark:text-[#FFFFFF] transition-colors duration-300 p-4 sm:p-6 font-sans">
      {scanSuccessMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#10B981] text-white text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle size={16} />
          {scanSuccessMsg}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* Hlavička Admina */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] p-4 sm:p-5 rounded-2xl shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#6633EE]/15 border border-[#6633EE]/30 text-[#6633EE] dark:text-[#A78BFA] flex items-center justify-center shadow-sm">
              <Users size={20} />
            </div>
            <div className="text-left">
              <h1 className="font-semibold text-[#0B0D22] dark:text-[#FFFFFF] text-base leading-tight">
                {language === 'sk' ? 'Administrácia salónu' : 'Salon Management'}
              </h1>
              <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60 font-normal">
                {language === 'sk' ? 'Kompletná správa klientov, vernostných kariet a rezervácií' : 'Client loyalty cards & booking management'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={refreshAllAdminData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#010314] text-[#1E293B] dark:text-[#DDE0F2] font-semibold text-xs border border-[#E2E8F0] dark:border-[#2B2F49] hover:bg-slate-200 dark:hover:bg-[#0B0D22] transition active:scale-95 shadow-xs cursor-pointer"
              title={language === 'sk' ? 'Obnoviť dáta' : 'Refresh data'}
            >
              <RotateCw size={14} className={loadingBookings ? 'animate-spin text-[#6633EE]' : ''} />
              <span>{language === 'sk' ? 'Obnoviť' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-[#FF5A7A]/15 text-rose-600 dark:text-[#FF5A7A] font-semibold text-xs border border-rose-200 dark:border-[#FF5A7A]/30 hover:bg-rose-100 transition active:scale-95 shadow-xs cursor-pointer"
            >
              <CalendarX size={14} />
              <span>{language === 'sk' ? 'Storno' : 'Cancel'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScanStampPrice('');
                setScanFlowError('');
                setShowScanPriceModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#6633EE] hover:bg-[#5324d6] text-white font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Camera size={14} />
              <span>{language === 'sk' ? 'Naskenovať' : 'Scan'}</span>
            </button>
          </div>
        </div>

        {/* 🎡 RÝCHLE NASTAVENIE: KOLESO ŠŤASTIA (ZAPNUTÉ / V REKONŠTRUKCII) */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
          luckyWheelEnabled
            ? 'bg-white dark:bg-[#0B0D22] border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs'
            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/50 shadow-xs'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              luckyWheelEnabled
                ? 'bg-purple-50 dark:bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] border-[#6633EE]/20'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
            }`}>
              <Sparkles size={17} className={luckyWheelEnabled ? '' : 'animate-pulse'} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-xs text-[#0B0D22] dark:text-white">
                  {language === 'sk' ? 'Koleso Šťastia pre klientov' : 'Client Wheel of Fortune'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  luckyWheelEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                }`}>
                  {luckyWheelEnabled
                    ? (language === 'sk' ? 'Aktívne' : 'Active')
                    : (language === 'sk' ? 'V rekonštrukcii' : 'Under Maintenance')}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 mt-0.5">
                {luckyWheelEnabled
                  ? (language === 'sk' ? 'Klienti môžu točiť kolesom a získavať zľavy/darčeky.' : 'Clients can spin the wheel and win discounts/gifts.')
                  : (language === 'sk' ? 'Koleso je vypnuté – klientom sa v profile zobrazuje oznam o prebiehajúcej rekonštrukcii.' : 'Wheel is disabled – clients see the under-reconstruction notice in their profile.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleLuckyWheel}
            disabled={updatingWheel}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-50 border ${
              luckyWheelEnabled
                ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
            }`}
          >
            <Power size={13} />
            <span>
              {updatingWheel
                ? (language === 'sk' ? 'Ukladám...' : 'Saving...')
                : luckyWheelEnabled
                ? (language === 'sk' ? 'Prepnúť do rekonštrukcie' : 'Set to Maintenance')
                : (language === 'sk' ? 'Zapnúť koleso' : 'Enable Wheel')}
            </span>
          </button>
        </div>

        {/* 🚀 ADMIN TAB SWITCHER (Klienti, Rezervácie, Štatistiky, Recenzie, Databáza) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs">
          <button
            type="button"
            onClick={() => setActiveAdminTab('clients')}
            className={`flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeAdminTab === 'clients'
                ? 'bg-[#6633EE] text-white shadow-sm'
                : 'text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#010314]'
            }`}
          >
            <Users size={15} />
            <span>{language === 'sk' ? `Klienti (${profiles.length})` : `Clients (${profiles.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('bookings')}
            className={`flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl text-xs font-semibold transition cursor-pointer relative ${
              activeAdminTab === 'bookings'
                ? 'bg-[#6633EE] text-white shadow-sm'
                : 'text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#010314]'
            }`}
          >
            <Calendar size={15} />
            <span>{language === 'sk' ? `Rezervácie (${activeBookings.length})` : `Bookings (${activeBookings.length})`}</span>
            {pendingStornoRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-2 right-2" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('stats')}
            className={`flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeAdminTab === 'stats'
                ? 'bg-[#6633EE] text-white shadow-sm'
                : 'text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#010314]'
            }`}
          >
            <Coins size={15} />
            <span>{language === 'sk' ? 'Štatistiky' : 'Statistics'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('reviews')}
            className={`flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeAdminTab === 'reviews'
                ? 'bg-[#6633EE] text-white shadow-sm'
                : 'text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#010314]'
            }`}
          >
            <MessageSquare size={15} />
            <span>{language === 'sk' ? 'Recenzie' : 'Reviews'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('database')}
            className={`flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl text-xs font-semibold transition cursor-pointer col-span-2 sm:col-span-1 ${
              activeAdminTab === 'database'
                ? 'bg-[#6633EE] text-white shadow-sm'
                : 'text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#010314]'
            }`}
          >
            <Database size={15} />
            <span>{language === 'sk' ? 'Databáza' : 'Database'}</span>
          </button>
        </div>

        {/* ================================================================== */}
        {/* TAB 1: KLIENTI A VERNOSTNÝ SYSTÉM (SEARCH + KLIENTI VŽDY OTVORENÍ) */}
        {/* ================================================================== */}
        {activeAdminTab === 'clients' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Vyhľadávanie v klientoch */}
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#64748B] dark:text-[#C7CAE0]/50">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder={language === 'sk' ? 'Vyhľadať klienta podľa mena, e-mailu alebo referral kódu...' : 'Search client by name, email or referral code...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-white dark:bg-[#0B0D22] text-[#0B0D22] dark:text-[#FFFFFF] placeholder-[#94A3B8] dark:placeholder-[#C7CAE0]/40 focus:outline-none focus:border-[#6633EE] focus:ring-2 focus:ring-[#6633EE]/20 shadow-xs transition text-xs font-medium"
              />
            </div>

            {/* SEKCIA NÁJDENÝCH KLIENTOV */}
            <ClientListSection
              filteredProfiles={sortedAndFilteredProfiles}
              totalProfilesCount={profiles.length}
              clientSortBy={clientSortBy}
              setClientSortBy={setClientSortBy}
              registrationFilter={registrationFilter}
              setRegistrationFilter={setRegistrationFilter}
              isClientsCollapsed={isClientsCollapsed}
              setIsClientsCollapsed={setIsClientsCollapsed}
              getActiveStamps={getActiveStamps}
              getActiveGift={getActiveGift}
              getReferrerName={getReferrerName}
              getGiftLabel={getGiftLabel}
              handleRevokeGift={handleRevokeGift}
              handleClaimReferralDiscount={handleClaimReferralDiscount}
              handleResetCard={handleResetCard}
              setStampProfile={setStampProfile}
              setStampError={setStampError}
              setStampPrice={setStampPrice}
              setGiftProfile={setGiftProfile}
              setSelectedGift={setSelectedGift}
              setCustomCode={setCustomCode}
              setGiftError={setGiftError}
              setHistoryProfile={setHistoryProfile}
              language={language}
            />
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: REZERVÁCIE A STORNO ŽIADOSTI                                */}
        {/* ================================================================== */}
        {activeAdminTab === 'bookings' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* NOTIFIKAČNÝ BANNER PRE SCHVAĽOVANIE / ZAMIETANIE STORNA */}
            <CancellationRequestsSection
              pendingRequests={pendingStornoRequests}
              onApprove={(reqId, ref) => handleApproveStorno(reqId, ref)}
              onReject={(reqId) => {
                const req = pendingStornoRequests.find((r) => r.id === reqId);
                handleRejectStorno(reqId, req?.booking_ref || '');
              }}
              language={language}
            />

            {/* SEKCIA AKTÍVNYCH REZERVÁCIÍ */}
            <ActiveBookingsSection
              activeBookings={activeBookings}
              loadingBookings={loadingBookings}
              isBookingsCollapsed={isBookingsCollapsed}
              setIsBookingsCollapsed={setIsBookingsCollapsed}
              fetchActiveBookings={fetchActiveBookings}
              handleCancelDirectBooking={handleCancelDirectBooking}
              language={language}
            />
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: ŠTATISTIKY                                                  */}
        {/* ================================================================== */}
        {activeAdminTab === 'stats' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <AdminStatsSection
              totalClients={profiles.length}
              activeBookingsCount={activeBookings.length}
              totalStampsCount={totalStampsCount}
              estimatedRevenue={estimatedRevenue}
              language={language}
            />
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: RECENZIE                                                    */}
        {/* ================================================================== */}
        {activeAdminTab === 'reviews' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <AdminReviewsSection language={language} />
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: DATABÁZA & MAZANIE PROFILOV                                 */}
        {/* ================================================================== */}
        {activeAdminTab === 'database' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <AdminDatabaseSection
              profiles={profiles}
              refreshProfiles={fetchProfiles}
              language={language}
            />
          </div>
        )}
      </div>

      <AddStampModal
        profile={stampProfile}
        onClose={() => setStampProfile(null)}
        onConfirm={handleAddStamp}
        stampPrice={stampPrice}
        setStampPrice={setStampPrice}
        stampError={stampError}
        activeStampsCount={stampProfile ? getActiveStamps(stampProfile).length : 0}
        maxStamps={10}
        language={language}
      />

      <GiveGiftModal
        profile={giftProfile}
        onClose={() => {
          setGiftProfile(null);
          setSelectedGift('');
          setCustomCode('');
          setGiftError('');
        }}
        onConfirm={sendGift}
        selectedGift={selectedGift}
        setSelectedGift={setSelectedGift}
        customCode={customCode}
        setCustomCode={setCustomCode}
        giftError={giftError}
        hasActiveGift={giftProfile ? getActiveGift(giftProfile) !== null : false}
        language={language}
      />

      <ClientHistoryModal
        profile={historyProfile}
        onClose={() => setHistoryProfile(null)}
        onRemoveStamp={handleRemoveStamp}
        language={language}
        getGiftLabel={getGiftLabel}
      />

      <ScanPriceModal
        isOpen={showScanPriceModal}
        onClose={() => {
          setShowScanPriceModal(false);
          setScanStampPrice('');
          setScanFlowError('');
        }}
        onConfirm={() => {
          const priceNum = parseFloat(scanStampPrice.replace(',', '.'));
          if (isNaN(priceNum) || priceNum <= 0) {
            setScanFlowError(language === 'sk' ? 'Zadajte platnú kladnú sumu.' : 'Enter a valid positive amount.');
            return;
          }
          setScanFlowError('');
          setShowScanPriceModal(false);
          setShowScannerCamera(true);
        }}
        scanStampPrice={scanStampPrice}
        setScanStampPrice={setScanStampPrice}
        scanFlowError={scanFlowError}
        language={language}
      />

      <CancelBookingModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          fetchActiveBookings();
        }}
        language={language}
      />

      {showScannerCamera && (
        <ScannerModal
          onScanSuccess={handleScanSuccess}
          onClose={() => {
            setShowScannerCamera(false);
            setShowScanPriceModal(true);
          }}
        />
      )}
    </main>
  );
}