'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { useAvatar } from '../lib/AvatarContext';
import SettingsModal from './SettingsModal';
import UserHistoryModal from './UserHistoryModal';
import AdminUserManagementModal from './admin/AdminUserManagementModal';

import BlobatarAvatar from './BlobatarAvatar';
import { 
  Calendar, CreditCard, ShieldCheck, User, Sun, Moon, Settings,
  Flower2, Leaf, Sparkles, Heart, Feather, Droplets, Coffee, Cat, Star, ArrowLeft, Globe
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  User,
  Flower2,
  Leaf,
  Sparkles,
  Sun,
  Moon,
  Heart,
  Feather,
  Droplets,
  Coffee,
  Cat,
  Star,
};

// 💧 SVG PATH GENERATOR FOR SMOOTH CIRCULAR NOTCHED NAVBAR BACKGROUND
function getNavbarSvgPath(activeIdx: number, totalTabs: number) {
  const width = 400;
  const height = 64;
  const tabWidth = width / totalTabs;
  const xc = (activeIdx + 0.5) * tabWidth;
  const topY = 14;

  // Exact circular cradle coordinates embracing the round ball
  const leftShoulderX = xc - 34;
  const leftArcX = xc - 23.5;
  const arcY = topY + 5.5;
  const rightArcX = xc + 23.5;
  const rightShoulderX = xc + 34;

  return `
    M 16 ${topY}
    L ${leftShoulderX} ${topY}
    C ${xc - 28} ${topY}, ${leftArcX - 2} ${topY + 1.5}, ${leftArcX} ${arcY}
    A 25.5 25.5 0 0 0 ${rightArcX} ${arcY}
    C ${rightArcX + 2} ${topY + 1.5}, ${xc + 28} ${topY}, ${rightShoulderX} ${topY}
    L ${width - 16} ${topY}
    A 16 16 0 0 1 ${width} ${topY + 16}
    L ${width} ${height - 16}
    A 16 16 0 0 1 ${width - 16} ${height}
    L 16 ${height}
    A 16 16 0 0 1 0 ${height - 16}
    L 0 ${topY + 16}
    A 16 16 0 0 1 16 ${topY}
    Z
  `;
}

