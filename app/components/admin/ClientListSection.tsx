'use client';

import React from 'react';
import { Profile, StampRecord, GiftRecord } from '@/app/types';
import { 
  Users, ChevronDown, ChevronUp, Gift, X, PlusCircle, 
  Percent, RotateCcw, History, Tag, Sparkles, Calendar, Clock, ArrowUpDown, Filter 
} from 'lucide-react';
import { formatCreationTime } from '@/app/utils/bookingUtils';

const GIFT_ICON_MAP: Record<string, React.ElementType> = {
  discount_code: Tag,
  next_visit_gift: Gift,
  vip_upgrade: Sparkles,
  referral_reward: Percent,
};

type Props = {
  filteredProfiles: Profile[];
  totalProfilesCount: number;
  clientSortBy: string;
  setClientSortBy: (sort: any) => void;
  registrationFilter: string;
  setRegistrationFilter: (f: string) => void;
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
  totalProfilesCount,
  clientSortBy,
  setClientSortBy,
  registrationFilter,
  setRegistrationFilter,
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
          <span>
            {language === 'sk' 
              ? `Zoznam klientov a vernostné karty (${filteredProfiles.length}${totalProfilesCount > filteredProfiles.length ? ` z ${totalProfilesCount}` : ''})` 
              : `Client list & loyalty cards (${filteredProfiles.length}${totalProfilesCount > filteredProfiles.length ? ` of ${totalProfilesCount}` : ''})`}
          </span>
        </h2>
        <div className="text-[#64748B] dark:text-[#C7CAE0]/60 flex items-center gap-1 text-xs">
          <span>{isClientsCollapsed ? (language === 'sk' ? 'Rozbaliť' : 'Expand') : (language === 'sk' ? 'Schovať' : 'Collapse')}</span>
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
                  <span>{language === 'sk' ? 'Registrácia:' : 'Registered:'}</span>
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
                    {language === 'sk' ? tab.labelSk : tab.labelEn}
                  </button>
                ))}
              </div>

              {/* ZORADENIE KLIENTOV */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={13} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                <span className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] shrink-0">
                  {language === 'sk' ? 'Zoradiť:' : 'Sort:'}
                </span>
                <select
                  value={clientSortBy}
                  onChange={(e) => setClientSortBy(e.target.value)}
                  aria-label={language === 'sk' ? 'Zoradiť klientov' : 'Sort clients'}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0B0D22] text-[#1E293B] dark:text-[#DDE0F2] border border-[#E2E8F0] dark:border-[#2B2F49] focus:outline-none focus:border-[#6633EE] shadow-xs cursor-pointer"
                >
                  <option value="registered_desc">{language === 'sk' ? 'Dátum registrácie (Najnovšie prvé)' : 'Registration date (Newest first)'}</option>
                  <option value="registered_asc">{language === 'sk' ? 'Dátum registrácie (Najstaršie prvé)' : 'Registration date (Oldest first)'}</option>
                  <option value="name_asc">{language === 'sk' ? 'Meno (A - Z)' : 'Name (A - Z)'}</option>
                  <option value="name_desc">{language === 'sk' ? 'Meno (Z - A)' : 'Name (Z - A)'}</option>
                  <option value="stamps_desc">{language === 'sk' ? 'Počet pečiatok' : 'Stamps count'}</option>
                  <option value="booking_created_desc">{language === 'sk' ? 'Najnovšia rezervácia (čas vytvorenia)' : 'Newest booking (creation time)'}</option>
                </select>
              </div>
            </div>

            {/* STAVOVÝ POPIS AK JE AKTÍVNY FILTER */}
            {registrationFilter !== 'all' && (
              <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 pt-1">
                <span>
                  {language === 'sk'
                    ? `Zobrazených ${filteredProfiles.length} z celkovo ${totalProfilesCount} klientov registrovaných v zvolenom období.`
                    : `Showing ${filteredProfiles.length} of ${totalProfilesCount} clients registered in selected period.`}
                </span>
                <button
                  type="button"
                  onClick={() => setRegistrationFilter('all')}
                  className="text-[11px] font-semibold text-[#6633EE] dark:text-[#A78BFA] hover:underline cursor-pointer"
                >
                  {language === 'sk' ? 'Zrušiť filter' : 'Clear filter'}
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-[#E2E8F0] dark:divide-[#2B2F49]">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((profile) => {
                const activeStamps = getActiveStamps(profile);
                const currentStamps = activeStamps.length;
                const maxStamps = 10;
                const isCardFull = currentStamps >= maxStamps;
                const activeGift = getActiveGift(profile);
                const ActiveGiftIcon = activeGift ? (GIFT_ICON_MAP[activeGift.gift_type] || Gift) : null;
                const bookingCreatedInfo = profile.latestBooking?.created ? formatCreationTime(profile.latestBooking.created, language) : null;
                const regInfo = profile.created_at ? formatCreationTime(profile.created_at, language) : null;
                const isNewClient = profile.created_at ? (new Date().getTime() - new Date(profile.created_at).getTime()) <= 48 * 3600 * 1000 : false;

                return (
                  <div 
                    key={profile.id} 
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-[#010314]/40 transition-colors"
                  >
                    <div className="text-left space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#0B0D22] dark:text-[#FFFFFF] text-sm truncate">
                          {profile.full_name || (language === 'sk' ? 'Hosť bez mena' : 'Unnamed Guest')}
                        </h3>
                        {profile.role === 'admin' && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] border border-[#6633EE]/30">
                            Admin
                          </span>
                        )}
                        {isNewClient && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <Sparkles size={10} className="text-emerald-500 shrink-0" />
                            <span>{language === 'sk' ? 'Nový klient' : 'New client'}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60 truncate font-normal">{profile.email}</p>
                      
                      {/* INFORMÁCIA O DÁTUME REGISTRÁCIE KLIENTA DO SYSTÉMU */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {regInfo ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#010314] text-[#1E293B] dark:text-[#DDE0F2] border border-[#E2E8F0] dark:border-[#2B2F49]">
                            <Calendar size={12} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                            <span>
                              {language === 'sk' ? 'Registrovaný:' : 'Registered:'}{' '}
                              <strong className="font-semibold text-[#0B0D22] dark:text-white">
                                {regInfo.formattedDateTime}
                              </strong>
                            </span>
                            {regInfo.relative && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white dark:bg-[#0B0D22] text-[#6633EE] dark:text-[#A78BFA] border border-[#6633EE]/30">
                                {regInfo.relative}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/50">
                            {language === 'sk' ? 'Dátum registrácie neevidovaný' : 'Registration date not recorded'}
                          </span>
                        )}

                        {/* REZERVÁCIA KLIENTA (ak existuje) */}
                        {profile.latestBooking && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                            <Clock size={12} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                            <span>
                              {language === 'sk' ? 'Termín:' : 'Appt:'}{' '}
                              <strong className="font-semibold text-[#0B0D22] dark:text-white">
                                {new Date(profile.latestBooking.start).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })}{' '}
                                {new Date(profile.latestBooking.start).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                              </strong>
                            </span>
                            {bookingCreatedInfo?.relative && (
                              <span className="text-[10px] opacity-75">
                                ({language === 'sk' ? 'rez.' : 'booked'} {bookingCreatedInfo.relative})
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isCardFull 
                            ? 'bg-[#10B981]/15 text-[#10B981] animate-pulse border border-[#10B981]/40' 
                            : 'bg-slate-100 dark:bg-[#010314] text-[#1E293B] dark:text-[#DDE0F2] border border-[#E2E8F0] dark:border-[#2B2F49]'
                        }`}>
                          {language === 'sk' ? 'Pečiatky' : 'Stamps'}: {currentStamps} / {maxStamps}
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
      </div>
    )}
  </div>
);
}