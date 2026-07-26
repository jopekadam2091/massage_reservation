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
    cardGradient: "bg-gradient-to-tr from-violet-100/80 via-white/60 to-emerald-100/80 dark:from-violet-950/60 dark:via-slate-900/80 dark:to-emerald-950/60",
    inactiveStamp: "bg-white/40 dark:bg-white/5 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-500",
    textPrimary: "text-slate-800 dark:text-slate-100",
    textSecondary: "text-slate-500 dark:text-slate-400",
  };

  return (
    <div className={`relative overflow-hidden w-full max-w-md p-6 rounded-3xl backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl ${colors.cardGradient}`}>

      {/* Hlavička karty */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/85 dark:bg-slate-800 rounded-2xl border border-white/60 dark:border-slate-700 shadow-sm flex items-center justify-center">
            <div
              className="w-7 h-7 bg-slate-800 dark:bg-slate-100 transition-colors duration-300"
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
            <h2 className={`text-lg font-bold tracking-tight ${colors.textPrimary}`}>{t.massageReward}</h2>
            <p className={`text-xs ${colors.textSecondary}`}>{t.loyaltyProgram}</p>
          </div>
        </div>
      </div>

      {/* Držiteľ karty */}
      <div className="mb-6">
        <p className={`text-xs uppercase tracking-wider font-semibold ${colors.textSecondary}`}>{t.cardHolder}</p>
        <p className={`text-xl font-bold ${colors.textPrimary}`}>{fullName || t.guest}</p>
      </div>

      {/* Mriežka s pečiatkami */}
      <div className="space-y-3">
        <p className={`text-xs uppercase tracking-wider font-semibold ${colors.textSecondary}`}>
          {t.stamps} ({stampsCount} {t.of} {maxStamps})
        </p>

        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: maxStamps }).map((_, index) => {
            const isStamped = index < stampsCount;

            let stampStyle = {};
            let stampClass = colors.inactiveStamp;

            if (isStamped) {
              const hueStep = (hueEnd - hueStart) / (maxStamps - 1 || 1);
              const currentHue = hueStart + index * hueStep;

              stampStyle = {
                background: `linear-gradient(135deg, hsl(${currentHue}, 95%, 62%), hsl(${currentHue + 18}, 90%, 40%))`,
                boxShadow: `0 4px 10px -2px hsla(${currentHue}, 80%, 45%, 0.45)`,
              };
              stampClass = "text-white shadow-md border-transparent";
            }

            return (
              <div
                key={index}
                style={stampStyle}
                className={`aspect-square flex items-center justify-center rounded-2xl text-sm font-bold transition-all duration-500 ${stampClass}`}
              >
                {isStamped ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
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
      <div className="mt-6 pt-4 border-t border-white/20 dark:border-white/10">
        {isFull ? (
          <div className="text-center p-3 rounded-2xl bg-emerald-500/90 text-white shadow-lg animate-pulse">
            <p className="font-bold text-sm">{t.discountEligible(formattedAverage)}</p>
          </div>
        ) : stampsCount > 0 ? (
          <p className={`text-xs text-center ${colors.textSecondary}`}>
            {t.currentDiscountValue} <span className="font-semibold text-slate-700 dark:text-slate-200">{formattedAverage} €</span>
          </p>
        ) : (
          <p className={`text-xs text-center ${colors.textSecondary}`}>{t.collectStamps}</p>
        )}
      </div>
    </div>
  );
}