export default function Navbar() {
  const pathname = usePathname();
  const { language, toggleLanguage, setLanguage, t } = useLanguage();
  const { avatarIcon, avatarColor } = useAvatar();

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; email: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminUserMgmtOpen, setIsAdminUserMgmtOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          setIsAdmin(profile.role === 'admin');
          setUserProfile({ full_name: profile.full_name, email: profile.email });
        }
      } else {
        setSessionUser(null);
        setIsAdmin(false);
        setUserProfile(null);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile) {
              setIsAdmin(profile.role === 'admin');
              setUserProfile({ full_name: profile.full_name, email: profile.email });
            }
          });
      } else {
        setSessionUser(null);
        setIsAdmin(false);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);  const router = useRouter();

  const handleGoHome = () => {
    try {
      sessionStorage.removeItem('welcome_seen');
    } catch {}
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('open_landing_screen'));
    } else {
      router.push('/');
    }
  };

  // Total tabs count: 3 for logged in, 2 for logged out
  const totalTabs = sessionUser ? 3 : 2;

  // Active Tab Index
  const getActiveTabIdx = () => {
    if (!sessionUser) {
      if (pathname === '/login') return 1;
      return 0;
    }
    if (pathname === '/') return 0;
    if (pathname === '/vernost' || pathname === '/admin') return 1;
    if (pathname === '/profil' || pathname === '/historie' || pathname === '/login') return 2;
    return 0;
  };

  const activeTabIdx = getActiveTabIdx();

  const isBlobActive = Boolean(sessionUser && !isAdmin && activeTabIdx === 2);

  // Active Icon Renderer inside the elevated circle ball (Gulička)
  const renderActiveBallIcon = () => {
    if (!sessionUser) {
      if (activeTabIdx === 0) return <Calendar size={18} strokeWidth={2.5} className="text-white" />;
      return <User size={18} strokeWidth={2.5} className="text-white" />;
    }

    switch (activeTabIdx) {
      case 0:
        return <Calendar size={18} strokeWidth={2.5} className="text-white" />;
      case 1:
        return isAdmin ? (
          <ShieldCheck size={18} strokeWidth={2.5} className="text-white" />
        ) : (
          <CreditCard size={18} strokeWidth={2.5} className="text-white" />
        );
      case 2:
        return <User size={18} strokeWidth={2.5} className="text-white" />;
      default:
        return <Calendar size={18} strokeWidth={2.5} className="text-white" />;
    }
  };

  return (
    <>
      {/* ==========================================================================
         🌐 TOP BAR (HORE VĽAVO ÚVOD SO ŠÍPKOU VŽDY, HORE VPRAVO JAZYK LEN PRE NEPRIHLÁSENÝCH)
         SO ŠTÝLOVÝM ROZPLÝVAJÚCIM SA GRADIENTOM & BLUROM, ABY OBSAH PRI SCROLLOVANÍ PLYNULE ZMIZOL
         ========================================================================== */}
      <header 
        suppressHydrationWarning 
        className="fixed z-40 top-0 left-0 right-0 pointer-events-none transition-colors duration-300"
      >
        {/* Plynulý gradient & backdrop-blur mask cez celú šírku hornej lišty */}
        <div 
          className="absolute inset-x-0 top-0 h-20 sm:h-24 bg-gradient-to-b from-[#F4F6FB] via-[#F4F6FB]/85 to-transparent dark:from-[#010314] dark:via-[#010314]/85 dark:to-transparent backdrop-blur-[6px] [mask-image:linear-gradient(to_bottom,black_0%,black_60%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_60%,transparent_100%)] pointer-events-none"
        />

        {/* Samotný obsah hlavičky (tlačidlá) */}
        <div 
          className="relative z-10 flex items-center justify-between"
          style={{ 
            paddingTop: 'max(1.1rem, env(safe-area-inset-top, 18px))',
            paddingLeft: 'max(1.25rem, env(safe-area-inset-left, 20px))',
            paddingRight: 'max(1.25rem, env(safe-area-inset-right, 20px))',
            paddingBottom: '0.75rem'
          }}
        >
          {/* Hore vľavo: ÚVOD SO ŠÍPKOU (VŽDY VIDITEĽNÉ PRE PRIHLÁSENÝCH AJ NEPRIHLÁSENÝCH) */}
          <button
            type="button"
            onClick={handleGoHome}
            className="pointer-events-auto group flex items-center gap-2 text-[15px] sm:text-base font-bold text-[#0B0D22] dark:text-[#FFFFFF] hover:text-[#6633EE] dark:hover:text-[#A78BFA] transition-all cursor-pointer active:scale-95 py-1 select-none drop-shadow-sm"
            title={language === 'sk' ? 'Prejsť na úvodnú domovskú obrazovku s recenziami' : 'Go to home welcome screen with reviews'}
          >
            <ArrowLeft size={19} className="text-[#6633EE] dark:text-[#A78BFA] transition-transform group-hover:-translate-x-1" />
            <span className="tracking-tight">{language === 'sk' ? 'Úvod' : 'Home'}</span>
          </button>

          {/* Hore vpravo: JAZYK LEN PRE NEPRIHLÁSENÝCH (PO PRIHLÁSENÍ JE V NASTAVENIACH) */}
          {!sessionUser && (
            <div className="pointer-events-auto flex items-center">
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 text-[15px] sm:text-base font-bold text-[#0B0D22] dark:text-[#FFFFFF] hover:text-[#6633EE] dark:hover:text-[#A78BFA] transition-all cursor-pointer active:scale-95 py-1 select-none drop-shadow-sm"
                title={language === 'sk' ? 'Prepnúť do angličtiny' : 'Switch to Slovak'}
              >
                <Globe size={18} className="text-[#6633EE] dark:text-[#A78BFA]" />
                <span className="uppercase tracking-wider font-extrabold">{language}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ==========================================================================
         EVERVAULT NOTCHED NAVBAR WITH ELEVATED FLOATING ELECTRIC PURPLE CIRCLE
         ========================================================================== */}
      <nav 
        suppressHydrationWarning 
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 font-sans"
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        
        {/* ================================================================== */}
        {/* NOTCHED TAB BAR CONTAINER (CONTAINS ONLY TABS + SVG CUTOUT NOTCH)  */}
        {/* ================================================================== */}
        <div className={`relative h-16 ${sessionUser ? 'w-[290px] sm:w-[360px]' : 'w-[260px] sm:w-[320px]'}`}>
          
          {/* 1. DYNAMIC SVG BACKGROUND WITH TEARDROP CUTOUT NOTCH */}
          <svg 
            viewBox="0 0 400 64" 
            className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-2xl overflow-visible"
            preserveAspectRatio="none"
          >
            <path
              d={getNavbarSvgPath(activeTabIdx, totalTabs)}
              className="fill-white/95 dark:fill-[#0B0D22]/95 stroke-[#E2E8F0] dark:stroke-[#2B2F49] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              strokeWidth="1.5"
            />
          </svg>

          {/* ⚡ 2. FLOATING ACTIVE ELEVATED CIRCLE BALL & TABS CONTAINER */}
          <div suppressHydrationWarning className="relative z-10 w-full h-full flex items-center justify-around">
            
            {/* Sliding Ball / Blob Container */}
            <div 
              className={`absolute top-0 bottom-0 left-0 flex items-center justify-center pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                sessionUser ? 'w-1/3' : 'w-1/2'
              }`}
              style={{ transform: `translateX(${activeTabIdx * 100}%)` }}
            >
              <div className="absolute -top-3.5 w-11 h-11 flex items-center justify-center">
                {/* 1. Permanent Circular Gradient Ball (Always rounded-full to prevent any square flash) */}
                <div 
                  className={`absolute inset-0 rounded-full bg-gradient-to-tr from-[#6633EE] via-[#7C3AED] to-[#A78BFA] shadow-[0_0_22px_rgba(102,51,238,0.75)] border-2 border-white dark:border-[#0B0D22] ring-1 ring-[#A78BFA]/40 flex items-center justify-center transition-all duration-300 ease-out ${
                    isBlobActive ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'
                  }`}
                >
                  {renderActiveBallIcon()}
                </div>

                {/* 2. Full Blobatar Avatar for Profile Tab */}
                {sessionUser && !isAdmin && (
                  <div 
                    className={`absolute -top-0.5 w-12 h-12 flex items-center justify-center transition-all duration-300 ease-out ${
                      isBlobActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'
                    }`}
                  >
                    <BlobatarAvatar
                      name={avatarIcon || 'User'}
                      color={avatarColor}
                      size={44}
                      animate="always"
                      className="drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ================================================================== */}
            {/* 3. LOGGED OUT TABS: 2 TABS (Rezervácia, Prihlásenie)             */}
            {/* ================================================================== */}
            {!sessionUser ? (
              <>
                <Link
                  href="/"
                  className="z-20 w-1/2 h-full flex flex-col items-center justify-end pb-2 text-[10px] font-medium active:scale-95 transition-all duration-300"
                >
                  {activeTabIdx !== 0 && (
                    <Calendar size={18} strokeWidth={1.8} className="text-[#64748B] dark:text-[#C7CAE0]/60 mb-0.5" />
                  )}
                  <span className={activeTabIdx === 0 ? 'text-[#0B0D22] dark:text-[#FFFFFF] font-semibold text-[11px]' : 'text-[#64748B] dark:text-[#C7CAE0]/60'}>
                    {t.navReservation}
                  </span>
                </Link>

                <Link
                  href="/login"
                  className="z-20 w-1/2 h-full flex flex-col items-center justify-end pb-2 text-[10px] font-medium active:scale-95 transition-all duration-300"
                >
                  {activeTabIdx !== 1 && (
                    <User size={18} strokeWidth={1.8} className="text-[#64748B] dark:text-[#C7CAE0]/60 mb-0.5" />
                  )}
                  <span className={activeTabIdx === 1 ? 'text-[#0B0D22] dark:text-[#FFFFFF] font-semibold text-[11px]' : 'text-[#64748B] dark:text-[#C7CAE0]/60'}>
                    {t.navLogin}
                  </span>
                </Link>
              </>
            ) : (
              /* ================================================================== */
              /* 4. LOGGED IN TABS (3 Tabs: Rezervácia, Vernosť/Admin, Profil)      */
              /* ================================================================== */
              <>
                {/* TAB 1: REZERVAČNÝ KALENDÁR / BOOKING SLOTS PRE ADMINA */}
                <Link
                  href="/"
                  className="z-20 w-1/3 h-full flex flex-col items-center justify-end pb-2 text-[10px] font-medium active:scale-95 transition-all duration-300"
                >
                  {activeTabIdx !== 0 && (
                    <Calendar size={18} strokeWidth={1.8} className="text-[#64748B] dark:text-[#C7CAE0]/60 mb-0.5" />
                  )}
                  <span className={activeTabIdx === 0 ? 'text-[#0B0D22] dark:text-[#FFFFFF] font-semibold text-[11px]' : 'text-[#64748B] dark:text-[#C7CAE0]/60'}>
                    {isAdmin ? 'Booking Slots' : t.navReservation}
                  </span>
                </Link>

                {/* TAB 2: VERNOSTNÝ PROGRAM / ADMIN */}
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="z-20 w-1/3 h-full flex flex-col items-center justify-end pb-2 text-[10px] font-medium active:scale-95 transition-all duration-300"
                  >
                    {activeTabIdx !== 1 && (
                      <ShieldCheck size={18} strokeWidth={1.8} className="text-[#64748B] dark:text-[#C7CAE0]/60 mb-0.5" />
                    )}
                    <span className={activeTabIdx === 1 ? 'text-[#0B0D22] dark:text-[#FFFFFF] font-semibold text-[11px]' : 'text-[#64748B] dark:text-[#C7CAE0]/60'}>
                      Admin
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/vernost"
                    className="z-20 w-1/3 h-full flex flex-col items-center justify-end pb-2 text-[10px] font-medium active:scale-95 transition-all duration-300"
                  >
                    {activeTabIdx !== 1 && (
                      <CreditCard size={18} strokeWidth={1.8} className="text-[#64748B] dark:text-[#C7CAE0]/60 mb-0.5" />
                    )}
                    <span className={activeTabIdx === 1 ? 'text-[#0B0D22] dark:text-[#FFFFFF] font-semibold text-[11px]' : 'text-[#64748B] dark:text-[#C7CAE0]/60'}>
                      {language === 'sk' ? 'Vernosť' : 'Loyalty'}
                    </span>
                  </Link>
                )}

                {/* TAB 3: PROFIL / RANKING */}
                <Link
                  href="/profil"
                  className="z-20 w-1/3 h-full flex flex-col items-center justify-end pb-2 text-[10px] font-medium active:scale-95 cursor-pointer transition-all duration-300"
                >
                  {activeTabIdx !== 2 && (
                    isAdmin ? (
                      <User size={18} strokeWidth={1.8} className="text-[#64748B] dark:text-[#C7CAE0]/60 mb-0.5" />
                    ) : (
                      <BlobatarAvatar
                        name={avatarIcon || 'User'}
                        color={avatarColor}
                        size={20}
                        animate="hover"
                        className="mb-0.5 rounded-full opacity-80"
                      />
                    )
                  )}
                  <span className={activeTabIdx === 2 ? 'text-[#0B0D22] dark:text-[#FFFFFF] font-semibold text-[11px]' : 'text-[#64748B] dark:text-[#C7CAE0]/60'}>
                    {isAdmin ? (language === 'sk' ? 'Ranking & Profil' : 'Ranking') : (language === 'sk' ? 'Profil' : 'Profile')}
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}