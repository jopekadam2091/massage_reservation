'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Info, BellOff, CheckCircle2, Loader2 } from 'lucide-react';

type Props = {
  language: string;
  userId?: string;
};

export default function AccountInfoSettings({ language, userId }: Props) {
  const [hideAppInfo, setHideAppInfo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    async function loadPreference() {
      // 1. Skúsime načítať najprv z localStorage pre okamžité zobrazenie
      const localValue = localStorage.getItem('hide_app_info');
      if (localValue !== null) {
        setHideAppInfo(localValue === 'true');
      }

      // 2. Ak máme ID používateľa, načítame aktuálnu hodnotu zo Supabase
      if (userId) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('hide_app_info')
            .eq('id', userId)
            .single();

          if (!error && data) {
            const isHidden = Boolean(data.hide_app_info);
            setHideAppInfo(isHidden);
            localStorage.setItem('hide_app_info', String(isHidden));
          }
        } catch (err) {
          console.error('Chyba pri načítaní preferencií:', err);
        }
      }
      setLoading(false);
    }

    loadPreference();
  }, [userId]);

  const handleToggle = async (newValue: boolean) => {
    setSaving(true);
    setMessage('');
    setHideAppInfo(newValue);

    // Uložíme do localStorage
    localStorage.setItem('hide_app_info', String(newValue));

    // Ak je používateľ prihlásený, uložíme aj do Supabase
    if (userId) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ hide_app_info: newValue })
          .eq('id', userId);

        if (!error) {
          setMessage(
            language === 'sk'
              ? newValue
                ? 'Informácie o aplikácii boli skryté.'
                : 'Informácie o aplikácii sa budú opäť zobrazovať.'
              : newValue
              ? 'App info hidden.'
              : 'App info will be shown again.'
          );
        } else {
          console.error('Chyba pri ukladaní nastavenia:', error);
        }
      } catch (err) {
        console.error('Nepodarilo sa spojiť so serverom:', err);
      }
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 font-sans text-left">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
            <Info size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
              {language === 'sk' ? 'Oznámenia a info o aplikácii' : 'App Announcements & Info'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'sk' ? 'Spravujte zobrazovanie noviniek a návodov po prihlásení' : 'Manage app news and guide banners after login'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
          <Loader2 size={16} className="animate-spin text-sky-500" />
          <span>{language === 'sk' ? 'Načítavam nastavenia...' : 'Loading settings...'}</span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
              {language === 'sk' ? 'Nezobrazovať novinky a info o aplikácii po prihlásení' : 'Hide app info and news banners upon login'}
            </span>
            <p className="text-[11px] text-slate-400">
              {language === 'sk'
                ? 'Ak je funkcia zapnutá, hlášky a info okno sa vám po prihlásení už neukážu.'
                : 'When enabled, app news and info popups will not show up after logging in.'}
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleToggle(!hideAppInfo)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              hideAppInfo ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                hideAppInfo ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={15} />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}