'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { 
  X, Gift, Sparkles, LogIn, History, PlusCircle, Tag, Loader2 
} from 'lucide-react';

interface Stamp {
  id: string;
  price: number;
  claimed: boolean;
  created_at: string;
  claimed_at: string | null;
}

interface GiftRecord {
  id: string;
  gift_type: string;
  custom_code: string | null;
  used: boolean;
  created_at: string;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  sessionUser: any;
  language: string;
};

export default function UserHistoryModal({ isOpen, onClose, sessionUser, language }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [gifts, setGifts] = useState<GiftRecord[]>([]);

  useEffect(() => {
    if (!isOpen || !sessionUser) return;

    const fetchUserHistory = async () => {
      setLoading(true);
      try {
        // Načítanie pečiatok (masáží)
        const { data: stampsData } = await supabase
          .from('stamps')
          .select('id, price, claimed, created_at, claimed_at')
          .eq('user_id', sessionUser.id)
          .is('removed_at', null)
          .order('created_at', { ascending: false });

        // Načítanie darčekov / kódov
        const { data: giftsData } = await supabase
          .from('gifts')
          .select('id, gift_type, custom_code, used, created_at')
          .eq('user_id', sessionUser.id)
          .order('created_at', { ascending: false });

        if (stampsData) setStamps(stampsData);
        if (giftsData) setGifts(giftsData);
      } catch (err) {
        console.error('Chyba načítavania histórie:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserHistory();
  }, [isOpen, sessionUser]);

  if (!isOpen) return null;

  // VARIANT A: NEPRIHLÁSENÝ (HOSŤ)
  if (!sessionUser) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fadeIn">
        <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 shadow-2xl space-y-5 relative text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X size={20} />
          </button>

          {/* Ikonka darčeka v krúžku */}
          <div className="relative mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Gift size={32} />
            <Sparkles size={16} className="absolute -top-1 -right-1 text-amber-300 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
              {language === 'sk' ? 'Ste tu ako hosť' : 'You are here as a guest'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed px-2">
              {language === 'sk'
                ? 'Nie ste prihlásený. Registrujte sa alebo sa prihláste pre odmeny, zľavy a vernostné výhody, ktoré na vás čakajú!'
                : 'You are not logged in. Register or sign in for rewards, discounts and loyalty benefits waiting for you!'}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push('/login');
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              <span>{language === 'sk' ? 'Prihlásiť / Zaregistrovať sa' : 'Log In / Register'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT B: PRIHLÁSENÝ (HISTÓRIA MASÁŽÍ A KÓDOV)
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fadeIn">
      <div className="w-full max-w-md max-h-[80vh] flex flex-col p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center gap-1.5 mb-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <History size={22} />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {language === 'sk' ? 'Moja história masáží' : 'My Massage History'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {language === 'sk' ? 'Prehľad absolvovaných masáží a kódov' : 'Overview of past massages and codes'}
          </p>
        </div>

        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <p className="text-xs">{language === 'sk' ? 'Načítavam históriu...' : 'Loading history...'}</p>
            </div>
          ) : (
            (() => {
              type Item = { id: string; date: string; type: 'stamp' | 'gift'; node: React.ReactNode };
              const items: Item[] = [];

              stamps.forEach((s) => {
                items.push({
                  id: `stamp-${s.id}`,
                  date: s.created_at,
                  type: 'stamp',
                  node: (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <PlusCircle size={15} />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {language === 'sk' ? 'Absolvovaná masáž' : 'Massage completed'} — {Number(s.price).toFixed(2)} €
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {new Date(s.created_at).toLocaleDateString('sk-SK')} o {new Date(s.created_at).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {s.claimed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                          {language === 'sk' ? 'Uplatnené' : 'Claimed'}
                        </span>
                      )}
                    </div>
                  ),
                });
              });

              gifts.forEach((g) => {
                items.push({
                  id: `gift-${g.id}`,
                  date: g.created_at,
                  type: 'gift',
                  node: (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        <Tag size={15} />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate">
                          {g.custom_code
                            ? `${language === 'sk' ? 'Využitý kód' : 'Used code'}: ${g.custom_code}`
                            : language === 'sk' ? 'Získaný darček / zľava' : 'Reward claimed'}
                        </p>
                        <p className="text-[10px] text-purple-500 dark:text-purple-400 font-medium">
                          {new Date(g.created_at).toLocaleDateString('sk-SK')}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                        {g.used ? (language === 'sk' ? 'Použitý' : 'Used') : (language === 'sk' ? 'Aktivovaný' : 'Active')}
                      </span>
                    </div>
                  ),
                });
              });

              items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              if (items.length === 0) {
                return (
                  <div className="text-center py-10 space-y-2">
                    <History size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {language === 'sk' ? 'Zatiaľ nemáte žiadnu históriu masáží.' : 'No massage history yet.'}
                    </p>
                  </div>
                );
              }

              return items.map((item) => <div key={item.id}>{item.node}</div>);
            })()
          )}
        </div>
      </div>
    </div>
  );
}