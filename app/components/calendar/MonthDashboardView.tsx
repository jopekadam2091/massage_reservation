'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, Clock } from 'lucide-react';
import { getDateKey } from '@/app/utils/calendar';
import { ScheduleEvent } from './ReservationBlock';

type Props = {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  eventsByDate: Record<string, ScheduleEvent[]>;
  selectedDateKey: string | null;
  onSelectDay: (dateKey: string) => void;
  language: string;
};

export default function MonthDashboardView({
  currentDate,
  setCurrentDate,
  eventsByDate,
  selectedDateKey,
  onSelectDay,
  language,
}: Props) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonthCount = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const emptyCells = Array.from({ length: firstDayIndex }, (_, i) => i);

  const monthNamesSK = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
  const monthNamesEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthTitle = language === 'sk' ? monthNamesSK[currentMonth] : monthNamesEN[currentMonth];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Calculate monthly stats for dashboard header
  const totalEventsInMonth = daysArray.reduce((acc, day) => {
    const key = getDateKey(currentYear, currentMonth, day);
    return acc + (eventsByDate[key]?.length || 0);
  }, 0);

  return (
    <div className="bg-white dark:bg-[#121824]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] font-sans text-left">
      
      {/* Month Navigation & Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
              <CalendarIcon size={18} />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {monthTitle} {currentYear}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {language === 'sk'
              ? `Mesačný prehľad · Spolu ${totalEventsInMonth} naplánovaných položiek`
              : `Monthly Dashboard · Total ${totalEventsInMonth} scheduled items`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition active:scale-95 cursor-pointer shadow-xs"
            title={language === 'sk' ? 'Predchádzajúci mesiac' : 'Previous month'}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-extrabold text-xs border border-slate-200 dark:border-white/10 transition active:scale-95 cursor-pointer shadow-xs"
          >
            {language === 'sk' ? 'Dnes' : 'Today'}
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition active:scale-95 cursor-pointer shadow-xs"
            title={language === 'sk' ? 'Nasledujúci mesiac' : 'Next month'}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">
        <div>{language === 'sk' ? 'PO' : 'MO'}</div>
        <div>{language === 'sk' ? 'UT' : 'TU'}</div>
        <div>{language === 'sk' ? 'ST' : 'WE'}</div>
        <div>{language === 'sk' ? 'ŠT' : 'TH'}</div>
        <div>{language === 'sk' ? 'PI' : 'FR'}</div>
        <div>{language === 'sk' ? 'SO' : 'SA'}</div>
        <div>{language === 'sk' ? 'NE' : 'SU'}</div>
      </div>

      {/* Month Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {emptyCells.map((_, idx) => (
          <div key={`empty-${idx}`} className="min-h-[76px] sm:min-h-[90px] rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-white/5 opacity-40"></div>
        ))}

        {daysArray.map((day) => {
          const dateKey = getDateKey(currentYear, currentMonth, day);
          const dayEvents = eventsByDate[dateKey] || [];
          const isSelected = selectedDateKey === dateKey;

          const todayObj = new Date();
          const isToday =
            todayObj.getFullYear() === currentYear &&
            todayObj.getMonth() === currentMonth &&
            todayObj.getDate() === day;

          // Categorize activity dots for procedures
          const vipCount = dayEvents.filter(e => (e.summary + (e.type || '')).toUpperCase().includes('VIP')).length;
          const classicCount = dayEvents.filter(e => !(e.summary + (e.type || '')).toUpperCase().includes('VIP') && !e.isFsm).length;
          const fsmCount = dayEvents.filter(e => e.isFsm).length;
          const hasConflicts = dayEvents.some(e => e.hasConflict);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDay(dateKey)}
              className={`group relative min-h-[76px] sm:min-h-[90px] p-2.5 rounded-2xl border text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-500 shadow-md'
                  : isToday
                  ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-300 dark:border-indigo-500/60'
                  : 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-white/10 shadow-xs'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span className={`text-xs sm:text-sm font-black tracking-tight ${
                  isToday ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : isSelected ? 'text-amber-700 dark:text-amber-300 font-black' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {day}
                </span>

                {hasConflicts && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Kolízia časov"></span>
                )}
              </div>

              {/* Procedure Activity Dot Indicators */}
              <div className="space-y-1 my-1">
                {dayEvents.length > 0 ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {/* Dots representing booked procedure types */}
                    {Array.from({ length: Math.min(vipCount, 3) }).map((_, i) => (
                      <span key={`vip-${i}`} className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 shadow-xs" title="VIP Supreme"></span>
                    ))}
                    {Array.from({ length: Math.min(classicCount, 4) }).map((_, i) => (
                      <span key={`classic-${i}`} className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-xs" title="Klasik"></span>
                    ))}
                    {Array.from({ length: Math.min(fsmCount, 3) }).map((_, i) => (
                      <span key={`fsm-${i}`} className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 shadow-xs" title="FSM Voľno"></span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 dark:text-slate-600 font-medium hidden sm:block">Voľno</span>
                )}
              </div>

              {/* Count Summary Badge */}
              {dayEvents.length > 0 && (
                <div className="mt-auto">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-white/20'
                  }`}>
                    {dayEvents.length} {language === 'sk' ? 'akcií' : 'events'}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
