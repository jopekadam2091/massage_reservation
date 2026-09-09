'use client';

import React, { useState, useEffect, useMemo } from 'react';
import MonthDashboardView from './MonthDashboardView';
import DayTimelineView from './DayTimelineView';
import { ScheduleEvent } from './ReservationBlock';
import { getDateKey } from '@/app/utils/calendar';
import { Calendar, Clock, LayoutGrid, ListFilter, RotateCw, CheckCircle2 } from 'lucide-react';

type Props = {
  language: string;
  initialEvents?: any[];
  onRefresh?: () => void;
  onAddDirectBooking?: (dateKey: string, time: string) => void;
  onSelectEvent?: (event: ScheduleEvent) => void;
};

export default function MassageScheduler({
  language,
  initialEvents,
  onRefresh,
  onAddDirectBooking,
  onSelectEvent,
}: Props) {
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const [rawEvents, setRawEvents] = useState<any[]>(initialEvents || []);
  const [loading, setLoading] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Sync initialEvents prop if provided
  useEffect(() => {
    if (initialEvents) {
      setRawEvents(initialEvents);
    }
  }, [initialEvents]);

  // Fetch appointments if initialEvents not provided
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (res.ok && data.events) {
        setRawEvents(data.events);
      }
    } catch (err) {
      console.error('Chyba načítania rezervácií:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialEvents) {
      fetchEvents();
    }
  }, []);

  // Parse raw Google Calendar events into formatted ScheduleEvent list
  const eventsByDate = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = {};

    rawEvents.forEach((ev) => {
      const startStr = ev.start?.dateTime || ev.start?.date || ev.start;
      const endStr = ev.end?.dateTime || ev.end?.date || ev.end;

      if (!startStr) return;

      const startDate = new Date(startStr);
      const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 60 * 60000);

      const dKey = getDateKey(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

      const summary = ev.summary || 'Masáž';
      const desc = ev.description || '';

      const isFsm = /fsm/i.test(summary);

      // Parse client details from description if present
      const nameMatch = desc.match(/Meno:\s*([^\n]+)/i);
      const phoneMatch = desc.match(/Tel:\s*([^\n]+)/i);
      const priceMatch = desc.match(/Finálna cena:\s*([^\n]+)/i);

      const clientName = nameMatch ? nameMatch[1].trim() : summary.replace(/^REZERVÁCIA:\s*/i, '').split('-')[0]?.trim();
      const clientPhone = phoneMatch ? phoneMatch[1].trim() : undefined;
      const price = priceMatch ? priceMatch[1].trim() : undefined;

      // Determine Procedure Type
      let type = 'Klasik';
      const upper = (summary + ' ' + desc).toUpperCase();
      if (isFsm) type = 'FSM';
      else if (upper.includes('VIP') || upper.includes('SUPREME')) type = 'VIP';
      else if (upper.includes('AROMA')) type = 'Aromaterapia';
      else if (upper.includes('ŠPORT') || upper.includes('DEEP')) type = 'Športová';

      const parsedEv: ScheduleEvent = {
        id: ev.id || Math.random().toString(),
        summary,
        description: desc,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        isFsm,
        type,
        durationMinutes: Math.round((endDate.getTime() - startDate.getTime()) / 60000),
        clientName,
        clientPhone,
        price,
      };

      if (!map[dKey]) map[dKey] = [];
      map[dKey].push(parsedEv);
    });

    return map;
  }, [rawEvents]);

  // Handle Drag & Drop rescheduling API call with optimistic update
  const handleRescheduleEvent = async (
    event: ScheduleEvent,
    newStartIso: string,
    newEndIso: string
  ) => {
    // Optimistic state update
    setRawEvents((prev) =>
      prev.map((item) => {
        if (item.id === event.id) {
          return {
            ...item,
            start: { dateTime: newStartIso },
            end: { dateTime: newEndIso },
          };
        }
        return item;
      })
    );

    try {
      const res = await fetch('/api/admin/reschedule-appointment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          newStartIso,
          newEndIso,
        }),
      });

      if (res.ok) {
        showToast(
          language === 'sk'
            ? `Rezervácia presunutá na ${new Date(newStartIso).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}`
            : `Appointment moved to ${new Date(newStartIso).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}`
        );
        if (onRefresh) onRefresh();
      } else {
        alert(language === 'sk' ? 'Nepodarilo sa uložiť presun v kalendári.' : 'Failed to update schedule in Google Calendar.');
        fetchEvents();
      }
    } catch {
      alert(language === 'sk' ? 'Chyba pripojenia.' : 'Connection error.');
      fetchEvents();
    }
  };

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleSelectDay = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setViewMode('day');
  };

  return (
    <div className="w-full space-y-4 text-left font-sans">
      
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={16} />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Floating Segmented Pill Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 rounded-2xl bg-white/80 dark:bg-[#121824]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg">
        
        {/* View Mode Toggle Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] cursor-pointer ${
              viewMode === 'month'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid size={15} />
            <span>{language === 'sk' ? 'Mesačný Dashboard' : 'Month Dashboard'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!selectedDateKey) {
                const nowKey = getDateKey(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                setSelectedDateKey(nowKey);
              }
              setViewMode('day');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] cursor-pointer ${
              viewMode === 'day'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock size={15} />
            <span>{language === 'sk' ? 'Denný Detail & Časová Os' : 'Daily Timeline'}</span>
          </button>
        </div>

        {/* Refresh Action */}
        <button
          type="button"
          onClick={() => {
            if (onRefresh) onRefresh();
            fetchEvents();
          }}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-white/10 transition active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
        >
          <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{language === 'sk' ? 'Obnoviť kalendár' : 'Refresh'}</span>
        </button>
      </div>

      {/* Main View Area */}
      {viewMode === 'month' ? (
        <MonthDashboardView
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          eventsByDate={eventsByDate}
          selectedDateKey={selectedDateKey}
          onSelectDay={handleSelectDay}
          language={language}
        />
      ) : (
        <DayTimelineView
          selectedDateKey={selectedDateKey || getDateKey(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())}
          events={eventsByDate[selectedDateKey || getDateKey(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())] || []}
          onBackToMonth={() => setViewMode('month')}
          onRescheduleEvent={handleRescheduleEvent}
          onSelectEvent={onSelectEvent}
          onAddDirectBooking={onAddDirectBooking}
          language={language}
        />
      )}
    </div>
  );
}
