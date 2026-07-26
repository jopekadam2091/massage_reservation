'use client';

import { MassageType } from '@/app/types';
import { Crown, Gem, Sparkles } from 'lucide-react';

type Props = {
  t: any;
  onSelect: (type: MassageType) => void;
};

export default function Step1Level({ t, onSelect }: Props) {
  return (
    <div className="max-w-3xl mx-auto font-sans">
      <h2 className="text-lg font-bold text-center text-slate-800 dark:text-slate-100 mb-6">{t.step1Title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pt-2">
        {/* CLASSIC */}
        <div className="relative flex flex-col h-full">
          <div className="flex flex-col h-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 transition hover:shadow-lg">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">{t.klasikTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex-grow mb-6 leading-relaxed">{t.klasikDesc}</p>
            <button
              type="button"
              onClick={() => onSelect('Klasik')}
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition shadow-sm active:scale-95"
            >
              {t.selectLevelBtn}
            </button>
          </div>
        </div>

        {/* VIP PREMIUM */}
        <div className="relative flex flex-col h-full md:scale-[1.03] z-10">
          <div className="flex flex-col h-full rounded-3xl border-2 border-amber-500/80 dark:border-amber-500/80 bg-gradient-to-b from-amber-50/40 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 shadow-xl shadow-amber-500/10 p-6 transition">
            
            {/* Hlavička s 3-stupňovým odznakom (Striebro, Zlato, Diamant) */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                {t.vipTitle}
              </h3>
              
              <div 
                className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm" 
                title="VIP Úrovne: Striebro / Zlato / Diamant"
              >
                <Crown size={15} className="text-slate-400 dark:text-slate-300 fill-slate-300/40" />
                <Crown size={17} className="text-amber-500 fill-amber-400/50" />
                <Gem size={15} className="text-cyan-500 dark:text-cyan-400 fill-cyan-400/40 animate-pulse" />
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex-grow mb-6 leading-relaxed">{t.vipDesc}</p>
            
            {/* Prémiové tlačidlo s indigo-fialovým gradientom */}
            <button
              type="button"
              onClick={() => onSelect('VIP')}
              className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 text-white shadow-md hover:shadow-indigo-500/20 hover:brightness-110 transition active:scale-95 flex items-center justify-center gap-2"
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