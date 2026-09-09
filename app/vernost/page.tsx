'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import BadgesGrid from '../components/BadgesGrid';
import QrCodeGenerator from '../components/QrCodeGenerator';
import { useLanguage } from '../lib/LanguageContext';
import { useTheme } from '../lib/ThemeContext';
import { LoyaltyPageSkeleton } from '../components/ui/Skeleton';
import LuckyWheelModal from '../components/LuckyWheelModal';
import { 
  QrCode, X, Gift, Sparkles, CheckCircle2, AlertCircle,
  Percent, Calendar, Tag, RotateCw, LogIn, ArrowRight
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  program_type: '5_stamps' | '10_stamps';
  avatar_icon: string | null;
  avatar_color: string | null;
  referral_code: string | null;
  referred_by: string | null;
  is_banned?: boolean;
}

interface ActiveGift {
  id: string;
  gift_type: string;
  custom_code?: string | null;
  referred_user_id?: string | null;
  created_at: string;
}

interface ReferredPerson {
  id: string;
  full_name: string | null;
  email: string;
  hasMassage: boolean;
}

const GIFT_LABELS: Record<string, { sk: string; en: string }> = {
  discount_code: { sk: 'Zľavový kód na masáž', en: 'Discount Voucher' },
  next_visit_gift: { sk: 'Darček k masáži', en: 'Complimentary Gift' },
  vip_upgrade: { sk: 'VIP Upgrade za cenu Klasik', en: 'VIP Upgrade for Classic Price' },
  free_stamp: { sk: 'Bonusová pečiatka do karty', en: 'Bonus Stamp in Card' },
};

