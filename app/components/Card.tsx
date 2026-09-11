'use client';

import { useLanguage } from '../lib/LanguageContext';
import { QrCode, RotateCw } from 'lucide-react';

interface CardProps {
  fullName: string;
  programType?: '5_stamps' | '10_stamps';
  activeStampsPrices: number[];
  avatarColor: string;
  onOpenQr?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const STAMP_GRADIENTS: Record<string, { hueStart: number; hueEnd: number }> = {
  '#10b981': { hueStart: 250, hueEnd: 275 }, // Evervault electric violet / purple
  '#1d4ed8': { hueStart: 240, hueEnd: 265 },
  '#f43f5e': { hueStart: 260, hueEnd: 285 },
  '#f59e0b': { hueStart: 250, hueEnd: 275 },
  '#0ea5e9': { hueStart: 245, hueEnd: 270 },
  '#8b5cf6': { hueStart: 250, hueEnd: 275 },
};

const DEFAULT_GRADIENT = { hueStart: 250, hueEnd: 275 };

export default function Card({ 
  fullName, 
  programType = '10_stamps', 
  activeStampsPrices, 
  avatarColor,
  onOpenQr,
  onRefresh,
  refreshing
}: CardProps) {
  const { t, language } = useLanguage();
  const maxStamps = 10;
  const stampsCount = activeStampsPrices.length;
  const isFull = stampsCount >= maxStamps;

  const averageValue =
    stampsCount > 0
      ? activeStampsPrices.reduce((sum, p) => sum + p, 0) / stampsCount
      : 0;

  const formattedAverage = averageValue.toFixed(2).replace('.', ',');

  const { hueStart, hueEnd } = STAMP_GRADIENTS[avatarColor] || DEFAULT_GRADIENT;

  return (
    <div className="relative overflow-hidden w-full max-w-md p-6 sm:p-8 rounded-2xl backdrop-blur-2xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-white dark:bg-[#0B0D22] shadow-xl dark:shadow-2xl transition-all duration-300 text-[#1E293B] dark:text-[#DDE0F2]">

      {/* Top subtle electric purple glow overlay */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#6633EE]/10 dark:from-[#6633EE]/15 to-transparent pointer-events-none rounded-t-2xl" />

      {/* Hlavička karty s integrovanými akčnými tlačidlami */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-50 dark:bg-[#010314] rounded-full border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm flex items-center justify-center shrink-0">
            <div
              className="w-6 h-6 bg-[#6633EE] dark:bg-[#A78BFA] transition-colors duration-300"
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
          <div className="text-left">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight leading-tight text-[#0B0D22] dark:text-[#FFFFFF]">{t.massageReward}</h2>
            <p className="text-xs font-normal text-[#64748B] dark:text-[#C7CAE0]">{t.loyaltyProgram}</p>
          </div>
        </div>

        {/* QR Button & Refresh Button priamo v karte */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenQr && (
            <button
              type="button"
              onClick={onOpenQr}
              className="w-9 h-9 rounded-full bg-slate-50 dark:bg-[#010314] text-[#6633EE] dark:text-[#A78BFA] hover:text-[#0B0D22] dark:hover:text-[#FFFFFF] border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE] dark:hover:border-[#6633EE] flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95"
              title={language === 'sk' ? 'Môj QR Kód' : 'My QR Code'}
              aria-label={language === 'sk' ? 'Môj QR Kód' : 'My QR Code'}
            >
              <QrCode size={18} />
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="w-9 h-9 rounded-full bg-slate-50 dark:bg-[#010314] text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-[#FFFFFF] border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE] dark:hover:border-[#6633EE] flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              title={language === 'sk' ? 'Obnoviť pečiatky' : 'Refresh Stamps'}
              aria-label={language === 'sk' ? 'Obnoviť pečiatky' : 'Refresh Stamps'}
            >
              <RotateCw size={15} className={refreshing ? 'animate-spin text-[#6633EE]' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Držiteľ karty */}
      <div className="mb-6 relative z-10 text-left">
        <p className="text-[10px] uppercase tracking-wider font-medium text-[#94A3B8] dark:text-[#C7CAE0]/60">{t.cardHolder}</p>
        <p className="text-lg sm:text-xl font-semibold truncate text-[#0B0D22] dark:text-[#FFFFFF]">{fullName || t.guest}</p>
      </div>

      {/* Mriežka s pečiatkami */}
      <div className="space-y-3 relative z-10 text-left">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#64748B] dark:text-[#C7CAE0] tabular-nums">
            {t.stamps} ({stampsCount} / {maxStamps})
          </p>
          {isFull && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#FFFFFF] bg-[#6633EE] px-2.5 py-0.5 rounded-full border border-[#A78BFA]/50 shadow-[0_0_12px_rgba(102,51,238,0.7)]">
              {language === 'sk' ? '🎉 Plná karta' : '🎉 Full Card'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
          {Array.from({ length: maxStamps }).map((_, index) => {
            const isStamped = index < stampsCount;
            const price = isStamped ? activeStampsPrices[index] : null;

            let stampStyle = {};
            let stampClass = "bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-[#94A3B8] dark:text-[#C7CAE0]/60";

            if (isStamped) {
              const hueStep = (hueEnd - hueStart) / (maxStamps - 1 || 1);
              const currentHue = hueStart + index * hueStep;

              stampStyle = {
                background: `linear-gradient(135deg, hsl(${currentHue}, 85%, 60%), hsl(${currentHue + 15}, 80%, 45%))`,
                boxShadow: `0 0 14px hsla(${currentHue}, 80%, 55%, 0.5)`,
              };
              stampClass = "text-white border-transparent hover:scale-105";
            }

            return (
              <div
                key={index}
                style={stampStyle}
                title={isStamped && price ? `${price.toFixed(2)} €` : `${language === 'sk' ? 'Pečiatka' : 'Stamp'} ${index + 1}`}
                className={`aspect-square flex items-center justify-center rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 select-none cursor-default ${stampClass}`}
              >
                {isStamped ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
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
      <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#2B2F49] relative z-10">
        {isFull ? (
          <div className="text-center p-3 rounded-full bg-[#6633EE] text-white shadow-[0_0_20px_rgba(102,51,238,0.5)]">
            <p className="font-medium text-xs sm:text-sm">{t.discountEligible(formattedAverage)}</p>
          </div>
        ) : stampsCount > 0 ? (
          <p className="text-xs text-center font-normal text-[#64748B] dark:text-[#C7CAE0]">
            {t.currentDiscountValue} <span className="font-semibold text-[#0B0D22] dark:text-[#FFFFFF] bg-slate-100 dark:bg-[#010314] px-2.5 py-0.5 rounded-full border border-[#E2E8F0] dark:border-[#2B2F49]">{formattedAverage} €</span>
          </p>
        ) : (
          <p className="text-xs text-center font-normal text-[#64748B] dark:text-[#C7CAE0]">{t.collectStamps}</p>
        )}
      </div>
    </div>
  );
}