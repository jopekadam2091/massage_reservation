'use client';

import React from 'react';
import { 
  Wand2, Briefcase, Home as HomeIcon, Calendar, Filter, Clock, 
  X, Percent, AlertCircle, CheckCircle2, Loader2, CalendarPlus 
} from 'lucide-react';
import { DAYS_OF_WEEK, TIME_OPTIONS } from './constants';
import { formatFullDateText } from './helpers';

type Props = {
  language: string;
  fsmStartDate: string;
  setFsmStartDate: (val: string) => void;
  fsmEndDate: string;
  setFsmEndDate: (val: string) => void;
  selectedDaysOfWeek: number[];
  toggleDayOfWeek: (dayId: number) => void;
  fsmExcludedDates: string[];
  setFsmExcludedDates: (dates: string[]) => void;
  fsmStart: string;
  setFsmStart: (val: string) => void;
  fsmEnd: string;
  setFsmEnd: (val: string) => void;
  fsmDiscount: string;
  setFsmDiscount: (val: string) => void;
  loadingFsm: boolean;
  fsmSuccess: string;
  fsmError: string;
  generatedTargetDates: string[];
  onOpenAfterWorkModal: () => void;
  onApplyPresetHomeOffice: () => void;
  onApplyPresetThisWeek: () => void;
  onApplyPresetThisMonth: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export const FsmGeneratorForm: React.FC<Props> = ({
  language,
  fsmStartDate,
  setFsmStartDate,
  fsmEndDate,
  setFsmEndDate,
  selectedDaysOfWeek,
  toggleDayOfWeek,
  fsmExcludedDates,
  setFsmExcludedDates,
  fsmStart,
  setFsmStart,
  fsmEnd,
  setFsmEnd,
  fsmDiscount,
  setFsmDiscount,
  loadingFsm,
  fsmSuccess,
  fsmError,
  generatedTargetDates,
  onOpenAfterWorkModal,
  onApplyPresetHomeOffice,
  onApplyPresetThisWeek,
  onApplyPresetThisMonth,
  onSubmit,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Wand2 size={20} />
        </div>
        <div>
          <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
            {language === 'sk' ? 'A: Generátor voľných termínov (Obdobie Od–Do + Výnimky)' : 'A: Smart Multi-Day Slot Generator'}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {language === 'sk' ? 'Nastavte rozsah dní, zaškrtnite pracovné dni a zvoľte výnimky' : 'Set date range, toggle days of week and manage exceptions'}
          </p>
        </div>
      </div>

      {/* RÝCHLE PREDVOĽBY */}
      <div className="space-y-1.5 bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
        <label className="block text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
          {language === 'sk' ? '⚡ Rýchle predvoľby pravidiel:' : '⚡ Quick presets:'}
        </label>
        <div className="flex flex-wrap gap-2 pt-0.5">
          <button
            type="button"
            onClick={onOpenAfterWorkModal}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-600 hover:text-white transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Briefcase size={14} />
            <span>{language === 'sk' ? 'Dnes po práci' : 'Today after work'}</span>
          </button>

          <button
            type="button"
            onClick={onApplyPresetHomeOffice}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-600 hover:text-white transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <HomeIcon size={14} />
            <span>{language === 'sk' ? 'Mám HO (08:00–15:00)' : 'Home Office (08:00–15:00)'}</span>
          </button>

          <button
            type="button"
            onClick={onApplyPresetThisWeek}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            📅 {language === 'sk' ? 'Tento týždeň' : 'This week'}
          </button>

          <button
            type="button"
            onClick={onApplyPresetThisMonth}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            📅 {language === 'sk' ? 'Tento mesiac' : 'This month'}
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-500" />
              <span>{language === 'sk' ? 'Od dátumu:' : 'Start date:'}</span>
            </label>
            <input
              type="date"
              required
              value={fsmStartDate}
              onChange={(e) => setFsmStartDate(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-500" />
              <span>{language === 'sk' ? 'Do dátumu:' : 'End date:'}</span>
            </label>
            <input
              type="date"
              required
              value={fsmEndDate}
              onChange={(e) => setFsmEndDate(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold"
            />
          </div>
        </div>

        {/* DNI V TÝŽDNI */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Filter size={14} className="text-indigo-500" />
            <span>{language === 'sk' ? 'Dni v týždni, kedy sa majú sloty otvoriť:' : 'Active days of week:'}</span>
          </label>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {DAYS_OF_WEEK.map((d) => {
              const isChecked = selectedDaysOfWeek.includes(d.id);
              return (
                <button
                  type="button"
                  key={`day-${d.id}`}
                  onClick={() => toggleDayOfWeek(d.id)}
                  className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                    isChecked
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {language === 'sk' ? d.sk : d.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* ČASOVÝ INTERVAL */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2">
            <Clock size={14} className="text-indigo-500" />
            <span>{language === 'sk' ? 'Časový interval voľného bloku (24h):' : 'Slot time range (24h):'}</span>
          </label>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <select
                value={fsmStart}
                onChange={(e) => setFsmStart(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-extrabold focus:outline-none"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={`start-${time}`} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <span className="font-extrabold text-slate-400 text-sm">–</span>

            <div className="flex-1">
              <select
                value={fsmEnd}
                onChange={(e) => setFsmEnd(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-extrabold focus:outline-none"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={`end-${time}`} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* VYGENEROVANÉ DNI */}
        {generatedTargetDates.length > 0 && (
          <div className="space-y-1.5 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
              <span>{language === 'sk' ? `Vygenerované dni (${generatedTargetDates.length}):` : `Generated days (${generatedTargetDates.length}):`}</span>
              <span className="text-[10px] text-slate-400 font-normal">{language === 'sk' ? 'Kliknite na X pre výnimku' : 'Click X for exception'}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
              {generatedTargetDates.map((d) => (
                <span
                  key={`gen-${d}`}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                >
                  <span>{formatFullDateText(d, language)}</span>
                  <button
                    type="button"
                    onClick={() => setFsmExcludedDates([...fsmExcludedDates, d])}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5 rounded-full"
                    title={language === 'sk' ? 'Pridať ako výnimku' : 'Exclude date'}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ZĽAVY */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Percent size={14} className="text-sky-500" />
            <span>{language === 'sk' ? 'Akcia / Zľava na blok (%):' : 'Discount on slots (%):'}</span>
          </label>

          <div className="flex flex-wrap items-center gap-1.5">
            {['0', '10', '15', '20', '25', '30', '35', '40', '45', '50', '100'].map((p) => (
              <button
                key={`disc-${p}`}
                type="button"
                onClick={() => setFsmDiscount(p)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                  fsmDiscount === p
                    ? 'bg-sky-600 border-sky-600 text-white shadow-sm scale-105'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {p === '0' ? (language === 'sk' ? 'Bez zľavy (0%)' : '0%') : `-${p}%`}
              </button>
            ))}

            <input
              type="number"
              min="0"
              max="100"
              value={fsmDiscount}
              onChange={(e) => setFsmDiscount(e.target.value)}
              className="w-16 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold text-center"
              placeholder="%"
            />
          </div>
        </div>

        {fsmError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{fsmError}</span>
          </div>
        )}

        {fsmSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{fsmSuccess}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loadingFsm || generatedTargetDates.length === 0}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loadingFsm ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
          <span>
            {language === 'sk'
              ? `Otvoriť termíny pre (${generatedTargetDates.length}) dní`
              : `Open Slots for (${generatedTargetDates.length}) days`}
          </span>
        </button>
      </form>
    </div>
  );
};