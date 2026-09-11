'use client';

import React from 'react';
import { MassageType } from '@/app/types';
import { useTheme } from '@/app/lib/ThemeContext';
import { useLanguage } from '@/app/lib/LanguageContext';
import BorderGlow from './BorderGlow';
import { 
  Sparkles, ShieldCheck, Zap,
  Flame, Droplets, Check
} from 'lucide-react';

type Props = {
  t: any;
  onSelect: (type: MassageType) => void;
};

export default function Step1Level({ t, onSelect }: Props) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isSK = language === 'sk';
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#0B0D22' : '#FFFFFF';
  const vipCardBg = isDark ? 'rgba(28, 8, 18, 0.92)' : 'rgba(255, 245, 247, 0.95)';

  return (
    <div className="max-w-4xl mx-auto font-sans text-center space-y-3 sm:space-y-5 px-1 sm:px-0">
      
      {/* 🚀 SUB-HEADER: ZVOĽTE SI ÚROVEŇ (BEZ ZBYTOČNÉHO PODTITULKU) */}
      <div className="max-w-md mx-auto">
        <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-[#0B0D22] dark:text-white">
          {isSK ? 'Vyberte si ' : 'Choose '}
          <span className="bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#EC4899] bg-clip-text text-transparent">
            {isSK ? 'úroveň masáže' : 'massage level'}
          </span>
        </h2>
      </div>

      {/* 🔮 RESPONZÍVNE KARTY: KLASIK & VIP (PÔVODNÝ LUXUSNÝ LOOK KARIET S NOVÝMI VIBE BUTTONMI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6 lg:gap-8 items-stretch justify-center pt-1">
        
        {/* ====================================================================
            1. KARTA: KLASIK MASÁŽ (ELEKTRICKÝ CYAN / MODRÝ ŠTÝL, BUTTON VĽAVO)
            ==================================================================== */}
        <div className="relative flex flex-col group w-full">
          <BorderGlow
            edgeSensitivity={30}
            glowColor="210 85 80"
            backgroundColor={cardBg}
            borderRadius={24}
            glowRadius={44}
            glowIntensity={1.1}
            coneSpread={35}
            colors={['#38BDF8', '#818CF8', '#C084FC']}
            className="w-full h-full rounded-[24px] shadow-lg dark:shadow-[0_0_35px_rgba(56,189,248,0.12)] hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden border border-[#E2E8F0] dark:border-[#38BDF8]/20"
          >
            <div 
              onClick={() => onSelect('Klasik')}
              className="w-full h-full p-4 sm:p-5 flex flex-col justify-between text-left select-none relative z-10 transition-colors"
            >
              <div>
                {/* HORNÝ RIADOK: IKONA + NÁZOV */}
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 backdrop-blur-md flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] shadow-[0_0_18px_rgba(56,189,248,0.25)] shrink-0 transition-transform duration-300 group-hover:scale-105">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284C7] dark:text-[#38BDF8]">
                      {isSK ? 'Uvoľnenie & Relax' : 'Relax & Recovery'}
                    </span>
                    <h3 className="font-extrabold text-lg sm:text-xl text-[#0B0D22] dark:text-white tracking-tight leading-tight">
                      {isSK ? 'Klasická Masáž' : 'Classic Massage'}
                    </h3>
                  </div>
                </div>

                {/* BENEFITY / VÝHODY */}
                <div className="space-y-2 py-2">
                  <div className="flex items-center gap-2.5 text-xs text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] shrink-0">
                      <Zap size={11} />
                    </div>
                    <span className="font-medium">{isSK ? 'Hĺbková regenerácia a uvoľnenie svalov' : 'Deep muscle recovery & tension relief'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#818CF8]/15 border border-[#818CF8]/30 flex items-center justify-center text-[#818CF8] shrink-0">
                      <Droplets size={11} />
                    </div>
                    <span className="font-medium">{isSK ? 'Výberové hrejivé & bylinné oleje' : 'Premium herbal & warming oils'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#A78BFA]/15 border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shrink-0">
                      <Check size={11} strokeWidth={2.5} />
                    </div>
                    <span className="font-medium">{isSK ? 'Individuálny tlak a prístup' : 'Customized pressure & gentle care'}</span>
                  </div>
                </div>
              </div>

              {/* 🔘 AKČNÉ TLAČIDLO (VIBE Z PREDLOHY: TMAVÝ DOCK, MODRÝ AKCENT ▶, ZAROVNANÝ VĽAVO) */}
              <div className="pt-3 flex justify-start">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect('Klasik');
                  }}
                  className="min-h-[46px] h-[46px] px-6 rounded-2xl bg-[#0F142D] hover:bg-[#161D40] dark:bg-[#070A1E] dark:hover:bg-[#0D1233] border border-[#38BDF8]/40 hover:border-[#38BDF8]/70 shadow-[0_4px_16px_rgba(0,0,0,0.25),0_0_12px_rgba(56,189,248,0.15)] hover:shadow-[0_4px_22px_rgba(56,189,248,0.3)] transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-2.5 relative overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                  <span className="text-white font-extrabold text-sm sm:text-base tracking-wide">
                    {isSK ? 'Zvoliť Klasik' : 'Select Classic'}
                  </span>
                  <span className="text-[#38BDF8] text-xs font-black transition-transform duration-200 group-hover/btn:translate-x-1">
                    ▶
                  </span>
                </button>
              </div>

            </div>
          </BorderGlow>
        </div>

        {/* ====================================================================
            2. KARTA: VIP PREMIUM MASÁŽ (HOT VIP RUBY / ROSE ŠTÝL, BUTTON VPRAVO)
            ==================================================================== */}
        <div className="relative flex flex-col group w-full">
          <BorderGlow
            edgeSensitivity={30}
            glowColor="350 90 80"
            backgroundColor={vipCardBg}
            borderRadius={24}
            glowRadius={48}
            glowIntensity={1.3}
            coneSpread={35}
            colors={['#FF5A7A', '#F43F5E', '#EF4444', '#E11D48']}
            className="w-full h-full rounded-[24px] shadow-xl dark:shadow-[0_0_40px_rgba(255,90,122,0.22)] hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden border border-[#FF5A7A]/35"
          >
            <div 
              onClick={() => onSelect('VIP')}
              className="w-full h-full p-4 sm:p-5 flex flex-col justify-between text-left select-none relative z-10 bg-gradient-to-b from-[#FF5A7A]/[0.10] via-transparent to-[#EF4444]/[0.05]"
            >
              {/* 🔮 TEXTÚROVANÝ SVG WATERMARK VZOR */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px] z-0">
                <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.07] text-[#FF5A7A]" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="vip-card-pattern" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
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
                  <rect width="100%" height="100%" fill="url(#vip-card-pattern)" />
                </svg>
              </div>

              {/* HORNÝ RIADOK: IKONA + NÁZOV + 18+ */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FF5A7A]/20 border border-[#FF5A7A]/40 backdrop-blur-md flex items-center justify-center text-[#FF5A7A] shadow-[0_0_20px_rgba(255,90,122,0.4)] shrink-0 transition-transform duration-300 group-hover:scale-105">
                    <Flame size={22} className="fill-[#FF5A7A]/30 text-[#FF5A7A]" />
                    <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-[#EF4444] text-white text-[8px] font-black tracking-wider shadow-[0_0_6px_rgba(239,68,68,0.8)]">
                      18+
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5A7A]">
                        {isSK ? 'Exkluzívny rituál' : 'Exclusive ritual'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] text-[9px] font-black tracking-wider">
                        HOT VIP
                      </span>
                    </div>
                    <h3 className="font-extrabold text-lg sm:text-xl bg-gradient-to-r from-[#FF5A7A] via-[#F43F5E] to-[#FB7185] bg-clip-text text-transparent tracking-tight leading-tight">
                      VIP Premium
                    </h3>
                  </div>
                </div>

                {/* BENEFITY / VÝHODY */}
                <div className="space-y-2 py-2">
                  <div className="flex items-center gap-2.5 text-xs text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 flex items-center justify-center text-[#FF5A7A] shrink-0">
                      <Sparkles size={11} />
                    </div>
                    <span className="font-medium">{isSK ? 'Kompletný senzuálny rituál s intímnou atmosférou' : 'Full sensual ritual with intimate ambience'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 flex items-center justify-center text-[#FF5A7A] shrink-0">
                      <Flame size={11} />
                    </div>
                    <span className="font-medium">{isSK ? 'Exotické hrejivé oleje & maximálna diskrétnosť' : 'Exotic warming oils & 100% discretion'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#FB7185]/15 border border-[#FB7185]/30 flex items-center justify-center text-[#FB7185] shrink-0">
                      <Sparkles size={11} />
                    </div>
                    <span className="font-medium">{isSK ? 'Vibračná pištoľ (Theragun) + Welcome Drink v cene' : 'Theragun massage + Welcome Drink included'}</span>
                  </div>
                </div>
              </div>

              {/* 👑 AKČNÉ TLAČIDLO (VIBE Z PREDLOHY: TMAVÝ DOCK, ČERVENÝ AKCENT ▶, ZAROVNANÝ VPRAVO) */}
              <div className="pt-3 relative z-10 flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect('VIP');
                  }}
                  className="min-h-[46px] h-[46px] px-6 rounded-2xl bg-[#200A19] hover:bg-[#2C0E23] dark:bg-[#12040E] dark:hover:bg-[#1D0717] border border-[#FF5A7A]/40 hover:border-[#FF5A7A]/70 shadow-[0_4px_16px_rgba(0,0,0,0.25),0_0_12px_rgba(255,90,122,0.15)] hover:shadow-[0_4px_22px_rgba(255,90,122,0.3)] transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-2.5 relative overflow-hidden group/vipbtn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/vipbtn:translate-x-full transition-transform duration-700 pointer-events-none" />
                  <span className="text-white font-extrabold text-sm sm:text-base tracking-wide">
                    {isSK ? 'Zvoliť VIP' : 'Select VIP'}
                  </span>
                  <span className="text-[#FF5A7A] text-xs font-black transition-transform duration-200 group-hover/vipbtn:translate-x-1">
                    ▶
                  </span>
                </button>
              </div>

            </div>
          </BorderGlow>
        </div>

      </div>
    </div>
  );
}