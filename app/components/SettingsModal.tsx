'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAvatar } from '../lib/AvatarContext';
import ModernBirthdayPicker from './ModernBirthdayPicker';
import DeleteAccountModal from './DeleteAccountModal';
import LuckyWheelModal from './LuckyWheelModal';
import { 
  X, User, Flower2, Leaf, Sparkles as SparklesIcon, Sun, Moon, 
  Heart, Feather, Droplets, Coffee, Cat, Star, Copy, Check, UserPlus, Loader2, 
  Bell, Smartphone, Cake, Trash2, AlertTriangle, Palette, ShieldAlert, Sparkles, Gift, Crown
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

const ICON_MAP: Record<string, React.ElementType> = {
  User,
  Flower2,
  Leaf,
  Sparkles: SparklesIcon,
  Sun,
  Moon,
  Heart,
  Feather,
  Droplets,
  Coffee,
  Cat,
  Star,
};

const AVAILABLE_ICONS = Object.keys(ICON_MAP);

const AVAILABLE_COLORS = [
  { name: 'Emerald', hex: '#10b981', gradient: 'linear-gradient(135deg, hsl(140,95%,62%), hsl(172,90%,40%))' },
  { name: 'Kráľovská modrá', hex: '#1d4ed8', gradient: 'linear-gradient(135deg, hsl(203,95%,62%), hsl(237,90%,40%))' },
  { name: 'Rose', hex: '#f43f5e', gradient: 'linear-gradient(135deg, hsl(328,95%,62%), hsl(357,90%,40%))' },
  { name: 'Amber', hex: '#f59e0b', gradient: 'linear-gradient(135deg, hsl(20,95%,62%), hsl(48,90%,40%))' },
  { name: 'Sky', hex: '#0ea5e9', gradient: 'linear-gradient(135deg, hsl(188,95%,62%), hsl(214,90%,40%))' },
  { name: 'Violet', hex: '#8b5cf6', gradient: 'linear-gradient(135deg, hsl(238,95%,62%), hsl(302,90%,40%))' },
];

type SettingsTab = 'avatar' | 'benefits' | 'birthday' | 'notifications' | 'referral' | 'danger';

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
  language,
  toggleLanguage,
  theme,
  toggleTheme,
  t,
}: Props) {
  const { avatarIcon, avatarColor, setAvatarSettings } = useAvatar();

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

  const tabsConfig = [
    {
      id: 'avatar' as SettingsTab,
      label: language === 'sk' ? 'Vzhľad' : 'Avatar',
      icon: Palette,
    },
    {
      id: 'benefits' as SettingsTab,
      label: language === 'sk' ? 'Benefity' : 'Benefits',
      icon: Sparkles,
    },
    {
      id: 'birthday' as SettingsTab,
      label: language === 'sk' ? 'Narodeniny' : 'Birthday',
      icon: Cake,
    },
    {
      id: 'notifications' as SettingsTab,
      label: language === 'sk' ? 'Upozornenia' : 'Alerts',
      icon: Bell,
    },
    {
      id: 'referral' as SettingsTab,
      label: language === 'sk' ? 'Referral' : 'Referral',
      icon: UserPlus,
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
            {/* Modal Title & User summary */}
            <div className="flex items-center gap-3 pr-8 pb-1">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm shrink-0 transition-all duration-300"
                style={{ color: avatarColor }}
              >
                {(() => {
                  const IconComp = ICON_MAP[avatarIcon] || ICON_MAP['User'];
                  return <IconComp size={24} strokeWidth={1.8} />;
                })()}
              </div>
              <div className="text-left min-w-0">
                <h3 className="font-semibold text-[#0B0D22] dark:text-[#FFFFFF] text-base truncate">
                  {profile.full_name || t.guest}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60 font-normal truncate">{profile.email}</p>
              </div>
            </div>

            {/* 🚀 6-TAB CLEAN BALANCED RESPONSIVE GRID (ALL 6 TABS ALWAYS VISIBLE & NEVER CUT OFF) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49]">
              {tabsConfig.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDanger = tab.id === 'danger';

                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 py-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer text-center min-w-0 ${
                      isActive
                        ? isDanger
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#0B0D22] text-[#6633EE] dark:text-[#FFFFFF] shadow-xs border border-[#E2E8F0] dark:border-[#2B2F49]'
                        : isDanger
                        ? 'text-rose-500 dark:text-[#FF5A7A] hover:bg-rose-50 dark:hover:bg-rose-950/30'
                        : 'text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white'
                    }`}
                  >
                    <TabIcon size={13} className={`shrink-0 ${isActive ? (isDanger ? 'text-white' : 'text-[#6633EE] dark:text-[#A78BFA]') : ''}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ============================================================= */}
            {/* TAB 1: VZHĽAD (AVATAR & FARBA)                                */}
            {/* ============================================================= */}
            {activeTab === 'avatar' && (
              <div className="space-y-4 text-left animate-in fade-in duration-200">
                {/* Výber ikonky */}
                <div>
                  <label className="text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] block mb-2">
                    {t.chooseIcon}
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {AVAILABLE_ICONS.map((iconName) => {
                      const IconOption = ICON_MAP[iconName];
                      const isSelected = avatarIcon === iconName;

                      return (
                        <button
                          type="button"
                          key={iconName}
                          disabled={updatingAvatar}
                          onClick={async () => {
                            setUpdatingAvatar(true);
                            setAvatarSettings(iconName, avatarColor);

                            await supabase
                              .from('profiles')
                              .update({ avatar_icon: iconName, avatar_color: avatarColor })
                              .eq('id', profile.id);
                            setUpdatingAvatar(false);
                          }}
                          className={`h-12 rounded-xl flex items-center justify-center border bg-slate-50 dark:bg-[#010314] transition-all active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'border-[#6633EE] shadow-[0_0_12px_rgba(102,51,238,0.4)] font-semibold'
                              : 'border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE]/40 text-[#94A3B8] dark:text-[#C7CAE0]/50'
                          }`}
                          style={isSelected ? { color: avatarColor } : {}}
                        >
                          <IconOption size={22} strokeWidth={1.8} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Výber farby */}
                <div>
                  <label className="text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] block mb-2">
                    {t.chooseColor}
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        type="button"
                        key={color.hex}
                        disabled={updatingAvatar}
                        onClick={async () => {
                          setUpdatingAvatar(true);
                          setAvatarSettings(avatarIcon, color.hex);

                          await supabase
                            .from('profiles')
                            .update({ avatar_icon: avatarIcon, avatar_color: color.hex })
                            .eq('id', profile.id);
                          setUpdatingAvatar(false);
                        }}
                        className={`w-9 h-9 rounded-full transition active:scale-95 border-2 shadow-sm cursor-pointer ${
                          avatarColor === color.hex
                            ? 'border-[#0B0D22] dark:border-white scale-110 shadow-[0_0_12px_rgba(102,51,238,0.5)]'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ background: color.gradient }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 2: BENEFITY (KOLO ŠŤASTIA & VIP VÝHODY)                   */}
            {/* ============================================================= */}
            {activeTab === 'benefits' && (
              <div className="space-y-4 text-left animate-in fade-in duration-200">
                {/* Pútavá karta Kolesa Šťastia */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#6633EE]/15 to-[#EC4899]/15 border border-amber-500/30 shadow-md space-y-3 relative overflow-hidden">
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
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#0F172A] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <Sparkles size={14} />
                    <span>{language === 'sk' ? 'Roztočiť Kolo Šťastia' : 'Spin Lucky Wheel'}</span>
                  </button>
                </div>

                {/* Prehľad benefitov */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#6633EE] dark:text-[#A78BFA] block uppercase tracking-wider">
                    {language === 'sk' ? 'Vaše členské výhody' : 'Your Member Benefits'}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B0D22] dark:text-white">
                        <Gift size={14} className="text-[#6633EE] dark:text-[#A78BFA]" />
                        <span>{language === 'sk' ? 'Vernostné Pečiatky' : 'Loyalty Stamps'}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70">
                        {language === 'sk' ? 'Každá 10. masáž zdarma alebo zľava na procedúru.' : 'Every 10th session free or discounted.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B0D22] dark:text-white">
                        <Cake size={14} className="text-[#EC4899]" />
                        <span>{language === 'sk' ? 'Narodeninový Darček' : 'Birthday Gift'}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70">
                        {language === 'sk' ? 'Zadajte dátum narodenia a získajte špeciálnu narodeninovú zľavu.' : 'Add your birth date to receive a special birthday discount.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B0D22] dark:text-white">
                        <UserPlus size={14} className="text-[#10B981]" />
                        <span>{language === 'sk' ? 'Odmeňovanie Priateľov' : 'Referral Rewards'}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70">
                        {language === 'sk' ? 'Zdieľajte svoj kód a získajte -15 € za každého nového klienta.' : 'Share your code and get 15 € for every new client.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B0D22] dark:text-white">
                        <Crown size={14} className="text-amber-400" />
                        <span>{language === 'sk' ? 'VIP Senzuálny Program' : 'VIP Sensual Program'}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70">
                        {language === 'sk' ? 'Prístup k exkluzívnym VIP technikám a aromaterapii.' : 'Access to exclusive VIP techniques & aroma oil.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 3: NARODENINY                                             */}
            {/* ============================================================= */}
            {activeTab === 'birthday' && (
              <div className="space-y-4 text-left animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA]">
                      <Cake size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF]">
                        {language === 'sk' ? 'Dátum vašich narodenín' : 'Your Date of Birth'}
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 font-normal">
                        {language === 'sk'
                          ? 'V deň narodenín odomknete špeciálny odznak a masážny darček.'
                          : 'Unlocks a special achievement badge and birthday surprise.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Segmented Picker */}
                <ModernBirthdayPicker
                  value={birthDate}
                  onChange={(newIso) => setBirthDate(newIso)}
                  disabled={savingBirthDate}
                  language={language}
                />

                {birthDateMsg && (
                  <p className="text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] bg-[#6633EE]/10 dark:bg-[#6633EE]/15 p-2.5 rounded-xl border border-[#6633EE]/30 flex items-center gap-1.5">
                    <Check size={15} />
                    <span>{birthDateMsg}</span>
                  </p>
                )}

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
                        setBirthDateMsg(language === 'sk' ? 'Dátum narodenín bol úspešne uložený! 🎉' : 'Birthday date saved successfully! 🎉');
                        setTimeout(() => setBirthDateMsg(''), 3500);
                      }
                    } catch (err) {
                      console.error('Chyba ukladania narodenín:', err);
                    } finally {
                      setSavingBirthDate(false);
                    }
                  }}
                  className="w-full btn-primary text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-1.5"
                >
                  <Cake size={14} />
                  <span>{savingBirthDate ? (language === 'sk' ? 'Ukladám...' : 'Saving...') : (language === 'sk' ? 'Uložiť dátum narodenín' : 'Save Birthday Date')}</span>
                </button>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 3: UPOZORNENIA & PWA APLIKÁCIA                            */}
            {/* ============================================================= */}
            {activeTab === 'notifications' && (
              <div className="space-y-3.5 text-left animate-in fade-in duration-200">
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
                      <SparklesIcon size={16} />
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
            {/* TAB 4: REFERRAL PROGRAM & STATS                                */}
            {/* ============================================================= */}
            {activeTab === 'referral' && (
              <div className="space-y-4 text-left animate-in fade-in duration-200">
                {/* Highlight Stats Banner */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-[#64748B] dark:text-[#C7CAE0]/70 font-medium">
                      {language === 'sk' ? 'Odporúčaní priatelia' : 'Referred friends'}
                    </p>
                    <p className="text-2xl font-bold text-[#6633EE] dark:text-[#A78BFA]">
                      {referredPeople.length}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-[#64748B] dark:text-[#C7CAE0]/70 font-medium">
                      {language === 'sk' ? 'Absolvovali masáž' : 'Completed visit'}
                    </p>
                    <p className="text-2xl font-bold text-emerald-500">
                      {referredPeople.filter((p) => p.hasMassage).length}
                    </p>
                  </div>
                </div>

                {/* Kód na kopírovanie */}
                <div className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49]">
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 uppercase font-medium">
                      {language === 'sk' ? 'Váš odporúčací kód' : 'Your Referral Code'}
                    </p>
                    <p className="font-mono font-bold text-base text-[#0B0D22] dark:text-[#FFFFFF] tracking-widest truncate">
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
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] hover:border-[#6633EE]/50 transition shrink-0 cursor-pointer shadow-xs"
                  >
                    {codeCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{codeCopied ? (language === 'sk' ? 'Skopírované' : 'Copied') : (language === 'sk' ? 'Kopírovať' : 'Copy')}</span>
                  </button>
                </div>

                {referrerInfo && (
                  <div className="text-xs text-[#64748B] dark:text-[#C7CAE0] font-normal px-1">
                    {language === 'sk' ? 'Odporučil vás: ' : 'You were referred by: '}
                    <strong className="text-[#0B0D22] dark:text-[#FFFFFF]">
                      {referrerInfo.full_name || referrerInfo.email}
                    </strong>
                  </div>
                )}

                {/* Zoznam odporučených osôb */}
                <div>
                  <p className="text-xs font-medium text-[#0B0D22] dark:text-[#FFFFFF] mb-2">
                    {language === 'sk' ? 'Zoznam ľudí, ktorí použili váš kód:' : 'People who used your code:'}
                  </p>
                  {referredPeople.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-center text-xs text-[#94A3B8] dark:text-[#C7CAE0]/60">
                      {language === 'sk' ? 'Zatiaľ nikto nepoužil váš kód. Zdieľajte ho s priateľmi!' : 'No one has used your code yet. Share it with your friends!'}
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar pr-1">
                      {referredPeople.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#010314] text-xs border border-[#E2E8F0] dark:border-[#2B2F49]"
                        >
                          <span className="truncate text-[#1E293B] dark:text-[#DDE0F2] font-medium">
                            {r.full_name || r.email}
                          </span>
                          <span
                            className={`shrink-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                              r.hasMassage
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-200 dark:bg-[#0B0D22] text-[#64748B] dark:text-[#C7CAE0]/50 border border-slate-300 dark:border-[#2B2F49]'
                            }`}
                          >
                            {r.hasMassage
                              ? (language === 'sk' ? 'Absolvoval masáž' : 'Completed massage')
                              : (language === 'sk' ? 'Čaká na termín' : 'Awaiting visit')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 5: NEBEZPEČNÁ ZÓNA (DANGER ZONE)                          */}
            {/* ============================================================= */}
            {activeTab === 'danger' && (
              <div className="space-y-4 text-left animate-in fade-in duration-200">
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