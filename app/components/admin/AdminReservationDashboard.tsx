'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { 
  CalendarPlus, UserPlus, Clock, Calendar, Sparkles, 
  CheckCircle2, AlertCircle, Loader2, Tag, Percent,
  ChevronLeft, ChevronRight, Plus, CalendarX, Eye, Flame
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

export default function AdminReservationDashboard({ language }: Props) {
  // Hlavné záložky admina
  const [activeTab, setActiveTab] = useState<'actions' | 'calendar'>('actions');
  const [actionSubTab, setActionSubTab] = useState<'fsm' | 'direct'>('fsm');

  // 1. Stavy pre Otvorenie FSM bloku
  const [fsmDate, setFsmDate] = useState('');
  const [fsmStart, setFsmStart] = useState('09:00');
  const [fsmEnd, setFsmEnd] = useState('17:00');
  const [fsmDiscount, setFsmDiscount] = useState('0');
  const [loadingFsm, setLoadingFsm] = useState(false);
  const [fsmSuccess, setFsmSuccess] = useState('');
  const [fsmError, setFsmError] = useState('');

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
    const today = new Date().toISOString().split('T')[0];
    setFsmDate(today);
    setDirectDate(today);

    const loadClients = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
      if (data) setClients(data);
    };
    loadClients();
    fetchCalendarOverview();
  }, []);

  // Načítanie všetkých udalostí pre grafický kalendár
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

  const handleCreateFsm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingFsm(true);
    setFsmSuccess('');
    setFsmError('');

    try {
      const res = await fetch('/api/admin/create-fsm-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: fsmDate,
          startTime: fsmStart,
          endTime: fsmEnd,
          discountPercent: fsmDiscount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFsmSuccess(language === 'sk' ? 'Voľné termíny boli úspešne otvorené v Google Kalendári!' : 'Free slots opened!');
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

  // VÝPOČTY PRE GRAFICKÝ KALENDÁR
  const calYear = calCurrentDate.getFullYear();
  const calMonth = calCurrentDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDayIdx = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const emptyCells = Array.from({ length: firstDayIdx }, (_, i) => i);

  const monthNamesSK = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
  const monthNamesEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Zoskupenie udalostí podľa dátumu
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
      
      {/* 🚀 HORNÉ NAVIGAČNÉ PREPÍNAČE ADMINA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* TLAČIDLO 1: PRIDAŤ VOĽNÉ SLOTY / AKCIE (S SUB-PREPÍNAČOM A & B) */}
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

        {/* TLAČIDLO 2: GRAFICKÝ KALENDÁR */}
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

      {/* ==================================================================== */}
      {/* 🚀 TAB 1: FORMULÁRE AKCIÍ (A: OTVERENIE TERMÍNOV & B: PRIAMA REZERVÁCIA) */}
      {/* ==================================================================== */}
      {activeTab === 'actions' && (
        <div className="animate-in fade-in duration-200 space-y-6">
          
          {/* POD-MOŽNOSŤ A: OTVORIŤ VOĽNÉ TERMÍNY (FSM) */}
          {actionSubTab === 'fsm' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <CalendarPlus size={20} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                    {language === 'sk' ? 'A: Otvoriť voľné termíny v kalendári' : 'A: Open Available Time Slots'}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {language === 'sk' ? 'Vytvorí voľný FSM blok, v ktorom si klienti môžu vyberať časy' : 'Creates an FSM open block in Google Calendar'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateFsm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Dátum */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-500" />
                      <span>{language === 'sk' ? 'Dátum:' : 'Date:'}</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={fsmDate}
                      onChange={(e) => setFsmDate(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {fsmDate && (
                      <p className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 pt-0.5 pl-1">
                        {formatFullDateText(fsmDate)}
                      </p>
                    )}
                  </div>

                  {/* Čas OD */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock size={14} className="text-indigo-500" />
                      <span>{language === 'sk' ? 'Čas OD (24h):' : 'From (24h):'}</span>
                    </label>
                    <select
                      value={fsmStart}
                      onChange={(e) => setFsmStart(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-extrabold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={`start-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  {/* Čas DO */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock size={14} className="text-indigo-500" />
                      <span>{language === 'sk' ? 'Čas DO (24h):' : 'To (24h):'}</span>
                    </label>
                    <select
                      value={fsmEnd}
                      onChange={(e) => setFsmEnd(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-extrabold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={`end-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rýchle predvoľby */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'sk' ? 'Rýchle predvoľby času:' : 'Quick time presets:'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { setFsmStart('09:00'); setFsmEnd('13:00'); }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                    >
                      09:00 - 13:00 ({language === 'sk' ? 'Dopoludnie' : 'Morning'})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFsmStart('13:00'); setFsmEnd('17:00'); }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                    >
                      13:00 - 17:00 ({language === 'sk' ? 'Popoludnie' : 'Afternoon'})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFsmStart('09:00'); setFsmEnd('18:00'); }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                    >
                      09:00 - 18:00 ({language === 'sk' ? 'Celý deň' : 'Full day'})
                    </button>
                  </div>
                </div>

                {/* Zľava na blok */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Percent size={14} className="text-sky-500" />
                    <span>{language === 'sk' ? 'Zľava na všetky sloty v tomto bloku (%):' : 'Discount on slots in this block (%):'}</span>
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    {['0', '10', '15', '20', '25', '30'].map((p) => (
                      <button
                        key={`disc-${p}`}
                        type="button"
                        onClick={() => setFsmDiscount(p)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                          fsmDiscount === p
                            ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {p === '0' ? (language === 'sk' ? 'Bez zľavy (0%)' : 'No discount') : `-${p}%`}
                      </button>
                    ))}
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
                  disabled={loadingFsm}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loadingFsm ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
                  <span>{language === 'sk' ? 'Otvoriť termíny v kalendári' : 'Open Slots in Calendar'}</span>
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

      {/* ==================================================================== */}
      {/* 🚀 TAB 2: INTERAKTÍVNY GRAFICKÝ KALENDÁR S INTERAKTÍVNYM KLIKOM NA DNI */}
      {/* ==================================================================== */}
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
                  {language === 'sk' ? 'Kliknite na deň pre detailný rozpis a pridať termíny' : 'Click a day to view timeline or open slots'}
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

          {/* LEGENDA FARIEB */}
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
              {/* MRIEŽKA MESAČNÉHO KALENDÁRA */}
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

              {/* 🚀 AK JE VYBRANÝ DEŇ: ZOBRAZÍ ROZPIS A TLAČIDLÁ PRE OTVORENIE SLOTU / REZERVÁCIE */}
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
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* UDALOSTI DŇA */}
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
                            <span className="truncate">{ev.summary}</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 shadow-sm shrink-0">
                              {format24hTimeText(ev.start?.dateTime)} - {format24hTimeText(ev.end?.dateTime)}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* RYCHLE AKCIE PRE VYBRANÝ DEŇ */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setFsmDate(selectedCalDayKey);
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

    </div>
  );
}