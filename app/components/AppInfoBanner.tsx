'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Sparkles, X, Check } from 'lucide-react';

type Props = {
  language: string;
  userId?: string;
};

export default function AppInfoBanner({ language, userId }: Props) {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    async function checkVisibility() {
      // 1. Skontrolujeme localStorage pre okamžité skrytie
      const localHide = localStorage.getItem('hide_app_info');
      if (localHide === 'true') {
        setVisible(false);
        return;
      }

      // 2. Skontrolujeme preferenciu v Supabase ak je používateľ prihlásený
      if (userId) {
        const { data } = await supabase
          .from('profiles')
          .select('hide_app_info')
          .eq('id', userId)
          .single();

        if (data?.hide_app_info) {
          localStorage.setItem('hide_app_info', 'true');
          setVisible(false);
          return;
        }
      }

      // Ak nie je skryté, zobrazíme info okno
      setVisible(true);
    }

    checkVisibility();
  }, [userId]);

  const handleDisableForever = async () => {
    setVisible(false);
    localStorage.setItem('hide_app_info', 'true');

    if (userId) {
      await supabase
        .from('profiles')
        .update({ hide_app_info: true })
        .eq('id', userId);
    }
  };

  if (!visible) return null;

  return (
    <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-200 dark:border-sky-900/50 shadow-sm relative space-y-3 font-sans">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
              {language === 'sk' ? 'Vítajte v aplikácii!' : 'Welcome to the App!'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'sk'
                ? 'Rezervácie môžete spravovať priamo cez prehľadný kalendár alebo rýchly generátor.'
                : 'Manage bookings easily via our interactive calendar or smart generator.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          title={language === 'sk' ? 'Zavrieť' : 'Close'}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-sky-200/50 dark:border-sky-900/30">
        <button
          type="button"
          onClick={handleDisableForever}
          className="text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Check size={13} />
          <span>{language === 'sk' ? 'Už nezobrazovať po prihlásení' : 'Don\'t show again after login'}</span>
        </button>
      </div>
    </div>
  );
}