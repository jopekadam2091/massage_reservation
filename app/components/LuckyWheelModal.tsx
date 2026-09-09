'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { 
  X, Sparkles, Gift, Crown, Percent, Tag, Award, 
  RotateCw, CheckCircle2, Copy, Check, Star, ShieldCheck
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
  code?: string;
  stampPrice?: number;
  weight: number; // Váha pre pravdepodobnosť
}

// 🎯 8 Výsekov: Striedavo 4 výherné a 4 "Skús zajtra" (50% / 50% rozloženie na kolese s menšou pravdepodobnosťou výhry)
export const WHEEL_PRIZES: WheelPrize[] = [
  {
    id: 'prize_10percent',
    labelSK: '10% Zľava',
    labelEN: '10% Off',
    descSK: 'Zľavový kód -10 % na akúkoľvek vybranú masáž.',
    descEN: '10% discount code applicable to any massage session.',
    color: '#2563EB',
    secondaryColor: '#1E3A8A',
    textColor: '#FFFFFF',
    giftType: 'discount_code',
    code: 'KOLO10PCT',
    weight: 7, // 7% šanca
  },
  {
    id: 'prize_try_again_1',
    labelSK: 'Skús zajtra',
    labelEN: 'Try Tomorrow',
    descSK: 'Dnes to nevyšlo, ale nezúfajte! Zajtra máte ďalšie bezplatné točenie.',
    descEN: 'No prize this time, but try again tomorrow for free!',
    color: '#1E293B',
    secondaryColor: '#0F172A',
    textColor: '#94A3B8',
    giftType: 'no_win',
    weight: 18, // 18% šanca
  },
  {
    id: 'prize_vip_upgrade',
    labelSK: 'VIP Upgrade',
    labelEN: 'VIP Upgrade',
    descSK: 'Získajte VIP senzuálnu masáž za cenu Klasickej masáže.',
    descEN: 'Get a VIP Sensual Massage for the price of a Classic session.',
    color: '#DB2777',
    secondaryColor: '#831843',
    textColor: '#FFFFFF',
    giftType: 'vip_upgrade',
    code: 'VIP-UPGRADE',
    weight: 5, // 5% šanca (veľmi vzácna)
  },
  {
    id: 'prize_try_again_2',
    labelSK: 'Skús zajtra',
    labelEN: 'Try Tomorrow',
    descSK: 'Tentoraz bez výhry. Vráťte sa zajtra pre novú šancu!',
    descEN: 'No prize this time. Come back tomorrow for a new chance!',
    color: '#1E293B',
    secondaryColor: '#0F172A',
    textColor: '#94A3B8',
    giftType: 'no_win',
    weight: 18, // 18% šanca
  },
  {
    id: 'prize_5eur',
    labelSK: '5 € Zľava',
    labelEN: '5 € Off',
    descSK: 'Zľavový kód v hodnote 5 € na vašu ďalšiu masáž.',
    descEN: '5 € discount voucher for your next massage session.',
    color: '#7C3AED',
    secondaryColor: '#4C1D95',
    textColor: '#FFFFFF',
    giftType: 'discount_code',
    code: 'KOLO5EUR',
    weight: 10, // 10% šanca
  },
  {
    id: 'prize_try_again_3',
    labelSK: 'Skús zajtra',
    labelEN: 'Try Tomorrow',
    descSK: 'Koleso sa zastavilo tesne vedľa. Vyskúšajte to znova zajtra!',
    descEN: 'Wheel stopped just short. Try again tomorrow!',
    color: '#1E293B',
    secondaryColor: '#0F172A',
    textColor: '#94A3B8',
    giftType: 'no_win',
    weight: 18, // 18% šanca
  },
  {
    id: 'prize_free_stamp',
    labelSK: '+1 Pečiatka',
    labelEN: '+1 Stamp',
    descSK: 'Extra vernostná pečiatka pripísaná priamo do vašej karty.',
    descEN: 'Extra loyalty stamp added directly to your stamp card.',
    color: '#059669',
    secondaryColor: '#064E3B',
    textColor: '#FFFFFF',
    giftType: 'free_stamp',
    stampPrice: 40,
    weight: 6, // 6% šanca
  },
  {
    id: 'prize_try_again_4',
    labelSK: 'Skús zajtra',
    labelEN: 'Try Tomorrow',
    descSK: 'Dnes šťastie neprialo. Každý deň máte 1 nový pokus.',
    descEN: 'No luck today. You get 1 new attempt every day.',
    color: '#1E293B',
    secondaryColor: '#0F172A',
    textColor: '#94A3B8',
    giftType: 'no_win',
    weight: 18, // 18% šanca
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
  const [resetting, setResetting] = useState(false);
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
      checkDailyLimit();
      const interval = setInterval(checkDailyLimit, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, userId]);

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

    // Počkame na dokončenie 5.2s rotácie
    setTimeout(async () => {
      setSpinning(false);
      setWonPrize(selectedPrize);

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

      // Uloženie výhry do Supabase
      if (userId && selectedPrize.giftType !== 'no_win') {
        try {
          if (selectedPrize.giftType === 'free_stamp') {
            const { error: stampErr } = await supabase.from('stamps').insert({
              user_id: userId,
              price: selectedPrize.stampPrice || 40,
              claimed: false,
            });
            if (stampErr) console.error('Chyba pri vkladaní pečiatky:', stampErr);
          } else {
            await supabase.from('gifts').insert({
              user_id: userId,
              gift_type: selectedPrize.giftType,
              custom_code: selectedPrize.code || `KOLO-${Date.now().toString(36).toUpperCase()}`,
              used: false,
            });
          }

          if (onRewardClaimed) onRewardClaimed();
        } catch (err) {
          console.error('Chyba pri ukladaní výhry:', err);
        }
      }
    }, 5200);
  };

  // 🔄 Funkcia pre RESET TOČENIA (Testovací vývojársky mód)
  const handleDevReset = async () => {
    if (!userId || resetting) return;
    setResetting(true);

    try {
      localStorage.removeItem(`last_wheel_spin_${userId}`);

      await supabase
        .from('gifts')
        .delete()
        .eq('user_id', userId)
        .in('custom_code', ['KOLO5EUR', 'KOLO10PCT', 'VIP-UPGRADE']);

      // Zmažeme testovaciu nezarátanú pečiatku s cenou 40
      await supabase
        .from('stamps')
        .delete()
        .eq('user_id', userId)
        .eq('price', 40)
        .eq('claimed', false);

      setWonPrize(null);
      setRotation(0);
      setCanSpin(true);
      setTimeLeft('');

      if (onRewardClaimed) onRewardClaimed();
    } catch (err) {
      console.error('Chyba resetu:', err);
    } finally {
      setResetting(false);
    }
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
      <div className="relative w-full max-w-md p-6 sm:p-7 rounded-[32px] bg-[#070919] border border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.15)] text-white text-center space-y-5 overflow-hidden">
        
        {/* Luxusný zlatý & neónový ambient glow */}
        <div className="absolute -top-28 -left-28 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -right-28 w-64 h-64 bg-[#6633EE]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Tlačidlo zatvorenia */}
        <button
          type="button"
          onClick={onClose}
          disabled={spinning}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-30 z-30"
        >
          <X size={18} />
        </button>

        {/* Luxusná Hlavička */}
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-extrabold uppercase tracking-widest shadow-xs">
            <Sparkles size={12} className="text-amber-400" />
            <span>{isSK ? 'Exkluzívne Denné Koleso' : 'Exclusive Daily Wheel'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent drop-shadow-sm">
            {isSK ? 'Kolo Šťastia' : 'Wheel of Fortune'}
          </h2>

          <p className="text-xs text-slate-400 font-normal">
            {isSK 
              ? 'Každý deň 1 voľné točenie pre registrovaných klientov' 
              : '1 Free daily spin for registered clients'}
          </p>
        </div>

        {/* ================================================================ */}
        {/* 🎡 LUXUSNÉ VEKTOROVÉ KOLESO S 50/50 ROZLOŽENÍM A ZLATÝM RÁMOM    */}
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
            className="rounded-full shadow-[0_0_50px_rgba(245,158,11,0.25)]"
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
              <circle cx={center} cy={center} r={center - 3} fill="#0A0D1D" stroke="url(#goldLuxuryRim)" strokeWidth={7} />

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
                const textDist = radius * 0.64;
                const tx = center + textDist * Math.cos(textRad);
                const ty = center + textDist * Math.sin(textRad);

                const label = isSK ? prize.labelSK : prize.labelEN;

                return (
                  <g key={prize.id}>
                    <path
                      d={pathData}
                      fill={prize.color}
                      stroke="#0F172A"
                      strokeWidth={2}
                    />
                    
                    {/* Jemný odlesk na výherných výsekoch */}
                    {!isNoWin && (
                      <path
                        d={pathData}
                        fill="white"
                        fillOpacity="0.08"
                      />
                    )}

                    <text
                      x={tx}
                      y={ty}
                      fill={prize.textColor}
                      fontSize={isNoWin ? 11 : 12}
                      fontWeight={isNoWin ? "600" : "800"}
                      fontFamily="Inter, sans-serif"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                      className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] pointer-events-none select-none"
                    >
                      {label}
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
              <circle cx={center} cy={center} r={28} fill="#0F172A" stroke="url(#goldLuxuryRim)" strokeWidth={3} />
              <circle cx={center} cy={center} r={20} fill="url(#centerLuxury)" />
            </svg>
          </div>

          {/* Stredový gombík "TOČIŤ" */}
          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning || !canSpin}
            className="absolute z-20 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-100 text-[#0F172A] font-black text-[10px] tracking-widest uppercase flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.8)] hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {spinning ? '...' : (isSK ? 'TOČIŤ' : 'SPIN')}
          </button>
        </div>

        {/* ================================================================ */}
        {/* 🎉 VÝSLEDKOVÝ BOX (VÝHRA ALEBO MOTIVAČNÉ "SKÚS ZAJTRA")          */}
        {/* ================================================================ */}
        {wonPrize ? (
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
                <span>{isSK ? 'Odmena bola pripísaná k vášmu profilu!' : 'Reward saved to your profile!'}</span>
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
        ) : !canSpin && timeLeft ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center space-y-1">
            <p className="text-xs text-amber-300 font-medium">
              {isSK ? 'Dnešné točenie ste už využili.' : 'You have already spun today.'}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              {isSK ? 'Ďalšie voľné točenie o:' : 'Next free spin in:'} <strong className="text-white font-bold">{timeLeft}</strong>
            </p>
          </div>
        ) : null}

        {/* Hlavné akčné tlačidlo */}
        <button
          type="button"
          onClick={handleSpin}
          disabled={spinning || !canSpin}
          className="w-full py-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider text-[#0F172A] transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 active:scale-[0.98]"
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

        {/* 🛠️ RESET TOČENIA PRE TESTOVANIE (DEV / TEST BUTTON) */}
        <div className="pt-1 flex items-center justify-center border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleDevReset}
            disabled={spinning || resetting}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-amber-400 transition cursor-pointer p-1 disabled:opacity-50"
          >
            <RotateCw size={12} className={resetting ? 'animate-spin' : ''} />
            <span>{isSK ? 'Resetovať točenie (Test mód)' : 'Reset spin limit (Test mode)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
