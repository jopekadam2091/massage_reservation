'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAvatar } from '../lib/AvatarContext';
import { useLanguage } from '../lib/LanguageContext';
import { useTheme } from '../lib/ThemeContext';
import ModernBirthdayPicker from './ModernBirthdayPicker';
import DeleteAccountModal from './DeleteAccountModal';
import LuckyWheelModal from './LuckyWheelModal';
import BlobatarAvatar, { 
  AVAILABLE_EXPRESSIONS, 
  parseAvatarString 
} from './BlobatarAvatar';
import { 
  X, User, Copy, Check, UserPlus, Loader2, 
  Bell, Smartphone, Cake, Trash2, AlertTriangle, Palette, ShieldAlert, Sparkles, Gift, Crown,
  Sun, Moon, Pencil, Percent, Share2
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_icon: string | null;
  avatar_color: string | null;
  referral_code: string | null;
  referred_by: string | null;
  email_notifications?: boolean;
  push_notifications?: boolean;
  hide_pwa_prompt?: boolean;
  birth_date?: string | null;
}

interface GiftRecord {
  id: string;
  gift_type: string;
  custom_code: string | null;
  used: boolean;
  created_at: string;
  used_at?: string | null;
  revoked_at?: string | null;
}

interface ReferredPerson {
  id: string;
  full_name: string | null;
  email: string;
  hasMassage: boolean;
}

interface ReferrerInfo {
  full_name: string | null;
  email: string;
}

const AVAILABLE_COLORS = [
  { 
    name: 'Farba systému (Auto)', 
    nameEn: 'System color (Auto)', 
    hex: 'auto', 
    gradient: 'conic-gradient(from 180deg at 50% 50%, #10b981 0deg, #0ea5e9 72deg, #8b5cf6 144deg, #f43f5e 216deg, #f59e0b 288deg, #10b981 360deg)',
    isAuto: true 
  },
  { name: 'Emerald', nameEn: 'Emerald', hex: '#10b981', gradient: 'linear-gradient(135deg, hsl(140,95%,62%), hsl(172,90%,40%))' },
  { name: 'Kráľovská modrá', nameEn: 'Royal Blue', hex: '#1d4ed8', gradient: 'linear-gradient(135deg, hsl(203,95%,62%), hsl(237,90%,40%))' },
  { name: 'Rose', nameEn: 'Rose', hex: '#f43f5e', gradient: 'linear-gradient(135deg, hsl(328,95%,62%), hsl(357,90%,40%))' },
  { name: 'Amber', nameEn: 'Amber', hex: '#f59e0b', gradient: 'linear-gradient(135deg, hsl(20,95%,62%), hsl(48,90%,40%))' },
  { name: 'Sky', nameEn: 'Sky', hex: '#0ea5e9', gradient: 'linear-gradient(135deg, hsl(188,95%,62%), hsl(214,90%,40%))' },
  { name: 'Violet', nameEn: 'Violet', hex: '#8b5cf6', gradient: 'linear-gradient(135deg, hsl(238,95%,62%), hsl(302,90%,40%))' },
  { name: 'Teal', nameEn: 'Teal', hex: '#14b8a6', gradient: 'linear-gradient(135deg, #2dd4bf, #0f766e)' },
  { name: 'Coral', nameEn: 'Coral', hex: '#ff6b6b', gradient: 'linear-gradient(135deg, #ff6b6b, #ee5253)' },
];

type SettingsTab = 'avatar' | 'profile' | 'benefits' | 'notifications' | 'danger';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  language: string;
  toggleLanguage: () => void;
  theme: string;
  toggleTheme: () => void;
  t: any;
};