export default function VernostPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { theme } = useTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activePrices, setActivePrices] = useState<number[]>([]);
  const [activeGifts, setActiveGifts] = useState<ActiveGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);

  const [referredPeople, setReferredPeople] = useState<ReferredPerson[]>([]);
  const [revealedGiftStates, setRevealedGiftStates] = useState<Record<string, { status: 'ineligible' | 'revealed'; code?: string; name?: string }>>({});

  const loadLoyaltyData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    let { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, program_type, avatar_icon, avatar_color, referral_code, referred_by, is_banned')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileErr || !profileData) {
      const { data: fallbackData } = await supabase
        .from('profiles')
        .select('id, full_name, email, program_type, avatar_icon, avatar_color, referral_code, referred_by')
        .eq('id', session.user.id)
        .maybeSingle();
      profileData = fallbackData ? { ...fallbackData, is_banned: false } : null;
    }

    if (!profileData) {
      setLoading(false);
      return;
    }
    setProfile(profileData);

    const { data: stampsData } = await supabase
      .from('stamps')
      .select('price')
      .eq('user_id', session.user.id)
      .eq('claimed', false)
      .is('removed_at', null)
      .order('created_at', { ascending: true });

    setActivePrices((stampsData || []).map((s) => Number(s.price)));

    const { data: giftsData } = await supabase
      .from('gifts')
      .select('id, gift_type, custom_code, referred_user_id, created_at')
      .eq('user_id', session.user.id)
      .eq('used', false)
      .order('created_at', { ascending: false });

    if (giftsData) {
      setActiveGifts(giftsData);
    }

    const { data: referredRaw } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('referred_by', session.user.id);

    if (referredRaw && referredRaw.length > 0) {
      const ids = referredRaw.map((r) => r.id);
      const { data: massageChecks } = await supabase.rpc('check_referred_massages', {
        user_ids: ids,
      });
      const withMassage = new Set(
        (massageChecks || []).filter((m: any) => m.has_massage).map((m: any) => m.user_id)
      );

      setReferredPeople(
        referredRaw.map((r) => ({
          ...r,
          hasMassage: withMassage.has(r.id),
        }))
      );
    }

    setLoading(false);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadLoyaltyData();
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    loadLoyaltyData();

    const handleUpdate = () => loadLoyaltyData();
    window.addEventListener('profileUpdated', handleUpdate);
    return () => window.removeEventListener('profileUpdated', handleUpdate);
  }, []);

  const handleClaimReferralGift = (gift: ActiveGift) => {
    const referredPerson = referredPeople.find((r) => r.id === gift.referred_user_id);

    if (referredPerson && referredPerson.hasMassage) {
      setRevealedGiftStates((prev) => ({
        ...prev,
        [gift.id]: { status: 'revealed', code: gift.custom_code || '' },
      }));
    } else {
      setRevealedGiftStates((prev) => ({
        ...prev,
        [gift.id]: {
          status: 'ineligible',
          name: referredPerson?.full_name || referredPerson?.email,
        },
      }));
    }
  };

  const getGiftLabel = (gift: ActiveGift) => {
    if (gift.gift_type === 'discount_code' && gift.custom_code) {
      return `${language === 'sk' ? 'Váš zľavový kód' : 'Your discount code'}: ${gift.custom_code}`;
    }
    const label = GIFT_LABELS[gift.gift_type];
    if (!label) return gift.gift_type;
    return language === 'sk' ? label.sk : label.en;
  };

  if (loading) {
    return <LoyaltyPageSkeleton />;
  }

  // Ak používateľ nie je prihlásený
  if (!profile) {
    return (
      <main className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 pt-6 pb-28 font-sans overflow-hidden text-[#1E293B] dark:text-[#DDE0F2]">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl space-y-6 text-center animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-[#6633EE] text-white mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(102,51,238,0.5)]">
            <Gift size={28} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[#0B0D22] dark:text-[#FFFFFF] tracking-tight">
              {language === 'sk' ? 'Vernostná karta' : 'Loyalty Card'}
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#C7CAE0] leading-relaxed px-2 font-normal">
              {language === 'sk'
                ? 'Pre zobrazenie vašej pečiatkovej karty, vernostných zliav a odznakov sa prosím prihláste.'
                : 'Please sign in to view your stamp card, loyalty rewards, and badges.'}
            </p>
          </div>

          <Link
            href="/login"
            className="w-full btn-primary text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <LogIn size={15} />
            <span>{language === 'sk' ? 'Prihlásiť sa' : 'Sign In'}</span>
          </Link>
        </div>
      </main>
    );
  }

  if (profile.is_banned) {
    return (
      <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center p-6 font-sans text-center text-[#1E293B] dark:text-[#DDE0F2]">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#FF5A7A]/30 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-[#FF5A7A]/15 text-[#FF5A7A] mx-auto flex items-center justify-center shadow-lg">
            <AlertCircle size={32} />
          </div>
          <h2 className="font-semibold text-xl text-[#0B0D22] dark:text-[#FFFFFF]">
            {language === 'sk' ? 'Účet bol zablokovaný' : 'Account Suspended'}
          </h2>
          <p className="text-sm text-[#64748B] dark:text-[#C7CAE0] leading-relaxed font-normal">
            {language === 'sk'
              ? 'Váš účet bol pozastavený. Z tohto dôvodu nemôžete využívať vernostnú kartu.'
              : 'Your account has been suspended. You cannot use the loyalty card.'}
          </p>
        </div>
      </main>
    );
  }

  const targetStampsCount = profile.program_type === '5_stamps' ? 5 : 10;
  const shouldShowDisclaimer = activePrices.length >= targetStampsCount;

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-6 pt-4 sm:pt-6 lg:pt-8 pb-28 gap-4 bg-transparent transition-colors duration-300 font-sans overflow-hidden text-[#1E293B] dark:text-[#DDE0F2]">
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col gap-4">

        {/* 1. VLASTNÁ PEČIATKOVÁ KARTA (MASSAGE REWARDS) S INTEGROVANÝMI TLAČIDLAMI */}
        <div className="relative group w-full flex justify-center">
          <Card
            fullName={profile.full_name || 'Vážený klient'}
            programType={profile.program_type}
            activeStampsPrices={activePrices}
            avatarColor={profile.avatar_color || '#A78BFA'}
            onOpenQr={() => setIsQrOpen(true)}
            onRefresh={handleManualRefresh}
            refreshing={refreshing}
          />
        </div>

        {/* AKTÍVNE DARČEKY & ZĽAVY */}
        {activeGifts.length > 0 && (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm dark:shadow-md space-y-2.5 text-left">
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-[#6633EE] dark:text-[#A78BFA]" />
              <h3 className="font-semibold text-xs text-[#0B0D22] dark:text-[#FFFFFF] uppercase tracking-wider">
                {language === 'sk' ? 'Dostupné odmeny & darčeky' : 'Available Rewards & Gifts'}
              </h3>
            </div>

            <div className="space-y-2">
              {activeGifts.map((gift) => {
                const state = revealedGiftStates[gift.id];
                return (
                  <div
                    key={gift.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#1E293B] dark:text-[#DDE0F2]">
                        {getGiftLabel(gift)}
                      </span>
                      {gift.referred_user_id && !state && (
                        <button
                          type="button"
                          onClick={() => handleClaimReferralGift(gift)}
                          className="px-2.5 py-1 rounded-full bg-[#6633EE] text-white text-[11px] font-semibold uppercase tracking-wider hover:bg-[#7C3AED] transition cursor-pointer shadow-sm"
                        >
                          {language === 'sk' ? 'Odomknúť' : 'Unlock'}
                        </button>
                      )}
                    </div>

                    {state?.status === 'revealed' && (
                      <div className="p-2 rounded-lg bg-[#6633EE]/15 border border-[#6633EE]/30 text-xs text-[#6633EE] dark:text-[#A78BFA] font-mono font-bold flex items-center justify-between">
                        <span>{language === 'sk' ? 'Váš kód:' : 'Your code:'} {state.code}</span>
                        <CheckCircle2 size={14} className="text-[#6633EE] dark:text-[#A78BFA]" />
                      </div>
                    )}

                    {state?.status === 'ineligible' && (
                      <div className="p-2 rounded-lg bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[11px] text-[#FF5A7A]">
                        {language === 'sk'
                          ? `Odporúčaný priateľ (${state.name}) ešte neabsolvoval svoju prvú masáž.`
                          : `The referred person (${state.name}) has not completed their first massage yet.`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. ODZNAKY (BADGES GRID) */}
        <div className="w-full">
          <BadgesGrid userId={profile.id} language={language} />
        </div>

      </div>

      {/* QR MODAL */}
      {isQrOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0D22]/60 dark:bg-[#010314]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xs p-6 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsQrOpen(false)}
              className="absolute top-4 right-4 text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-white transition cursor-pointer p-1"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-[#0B0D22] dark:text-[#FFFFFF]">
                {language === 'sk' ? 'Váš vernostný QR kód' : 'Your Loyalty QR Code'}
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 font-normal">
                {language === 'sk' ? 'Ukážte tento kód na recepcii' : 'Show this code at reception'}
              </p>
            </div>

            <div className="flex justify-center bg-white p-3 rounded-xl shadow-inner border border-slate-100 dark:border-transparent">
              <QrCodeGenerator profileId={profile.id} />
            </div>

            <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/50 font-mono break-all">
              ID: {profile.id}
            </p>
          </div>
        </div>
      )}

      {/* LUCKY WHEEL MODAL */}
      <LuckyWheelModal
        isOpen={isWheelOpen}
        onClose={() => setIsWheelOpen(false)}
        userId={profile?.id}
        language={language}
        onRewardClaimed={() => {
          loadLoyaltyData();
        }}
      />

    </main>
  );
}

