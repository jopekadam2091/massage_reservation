'use client';
import { MassageType, PackagesData, PackageItem, Feature } from '@/app/types';
import { PRICES } from '@/app/constants/config';
import { Flame, Check, Star, Crown, Gem } from 'lucide-react';

type Props = {
  selectedType: MassageType;
  packagesData: PackagesData;
  t: any;
  onSelectDuration: (duration: number) => void;
  onBack: () => void;
};

export default function Step2Packages({ selectedType, packagesData, t, onSelectDuration, onBack }: Props) {
  const isVip = selectedType === 'VIP';

  // Odznak úrovne v pravom hornom rohu karty
  const getVipBadge = (duration: number) => {
    if (!isVip) return null;

    if (duration === 45) {
      // VIP Supreme -> Strieborná korunka
      return (
        <div className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-sm flex items-center justify-center text-slate-400 dark:text-slate-300" title="VIP Supreme">
          <Crown size={18} className="fill-slate-300 dark:fill-slate-400/40 text-slate-400" />
        </div>
      );
    }
    if (duration === 60) {
      // VIP Pro -> Zlatá korunka
      return (
        <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-sm flex items-center justify-center text-amber-500 dark:text-amber-400" title="VIP Pro">
          <Crown size={18} className="fill-amber-400/40 text-amber-500" />
        </div>
      );
    }
    if (duration === 90) {
      // VIP Max -> Diamant
      return (
        <div className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 shadow-sm flex items-center justify-center text-cyan-500 dark:text-cyan-400" title="VIP Max">
          <Gem size={18} className="fill-cyan-400/40 text-cyan-500 animate-pulse" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Hlavný nadpis bez zátvorky */}
      <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100">
        {t.step2Title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 items-stretch pt-3">
        {packagesData[selectedType].map((pkg: PackageItem) => {
          const priceStr =
            selectedType === 'Klasik'
              ? PRICES.Klasik[pkg.duration as 30 | 45 | 60]
              : PRICES.VIP[pkg.duration as 45 | 60 | 90];

          const isMiddle = pkg.badge === 'Supreme' || pkg.badge === 'VIP Pro';

          return (
            <div
              key={pkg.duration}
              className={`relative flex flex-col h-full transition-all ${isMiddle ? 'md:scale-[1.04] z-10' : ''}`}
            >
              {isMiddle && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-600 text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-full shadow-md uppercase tracking-wider z-20 flex items-center gap-1">
                  <Star size={12} className="fill-amber-300 text-amber-300" />
                  <span>{t.mostPopularLabel}</span>
                </span>
              )}
              <div
                className={`flex flex-col h-full rounded-3xl border transition-all overflow-hidden relative ${
                  isMiddle
                    ? 'bg-gradient-to-b from-indigo-50/60 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-indigo-500 shadow-xl shadow-indigo-500/10'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* 2. Odznak korunká / diamant v pravom hornom rohu karty */}
                {isVip && (
                  <div className="absolute top-4 right-4 z-10">
                    {getVipBadge(pkg.duration)}
                  </div>
                )}

                <div className={`p-6 pb-0 flex flex-col items-start ${isMiddle ? 'pt-8 min-h-[216px]' : 'min-h-[190px]'}`}>
                  <span
                    className={`px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full mb-4 ${
                      isMiddle 
                        ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {pkg.badge}
                  </span>
                  <div className="flex items-baseline mb-1 text-slate-800 dark:text-slate-100">
                    <span className={`font-black tracking-tight ${isMiddle ? 'text-5xl text-indigo-600 dark:text-indigo-400' : 'text-3xl'}`}>
                      {priceStr.split(' ')[0]}
                    </span>
                    <span className="text-lg font-bold ml-1 text-slate-500 dark:text-slate-400">eur</span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-2">/ {pkg.duration} {t.minutes}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">{pkg.desc}</p>
                </div>

                {/* 3. Tlačidlo s prémiovým indigo-fialovým gradientom */}
                <div className="p-6 pt-4">
                  <button
                    type="button"
                    onClick={() => onSelectDuration(pkg.duration)}
                    className={`w-full rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
                      isMiddle
                        ? 'py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 text-white shadow-md hover:shadow-indigo-500/20 hover:brightness-110'
                        : 'py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white'
                    }`}
                  >
                    {t.selectBtn}
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-2 mx-6"></div>

                <div className="p-6 pt-2 flex-grow">
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                    {pkg.features.map((feat: Feature, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="w-4 flex-shrink-0 text-center font-bold mt-0.5">
                          {feat.icon === 'chili' ? (
                            <Flame size={14} className="text-rose-500 fill-rose-500 inline" />
                          ) : (
                            <Check size={14} className="text-indigo-600 dark:text-indigo-400 inline" />
                          )}
                        </span>
                        <span className={isMiddle ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}>{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mx-auto flex items-center justify-center px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs tracking-wider uppercase hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm active:scale-95"
      >
        {t.backToLevel}
      </button>
    </div>
  );
}