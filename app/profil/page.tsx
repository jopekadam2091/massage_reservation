'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import SettingsModal from '../components/SettingsModal';
import CancelRequestModal from '../components/admin/CancelRequestModal';
import { useLanguage } from '../lib/LanguageContext';
import { useTheme } from '../lib/ThemeContext';
import { useAvatar } from '../lib/AvatarContext';
import { ProfilePageSkeleton } from '../components/ui/Skeleton';
import LuckyWheelModal from '../components/LuckyWheelModal';
import { 
  User, Flower2, Leaf, Sparkles as SparklesIcon, Sun, Moon, 
  Heart, Feather, Droplets, Coffee, Cat, Star,
  Settings, LogOut, History, Calendar, Clock, Tag, Plus,
  CalendarX, CheckCircle2, AlertCircle, Sparkles, ChevronRight, ShieldCheck
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role?: string;
  avatar_icon: string | null;
  avatar_color: string | null;
  referral_code: string | null;
  referred_by: string | null;
  is_banned?: boolean;
}

interface Stamp {
  id: string;
  price: number;
  claimed: boolean;
  created_at: string;
  claimed_at: string | null;
}

interface GiftRecord {
  id: string;
  gift_type: string;
  custom_code: string | null;
  used: boolean;
  created_at: string;
}

interface ClientRankingItem {
  id: string;
  full_name: string | null;
  email: string;
  role?: string;
  program_type?: string;
  visitsCount: number;
  totalSpent: number;
  averageSpent: number;
  claimedRewardsCount: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  User, Flower2, Leaf, Sparkles: SparklesIcon, Sun, Moon, 
  Heart, Feather, Droplets, Coffee, Cat, Star
};

