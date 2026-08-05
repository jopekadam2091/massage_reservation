'use client';

import { useLanguage } from '../lib/LanguageContext';

interface CardProps {
  fullName: string;
  programType: '5_stamps' | '10_stamps';
  activeStampsPrices: number[];
  avatarColor: string;
}

const STAMP_GRADIENTS: Record<string, { hueStart: number; hueEnd: number }> = {
  '#10b981': { hueStart: 140, hueEnd: 172 },
  '#1d4ed8': { hueStart: 203, hueEnd: 237 },
  '#f43f5e': { hueStart: 328, hueEnd: 357 },
  '#f59e0b': { hueStart: 20,  hueEnd: 48 },
  '#0ea5e9': { hueStart: 188, hueEnd: 214 },
  '#8b5cf6': { hueStart: 238, hueEnd: 302 },
};

const DEFAULT_GRADIENT = STAMP_GRADIENTS['#8b5cf6'];

export default function Card({ fullName, programType, activeStampsPrices, avatarColor }: CardProps) {
  const { t } = useLanguage();
  const maxStamps = programType === '5_stamps' ? 5 : 10;
  const stampsCount = activeStampsPrices.length;
  const isFull = stampsCount >= maxStamps;

  const averageValue =
    stampsCount > 0
      ? activeStampsPrices.reduce((sum, p) => sum + p, 0) / stampsCount
      : 0;

  const formattedAverage = averageValue.toFixed(2).replace('.', ',');

  const { hueStart, hueEnd } = STAMP_GRADIENTS[avatarColor] || DEFAULT_GRADIENT;

  const colors = {
    cardGradient: "bg-gradient-to-tr from-violet-100/90 via-white/80 to-emerald-100/90 dark:from-violet-950/70 dark:via-zinc-900/90 dark:to-emerald-950/70",
    inactiveStamp: "bg-white/50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-700/60 text-slate-400 dark:text-zinc-500",
    textPrimary: "text-slate-900 dark:text-zinc-100",
    textSecondary: "text-slate-500 dark:text-zinc-400",
  };

  return (
    <div className={`relative overflow-hidden w-full max-w-md p-6 sm:p-7 rounded-[32px] backdrop-blur-2xl border border-white/60 dark:border-zinc-800/80 shadow-2xl shadow-slate-900/10 dark:shadow-black/50 ${colors.cardGradient} transition-all duration-300`}>

      {/* Top subtle gloss overlay */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/40 dark:from-white/5 to-transparent pointer-events-none rounded-t-[32px]" />

      {/* Hlavička karty */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/90 dark:bg-zinc-800/90 rounded-2xl border border-white/80 dark:border-zinc-700 shadow-md flex items-center justify-center shrink-0">
            <div
              className="w-7 h-7 bg-indigo-600 dark:bg-indigo-400 transition-colors duration-300"
              style={{
                maskImage: 'url("/logo_massage.svg")',
                WebkitMaskImage: 'url("/logo_massage.svg")',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
              }}
            />
          </div>
          <div>
            <h2 className={`text-base sm:text-lg font-extrabold tracking-tight leading-tight ${colors.textPrimary}`}>{t.massageReward}</h2>
            <p className={`text-xs font-semibold ${colors.textSecondary}`}>{t.loyaltyProgram}</p>
          </div>
        </div>
      </div>

      {/* Držiteľ karty */}
      <div className="mb-6 relative z-10 text-left">
        <p className={`text-[10px] uppercase tracking-wider font-bold ${colors.textSecondary}`}>{t.cardHolder}</p>
        <p className={`text-lg sm:text-xl font-extrabold truncate ${colors.textPrimary}`}>{fullName || t.guest}</p>
      </div>

      {/* Mriežka s pečiatkami */}
      <div className="space-y-3 relative z-10 text-left">
        <div className="flex items-center justify-between">
          <p className={`text-[10px] uppercase tracking-wider font-bold ${colors.textSecondary}`}>
            {t.stamps} ({stampsCount} {t.of} {maxStamps})
          </p>
          {isFull && (
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
              🎉 Plná karta
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
          {Array.from({ length: maxStamps }).map((_, index) => {
            const isStamped = index < stampsCount;
            const price = isStamped ? activeStampsPrices[index] : null;

            let stampStyle = {};
            let stampClass = colors.inactiveStamp;

            if (isStamped) {
              const hueStep = (hueEnd - hueStart) / (maxStamps - 1 || 1);
              const currentHue = hueStart + index * hueStep;

              stampStyle = {
                background: `linear-gradient(135deg, hsl(${currentHue}, 95%, 62%), hsl(${currentHue + 18}, 90%, 40%))`,
                boxShadow: `0 4px 12px -2px hsla(${currentHue}, 80%, 45%, 0.45)`,
              };
              stampClass = "text-white shadow-md border-transparent hover:scale-105";
            }

            return (
              <div
                key={index}
                style={stampStyle}
                title={isStamped && price ? `${price.toFixed(2)} €` : `Pečiatka ${index + 1}`}
                className={`aspect-square flex items-center justify-center rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-300 select-none cursor-default ${stampClass}`}
              >
                {isStamped ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-xs">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Spodná sekcia - Hodnota zľavy */}
      <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-zinc-800/80 relative z-10">
        {isFull ? (
          <div className="text-center p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 animate-pulse">
            <p className="font-extrabold text-xs sm:text-sm">{t.discountEligible(formattedAverage)}</p>
          </div>
        ) : stampsCount > 0 ? (
          <p className={`text-xs text-center font-medium ${colors.textSecondary}`}>
            {t.currentDiscountValue} <span className="font-extrabold text-slate-800 dark:text-zinc-100 bg-white/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">{formattedAverage} €</span>
          </p>
        ) : (
          <p className={`text-xs text-center font-medium ${colors.textSecondary}`}>{t.collectStamps}</p>
        )}
      </div>
    </div>
  );
}