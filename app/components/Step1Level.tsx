'use client';

import { MassageType } from '@/app/types';
import { Crown, Gem, Sparkles } from 'lucide-react';

type Props = {
  t: any;
  onSelect: (type: MassageType) => void;
};

export default function Step1Level({ t, onSelect }: Props) {
  return (
    <div className="max-w-3xl mx-auto font-sans text-left">
      <h2 className="text-lg sm:text-xl font-extrabold text-center text-slate-800 dark:text-zinc-100 mb-6 tracking-tight">{t.step1Title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pt-2">
        {/* CLASSIC */}
        <div className="relative flex flex-col h-full group">
          <div className="flex flex-col h-full rounded-3xl border border-slate-200/80 dark:border-zinc-700/80 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl p-6 sm:p-7 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 dark:hover:border-zinc-600 shadow-sm">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-zinc-100 mb-2">{t.klasikTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 flex-grow mb-6 leading-relaxed font-medium">{t.klasikDesc}</p>
            <button
              type="button"
              onClick={() => onSelect('Klasik')}
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-100 dark:bg-zinc-700/80 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-600 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
            >
              {t.selectLevelBtn}
            </button>
          </div>
        </div>

        {/* VIP PREMIUM */}
        <div className="relative flex flex-col h-full md:scale-[1.02] z-10 group">
          <div className="flex flex-col h-full rounded-3xl border-2 border-amber-500/80 dark:border-amber-500/80 bg-gradient-to-b from-amber-50/60 via-white to-white dark:from-amber-950/30 dark:via-zinc-800 dark:to-zinc-800 shadow-xl shadow-amber-500/10 p-6 sm:p-7 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/20">
            
            {/* Hlavička s 3-stupňovým odznakom (Striebro, Zlato, Diamant) */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-zinc-100">
                {t.vipTitle}
              </h3>
              
              <div 
                className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-xs" 
                title="VIP Úrovne: Striebro / Zlato / Diamant"
              >
                <Crown size={15} className="text-slate-400 dark:text-zinc-300 fill-slate-300/40" />
                <Crown size={17} className="text-amber-500 fill-amber-400/50" />
                <Gem size={15} className="text-cyan-500 dark:text-cyan-400 fill-cyan-400/40 animate-pulse" />
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium flex-grow mb-6 leading-relaxed">{t.vipDesc}</p>
            
            {/* Prémiové tlačidlo s violet-purple-amber gradientom */}
            <button
              type="button"
              onClick={() => onSelect('VIP')}
              className="w-full btn-vip-gradient"
            >
              <Sparkles size={15} className="fill-white/30" />
              <span>{t.selectLevelBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}