'use client';

import React from 'react';
import { MassageType, PackagesData, PackageItem, Feature } from '@/app/types';
import { PRICES } from '@/app/constants/config';
import { useTheme } from '@/app/lib/ThemeContext';
import { useLanguage } from '@/app/lib/LanguageContext';
import BorderGlow from './BorderGlow';
import { 
  Crown, Gem, Clock, ArrowLeft, Check, Sparkles, Flame, 
  Heart, Zap, Droplets, Gift, Star, ShieldCheck
} from 'lucide-react';
import { 
  LipsIcon, FeatherTouchIcon, IntimateFlameIcon, ChampagneClinkIcon, 
  PercussiveTherapyIcon, IntimateHotOilIcon, SensualTouchIcon,
  FullBodySilhouetteIcon, ProstateButtIcon, BoxersGroinIcon
} from '@/app/components/icons/AdultSensualIcons';

type Props = {
  selectedType: MassageType;
  packagesData: PackagesData;
  t: any;
  onSelectDuration: (duration: number) => void;
  onBack: () => void;
};

// Pôvodné orientačné ceny pre preškrtnutú zľavovú vizualizáciu
const ORIGINAL_PRICES: Record<string, Record<number, string>> = {
  Klasik: { 30: '35 €', 45: '48 €', 60: '55 €' },
  VIP: { 45: '75 €', 60: '85 €', 90: '110 €' }
};

