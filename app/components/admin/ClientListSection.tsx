'use client';

import React, { useState } from 'react';
import { Profile, StampRecord, GiftRecord } from '@/app/types';
import { 
  Users, ChevronDown, ChevronUp, Gift, X, PlusCircle, Check,
  Percent, RotateCcw, Tag, Sparkles, Calendar, Clock, ArrowUpDown, Filter,
  MinusCircle, ScrollText, Trash2, Copy 
} from 'lucide-react';
import { formatCreationTime } from '@/app/utils/bookingUtils';

const GIFT_ICON_MAP: Record<string, React.ElementType> = {
  discount_code: Tag,
  next_visit_gift: Gift,
  vip_upgrade: Sparkles,
  referral_reward: Percent,
};

function getRegistrationRelativeLabel(dateStr?: string | null, isSK: boolean = true): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return isSK ? 'Dnes' : 'Today';
  }
  if (diffDays === 1 || (diffHours < 48 && now.getDate() - date.getDate() === 1)) {
    return isSK ? 'Pred 1 dňom' : '1 day ago';
  }
  if (diffDays >= 2 && diffDays <= 7) {
    return isSK ? `Pred ${diffDays} dňami` : `${diffDays} days ago`;
  }
  if (diffDays > 7 && diffDays <= 30) {
    return isSK ? 'Viac ako týždeň' : 'Over a week ago';
  }
  if (diffDays > 30 && diffDays <= 365) {
    return isSK ? 'Viac ako mesiac' : 'Over a month ago';
  }
  if (diffDays > 365) {
    return isSK ? 'Viac ako rok' : 'Over a year ago';
  }
  return isSK ? `Pred ${diffDays} dňami` : `${diffDays} days ago`;
}

type Props = {
  filteredProfiles: Profile[];
  totalProfilesCount: number;
  clientSortBy: string;
  setClientSortBy: (sort: any) => void;
  registrationFilter: string;
  setRegistrationFilter: (f: string) => void;
  focusedReferrerId?: string | null;
  setFocusedReferrerId: (id: string | null) => void;
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
  onRemoveStamp: (stamp: StampRecord) => void;
  language: string;
};

