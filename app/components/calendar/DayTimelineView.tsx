'use client';

import React, { useState } from 'react';
import { ChevronLeft, Clock, Calendar, AlertTriangle, Plus, Sparkles } from 'lucide-react';
import ReservationBlock, { ScheduleEvent } from './ReservationBlock';
import ConflictAlertBanner, { ConflictItem } from './ConflictAlertBanner';

type Props = {
  selectedDateKey: string;
  events: ScheduleEvent[];
  onBackToMonth: () => void;
  onRescheduleEvent: (event: ScheduleEvent, newStartIso: string, newEndIso: string) => Promise<void>;
  onSelectEvent?: (event: ScheduleEvent) => void;
  onAddDirectBooking?: (dateKey: string, time: string) => void;
  language: string;
};

// Generate 08:00 to 21:00 hourly timeline slots
const HOURLY_TIMELINE_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const h = 8 + i;
  return `${h.toString().padStart(2, '0')}:00`;
});

export default function DayTimelineView({
  selectedDateKey,
  events,
  onBackToMonth,
  onRescheduleEvent,
  onSelectEvent,
  onAddDirectBooking,
  language,
}: Props) {
  const [draggedEvent, setDraggedEvent] = useState<ScheduleEvent | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Format date text (e.g., 12. August 2026)
  const formatDateTitle = (key: string) => {
    const parts = key.split('-');
    if (parts.length !== 3) return key;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const monthSK = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
    const monthEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const mName = language === 'sk' ? monthSK[monthIdx] : monthEN[monthIdx];
    return `${day}. ${mName} ${year}`;
  };

  // Detect conflicts between overlapping events
  const detectConflicts = (evList: ScheduleEvent[]): { conflicts: ConflictItem[]; ConflictMap: Record<string, boolean> } => {
    const conflicts: ConflictItem[] = [];
    const ConflictMap: Record<string, boolean> = {};

    for (let i = 0; i < evList.length; i++) {
      for (let j = i + 1; j < evList.length; j++) {
        const a = evList[i];
        const b = evList[j];

        const aStart = new Date(a.start).getTime();
        const aEnd = new Date(a.end).getTime();
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();

        // Check time overlap
        if (aStart < bEnd && aEnd > bStart) {
          ConflictMap[a.id] = true;
          ConflictMap[b.id] = true;

          const timeStrA = `${new Date(a.start).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })} - ${new Date(a.end).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}`;
          const timeStrB = `${new Date(b.start).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.end).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}`;

          conflicts.push({
            id1: a.id,
            id2: b.id,
            title1: a.clientName || a.summary,
            title2: b.clientName || b.summary,
            timeRange1: timeStrA,
            timeRange2: timeStrB,
          });
        }
      }
    }

    return { conflicts, ConflictMap };
  };

  const { conflicts, ConflictMap } = detectConflicts(events);

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, event: ScheduleEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot !== timeSlot) {
      setDragOverSlot(timeSlot);
    }
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, targetTimeSlot: string) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (!draggedEvent) return;

    const [targetHour, targetMin] = targetTimeSlot.split(':').map(Number);
    const dateParts = selectedDateKey.split('-').map(Number);

    const newStartDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], targetHour, targetMin, 0);

    const oldDurationMs = new Date(draggedEvent.end).getTime() - new Date(draggedEvent.start).getTime();
    const newEndDate = new Date(newStartDate.getTime() + (oldDurationMs > 0 ? oldDurationMs : 60 * 60000));

    try {
      setIsRescheduling(true);
      await onRescheduleEvent(draggedEvent, newStartDate.toISOString(), newEndDate.toISOString());
    } catch (err) {
      console.error('Chyba pri Drag & Drop preplánovaní:', err);
    } finally {
      setIsRescheduling(false);
      setDraggedEvent(null);
    }
  };

  // Group events by hourly slot
  const getEventsForHour = (hourSlot: string) => {
    const slotHour = parseInt(hourSlot.split(':')[0], 10);

    return events.filter((ev) => {
      const evStart = new Date(ev.start);
      return evStart.getHours() === slotHour;
    }).map((ev) => ({
      ...ev,
      hasConflict: !!ConflictMap[ev.id],
    }));
  };

  return (
    <div className="bg-white dark:bg-[#121824]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] font-sans text-left space-y-5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMonth}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-bold shadow-xs"
          >
            <ChevronLeft size={18} />
            <span>{language === 'sk' ? 'Späť na kalendár' : 'Back to month'}</span>
          </button>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Calendar size={18} className="text-amber-500 dark:text-amber-400" />
              {formatDateTitle(selectedDateKey)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {language === 'sk'
                ? `Časová os maséra · Drag & Drop preplánovanie · ${events.length} akcií`
                : `Therapist timeline · Drag & Drop reschedule · ${events.length} events`}
            </p>
          </div>
        </div>

        {onAddDirectBooking && (
          <button
            type="button"
            onClick={() => onAddDirectBooking(selectedDateKey, '10:00')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-xs transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-center"
          >
            <Plus size={16} />
            <span>{language === 'sk' ? 'Pridať masáž na tento deň' : 'Add booking for day'}</span>
          </button>
        )}
      </div>

      {/* Non-blocking Conflict Alert Banner */}
      <ConflictAlertBanner conflicts={conflicts} language={language} />

      {/* Hourly Timeline Grid */}
      <div className="relative space-y-2 pt-2">
        {HOURLY_TIMELINE_SLOTS.map((slot) => {
          const slotEvents = getEventsForHour(slot);
          const isTargetDrop = dragOverSlot === slot;

          return (
            <div
              key={slot}
              onDragOver={(e) => handleDragOver(e, slot)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, slot)}
              className={`flex items-start gap-3 p-3 rounded-2xl border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isTargetDrop
                  ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 shadow-lg scale-[1.01]'
                  : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
              }`}
            >
              {/* Hour Label Column */}
              <div className="w-16 shrink-0 text-left pt-1">
                <span className="text-xs font-black tracking-tight text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock size={12} className="text-amber-500 dark:text-amber-500/70" />
                  {slot}
                </span>
              </div>

              {/* Slot Target Area / Events Column */}
              <div className="flex-1 min-w-0 space-y-2">
                {slotEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {slotEvents.map((ev) => (
                      <ReservationBlock
                        key={ev.id}
                        event={ev}
                        isDraggable={true}
                        onDragStart={handleDragStart}
                        onClick={onSelectEvent}
                        language={language}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => onAddDirectBooking && onAddDirectBooking(selectedDateKey, slot)}
                    className="h-10 rounded-xl border border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500/50 hover:bg-slate-100/50 dark:hover:bg-white/5 transition flex items-center justify-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                  >
                    + {language === 'sk' ? `Voľno o ${slot} (Kliknite pre novú masáž)` : `Available at ${slot} (Click to book)`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
