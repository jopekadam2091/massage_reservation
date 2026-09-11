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
    <div className="bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-2xl shadow-sm overflow-hidden text-left font-sans text-[#1E293B] dark:text-[#DDE0F2]">
      <button
        type="button"
        onClick={() => setIsClientsCollapsed(!isClientsCollapsed)}
        className="w-full p-4 border-b border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50/50 dark:bg-[#010314]/50 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-[#010314] transition cursor-pointer"
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#6633EE] dark:text-[#A78BFA] flex items-center gap-2">
          <Users size={15} />
          <span>{language === 'sk' ? `Zoznam klientov a vernostné karty (${filteredProfiles.length})` : `Client list & loyalty cards (${filteredProfiles.length})`}</span>
        </h2>
        <div className="text-[#64748B] dark:text-[#C7CAE0]/60 flex items-center gap-1 text-xs">
          <span>{isClientsCollapsed ? (language === 'sk' ? 'Rozbaliť' : 'Expand') : (language === 'sk' ? 'Schovať' : 'Collapse')}</span>
          {isClientsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {!isClientsCollapsed && (
        <div className="divide-y divide-[#E2E8F0] dark:divide-[#2B2F49]">
          {filteredProfiles.length > 0 ? (
            filteredProfiles.map((profile) => {
              const activeStamps = getActiveStamps(profile);
              const currentStamps = activeStamps.length;
              const maxStamps = 10;
              const isCardFull = currentStamps >= maxStamps;
              const activeGift = getActiveGift(profile);
              const ActiveGiftIcon = activeGift ? (GIFT_ICON_MAP[activeGift.gift_type] || Gift) : null;

              return (
                <div 
                  key={profile.id} 
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-[#010314]/40 transition-colors"
                >
                  <div className="text-left space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#0B0D22] dark:text-[#FFFFFF] text-sm truncate">
                        {profile.full_name || (language === 'sk' ? 'Hosť bez mena' : 'Unnamed Guest')}
                      </h3>
                      {profile.role === 'admin' && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] border border-[#6633EE]/30">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60 truncate font-normal">{profile.email}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isCardFull 
                          ? 'bg-[#10B981]/15 text-[#10B981] animate-pulse border border-[#10B981]/40' 
                          : 'bg-slate-100 dark:bg-[#010314] text-[#1E293B] dark:text-[#DDE0F2] border border-[#E2E8F0] dark:border-[#2B2F49]'
                      }`}>
                        {language === 'sk' ? 'Pečiatky' : 'Stamps'}: {currentStamps} / {maxStamps} {isCardFull && '🎉'}
                      </span>

                      {activeGift && ActiveGiftIcon && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold pl-2.5 pr-1.5 py-0.5 rounded-full bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] border border-[#6633EE]/30">
                          <ActiveGiftIcon size={11} />
                          <span className="max-w-[120px] truncate">{getGiftLabel(activeGift.gift_type, activeGift.custom_code)}</span>
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
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#010314] text-[#64748B] dark:text-[#C7CAE0]/60 border border-[#E2E8F0] dark:border-[#2B2F49]">
                          {language === 'sk' ? 'Odporučil: ' : 'Referred by: '}{getReferrerName(profile.referred_by) || '—'}
                        </span>
                      )}

                      {profile.referral_code && (
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#010314] text-[#64748B] dark:text-[#C7CAE0]/60 border border-[#E2E8F0] dark:border-[#2B2F49]">
                          Kód: {profile.referral_code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AKČNÉ TLAČIDLÁ PRE SPRÁVU KLIENTA */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setStampProfile(profile);
                        setStampError('');
                        setStampPrice('');
                      }}
                      disabled={isCardFull}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#6633EE] hover:bg-[#5324d6] text-white font-semibold text-xs rounded-xl shadow-xs transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      <span>{language === 'sk' ? '+ Pečiatka' : '+ Stamp'}</span>
                    </button>

                    {profile.referral_discount_status === 'eligible_for_10_percent_discount' && (
                      <button
                        type="button"
                        onClick={() => handleClaimReferralDiscount(profile)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
                      >
                        <Percent size={14} />
                        <span>{language === 'sk' ? 'Referral -10%' : 'Referral -10%'}</span>
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
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-[#010314] hover:bg-slate-200 dark:hover:bg-[#0B0D22] text-[#6633EE] dark:text-[#A78BFA] border border-[#E2E8F0] dark:border-[#2B2F49] font-semibold text-xs rounded-xl shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      <Gift size={14} />
                      <span>{language === 'sk' ? 'Prekvapenie' : 'Surprise'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetCard(profile)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 font-semibold text-xs rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
                        isCardFull
                          ? 'bg-[#10B981] hover:bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 dark:ring-emerald-800'
                          : 'bg-slate-100 dark:bg-[#010314] hover:bg-slate-200 dark:hover:bg-[#0B0D22] text-[#64748B] dark:text-[#C7CAE0] border border-[#E2E8F0] dark:border-[#2B2F49]'
                      }`}
                    >
                      <RotateCcw size={14} />
                      <span>{isCardFull ? (language === 'sk' ? 'Uplatniť odmenu' : 'Claim reward') : (language === 'sk' ? 'Reset' : 'Reset')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHistoryProfile(profile)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-[#010314] hover:bg-slate-200 dark:hover:bg-[#0B0D22] text-[#1E293B] dark:text-[#DDE0F2] border border-[#E2E8F0] dark:border-[#2B2F49] font-semibold text-xs rounded-xl shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
                      title={language === 'sk' ? 'História masáží klienta' : 'Client history'}
                    >
                      <History size={14} />
                      <span className="hidden sm:inline">{language === 'sk' ? 'História' : 'History'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-[#64748B] dark:text-[#C7CAE0]/60 text-xs font-normal">
              {language === 'sk' ? 'Nenašli sa žiadni klienti.' : 'No clients found.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}