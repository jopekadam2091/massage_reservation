'use client';

import React, { useEffect, useState } from 'react';
import { BadgeRegistry, BadgeDefinition } from '@/app/constants/badges';
import { UserBadge } from '@/app/types';
import BadgeModal from './BadgeModal';
import { BadgesGridSkeleton } from './ui/Skeleton';
import { Award, Lock, Check, Loader2 } from 'lucide-react';
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
  userId: string;
  language: string;
};

export default function BadgesGrid({ userId, language }: Props) {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBadge, setSelectedBadge] = useState<{ badge: BadgeDefinition; userBadge: UserBadge | null } | null>(null);

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/badges?userId=${userId}`);
      const data = await res.json();
      if (res.ok && data.badges) {
        setUserBadges(data.badges);
      }
    } catch (err) {
      console.error('Chyba načítavania odznakov:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBadges();
    }
  }, [userId]);

  const langKey = language === 'sk' ? 'sk' : 'en';

  const userBadgeMap = new Map<string, UserBadge>();
  userBadges.forEach((b) => userBadgeMap.set(b.badge_id, b));

  const unlockedCount = userBadges.filter((b) => b.is_unlocked).length;
  const totalCount = BadgeRegistry.BADGES.length;

  return (
    <div className="w-full space-y-4 font-sans text-left text-[#334155] dark:text-[#DDE0F2]">
      
      {/* Hlavička sekcie */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#6633EE]/15 dark:bg-[#6633EE]/20 text-[#6633EE] dark:text-[#A78BFA] flex items-center justify-center font-medium shadow-xs">
            <Award size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#0B0D22] dark:text-[#FFFFFF] leading-tight">
              {language === 'sk' ? 'Odznaky a Úspechy' : 'Badges & Achievements'}
            </h3>
            <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/60 font-normal">
              {language === 'sk' ? 'Získavaj medaily za svoje masáže' : 'Earn medals for completed sessions'}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] text-[#6633EE] dark:text-[#A78BFA] text-xs font-semibold shadow-xs tracking-wide tabular-nums">
          <span>🏆 {unlockedCount} / {totalCount}</span>
        </span>
      </div>

      {/* KRUHOVÁ MEDAILÓNOVÁ MRIEŽKA */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-md dark:shadow-2xl relative overflow-hidden">
        {loading ? (
          <BadgesGridSkeleton />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-6 gap-x-3">
            {BadgeRegistry.BADGES.map((badge) => {
              const uBadge = userBadgeMap.get(badge.id) || null;
              const isUnlocked = !!uBadge?.is_unlocked;
              const IconComp = ICON_MAP[badge.iconName] || GiTrophy;
              const progress = uBadge?.current_progress || 0;
              const max = badge.targetValue;

              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setSelectedBadge({ badge, userBadge: uBadge })}
                  className="flex flex-col items-center text-center space-y-2 group cursor-pointer active:scale-95 transition-all duration-200"
                >
                  {/* KRUHOVÝ 3D MEDAILÓN */}
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br ${
                        isUnlocked ? badge.unlockedBg : 'from-slate-100 via-slate-200 to-slate-300 dark:from-[#010314] dark:via-[#0B0D22] dark:to-[#1a1d36]'
                      } text-white flex items-center justify-center shadow-lg border-2 relative overflow-hidden transition-all duration-300 ${
                        isUnlocked
                          ? `${badge.unlockedBorder} group-hover:scale-105 shadow-[0_0_15px_rgba(102,51,238,0.5)]`
                          : 'border-slate-300 dark:border-[#2B2F49] opacity-60 group-hover:opacity-85'
                      }`}
                    >
                      {/* Glossy lesklý pásik na vrchu mince (odlesk skla) */}
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none rounded-t-full" />

                      {/* Ikona v strede mince */}
                      <IconComp
                        size={28}
                        className={`transition-all duration-300 relative z-10 ${
                          isUnlocked ? 'text-white scale-100' : 'text-slate-400 dark:text-[#C7CAE0]/30 scale-90'
                        }`}
                      />
                    </div>

                    {/* Odznak kolesa: Zelený Check vs Tmavý Zámok */}
                    <div className="absolute -bottom-1 -right-1 z-20">
                      {isUnlocked ? (
                        <div className="w-5 h-5 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-sm border border-white dark:border-[#0B0D22]">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#010314] text-slate-500 dark:text-[#C7CAE0]/60 flex items-center justify-center border border-slate-300 dark:border-[#2B2F49]">
                          <Lock size={10} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Názov odznaku */}
                  <div className="space-y-0.5">
                    <p className={`text-[11px] font-semibold leading-tight line-clamp-2 ${
                      isUnlocked ? 'text-[#0B0D22] dark:text-[#FFFFFF]' : 'text-[#64748B] dark:text-[#C7CAE0]/60'
                    }`}>
                      {badge.title[langKey]}
                    </p>
                    {!isUnlocked && (
                      <p className="text-[11px] font-semibold text-[#6633EE] dark:text-[#A78BFA] tracking-wide tabular-nums">
                        {progress} / {max}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAILNÝ DIALÓG S ODZNAKOM */}
      <BadgeModal
        badge={selectedBadge?.badge || null}
        userBadge={selectedBadge?.userBadge || null}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
        language={language}
      />

    </div>
  );
}