export default function ProfilPage() {
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { avatarIcon } = useAvatar();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [gifts, setGifts] = useState<GiftRecord[]>([]);

  // Admin špecifické stavy (Ranking)
  const [clientRankings, setClientRankings] = useState<ClientRankingItem[]>([]);
  const [rankingSortBy, setRankingSortBy] = useState<'visits' | 'spent'>('visits');

  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

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

  const loadProfileData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    let { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_icon, avatar_color, referral_code, referred_by, is_banned')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profileData) {
      const { data: fallback } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_icon, avatar_color, referral_code, referred_by')
        .eq('id', session.user.id)
        .maybeSingle();
      profileData = fallback ? { ...fallback, is_banned: false } : null;
    }

    if (!profileData) {
      router.push('/login');
      return;
    }
    setProfile(profileData);

    const isAdmin = profileData.role === 'admin';

    if (isAdmin) {
      // 🚀 AK JE ADMIN: Načítame všetkých klientov pre štatistický Ranking & Leaderboard
      try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (res.ok && data.users) {
          const formattedRankings: ClientRankingItem[] = data.users
            .filter((u: any) => u.role !== 'admin') // nezaradzujeme admin účet do rebríčka klientov
            .map((u: any) => {
              const activeStamps = (u.stamps || []).filter((s: any) => !s.removed_at);
              const visits = activeStamps.length;
              const spent = activeStamps.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);
              const avg = visits > 0 ? spent / visits : 0;
              const claimed = (u.stamps || []).filter((s: any) => s.claimed).length;

              return {
                id: u.id,
                full_name: u.full_name,
                email: u.email,
                role: u.role,
                program_type: u.program_type,
                visitsCount: visits,
                totalSpent: spent,
                averageSpent: avg,
                claimedRewardsCount: claimed,
              };
            });

          setClientRankings(formattedRankings);
        }
      } catch (err) {
        console.error('Chyba načítania rebríčka klientov pre admina:', err);
      }
    } else {
      // 🚀 AK JE KLIENT: Načítame jeho vlastné rezervácie a históriu masáží
      try {
        const res = await fetch(`/api/user/appointments?email=${encodeURIComponent(profileData.email)}`);
        const data = await res.json();
        if (res.ok && data.bookings) {
          setUserBookings(data.bookings);
        }
      } catch (err) {
        console.error('Chyba načítania rezervácií:', err);
      }

      try {
        const { data: stampsData } = await supabase
          .from('stamps')
          .select('id, price, claimed, created_at, claimed_at')
          .eq('user_id', session.user.id)
          .is('removed_at', null)
          .order('created_at', { ascending: false });

        if (stampsData) setStamps(stampsData);

        const { data: giftsData } = await supabase
          .from('gifts')
          .select('id, gift_type, custom_code, used, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (giftsData) setGifts(giftsData);
      } catch (err) {
        console.error('Chyba načítania histórie:', err);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProfileData();

    const handleUpdate = () => loadProfileData();
    window.addEventListener('profileUpdated', handleUpdate);
    return () => window.removeEventListener('profileUpdated', handleUpdate);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading || !profile) {
    return <ProfilePageSkeleton />;
  }

  const CurrentIconComponent = ICON_MAP[avatarIcon] || ICON_MAP['User'];
  const isAdmin = profile.role === 'admin';

  // Zoradenie rebríčka pre admina
  const sortedRankings = [...clientRankings].sort((a, b) => {
    if (rankingSortBy === 'spent') {
      return b.totalSpent - a.totalSpent || b.visitsCount - a.visitsCount;
    }
    return b.visitsCount - a.visitsCount || b.totalSpent - a.totalSpent;
  });

  // Salónne metriky pre admina
  const totalSaloonMassages = clientRankings.reduce((sum, c) => sum + c.visitsCount, 0);
  const totalSaloonRevenue = clientRankings.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSaloonSpend = clientRankings.length > 0 ? (totalSaloonRevenue / clientRankings.length).toFixed(1) : '0';

  // Zoradenie záznamov histórie pre klienta (pečiatky + darčeky)
  type HistoryItem = { id: string; date: string; type: 'stamp' | 'gift'; data: any };
  const historyItems: HistoryItem[] = [];
  stamps.forEach((s) => historyItems.push({ id: `stamp-${s.id}`, date: s.created_at, type: 'stamp', data: s }));
  gifts.forEach((g) => historyItems.push({ id: `gift-${g.id}`, date: g.created_at, type: 'gift', data: g }));
  historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-6 pt-4 sm:pt-6 lg:pt-8 pb-28 gap-4 bg-transparent transition-colors duration-300 font-sans overflow-hidden text-[#1E293B] dark:text-[#DDE0F2]">
      <div className="relative z-10 w-full max-w-sm sm:max-w-xl flex flex-col gap-4">

        {/* ================================================================ */}
        {/* 1. HLAVIČKA PROFILU: AVATAR, MENO, EMAIL A TLAČIDLÁ              */}
        {/* ================================================================ */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm dark:shadow-md flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3.5 min-w-0">
            <button 
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-50 dark:bg-[#010314] text-[#6633EE] dark:text-[#A78BFA] shrink-0 border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE] transition cursor-pointer shadow-sm relative group"
              title={language === 'sk' ? 'Upraviť profil' : 'Edit profile'}
            >
              <CurrentIconComponent size={28} strokeWidth={1.8} />
              <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[#6633EE] text-white flex items-center justify-center shadow-xs">
                <Settings size={10} />
              </span>
            </button>
            
            <div className="min-w-0">
              <h2 className="font-semibold text-base sm:text-lg text-[#0B0D22] dark:text-[#FFFFFF] truncate tracking-tight">
                {profile.full_name || (isAdmin ? 'Administrátor salónu' : 'Vážený klient')}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/80 truncate font-normal">
                {profile.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6633EE]/15 border border-[#6633EE]/30 text-[#6633EE] dark:text-[#A78BFA] text-[10px] font-medium uppercase tracking-wider">
                  <ShieldCheck size={11} />
                  <span>{isAdmin ? 'Administrátor' : (language === 'sk' ? 'Overený účet' : 'Verified')}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-[#010314] text-[#0B0D22] dark:text-[#FFFFFF] hover:border-[#6633EE] border border-[#E2E8F0] dark:border-[#2B2F49] text-xs font-medium transition cursor-pointer shadow-xs"
            >
              <Settings size={13} className="text-[#6633EE] dark:text-[#A78BFA]" />
              <span>{language === 'sk' ? 'Nastavenia' : 'Settings'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF5A7A]/10 hover:bg-[#FF5A7A]/20 text-[#FF5A7A] border border-[#FF5A7A]/30 text-xs font-medium transition cursor-pointer"
            >
              <LogOut size={13} />
              <span>{language === 'sk' ? 'Odhlásiť' : 'Logout'}</span>
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* A. ADMIN MÓD: REBRÍČEK VERNOSTI A NAJČASTEJŠÍ NÁVŠTEVNÍCI        */}
        {/* ================================================================ */}
        {isAdmin ? (
          <div className="space-y-4">
            
            {/* Salónne Štatistiky */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-1 shadow-xs">
                <span className="text-xl font-bold text-[#6633EE] dark:text-[#A78BFA] tabular-nums">{totalSaloonMassages}</span>
                <p className="text-[10px] font-semibold text-[#64748B] dark:text-[#C7CAE0]/60 uppercase tracking-wider">
                  {language === 'sk' ? 'Masáží celkovo' : 'Total Sessions'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-1 shadow-xs">
                <span className="text-xl font-bold text-[#10B981] tabular-nums">{totalSaloonRevenue} €</span>
                <p className="text-[10px] font-semibold text-[#64748B] dark:text-[#C7CAE0]/60 uppercase tracking-wider">
                  {language === 'sk' ? 'Obrat pečiatok' : 'Stamp Revenue'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-1 shadow-xs">
                <span className="text-xl font-bold text-[#0B0D22] dark:text-[#FFFFFF] tabular-nums">{avgSaloonSpend} €</span>
                <p className="text-[10px] font-semibold text-[#64748B] dark:text-[#C7CAE0]/60 uppercase tracking-wider">
                  {language === 'sk' ? 'Priemer / klient' : 'Avg / Client'}
                </p>
              </div>
            </div>

            {/* Rebríček / Leaderboard Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm dark:shadow-md space-y-4 text-left">
              
              {/* Prepínač triedenia */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="font-semibold text-sm text-[#0B0D22] dark:text-[#FFFFFF] flex items-center gap-2">
                    <Sparkles size={16} className="text-[#6633EE] dark:text-[#A78BFA]" />
                    <span>{language === 'sk' ? 'Rebríček najvernejších klientov' : 'Client Loyalty Leaderboard'}</span>
                  </h3>
                  <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/60">
                    {language === 'sk' ? 'Zoznam klientov zoradený podľa návštevnosti a minutých prostriedkov' : 'Ranked by massage visits and spend'}
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49]">
                  <button
                    type="button"
                    onClick={() => setRankingSortBy('visits')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      rankingSortBy === 'visits'
                        ? 'bg-white dark:bg-[#0B0D22] text-[#6633EE] dark:text-[#FFFFFF] shadow-xs'
                        : 'text-[#64748B] dark:text-[#C7CAE0]/60 hover:text-[#0B0D22] dark:hover:text-white'
                    }`}
                  >
                    {language === 'sk' ? 'Podľa návštev' : 'By Visits'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRankingSortBy('spent')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      rankingSortBy === 'spent'
                        ? 'bg-white dark:bg-[#0B0D22] text-[#6633EE] dark:text-[#FFFFFF] shadow-xs'
                        : 'text-[#64748B] dark:text-[#C7CAE0]/60 hover:text-[#0B0D22] dark:hover:text-white'
                    }`}
                  >
                    {language === 'sk' ? 'Podľa útraty (€)' : 'By Spend (€)'}
                  </button>
                </div>
              </div>

              {/* PODIUM TOP 3 KLIENTOV (AK SÚ ASPOŇ 1) */}
              {sortedRankings.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 pb-2">
                  {sortedRankings.slice(0, 3).map((client, idx) => {
                    const medals = ['🥇 1. Miesto', '🥈 2. Miesto', '🥉 3. Miesto'];
                    const borderGradients = [
                      'border-amber-400/60 bg-amber-500/5',
                      'border-slate-300 dark:border-slate-600 bg-slate-500/5',
                      'border-amber-700/50 bg-amber-700/5',
                    ];

                    return (
                      <div
                        key={client.id}
                        className={`p-3 rounded-xl border ${borderGradients[idx]} flex flex-col justify-between space-y-2 relative overflow-hidden`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0B0D22] dark:text-[#FFFFFF]">
                            {medals[idx]}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#010314] text-[#6633EE] dark:text-[#A78BFA] border border-[#E2E8F0] dark:border-[#2B2F49]">
                            {client.program_type === '5_stamps' ? '5p' : '10p'}
                          </span>
                        </div>

                        <div className="min-w-0 text-left">
                          <p className="font-semibold text-xs text-[#0B0D22] dark:text-[#FFFFFF] truncate">
                            {client.full_name || 'Hosť bez mena'}
                          </p>
                          <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 truncate font-normal">
                            {client.email}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0] dark:border-[#2B2F49]/60 text-xs">
                          <span className="font-bold text-[#6633EE] dark:text-[#A78BFA] tabular-nums">
                            {client.visitsCount} {language === 'sk' ? 'masáží' : 'visits'}
                          </span>
                          <span className="font-bold text-[#10B981] tabular-nums">
                            {client.totalSpent} €
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CELÝ ZOZNAM RANKINGU */}
              <div className="divide-y divide-[#E2E8F0] dark:divide-[#2B2F49] rounded-xl border border-[#E2E8F0] dark:border-[#2B2F49] overflow-hidden">
                {sortedRankings.length > 0 ? (
                  sortedRankings.map((client, rankIdx) => (
                    <div
                      key={client.id}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#010314]/30 hover:bg-slate-100/50 dark:hover:bg-[#010314] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-center font-bold text-xs text-[#64748B] dark:text-[#C7CAE0]/70 tabular-nums">
                          #{rankIdx + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-[#0B0D22] dark:text-[#FFFFFF] truncate">
                            {client.full_name || (language === 'sk' ? 'Hosť bez mena' : 'Unnamed Guest')}
                          </p>
                          <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 truncate font-normal">
                            {client.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div className="text-right">
                          <span className="block text-xs font-bold text-[#0B0D22] dark:text-[#FFFFFF] tabular-nums">
                            {client.visitsCount} {language === 'sk' ? 'masáží' : 'visits'}
                          </span>
                          <span className="block text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 tabular-nums">
                            {language === 'sk' ? 'priemer' : 'avg'}: {client.averageSpent.toFixed(0)} €
                          </span>
                        </div>

                        <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-full border border-[#10B981]/30 tabular-nums">
                          {client.totalSpent} €
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60 text-center py-6 font-normal">
                    {language === 'sk' ? 'Zatiaľ nie sú evidované žiadne návštevy klientov.' : 'No client visit history recorded yet.'}
                  </p>
                )}
              </div>

              {/* Rýchly odkaz na administráciu */}
              <div className="pt-2 flex justify-end">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6633EE] dark:text-[#A78BFA] hover:underline"
                >
                  <span>{language === 'sk' ? 'Prejsť do Administrácie salónu' : 'Go to Salon Admin'}</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

            </div>

          </div>
        ) : (
          /* ================================================================ */
          /* B. KLIENTSKÝ MÓD: KONTROLA REZERVÁCIÍ A HISTÓRIA NÁVŠTEV         */
          /* ================================================================ */
          <>
            {/* 2. KONTROLA REZERVÁCIÍ (AKTÍVNE A NADCHÁDZAJÚCE TERMÍNY) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm dark:shadow-md space-y-3 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#6633EE] dark:text-[#A78BFA]" />
                  <h3 className="font-semibold text-xs text-[#0B0D22] dark:text-[#FFFFFF] uppercase tracking-wider">
                    {language === 'sk' ? 'Kontrola rezervácií' : 'Booking Management'}
                  </h3>
                </div>
                {userBookings.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#6633EE]/15 border border-[#6633EE]/30 text-[#6633EE] dark:text-[#A78BFA] text-[10px] font-bold">
                    {userBookings.length} {language === 'sk' ? 'aktívne' : 'active'}
                  </span>
                )}
              </div>

              {userBookings.length > 0 ? (
                <div className="space-y-2.5">
                  {userBookings.map((b, idx) => (
                    <div 
                      key={b.id || idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#0B0D22] dark:text-[#FFFFFF] truncate">
                            {b.type || 'Masáž'}
                          </span>
                          {b.bookingRef && (
                            <span className="font-mono text-[10px] text-[#6633EE] dark:text-[#A78BFA] bg-[#6633EE]/10 dark:bg-[#6633EE]/15 px-2 py-0.5 rounded-md border border-[#6633EE]/30">
                              #{b.bookingRef}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#64748B] dark:text-[#C7CAE0]">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-[#6633EE] dark:text-[#A78BFA]" />
                            {b.slot ? formatFullDateText(b.slot) : 'Termín'}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-[#0B0D22] dark:text-[#FFFFFF]">
                            <Clock size={12} className="text-[#6633EE] dark:text-[#A78BFA]" />
                            {b.slot ? format24hTimeText(b.slot) : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCancelBooking(b);
                          setShowCancelModal(true);
                        }}
                        className="w-full sm:w-auto px-3.5 py-1.5 rounded-full bg-[#FF5A7A]/15 hover:bg-[#FF5A7A]/25 border border-[#FF5A7A]/30 text-[#FF5A7A] text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <CalendarX size={13} />
                        <span>{language === 'sk' ? 'Požiadať o storno' : 'Request Cancel'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-2.5">
                  <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/70 font-normal">
                    {language === 'sk' 
                      ? 'Momentálne nemáte žiadne aktívne nadchádzajúce rezervácie.' 
                      : 'You have no active upcoming bookings at this moment.'}
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full btn-primary text-xs font-semibold uppercase tracking-wider shadow-sm"
                  >
                    <Plus size={13} />
                    <span>{language === 'sk' ? 'Rezervovať novú masáž' : 'Book a Massage'}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 3. HISTÓRIA MASÁŽÍ A PREHĽAD NÁVŠTEV */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm dark:shadow-md space-y-4 text-left">
              
              {/* Hlavička histórie & Štatistiky */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-[#6633EE] dark:text-[#A78BFA]" />
                  <h3 className="font-semibold text-xs text-[#0B0D22] dark:text-[#FFFFFF] uppercase tracking-wider">
                    {language === 'sk' ? 'História návštev a procedúr' : 'Visit & Procedure History'}
                  </h3>
                </div>
                <span className="text-xs font-medium text-[#6633EE] dark:text-[#A78BFA]">
                  {stamps.length} {language === 'sk' ? 'návštev' : 'visits'}
                </span>
              </div>

              {/* Súhrnné štatistické boxy */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-0.5">
                  <span className="text-xl font-bold text-[#0B0D22] dark:text-[#FFFFFF]">{stamps.length}</span>
                  <p className="text-[10px] font-medium text-[#6633EE] dark:text-[#A78BFA] uppercase tracking-wider">
                    {language === 'sk' ? 'Absolvovaných masáží' : 'Massages Completed'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-0.5">
                  <span className="text-xl font-bold text-[#0B0D22] dark:text-[#FFFFFF]">{gifts.length}</span>
                  <p className="text-[10px] font-medium text-[#6633EE] dark:text-[#A78BFA] uppercase tracking-wider">
                    {language === 'sk' ? 'Uplatnených odmien' : 'Rewards Claimed'}
                  </p>
                </div>
              </div>

              {/* Timeline záznamov */}
              {historyItems.length > 0 ? (
                <div className="relative pl-4 sm:pl-6 border-l border-[#E2E8F0] dark:border-[#2B2F49] space-y-3.5 my-2">
                  {historyItems.map((item) => {
                    const isStamp = item.type === 'stamp';
                    const dateObj = new Date(item.date);
                    const formattedDate = dateObj.toLocaleDateString(language === 'sk' ? 'sk-SK' : 'en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const formattedTime = dateObj.toLocaleTimeString(language === 'sk' ? 'sk-SK' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div key={item.id} className="relative group">
                        <div 
                          className={`absolute -left-[21px] sm:-left-[29px] top-1.5 w-3 h-3 rounded-full border-2 transition-all ${
                            isStamp 
                              ? 'bg-[#6633EE] border-white dark:border-[#0B0D22] ring-2 ring-[#6633EE]/40' 
                              : 'bg-[#A78BFA] border-white dark:border-[#0B0D22] ring-2 ring-[#A78BFA]/40'
                          }`} 
                        />

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE]/40 transition-colors flex items-center justify-between gap-3 shadow-xs">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] truncate">
                                {isStamp 
                                  ? (language === 'sk' ? 'Absolvovaná masáž' : 'Massage Session')
                                  : (language === 'sk' ? 'Vernostná odmena' : 'Loyalty Reward')}
                              </span>
                              {isStamp && item.data.claimed && (
                                <span className="px-1.5 py-0.2 rounded-full bg-[#10b981]/15 text-[#10b981] text-[9px] font-bold border border-[#10b981]/30">
                                  {language === 'sk' ? 'Uplatnená' : 'Claimed'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/60 font-mono">
                              {formattedDate} • {formattedTime}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            {isStamp ? (
                              <span className="text-xs font-bold text-[#0B0D22] dark:text-[#FFFFFF] bg-white dark:bg-[#0B0D22] px-2.5 py-1 rounded-full border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs">
                                {item.data.price} €
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-[#6633EE] dark:text-[#A78BFA] bg-[#6633EE]/10 dark:bg-[#6633EE]/15 px-2.5 py-1 rounded-full border border-[#6633EE]/30">
                                {item.data.custom_code || (language === 'sk' ? 'Darček' : 'Gift')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60 text-center py-4">
                  {language === 'sk' ? 'Zatiaľ nemáte žiadnu históriu masáží.' : 'No massage history yet.'}
                </p>
              )}

            </div>
          </>
        )}

      </div>

      {/* MODAL PRE NASTAVENIA */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          loadProfileData();
        }}
        userId={profile.id}
        language={language}
        toggleLanguage={toggleLanguage}
        theme={theme}
        toggleTheme={toggleTheme}
        t={t}
      />

      {/* MODAL PRE STORNO ŽIADOSŤ */}
      {selectedCancelBooking && (
        <CancelRequestModal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedCancelBooking(null);
            loadProfileData();
          }}
          booking={selectedCancelBooking}
          userId={profile.id}
          language={language}
        />
      )}

      {/* LUCKY WHEEL MODAL */}
      <LuckyWheelModal
        isOpen={isWheelOpen}
        onClose={() => setIsWheelOpen(false)}
        userId={profile.id}
        language={language}
        onRewardClaimed={() => {
          loadProfileData();
        }}
      />

    </main>
  );
}