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
  Flower2, Leaf, Sparkles, Heart, Feather, Droplets, Coffee, Cat, Star, ArrowLeft, Globe, Menu
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
function getNavbarSvgPath(activeIdx: number, totalTabs: number, width: number = 360) {
  const height = 64;
  const tabWidth = width / totalTabs;
  const xc = (activeIdx + 0.5) * tabWidth;
  const topY = 14;
  const cornerR = 16;

  // Exact circular cradle coordinates embracing the round ball
  const leftShoulderX = Math.max(cornerR, xc - 32);
  const leftArcX = xc - 23.5;
  const arcY = topY + 5.5;
  const rightArcX = xc + 23.5;
  const rightShoulderX = Math.min(width - cornerR, xc + 32);

  const cpLeftX = Math.max(cornerR, xc - 26);
  const cpRightX = Math.min(width - cornerR, xc + 26);

  return `
    M ${cornerR} ${topY}
    L ${leftShoulderX} ${topY}
    C ${cpLeftX} ${topY}, ${leftArcX - 2} ${topY + 1.5}, ${leftArcX} ${arcY}
    A 25.5 25.5 0 0 0 ${rightArcX} ${arcY}
    C ${rightArcX + 2} ${topY + 1.5}, ${cpRightX} ${topY}, ${rightShoulderX} ${topY}
    L ${width - cornerR} ${topY}
    A ${cornerR} ${cornerR} 0 0 1 ${width} ${topY + cornerR}
    L ${width} ${height - cornerR}
    A ${cornerR} ${cornerR} 0 0 1 ${width - cornerR} ${height}
    L ${cornerR} ${height}
    A ${cornerR} ${cornerR} 0 0 1 0 ${height - cornerR}
    L 0 ${topY + cornerR}
    A ${cornerR} ${cornerR} 0 0 1 ${cornerR} ${topY}
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

  const navRef = React.useRef<HTMLDivElement>(null);
  const [navWidth, setNavWidth] = useState<number>(360);

  useEffect(() => {
    if (!navRef.current) return;
    const updateWidth = () => {
      if (navRef.current) {
        const w = navRef.current.getBoundingClientRect().width;
        if (w > 0) setNavWidth(w);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [sessionUser]);

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

  const activeTabIdx = getActiveTabIdx();  // Pri admin profile / sekcii administrácie nesmie byť zobrazený dolný navbar, keďže admin má hamburger menu
  const isHideBottomNav = isAdmin || pathname === '/admin' || (pathname ? pathname.startsWith('/admin') : false);

  // Pri admin účte nie je potrebné tlačidlo "Úvod"
  const isHideHomeButton = isAdmin || pathname === '/admin' || (pathname ? pathname.startsWith('/admin') : false);

  // Na stránke administrácie /admin sa nezobrazuje horná lišta Navbaru (je tam vlastná hlavička s menu a QR kódom a žiadny blur)
  const isHideTopHeader = pathname === '/admin' || (pathname ? pathname.startsWith('/admin') : false);

  const isBlobActive = Boolean(sessionUser && !isAdmin && activeTabIdx === 2);

  // Active Icon Renderer inside the elevated circle ball (Gulička)
  const renderActiveBallIcon = () => {
    if (!sessionUser) {
      return activeTabIdx === 0 ? (
        <Calendar size={18} strokeWidth={2.5} className="text-white" />
      ) : (
        <User size={18} strokeWidth={2.5} className="text-white" />
      );
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
         🌐 TOP BAR (HORE VĽAVO: PRE KLIENTOV ÚVOD, PRE ADMINA HAMBURGER MENU)
         ========================================================================== */}
      <header 
        suppressHydrationWarning 
        className="fixed z-40 top-0 left-0 right-0 pointer-events-none transition-colors duration-300"
      >
        {/* Plynulý gradient & backdrop-blur mask cez celú šírku hornej lišty */}
        <div 
          className="absolute inset-x-0 top-0 h-24 sm:h-28 bg-gradient-to-b from-[#F4F6FB] via-[#F4F6FB]/80 to-transparent dark:from-[#010314] dark:via-[#010314]/80 dark:to-transparent backdrop-blur-[6px] [mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)] pointer-events-none"
        />

        {/* Samotný obsah hlavičky (tlačidlá) */}
        <div 
          className="relative z-10 flex items-center justify-between"
          style={{ 
            paddingTop: 'calc(env(safe-area-inset-top, 16px) + 0.75rem)',
            paddingLeft: 'max(1.25rem, env(safe-area-inset-left, 20px))',
            paddingRight: 'max(1.25rem, env(safe-area-inset-right, 20px))',
            paddingBottom: '0.4rem'
          }}
        >
          {/* Hore vľavo: PRE ADMINA HAMBURGER MENU, PRE KLIENTOV ÚVOD SO ŠÍPKOU */}
          {isAdmin || pathname === '/admin' ? (
            <button
              type="button"
              onClick={() => {
                if (pathname === '/admin') {
                  window.dispatchEvent(new CustomEvent('open_admin_drawer'));
                } else {
                  router.push('/admin?openMenu=true');
                }
              }}
              className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#6633EE]/15 hover:bg-[#6633EE]/25 dark:bg-[#6633EE]/25 dark:hover:bg-[#6633EE]/35 text-[#6633EE] dark:text-[#A78BFA] border border-[#6633EE]/30 transition active:scale-95 cursor-pointer shadow-xs text-xs sm:text-sm font-bold"
              title={language === 'sk' ? 'Otvoriť menu administrácie' : 'Open admin menu'}
            >
              <Menu size={18} />
              <span>{language === 'sk' ? 'Menu' : 'Menu'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoHome}
              className="pointer-events-auto group flex items-center gap-2 text-[15px] sm:text-base font-bold text-[#0B0D22] dark:text-[#FFFFFF] hover:text-[#6633EE] dark:hover:text-[#A78BFA] transition-all cursor-pointer active:scale-95 py-1 select-none drop-shadow-sm"
              title={language === 'sk' ? 'Prejsť na úvodnú domovskú obrazovku s recenziami' : 'Go to home welcome screen with reviews'}
            >
              <ArrowLeft size={19} className="text-[#6633EE] dark:text-[#A78BFA] transition-transform group-hover:-translate-x-1" />
              <span className="tracking-tight">{language === 'sk' ? 'Úvod' : 'Home'}</span>
            </button>
          )}

          {/* Hore vpravo: JAZYK LEN PRE NEPRIHLÁSENÝCH */}
          {!sessionUser ? (
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
          ) : (
            <div />
          )}
        </div>
      </header>

      {/* ==========================================================================
         🌫️ BOTTOM FADING DOCK VIGNETTE & BLUR MASK FOR CLEAN NAVBAR SEPARATION
         Zabezpečuje, že obsah pod lištou ide do stratena (nezobrazuje sa v admin móde)
         ========================================================================== */}
      {!isHideBottomNav && (
        <div 
          className="fixed inset-x-0 bottom-0 pointer-events-none z-40 transition-colors duration-300"
          style={{ height: 'calc(6.5rem + env(safe-area-inset-bottom, 16px))' }}
        >
          <div 
            className="w-full h-full bg-gradient-to-t from-[#F4F6FB] via-[#F4F6FB]/85 to-transparent dark:from-[#010314] dark:via-[#010314]/90 dark:to-transparent backdrop-blur-[6px] [mask-image:linear-gradient(to_top,black_0%,black_50%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,black_50%,transparent_100%)]"
          />
        </div>
      )}

      {/* ==========================================================================
         EVERVAULT NOTCHED NAVBAR (PRI ADMIN PROFILE SA NEZOBRAZUJE - MÁ HAMBURGER MENU)
         ========================================================================== */}
      {!isHideBottomNav && (
        <nav 
          suppressHydrationWarning 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 font-sans"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
        
        {/* ================================================================== */}
        {/* NOTCHED TAB BAR CONTAINER (CONTAINS ONLY TABS + SVG CUTOUT NOTCH)  */}
        {/* ================================================================== */}
        <div ref={navRef} className={`relative h-16 ${sessionUser ? 'w-[290px] sm:w-[360px]' : 'w-[260px] sm:w-[320px]'}`}>
          
          {/* 1. DYNAMIC SVG BACKGROUND WITH TEARDROP CUTOUT NOTCH */}
          <svg 
            viewBox={`0 0 ${navWidth} 64`} 
            className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-2xl overflow-visible"
          >
            <path
              d={getNavbarSvgPath(activeTabIdx, totalTabs, navWidth)}
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
      )}
    </>
  );
}