export default function Step2Packages({ selectedType, packagesData, t, onSelectDuration, onBack }: Props) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isSK = language === 'sk';
  const isDark = theme === 'dark';
  const isVip = selectedType === 'VIP';
  const cardBg = isVip 
    ? (isDark ? 'rgba(28, 8, 18, 0.85)' : 'rgba(255, 245, 247, 0.9)') 
    : (isDark ? '#0B0D22' : '#FFFFFF');

  const getVipBadge = (duration: number) => {
    if (!isVip) return null;

    if (duration === 45) {
      return (
        <div className="w-7 h-7 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 flex items-center justify-center text-[#FF5A7A]" title="VIP Supreme">
          <Crown size={14} className="text-[#FF5A7A]" />
        </div>
      );
    }
    if (duration === 60) {
      return (
        <div className="w-7 h-7 rounded-full bg-[#FF5A7A]/25 border border-[#FF5A7A]/40 flex items-center justify-center text-[#FF5A7A]" title="VIP Pro">
          <Crown size={14} className="text-[#FF5A7A] fill-[#FF5A7A]/30" />
        </div>
      );
    }
    if (duration === 90) {
      return (
        <div className="w-7 h-7 rounded-full bg-[#FF5A7A]/25 border border-[#FF5A7A]/40 flex items-center justify-center text-[#FF5A7A]" title="VIP Max">
          <Gem size={14} className="text-[#FF5A7A] animate-pulse" />
        </div>
      );
    }
    return null;
  };

  const renderProcedureIcon = (feat: Feature, isVipItem: boolean) => {
    const text = feat.text.toLowerCase();

    if (isVipItem) {
      if (text.includes('darček') || text.includes('gift')) {
        return (
          <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Gift size={11} className="text-[#FF5A7A]" />
          </div>
        );
      }
      if (text.includes('drink') || text.includes('nealko') || text.includes('nápoj') || text.includes('soft drink')) {
        return (
          <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <ChampagneClinkIcon size={11} className="text-[#FF5A7A]" />
          </div>
        );
      }
      if (text.includes('vibračná') || text.includes('perkusívna') || text.includes('pištoľ') || text.includes('terapia') || text.includes('percussive') || text.includes('gun')) {
        return (
          <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <PercussiveTherapyIcon size={11} className="text-[#FF5A7A]" />
          </div>
        );
      }
      if (text.includes('prostaty') || text.includes('prostata') || text.includes('prostate')) {
        return (
          <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <ProstateButtIcon size={12} className="text-[#FF5A7A]" />
          </div>
        );
      }
      if (text.includes('slabín') || text.includes('senzuálna') || text.includes('triesiel') || text.includes('intense') || text.includes('groin') || text.includes('sensual')) {
        return (
          <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <BoxersGroinIcon size={12} className="text-[#FF5A7A]" />
          </div>
        );
      }
      if (text.includes('hĺbková') || text.includes('celého tela') || text.includes('full body') || text.includes('deep')) {
        return (
          <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <FullBodySilhouetteIcon size={12} className="text-[#FF5A7A]" />
          </div>
        );
      }
      if (text.includes('olej') || text.includes('olejov') || text.includes('oil') || text.includes('oils')) {
        return (
          <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <IntimateHotOilIcon size={12} className="text-[#FF5A7A]" />
          </div>
        );
      }
      if (text.includes('uvoľnenie') || text.includes('relax') || text.includes('maximálne')) {
        return (
          <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <SensualTouchIcon size={12} className="text-[#FF5A7A]" />
          </div>
        );
      }
      return (
        <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <LipsIcon size={11} className="text-[#FF5A7A]" />
        </div>
      );
    }

    // Klasik masáže
    return (
      <div className="w-5 h-5 rounded-full bg-[#0284C7]/15 border border-[#38BDF8]/30 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
        <Check size={11} strokeWidth={2.5} />
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans text-left">
      {/* 🚀 HORNÝ HEADER: TRUST SIGNALS & SPÄŤ TLAČIDLO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
        <div className="text-left space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              selectedType === 'VIP'
                ? 'bg-[#FF5A7A]/15 text-[#FF5A7A] border border-[#FF5A7A]/30'
                : 'bg-[#0284C7]/15 text-[#0284C7] dark:text-[#38BDF8] border border-[#38BDF8]/30'
            }`}>
              <span>{selectedType === 'VIP' ? (isSK ? 'VIP Premium Rituály' : 'VIP Premium Rituals') : (isSK ? 'Klasické Masáže' : 'Classic Massages')}</span>
              {selectedType === 'VIP' && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FF5A7A]/20 border border-[#FF5A7A]/40 text-[#FF5A7A] text-[9px] font-black">
                  18+
                </span>
              )}
            </span>

            {/* TRUST SIGNAL BADGE */}
            <div className="flex items-center gap-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="font-bold text-[#0B0D22] dark:text-white">4.9</span>
              <span className="hidden sm:inline">({isSK ? 'Top Voľba' : 'Top Choice'})</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0D22] dark:text-white">
            {isSK ? 'Klienti si ' : 'Packages clients '}
            <span className={`bg-gradient-to-r ${
              selectedType === 'VIP'
                ? 'from-[#FF5A7A] via-[#F43F5E] to-[#FB7185]'
                : 'from-[#0284C7] via-[#38BDF8] to-[#818CF8]'
            } bg-clip-text text-transparent`}>
              {isSK ? 'najviac vyberajú' : 'choose most often'}
            </span>
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-normal">
            {isSK 
              ? 'Garantovaná diskrétnosť, privátny priestor a prémiový individuálny prístup.' 
              : 'Guaranteed discretion, private environment, and premium personal approach.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="self-start sm:self-center btn-secondary text-xs font-medium px-4 py-2 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md"
        >
          <ArrowLeft size={14} />
          <span>{isSK ? 'Späť na úroveň' : 'Back to Level'}</span>
        </button>
      </div>

      {/* 💎 3 KARTY BALÍČKOV V ŠTÝLE MODERNÉHO SAAS PRICINGU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-4 relative">
        {packagesData[selectedType].map((pkg: PackageItem, index: number) => {
          const priceStr =
            selectedType === 'Klasik'
              ? PRICES.Klasik[pkg.duration as 30 | 45 | 60]
              : PRICES.VIP[pkg.duration as 45 | 60 | 90];

          const originalPrice = ORIGINAL_PRICES[selectedType]?.[pkg.duration] || '';
          const isTop1 = index === 1; // Stredná karta je najžiadanejšia

          return (
            <div
              key={pkg.duration}
              className={`relative flex flex-col transition-all duration-300 ${
                isTop1 ? 'md:-translate-y-2 z-20' : 'z-10'
              }`}
            >
              {/* 👑 NEONOVÁ KORUNKA NAD NAJŽIADANEJŠOU KARTOU */}
              {isTop1 && (
                <div className="hidden md:flex absolute -top-8 right-6 items-center justify-center pointer-events-none z-30 animate-pulse">
                  <svg 
                    width="32" 
                    height="26" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={`rotate-12 ${
                      isVip 
                        ? 'text-[#FF5A7A] filter drop-shadow-[0_0_8px_rgba(255,90,122,0.9)]'
                        : 'text-[#38BDF8] filter drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                    }`}
                  >
                    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                  </svg>
                </div>
              )}

              {/* BORDER GLOW KARTA */}
              <BorderGlow
                edgeSensitivity={20}
                glowColor={isVip ? '350 90 80' : '210 85 80'}
                backgroundColor={cardBg}
                borderRadius={20}
                glowRadius={36}
                glowIntensity={isTop1 ? 1.25 : 0.85}
                coneSpread={28}
                colors={
                  isVip
                    ? isTop1 
                      ? ['#FF5A7A', '#F43F5E', '#EF4444', '#E11D48']
                      : ['#FF5A7A', '#F43F5E']
                    : isTop1
                    ? ['#38BDF8', '#818CF8', '#C084FC']
                    : ['#38BDF8', '#818CF8']
                }
                className={`w-full h-full rounded-2xl transition-all duration-300 ${
                  isTop1 
                    ? isVip 
                      ? 'shadow-xl dark:shadow-[0_0_35px_rgba(255,90,122,0.25)] border border-[#FF5A7A]/40' 
                      : 'shadow-xl dark:shadow-[0_0_35px_rgba(56,189,248,0.2)] border border-[#38BDF8]/40'
                    : 'shadow-md dark:shadow-xl border border-slate-200/80 dark:border-slate-800/80'
                }`}
              >
                <div className="p-6 sm:p-7 flex flex-col justify-between h-full relative overflow-hidden rounded-2xl">
                  
                  {/* 🔮 VIP TEXTÚRA V POZADÍ KARTY */}
                  {isVip && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
                      <svg className="absolute inset-0 w-full h-full opacity-[0.035] dark:opacity-[0.06] text-[#FF5A7A]" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id={`vip-pattern-${pkg.duration}`} width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
                            <path d="M18 18 C18 11 22 7 26 3 C27 8 31 10 33 15 C36 20 33 27 27 29 C21 30 18 24 18 18 Z" fill="currentColor" />
                            <text x="68" y="28" fontSize="13" fontWeight="900" fontFamily="sans-serif" fill="currentColor" letterSpacing="0.5">18+</text>
                            <g transform="translate(18, 62)">
                              <rect x="0" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                              <line x1="8" y1="6" x2="8" y2="18" stroke="currentColor" strokeWidth="1.5" />
                              <line x1="0" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M4 6 C4 3 6 2 8 6 C10 2 12 3 12 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                            </g>
                            <path d="M74 72 L76 66 L78 72 L84 74 L78 76 L76 82 L74 76 L68 74 Z" fill="currentColor" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#vip-pattern-${pkg.duration})`} />
                      </svg>
                    </div>
                  )}

                  <div className="relative z-10">
                    {/* HORNÝ BADGE A VIP IKONA S 18+ */}
                    <div className="flex items-center justify-between mb-2">
                      {isTop1 ? (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          isVip
                            ? 'bg-[#FF5A7A]/25 border border-[#FF5A7A]/50 text-[#FF5A7A] dark:text-white shadow-[0_0_12px_rgba(255,90,122,0.35)]'
                            : 'bg-[#0284C7]/20 border border-[#38BDF8]/50 text-[#0284C7] dark:text-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                        }`}>
                          <Sparkles size={12} className={isVip ? 'text-[#FF5A7A]' : 'text-[#38BDF8]'} />
                          <span>{selectedType === 'VIP' ? (isSK ? 'Hit mesiaca' : 'Monthly Hit') : (isSK ? 'Najžiadanejší' : 'Most Popular')}</span>
                        </div>
                      ) : (
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isVip 
                            ? 'bg-[#FF5A7A]/10 text-[#FF5A7A] dark:text-[#FDA4AF] border border-[#FF5A7A]/20' 
                            : 'bg-slate-100 dark:bg-slate-800/60 text-[#64748B] dark:text-[#94A3B8] border border-slate-200/60 dark:border-slate-700/60'
                        }`}>
                          {pkg.badge}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        {isVip && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#FF5A7A]/20 border border-[#FF5A7A]/40 text-[#FF5A7A] text-[9px] font-black tracking-wider">
                            18+
                          </span>
                        )}
                        {getVipBadge(pkg.duration)}
                      </div>
                    </div>

                    {/* PREŠKRTNUTÁ PÔVODNÁ CENA */}
                    {originalPrice && (
                      <span className={`text-xs line-through font-mono ${
                        isVip ? 'text-[#FF5A7A]/60' : 'text-[#94A3B8] dark:text-[#64748B]'
                      }`}>
                        {originalPrice}
                      </span>
                    )}

                    {/* HLAVNÁ CENA A TRVANIE */}
                    <div className="flex items-baseline gap-1.5 mb-5 mt-0.5">
                      <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                        isVip 
                          ? 'text-[#FF5A7A] drop-shadow-[0_0_12px_rgba(255,90,122,0.35)]' 
                          : 'text-[#0B0D22] dark:text-white'
                      }`}>
                        {priceStr}
                      </span>
                      <span className={`text-xs font-normal ${
                        isVip ? 'text-[#FDA4AF] dark:text-[#FF809B]' : 'text-[#64748B] dark:text-[#94A3B8]'
                      }`}>
                        / {pkg.duration} min
                      </span>
                    </div>

                    {/* 📋 ŠTRUKTÚROVANÉ RIADKY PROCEDÚR SO ZJEMNENÝMI PREDEĽMI */}
                    <div className="space-y-3.5 mb-6 text-left">
                      
                      {/* 1. RIADOK: ZAMERANIE MASÁŽE */}
                      <div className={`border-b pb-3 ${
                        isVip ? 'border-[#FF5A7A]/15 dark:border-[#FF5A7A]/20' : 'border-slate-200/60 dark:border-slate-800/60'
                      }`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
                          <Zap size={12} className={isVip ? 'text-[#FF5A7A]' : 'text-[#0284C7] dark:text-[#38BDF8]'} />
                          <span>{isSK ? 'Zameranie masáže' : 'Session Focus'}</span>
                        </div>
                        <p className="text-xs font-semibold text-[#1E293B] dark:text-[#F1F5F9] leading-snug">
                          {pkg.desc || (isSK ? `${pkg.duration} min intenzívna starostlivosť` : `${pkg.duration} min intensive care`)}
                        </p>
                      </div>

                      {/* 2. RIADOK: OLEJE & AROMATERAPIA */}
                      <div className={`border-b pb-3 ${
                        isVip ? 'border-[#FF5A7A]/15 dark:border-[#FF5A7A]/20' : 'border-slate-200/60 dark:border-slate-800/60'
                      }`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
                          <Droplets size={12} className={isVip ? 'text-[#FF5A7A]' : 'text-[#0284C7] dark:text-[#38BDF8]'} />
                          <span>{isSK ? 'Oleje & Aromaterapia' : 'Oils & Aromatherapy'}</span>
                        </div>
                        <p className="text-xs text-[#334155] dark:text-[#CBD5E1] font-medium leading-snug">
                          {isVip 
                            ? (isSK ? 'Prírodné intímne & hrejivé éterické oleje' : 'Natural intimate & warming essential oils') 
                            : (isSK ? 'Výberové prírodné relaxačné oleje' : 'Selected natural relaxation oils')}
                        </p>
                      </div>

                      {/* 3. RIADOK: KOMPLETNÝ ZOZNAM PROCEDÚR */}
                      <div className="pb-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-2">
                          <Heart size={12} className={isVip ? 'text-[#FF5A7A]' : 'text-[#0284C7] dark:text-[#38BDF8]'} />
                          <span>{isSK ? 'Zahrnuté procedúry & výhody' : 'Included procedures & benefits'}</span>
                        </div>
                        <ul className="space-y-2">
                          {pkg.features.map((feat: Feature, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] dark:text-[#DDE0F2] font-normal">
                              {renderProcedureIcon(feat, isVip)}
                              <span className="leading-tight pt-0.5">{feat.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  </div>

                  {/* 🔘 AKČNÉ TLAČIDLO S TRANSPARENTNOU CENOU */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => onSelectDuration(pkg.duration)}
                      className={`w-full min-h-[46px] h-[46px] rounded-xl font-bold text-xs transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center relative overflow-hidden group/btn ${
                        isVip
                          ? isTop1
                            ? 'bg-gradient-to-b from-[#E11D48] via-[#BE123C] to-[#881337] hover:from-[#F43F5E] hover:via-[#E11D48] hover:to-[#9F1239] text-white uppercase tracking-wider border border-[#FDA4AF]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_0_20px_rgba(225,29,72,0.35),0_4px_12px_rgba(0,0,0,0.35)]'
                            : 'bg-gradient-to-b from-[#9F1239] via-[#881337] to-[#4C0519] hover:from-[#BE123C] hover:via-[#9F1239] hover:to-[#5C0720] text-white uppercase tracking-wider border border-[#FB7185]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.35)]'
                          : isTop1
                          ? 'bg-gradient-to-b from-[#0284C7] via-[#0369A1] to-[#075985] hover:from-[#0EA5E9] hover:via-[#0284C7] hover:to-[#0369A1] text-white border border-[#38BDF8]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(2,132,199,0.35),0_4px_12px_rgba(0,0,0,0.35)]'
                          : 'bg-gradient-to-b from-[#0284C7] via-[#0369A1] to-[#075985] hover:from-[#0EA5E9] hover:via-[#0284C7] hover:to-[#0369A1] text-white border border-[#38BDF8]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_2px_8px_rgba(2,132,199,0.3)]'
                      }`}
                    >
                      {/* Metalický svetelný odlesk pri hoveri */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                      <span>{isSK ? `Vybrať ${pkg.duration} min • ${priceStr}` : `Select ${pkg.duration} min • ${priceStr}`}</span>
                    </button>
                  </div>

                </div>
              </BorderGlow>
            </div>
          );
        })}
      </div>
    </div>
  );
}