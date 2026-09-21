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

import { Users, Search, Camera, CheckCircle, Calendar, CalendarX, RotateCw, Coins, MessageSquare, Database, Sparkles, Power, Menu, X, ShieldCheck, ChevronRight, ChevronDown, LogOut, User, QrCode } from 'lucide-react';

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
  const [focusedReferrerId, setFocusedReferrerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Aktívny admin tab & Hamburger menu
  const [activeAdminTab, setActiveAdminTab] = useState<'clients' | 'bookings' | 'wheel' | 'stats' | 'reviews' | 'database'>('clients');
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  // Stav Kolesa Šťastia (Globálne nastavenie)
  const [luckyWheelEnabled, setLuckyWheelEnabled] = useState<boolean>(true);
  const [updatingWheel, setUpdatingWheel] = useState(false);
  const [wheelMaintenanceMsgSk, setWheelMaintenanceMsgSk] = useState('');
  const [wheelMaintenanceMsgEn, setWheelMaintenanceMsgEn] = useState('');
  const [savingWheelMsg, setSavingWheelMsg] = useState(false);
  const [wheelSaveSuccess, setWheelSaveSuccess] = useState(false);

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

    const handleOpenDrawer = () => setIsAdminMenuOpen(true);
    window.addEventListener('open_admin_drawer', handleOpenDrawer);

    if (typeof window !== 'undefined' && window.location.search.includes('openMenu=true')) {
      setIsAdminMenuOpen(true);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('open_admin_drawer', handleOpenDrawer);
    };
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
        if (data.settings.maintenance_message_sk) {
          setWheelMaintenanceMsgSk(data.settings.maintenance_message_sk);
        }
        if (data.settings.maintenance_message_en) {
          setWheelMaintenanceMsgEn(data.settings.maintenance_message_en);
        }
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

  const handleSaveWheelMessage = async () => {
    setSavingWheelMsg(true);
    setWheelSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenance_message_sk: wheelMaintenanceMsgSk,
          maintenance_message_en: wheelMaintenanceMsgEn,
        }),
      });
      if (res.ok) {
        setWheelSaveSuccess(true);
        setTimeout(() => setWheelSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Chyba ukladania správy kolesa:', err);
      alert(language === 'sk' ? 'Chyba pri ukladaní správy.' : 'Error saving message.');
    } finally {
      setSavingWheelMsg(false);
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

  const handleLogout = async () => {
    if (!confirm(language === 'sk' ? 'Naozaj sa chcete odhlásiť z administrácie?' : 'Do you really want to sign out?')) return;
    try {
      sessionStorage.removeItem('admin_2fa_verified');
      sessionStorage.removeItem('admin_verified_token');
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      router.push('/login');
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

  const clientProfiles = useMemo(() => {
    return profiles.filter((p) => p.role !== 'admin');
  }, [profiles]);

  const profilesWithBookings = useMemo(() => {
    return clientProfiles.map((p) => {
      const latest = findLatestBookingForUser(p, activeBookings);
      return {
        ...p,
        latestBooking: latest,
      };
    });
  }, [clientProfiles, activeBookings]);

  const sortedAndFilteredProfiles = useMemo(() => {
    // Ak je zvolený konkrétny odporúčateľ, zobrazíme iba jeho profil
    if (focusedReferrerId) {
      return profilesWithBookings.filter(p => p.id === focusedReferrerId);
    }

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
  }, [profilesWithBookings, searchQuery, clientSortBy, registrationFilter, focusedReferrerId]);

  const totalStampsCount = clientProfiles.reduce((sum, p) => sum + p.stamps.length, 0);
  const estimatedRevenue = activeBookings.reduce((sum, b) => {
    const priceMatch = (b.description || '').match(/Finálna cena:\s*(\d+)€/i);
    return sum + (priceMatch ? parseInt(priceMatch[1], 10) : 45);
  }, 0);

  if (loading) {
    return (
      <main className="flex min-h-screen pt-[calc(env(safe-area-inset-top,16px)+4.5rem)] sm:pt-24 items-center justify-center bg-[#F4F6FB] dark:bg-[#010314] text-[#0B0D22] dark:text-[#FFFFFF] font-sans">
        <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60 font-medium">{language === 'sk' ? 'Načítavam admin panel...' : 'Loading admin panel...'}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-[calc(env(safe-area-inset-top,16px)+4.5rem)] sm:pt-24 pb-12 sm:pb-16 bg-[#F4F6FB] dark:bg-[#010314] text-[#0B0D22] dark:text-[#FFFFFF] transition-colors duration-300 p-4 sm:p-6 font-sans">
      {scanSuccessMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#10B981] text-white text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle size={16} />
          {scanSuccessMsg}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* Hlavička Admina: Vľavo Administrácia a sekcia, Vpravo Naskenovať (QR) a Hamburger Menu */}
        <div className="flex flex-row justify-between items-center bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] p-3.5 sm:p-4 rounded-2xl shadow-sm gap-3">
          
          {/* VĽAVO: Administrácia & aktuálna vybratá sekcia */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#6633EE]/10 dark:bg-[#6633EE]/20 border border-[#6633EE]/25 flex items-center justify-center text-[#6633EE] dark:text-[#A78BFA] shrink-0 shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C7CAE0]/60 block leading-tight">
                {language === 'sk' ? 'Administrácia' : 'Administration'}
              </span>
              <div className="text-xs sm:text-sm font-bold text-[#0B0D22] dark:text-[#FFFFFF] flex items-center gap-1.5 truncate mt-0.5">
                {activeAdminTab === 'clients' && <><Users size={15} className="text-[#6633EE] shrink-0" /><span>{language === 'sk' ? `Klienti (${clientProfiles.length})` : `Clients (${clientProfiles.length})`}</span></>}
                {activeAdminTab === 'bookings' && <><Calendar size={15} className="text-[#6633EE] shrink-0" /><span>{language === 'sk' ? `Rezervácie (${activeBookings.length})` : `Bookings (${activeBookings.length})`}</span></>}
                {activeAdminTab === 'wheel' && <><Sparkles size={15} className="text-amber-500 shrink-0" /><span>{language === 'sk' ? 'Maintenance kolesa' : 'Wheel Maintenance'}</span></>}
                {activeAdminTab === 'stats' && <><Coins size={15} className="text-emerald-500 shrink-0" /><span>{language === 'sk' ? 'Štatistiky' : 'Statistics'}</span></>}
                {activeAdminTab === 'reviews' && <><MessageSquare size={15} className="text-blue-500 shrink-0" /><span>{language === 'sk' ? 'Recenzie' : 'Reviews'}</span></>}
                {activeAdminTab === 'database' && <><Database size={15} className="text-rose-500 shrink-0" /><span>{language === 'sk' ? 'Databáza' : 'Database'}</span></>}
              </div>
            </div>
          </div>

          {/* VPRAVO: Iba Naskenovať QR kód */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setScanStampPrice('');
                setScanFlowError('');
                setShowScanPriceModal(true);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 rounded-xl bg-[#6633EE] hover:bg-[#5324d6] text-white font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
              title={language === 'sk' ? 'Naskenovať QR kód klienta' : 'Scan client QR code'}
            >
              <QrCode size={17} />
              <span>{language === 'sk' ? 'Naskenovať' : 'Scan'}</span>
            </button>
          </div>
        </div>

        {/* 🍔 HAMBURGER MENU DRAWER / MODAL PRE ADMINA */}
        {isAdminMenuOpen && (
          <div 
            className="fixed inset-0 z-[70] flex items-start sm:items-center justify-start bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4" 
            onClick={() => setIsAdminMenuOpen(false)}
          >
            <div 
              className="w-full max-w-sm h-full sm:h-auto sm:max-h-[92vh] bg-white dark:bg-[#0B0D22] border-r sm:border border-[#E2E8F0] dark:border-[#2B2F49] sm:rounded-3xl shadow-2xl p-5 sm:p-6 overflow-y-auto space-y-4 text-left flex flex-col justify-between animate-in slide-in-from-left duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                {/* Hlavička menu */}
                <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2B2F49] pb-3.5 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#6633EE]/15 border border-[#6633EE]/30 text-[#6633EE] dark:text-[#A78BFA] flex items-center justify-center shadow-xs">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-[#0B0D22] dark:text-[#FFFFFF] leading-tight">
                        {language === 'sk' ? 'Administrácia' : 'Administration'}
                      </h2>
                      <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/60">
                        {language === 'sk' ? 'Výber sekcie portálu' : 'Select admin section'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAdminMenuOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#010314] text-[#64748B] hover:text-[#0B0D22] dark:hover:text-white transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Rýchle akcie v menu: Obnoviť dáta & Storno rezervácie */}
                <div className="grid grid-cols-2 gap-2 pb-3 mb-3 border-b border-[#E2E8F0] dark:border-[#2B2F49]">
                  <button
                    type="button"
                    onClick={async () => {
                      await refreshAllAdminData();
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#010314] dark:hover:bg-[#0B0D22] text-[#1E293B] dark:text-[#DDE0F2] font-semibold text-xs border border-[#E2E8F0] dark:border-[#2B2F49] transition active:scale-95 shadow-xs cursor-pointer"
                    title={language === 'sk' ? 'Obnoviť všetky dáta administrácie' : 'Refresh all data'}
                  >
                    <RotateCw size={14} className={loadingBookings ? 'animate-spin text-[#6633EE]' : ''} />
                    <span>{language === 'sk' ? 'Obnoviť' : 'Refresh'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      setShowCancelModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-[#FF5A7A]/15 dark:hover:bg-[#FF5A7A]/25 text-rose-600 dark:text-[#FF5A7A] font-semibold text-xs border border-rose-200 dark:border-[#FF5A7A]/30 transition active:scale-95 shadow-xs cursor-pointer relative"
                    title={language === 'sk' ? 'Storno rezervácie' : 'Cancel booking'}
                  >
                    <CalendarX size={14} />
                    <span>{language === 'sk' ? 'Storno' : 'Cancel'}</span>
                    {pendingStornoRequests.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white animate-pulse">
                        {pendingStornoRequests.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Zoznam sekcií */}
                <div className="space-y-2">
                  {/* 1. Klienti */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdminTab('clients');
                      setIsAdminMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      activeAdminTab === 'clients'
                        ? 'bg-[#6633EE]/10 border-[#6633EE] text-[#6633EE] dark:text-[#A78BFA] shadow-xs'
                        : 'bg-slate-50/70 dark:bg-[#010314]/50 border-transparent hover:border-[#E2E8F0] dark:hover:border-[#2B2F49] text-[#1E293B] dark:text-[#DDE0F2]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${activeAdminTab === 'clients' ? 'bg-[#6633EE] text-white' : 'bg-slate-200 dark:bg-[#2B2F49] text-[#64748B] dark:text-[#C7CAE0]'}`}>
                        <Users size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs">Klienti</p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 truncate">Správa kariet, pečiatok a darčekov</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-200 dark:bg-[#2B2F49] text-[#64748B] dark:text-[#C7CAE0] shrink-0">
                      {clientProfiles.length}
                    </span>
                  </button>

                  {/* 2. Rezervácie */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdminTab('bookings');
                      setIsAdminMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      activeAdminTab === 'bookings'
                        ? 'bg-[#6633EE]/10 border-[#6633EE] text-[#6633EE] dark:text-[#A78BFA] shadow-xs'
                        : 'bg-slate-50/70 dark:bg-[#010314]/50 border-transparent hover:border-[#E2E8F0] dark:hover:border-[#2B2F49] text-[#1E293B] dark:text-[#DDE0F2]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${activeAdminTab === 'bookings' ? 'bg-[#6633EE] text-white' : 'bg-slate-200 dark:bg-[#2B2F49] text-[#64748B] dark:text-[#C7CAE0]'}`}>
                        <Calendar size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs">Rezervácie</p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 truncate">Termíny a storno žiadosti</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {pendingStornoRequests.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-500 text-white animate-pulse">
                          {pendingStornoRequests.length}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-200 dark:bg-[#2B2F49] text-[#64748B] dark:text-[#C7CAE0]">
                        {activeBookings.length}
                      </span>
                    </div>
                  </button>

                  {/* 3. Maintenance kolesa */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdminTab('wheel');
                      setIsAdminMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      activeAdminTab === 'wheel'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-[#010314]/50 border-transparent hover:border-[#E2E8F0] dark:hover:border-[#2B2F49] text-[#1E293B] dark:text-[#DDE0F2]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${activeAdminTab === 'wheel' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-[#2B2F49] text-[#64748B] dark:text-[#C7CAE0]'}`}>
                        <Sparkles size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs">Maintenance kolesa</p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 truncate">Režim údržby a oznam pre klientov</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      luckyWheelEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    }`}>
                      {luckyWheelEnabled ? 'Aktívne' : 'Údržba'}
                    </span>
                  </button>

                  {/* 4. Štatistiky */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdminTab('stats');
                      setIsAdminMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      activeAdminTab === 'stats'
                        ? 'bg-[#6633EE]/10 border-[#6633EE] text-[#6633EE] dark:text-[#A78BFA] shadow-xs'
                        : 'bg-slate-50/70 dark:bg-[#010314]/50 border-transparent hover:border-[#E2E8F0] dark:hover:border-[#2B2F49] text-[#1E293B] dark:text-[#DDE0F2]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${activeAdminTab === 'stats' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-[#2B2F49] text-[#64748B] dark:text-[#C7CAE0]'}`}>
                        <Coins size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs">Štatistiky</p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 truncate">Tržby, pečiatky a prehľady</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[#64748B] opacity-60" />
                  </button>

                  {/* 5. Recenzie */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdminTab('reviews');
                      setIsAdminMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      activeAdminTab === 'reviews'
                        ? 'bg-[#6633EE]/10 border-[#6633EE] text-[#6633EE] dark:text-[#A78BFA] shadow-xs'
                        : 'bg-slate-50/70 dark:bg-[#010314]/50 border-transparent hover:border-[#E2E8F0] dark:hover:border-[#2B2F49] text-[#1E293B] dark:text-[#DDE0F2]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${activeAdminTab === 'reviews' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-[#2B2F49] text-[#64748B] dark:text-[#C7CAE0]'}`}>
                        <MessageSquare size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs">Recenzie</p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 truncate">Hodnotenia a komentáre klientov</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[#64748B] opacity-60" />
                  </button>

                  {/* 6. Databáza */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdminTab('database');
                      setIsAdminMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      activeAdminTab === 'database'
                        ? 'bg-[#6633EE]/10 border-[#6633EE] text-[#6633EE] dark:text-[#A78BFA] shadow-xs'
                        : 'bg-slate-50/70 dark:bg-[#010314]/50 border-transparent hover:border-[#E2E8F0] dark:hover:border-[#2B2F49] text-[#1E293B] dark:text-[#DDE0F2]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${activeAdminTab === 'database' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-[#2B2F49] text-[#64748B] dark:text-[#C7CAE0]'}`}>
                        <Database size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs">Databáza</p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 truncate">Používatelia, mazanie a história</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[#64748B] opacity-60" />
                  </button>
                </div>
              </div>

              {/* Rýchle navigačné odkazy v pätičke menu */}
              <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#2B2F49] mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminMenuOpen(false);
                    router.push('/');
                  }}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#010314] dark:hover:bg-[#0B0D22] text-[#0B0D22] dark:text-[#FFFFFF] text-xs font-semibold transition cursor-pointer border border-[#E2E8F0] dark:border-[#2B2F49]"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#6633EE]" />
                    <span>{language === 'sk' ? 'Booking Slots kalendár' : 'Booking Slots calendar'}</span>
                  </div>
                  <ChevronRight size={13} className="opacity-50" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAdminMenuOpen(false);
                    router.push('/profil');
                  }}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#010314] dark:hover:bg-[#0B0D22] text-[#0B0D22] dark:text-[#FFFFFF] text-xs font-semibold transition cursor-pointer border border-[#E2E8F0] dark:border-[#2B2F49]"
                >
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-[#6633EE]" />
                    <span>{language === 'sk' ? 'Môj Profil & Ranking' : 'My Profile & Ranking'}</span>
                  </div>
                  <ChevronRight size={13} className="opacity-50" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAdminMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-semibold transition cursor-pointer border border-rose-200 dark:border-rose-900/40"
                >
                  <LogOut size={14} />
                  <span>{language === 'sk' ? 'Odhlásiť sa z administrácie' : 'Sign out'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (focusedReferrerId) setFocusedReferrerId(null);
                }}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-white dark:bg-[#0B0D22] text-[#0B0D22] dark:text-[#FFFFFF] placeholder-[#94A3B8] dark:placeholder-[#C7CAE0]/40 focus:outline-none focus:border-[#6633EE] focus:ring-2 focus:ring-[#6633EE]/20 shadow-xs transition text-xs font-medium"
              />
            </div>

            {/* SEKCIA NÁJDENÝCH KLIENTOV */}
            <ClientListSection
              filteredProfiles={sortedAndFilteredProfiles}
              totalProfilesCount={clientProfiles.length}
              clientSortBy={clientSortBy}
              setClientSortBy={setClientSortBy}
              registrationFilter={registrationFilter}
              setRegistrationFilter={setRegistrationFilter}
              focusedReferrerId={focusedReferrerId}
              setFocusedReferrerId={setFocusedReferrerId}
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
              onRemoveStamp={handleRemoveStamp}
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
        {/* TAB 3: MAINTENANCE KOLESA ŠŤASTIA                                  */}
        {/* ================================================================== */}
        {activeAdminTab === 'wheel' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm space-y-5 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] dark:border-[#2B2F49] pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${
                    luckyWheelEnabled
                      ? 'bg-purple-50 dark:bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] border-[#6633EE]/30'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                  }`}>
                    <Sparkles size={22} className={luckyWheelEnabled ? '' : 'animate-pulse'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-base sm:text-lg text-[#0B0D22] dark:text-white">
                        {language === 'sk' ? 'Koleso Šťastia pre klientov' : 'Client Wheel of Fortune'}
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        luckyWheelEnabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      }`}>
                        {luckyWheelEnabled
                          ? (language === 'sk' ? 'Aktívne' : 'Active')
                          : (language === 'sk' ? 'V rekonštrukcii' : 'Under Maintenance')}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/70 mt-0.5">
                      {language === 'sk' 
                        ? 'Globálne zapnutie alebo dočasné vypnutie kolesa šťastia v klientskej zóne' 
                        : 'Global toggle of the Lucky Wheel availability for clients'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleLuckyWheel}
                  disabled={updatingWheel}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-50 border shadow-sm ${
                    luckyWheelEnabled
                      ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  }`}
                >
                  <Power size={15} />
                  <span>
                    {updatingWheel
                      ? (language === 'sk' ? 'Ukladám zmenu...' : 'Saving...')
                      : luckyWheelEnabled
                      ? (language === 'sk' ? 'Prepnúť do rekonštrukcie' : 'Set to Maintenance')
                      : (language === 'sk' ? 'Zapnúť koleso pre klientov' : 'Enable Wheel')}
                  </span>
                </button>
              </div>

              {/* Popis stavu pre admina */}
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                luckyWheelEnabled
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200'
              }`}>
                <p className="font-semibold mb-1">
                  {luckyWheelEnabled 
                    ? (language === 'sk' ? '✅ Koleso je momentálne plne funkčné' : '✅ Wheel is currently active')
                    : (language === 'sk' ? '⚠️ Koleso je momentálne v stave údržby' : '⚠️ Wheel is currently under maintenance')}
                </p>
                <p>
                  {luckyWheelEnabled
                    ? (language === 'sk' 
                        ? 'Prihlásení klienti môžu vo svojom profile točiť Kolesom šťastia a vyhrávať pečiatky, darčeky alebo zľavové kódy na ďalšiu masáž.' 
                        : 'Clients can spin the wheel in their profile and win stamps, gifts or discounts.')
                    : (language === 'sk'
                        ? 'Prihláseným klientom sa pri pokuse o točenie zobrazuje oznam o prebiehajúcej rekonštrukcii s informáciou, že pripravujete nové odmeny.'
                        : 'Clients see a maintenance notification stating that new features and rewards are coming soon.')}
                </p>
              </div>

              {/* Správa pre klientov počas rekonštrukcie */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#64748B] dark:text-[#C7CAE0]/60">
                  {language === 'sk' ? 'Oznam zobrazený klientom počas údržby' : 'Client maintenance notice text'}
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0B0D22] dark:text-white block">
                    {language === 'sk' ? 'Text oznamu (Slovenčina):' : 'Notice text (Slovak):'}
                  </label>
                  <textarea
                    value={wheelMaintenanceMsgSk}
                    onChange={(e) => setWheelMaintenanceMsgSk(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-2xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50 dark:bg-[#010314] text-xs text-[#0B0D22] dark:text-white focus:outline-none focus:border-[#6633EE]"
                    placeholder="Zadajte text oznamu..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0B0D22] dark:text-white block">
                    {language === 'sk' ? 'Text oznamu (Angličtina):' : 'Notice text (English):'}
                  </label>
                  <textarea
                    value={wheelMaintenanceMsgEn}
                    onChange={(e) => setWheelMaintenanceMsgEn(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-2xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50 dark:bg-[#010314] text-xs text-[#0B0D22] dark:text-white focus:outline-none focus:border-[#6633EE]"
                    placeholder="Enter notice text in English..."
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {wheelSaveSuccess ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      <span>{language === 'sk' ? 'Oznam bol úspešne uložený!' : 'Notice saved successfully!'}</span>
                    </span>
                  ) : (
                    <span />
                  )}

                  <button
                    type="button"
                    onClick={handleSaveWheelMessage}
                    disabled={savingWheelMsg}
                    className="px-4 py-2 rounded-xl bg-[#6633EE] hover:bg-[#5324d6] text-white text-xs font-semibold transition cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {savingWheelMsg 
                      ? (language === 'sk' ? 'Ukladám...' : 'Saving...') 
                      : (language === 'sk' ? 'Uložiť texty oznamu' : 'Save Notice Texts')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: ŠTATISTIKY                                                  */}
        {/* ================================================================== */}
        {activeAdminTab === 'stats' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <AdminStatsSection
              totalClients={clientProfiles.length}
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