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

import { 
  Calendar, CreditCard, ShieldCheck, User, Sun, Moon, LogOut, Settings,
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
      <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 font-sans">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          
          {/* UŽÍVATEĽ / HOSŤ VĽAVO */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight min-w-0 hover:opacity-85 transition active:scale-98 text-left"
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
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[180px] leading-tight">
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
                <span className="font-extrabold text-xs text-slate-700 dark:text-slate-200 tracking-tight truncate max-w-[140px] sm:max-w-none">
                  {language === 'sk' ? 'Hosť Rezervačný systém - Masáž' : 'Guest Reservation System - Massage'}
                </span>
              </>
            )}
          </button>

          {/* HLAVNÁ NAVIGÁCIA */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                pathname === '/'
                  ? 'bg-[#0e74a4] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar size={14} />
              <span className="inline">{t.navReservation}</span>
            </Link>

            {isAdmin ? (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  pathname === '/admin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldCheck size={14} />
                <span>{language === 'sk' ? 'Admin Panel' : 'Admin Panel'}</span>
              </Link>
            ) : (
              <Link
                href="/profil"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  pathname === '/profil'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CreditCard size={14} />
                <span>{t.navLoyaltyCard}</span>
              </Link>
            )}
          </div>

          {/* iOS STYLE PREPÍNAČE VPRAVO */}
          <div className="flex items-center gap-2">
            
            {/* 🇸🇰/🇬🇧 iOS PREPÍNAČ JAZYKA */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="w-13 h-7 rounded-full bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700 relative transition-colors duration-300 flex items-center justify-between px-1.5 text-[10px] font-black select-none"
              title={language === 'sk' ? 'Switch to English' : 'Prepnúť na Slovenčinu'}
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

            {/* ☀️/🌙 iOS PREPÍNAČ TÉMY */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-13 h-7 rounded-full bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700 relative transition-colors duration-300 flex items-center justify-between px-1.5 select-none"
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

            {/* NASTAVENIA (LEN PO PRIHLÁSENÍ) */}
            {sessionUser && (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-95 shadow-sm"
                title={language === 'sk' ? 'Nastavenia' : 'Settings'}
              >
                <Settings size={14} />
              </button>
            )}

            {!sessionUser ? (
              <Link
                href="/login"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
              >
                <User size={14} />
                <span className="hidden sm:inline">{t.navLogin}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/';
                }}
                className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition shadow-sm"
                title={t.navLogout}
              >
                <LogOut size={14} />
              </button>
            )}
          </div>

        </div>
      </nav>

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
    </>
  );
}