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
    <div className="rounded-2xl border border-[#2B2F49] bg-[#0B0D22] shadow-xl mb-6 text-[#DDE0F2]">
      <div className="p-4 sm:p-5 flex flex-col justify-between gap-3 font-sans">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#6633EE] text-white shadow-[0_0_15px_rgba(102,51,238,0.5)]">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#FFFFFF] tracking-tight">
                {language === 'sk' ? 'Vítajte v aplikácii!' : 'Welcome to the App!'}
              </h4>
              <p className="text-xs text-[#C7CAE0] font-normal leading-relaxed mt-0.5">
                {language === 'sk'
                  ? 'Rezervácie môžete spravovať priamo cez prehľadný kalendár alebo rýchly generátor.'
                  : 'Manage bookings easily via our interactive calendar or smart generator.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-[#C7CAE0] hover:text-white p-1 cursor-pointer transition active:scale-95"
            title={language === 'sk' ? 'Zatvoriť' : 'Close'}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2B2F49]">
          <button
            type="button"
            onClick={handleDisableForever}
            className="text-xs font-medium text-[#A78BFA] hover:text-[#FFFFFF] flex items-center gap-1 cursor-pointer"
          >
            <Check size={14} />
            <span>{language === 'sk' ? 'Už nezobrazovať po prihlásení' : 'Don\'t show again after login'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}