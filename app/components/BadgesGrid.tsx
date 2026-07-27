'use client';

import React, { useEffect, useState } from 'react';
import { BadgeRegistry, BadgeDefinition } from '@/app/constants/badges';
import { UserBadge } from '@/app/types';
import BadgeModal from './BadgeModal';
import { Award, Lock, Check, Loader2 } from 'lucide-react';
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
    <div className="w-full space-y-4 font-sans text-left">
      
      {/* Hlavička sekcie */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs">
            <Award size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 leading-tight">
              {language === 'sk' ? 'Odznaky a Úspechy' : 'Badges & Achievements'}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {language === 'sk' ? 'Získavaj medaily za svoje masáže' : 'Earn medals for completed sessions'}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-black shadow-xs">
          <span>🏆 {unlockedCount} / {totalCount}</span>
        </span>
      </div>

      {/* KRUHOVÁ MEDAILÓNOVÁ MRIEŽKA (Dizajn presne podľa screenshotu) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={24} className="animate-spin text-amber-500" />
            <p className="text-xs">{language === 'sk' ? 'Načítavam odznaky...' : 'Loading badges...'}</p>
          </div>
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
                        isUnlocked ? badge.unlockedBg : 'from-slate-700 via-slate-800 to-slate-900'
                      } text-white flex items-center justify-center shadow-lg border-4 relative overflow-hidden transition-all duration-300 ${
                        isUnlocked
                          ? `${badge.unlockedBorder} group-hover:scale-105`
                          : 'border-slate-600/60 shadow-inner opacity-65 group-hover:opacity-85'
                      }`}
                      style={{
                        boxShadow: isUnlocked
                          ? `0 6px 18px ${badge.glowColor}`
                          : 'inset 0 2px 6px rgba(0,0,0,0.6)',
                      }}
                    >
                      {/* Glossy lesklý pásik na vrchu mince (odlesk skla) */}
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none rounded-t-full" />

                      {/* Ikona v strede mince */}
                      <IconComp
                        size={30}
                        className={`transition-all duration-300 drop-shadow-sm relative z-10 ${
                          isUnlocked ? 'text-white scale-100' : 'text-slate-400/50 scale-90'
                        }`}
                      />
                    </div>

                    {/* Odznak kolesa: Zelený Check vs Tmavý Zámok */}
                    {isUnlocked ? (
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 z-20">
                        <Check size={11} strokeWidth={3.5} />
                      </span>
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center border-2 border-white dark:border-slate-900 z-20">
                        <Lock size={10} />
                      </span>
                    )}
                  </div>

                  {/* MENO ODZNAKU POD MINCOU */}
                  <div className="w-full px-0.5">
                    <p className={`font-extrabold text-[11px] sm:text-xs truncate leading-tight ${
                      isUnlocked 
                        ? 'text-slate-800 dark:text-slate-100' 
                        : 'text-slate-400 dark:text-slate-500 font-semibold'
                    }`}>
                      {badge.title[langKey]}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {isUnlocked ? (language === 'sk' ? 'Odomknutý' : 'Unlocked') : `${progress}/${max}`}
                    </p>
                  </div>

                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal s detailom odznaku */}
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
