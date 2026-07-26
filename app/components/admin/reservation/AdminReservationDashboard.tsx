'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/app/lib/supabase';
import { CalendarPlus, UserPlus, Calendar } from 'lucide-react';

import { DashboardProps, Client, CalendarEvent } from './types';
import { AfterWorkModal } from './AfterWorkModal';
import { FsmGeneratorForm } from './FsmGeneratorForm';
import { DirectBookingForm } from './DirectBookingForm';
import { CalendarView } from './CalendarView';

export default function AdminReservationDashboard({ language }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'actions' | 'calendar'>('actions');
  const [actionSubTab, setActionSubTab] = useState<'fsm' | 'direct'>('fsm');

  // 1. Stavy pre FSM GENERÁTOR
  const [fsmStartDate, setFsmStartDate] = useState('');
  const [fsmEndDate, setFsmEndDate] = useState('');
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([1, 2, 3, 4]); // PO - ŠT
  const [fsmExcludedDates, setFsmExcludedDates] = useState<string[]>([]);
  
  const [fsmStart, setFsmStart] = useState('17:00');
  const [fsmEnd, setFsmEnd] = useState('20:00');
  const [fsmDiscount, setFsmDiscount] = useState('0');
  const [loadingFsm, setLoadingFsm] = useState(false);
  const [fsmSuccess, setFsmSuccess] = useState('');
  const [fsmError, setFsmError] = useState('');

  // Okno pre "Dnes po práci"
  const [showAfterWorkModal, setShowAfterWorkModal] = useState(false);

  // 2. Stavy pre Priamu rezerváciu klienta
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [directName, setDirectName] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [directDate, setDirectDate] = useState('');
  const [directTime, setDirectTime] = useState('10:00');
  const [directType, setDirectType] = useState('CLASSIC');
  const [directDuration, setDirectDuration] = useState(60);
  const [directPrice, setDirectPrice] = useState('45');
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [directSuccess, setDirectSuccess] = useState('');
  const [directError, setDirectError] = useState('');

  // 3. Stavy pre Grafický kalendár
  const [calCurrentDate, setCalCurrentDate] = useState<Date>(new Date());
  const [allCalendarEvents, setAllCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loadingCalEvents, setLoadingCalEvents] = useState(false);
  const [selectedCalDayKey, setSelectedCalDayKey] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const endOfMonthIso = endOfMonth.toISOString().split('T')[0];

    setFsmStartDate(todayIso);
    setFsmEndDate(endOfMonthIso);
    setDirectDate(todayIso);

    const loadClients = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
      if (data) setClients(data as Client[]);
    };
    loadClients();
    fetchCalendarOverview();
  }, []);

  const fetchCalendarOverview = async () => {
    setLoadingCalEvents(true);
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (res.ok && data.events) {
        setAllCalendarEvents(data.events);
      }
    } catch (err) {
      console.error('Chyba pri načítavaní kalendára:', err);
    } fontally {
      setLoadingCalEvents(false);
    }
  };

  // GENERÁTOR DÁTUMOV Z OBDOBIA
  const generatedTargetDates = useMemo(() => {
    if (!fsmStartDate || !fsmEndDate) return [];

    const result: string[] = [];
    const cur = new Date(fsmStartDate + 'T00:00:00');
    const end = new Date(fsmEndDate + 'T00:00:00');

    if (cur > end) return [];

    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;

      if (selectedDaysOfWeek.includes(dayOfWeek) && !fsmExcludedDates.includes(dateStr)) {
        result.push(dateStr);
      }

      cur.setDate(cur.getDate() + 1);
    }

    return result;
  }, [fsmStartDate, fsmEndDate, selectedDaysOfWeek, fsmExcludedDates]);

  const toggleDayOfWeek = (dayId: number) => {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const applyPresetTodayAfterWorkConfirm = (startTime: string) => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    
    setFsmStartDate(todayIso);
    setFsmEndDate(todayIso);
    setFsmStart(startTime);
    setFsmEnd('20:00');
    setSelectedDaysOfWeek([today.getDay()]);
    setFsmExcludedDates([]);
    setShowAfterWorkModal(false);
  };

  const applyPresetHomeOffice = () => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    setFsmStartDate(todayIso);
    setFsmEndDate(todayIso);
    setFsmStart('08:00');
    setFsmEnd('15:00');
    setSelectedDaysOfWeek([today.getDay()]);
    setFsmExcludedDates([]);
  };

  const applyPresetThisWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMon = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const monday = new Date(today.setDate(diffToMon));
    const sunday = new Date(today.setDate(monday.getDate() + 6));

    setFsmStartDate(monday.toISOString().split('T')[0]);
    setFsmEndDate(sunday.toISOString().split('T')[0]);
    setSelectedDaysOfWeek([1, 2, 3, 4, 5]);
  };

  const applyPresetThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFsmStartDate(firstDay.toISOString().split('T')[0]);
    setFsmEndDate(lastDay.toISOString().split('T')[0]);
    setSelectedDaysOfWeek([1, 2, 3, 4, 5]);
  };

  const handleCreateFsm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generatedTargetDates.length === 0) {
      setFsmError(language === 'sk' ? 'Vyberte obdobie a aspoň jeden platný deň' : 'Select a date range and at least one valid day');
      return;
    }

    setLoadingFsm(true);
    setFsmSuccess('');
    setFsmError('');

    try {
      const res = await fetch('/api/admin/create-fsm-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: generatedTargetDates,
          startTime: fsmStart,
          endTime: fsmEnd,
          discountPercent: fsmDiscount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFsmSuccess(
          language === 'sk' 
            ? `Voľné FSM bloky pre (${generatedTargetDates.length}) dní boli úspešne vytvorené!` 
            : `Free FSM slots for (${generatedTargetDates.length}) days opened!`
        );
        fetchCalendarOverview();
        setTimeout(() => setFsmSuccess(''), 4000);
      } else {
        setFsmError(data.error || 'Chyba pri vytváraní termínov.');
      }
    } catch {
      setFsmError('Nepodarilo sa spojiť so serverom.');
    } finally {
      setLoadingFsm(false);
    }
  };

  const handleCreateDirectBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingDirect(true);
    setDirectSuccess('');
    setDirectError('');

    const generatedRef = 'RES-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const slotIso = new Date(`${directDate}T${directTime}:00`).toISOString();

    const payload = {
      name: directName,
      email: directEmail,
      phone: directPhone,
      slot: slotIso,
      duration: directDuration,
      type: directType,
      basePrice: parseInt(directPrice, 10) || 45,
      finalPrice: parseInt(directPrice, 10) || 45,
      customerNote: `Priama rezervácia vytvorená Adminom | Číslo: #${generatedRef}`,
      bookingRef: generatedRef,
    };

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDirectSuccess(language === 'sk' ? `Rezervácia #${generatedRef} bola vytvorená!` : `Booking #${generatedRef} created!`);
        setDirectName('');
        setDirectEmail('');
        setDirectPhone('');
        fetchCalendarOverview();
        setTimeout(() => setDirectSuccess(''), 4000);
      } else {
        setDirectError('Chyba pri vytváraní rezervácie.');
      }
    } catch {
      setDirectError('Nepodarilo sa spojiť so serverom.');
    } finally {
      setLoadingDirect(false);
    }
  };

  const handleDeleteFsmSlot = async (eventId: string) => {
    if (!confirm(language === 'sk' ? 'Naozaj chcete vymazať tento voľný FSM blok z kalendára?' : 'Delete this open FSM slot?')) return;

    try {
      const res = await fetch('/api/admin/cancel-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (res.ok) {
        await fetchCalendarOverview();
      } else {
        alert(language === 'sk' ? 'Chyba pri mazaní voľného bloku.' : 'Error deleting slot.');
      }
    } catch {
      alert('Chyba pripojenia.');
    }
  };

  const eventsByDateKey = useMemo(() => {
    const record: Record<string, { fsm: any[]; bookings: any[] }> = {};
    allCalendarEvents.forEach((ev) => {
      if (!ev.start?.dateTime) return;
      const evDate = new Date(ev.start.dateTime);
      const dateKey = `${evDate.getFullYear()}-${String(evDate.getMonth() + 1).padStart(2, '0')}-${String(evDate.getDate()).padStart(2, '0')}`;

      if (!record[dateKey]) {
        record[dateKey] = { fsm: [], bookings: [] };
      }

      const summary = (ev.summary || '').toUpperCase();
      if (summary.includes('FSM')) {
        record[dateKey].fsm.push(ev);
      } else if (summary.includes('REZERVÁCIA')) {
        record[dateKey].bookings.push(ev);
      }
    });
    return record;
  }, [allCalendarEvents]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-left">
      {/* HORNÉ PREPÍNAČE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('actions');
              setActionSubTab('fsm');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'actions' && actionSubTab === 'fsm'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CalendarPlus size={15} />
            <span>{language === 'sk' ? 'A: Otvoriť voľné termíny' : 'A: Open Slots'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('actions');
              setActionSubTab('direct');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'actions' && actionSubTab === 'direct'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <UserPlus size={15} />
            <span>{language === 'sk' ? 'B: Rezervácia klienta' : 'B: Direct Booking'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveTab('calendar');
            fetchCalendarOverview();
          }}
          className={`py-2.5 px-5 rounded-2xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
            activeTab === 'calendar'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Calendar size={16} />
          <span>{language === 'sk' ? 'Kalendár' : 'Calendar View'}</span>
        </button>
      </div>

      {/* TAB 1: FORMULÁRE AKCIÍ */}
      {activeTab === 'actions' && (
        <div className="animate-in fade-in duration-200 space-y-6">
          {actionSubTab === 'fsm' && (
            <FsmGeneratorForm
              language={language}
              fsmStartDate={fsmStartDate}
              setFsmStartDate={setFsmStartDate}
              fsmEndDate={fsmEndDate}
              setFsmEndDate={setFsmEndDate}
              selectedDaysOfWeek={selectedDaysOfWeek}
              toggleDayOfWeek={toggleDayOfWeek}
              fsmExcludedDates={fsmExcludedDates}
              setFsmExcludedDates={setFsmExcludedDates}
              fsmStart={fsmStart}
              setFsmStart={setFsmStart}
              fsmEnd={fsmEnd}
              setFsmEnd={setFsmEnd}
              fsmDiscount={fsmDiscount}
              setFsmDiscount={setFsmDiscount}
              loadingFsm={loadingFsm}
              fsmSuccess={fsmSuccess}
              fsmError={fsmError}
              generatedTargetDates={generatedTargetDates}
              onOpenAfterWorkModal={() => setShowAfterWorkModal(true)}
              onApplyPresetHomeOffice={applyPresetHomeOffice}
              onApplyPresetThisWeek={applyPresetThisWeek}
              onApplyPresetThisMonth={applyPresetThisMonth}
              onSubmit={handleCreateFsm}
            />
          )}

          {actionSubTab === 'direct' && (
            <DirectBookingForm
              language={language}
              clients={clients}
              selectedClientId={selectedClientId}
              setSelectedClientId={setSelectedClientId}
              directName={directName}
              setDirectName={setDirectName}
              directEmail={directEmail}
              setDirectEmail={setDirectEmail}
              directPhone={directPhone}
              setDirectPhone={setDirectPhone}
              directDate={directDate}
              setDirectDate={setDirectDate}
              directTime={directTime}
              setDirectTime={setDirectTime}
              directType={directType}
              setDirectType={setDirectType}
              directDuration={directDuration}
              setDirectDuration={setDirectDuration}
              directPrice={directPrice}
              setDirectPrice={setDirectPrice}
              loadingDirect={loadingDirect}
              directSuccess={directSuccess}
              directError={directError}
              onSubmit={handleCreateDirectBooking}
            />
          )}
        </div>
      )}

      {/* TAB 2: GRAFICKÝ KALENDÁR */}
      {activeTab === 'calendar' && (
        <CalendarView
          language={language}
          calCurrentDate={calCurrentDate}
          setCalCurrentDate={setCalCurrentDate}
          loadingCalEvents={loadingCalEvents}
          eventsByDateKey={eventsByDateKey}
          selectedCalDayKey={selectedCalDayKey}
          setSelectedCalDayKey={setSelectedCalDayKey}
          onDeleteFsmSlot={handleDeleteFsmSlot}
          onOpenFsmForDay={(dayKey) => {
            setFsmStartDate(dayKey);
            setFsmEndDate(dayKey);
            setActiveTab('actions');
            setActionSubTab('fsm');
          }}
          onOpenDirectForDay={(dayKey) => {
            setDirectDate(dayKey);
            setActiveTab('actions');
            setActionSubTab('direct');
          }}
        />
      )}

      {/* MODAL OKNO */}
      {showAfterWorkModal && (
        <AfterWorkModal
          language={language}
          onClose={() => setShowAfterWorkModal(false)}
          onConfirm={applyPresetTodayAfterWorkConfirm}
        />
      )}
    </div>
  );
}