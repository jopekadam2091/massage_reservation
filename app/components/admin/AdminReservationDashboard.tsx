'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/app/lib/supabase';
import { 
  CalendarPlus, UserPlus, Clock, Calendar, Sparkles, 
  CheckCircle2, AlertCircle, Loader2, Tag, Percent,
  ChevronLeft, ChevronRight, Plus, CalendarX, Eye, Flame, Trash2, X, Wand2, Filter,
  Briefcase, Home as HomeIcon
} from 'lucide-react';

type Props = {
  language: string;
};

// Generovanie 24-hodinových časových možností (08:00 až 21:00 po 15 min)
const GENERATE_24H_TIME_OPTIONS = () => {
  const times: string[] = [];
  for (let h = 8; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
};

const TIME_OPTIONS = GENERATE_24H_TIME_OPTIONS();

// Dni v týždni: 1 = PO, 2 = UT, 3 = ST, 4 = ŠT, 5 = PI, 6 = SO, 0 = NE
const DAYS_OF_WEEK = [
  { id: 1, sk: 'PO', en: 'MO' },
  { id: 2, sk: 'UT', en: 'TU' },
  { id: 3, sk: 'ST', en: 'WE' },
  { id: 4, sk: 'ŠT', en: 'TH' },
  { id: 5, sk: 'PI', en: 'FR' },
  { id: 6, sk: 'SO', en: 'SA' },
  { id: 0, sk: 'NE', en: 'SU' },
];

export default function AdminReservationDashboard({ language }: Props) {
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
  const [clients, setClients] = useState<any[]>([]);
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
  const [allCalendarEvents, setAllCalendarEvents] = useState<any[]>([]);
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
      if (data) setClients(data);
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
    } finally {
      setLoadingCalEvents(false);
    }
  };

  const formatFullDateText = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const monthSK = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
    const monthEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthText = language === 'sk' ? monthSK[d.getMonth()] : monthEN[d.getMonth()];
    return `${day}. ${monthText} ${d.getFullYear()}`;
  };

  const format24hTimeText = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', hour12: false });
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

  // 🚀 1. PREDVOĽBA: DNES PO PRÁCI (S VÝBEROM ČASU ZAČIATKU)
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

  // 🚀 2. PREDVOĽBA: MÁM HO (Home Office 08:00 - 15:00)
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

  // 🚀 3. PREDVOĽBA: TENTO TÝŽDEŇ
  const applyPresetThisWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMon = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const monday = new Date(today.setDate(diffToMon));
    const sunday = new Date(today.setDate(monday.getDate() + 6));

    setFsmStartDate(monday.toISOString().split('T')[0]);
    setFsmEndDate(sunday.toISOString().split('T')[0]);
    setSelectedDaysOfWeek([1, 2, 3, 4, 5]); // PO - PI
  };

  // 🚀 4. PREDVOĽBA: TENTO MESIAC
  const applyPresetThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFsmStartDate(firstDay.toISOString().split('T')[0]);
    setFsmEndDate(lastDay.toISOString().split('T')[0]);
    setSelectedDaysOfWeek([1, 2, 3, 4, 5]); // PO - PI
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

  const calYear = calCurrentDate.getFullYear();
  const calMonth = calCurrentDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDayIdx = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const emptyCells = Array.from({ length: firstDayIdx }, (_, i) => i);

  const monthNamesSK = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
  const monthNamesEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const eventsByDateKey: Record<string, { fsm: any[]; bookings: any[] }> = {};

  allCalendarEvents.forEach((ev) => {
    if (!ev.start?.dateTime) return;
    const evDate = new Date(ev.start.dateTime);
    const dateKey = `${evDate.getFullYear()}-${String(evDate.getMonth() + 1).padStart(2, '0')}-${String(evDate.getDate()).padStart(2, '0')}`;

    if (!eventsByDateKey[dateKey]) {
      eventsByDateKey[dateKey] = { fsm: [], bookings: [] };
    }

    const summary = (ev.summary || '').toUpperCase();
    if (summary.includes('FSM')) {
      eventsByDateKey[dateKey].fsm.push(ev);
    } else if (summary.includes('REZERVÁCIA')) {
      eventsByDateKey[dateKey].bookings.push(ev);
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-left">
      
      {/* HORNÉ HLAVNÉ PREPÍNAČE */}
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
          
          {/* POD-MOŽNOSŤ A: CHYTRÝ GENERÁTOR OBDOBIA VOĽNÝCH TERMÍNOV (FSM) */}
          {actionSubTab === 'fsm' && (
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

              {/* 🚀 RÝCHLE PREDVOĽBY 1-KLIK S NOVÝMI PRAVIDLAMI */}
              <div className="space-y-1.5 bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                <label className="block text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                  {language === 'sk' ? '⚡ Rýchle predvoľby pravidiel:' : '⚡ Quick presets:'}
                </label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  
                  {/* 1. Dnes po práci (S výzvou kedy začať) */}
                  <button
                    type="button"
                    onClick={() => setShowAfterWorkModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-600 hover:text-white transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Briefcase size={14} />
                    <span>{language === 'sk' ? 'Dnes po práci' : 'Today after work'}</span>
                  </button>

                  {/* 2. Mám HO (08:00 - 15:00) */}
                  <button
                    type="button"
                    onClick={applyPresetHomeOffice}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-600 hover:text-white transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <HomeIcon size={14} />
                    <span>{language === 'sk' ? 'Mám HO (08:00–15:00)' : 'Home Office (08:00–15:00)'}</span>
                  </button>

                  {/* 3. Tento týždeň */}
                  <button
                    type="button"
                    onClick={applyPresetThisWeek}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    📅 {language === 'sk' ? 'Tento týždeň' : 'This week'}
                  </button>

                  {/* 4. Tento mesiac */}
                  <button
                    type="button"
                    onClick={applyPresetThisMonth}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    📅 {language === 'sk' ? 'Tento mesiac' : 'This month'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateFsm} className="space-y-4">
                
                {/* ROZSAH DÁTUMOV (OD - DO) */}
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

                {/* DNI V TÝŽDNI (PO, UT, ST, ŠT, PI, SO, NE) */}
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

                {/* 🚀 ČAS OD A ČAS DO V JEDNOM COMPAKTNOM RIADKU */}
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

                {/* VYGENEROVANÝ ZOZNAM DŇÍ S MOŽNOSŤOU ODSTRÁNIŤ VÝNIMKY */}
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
                          <span>{formatFullDateText(d)}</span>
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

                {/* 🚀 ROZŠÍRENÉ AKCIE A ZĽAVY (0% až 100%) */}
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
          )}

          {/* POD-MOŽNOSŤ B: PRIAMA REZERVÁCIA KLIENTA */}
          {actionSubTab === 'direct' && (
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

              <form onSubmit={handleCreateDirectBooking} className="space-y-4">
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
          )}

        </div>
      )}

      {/* TAB 2: GRAFICKÝ KALENDÁR */}
      {activeTab === 'calendar' && (
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
                {language === 'sk' ? monthNamesSK[calMonth] : monthNamesEN[calMonth]} {calYear}
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

              {/* DETAIL DŇA A VYMAZANIE FSM BLOKOV */}
              {selectedCalDayKey && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-500" />
                      <span>Rozpis na: {formatFullDateText(selectedCalDayKey)}</span>
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
                                  onClick={() => handleDeleteFsmSlot(ev.id)}
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
                      onClick={() => {
                        setFsmStartDate(selectedCalDayKey);
                        setFsmEndDate(selectedCalDayKey);
                        setActiveTab('actions');
                        setActionSubTab('fsm');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>{language === 'sk' ? 'Otvoriť FSM slot na tento deň' : 'Open FSM slot for this day'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDirectDate(selectedCalDayKey);
                        setActiveTab('actions');
                        setActionSubTab('direct');
                      }}
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
      )}

      {/* 🚀 MODAL OKNO PRE "DNES PO PRÁCI" (KEDY ZAČÍNAŠ?) */}
      {showAfterWorkModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 font-sans animate-fadeIn">
          <div className="w-full max-w-xs p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowAfterWorkModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
              <Clock size={22} />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {language === 'sk' ? 'Dnes po práci: Kedy môžete začať?' : 'Today after work: When can you start?'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'sk' ? 'Vyberte čas začiatku (zmena do 20:00)' : 'Select start time (until 20:00)'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {['16:00', '16:30', '17:00', '17:30', '18:00', '18:30'].map((time) => (
                <button
                  key={`afterwork-${time}`}
                  type="button"
                  onClick={() => applyPresetTodayAfterWorkConfirm(time)}
                  className="py-2.5 rounded-xl text-xs font-black border transition cursor-pointer bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-2xs"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}