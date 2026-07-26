'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAvatar } from '../lib/AvatarContext';
import { 
  X, User, Flower2, Leaf, Sparkles as SparklesIcon, Sun, Moon, 
  Heart, Feather, Droplets, Coffee, Cat, Star, Copy, Check, UserPlus, Loader2, Bell, Smartphone
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
  hide_pwa_prompt?: boolean; // 🚀 PREPÍNAČ PRE PWA INŠTALAČNÚ VÝZVU
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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);
  const [referredPeople, setReferredPeople] = useState<ReferredPerson[]>([]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setLoading(true);

    const loadSettingsData = async () => {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_icon, avatar_color, referral_code, referred_by, email_notifications, hide_pwa_prompt')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Chyba načítavania profilu pre nastavenia:', error);
        }

        if (profileData && isMounted) {
          setProfile(profileData);
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fadeIn">
      <div className="w-full max-w-sm max-h-[85vh] overflow-y-auto p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X size={20} />
        </button>

        {loading || !profile ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
            <p className="text-xs font-medium">{t.loading || 'Načítavam nastavenia...'}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 transition-all duration-300"
                style={{ color: avatarColor }}
              >
                {(() => {
                  const IconComp = ICON_MAP[avatarIcon] || ICON_MAP['User'];
                  return <IconComp size={32} strokeWidth={1.8} />;
                })()}
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {profile.full_name || t.guest}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.cardCustomization}</p>
              </div>
            </div>

            {/* Výber ikonky */}
            <div className="text-left">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                {t.chooseIcon}
              </label>
              <div className="grid grid-cols-4 gap-3">
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

                        const { error } = await supabase
                          .from('profiles')
                          .update({ avatar_icon: iconName, avatar_color: avatarColor })
                          .eq('id', profile.id);

                        if (error) {
                          console.error('Chyba pri zápise ikonky do Supabase:', error);
                        }
                        setUpdatingAvatar(false);
                      }}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center border bg-white dark:bg-slate-800 transition-all active:scale-95 ${
                        isSelected
                          ? 'scale-105 shadow-md font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-300 dark:text-slate-500'
                      }`}
                      style={isSelected ? { color: avatarColor, borderColor: avatarColor } : {}}
                    >
                      <IconOption size={36} strokeWidth={2} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Výber farby */}
            <div className="text-left">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
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

                      const { error } = await supabase
                        .from('profiles')
                        .update({ avatar_icon: avatarIcon, avatar_color: color.hex })
                        .eq('id', profile.id);

                      if (error) {
                        console.error('Chyba pri zápise farby do Supabase:', error);
                      }
                      setUpdatingAvatar(false);
                    }}
                    className={`w-9 h-9 rounded-full transition active:scale-95 border-2 shadow-sm ${
                      avatarColor === color.hex
                        ? 'border-slate-800 dark:border-white scale-110 shadow-md'
                        : 'border-transparent opacity-85 hover:opacity-100'
                    }`}
                    style={{ background: color.gradient }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* PREPÍNAČ PRE E-MAILOVÉ NOTIFIKÁCIE */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-left">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {language === 'sk' ? 'E-mailové notifikácie' : 'Email notifications'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {language === 'sk' ? 'Potvrdenia a storná masáží' : 'Booking & storno confirmations'}
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
                className={`w-12 h-6 rounded-full p-0.5 relative transition-colors duration-300 cursor-pointer ${
                  (profile.email_notifications ?? true) ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    (profile.email_notifications ?? true) ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 🚀 PREPÍNAČ PRE SKRYTIE INŠTALAČNEJ VÝZVY PWA APLIKÁCIE */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-left">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-sky-600 dark:text-sky-400" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {language === 'sk' ? 'Skryť výzvu na inštaláciu' : 'Hide app install prompt'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {language === 'sk' ? 'Nezobrazovať info o inštalácii aplikácie' : 'Hide PWA install prompt on login'}
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
                className={`w-12 h-6 rounded-full p-0.5 relative transition-colors duration-300 cursor-pointer ${
                  (profile.hide_pwa_prompt ?? false) ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    (profile.hide_pwa_prompt ?? false) ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Referral sekcia */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-left">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <UserPlus size={14} />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {language === 'sk' ? 'Referral program' : 'Referral program'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                    {language === 'sk' ? 'Tvoj kód' : 'Your code'}
                  </p>
                  <p className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100 tracking-widest truncate">
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
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0 cursor-pointer"
                >
                  {codeCopied ? <Check size={12} /> : <Copy size={12} />}
                  {codeCopied ? (language === 'sk' ? 'Skopírované' : 'Copied') : (language === 'sk' ? 'Kopírovať' : 'Copy')}
                </button>
              </div>

              {referrerInfo && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'sk' ? 'Odporučil ťa: ' : 'Referred by: '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {referrerInfo.full_name || referrerInfo.email}
                  </span>
                </div>
              )}

              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mb-1.5">
                  {language === 'sk'
                    ? `Ľudia, ktorých si odporučil (${referredPeople.length})`
                    : `People you referred (${referredPeople.length})`}
                </p>
                {referredPeople.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {language === 'sk' ? 'Zatiaľ nikoho.' : 'No one yet.'}
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {referredPeople.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          {r.full_name || r.email}
                        </span>
                        <span
                          className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            r.hasMassage
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {r.hasMassage
                            ? (language === 'sk' ? 'Aktívny' : 'Active')
                            : (language === 'sk' ? 'Čaká na masáž' : 'Awaiting massage')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-md hover:bg-indigo-700 transition active:scale-98 cursor-pointer"
              >
                {t.saveAndClose}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}