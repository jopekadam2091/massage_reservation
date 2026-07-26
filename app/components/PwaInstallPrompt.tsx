'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Download, X, Share } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '../lib/supabase'; // 🚀 PRIDANÝ IMPORT SUPABASE

export default function PwaInstallPrompt() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false); // 🚀 ZMENENÉ Z true NA false (východiskový stav)

  useEffect(() => {
    // 1. KONTROLA PREFERENCIÍ Z LOCALSTORAGE & SESSIONSTORAGE
    const isDismissed = 
      localStorage.getItem('hide_pwa_prompt') === 'true' ||
      localStorage.getItem('pwa_prompt_dismissed') === 'true' ||
      sessionStorage.getItem('pwa_prompt_dismissed') === 'true';

    if (isDismissed) {
      setShowPrompt(false);
      return;
    }

    // 2. KONTROLA STANDALONE REŽIMU (ak už appka beží ako nainštalovaná)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setShowPrompt(false);
      return;
    }

    // 3. KONTROLA NASTAVENIA V SUPABASE PRE PRIHLÁSENÉHO POUŽÍVATEĽA
    const checkUserPreference = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('hide_pwa_prompt')
            .eq('id', session.user.id)
            .maybeSingle();

          if (data?.hide_pwa_prompt) {
            setShowPrompt(false);
            localStorage.setItem('hide_pwa_prompt', 'true');
            localStorage.setItem('pwa_prompt_dismissed', 'true');
            return true;
          }
        }
      } catch (err) {
        console.error('Chyba pri načítaní PWA preferencií:', err);
      }
      return false;
    };

    checkUserPreference().then((isHiddenInProfile) => {
      if (isHiddenInProfile) return;

      // Zobrazíme výzvu ak nie je vypnutá
      setShowPrompt(true);

      // Odachytenie inštalačnej udalosti pre Chrome/Android
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Detekcia iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      if (isIosDevice) {
        setIsIos(true);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        handleDismiss(); // Uložíme trvalé skrytie po úspešnej inštalácii
      }
      setDeferredPrompt(null);
    } else {
      // Ak používateľ klikne na PC
      alert(
        language === 'sk'
          ? 'Ak používate Chrome alebo Edge na PC, kliknite na ikonu inštalácie v pravej časti adresného riadka prehliadača (hore vpravo 🖥️).'
          : 'If using Chrome or Edge on PC, click the install icon in the top right of your browser address bar 🖥️.'
      );
    }
  };

  // 🚀 ZATVORENIE KRÍŽIKOM - TRVALO ULOŽÍ DO LOCALSTORAGE AJ SUPABASE
  const handleDismiss = async () => {
    setShowPrompt(false);
    localStorage.setItem('hide_pwa_prompt', 'true');
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('profiles')
          .update({ hide_pwa_prompt: true })
          .eq('id', session.user.id);
      }
    } catch (err) {
      console.error('Chyba pri zápise PWA preferencie do databázy:', err);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans">
      <div className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-indigo-200 dark:border-indigo-900/50 shadow-2xl space-y-3 relative text-left">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 leading-tight">
              {language === 'sk' ? 'Aplikácia na plochu' : 'App on Home Screen'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'sk' ? 'Pridajte si Masáže na plochu mobilu / PC' : 'Add Massage app to home screen / PC'}
            </p>
          </div>
        </div>

        {isIos ? (
          <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-indigo-50/80 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 leading-snug">
            {language === 'sk' ? (
              <>
                Na iPhone kliknite na ikonu <strong>Zdieľať</strong> <Share size={12} className="inline mx-0.5" /> a zvoľte <strong>Pridať na plochu ⊕</strong>.
              </>
            ) : (
              <>
                On iPhone tap <strong>Share</strong> <Share size={12} className="inline mx-0.5" /> then <strong>Add to Home Screen ⊕</strong>.
              </>
            )}
          </p>
        ) : (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download size={14} />
            <span>{language === 'sk' ? 'Nainštalovať aplikáciu' : 'Install App'}</span>
          </button>
        )}
      </div>
    </div>
  );
}