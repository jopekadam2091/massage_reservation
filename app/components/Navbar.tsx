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
  Calendar, CreditCard, ShieldCheck, User, Sun, Moon, LogOut, Settings,
  Flower2, Leaf, Sparkles, Heart, Feather, Droplets, Coffee, Cat, Star, Menu, X
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 🚀 HAMBURGER MENU STATE

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

  return (
    <>
      <nav className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 font-sans">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex flex-col gap-2">
          
          {/* 🚀 RIADOK 1: PROFIL VĽAVO + HAMBURGER VPRÁVO */}
          <div className="flex items-center justify-between gap-2">

            {/* VĽAVO: PROFIL S MENOM ALEBO HOSŤ */}
            <button
              type="button"
              onClick={() => {
                if (isAdmin) {
                  setIsAdminUserMgmtOpen(true);
                } else {
                  setIsProfileModalOpen(true);
                }
              }}
              className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight min-w-0 hover:opacity-85 transition active:scale-98 text-left cursor-pointer"
            >
              {sessionUser ? (
                <>
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 transition-all duration-300"
                    style={{ color: avatarColor || '#10b981' }}
                  >
                    {(() => {
                      const IconComp = ICON_MAP[avatarIcon || 'User'] || ICON_MAP['User'];
                      return <IconComp size={20} strokeWidth={2} />;
                    })()}
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate max-w-[160px] sm:max-w-[240px] leading-tight">
                      {userProfile?.full_name || sessionUser.email}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {isAdmin ? (language === 'sk' ? 'Administrátor' : 'Administrator') : (language === 'sk' ? 'Klient' : 'Client')}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 shrink-0 shadow-sm">
                    <User size={18} />
                  </div>
                  <span className="font-extrabold text-xs text-slate-700 dark:text-slate-200 tracking-tight truncate max-w-[180px] sm:max-w-none">
                    {language === 'sk' ? 'Hosť Rezervačný systém' : 'Guest Reservation System'}
                  </span>
                </>
              )}
            </button>

            {/* VPRÁVO: HAMBURGER TLAČIDLO */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-95 shadow-sm cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>

          {/* 🚀 RIADOK 2: SEGMENETOVÝ PREPÍNAČ SEKIÍ (REZERVÁCIA / VERNOSTNÁ KARTA / ADMIN PANEL) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80">
            <Link
              href="/"
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 ${
                pathname === '/'
                  ? 'bg-[#0e74a4] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Calendar size={14} />
              <span>{t.navReservation}</span>
            </Link>

            {isAdmin ? (
              <Link
                href="/admin"
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 ${
                  pathname === '/admin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <ShieldCheck size={14} />
                <span>{language === 'sk' ? 'Admin Panel' : 'Admin Panel'}</span>
              </Link>
            ) : (
              <Link
                href="/profil"
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 ${
                  pathname === '/profil'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <CreditCard size={14} />
                <span>{t.navLoyaltyCard}</span>
              </Link>
            )}
          </div>

        </div>

        {/* 🚀 HAMBURGER MENU DROPDOWN (JAZYK, TÉMA, NASTAVENIA, PRIHLÁSENIE) */}
        {isMobileMenuOpen && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 font-sans text-left">
            
            {/* 1. JAZYK (SK / EN) */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {language === 'sk' ? 'Jazyk / Language' : 'Language'}
              </span>
              
              <button
                type="button"
                onClick={toggleLanguage}
                className="w-13 h-7 rounded-full bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700 relative transition-colors duration-300 flex items-center justify-between px-1.5 text-[10px] font-black select-none cursor-pointer"
              >
                <span className={language === 'sk' ? 'opacity-0' : 'opacity-60 text-slate-500'}>SK</span>
                <span className={language === 'en' ? 'opacity-0' : 'opacity-60 text-slate-500'}>EN</span>
                <div
                  className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-indigo-600 text-white shadow-md flex items-center justify-center text-[10px] font-extrabold transition-transform duration-300 ${
                    language === 'en' ? 'translate-x-6 bg-purple-600' : 'translate-x-0'
                  }`}
                >
                  {language.toUpperCase()}
                </div>
              </button>
            </div>

            {/* 2. TMAVÝ / SVETLÝ REŽIM */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {language === 'sk' ? 'Tmavý režim' : 'Dark Mode'}
              </span>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-13 h-7 rounded-full bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700 relative transition-colors duration-300 flex items-center justify-between px-1.5 select-none cursor-pointer"
                aria-label="Toggle theme"
              >
                <Sun size={12} className="text-amber-500" />
                <Moon size={12} className="text-indigo-400" />
                <div
                  className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-6 border border-slate-700' : 'translate-x-0 border border-slate-200'
                  }`}
                >
                  {theme === 'dark' ? (
                    <Moon size={12} className="text-indigo-400 fill-indigo-400" />
                  ) : (
                    <Sun size={12} className="text-amber-500 fill-amber-400" />
                  )}
                </div>
              </button>
            </div>

            {/* 3. NASTAVENIA (LEN PO PRIHLÁSENÍ) */}
            {sessionUser && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Settings size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span>{language === 'sk' ? 'Nastavenia účtu' : 'Account Settings'}</span>
                </span>
                <span className="text-[10px] text-slate-400">➔</span>
              </button>
            )}

            {/* 4. PRIHLÁSENIE / ODHLÁSENIE */}
            {!sessionUser ? (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <User size={16} />
                <span>{t.navLogin}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  setIsMobileMenuOpen(false);
                  await supabase.auth.signOut();
                  window.location.href = '/';
                }}
                className="w-full py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={16} />
                <span>{t.navLogout}</span>
              </button>
            )}

          </div>
        )}
      </nav>

      {/* MODALY */}
      {sessionUser && isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          userId={sessionUser.id}
          language={language}
          toggleLanguage={toggleLanguage}
          theme={theme}
          toggleTheme={toggleTheme}
          t={t}
        />
      )}

      <UserHistoryModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        sessionUser={sessionUser}
        language={language}
      />

      <AdminUserManagementModal
        isOpen={isAdminUserMgmtOpen}
        onClose={() => setIsAdminUserMgmtOpen(false)}
        language={language}
      />
    </>
  );
}