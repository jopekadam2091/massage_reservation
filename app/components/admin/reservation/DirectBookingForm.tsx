'use client';

import React from 'react';
import { UserPlus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Client } from './types';
import { TIME_OPTIONS } from './constants';

type Props = {
  language: string;
  clients: Client[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  directName: string;
  setDirectName: (val: string) => void;
  directEmail: string;
  setDirectEmail: (val: string) => void;
  directPhone: string;
  setDirectPhone: (val: string) => void;
  directDate: string;
  setDirectDate: (val: string) => void;
  directTime: string;
  setDirectTime: (val: string) => void;
  directType: string;
  setDirectType: (val: string) => void;
  directDuration: number;
  setDirectDuration: (val: number) => void;
  directPrice: string;
  setDirectPrice: (val: string) => void;
  loadingDirect: boolean;
  directSuccess: string;
  directError: string;
  onSubmit: (e: React.FormEvent) => void;
};

export const DirectBookingForm: React.FC<Props> = ({
  language,
  clients,
  selectedClientId,
  setSelectedClientId,
  directName,
  setDirectName,
  directEmail,
  setDirectEmail,
  directPhone,
  setDirectPhone,
  directDate,
  setDirectDate,
  directTime,
  setDirectTime,
  directType,
  setDirectType,
  directDuration,
  setDirectDuration,
  directPrice,
  setDirectPrice,
  loadingDirect,
  directSuccess,
  directError,
  onSubmit,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
          <UserPlus size={20} />
        </div>
        <div>
          <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
            {language === 'sk' ? 'B: Priama rezervácia pre klienta' : 'B: Direct Client Reservation'}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {language === 'sk' ? 'Vytvoriť rezerváciu na mieste alebo po telefóne' : 'Book a client directly on the spot'}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            {language === 'sk' ? 'Rýchly výber registrovaného klienta (nepovinné):' : 'Select registered client:'}
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedClientId(id);
              const found = clients.find((c) => c.id === id);
              if (found) {
                setDirectName(found.full_name || '');
                setDirectEmail(found.email || '');
              }
            }}
            className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none"
          >
            <option value="">-- {language === 'sk' ? 'Vyberte klienta zo zoznamu' : 'Select client'} --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name || c.email} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'sk' ? 'Meno klienta:' : 'Client Name:'}
            </label>
            <input
              type="text"
              required
              placeholder="Janko Hraško"
              value={directName}
              onChange={(e) => setDirectName(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">E-mail:</label>
            <input
              type="email"
              placeholder="klient@email.sk"
              value={directEmail}
              onChange={(e) => setDirectEmail(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'sk' ? 'Telefón:' : 'Phone:'}
            </label>
            <input
              type="tel"
              placeholder="+421 905 123 456"
              value={directPhone}
              onChange={(e) => setDirectPhone(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'sk' ? 'Dátum:' : 'Date:'}
            </label>
            <input
              type="date"
              required
              value={directDate}
              onChange={(e) => setDirectDate(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'sk' ? 'Čas (24h):' : 'Time (24h):'}
            </label>
            <select
              value={directTime}
              onChange={(e) => setDirectTime(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-extrabold focus:outline-none"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={`direct-${time}`} value={time}>{time}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'sk' ? 'Typ & Dĺžka:' : 'Type & Duration:'}
            </label>
            <select
              value={`${directType}_${directDuration}`}
              onChange={(e) => {
                const [t, d] = e.target.value.split('_');
                setDirectType(t);
                setDirectDuration(parseInt(d, 10));
              }}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold"
            >
              <option value="CLASSIC_30">Classic 30m</option>
              <option value="CLASSIC_45">Classic 45m</option>
              <option value="CLASSIC_60">Classic 60m</option>
              <option value="VIP PREMIUM_45">VIP Supreme 45m</option>
              <option value="VIP PREMIUM_60">VIP Pro 60m</option>
              <option value="VIP PREMIUM_90">VIP Max 90m</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'sk' ? 'Cena (€):' : 'Price (€):'}
            </label>
            <input
              type="number"
              value={directPrice}
              onChange={(e) => setDirectPrice(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-black text-center"
            />
          </div>
        </div>

        {directError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{directError}</span>
          </div>
        )}

        {directSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{directSuccess}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loadingDirect}
          className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loadingDirect ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          <span>{language === 'sk' ? 'Vytvoriť priamu rezerváciu' : 'Create Booking'}</span>
        </button>
      </form>
    </div>
  );
};