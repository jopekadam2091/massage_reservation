'use client';

import React from 'react';
import { Profile, StampRecord, GiftRecord } from '@/app/types';
import { 
  Users, ChevronDown, ChevronUp, Gift, X, PlusCircle, 
  Percent, RotateCcw, History, Tag, Sparkles 
} from 'lucide-react';

const GIFT_ICON_MAP: Record<string, React.ElementType> = {
  discount_code: Tag,
  next_visit_gift: Gift,
  vip_upgrade: Sparkles,
  referral_reward: Percent,
};

type Props = {
  filteredProfiles: Profile[];
  isClientsCollapsed: boolean;
  setIsClientsCollapsed: (collapsed: boolean) => void;
  getActiveStamps: (p: Profile) => StampRecord[];
  getActiveGift: (p: Profile) => GiftRecord | null;
  getReferrerName: (id: string | null) => string | null;
  getGiftLabel: (type: string, code?: string | null) => string;
  handleRevokeGift: (p: Profile) => void;
  handleClaimReferralDiscount: (p: Profile) => void;
  handleResetCard: (p: Profile) => void;
  setStampProfile: (p: Profile) => void;
  setStampError: (e: string) => void;
  setStampPrice: (price: string) => void;
  setGiftProfile: (p: Profile) => void;
  setSelectedGift: (g: string) => void;
  setCustomCode: (c: string) => void;
  setGiftError: (e: string) => void;
  setHistoryProfile: (p: Profile) => void;
  language: string;
};

export default function ClientListSection({
  filteredProfiles,
  isClientsCollapsed,
  setIsClientsCollapsed,
  getActiveStamps,
  getActiveGift,
  getReferrerName,
  getGiftLabel,
  handleRevokeGift,
  handleClaimReferralDiscount,
  handleResetCard,
  setStampProfile,
  setStampError,
  setStampPrice,
  setGiftProfile,
  setSelectedGift,
  setCustomCode,
  setGiftError,
  setHistoryProfile,
  language,
}: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden text-left font-sans">
      <button
        type="button"
        onClick={() => setIsClientsCollapsed(!isClientsCollapsed)}
        className="w-full p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Users size={14} />
          <span>{language === 'sk' ? `Nájdení klienti (${filteredProfiles.length})` : `Found clients (${filteredProfiles.length})`}</span>
        </h2>
        <div className="text-slate-400 flex items-center gap-1 text-xs">
          <span>{isClientsCollapsed ? (language === 'sk' ? 'Rozbaliť' : 'Expand') : (language === 'sk' ? 'Schovať' : 'Collapse')}</span>
          {isClientsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {!isClientsCollapsed && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredProfiles.length > 0 ? (
            filteredProfiles.map((profile) => {
              const activeStamps = getActiveStamps(profile);
              const currentStamps = activeStamps.length;
              const maxStamps = profile.program_type === '5_stamps' ? 5 : 10;
              const isCardFull = currentStamps >= maxStamps;
              const activeGift = getActiveGift(profile);
              const ActiveGiftIcon = activeGift ? (GIFT_ICON_MAP[activeGift.gift_type] || Gift) : null;

              return (
                <div 
                  key={profile.id} 
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
                >
                  <div className="text-left space-y-1 min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {profile.full_name || (language === 'sk' ? 'Hosť bez mena' : 'Unnamed Guest')}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{profile.email}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        {profile.program_type === '5_stamps' ? (language === 'sk' ? '5-pečiatkový program' : '5-stamp program') : (language === 'sk' ? '10-pečiatkový program' : '10-stamp program')}
                      </span>

                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCardFull 
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 animate-pulse border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {language === 'sk' ? 'Stav' : 'Status'}: {currentStamps} / {maxStamps} {isCardFull && '🎉'}
                      </span>

                      {activeGift && ActiveGiftIcon && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold pl-2 pr-1 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50">
                          <ActiveGiftIcon size={10} />
                          <span className="max-w-[110px] truncate">{getGiftLabel(activeGift.gift_type, activeGift.custom_code)}</span>
                          <button
                            type="button"
                            onClick={() => handleRevokeGift(profile)}
                            className="ml-0.5 p-0.5 rounded-full hover:bg-rose-200 dark:hover:bg-rose-900/60 transition cursor-pointer"
                            title={language === 'sk' ? 'Zrušiť prekvapenie' : 'Revoke surprise'}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      )}

                      {profile.referred_by && (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50">
                          {language === 'sk' ? 'Odporučil: ' : 'Referred by: '}{getReferrerName(profile.referred_by) || '—'}
                        </span>
                      )}

                      {profile.referral_code && (
                        <span className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {profile.referral_code}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setStampProfile(profile);
                        setStampError('');
                        setStampPrice('');
                      }}
                      disabled={isCardFull}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      {language === 'sk' ? 'Pečiatka' : 'Stamp'}
                    </button>

                    {profile.referral_discount_status === 'eligible_for_10_percent_discount' && (
                      <button
                        type="button"
                        onClick={() => handleClaimReferralDiscount(profile)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        <Percent size={14} />
                        {language === 'sk' ? 'Referal -10%' : 'Referral -10%'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setGiftProfile(profile);
                        setSelectedGift('');
                        setCustomCode('');
                        setGiftError('');
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 min-w-[118px] bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Gift size={14} />
                      {language === 'sk' ? 'Prekvapenie' : 'Surprise'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetCard(profile)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 min-w-[92px] font-semibold text-xs rounded-xl transition active:scale-95 cursor-pointer ${
                        isCardFull
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md ring-2 ring-emerald-300 dark:ring-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <RotateCcw size={14} />
                      {isCardFull ? (language === 'sk' ? 'Uplatniť' : 'Claim') : (language === 'sk' ? 'Reset' : 'Reset')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setHistoryProfile(profile)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-xl transition active:scale-95 cursor-pointer"
                      title={language === 'sk' ? 'História klienta' : 'Client history'}
                    >
                      <History size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              {language === 'sk' ? 'Nenašli sa žiadni klienti.' : 'No clients found.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}