'use client';

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader2, Trash2, Plus, UserPlus } from 'lucide-react';
import { MONTH_NAMES } from './constants';
import { formatFullDateText, format24hTimeText } from './helpers';

type Props = {
  language: string;
  calCurrentDate: Date;
  setCalCurrentDate: (d: Date) => void;
  loadingCalEvents: boolean;
  eventsByDateKey: Record<string, { fsm: any[]; bookings: any[] }>;
  selectedCalDayKey: string | null;
  setSelectedCalDayKey: (key: string | null) => void;
  onDeleteFsmSlot: (eventId: string) => void;
  onOpenFsmForDay: (dayKey: string) => void;
  onOpenDirectForDay: (dayKey: string) => void;
};

export const CalendarView: React.FC<Props> = ({
  language,
  calCurrentDate,
  setCalCurrentDate,
  loadingCalEvents,
  eventsByDateKey,
  selectedCalDayKey,
  setSelectedCalDayKey,
  onDeleteFsmSlot,
  onOpenFsmForDay,
  onOpenDirectForDay,
}) => {
  const calYear = calCurrentDate.getFullYear();
  const calMonth = calCurrentDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDayIdx = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const emptyCells = Array.from({ length: firstDayIdx }, (_, i) => i);

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
              {language === 'sk' ? 'Vizuálny prehľad kalendára' : 'Visual Calendar Overview'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {language === 'sk' ? 'Kliknite na deň pre správy termínov alebo vymazanie voľných slotov' : 'Click a day to manage slots or delete open blocks'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCalCurrentDate(new Date(calYear, calMonth - 1, 1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-black text-slate-800 dark:text-slate-100 min-w-[110px] text-center">
            {language === 'sk' ? MONTH_NAMES.sk[calMonth] : MONTH_NAMES.en[calMonth]} {calYear}
          </span>
          <button
            type="button"
            onClick={() => setCalCurrentDate(new Date(calYear, calMonth + 1, 1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>{language === 'sk' ? 'Rezervácia klienta' : 'Client Booking'}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>{language === 'sk' ? 'Otvorený FSM voľný čas' : 'Open FSM Slot'}</span>
        </span>
      </div>

      {loadingCalEvents ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 size={24} className="animate-spin text-emerald-600" />
          <p className="text-xs">{language === 'sk' ? 'Načítavam kalendár...' : 'Loading calendar...'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {['PO', 'UT', 'ST', 'ŠT', 'PI', 'SO', 'NE'].map((d) => (
              <div key={d} className="text-center text-[11px] font-black text-slate-400 py-1">
                {d}
              </div>
            ))}

            {emptyCells.map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}

            {daysArray.map((day) => {
              const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventsByDateKey[dateKey] || { fsm: [], bookings: [] };
              const isSelected = selectedCalDayKey === dateKey;

              const hasFsm = dayEvents.fsm.length > 0;
              const hasBookings = dayEvents.bookings.length > 0;

              return (
                <button
                  type="button"
                  key={dateKey}
                  onClick={() => setSelectedCalDayKey(dateKey)}
                  className={`relative min-h-[64px] p-2 rounded-2xl border text-left flex flex-col justify-between transition active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">{day}</span>

                  <div className="flex flex-col gap-1 mt-1">
                    {hasBookings && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-extrabold truncate">
                        {dayEvents.bookings.length}× {language === 'sk' ? 'Masáž' : 'Booking'}
                      </span>
                    )}

                    {hasFsm && (
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-extrabold truncate">
                        {language === 'sk' ? 'Voľno' : 'Open'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* DETAIL DŇA */}
          {selectedCalDayKey && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-500" />
                  <span>Rozpis na: {formatFullDateText(selectedCalDayKey, language)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCalDayKey(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {(() => {
                  const dayEvents = eventsByDateKey[selectedCalDayKey] || { fsm: [], bookings: [] };
                  const allDayEvs = [...dayEvents.bookings, ...dayEvents.fsm];

                  if (allDayEvs.length === 0) {
                    return <p className="text-slate-400 text-xs italic py-2">Žiadne udalosti v kalendári pre tento deň.</p>;
                  }

                  return allDayEvs.map((ev) => {
                    const isFsm = (ev.summary || '').toUpperCase().includes('FSM');
                    return (
                      <div
                        key={ev.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          isFsm
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{ev.summary}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 shadow-sm">
                            {format24hTimeText(ev.start?.dateTime)} - {format24hTimeText(ev.end?.dateTime)}
                          </span>

                          {isFsm && (
                            <button
                              type="button"
                              onClick={() => onDeleteFsmSlot(ev.id)}
                              className="p-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 transition cursor-pointer"
                              title={language === 'sk' ? 'Vymazať tento voľný FSM blok' : 'Delete open slot'}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => onOpenFsmForDay(selectedCalDayKey)}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{language === 'sk' ? 'Otvoriť FSM slot na tento deň' : 'Open FSM slot for this day'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenDirectForDay(selectedCalDayKey)}
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <UserPlus size={14} />
                  <span>{language === 'sk' ? 'Priama rezervácia na tento deň' : 'Direct Booking for this day'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};