export default function SettingsModal({
  isOpen,
  onClose,
  userId,
  language: propLanguage,
  toggleLanguage: propToggleLanguage,
  theme: propTheme,
  toggleTheme: propToggleTheme,
  t: propT,
}: Props) {
  const { avatarIcon, avatarColor, setAvatarSettings } = useAvatar();
  const { language: ctxLanguage, setLanguage, t: ctxT } = useLanguage();
  const { theme: ctxTheme, setTheme } = useTheme();

  const language = ctxLanguage || propLanguage || 'sk';
  const theme = ctxTheme || propTheme || 'dark';
  const currentLang = language;
  const currentTheme = theme;
  const t = ctxT || propT;

  const [activeTab, setActiveTab] = useState<SettingsTab>('avatar');
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);
  const [referredPeople, setReferredPeople] = useState<ReferredPerson[]>([]);
  const [birthDate, setBirthDate] = useState<string>('');
  const [savingBirthDate, setSavingBirthDate] = useState<boolean>(false);
  const [birthDateMsg, setBirthDateMsg] = useState<string>('');
  const [pushStatusMsg, setPushStatusMsg] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [customSeedInput, setCustomSeedInput] = useState<string>('');
  const [gifts, setGifts] = useState<GiftRecord[]>([]);
  const [copiedGiftCodeId, setCopiedGiftCodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setLoading(true);

    const loadSettingsData = async () => {
      try {
        let profileData: any = null;
        const { data: pData, error: profileErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_icon, avatar_color, referral_code, referred_by, email_notifications, hide_pwa_prompt, birth_date')
          .eq('id', userId)
          .maybeSingle();

        profileData = pData;

        if (profileErr || !profileData) {
          const { data: fallbackData } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_icon, avatar_color, referral_code, referred_by')
            .eq('id', userId)
            .maybeSingle();
          profileData = fallbackData ? { ...fallbackData, email_notifications: true, hide_pwa_prompt: false, birth_date: null } : null;
        }

        if (!profileData) {
          const { data: { user } } = await supabase.auth.getUser();
          profileData = {
            id: userId,
            full_name: user?.user_metadata?.full_name || 'Používateľ',
            email: user?.email || '',
            avatar_icon: 'User',
            avatar_color: '#10b981',
            referral_code: null,
            referred_by: null,
          };
        }

        if (profileData && isMounted) {
          const localPush = localStorage.getItem('push_notifications_enabled') === 'true';
          setProfile({
            ...profileData,
            push_notifications: localPush,
          });
          setBirthDate(profileData.birth_date || '');
          setAvatarSettings(profileData.avatar_icon || 'User', profileData.avatar_color || '#10b981');
          setCustomSeedInput(profileData.full_name || parseAvatarString(profileData.avatar_icon).seed || '');
          
          if (profileData.hide_pwa_prompt !== undefined) {
            localStorage.setItem('hide_pwa_prompt', String(profileData.hide_pwa_prompt));
            localStorage.setItem('pwa_prompt_dismissed', String(profileData.hide_pwa_prompt));
          }

          if (profileData.referred_by) {
            const { data: referrerData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', profileData.referred_by)
              .maybeSingle();
            if (referrerData && isMounted) setReferrerInfo(referrerData);
          }

          const { data: referredRaw } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('referred_by', userId);

          if (referredRaw && referredRaw.length > 0 && isMounted) {
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

          const { data: giftsData } = await supabase
            .from('gifts')
            .select('id, gift_type, custom_code, used, created_at, used_at, revoked_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (giftsData && isMounted) {
            setGifts(giftsData);
          }
        }
      } catch (err) {
        console.error('Chyba pri načítavaní nastavení:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSettingsData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const currentParsed = parseAvatarString(avatarIcon || profile?.email);

  const handleNameChange = (newName: string) => {
    setCustomSeedInput(newName);
    const combined = currentParsed.expression && currentParsed.expression !== 'idle'
      ? `${newName.trim() || 'ZenFlow'}:${currentParsed.expression}`
      : (newName.trim() || 'ZenFlow');
    setAvatarSettings(combined, avatarColor);
  };

  const handleUpdateExpression = async (expr: string) => {
    if (!profile?.id) return;
    const activeSeed = customSeedInput.trim() || currentParsed.seed;
    const combined = expr && expr !== 'idle' ? `${activeSeed}:${expr}` : activeSeed;

    setUpdatingAvatar(true);
    setAvatarSettings(combined, avatarColor);
    setProfile(prev => prev ? { ...prev, avatar_icon: combined } : null);

    try {
      await supabase
        .from('profiles')
        .update({ avatar_icon: combined, avatar_color: avatarColor })
        .eq('id', profile.id);
    } catch (e) {
      console.error('Chyba pri ukladaní výrazu:', e);
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleSaveNameDirectly = async (nameToSave: string) => {
    const trimmed = nameToSave.trim();
    if (!trimmed || !profile?.id) return;

    const combined = currentParsed.expression && currentParsed.expression !== 'idle'
      ? `${trimmed}:${currentParsed.expression}`
      : trimmed;

    setAvatarSettings(combined, avatarColor);
    setProfile(prev => prev ? { ...prev, full_name: trimmed, avatar_icon: combined } : null);

    try {
      await supabase
        .from('profiles')
        .update({ 
          avatar_icon: combined, 
          avatar_color: avatarColor,
          full_name: trimmed 
        })
        .eq('id', profile.id);

      window.dispatchEvent(new Event('profileUpdated'));
    } catch (e) {
      console.error('Chyba pri ukladaní mena:', e);
    }
  };

  const tabsConfig = [
    {
      id: 'avatar' as SettingsTab,
      label: language === 'sk' ? 'Avatar' : 'Avatar',
      icon: Palette,
    },
    {
      id: 'profile' as SettingsTab,
      label: language === 'sk' ? 'Profil' : 'Profile',
      icon: User,
    },
    {
      id: 'benefits' as SettingsTab,
      label: language === 'sk' ? 'Benefity' : 'Benefits',
      icon: Gift,
    },
    {
      id: 'notifications' as SettingsTab,
      label: language === 'sk' ? 'Upozornenia' : 'Alerts',
      icon: Bell,
    },
    {
      id: 'danger' as SettingsTab,
      label: language === 'sk' ? 'Účet' : 'Account',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B0D22]/60 dark:bg-[#010314]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans animate-fadeIn text-[#1E293B] dark:text-[#DDE0F2]">
      <div className="w-full max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl space-y-5 relative">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-white transition cursor-pointer p-1"
        >
          <X size={18} />
        </button>

        {loading || !profile ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#64748B] dark:text-[#C7CAE0]/60">
            <Loader2 size={24} className="animate-spin text-[#6633EE]" />
            <p className="text-xs font-normal">{t.loading || 'Načítavam nastavenia...'}</p>
          </div>
        ) : (
          <>
            {/* Modal Title & User summary with Live Editable Name and Mood */}
              <div className="flex items-center gap-3 pr-8 pb-1">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm shrink-0 transition-all duration-300 p-0.5 overflow-hidden relative"
                >
                  <BlobatarAvatar
                    name={avatarIcon || profile.email || 'ZenFlow'}
                    color={avatarColor}
                    size={44}
                    animate="always"
                    className="rounded-full"
                  />
                  {updatingAvatar && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-full flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin text-[#6633EE] dark:text-[#A78BFA]" />
                    </div>
                  )}
                </div>

                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex items-center group max-w-[200px] sm:max-w-[240px]">
                      <input
                        type="text"
                        value={customSeedInput}
                        onChange={(e) => handleNameChange(e.target.value)}
                        onBlur={() => handleSaveNameDirectly(customSeedInput)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNameDirectly(customSeedInput);
                        }}
                        placeholder={language === 'sk' ? 'Zadaj svoje meno...' : 'Enter your name...'}
                        className="w-full font-bold text-sm sm:text-base text-[#0B0D22] dark:text-[#FFFFFF] bg-transparent hover:bg-slate-100/70 dark:hover:bg-[#010314]/60 focus:bg-slate-100 dark:focus:bg-[#010314] border-b border-dashed border-[#CBD5E1] dark:border-[#2B2F49] hover:border-[#6633EE] focus:border-[#6633EE] dark:focus:border-[#A78BFA] px-1 py-0.5 rounded focus:outline-none transition-all pr-6 truncate"
                        title={language === 'sk' ? 'Klikni pre úpravu mena' : 'Click to edit name'}
                      />
                      <Pencil size={12} className="absolute right-1 text-[#64748B] dark:text-[#C7CAE0]/50 pointer-events-none group-hover:text-[#6633EE] transition-colors" />
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-[#6633EE]/15 border border-[#6633EE]/30 text-[#6633EE] dark:text-[#A78BFA] text-[9px] font-bold uppercase tracking-wider shrink-0">
                      {currentParsed.expression || 'idle'}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60 font-normal truncate mt-0.5">{profile.email}</p>
                </div>
              </div>

              {/* 🚀 5-TAB CLEAN BALANCED RESPONSIVE BAR */}
              <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] overflow-x-auto no-scrollbar">
                {tabsConfig.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isDanger = tab.id === 'danger';

                  return (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-lg text-[10.5px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer text-center whitespace-nowrap select-none ${
                        isActive
                          ? isDanger
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white dark:bg-[#0B0D22] text-[#6633EE] dark:text-[#FFFFFF] shadow-xs border border-[#E2E8F0] dark:border-[#2B2F49]'
                          : isDanger
                          ? 'text-rose-500 dark:text-[#FF5A7A] hover:bg-rose-50 dark:hover:bg-rose-950/30'
                          : 'text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white'
                      }`}
                    >
                      <TabIcon size={12} className={`shrink-0 ${isActive ? (isDanger ? 'text-white' : 'text-[#6633EE] dark:text-[#A78BFA]') : ''}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 📦 STABLE HEIGHT TAB CONTENT CONTAINER WITH SMOOTH CROSSFADE */}
              <div className="min-h-[420px] transition-all duration-300">
                {/* ============================================================= */}
                {/* TAB 1: VZHĽAD (BLOBATAR AVATAR & FARBA)                       */}
                {/* ============================================================= */}
                {activeTab === 'avatar' && (
                  <div key="avatar" className="space-y-4 text-left animate-fadeIn">
                    {/* 😊 NÁLADA A VÝRAZ TVÁRE (MOOD & FACIAL EXPRESSION) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-[#6633EE] dark:text-[#A78BFA]">
                          {language === 'sk' ? 'Nálada a výraz tváre' : 'Mood & Facial Expression'}
                        </label>
                        <span className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 capitalize">
                          {AVAILABLE_EXPRESSIONS.find(e => e.id === currentParsed.expression)?.label || currentParsed.expression}
                        </span>
                      </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {AVAILABLE_EXPRESSIONS.map((expr) => {
                        const isSelected = currentParsed.expression === expr.id;
                        const ExprIcon = expr.icon;
                        return (
                          <button
                            type="button"
                            key={expr.id}
                            disabled={updatingAvatar}
                            onClick={() => handleUpdateExpression(expr.id)}
                            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-medium border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#6633EE] text-white border-[#6633EE] shadow-xs'
                                : 'bg-slate-50 dark:bg-[#010314] border-[#E2E8F0] dark:border-[#2B2F49] text-[#64748B] dark:text-[#C7CAE0]/80 hover:border-[#6633EE]/40 hover:text-[#0B0D22] dark:hover:text-white'
                            }`}
                          >
                            <ExprIcon size={14} className={isSelected ? 'text-white' : 'text-[#6633EE] dark:text-[#A78BFA]'} />
                            <span className="truncate">{language === 'sk' ? expr.label : expr.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 🎨 VÝBER AKCENTOVEJ FARBY */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-[#6633EE] dark:text-[#A78BFA]">
                        {t.chooseColor}
                      </label>
                      <span className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60">
                        {avatarColor === 'auto' || !avatarColor || avatarColor === 'system'
                          ? (language === 'sk' ? 'Farba systému (Auto)' : 'System color (Auto)')
                          : AVAILABLE_COLORS.find(c => c.hex === avatarColor)?.name || avatarColor}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {AVAILABLE_COLORS.map((color) => {
                        const isSelected = color.isAuto 
                          ? (avatarColor === 'auto' || !avatarColor || avatarColor === 'system')
                          : avatarColor === color.hex;

                        return (
                          <button
                            type="button"
                            key={color.hex}
                            disabled={updatingAvatar}
                            onClick={async () => {
                              const newColor = color.hex;
                              setUpdatingAvatar(true);
                              setAvatarSettings(avatarIcon, newColor);

                              await supabase
                                .from('profiles')
                                .update({ avatar_icon: avatarIcon, avatar_color: newColor })
                                .eq('id', profile.id);
                              setUpdatingAvatar(false);
                            }}
                            className={`w-9 h-9 rounded-full transition-all active:scale-95 border-2 shadow-sm cursor-pointer relative flex items-center justify-center ${
                              isSelected
                                ? 'border-[#0B0D22] dark:border-white scale-110 shadow-[0_0_12px_rgba(102,51,238,0.6)] ring-2 ring-[#6633EE]'
                                : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                            }`}
                            style={{ background: color.gradient }}
                            title={language === 'sk' ? color.name : (color.nameEn || color.name)}
                          >
                            {isSelected && (
                              <Check size={14} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] stroke-[3]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 2: PROFIL (JAZYK, DARK MODE, NARODENINY, REFERRAL)        */}
              {/* ============================================================= */}
              {activeTab === 'profile' && (
                <div key="profile" className="space-y-4 text-left animate-fadeIn">
                  {/* 1. JAZYK A REŽIM ZOBRAZENIA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Jazyk */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-1.5">
                      <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#C7CAE0]/60 uppercase tracking-wider block">
                        {language === 'sk' ? 'Jazyk aplikácie' : 'Language'}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLanguage('sk')}
                          className={`px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                            language === 'sk'
                              ? 'bg-[#6633EE] text-white shadow-xs font-bold'
                              : 'bg-white dark:bg-[#0B0D22] text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white border border-[#E2E8F0] dark:border-[#2B2F49]'
                          }`}
                        >
                          <span>🇸🇰</span>
                          <span>Slovenčina</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage('en')}
                          className={`px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                            language === 'en'
                              ? 'bg-[#6633EE] text-white shadow-xs font-bold'
                              : 'bg-white dark:bg-[#0B0D22] text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white border border-[#E2E8F0] dark:border-[#2B2F49]'
                          }`}
                        >
                          <span>🇬🇧</span>
                          <span>English</span>
                        </button>
                      </div>
                    </div>

                    {/* Téma (Dark / Light) */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-1.5">
                      <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#C7CAE0]/60 uppercase tracking-wider block">
                        {language === 'sk' ? 'Režim vzhľadu' : 'Display Theme'}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-[#6633EE] text-white shadow-xs font-bold'
                              : 'bg-white dark:bg-[#0B0D22] text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white border border-[#E2E8F0] dark:border-[#2B2F49]'
                          }`}
                        >
                          <Moon size={13} />
                          <span>{language === 'sk' ? 'Tmavý' : 'Dark'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                            theme === 'light'
                              ? 'bg-[#6633EE] text-white shadow-xs font-bold'
                              : 'bg-white dark:bg-[#0B0D22] text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white border border-[#E2E8F0] dark:border-[#2B2F49]'
                          }`}
                        >
                          <Sun size={13} />
                          <span>{language === 'sk' ? 'Svetlý' : 'Light'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. DÁTUM NARODENÍN (KOMPAKTNÝ 1-RIADKOVÝ LAYOUT) */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      
                      {/* ĽAVÁ STRANA: INFO O NARODENINÁCH */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-full bg-[#EC4899]/15 text-[#EC4899] shrink-0">
                          <Cake size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] truncate">
                            {language === 'sk' ? 'Dátum narodenín' : 'Date of Birth'}
                          </p>
                          <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/70 font-normal truncate">
                            {birthDate ? (
                              <span className="font-semibold text-[#EC4899]">
                                {(() => {
                                  const p = birthDate.split('-');
                                  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : birthDate;
                                })()}
                              </span>
                            ) : (
                              language === 'sk' ? 'Špeciálny darček & odznak' : 'Birthday gift & badge'
                            )}
                          </p>
                        </div>
                      </div>

                      {/* PRAVÁ STRANA: KOMPAKTNÝ VÝBER (DEŇ, MESIAC, ROK) + TLAČIDLO ULOŽIŤ */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <ModernBirthdayPicker
                          value={birthDate}
                          onChange={(newIso) => setBirthDate(newIso)}
                          disabled={savingBirthDate}
                          language={language}
                          compact
                        />

                        <button
                          type="button"
                          disabled={savingBirthDate || !birthDate}
                          onClick={async () => {
                            setSavingBirthDate(true);
                            setBirthDateMsg('');
                            try {
                              const res = await fetch('/api/user/settings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: profile.id, birth_date: birthDate }),
                              });
                              if (res.ok) {
                                setBirthDateMsg(language === 'sk' ? 'Uložené! 🎉' : 'Saved! 🎉');
                                setTimeout(() => setBirthDateMsg(''), 3000);
                              }
                            } catch (err) {
                              console.error('Chyba ukladania narodenín:', err);
                            } finally {
                              setSavingBirthDate(false);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#6633EE] hover:bg-[#5522DD] text-white text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 h-[30px]"
                          title={language === 'sk' ? 'Uložiť dátum narodenín' : 'Save birthday date'}
                        >
                          <Check size={13} />
                          <span>{savingBirthDate ? '...' : (language === 'sk' ? 'Uložiť' : 'Save')}</span>
                        </button>
                      </div>
                    </div>

                    {birthDateMsg && (
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                        <Check size={13} />
                        <span>{birthDateMsg}</span>
                      </p>
                    )}
                  </div>

                  {/* 3. ODPORÚČACÍ REFERRAL SYSTÉM (2-STĹPCOVÝ KOMPAKTNÝ LAYOUT + 5 SLOTOV) */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA]">
                          <Share2 size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF]">
                            {language === 'sk' ? 'Odporuč priateľa & Získaj zľavu' : 'Refer a Friend & Get Reward'}
                          </p>
                          <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/70 font-normal">
                            {language === 'sk'
                              ? 'Po 1. masáži priateľa získate obaja zľavu 10%!'
                              : 'When a friend finishes 1st massage, both get 10% off!'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2-Column Grid: Left = Your code, Right = 5 Slots */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start pt-0.5">
                      
                      {/* ĽAVÁ STRANA: VÁŠ KÓD & ODPORÚČATEĽ */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49]">
                          <div className="min-w-0">
                            <p className="text-[9px] text-[#64748B] dark:text-[#C7CAE0]/60 uppercase font-medium">
                              {language === 'sk' ? 'Váš kód' : 'Your Code'}
                            </p>
                            <p className="font-mono font-bold text-xs text-[#6633EE] dark:text-[#A78BFA] tracking-wider truncate">
                              {profile.referral_code || '—'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!profile.referral_code) return;
                              try {
                                await navigator.clipboard.writeText(profile.referral_code);
                                setCodeCopied(true);
                                setTimeout(() => setCodeCopied(false), 2000);
                              } catch {}
                            }}
                            className="p-1.5 rounded-md text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#6633EE] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#010314] transition-all cursor-pointer active:scale-90 shrink-0"
                            title={language === 'sk' ? 'Kopírovať kód' : 'Copy code'}
                          >
                            {codeCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>

                        {referrerInfo && (
                          <div className="text-[10px] text-[#64748B] dark:text-[#C7CAE0] font-normal px-1">
                            {language === 'sk' ? 'Odporučil vás: ' : 'Referred by: '}
                            <strong className="text-[#0B0D22] dark:text-[#FFFFFF]">
                              {referrerInfo.full_name || referrerInfo.email}
                            </strong>
                          </div>
                        )}

                        <div className="p-2 rounded-lg bg-white/60 dark:bg-[#0B0D22]/60 border border-[#E2E8F0]/70 dark:border-[#2B2F49]/40 text-[10px] text-[#64748B] dark:text-[#C7CAE0]/70">
                          <p className="font-medium text-[#0B0D22] dark:text-white mb-0.5">
                            {language === 'sk' ? 'Ako to funguje?' : 'How it works?'}
                          </p>
                          <p>
                            {language === 'sk' 
                              ? 'Priateľ pri registrácii zadá váš kód. Zľava sa aktivuje automaticky po jeho návšteve.'
                              : 'Friend enters your code at signup. 10% discount activates automatically after their session.'}
                          </p>
                        </div>
                      </div>

                      {/* PRAVÁ STRANA: 5 SLOTOV PRIATEĽOV AKO STATUSOVÉ TAGY (CHIPY) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-0.5">
                          <p className="text-[11px] font-semibold text-[#0B0D22] dark:text-[#FFFFFF]">
                            {language === 'sk' ? 'Priatelia (max 5):' : 'Friends (max 5):'}
                          </p>
                          <span className="text-[10px] font-mono text-[#64748B] dark:text-[#C7CAE0]/60">
                            {referredPeople.filter(p => p.hasMassage).length} / 5
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const friend = referredPeople[idx];
                            const isCompleted = friend?.hasMassage;
                            const isPending = friend && !friend.hasMassage;
                            const displayName = friend ? (friend.full_name || friend.email.split('@')[0]) : null;

                            if (isCompleted) {
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold shadow-2xs"
                                  title={`${displayName} - ${language === 'sk' ? 'Absolvoval masáž (zľava aktívna)' : 'Completed massage'}`}
                                >
                                  <Check size={11} className="text-emerald-500 shrink-0 stroke-[2.5]" />
                                  <span className="truncate max-w-[100px]">{displayName}</span>
                                </span>
                              );
                            }

                            if (isPending) {
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold shadow-2xs"
                                  title={`${displayName} - ${language === 'sk' ? 'Čaká na masáž' : 'Pending massage'}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                                  <span className="truncate max-w-[100px]">{displayName}</span>
                                </span>
                              );
                            }

                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#010314] border border-dashed border-slate-300 dark:border-[#2B2F49] text-[#64748B]/60 dark:text-[#C7CAE0]/40 text-[10.5px] font-medium select-none"
                                title={language === 'sk' ? `Voľný slot ${idx + 1}` : `Free slot ${idx + 1}`}
                              >
                                <span>+ {language === 'sk' ? 'Voľný slot' : 'Free slot'}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            {/* ============================================================= */}
            {/* TAB 3: BENEFITY (KOLO ŠŤASTIA, DARČEKY & VIP VÝHODY)          */}
            {/* ============================================================= */}
            {activeTab === 'benefits' && (
              <div key="benefits" className="space-y-4 text-left animate-fadeIn">
                {/* Pútavá karta Kolesa Šťastia */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#6633EE]/15 to-[#EC4899]/15 border border-amber-500/30 shadow-md space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-[#0F172A] flex items-center justify-center font-bold shadow-md shrink-0">
                        <Sparkles size={22} className="animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-[#0B0D22] dark:text-white truncate">
                            {language === 'sk' ? 'Denné Kolo Šťastia' : 'Daily Wheel of Fortune'}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-300 text-[9px] font-extrabold uppercase shrink-0">
                            1x denne
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/80 font-normal">
                          {language === 'sk' ? 'Roztočte koleso a vyhrajte zľavu, darček alebo pečiatku.' : 'Spin to win instant discounts, gifts or stamps.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsWheelOpen(true)}
                    className="w-full py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#0F172A] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <Sparkles size={14} />
                    <span>{language === 'sk' ? 'Roztočiť Kolo Šťastia' : 'Spin Lucky Wheel'}</span>
                  </button>
                </div>

                {/* 🎁 MOJE AKTÍVNE DARČEKY A ZĽAVOVÉ KÓDY */}
                {(() => {
                  const activeGiftsList = gifts.filter((g) => !g.used && !g.revoked_at);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#6633EE] dark:text-[#A78BFA] block uppercase tracking-wider">
                          {language === 'sk' ? 'Moje aktívne darčeky & zľavy' : 'My Active Gifts & Discounts'}
                        </label>
                        {activeGiftsList.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            {activeGiftsList.length} {language === 'sk' ? 'aktívne' : 'active'}
                          </span>
                        )}
                      </div>

                      {activeGiftsList.length > 0 ? (
                        <div className="divide-y divide-[#E2E8F0] dark:divide-[#2B2F49]/60 max-h-48 overflow-y-auto no-scrollbar pr-0.5">
                          {activeGiftsList.map((g) => {
                            const is5Pct = g.custom_code?.startsWith('KOLO5');
                            const is10Pct = g.custom_code?.startsWith('KOLO10') || g.custom_code === 'KOLO10PCT';
                            const is15Pct = g.custom_code?.startsWith('KOLO15');
                            const isGift = g.custom_code?.startsWith('DARCEK') || g.gift_type === 'next_visit_gift';

                            let benefitTitle = language === 'sk' ? 'Zľava na masáž' : 'Massage Discount';
                            if (is5Pct) benefitTitle = language === 'sk' ? '+ 5% Zľava na masáž' : '+ 5% Massage Discount';
                            else if (is10Pct) benefitTitle = language === 'sk' ? '+ 10% Zľava na masáž' : '+ 10% Massage Discount';
                            else if (is15Pct) benefitTitle = language === 'sk' ? '+ 15% Zľava na masáž' : '+ 15% Massage Discount';
                            else if (isGift) benefitTitle = language === 'sk' ? 'Darček k masáži' : 'Massage Gift';

                            return (
                              <div
                                key={g.id}
                                className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-2"
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {isGift ? (
                                      <Gift size={13} className="text-amber-500 dark:text-amber-400 shrink-0" />
                                    ) : (
                                      <Percent size={13} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                                    )}
                                    <span className="font-bold text-xs text-[#0B0D22] dark:text-white truncate">
                                      {benefitTitle}
                                    </span>
                                  </div>

                                  {g.custom_code && (
                                    <div className="flex items-center gap-2 pl-4">
                                      <span className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 uppercase font-medium tracking-wider">
                                        {language === 'sk' ? 'Kód:' : 'Code:'}
                                      </span>
                                      <span className="font-mono text-xs font-bold text-[#6633EE] dark:text-[#A78BFA] tracking-wider">
                                        {g.custom_code}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {g.custom_code && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!g.custom_code) return;
                                        try {
                                          await navigator.clipboard.writeText(g.custom_code);
                                          setCopiedGiftCodeId(g.id);
                                          setTimeout(() => setCopiedGiftCodeId(null), 2000);
                                        } catch {}
                                      }}
                                      className="p-1.5 rounded-lg text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#6633EE] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#010314] transition-all cursor-pointer active:scale-90"
                                      title={language === 'sk' ? 'Kopírovať kód' : 'Copy code'}
                                    >
                                      {copiedGiftCodeId === g.id ? (
                                        <Check size={16} className="text-emerald-500" />
                                      ) : (
                                        <Copy size={16} />
                                      )}
                                    </button>
                                  )}

                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                                    {language === 'sk' ? 'Pripravené' : 'Ready'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-center">
                          <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/70">
                            {language === 'sk'
                              ? 'Zatiaľ nemáte žiadne aktívne zľavové kódy z kolesa.'
                              : 'You have no active discount codes from the wheel yet.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 🌟 INFORMAČNÁ TABUĽKA: VIP SENSUAL PROGRAM */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-amber-500/15 text-amber-500">
                      <Crown size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF]">
                        {language === 'sk' ? 'VIP Sensual Program' : 'VIP Sensual Program'}
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 font-normal">
                        {language === 'sk'
                          ? 'Automatické výhody pre verných klientov'
                          : 'Automatic benefits for frequent clients'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-0.5">
                      <p className="font-semibold text-[#6633EE] dark:text-[#A78BFA] flex items-center gap-1">
                        <Sparkles size={12} />
                        <span>{language === 'sk' ? 'VIP Klient' : 'VIP Client'}</span>
                      </p>
                      <p className="text-[#64748B] dark:text-[#C7CAE0]/70 text-[10px]">
                        {language === 'sk' ? 'Od 5 absolvovaných návštev' : 'From 5 completed visits'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-0.5">
                      <p className="font-semibold text-amber-500 dark:text-amber-400 flex items-center gap-1">
                        <Crown size={12} />
                        <span>{language === 'sk' ? 'Vernostné Pečiatky' : 'Loyalty Stamps'}</span>
                      </p>
                      <p className="text-[#64748B] dark:text-[#C7CAE0]/70 text-[10px]">
                        {language === 'sk' ? '10. masáž zdarma s darčekom' : '10th massage free + gift'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: UPOZORNENIA & PWA APLIKÁCIA                            */}
            {/* ============================================================= */}
            {activeTab === 'notifications' && (
              <div key="notifications" className="space-y-3.5 text-left animate-fadeIn">
                {/* E-mailové notifikácie */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#6633EE]/10 text-[#6633EE] dark:text-[#A78BFA]">
                      <Bell size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF]">
                        {language === 'sk' ? 'E-mailové notifikácie' : 'Email notifications'}
                      </p>
                      <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 font-normal">
                        {language === 'sk' ? 'Potvrdenia termínov a zmeny storna' : 'Booking confirmations & updates'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const nextVal = !(profile.email_notifications ?? true);
                      setProfile({ ...profile, email_notifications: nextVal });

                      await supabase
                        .from('profiles')
                        .update({ email_notifications: nextVal })
                        .eq('id', profile.id);
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 relative transition-colors duration-300 cursor-pointer ${
                      (profile.email_notifications ?? true) ? 'bg-[#6633EE]' : 'bg-slate-200 dark:bg-[#0B0D22] border border-slate-300 dark:border-[#2B2F49]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                        (profile.email_notifications ?? true) ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Push notifikácie */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#6633EE]/10 text-[#6633EE] dark:text-[#A78BFA]">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF]">
                        {language === 'sk' ? 'Push notifikácie v prehliadači' : 'Browser Push notifications'}
                      </p>
                      <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 font-normal">
                        {language === 'sk' ? 'Pripomenutia termínov pred masážou' : 'Appointment reminders on your screen'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const nextVal = !profile.push_notifications;
                      if (nextVal && typeof window !== 'undefined' && 'Notification' in window) {
                        const perm = await Notification.requestPermission();
                        if (perm === 'granted') {
                          localStorage.setItem('push_notifications_enabled', 'true');
                          setProfile({ ...profile, push_notifications: true });
                          setPushStatusMsg(language === 'sk' ? 'Push notifikácie povolené!' : 'Push notifications enabled!');
                          setTimeout(() => setPushStatusMsg(''), 3000);
                        } else {
                          setPushStatusMsg(language === 'sk' ? 'Notifikácie boli v prehliadači zablokované.' : 'Notifications blocked in browser.');
                          setTimeout(() => setPushStatusMsg(''), 3500);
                        }
                      } else {
                        localStorage.setItem('push_notifications_enabled', 'false');
                        setProfile({ ...profile, push_notifications: false });
                      }
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 relative transition-colors duration-300 cursor-pointer ${
                      profile.push_notifications ? 'bg-[#6633EE]' : 'bg-slate-200 dark:bg-[#0B0D22] border border-slate-300 dark:border-[#2B2F49]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                        profile.push_notifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {pushStatusMsg && (
                  <p className="text-[11px] font-medium text-[#6633EE] dark:text-[#A78BFA] bg-[#6633EE]/10 dark:bg-[#6633EE]/15 p-2 rounded-lg border border-[#6633EE]/30">
                    {pushStatusMsg}
                  </p>
                )}

                {/* Skryť výzvu na inštaláciu PWA */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#6633EE]/10 text-[#6633EE] dark:text-[#A78BFA]">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF]">
                        {language === 'sk' ? 'Skryť výzvu na inštaláciu aplikácie' : 'Hide app install prompt'}
                      </p>
                      <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 font-normal">
                        {language === 'sk' ? 'Nezobrazovať spodný banner inštalácie' : 'Do not show bottom install banner'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const nextVal = !(profile.hide_pwa_prompt ?? false);
                      setProfile({ ...profile, hide_pwa_prompt: nextVal });

                      localStorage.setItem('hide_pwa_prompt', String(nextVal));
                      localStorage.setItem('pwa_prompt_dismissed', String(nextVal));

                      await supabase
                        .from('profiles')
                        .update({ hide_pwa_prompt: nextVal })
                        .eq('id', profile.id);
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 relative transition-colors duration-300 cursor-pointer ${
                      (profile.hide_pwa_prompt ?? false) ? 'bg-[#6633EE]' : 'bg-slate-200 dark:bg-[#0B0D22] border border-slate-300 dark:border-[#2B2F49]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                        (profile.hide_pwa_prompt ?? false) ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 5: NEBEZPEČNÁ ZÓNA (DANGER ZONE)                          */}
            {/* ============================================================= */}
            {activeTab === 'danger' && (
              <div key="danger" className="space-y-4 text-left animate-fadeIn">
                <div className="p-4 sm:p-5 rounded-xl bg-rose-50/90 dark:bg-[#FF5A7A]/10 border border-rose-200 dark:border-[#FF5A7A]/30 space-y-3">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-[#FF5A7A]">
                    <ShieldAlert size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {language === 'sk' ? 'Trvalé vymazanie účtu' : 'Permanent Account Deletion'}
                    </span>
                  </div>

                  <p className="text-xs text-[#475569] dark:text-[#C7CAE0] leading-relaxed font-normal">
                    {language === 'sk'
                      ? 'Vymazaním účtu natrvalo odstránite všetky svoje osobné údaje, vernostné pečiatky, uplatnené odmeny a históriu rezervácií. Tento krok nie je možné vrátiť späť.'
                      : 'Deleting your account permanently removes all personal data, stamps, rewards and booking history. This action cannot be undone.'}
                  </p>

                  <div className="p-3 rounded-lg bg-white dark:bg-[#010314] border border-rose-100 dark:border-[#2B2F49] text-[11px] text-[#64748B] dark:text-[#C7CAE0]/80 space-y-1">
                    <p className="font-semibold text-rose-600 dark:text-[#FF5A7A]">
                      {language === 'sk' ? 'Bezpečnostný postup:' : 'Security process:'}
                    </p>
                    <p>
                      {language === 'sk'
                        ? 'Na váš registrovaný e-mail odošleme 6-miestny overovací kód pre potvrdenie vymazania.'
                        : 'A 6-digit verification code will be sent to your email to verify deletion.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                  >
                    <Trash2 size={14} />
                    <span>{language === 'sk' ? 'Pokračovať na vymazanie účtu' : 'Proceed to Delete Account'}</span>
                  </button>
                </div>
              </div>
            )}
              </div>

            {/* Bottom Close Button */}
            <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#2B2F49]">
              <button
                type="button"
                onClick={onClose}
                className="w-full btn-primary text-xs uppercase tracking-wider font-medium"
              >
                {t.saveAndClose}
              </button>
            </div>

            {/* MODÁL PRE TRVALÉ VYMAZANIE ÚČTU CEZ GMAIL OTP */}
            {profile && (
              <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                userId={userId}
                userEmail={profile.email}
                language={language}
              />
            )}

            {/* MODÁL PRE DENNÉ KOLO ŠŤASTIA */}
            <LuckyWheelModal
              isOpen={isWheelOpen}
              onClose={() => setIsWheelOpen(false)}
              userId={userId}
              language={language}
            />
          </>
        )}
      </div>
    </div>
  );
}