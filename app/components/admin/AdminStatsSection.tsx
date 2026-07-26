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
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {language === 'sk' ? 'Klienti' : 'Clients'}
          </span>
          <Users size={16} />
        </div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalClients}</p>
        <p className="text-[10px] text-slate-400 font-medium">{language === 'sk' ? 'Registrovaní' : 'Registered'}</p>
      </div>

      {/* 2. Aktívne rezervácie */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {language === 'sk' ? 'Rezervácie' : 'Bookings'}
          </span>
          <Calendar size={16} />
        </div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeBookingsCount}</p>
        <p className="text-[10px] text-slate-400 font-medium">{language === 'sk' ? 'Nadchádzajúce' : 'Upcoming'}</p>
      </div>

      {/* 3. Vydané pečiatky */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {language === 'sk' ? 'Pečiatky' : 'Stamps'}
          </span>
          <Award size={16} />
        </div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalStampsCount}</p>
        <p className="text-[10px] text-slate-400 font-medium">{language === 'sk' ? 'Udelené celkovo' : 'Total granted'}</p>
      </div>

      {/* 4. Očakávané tržby */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {language === 'sk' ? 'Odhad tržieb' : 'Est. Revenue'}
          </span>
          <Coins size={16} />
        </div>
        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{estimatedRevenue} €</p>
        <p className="text-[10px] text-slate-400 font-medium">{language === 'sk' ? 'Z aktívnych termínov' : 'From active slots'}</p>
      </div>
    </div>
  );
}