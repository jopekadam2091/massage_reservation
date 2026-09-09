'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { useTheme } from '../lib/ThemeContext';
import { useAvatar } from '../lib/AvatarContext';
import SettingsModal from './SettingsModal';
import UserHistoryModal from './UserHistoryModal';
import AdminUserManagementModal from './admin/AdminUserManagementModal';

import { 
  Calendar, CreditCard, ShieldCheck, User, Sun, Moon, Settings,
  Flower2, Leaf, Sparkles, Heart, Feather, Droplets, Coffee, Cat, Star
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
  const notchR = 32; // Cutout half-width
  const notchDepth = 25; // Circular socket dip depth
  const topY = 14;

  const leftX = xc - notchR;
  const rightX = xc + notchR;

  return `
    M 16 ${topY}
    L ${leftX} ${topY}
    C ${xc - 20} ${topY}, ${xc - 16} ${topY + notchDepth}, ${xc} ${topY + notchDepth}
    C ${xc + 16} ${topY + notchDepth}, ${xc + 20} ${topY}, ${rightX} ${topY}
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
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
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
  }, []);

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
      case 2: {
        const IconComp = ICON_MAP[avatarIcon || 'User'] || ICON_MAP['User'];
        return <IconComp size={18} strokeWidth={2.5} className="text-white" />;
      }
      default:
        return <Calendar size={18} strokeWidth={2.5} className="text-white" />;
    }
  };

  return (
    <>
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
            
            {/* Sliding Ball Container */}
            <div 
              className={`absolute top-0 bottom-0 left-0 flex items-center justify-center pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                sessionUser ? 'w-1/3' : 'w-1/2'
              }`}
              style={{ transform: `translateX(${activeTabIdx * 100}%)` }}
            >
              {/* Elevated Floating Ball with Electric Violet Glow */}
              <div className="absolute -top-3.5 w-11 h-11 rounded-full bg-gradient-to-tr from-[#6633EE] via-[#7C3AED] to-[#A78BFA] shadow-[0_0_22px_rgba(102,51,238,0.75)] flex items-center justify-center border-2 border-white dark:border-[#0B0D22] transition-all duration-300 animate-in zoom-in-75 ring-1 ring-[#A78BFA]/40">
                {renderActiveBallIcon()}
              </div>
            </div>

            {/* ================================================================== */}
            {/* 3. LOGGED OUT TABS (2 Tabs: Rezervácia, Prihlásenie)             */}
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
                    (() => {
                      const IconComp = ICON_MAP[avatarIcon || 'User'] || ICON_MAP['User'];
                      return <IconComp size={18} strokeWidth={1.8} className="text-[#64748B] dark:text-[#C7CAE0]/60 mb-0.5" />;
                    })()
                  )}
                  <span className={activeTabIdx === 2 ? 'text-[#0B0D22] dark:text-[#FFFFFF] font-semibold text-[11px]' : 'text-[#64748B] dark:text-[#C7CAE0]/60'}>
                    {isAdmin ? (language === 'sk' ? 'Ranking & Profil' : 'Ranking') : (language === 'sk' ? 'Profil' : 'Profile')}
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* QUICK THEME & LANG SWITCHER PILL (DESKTOP ONLY)                     */}
        {/* ================================================================== */}
        <div suppressHydrationWarning className="hidden sm:flex items-center gap-1.5 h-12 px-3 rounded-full bg-white/90 dark:bg-[#0B0D22]/90 border border-[#E2E8F0] dark:border-[#2B2F49] backdrop-blur-2xl shadow-xl">
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-[#010314] text-[#0B0D22] dark:text-[#FFFFFF] text-[10px] font-medium border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE]/60 transition cursor-pointer"
          >
            {language.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-full bg-slate-50 dark:bg-[#010314] text-[#6633EE] dark:text-[#A78BFA] border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE]/60 transition cursor-pointer"
          >
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>

      </nav>
    </>
  );
}