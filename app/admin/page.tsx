'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { Profile, StampRecord, GiftRecord } from '@/app/types';

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

import { Users, Search, Camera, CheckCircle, CalendarX, RotateCw } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [pendingStornoRequests, setPendingStornoRequests] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Zabaľovanie panelov
  const [isBookingsCollapsed, setIsBookingsCollapsed] = useState(false);
  const [isClientsCollapsed, setIsClientsCollapsed] = useState(true);

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
    const maxStamps = stampProfile.program_type === '5_stamps' ? 5 : 10;

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
    const maxStamps = foundProfile.program_type === '5_stamps' ? 5 : 10;

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

  const filteredProfiles = profiles.filter(p => 
    (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStampsCount = profiles.reduce((sum, p) => sum + p.stamps.length, 0);
  const estimatedRevenue = activeBookings.reduce((sum, b) => {
    const priceMatch = (b.description || '').match(/Finálna cena:\s*(\d+)€/i);
    return sum + (priceMatch ? parseInt(priceMatch[1], 10) : 45);
  }, 0);

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">{t.loading}...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-slate-50 dark:bg-zinc-900 transition-colors duration-300 p-4 sm:p-8 font-sans">
      {scanSuccessMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-semibold shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle size={16} />
          {scanSuccessMsg}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Hlavička Admina */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Users size={20} />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">
                {language === 'sk' ? 'Administrácia salónu' : 'Salon Management'}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {language === 'sk' ? 'Správa vernostných kariet a rezervácií' : 'Loyalty cards & booking management'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 🚀 NOVÉ: TLAČIDLO OBNOVIŤ V HLAVIČKE ADMINA */}
            <button
              type="button"
              onClick={refreshAllAdminData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 shadow-sm cursor-pointer"
              title={language === 'sk' ? 'Obnoviť dáta' : 'Refresh data'}
            >
              <RotateCw size={14} className={loadingBookings ? 'animate-spin' : ''} />
              <span>{language === 'sk' ? 'Obnoviť' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition active:scale-95 shadow-sm cursor-pointer"
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Camera size={14} />
              {language === 'sk' ? 'Naskenovať' : 'Scan'}
            </button>
          </div>
        </div>

        {/* ADMIN ŠTATISTIKY */}
        <AdminStatsSection
          totalClients={profiles.length}
          activeBookingsCount={activeBookings.length}
          totalStampsCount={totalStampsCount}
          estimatedRevenue={estimatedRevenue}
          language={language}
        />

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

        {/* Vyhľadávanie v klientoch */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder={language === 'sk' ? 'Vyhľadať klienta podľa mena alebo e-mailu...' : 'Search client by name or email...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition"
          />
        </div>

        {/* SEKCIA NÁJDENÝCH KLIENTOV */}
        <ClientListSection
          filteredProfiles={filteredProfiles}
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

      <AddStampModal
        profile={stampProfile}
        onClose={() => setStampProfile(null)}
        onConfirm={handleAddStamp}
        stampPrice={stampPrice}
        setStampPrice={setStampPrice}
        stampError={stampError}
        activeStampsCount={stampProfile ? getActiveStamps(stampProfile).length : 0}
        maxStamps={stampProfile?.program_type === '5_stamps' ? 5 : 10}
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