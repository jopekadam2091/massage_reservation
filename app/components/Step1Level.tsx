'use client';

import React from 'react';
import { MassageType } from '@/app/types';
import { useTheme } from '@/app/lib/ThemeContext';
import { useLanguage } from '@/app/lib/LanguageContext';
import BorderGlow from './BorderGlow';
import { 
  Sparkles, ShieldCheck, Zap,
  Flame, Droplets, Clock, Gift, Star, CheckCircle2
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
  const vipCardBg = isDark ? 'rgba(28, 8, 18, 0.85)' : 'rgba(255, 245, 247, 0.9)';

  return (
    <div className="max-w-4xl mx-auto font-sans text-center space-y-6">
      
      {/* 🚀 HLAVIČKA VÝBERU ÚROVNE S TRUST SIGNÁLMI */}
      <div className="max-w-xl mx-auto mb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] text-[11px] font-bold uppercase tracking-wider">
          <Sparkles size={12} />
          <span>{isSK ? 'Krok 1: Výber starostlivosti' : 'Step 1: Choose Care Level'}</span>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0D22] dark:text-white">
          {isSK ? 'Zvoľte si úroveň ' : 'Choose the level of '}
          <span className="bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#EC4899] bg-clip-text text-transparent">
            {isSK ? 'vášho rituálu' : 'your ritual'}
          </span>
        </h2>

        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-normal leading-relaxed pt-1">
          {isSK 
            ? 'Kliknite na kartu pre pokračovanie na výber dĺžky a konkrétnych procedúr.' 
            : 'Click a card to proceed with session duration and procedure selection.'}
        </p>
      </div>

      {/* 🔮 KRUHOVÉ KARTY (ORBITAL CIRCULAR CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center justify-center pt-2">
        
        {/* ====================================================================
            1. KRUHOVÁ KARTA: KLASIK MASÁŽ (JEMNE MODRÝ METALICKÝ ŠTÝL)
            ==================================================================== */}
        <div className="relative flex flex-col items-center justify-center group w-full">
          <BorderGlow
            edgeSensitivity={25}
            glowColor="210 85 80"
            backgroundColor={cardBg}
            borderRadius={9999}
            glowRadius={42}
            glowIntensity={1.1}
            coneSpread={32}
            colors={['#38BDF8', '#818CF8', '#C084FC']}
            className="w-full max-w-[370px] sm:max-w-[390px] aspect-square rounded-full shadow-lg dark:shadow-[0_0_40px_rgba(56,189,248,0.15)] hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div 
              onClick={() => onSelect('Klasik')}
              className="w-full h-full pt-5 sm:pt-6 px-6 pb-14 sm:pb-16 flex flex-col items-center justify-between text-center select-none relative z-10"
            >
              
              {/* IKONA VO SVIETIACOM KRUHU - HORE */}
              <div className="w-11 h-11 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 backdrop-blur-md flex items-center justify-center text-[#38BDF8] shadow-[0_0_18px_rgba(56,189,248,0.35)] transition-transform duration-300 group-hover:scale-110">
                <ShieldCheck size={20} />
              </div>

              {/* 📏 MEDZERA O VEĽKOSTI NÁZVU MASÁŽE (32px) MEDZI IKONKOU A TEXTOM */}
              <div className="h-8 w-full pointer-events-none" aria-hidden="true" />

              {/* STREDNÝ BLOK: NÁZOV, CENA & BENEFITY */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-2xl text-[#0B0D22] dark:text-white tracking-tight leading-tight">
                  {isSK ? 'Klasická Masáž' : 'Classic Massage'}
                </h3>
                
                <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-[#0284C7] dark:text-[#38BDF8] pb-1">
                  <span>{isSK ? 'od 30 €' : 'from 30 €'}</span>
                  <span className="text-[#64748B] dark:text-[#94A3B8] font-normal font-sans">• 30 / 45 / 60 min</span>
                </div>

                {/* VÝHODY V MINI RIADKOCH S IKONOVÝMI KONTAJNERMI */}
                <div className="space-y-1.5 pt-1 max-w-[240px] mx-auto text-left">
                  <div className="flex items-center gap-2 text-[11px] text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/25 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] shrink-0">
                      <Zap size={11} />
                    </div>
                    <span className="truncate">{isSK ? 'Hĺbková regenerácia svalov' : 'Deep muscle recovery'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#818CF8]/15 border border-[#818CF8]/25 flex items-center justify-center text-[#818CF8] shrink-0">
                      <Droplets size={11} />
                    </div>
                    <span className="truncate">{isSK ? 'Výberové bylinné oleje' : 'Selected herbal oils'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#A78BFA]/15 border border-[#A78BFA]/25 flex items-center justify-center text-[#A78BFA] shrink-0">
                      <Clock size={11} />
                    </div>
                    <span className="truncate">{isSK ? 'Voľba dĺžky podľa potreby' : 'Flexible duration options'}</span>
                  </div>
                </div>
              </div>

              {/* 🔘 JEMNE MODRÝ METALICKÝ BUTTON S TRANSPARENTNOU CENOU */}
              <div className="w-full flex justify-center mb-2 mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect('Klasik');
                  }}
                  className="w-full max-w-[220px] min-h-[44px] h-[44px] rounded-full bg-gradient-to-b from-[#0284C7] via-[#0369A1] to-[#075985] hover:from-[#0EA5E9] hover:via-[#0284C7] hover:to-[#0369A1] text-white font-bold text-xs border border-[#38BDF8]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_10px_rgba(2,132,199,0.35)] transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center relative overflow-hidden group/btn"
                >
                  {/* Metalický svetelný odlesk pri hoveri */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                  <span className="tracking-wide">{isSK ? 'Zvoliť Klasik • od 30 €' : 'Select Classic • from 30 €'}</span>
                </button>
              </div>

            </div>
          </BorderGlow>
        </div>

        {/* ====================================================================
            2. KRUHOVÁ KARTA: VIP PREMIUM MASÁŽ (HOT VIP ČERVENÝ ŠTÝL)
            ==================================================================== */}
        <div className="relative flex flex-col items-center justify-center group w-full">
          
          {/* 👑 HOT VIP ČERVENÁ NEONOVÁ KORUNKA NAD KRUHOM */}
          <div className="hidden md:flex absolute -top-7 right-14 items-center justify-center pointer-events-none z-30 animate-pulse">
            <svg 
              width="34" 
              height="28" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="rotate-12 text-[#FF5A7A] filter drop-shadow-[0_0_10px_rgba(255,90,122,0.9)]"
            >
              <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
            </svg>
          </div>

          <BorderGlow
            edgeSensitivity={25}
            glowColor="350 90 80"
            backgroundColor={vipCardBg}
            borderRadius={9999}
            glowRadius={48}
            glowIntensity={1.35}
            coneSpread={30}
            colors={['#FF5A7A', '#F43F5E', '#EF4444', '#E11D48']}
            className="w-full max-w-[370px] sm:max-w-[390px] aspect-square rounded-full shadow-xl dark:shadow-[0_0_50px_rgba(255,90,122,0.3)] hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden border border-[#FF5A7A]/30"
          >
            <div 
              onClick={() => onSelect('VIP')}
              className="w-full h-full pt-5 sm:pt-6 px-6 pb-14 sm:pb-16 flex flex-col items-center justify-between text-center select-none relative z-10 rounded-full backdrop-blur-xl bg-gradient-to-b from-[#FF5A7A]/[0.14] via-transparent to-[#EF4444]/[0.08] overflow-hidden"
            >
              {/* 🔮 TEXTÚROVANÝ SVG WATERMARK VZOR (OHNÍKY, DARČEKY, 18+, SPARKLES) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full z-0">
                <svg className="absolute inset-0 w-full h-full opacity-[0.05] dark:opacity-[0.08] text-[#FF5A7A]" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="vip-orb-pattern" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
                      {/* 🔥 Ohník */}
                      <path d="M18 18 C18 11 22 7 26 3 C27 8 31 10 33 15 C36 20 33 27 27 29 C21 30 18 24 18 18 Z" fill="currentColor" />
                      {/* 🔞 18+ mini text */}
                      <text x="68" y="28" fontSize="13" fontWeight="900" fontFamily="sans-serif" fill="currentColor" letterSpacing="0.5">18+</text>
                      {/* 🎁 Darček */}
                      <g transform="translate(18, 62)">
                        <rect x="0" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="8" y1="6" x2="8" y2="18" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="0" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4 6 C4 3 6 2 8 6 C10 2 12 3 12 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      </g>
                      {/* ✨ Sparkles */}
                      <path d="M74 72 L76 66 L78 72 L84 74 L78 76 L76 82 L74 76 L68 74 Z" fill="currentColor" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#vip-orb-pattern)" />
                </svg>
              </div>

              {/* IKONA VO SVIETIACOM KRUHU - HORE S 18+ ODZNAKOM */}
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-full bg-[#FF5A7A]/20 border border-[#FF5A7A]/40 backdrop-blur-md flex items-center justify-center text-[#FF5A7A] shadow-[0_0_22px_rgba(255,90,122,0.55)] transition-transform duration-300 group-hover:scale-110">
                  <Flame size={20} className="fill-[#FF5A7A]/30 text-[#FF5A7A]" />
                </div>
                <span className="absolute -top-1 -right-3 px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[9px] font-black shadow-[0_0_8px_rgba(239,68,68,0.8)] tracking-wider">
                  18+
                </span>
              </div>

              {/* 📏 MEDZERA O VEĽKOSTI NÁZVU MASÁŽE (32px) MEDZI IKONKOU A TEXTOM */}
              <div className="h-8 w-full pointer-events-none" aria-hidden="true" />

              {/* HORNÝ BLOK: NÁZOV, CENA & BENEFITY V ČERVENEJ TÔNE */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="font-extrabold text-2xl bg-gradient-to-r from-[#FF5A7A] via-[#F43F5E] to-[#FB7185] bg-clip-text text-transparent tracking-tight leading-tight">
                    VIP Premium
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#FF5A7A]/20 border border-[#FF5A7A]/40 text-[#FF5A7A] text-[10px] font-black tracking-wider shadow-[0_0_8px_rgba(255,90,122,0.3)]">
                    18+
                  </span>
                </div>
                
                <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-[#FF5A7A] pb-1">
                  <span>{isSK ? 'od 65 €' : 'from 65 €'}</span>
                  <span className="text-[#64748B] dark:text-[#94A3B8] font-normal font-sans">• 45 / 60 / 90 min</span>
                </div>

                {/* VÝHODY V MINI RIADKOCH S IKONOVÝMI KONTAJNERMI */}
                <div className="space-y-1.5 pt-1 max-w-[240px] mx-auto text-left">
                  <div className="flex items-center gap-2 text-[11px] text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 flex items-center justify-center text-[#FF5A7A] shrink-0">
                      <Sparkles size={11} />
                    </div>
                    <span className="truncate">{isSK ? 'Kompletný senzuálny rituál' : 'Full sensual ritual'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 flex items-center justify-center text-[#FF5A7A] shrink-0">
                      <Flame size={11} />
                    </div>
                    <span className="truncate">{isSK ? 'Intímne & hrejivé oleje' : 'Intimate & warming oils'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#334155] dark:text-[#DDE0F2]">
                    <div className="w-5 h-5 rounded-full bg-[#FB7185]/15 border border-[#FB7185]/30 flex items-center justify-center text-[#FB7185] shrink-0">
                      <Gift size={11} />
                    </div>
                    <span className="truncate">{isSK ? 'Vibračná pištoľ + Drink v cene' : 'Theragun + Drink included'}</span>
                  </div>
                </div>
              </div>

              {/* 👑 ČERVENÝ HOT VIP METALICKÝ BUTTON S TRANSPARENTNOU CENOU */}
              <div className="w-full flex justify-center mb-2 mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect('VIP');
                  }}
                  className="w-full max-w-[230px] min-h-[46px] h-[46px] rounded-full bg-gradient-to-b from-[#E11D48] via-[#BE123C] to-[#881337] hover:from-[#F43F5E] hover:via-[#E11D48] hover:to-[#9F1239] text-white font-extrabold text-xs uppercase tracking-wider border border-[#FDA4AF]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_0_20px_rgba(225,29,72,0.45),0_4px_12px_rgba(0,0,0,0.35)] transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center relative overflow-hidden group/vipbtn"
                >
                  {/* Metalický svetelný odlesk pri hoveri */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover/vipbtn:translate-x-full transition-transform duration-700 pointer-events-none" />
                  <span>{isSK ? 'Zvoliť VIP • od 65 €' : 'Select VIP • from 65 €'}</span>
                </button>
              </div>

            </div>
          </BorderGlow>
        </div>

      </div>
    </div>
  );
}