export default function ClientListSection({
  filteredProfiles,
  totalProfilesCount,
  clientSortBy,
  setClientSortBy,
  registrationFilter,
  setRegistrationFilter,
  focusedReferrerId,
  setFocusedReferrerId,
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
  onRemoveStamp,
  language,
}: Props) {
  const isSK = language === 'sk';
  const [removeStampProfile, setRemoveStampProfile] = useState<Profile | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      setTimeout(() => {
        setCopiedCodeId((prev) => (prev === id ? null : prev));
      }, 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-2xl shadow-sm overflow-hidden text-left font-sans text-[#1E293B] dark:text-[#DDE0F2]">
      <button
        type="button"
        onClick={() => setIsClientsCollapsed(!isClientsCollapsed)}
        className="w-full p-4 border-b border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50/50 dark:bg-[#010314]/50 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-[#010314] transition cursor-pointer"
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#6633EE] dark:text-[#A78BFA] flex items-center gap-2">
          <Users size={15} />
          <span>
            {isSK 
              ? `Zoznam klientov a vernostné karty (${filteredProfiles.length}${totalProfilesCount > filteredProfiles.length ? ` z ${totalProfilesCount}` : ''})` 
              : `Client list & loyalty cards (${filteredProfiles.length}${totalProfilesCount > filteredProfiles.length ? ` of ${totalProfilesCount}` : ''})`}
          </span>
        </h2>
        <div className="text-[#64748B] dark:text-[#C7CAE0]/60 flex items-center gap-1 text-xs">
          <span>{isClientsCollapsed ? (isSK ? 'Rozbaliť' : 'Expand') : (isSK ? 'Schovať' : 'Collapse')}</span>
          {isClientsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {!isClientsCollapsed && (
        <div>
          {/* OVLÁDACIA LIŠTA: FILTRÁCIA REGISTRÁCIE + ZORADENIE */}
          <div className="p-3 sm:p-4 bg-slate-50/80 dark:bg-[#010314]/80 border-b border-[#E2E8F0] dark:border-[#2B2F49] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* FILTER PODĽA ČASU REGISTRÁCIE */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] mr-1">
                  <Filter size={13} className="text-[#6633EE] dark:text-[#A78BFA]" />
                  <span>{isSK ? 'Registrácia:' : 'Registered:'}</span>
                </div>
                {[
                  { id: 'all', labelSk: 'Všetci', labelEn: 'All' },
                  { id: 'today', labelSk: 'Dnes', labelEn: 'Today' },
                  { id: 'week', labelSk: '7 dní', labelEn: '7 days' },
                  { id: 'month', labelSk: '30 dní', labelEn: '30 days' },
                  { id: 'year', labelSk: 'Tento rok', labelEn: 'This year' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRegistrationFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      registrationFilter === tab.id
                        ? 'bg-[#6633EE] text-white shadow-xs'
                        : 'bg-white dark:bg-[#0B0D22] text-[#64748B] dark:text-[#C7CAE0]/70 border border-[#E2E8F0] dark:border-[#2B2F49] hover:bg-slate-100 dark:hover:bg-[#1E2238]'
                    }`}
                  >
                    {isSK ? tab.labelSk : tab.labelEn}
                  </button>
                ))}
              </div>

              {/* ZORADENIE KLIENTOV */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={13} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                <span className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] shrink-0">
                  {isSK ? 'Zoradiť:' : 'Sort:'}
                </span>
                <select
                  value={clientSortBy}
                  onChange={(e) => setClientSortBy(e.target.value)}
                  aria-label={isSK ? 'Zoradiť klientov' : 'Sort clients'}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0B0D22] text-[#1E293B] dark:text-[#DDE0F2] border border-[#E2E8F0] dark:border-[#2B2F49] focus:outline-none focus:border-[#6633EE] shadow-xs cursor-pointer"
                >
                  <option value="registered_desc">{isSK ? 'Dátum registrácie (Najnovšie prvé)' : 'Registration date (Newest first)'}</option>
                  <option value="registered_asc">{isSK ? 'Dátum registrácie (Najstaršie prvé)' : 'Registration date (Oldest first)'}</option>
                  <option value="name_asc">{isSK ? 'Meno (A - Z)' : 'Name (A - Z)'}</option>
                  <option value="name_desc">{isSK ? 'Meno (Z - A)' : 'Name (Z - A)'}</option>
                  <option value="stamps_desc">{isSK ? 'Počet pečiatok' : 'Stamps count'}</option>
                  <option value="booking_created_desc">{isSK ? 'Najnovšia rezervácia (čas vytvorenia)' : 'Newest booking (creation time)'}</option>
                </select>
              </div>
            </div>

            {/* STAVOVÝ POPIS AK JE AKTÍVNY FILTER */}
            {registrationFilter !== 'all' && (
              <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 pt-1">
                <span>
                  {isSK
                    ? `Zobrazených ${filteredProfiles.length} z celkovo ${totalProfilesCount} klientov registrovaných v zvolenom období.`
                    : `Showing ${filteredProfiles.length} of ${totalProfilesCount} clients registered in selected period.`}
                </span>
                <button
                  type="button"
                  onClick={() => setRegistrationFilter('all')}
                  className="text-[11px] font-semibold text-[#6633EE] dark:text-[#A78BFA] hover:underline cursor-pointer"
                >
                  {isSK ? 'Zrušiť filter' : 'Clear filter'}
                </button>
              </div>
            )}

            {/* INFORMAČNÝ BANNER AK JE ZAPNUTÝ FILTER ODPORÚČATEĽA */}
            {focusedReferrerId && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#6633EE]/10 dark:bg-[#6633EE]/20 border border-[#6633EE]/30 text-xs text-[#0B0D22] dark:text-white">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                  <span>
                    {isSK ? 'Filter: Zobrazený odporúčateľ' : 'Filter: Showing referrer'}:{' '}
                    <strong className="font-bold text-[#6633EE] dark:text-[#A78BFA]">
                      {getReferrerName(focusedReferrerId) || focusedReferrerId}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFocusedReferrerId(null)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#6633EE] dark:text-[#A78BFA] hover:underline cursor-pointer ml-2 shrink-0"
                >
                  <X size={14} />
                  <span>{isSK ? 'Zrušiť filter (Všetci klienti)' : 'Reset filter (All clients)'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 space-y-3.5">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((profile) => {
                const activeStamps = getActiveStamps(profile);
                const currentStamps = activeStamps.length;
                const maxStamps = 10;
                const isCardFull = currentStamps >= maxStamps;
                const activeGift = getActiveGift(profile);
                const activeGifts = profile.gifts ? profile.gifts.filter((g) => !g.used && !g.revoked_at) : (activeGift ? [activeGift] : []);
                const ActiveGiftIcon = activeGift ? (GIFT_ICON_MAP[activeGift.gift_type] || Gift) : null;
                const bookingCreatedInfo = profile.latestBooking?.created ? formatCreationTime(profile.latestBooking.created, language) : null;
                const regInfo = profile.created_at ? formatCreationTime(profile.created_at, language) : null;
                const regRelativeLabel = getRegistrationRelativeLabel(profile.created_at, isSK);
                const isNewClient = profile.created_at ? (new Date().getTime() - new Date(profile.created_at).getTime()) <= 48 * 3600 * 1000 : false;

                const hasGiftsOrRewards = Boolean(
                  activeGifts.length > 0 ||
                  profile.referral_discount_status === 'eligible_for_10_percent_discount' ||
                  profile.referral_code
                );

                return (
                  <div 
                    key={profile.id} 
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE]/40 transition-all shadow-xs space-y-3.5"
                  >
                    {/* 1. HORNÝ BLOK: MENO, ODPORÚČATEĽ, EMAIL A DÁTUM REGISTRÁCIE */}
                    <div className="pb-2.5 border-b border-[#E2E8F0] dark:border-[#2B2F49]/60">
                      {/* 1.1 HORNÝ RIADOK: Meno klienta vľavo s odznakmi | "Odporučil: [kto]" vpravo na mieste pôvodného tagu */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-[#0B0D22] dark:text-white truncate">
                            {profile.full_name || (isSK ? 'Hosť bez mena' : 'Unnamed Guest')}
                          </h3>
                          {isNewClient && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                              <Sparkles size={10} className="text-emerald-500 shrink-0" />
                              <span>{isSK ? 'Nový klient' : 'New client'}</span>
                            </span>
                          )}
                        </div>

                        {/* Odporučil tag vpravo hore na mieste pôvodného tagu - klikateľný filter */}
                        {profile.referred_by ? (
                          <button
                            type="button"
                            onClick={() => setFocusedReferrerId(profile.referred_by!)}
                            title={isSK ? `Filtrovať profil: ${getReferrerName(profile.referred_by) || 'odporúčateľ'}` : `Filter profile: ${getReferrerName(profile.referred_by) || 'referrer'}`}
                            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#010314] hover:bg-[#6633EE]/15 hover:border-[#6633EE]/40 text-[#64748B] dark:text-[#C7CAE0]/80 hover:text-[#6633EE] dark:hover:text-[#A78BFA] border border-[#E2E8F0] dark:border-[#2B2F49] transition cursor-pointer shrink-0 group shadow-2xs whitespace-nowrap"
                          >
                            <span>{isSK ? 'Odporučil:' : 'Referred by:'}</span>
                            <strong className="text-[#0B0D22] dark:text-white font-semibold group-hover:underline underline-offset-2">
                              {getReferrerName(profile.referred_by) || '—'}
                            </strong>
                          </button>
                        ) : null}
                      </div>

                      {/* 1.2 SPODNÝ RIADOK: Email vľavo a presný dátum registrácie vpravo na presne rovnakej úrovni */}
                      <div className="flex items-center justify-between gap-2 mt-1 sm:mt-1.5">
                        {/* Emailová adresa s malým kompaktným riadkovaním od mena */}
                        <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/70 truncate font-medium leading-none">
                          {profile.email}
                        </p>

                        {/* Presný dátum registrácie zarovno s emailom */}
                        {regInfo ? (
                          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 font-medium leading-none shrink-0 whitespace-nowrap">
                            <Calendar size={11} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                            <span>{regInfo.formattedDateTime}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/50 shrink-0 leading-none">
                            {isSK ? 'Registrácia neevidovaná' : 'No registration date'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. PEČIATKY: INFORMAČNÝ AJ VIZUÁLNY UKAZOVATEĽ (10 KRUHOVÝCH SLOTŮ) + AKČNÉ TLAČIDLÁ */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#0B0D22] dark:text-white">
                          {isSK ? 'Pečiatky:' : 'Stamps:'}{' '}
                          <span className="text-[#6633EE] dark:text-[#A78BFA] font-extrabold">{currentStamps}</span> / {maxStamps}
                        </span>
                        {isCardFull ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse flex items-center gap-1">
                            <Sparkles size={10} />
                            <span>{isSK ? 'Plná karta • Nárok na odmenu' : 'Full card • Reward available'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60">
                            ({maxStamps - currentStamps} {isSK ? 'do plnej karty' : 'remaining'})
                          </span>
                        )}
                      </div>

                      {/* 10 vizuálnych kruhových pečiatok + akcie ku pečiatkam (Pridať, Odstrániť, Zoznam histórie) */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 10 vizuálnych pečiatok */}
                        <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] w-fit">
                          {Array.from({ length: maxStamps }).map((_, idx) => {
                            const isFilled = idx < currentStamps;
                            return (
                              <div
                                key={idx}
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                                  isFilled
                                    ? isCardFull
                                      ? 'bg-emerald-500 text-white shadow-xs scale-105'
                                      : 'bg-gradient-to-r from-[#6633EE] to-[#7C3AED] text-white shadow-xs scale-105'
                                    : 'bg-white dark:bg-[#0B0D22] border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                                }`}
                                title={isSK ? `Pečiatka ${idx + 1}` : `Stamp ${idx + 1}`}
                              >
                                {isFilled ? (
                                  <Check size={11} className="stroke-[3]" />
                                ) : (
                                  <span className="text-[9px] font-bold opacity-60">{idx + 1}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Tlačidlá priamo pri pečiatkach */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Pridať pečiatku - iba ikonka */}
                          <button
                            type="button"
                            onClick={() => {
                              setStampProfile(profile);
                              setStampError('');
                              setStampPrice('');
                            }}
                            disabled={isCardFull}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#6633EE] hover:bg-[#5324d6] text-white transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs shrink-0"
                            title={isSK ? (isCardFull ? 'Karta je plná (10/10)' : 'Pridať pečiatku') : (isCardFull ? 'Card is full' : 'Add stamp')}
                            aria-label={isSK ? 'Pridať pečiatku' : 'Add stamp'}
                          >
                            <PlusCircle size={16} />
                          </button>

                          {/* Červený button na odstránenie pečiatky - otvorí zoznam pečiatok a hodnôt */}
                          <button
                            type="button"
                            onClick={() => setRemoveStampProfile(profile)}
                            disabled={currentStamps === 0}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-500/10 dark:bg-rose-500/20 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs shrink-0"
                            title={isSK ? 'Odstrániť pečiatku (výber zo zoznamu hodnôt)' : 'Remove stamp (select from values)'}
                            aria-label={isSK ? 'Odstrániť pečiatku' : 'Remove stamp'}
                          >
                            <MinusCircle size={16} />
                          </button>

                          {/* História / Zoznam návštev - ikonka ScrollText */}
                          <button
                            type="button"
                            onClick={() => setHistoryProfile(profile)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#010314] hover:bg-slate-200 dark:hover:bg-[#1E2238] text-[#1E293B] dark:text-[#DDE0F2] border border-[#E2E8F0] dark:border-[#2B2F49] transition-all duration-200 active:scale-95 cursor-pointer shadow-xs shrink-0"
                            title={isSK ? 'Zoznam a história návštev klienta' : 'Client visit list & history'}
                            aria-label={isSK ? 'História návštev' : 'Visit history'}
                          >
                            <ScrollText size={15} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. KONTAJNER PRE DARČEKY, PREKVAPENIA A ZĽAVOVÉ KÓDY */}
                    <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#010314]/80 border border-[#E2E8F0] dark:border-[#2B2F49] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#0B0D22] dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <Gift size={13} className="text-[#6633EE] dark:text-[#A78BFA]" />
                          <span>{isSK ? 'Darčeky, zľavy & kódy' : 'Gifts, discounts & codes'}</span>
                          {activeGifts.length > 0 && (
                            <span className="text-[10px] font-semibold text-[#6633EE] dark:text-[#A78BFA] ml-1">
                              ({activeGifts.length})
                            </span>
                          )}
                        </div>

                        {/* Button prekvapenia priamo v kontajneri - LEN IKONKA, nie ďalší box! */}
                        <button
                          type="button"
                          onClick={() => {
                            setGiftProfile(profile);
                            setSelectedGift('');
                            setCustomCode('');
                            setGiftError('');
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#6633EE]/10 dark:bg-[#6633EE]/20 hover:bg-[#6633EE] text-[#6633EE] dark:text-[#A78BFA] hover:text-white border border-[#6633EE]/30 transition-all duration-150 cursor-pointer shadow-2xs"
                          title={isSK ? 'Pridať prekvapenie / kód' : 'Add surprise / code'}
                          aria-label={isSK ? 'Pridať prekvapenie' : 'Add surprise'}
                        >
                          <Gift size={13} />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {/* Všetky aktívne prekvapenia / darčeky */}
                        {activeGifts.map((gift) => {
                          const GiftIcon = GIFT_ICON_MAP[gift.gift_type] || Gift;
                          return (
                            <span 
                              key={gift.id}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold pl-2.5 pr-1.5 py-1 rounded-lg bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] border border-[#6633EE]/30"
                            >
                              <GiftIcon size={12} className="shrink-0" />
                              <span className="font-bold">{getGiftLabel(gift.gift_type, gift.custom_code)}</span>
                              <button
                                type="button"
                                onClick={() => handleRevokeGift(profile)}
                                className="p-0.5 rounded-full hover:bg-rose-200 dark:hover:bg-rose-900/60 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title={isSK ? 'Zrušiť prekvapenie' : 'Revoke surprise'}
                              >
                                <X size={11} />
                              </button>
                            </span>
                          );
                        })}

                        {/* Referral zľava -10% nárok */}
                        {profile.referral_discount_status === 'eligible_for_10_percent_discount' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                            <Percent size={11} />
                            <span>{isSK ? 'Nárok na Referral -10%' : 'Referral -10% eligible'}</span>
                          </span>
                        )}

                        {/* Ak nemá žiadne darčeky */}
                        {activeGifts.length === 0 && profile.referral_discount_status !== 'eligible_for_10_percent_discount' && (
                          <span className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/50 italic">
                            {isSK ? 'Žiadne aktívne prekvapenia' : 'No active surprises'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Doplňujúca informácia o najnovšom termíne (ak existuje) */}
                    {profile.latestBooking && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 w-fit">
                        <Clock size={12} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                        <span>
                          {isSK ? 'Najnovší termín:' : 'Latest appointment:'}{' '}
                          <strong className="font-bold text-[#0B0D22] dark:text-white">
                            {new Date(profile.latestBooking.start).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })}{' '}
                            {new Date(profile.latestBooking.start).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                          </strong>
                        </span>
                        {bookingCreatedInfo?.relative && (
                          <span className="text-[10px] opacity-75">
                            ({isSK ? 'vytvorené' : 'created'} {bookingCreatedInfo.relative})
                          </span>
                        )}
                      </div>
                    )}

                    {/* 4. SPODNÁ LIŠTA: KÓD KLIENTA VĽAVO A RESET TLAČIDLO VPRAVO */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#2B2F49]/60">
                      {/* Kód klienta na ľavej strane: bez tagu, len čistý text + len copy ikonka */}
                      <div className="text-xs text-[#64748B] dark:text-[#C7CAE0]/80 flex items-center gap-1.5">
                        {profile.referral_code ? (
                          <>
                            <span>
                              {isSK ? 'Kód klienta: ' : 'Client code: '}
                              <strong className="font-mono font-bold text-[#0B0D22] dark:text-white text-xs tracking-wider">
                                {profile.referral_code}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(profile.referral_code!, profile.id)}
                              className="p-0.5 text-slate-400 hover:text-[#6633EE] dark:hover:text-[#A78BFA] transition-colors cursor-pointer inline-flex items-center justify-center"
                              title={copiedCodeId === profile.id ? (isSK ? 'Skopírované!' : 'Copied!') : (isSK ? 'Kopírovať kód klienta' : 'Copy client code')}
                              aria-label={isSK ? 'Kopírovať kód klienta' : 'Copy client code'}
                            >
                              {copiedCodeId === profile.id ? (
                                <Check size={13} className="text-emerald-500 animate-in zoom-in-50 duration-150" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </>
                        ) : null}
                      </div>

                      {/* Vpravo: Referral claim (ak má nárok) + Reset karty */}
                      <div className="flex items-center gap-2">
                        {profile.referral_discount_status === 'eligible_for_10_percent_discount' && (
                          <button
                            type="button"
                            onClick={() => handleClaimReferralDiscount(profile)}
                            className="h-9 px-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            <Percent size={14} />
                            <span>Referral -10%</span>
                          </button>
                        )}

                        {/* Reset / Uplatniť odmenu */}
                        <button
                          type="button"
                          onClick={() => handleResetCard(profile)}
                          className={`h-9 px-4 font-semibold text-xs rounded-xl transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            isCardFull
                              ? 'bg-[#10B981] hover:bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 dark:ring-emerald-800'
                              : 'bg-slate-100 dark:bg-[#010314] hover:bg-slate-200 dark:hover:bg-[#1E2238] text-[#64748B] dark:text-[#C7CAE0] border border-[#E2E8F0] dark:border-[#2B2F49]'
                          }`}
                        >
                          <RotateCcw size={14} />
                          <span>{isCardFull ? (isSK ? 'Uplatniť odmenu' : 'Claim reward') : (isSK ? 'Reset karty' : 'Reset card')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-[#64748B] dark:text-[#C7CAE0]/60 text-xs font-normal bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-2xl">
                {isSK ? 'Nenašli sa žiadni klienti.' : 'No clients found.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ODSTRÁNENIE KONKRÉTNEJ PEČIATKY */}
      {removeStampProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2B2F49]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-500">
                  <MinusCircle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B0D22] dark:text-white">
                    {isSK ? 'Odstrániť pečiatku' : 'Remove stamp'}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60">
                    {removeStampProfile.full_name || removeStampProfile.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRemoveStampProfile(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#010314] transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/80">
              {isSK 
                ? 'Vyberte konkrétnu pečiatku, ktorú si želáte z karty klienta odstrániť:' 
                : 'Select the specific stamp you wish to remove from client loyalty card:'}
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {getActiveStamps(removeStampProfile).map((stamp, index) => (
                <div
                  key={stamp.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-rose-500/30 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#0B0D22] dark:text-white">
                        {Number(stamp.price).toFixed(2)} €
                      </div>
                      <div className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60">
                        {new Date(stamp.created_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' })}{' '}
                        {new Date(stamp.created_at).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await onRemoveStamp(stamp);
                      const updated = filteredProfiles.find(p => p.id === removeStampProfile.id);
                      if (updated && getActiveStamps(updated).length > 1) {
                        setRemoveStampProfile(updated);
                      } else {
                        setRemoveStampProfile(null);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>{isSK ? 'Odstrániť' : 'Remove'}</span>
                  </button>
                </div>
              ))}

              {getActiveStamps(removeStampProfile).length === 0 && (
                <p className="text-center py-4 text-xs text-[#64748B] dark:text-[#C7CAE0]/50">
                  {isSK ? 'Žiadne aktívne pečiatky.' : 'No active stamps.'}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E2E8F0] dark:border-[#2B2F49]">
              <button
                type="button"
                onClick={() => setRemoveStampProfile(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#010314] hover:bg-slate-200 dark:hover:bg-[#1E2238] text-xs font-bold text-[#1E293B] dark:text-[#DDE0F2] transition cursor-pointer"
              >
                {isSK ? 'Zavrieť' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}