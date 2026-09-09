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
import { Adult18BadgeIcon } from '@/app/components/icons/AdultSensualIcons';

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
  Adult18BadgeIcon,
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
    <div className="fixed inset-0 z-[110] bg-[#0B0D22]/60 dark:bg-[#010314]/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-in fade-in duration-200 text-[#1E293B] dark:text-[#DDE0F2]">
      <div className="w-full max-w-sm p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl relative text-center space-y-5">
        
        {/* Zavrieť */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-white transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* VEĽKÝ KRUHOVÝ 3D MEDAILÓN */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center pt-1">
          <div
            className={`w-24 h-24 rounded-full bg-gradient-to-br ${
              isUnlocked ? badge.unlockedBg : 'from-slate-100 via-slate-200 to-slate-300 dark:from-[#010314] dark:via-[#0B0D22] dark:to-[#1a1d36]'
            } text-white flex items-center justify-center shadow-xl border-2 relative overflow-hidden transition-all duration-300 ${
              isUnlocked
                ? `${badge.unlockedBorder} shadow-[0_0_20px_rgba(102,51,238,0.6)]`
                : 'border-slate-300 dark:border-[#2B2F49] opacity-60'
            }`}
          >
            {/* Glossy Odlesk (Svetelný pásik na vrchu kruhu) */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 via-white/5 to-transparent pointer-events-none rounded-t-full" />
            
            <IconComp
              size={40}
              className={`transition-all duration-300 relative z-10 ${
                isUnlocked ? 'text-white scale-100' : 'text-slate-400 dark:text-[#C7CAE0]/30 scale-90'
              }`}
            />
          </div>

          {!isUnlocked && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-100 dark:bg-[#010314] text-slate-500 dark:text-[#C7CAE0]/60 border border-slate-300 dark:border-[#2B2F49] flex items-center justify-center shadow-md z-20">
              <Lock size={12} />
            </div>
          )}
        </div>

        {/* Názov a kategória */}
        <div className="space-y-1">
          <span className="inline-flex items-center text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#6633EE]/15 dark:bg-[#6633EE]/20 text-[#6633EE] dark:text-[#A78BFA] border border-[#6633EE]/30">
            {badge.categoryLabel[langKey]}
          </span>
          <h3 className="font-semibold text-lg text-[#0B0D22] dark:text-[#FFFFFF] pt-1">
            {badge.title[langKey]}
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#C7CAE0] leading-relaxed px-2 font-normal">
            {badge.description[langKey]}
          </p>
        </div>

        {/* Informácia o stave / Progres - zobrazujeme len keď ešte NIE JE odomknutý */}
        {!isUnlocked && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[#64748B] dark:text-[#C7CAE0]/70">
                {language === 'sk' ? 'Postup k odomknutiu' : 'Progress to unlock'}
              </span>
              <span className="text-[#6633EE] dark:text-[#A78BFA] font-semibold tracking-wide text-xs tabular-nums">
                {currentProgress} / {maxProgress}
              </span>
            </div>

            {/* Progres Bar */}
            <div className="w-full bg-slate-200 dark:bg-[#0B0D22] rounded-full h-2 overflow-hidden border border-[#E2E8F0] dark:border-[#2B2F49]">
              <div
                className="bg-gradient-to-r from-[#6633EE] to-[#A78BFA] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(102,51,238,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Tlačidlo OK */}
        <button
          type="button"
          onClick={onClose}
          className="w-full btn-primary text-xs uppercase tracking-wider font-semibold"
        >
          {language === 'sk' ? 'Zatvoriť' : 'Close'}
        </button>

      </div>
    </div>
  );
}
