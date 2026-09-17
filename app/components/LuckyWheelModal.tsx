'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { 
  X, Sparkles, Gift, Crown, Percent, Tag, Award, 
  CheckCircle2, Copy, Check, Star, ShieldCheck
} from 'lucide-react';

export interface WheelPrize {
  id: string;
  labelSK: string;
  labelEN: string;
  descSK: string;
  descEN: string;
  color: string;
  secondaryColor: string;
  textColor: string;
  giftType: 'discount_code' | 'vip_upgrade' | 'free_stamp' | 'next_visit_gift' | 'no_win';
  discountPercent?: string;
  code?: string;
  stampPrice?: number;
  weight: number; // Váha pre pravdepodobnosť
}

// 🎯 8 Výsekov: Rozloženie pravdepodobnosti (20 % celková šanca na výhru vs. 80 % na "Nevadí, nabudúce")
export const WHEEL_PRIZES: WheelPrize[] = [
  {
    id: 'prize_5pct',
    labelSK: '5% Zľava',
    labelEN: '5% Off',
    descSK: 'Zľavový kód -5 % na vašu nasledujúcu masáž.',
    descEN: '5% discount code applicable to your next massage.',
    color: '#6633EE',
    secondaryColor: '#4F25C7',
    textColor: '#FFFFFF',
    giftType: 'discount_code',
    discountPercent: '5%',
    weight: 10,
  },
  {
    id: 'prize_nowin_1',
    labelSK: 'Nevadí, nabudúce',
    labelEN: 'Try next time',
    descSK: 'Dnes to nevyšlo, ale zajtra máte nový voľný pokus!',
    descEN: 'No luck today, but you have another free attempt tomorrow!',
    color: '#0E122C',
    secondaryColor: '#070919',
    textColor: '#8C94B8',
    giftType: 'no_win',
    weight: 20,
  },
  {
    id: 'prize_10pct',
    labelSK: '10% Zľava',
    labelEN: '10% Off',
    descSK: 'Zľavový kód -10 % na akúkoľvek vybranú masáž.',
    descEN: '10% discount code applicable to any massage session.',
    color: '#7C3AED',
    secondaryColor: '#5B21B6',
    textColor: '#FFFFFF',
    giftType: 'discount_code',
    discountPercent: '10%',
    weight: 5,
  },
  {
    id: 'prize_nowin_2',
    labelSK: 'Nevadí, nabudúce',
    labelEN: 'Try next time',
    descSK: 'Dnes to nevyšlo, ale zajtra máte nový voľný pokus!',
    descEN: 'No luck today, but you have another free attempt tomorrow!',
    color: '#080A1A',
    secondaryColor: '#050713',
    textColor: '#8C94B8',
    giftType: 'no_win',
    weight: 20,
  },
  {
    id: 'prize_15pct',
    labelSK: '15% Zľava',
    labelEN: '15% Off',
    descSK: 'Exkluzívny zľavový kód -15 % na vašu návštevu.',
    descEN: 'Exclusive 15% discount code applicable to your visit.',
    color: '#DB2777',
    secondaryColor: '#9D174D',
    textColor: '#FFFFFF',
    giftType: 'discount_code',
    discountPercent: '15%',
    weight: 2,
  },
  {
    id: 'prize_nowin_3',
    labelSK: 'Nevadí, nabudúce',
    labelEN: 'Try next time',
    descSK: 'Dnes to nevyšlo, ale zajtra máte nový voľný pokus!',
    descEN: 'No luck today, but you have another free attempt tomorrow!',
    color: '#0E122C',
    secondaryColor: '#070919',
    textColor: '#8C94B8',
    giftType: 'no_win',
    weight: 20,
  },
  {
    id: 'prize_gift',
    labelSK: 'Darček k masáži',
    labelEN: 'Massage Gift',
    descSK: 'Kód na špeciálny darček pripravený k vašej nasledujúcej masáži.',
    descEN: 'Code for a special gift prepared for your next massage session.',
    color: '#D97706',
    secondaryColor: '#B45309',
    textColor: '#FFFFFF',
    giftType: 'next_visit_gift',
    weight: 3,
  },
  {
    id: 'prize_nowin_4',
    labelSK: 'Nevadí, nabudúce',
    labelEN: 'Try next time',
    descSK: 'Dnes to nevyšlo, ale zajtra máte nový voľný pokus!',
    descEN: 'No luck today, but you have another free attempt tomorrow!',
    color: '#080A1A',
    secondaryColor: '#050713',
    textColor: '#8C94B8',
    giftType: 'no_win',
    weight: 20,
  },
];

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  language?: string;
  onRewardClaimed?: () => void;
}

