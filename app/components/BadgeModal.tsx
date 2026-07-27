'use client';

import React from 'react';
import { BadgeDefinition } from '@/app/constants/badges';
import { UserBadge } from '@/app/types';
import { X, CheckCircle2, Lock } from 'lucide-react';
import { 
  GiLaurelCrown, GiCrown, GiWingedShield, GiLotus, 
  GiShieldReflect, GiLightningHelix, GiCompass, GiStopwatch, 
  GiFlame, GiSun, GiOwl, GiPartyFlags, GiCakeSlice, GiTrophy 
} from 'react-icons/gi';

const ICON_MAP: Record<string, React.ElementType> = {
  GiLaurelCrown,
  GiCrown,
  GiWingedShield,
  GiLotus,
  GiShieldReflect,
  GiLightningHelix,
  GiCompass,
  GiStopwatch,
  GiFlame,
  GiSun,
  GiOwl,
  GiPartyFlags,
  GiCakeSlice,
  GiTrophy,
};

type Props = {
  badge: BadgeDefinition | null;
  userBadge: UserBadge | null;
  isOpen: boolean;
  onClose: () => void;
  language: string;
};

export default function BadgeModal({ badge, userBadge, isOpen, onClose, language }: Props) {
  if (!isOpen || !badge) return null;

  const IconComp = ICON_MAP[badge.iconName] || GiTrophy;
  const isUnlocked = !!userBadge?.is_unlocked;
  const currentProgress = userBadge?.current_progress || 0;
  const maxProgress = badge.targetValue;
  const progressPercent = Math.min(Math.round((currentProgress / maxProgress) * 100), 100);

  const langKey = language === 'sk' ? 'sk' : 'en';

  return (
    <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative text-center space-y-5">
        
        {/* Zavrieť */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* VEĽKÝ KRUHOVÝ 3D MEDAILÓN */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center pt-1">
          <div
            className={`w-24 h-24 rounded-full bg-gradient-to-br ${
              isUnlocked ? badge.unlockedBg : 'from-slate-700 via-slate-800 to-slate-900'
            } text-white flex items-center justify-center shadow-xl border-4 relative overflow-hidden transition-all duration-300 ${
              isUnlocked
                ? `${badge.unlockedBorder}`
                : 'border-slate-600/60 shadow-inner opacity-75'
            }`}
            style={{
              boxShadow: isUnlocked ? `0 10px 25px ${badge.glowColor}` : 'inset 0 2px 8px rgba(0,0,0,0.6)',
            }}
          >
            {/* Glossy Odlesk (Svetelný pásik na vrchu kruhu) */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none rounded-t-full" />
            
            <IconComp
              size={44}
              className={`transition-all duration-300 drop-shadow-md relative z-10 ${
                isUnlocked ? 'text-white scale-100' : 'text-slate-400/50 scale-90'
              }`}
            />
          </div>

          {!isUnlocked && (
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-800 text-slate-300 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md z-20">
              <Lock size={14} />
            </div>
          )}
        </div>

        {/* Názov a kategória */}
        <div className="space-y-1">
          <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            {badge.categoryLabel[langKey]}
          </span>
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 pt-1">
            {badge.title[langKey]}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
            {badge.description[langKey]}
          </p>
        </div>

        {/* Stav a Progres */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-2 text-left">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-300">
              {language === 'sk' ? 'Stav odznaku:' : 'Badge Status:'}
            </span>
            {isUnlocked ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                <span>{language === 'sk' ? 'Odomknutý 🎉' : 'Unlocked 🎉'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <Lock size={13} />
                <span>{language === 'sk' ? 'Zamknutý' : 'Locked'}</span>
              </span>
            )}
          </div>

          {/* Progres lišta */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>{language === 'sk' ? 'Postup:' : 'Progress:'}</span>
              <span>
                {currentProgress} / {maxProgress} {badge.unit ? badge.unit[langKey] : ''}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                  isUnlocked ? badge.unlockedBg : 'from-slate-500 to-slate-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
        >
          {language === 'sk' ? 'Zavrieť' : 'Close'}
        </button>

      </div>
    </div>
  );
}
