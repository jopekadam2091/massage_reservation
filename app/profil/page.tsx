'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import QrCodeGenerator from '../components/QrCodeGenerator';
import { useLanguage } from '../lib/LanguageContext';
import { useAvatar } from '../lib/AvatarContext';
import { 
  QrCode, X, Gift, Sparkles, CheckCircle2,
  User, Flower2, Leaf, Sparkles as SparklesIcon, Sun, Moon, 
  Heart, Feather, Droplets, Coffee, Cat, Star,
  Percent, Calendar, Clock, Tag
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

const ICON_MAP: Record<string, React.ElementType> = {
  User, Flower2, Leaf, Sparkles: SparklesIcon, Sun, Moon, 
  Heart, Feather, Droplets, Coffee, Cat, Star
};

const GIFT_LABELS: Record<string, { sk: string; en: string }> = {
  discount_code: { sk: 'Zľavový kód', en: 'Discount Code' },
  next_visit_gift: { sk: 'Darček pri ďalšej návšteve', en: 'Gift on your next visit' },
  vip_upgrade: { sk: 'VIP masáž za cenu Klasickej', en: 'VIP Massage for the price of Classic' }
};

export default function ProfilPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { avatarIcon, avatarColor } = useAvatar();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activePrices, setActivePrices] = useState<number[]>([]);
  const [activeGifts, setActiveGifts] = useState<ActiveGift[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQrOpen, setIsQrOpen] = useState(false);

  const [referredPeople, setReferredPeople] = useState<ReferredPerson[]>([]);
  const [revealedGiftStates, setRevealedGiftStates] = useState<Record<string, { status: 'ineligible' | 'revealed'; code?: string; name?: string }>>({});

  const formatFullDateText = (isoString: string) => {
    const d = new Date(isoString);
    const day = d.getDate();
    const monthSK = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
    const monthEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthText = language === 'sk' ? monthSK[d.getMonth()] : monthEN[d.getMonth()];
    return `${day}. ${monthText} ${d.getFullYear()}`;
  };

  const format24hTimeText = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, email, program_type, avatar_icon, avatar_color, referral_code, referred_by')
      .eq('id', session.user.id)
      .single();

    if (!profileData) {
      router.push('/login');
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

    try {
      const res = await fetch(`/api/user/appointments?email=${encodeURIComponent(profileData.email)}`);
      const data = await res.json();
      if (res.ok && data.bookings) {
        setUserBookings(data.bookings);
      }
    } catch (err) {
      console.error('Chyba pri načítaní rezervácií na profile:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProfile();

    const handleProfileUpdate = () => {
      loadProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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

  if (loading || !profile) {
    return (
      <main className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
        <p className="text-slate-500 dark:text-slate-400">{t.loading}</p>
      </main>
    );
  }

  const CurrentIconComponent = ICON_MAP[avatarIcon] || ICON_MAP['User'];
  const currentColor = avatarColor || '#10b981';

  const targetStampsCount = profile.program_type === '5_stamps' ? 5 : 10;
  const shouldShowDisclaimer = activePrices.length >= targetStampsCount;

  return (
    /* 🚀 OPRAVA MEDZERY: Zmeniť justify-center na justify-start a znížiť pt-4 */
    <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-start p-4 sm:p-6 pt-3 sm:pt-4 gap-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
      
      <div className="w-full max-w-sm flex flex-col gap-4">

        {/* KARTA AKTÍVNEJ NADCHÁDZAJÚCEJ REZERVÁCIE */}
        {userBookings.length > 0 && (
          <div className="p-4 rounded-3xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 shadow-sm text-left space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Calendar size={16} />
              <span>{language === 'sk' ? 'Vaša nadchádzajúca rezervácia' : 'Your upcoming appointment'}</span>
            </div>

            <div className="space-y-2">
              {userBookings.map((b) => (
                <div key={b.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Tag size={13} />
                      <span>{b.bookingRef ? `#${b.bookingRef}` : 'Rezervácia'}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-[10px] font-black flex items-center gap-1">
                      <Clock size={12} />
                      <span>{format24hTimeText(b.start)}</span>
                    </span>
                  </div>

                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {formatFullDateText(b.start)}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {b.summary.replace(/^REZERVÁCIA:\s*/i, '')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DYNAMICKÁ SEKCIA S AKTÍVNYMI DARČEKMI */}
        {activeGifts.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-purple-200 dark:border-purple-900/40 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent p-4 backdrop-blur-md shadow-sm text-left animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute -right-4 -top-4 text-purple-500/10 pointer-events-none select-none">
              <Gift size={90} />
            </div>

            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2.5">
              <Sparkles size={16} className="animate-pulse" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                {language === 'sk' ? 'Máte prekvapenie!' : 'You have a surprise!'}
              </h3>
            </div>

            <div className="space-y-2 relative z-10">
              {activeGifts.map((gift) => {
                if (gift.gift_type === 'referral_reward') {
                  const revealState = revealedGiftStates[gift.id];
                  const referredPerson = referredPeople.find((r) => r.id === gift.referred_user_id);

                  return (
                    <div
                      key={gift.id}
                      className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-purple-100/50 dark:border-purple-950 shadow-sm text-left space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Percent size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                            {language === 'sk' ? 'Referall zľava 10%' : 'Referral discount 10%'}
                          </p>
                          {referredPerson && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {language === 'sk' ? 'Za odporučenie: ' : 'For referring: '}
                              {referredPerson.full_name || referredPerson.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {!revealState && (
                        <button
                          onClick={() => handleClaimReferralGift(gift)}
                          className="w-full py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition active:scale-95 cursor-pointer"
                        >
                          {language === 'sk' ? 'Uplatniť zľavu' : 'Claim discount'}
                        </button>
                      )}

                      {revealState?.status === 'ineligible' && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2 leading-relaxed">
                          {language === 'sk'
                            ? `Zľavu zatiaľ nie je možné uplatniť — ${revealState.name || 'odporučaný klient'} ešte nemal prvú masáž.`
                            : `Discount not available yet — ${revealState.name || 'the referred client'} hasn't had their first massage yet.`}
                        </p>
                      )}

                      {revealState?.status === 'revealed' && (
                        <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide mb-0.5">
                            {language === 'sk' ? 'Tvoj kód' : 'Your code'}
                          </p>
                          <p className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300 tracking-widest">
                            {revealState.code}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div 
                    key={gift.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-purple-100/50 dark:border-purple-950 shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Gift size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                        {getGiftLabel(gift)}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full mt-0.5">
                        <CheckCircle2 size={10} />
                        {language === 'sk' ? 'Aktívne na salóne' : 'Active at salon'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* --- PANEL POUŽÍVATEĽA --- */}
        <div className="w-full flex items-center justify-between px-1">
          <button 
            onClick={() => setIsQrOpen(true)}
            className="active:scale-95 transition-all p-2 bg-transparent shrink-0 hover:opacity-80 cursor-pointer"
            style={{ color: currentColor }}
            aria-label="Zobraziť QR kód"
          >
            <QrCode size={24} className="transition-colors duration-300" />
          </button>

          <div className="flex items-center gap-3 overflow-hidden">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shrink-0 shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300"
              style={{ color: currentColor }}
            >
              <CurrentIconComponent size={26} strokeWidth={1.8} />
            </div>
            
            <div className="text-left min-w-0 flex flex-col justify-center">
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate leading-tight">
                {profile.full_name || t.guest}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="w-9" />
        </div>

        {/* VERNOSTNÁ KARTA S PEČIATKAMI */}
        <Card
          fullName={profile.full_name || t.guest}
          programType={profile.program_type}
          activeStampsPrices={activePrices}
          avatarColor={currentColor}
        />

        {shouldShowDisclaimer && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-400 shadow-sm text-left space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="font-semibold text-center">{t.discountDisclaimer}</p>
            <ul className="list-disc pl-4 space-y-1.5 leading-relaxed opacity-90">
              <li>{t.discountRule1}</li>
              <li>{t.discountRule2}</li>
              <li>{t.discountRule3}</li>
            </ul>
          </div>
        )}
        
      </div>
      
      <button onClick={handleLogout} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:underline transition mt-2 cursor-pointer">
        {t.logout}
      </button>

      {/* MODAL 1: Zväčšený QR kód */}
      {isQrOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 transition-opacity duration-300"
          onClick={() => setIsQrOpen(false)}
        >
          <div 
            className="w-full max-w-xs p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-75 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.loyaltyCode}</span>
              <button onClick={() => setIsQrOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
              <QrCodeGenerator profileId={profile.id} />
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 px-2">
              {t.scanHint}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}