export default function LuckyWheelModal({
  isOpen,
  onClose,
  userId,
  language = 'sk',
  onRewardClaimed,
}: LuckyWheelModalProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [canSpin, setCanSpin] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [wheelEnabled, setWheelEnabled] = useState<boolean>(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>('');
  const [checkingSettings, setCheckingSettings] = useState<boolean>(true);
  const isSK = language === 'sk';

  // Kontrola 24h denného limitu
  const checkDailyLimit = () => {
    if (!userId) {
      setCanSpin(true);
      setTimeLeft('');
      return;
    }

    const lastSpinKey = `last_wheel_spin_${userId}`;
    const lastSpinTime = localStorage.getItem(lastSpinKey);

    if (!lastSpinTime) {
      setCanSpin(true);
      setTimeLeft('');
      return;
    }

    const lastSpinDate = new Date(parseInt(lastSpinTime, 10));
    const nextAllowedDate = new Date(lastSpinDate.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now < nextAllowedDate) {
      setCanSpin(false);
      const diffMs = nextAllowedDate.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    } else {
      setCanSpin(true);
      setTimeLeft('');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCheckingSettings(true);
      fetch('/api/system/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data?.settings) {
            setWheelEnabled(data.settings.lucky_wheel_enabled !== false);
            setMaintenanceMessage(
              isSK
                ? (data.settings.maintenance_message_sk || 'Koleso šťastia je momentálne v rekonštrukcii. Pripravujeme pre vás nové odmeny a vylepšenia. Skúste to prosím neskôr.')
                : (data.settings.maintenance_message_en || 'The Lucky Wheel is currently under reconstruction. Please try again later.')
            );
          }
        })
        .catch(() => {})
        .finally(() => setCheckingSettings(false));

      checkDailyLimit();
      const interval = setInterval(checkDailyLimit, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, userId, isSK]);

  // Vážený náhodný výber výseku podľa váh (menšia šanca na výhru)
  const getWeightedWinningIndex = (): number => {
    const totalWeight = WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < WHEEL_PRIZES.length; i++) {
      if (random < WHEEL_PRIZES[i].weight) {
        return i;
      }
      random -= WHEEL_PRIZES[i].weight;
    }
    return 1; // Fallback na "Skús zajtra"
  };

  // Roztočenie kolesa
  const handleSpin = async () => {
    if (spinning || !canSpin) return;

    setWonPrize(null);
    setSpinning(true);

    const numSlices = WHEEL_PRIZES.length;
    const sliceDeg = 360 / numSlices;
    
    // Vážený výber výseku
    const winningIndex = getWeightedWinningIndex();
    const selectedPrize = WHEEL_PRIZES[winningIndex];

    // Výpočet cieľového uhla (ukazovateľ je hore na 270°)
    const extraSpins = 360 * 7; // 7 plných dynamických otočiek
    const targetSliceAngle = winningIndex * sliceDeg + sliceDeg / 2;
    const targetAngle = 270 - targetSliceAngle;
    const totalRotation = rotation + extraSpins + (targetAngle - (rotation % 360));

    setRotation(totalRotation);

    // Paralelné volanie servera počas 5.2s animácie točenia
    // Server vygeneruje kód (napr. KOLO5-XXXXXX, KOLO10-XXXXXX, KOLO15-XXXXXX, DARCEK-XXXXXX) a zapíše ho do Google Sheets aj databázy
    let serverCode = '';
    const rewardPromise = (async () => {
      if (selectedPrize.giftType !== 'no_win') {
        try {
          const res = await fetch('/api/user/wheel-reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userId || null,
              giftType: selectedPrize.giftType,
              discountPercent: selectedPrize.discountPercent,
              stampPrice: selectedPrize.stampPrice || 40,
            }),
          });
          const resData = await res.json();
          if (resData.code) {
            serverCode = resData.code;
          }
          return resData;
        } catch (err) {
          console.error('Chyba pri ukladaní výhry z kolesa cez API:', err);
        }
      }
      return null;
    })();

    // Počkame na dokončenie 5.2s rotácie
    setTimeout(async () => {
      setSpinning(false);
      
      // Počkáme na odpoveď API
      await rewardPromise;

      const finalWonPrize: WheelPrize = {
        ...selectedPrize,
        code: serverCode || selectedPrize.code || (selectedPrize.giftType === 'next_visit_gift' ? 'DARCEK' : 'KOLO'),
      };
      setWonPrize(finalWonPrize);

      if (userId) {
        localStorage.setItem(`last_wheel_spin_${userId}`, Date.now().toString());
        checkDailyLimit();
      }

      // Konfety LEN pri skutočnej výhre
      if (selectedPrize.giftType !== 'no_win') {
        confetti({
          particleCount: 120,
          spread: 85,
          origin: { y: 0.55 },
          colors: ['#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6', '#10B981'],
        });
      }

      if (onRewardClaimed) onRewardClaimed();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      }
    }, 5200);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  // Matematika pre SVG výseky kolesa
  const size = 340;
  const center = size / 2;
  const radius = center - 14;
  const numSlices = WHEEL_PRIZES.length;
  const sliceAngle = 360 / numSlices;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-md p-6 sm:p-7 rounded-[32px] bg-[#090B1E] border border-[#272B4D] shadow-[0_0_60px_rgba(102,51,238,0.25)] text-white text-center space-y-4 overflow-hidden">
        
        {/* Luxusný fialový & zlatý ambient glow */}
        <div className="absolute -top-28 -left-28 w-64 h-64 bg-[#6633EE]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -right-28 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Tlačidlo zatvorenia */}
        <button
          type="button"
          onClick={onClose}
          disabled={spinning}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-30 z-30"
        >
          <X size={18} />
        </button>

        {/* Hlavička - čistý nadpis bez odznaku a podtextu */}
        <div className="pt-2 pb-1 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent drop-shadow-sm">
            {isSK ? 'Kolo Šťastia' : 'Wheel of Fortune'}
          </h2>
        </div>

        {/* 🚧 UNDER RECONSTRUCTION STATE */}
        {!checkingSettings && !wheelEnabled ? (
          <div className="py-6 px-3 space-y-5 text-center relative z-10 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <Sparkles size={32} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isSK ? 'Rekonštrukcia' : 'Under Reconstruction'}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {isSK ? 'Koleso je momentálne v údržbe' : 'Lucky Wheel Under Maintenance'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                {maintenanceMessage || (isSK ? 'Koleso šťastia je momentálne v rekonštrukcii. Pripravujeme pre vás nové zľavy a benefity. Skúste to prosím neskôr.' : 'The Lucky Wheel is currently under reconstruction. Please try again later.')}
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6633EE] to-[#7C3AED] hover:from-[#5822DC] hover:to-[#6633EE] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-lg"
              >
                {isSK ? 'Rozumiem, skúsim neskôr' : 'Got it, will try later'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ================================================================ */}
            {/* 🎡 LUXUSNÉ VEKTOROVÉ KOLESO SO ŠTÝLOM STRÁNKY                    */}
            {/* ================================================================ */}
        <div className="relative flex items-center justify-center py-2 select-none">
          
          {/* Zlatý Ticker Pin (Ukazovateľ Hore s Rubínovým Šperkom) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none drop-shadow-[0_4px_14px_rgba(245,158,11,0.95)]">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-amber-400" />
            <div className="w-3 h-3 rounded-full bg-rose-500 -mt-1.5 border border-white shadow-md" />
          </div>

          {/* Rotujúci SVG kruh */}
          <div
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 5.2s cubic-bezier(0.12, 0.96, 0.34, 1)' : 'none',
            }}
            className="rounded-full shadow-[0_0_50px_rgba(102,51,238,0.25)]"
          >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="w-[290px] h-[290px] sm:w-[340px] sm:h-[340px]">
              <defs>
                {/* Zlatý luxusný gradient na ráme */}
                <linearGradient id="goldLuxuryRim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="30%" stopColor="#FEF08A" />
                  <stop offset="60%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#FDE68A" />
                </linearGradient>

                {/* Stredový gombík */}
                <linearGradient id="centerLuxury" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#78350F" />
                </linearGradient>
              </defs>

              {/* Vonkajší masívny zlatý rám */}
              <circle cx={center} cy={center} r={center - 3} fill="#090B1E" stroke="url(#goldLuxuryRim)" strokeWidth={7} />

              {/* Jednotlivé výseky s kontrastnými farbami */}
              {WHEEL_PRIZES.map((prize, i) => {
                const startAngle = i * sliceAngle;
                const endAngle = startAngle + sliceAngle;
                const radStart = (startAngle * Math.PI) / 180;
                const radEnd = (endAngle * Math.PI) / 180;

                const x1 = center + radius * Math.cos(radStart);
                const y1 = center + radius * Math.sin(radStart);
                const x2 = center + radius * Math.cos(radEnd);
                const y2 = center + radius * Math.sin(radEnd);

                const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

                const isNoWin = prize.giftType === 'no_win';

                // Uhol a poloha pre text
                const textAngle = startAngle + sliceAngle / 2;
                const textRad = (textAngle * Math.PI) / 180;
                const textDist = radius * 0.62;
                const tx = center + textDist * Math.cos(textRad);
                const ty = center + textDist * Math.sin(textRad);

                const label = isSK ? prize.labelSK : prize.labelEN;

                return (
                  <g key={prize.id}>
                    <path
                      d={pathData}
                      fill={prize.color}
                      stroke="#090B1E"
                      strokeWidth={1.5}
                    />
                    
                    {/* Jemný odlesk na výherných výsekoch */}
                    {!isNoWin && (
                      <path
                        d={pathData}
                        fill="white"
                        fillOpacity="0.08"
                      />
                    )}

                    {/* Dvojriadkový formátovaný text výseku */}
                    <text
                      x={tx}
                      y={ty}
                      fill={prize.textColor}
                      fontFamily="Inter, sans-serif"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                      className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] pointer-events-none select-none"
                    >
                      {label === '5% Zľava' ? (
                        <>
                          <tspan x={tx} dy="-0.55em" fontSize="12" fontWeight="800" fill="#FFFFFF">5%</tspan>
                          <tspan x={tx} dy="1.25em" fontSize="9.5" fontWeight="700" fill="#E2E8F0" letterSpacing="0.05em">ZĽAVA</tspan>
                        </>
                      ) : label === '5% Off' ? (
                        <>
                          <tspan x={tx} dy="-0.55em" fontSize="12" fontWeight="800" fill="#FFFFFF">5%</tspan>
                          <tspan x={tx} dy="1.25em" fontSize="9.5" fontWeight="700" fill="#E2E8F0" letterSpacing="0.05em">OFF</tspan>
                        </>
                      ) : label === '10% Zľava' ? (
                        <>
                          <tspan x={tx} dy="-0.55em" fontSize="12" fontWeight="800" fill="#FFFFFF">10%</tspan>
                          <tspan x={tx} dy="1.25em" fontSize="9.5" fontWeight="700" fill="#E2E8F0" letterSpacing="0.05em">ZĽAVA</tspan>
                        </>
                      ) : label === '10% Off' ? (
                        <>
                          <tspan x={tx} dy="-0.55em" fontSize="12" fontWeight="800" fill="#FFFFFF">10%</tspan>
                          <tspan x={tx} dy="1.25em" fontSize="9.5" fontWeight="700" fill="#E2E8F0" letterSpacing="0.05em">OFF</tspan>
                        </>
                      ) : label === '15% Zľava' ? (
                        <>
                          <tspan x={tx} dy="-0.55em" fontSize="12" fontWeight="800" fill="#FFFFFF">15%</tspan>
                          <tspan x={tx} dy="1.25em" fontSize="9.5" fontWeight="700" fill="#FFE4E6" letterSpacing="0.05em">ZĽAVA</tspan>
                        </>
                      ) : label === '15% Off' ? (
                        <>
                          <tspan x={tx} dy="-0.55em" fontSize="12" fontWeight="800" fill="#FFFFFF">15%</tspan>
                          <tspan x={tx} dy="1.25em" fontSize="9.5" fontWeight="700" fill="#FFE4E6" letterSpacing="0.05em">OFF</tspan>
                        </>
                      ) : prize.giftType === 'next_visit_gift' ? (
                        <>
                          <tspan x={tx} dy="-0.55em" fontSize="10.5" fontWeight="800" fill="#FFFBEB">{isSK ? 'Darček' : 'Massage'}</tspan>
                          <tspan x={tx} dy="1.25em" fontSize="9.5" fontWeight="700" fill="#FDE68A">{isSK ? 'k masáži' : 'Gift'}</tspan>
                        </>
                      ) : (
                        <>
                          <tspan x={tx} dy="-0.55em" fontSize="9.5" fontWeight="600" fill="#94A3B8">{isSK ? 'Nevadí,' : 'Try'}</tspan>
                          <tspan x={tx} dy="1.25em" fontSize="9.5" fontWeight="600" fill="#94A3B8">{isSK ? 'nabudúce' : 'next time'}</tspan>
                        </>
                      )}
                    </text>
                  </g>
                );
              })}

              {/* 16 Zlatých kryštálov po obvode rámu */}
              {Array.from({ length: 16 }).map((_, idx) => {
                const bAngle = (idx * 360) / 16;
                const bRad = (bAngle * Math.PI) / 180;
                const bx = center + (radius + 4) * Math.cos(bRad);
                const by = center + (radius + 4) * Math.sin(bRad);

                return (
                  <circle
                    key={idx}
                    cx={bx}
                    cy={by}
                    r={3.2}
                    fill={idx % 2 === 0 ? '#FDE68A' : '#FFFFFF'}
                    stroke="#D97706"
                    strokeWidth={0.8}
                  />
                );
              })}

              {/* Stredový zlatý kruh */}
              <circle cx={center} cy={center} r={28} fill="#090B1E" stroke="url(#goldLuxuryRim)" strokeWidth={3} />
              <circle cx={center} cy={center} r={20} fill="url(#centerLuxury)" />
            </svg>
          </div>

          {/* Stredový gombík "TOČIŤ" */}
          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning || !canSpin}
            className="absolute z-20 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-100 text-[#0F172A] font-black text-[11px] tracking-widest uppercase flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.8)] hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {spinning ? '...' : (isSK ? 'TOČIŤ' : 'SPIN')}
          </button>
        </div>

        {/* ================================================================ */}
        {/* 🎉 VÝSLEDKOVÝ BOX (LEN PRI SKUTOČNOM DOTOČENÍ / ZOBRAZENÍ VÝHRY)   */}
        {/* ================================================================ */}
        {wonPrize && (
          wonPrize.giftType !== 'no_win' ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-transparent border border-amber-400/50 space-y-2.5 animate-fadeIn text-center shadow-lg">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl animate-bounce">🎁</span>
                <h3 className="font-extrabold text-base text-amber-300">
                  {isSK ? `Vyhrali ste: ${wonPrize.labelSK}` : `You won: ${wonPrize.labelEN}`}
                </h3>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed">
                {isSK ? wonPrize.descSK : wonPrize.descEN}
              </p>

              {/* Kód na kopírovanie */}
              {wonPrize.code && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="px-3.5 py-1.5 rounded-lg bg-[#6633EE]/30 border border-[#6633EE]/50 text-[#A78BFA] font-mono text-xs font-bold tracking-wider">
                    {wonPrize.code}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(wonPrize.code!)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title={isSK ? 'Kopírovať kód' : 'Copy code'}
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              )}

              <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 size={13} />
                <span>
                  {userId 
                    ? (isSK ? 'Kód bol aktivovaný v systéme & pridaný do vášho profilu!' : 'Code activated in system & saved to your profile!')
                    : (isSK ? 'Kód bol aktivovaný v systéme & je pripravený na rezerváciu!' : 'Code activated in system & ready for booking!')}
                </span>
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1.5 animate-fadeIn text-center">
              <p className="text-xs text-slate-300 font-medium">
                {isSK ? 'Dnes to nevyšlo, ale nezúfajte!' : 'No luck today, but do not worry!'}
              </p>
              <p className="text-[11px] text-amber-400 font-semibold">
                {isSK ? 'Zajtra máte pripravený ďalší voľný pokus.' : 'You have another free attempt tomorrow.'}
              </p>
            </div>
          )
        )}

        {/* Hlavné akčné tlačidlo */}
        <button
          type="button"
          onClick={handleSpin}
          disabled={spinning || !canSpin}
          className={`w-full py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
            !canSpin
              ? 'bg-[#181B30] text-amber-400/90 border border-amber-500/30 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-[#6633EE] via-[#7C3AED] to-[#8B5CF6] hover:from-[#5822DC] hover:to-[#7C3AED] text-white shadow-[0_0_30px_rgba(102,51,238,0.45)] active:scale-[0.98]'
          } ${spinning ? 'opacity-80 cursor-wait' : ''}`}
        >
          <Sparkles size={16} className={spinning ? 'animate-spin' : ''} />
          <span>
            {spinning 
              ? (isSK ? 'Koleso sa točí...' : 'Spinning...') 
              : !canSpin 
              ? (isSK ? `Ďalšie točenie o ${timeLeft || '24h'}` : `Next spin in ${timeLeft || '24h'}`) 
              : (isSK ? 'Roztočiť Kolo Šťastia' : 'Spin Wheel of Fortune')}
          </span>
        </button>
        </>
        )}

      </div>
    </div>
  );
}
