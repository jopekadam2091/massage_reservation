'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Sparkles, Cake } from 'lucide-react';

type Props = {
  value?: string | null;
  onChange: (dateIso: string) => void;
  disabled?: boolean;
  language: string;
};

const MONTHS_SK = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 
  'Júl', 'August', 'September', 'Október', 'November', 'December'
];

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ModernBirthdayPicker({ value, onChange, disabled, language }: Props) {
  const [day, setDay] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');

  useEffect(() => {
    if (value && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
      }
    }
  }, [value]);

  // Generate Days array (1 - 31)
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  
  // Generate Years array (from current year down to 1930)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1930 + 1 }, (_, i) => String(currentYear - i));

  const monthsList = language === 'sk' ? MONTHS_SK : MONTHS_EN;

  const handleSelect = (newDay: string, newMonth: string, newYear: string) => {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);

    if (newDay && newMonth && newYear) {
      const iso = `${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`;
      onChange(iso);
    }
  };

  const getMonthLabel = (mVal: string) => {
    const idx = parseInt(mVal, 10) - 1;
    if (idx >= 0 && idx < monthsList.length) {
      return monthsList[idx];
    }
    return '';
  };

  return (
    <div className="space-y-3 font-sans text-left">
      {/* 🚀 Segmented Custom Date Selectors */}
      <div className="grid grid-cols-3 gap-2">
        
        {/* DAY SELECTOR */}
        <div className="relative group">
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            {language === 'sk' ? 'Deň' : 'Day'}
          </label>
          <div className="relative">
            <select
              disabled={disabled}
              value={day}
              onChange={(e) => handleSelect(e.target.value, month, year)}
              className="w-full appearance-none px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 text-xs font-black focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer shadow-xs pr-8"
            >
              <option value="" disabled>--</option>
              {days.map((d) => (
                <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* MONTH SELECTOR */}
        <div className="relative group">
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            {language === 'sk' ? 'Mesiac' : 'Month'}
          </label>
          <div className="relative">
            <select
              disabled={disabled}
              value={month}
              onChange={(e) => handleSelect(day, e.target.value, year)}
              className="w-full appearance-none px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 text-xs font-black focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer shadow-xs pr-8 truncate"
            >
              <option value="" disabled>--</option>
              {monthsList.map((mName, idx) => {
                const mVal = String(idx + 1).padStart(2, '0');
                return (
                  <option key={mVal} value={mVal} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    {mName}
                  </option>
                );
              })}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* YEAR SELECTOR */}
        <div className="relative group">
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            {language === 'sk' ? 'Rok' : 'Year'}
          </label>
          <div className="relative">
            <select
              disabled={disabled}
              value={year}
              onChange={(e) => handleSelect(day, month, e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 text-xs font-black focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer shadow-xs pr-8"
            >
              <option value="" disabled>----</option>
              {years.map((y) => (
                <option key={y} value={y} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* Selected Date Preview Tag */}
      {day && month && year && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/50 text-pink-700 dark:text-pink-300 text-xs font-extrabold animate-in fade-in duration-200 shadow-xs">
          <Cake size={15} className="text-pink-500 shrink-0" />
          <span>
            {language === 'sk' ? 'Vaše narodeniny:' : 'Your birthday:'} <strong>{day}. {getMonthLabel(month)} {year}</strong>
          </span>
          <Sparkles size={14} className="text-amber-400 ml-auto shrink-0 animate-pulse" />
        </div>
      )}
    </div>
  );
}
