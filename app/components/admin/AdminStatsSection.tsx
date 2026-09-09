'use client';

import React from 'react';
import { Users, Calendar, Award, Coins } from 'lucide-react';

type Props = {
  totalClients: number;
  activeBookingsCount: number;
  totalStampsCount: number;
  estimatedRevenue: number;
  language: string;
};

export default function AdminStatsSection({
  totalClients,
  activeBookingsCount,
  totalStampsCount,
  estimatedRevenue,
  language,
}: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans text-left">
      {/* 1. Klienti */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs space-y-1">
        <div className="flex items-center justify-between text-[#6633EE] dark:text-[#A78BFA]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#C7CAE0]/60">
            {language === 'sk' ? 'Klienti' : 'Clients'}
          </span>
          <Users size={16} />
        </div>
        <p className="text-2xl font-bold text-[#0B0D22] dark:text-[#FFFFFF] tabular-nums">{totalClients}</p>
        <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 font-normal">{language === 'sk' ? 'Registrovaní' : 'Registered'}</p>
      </div>

      {/* 2. Aktívne rezervácie */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs space-y-1">
        <div className="flex items-center justify-between text-[#6633EE] dark:text-[#A78BFA]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#C7CAE0]/60">
            {language === 'sk' ? 'Rezervácie' : 'Bookings'}
          </span>
          <Calendar size={16} />
        </div>
        <p className="text-2xl font-bold text-[#0B0D22] dark:text-[#FFFFFF] tabular-nums">{activeBookingsCount}</p>
        <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 font-normal">{language === 'sk' ? 'Nadchádzajúce' : 'Upcoming'}</p>
      </div>

      {/* 3. Vydané pečiatky */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs space-y-1">
        <div className="flex items-center justify-between text-sky-500 dark:text-sky-400">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#C7CAE0]/60">
            {language === 'sk' ? 'Pečiatky' : 'Stamps'}
          </span>
          <Award size={16} />
        </div>
        <p className="text-2xl font-bold text-[#0B0D22] dark:text-[#FFFFFF] tabular-nums">{totalStampsCount}</p>
        <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 font-normal">{language === 'sk' ? 'Udelené celkovo' : 'Total granted'}</p>
      </div>

      {/* 4. Očakávané tržby */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs space-y-1">
        <div className="flex items-center justify-between text-[#10B981]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#C7CAE0]/60">
            {language === 'sk' ? 'Odhad tržieb' : 'Est. Revenue'}
          </span>
          <Coins size={16} />
        </div>
        <p className="text-2xl font-bold text-[#10B981] tabular-nums">{estimatedRevenue} €</p>
        <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 font-normal">{language === 'sk' ? 'Z aktívnych termínov' : 'From active slots'}</p>
      </div>
    </div>
  );
}