'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/app/lib/supabase';
import FuturisticRadialMenu from './FuturisticRadialMenu';
import { 
  CalendarPlus, UserPlus, Clock, Calendar, Sparkles, 
  CheckCircle2, AlertCircle, Loader2, Tag, Percent,
  ChevronLeft, ChevronRight, Plus, CalendarX, Eye, Flame, Trash2, X, Wand2, Filter,
  Briefcase, Home as HomeIcon, Check, Users, Search, ChevronDown, ChevronUp, Star,
  Palmtree, MoreHorizontal, Layers, Zap, ShieldCheck, Compass
} from 'lucide-react';

type Props = {
  language: string;
};

// Generovanie časov od 07:00 do 23:00 po 15 minútach
const GENERATE_24H_TIME_OPTIONS = () => {
  const times: string[] = [];
  for (let h = 7; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
};

const TIME_OPTIONS = GENERATE_24H_TIME_OPTIONS();

// Generovanie celých hodín 07:00 až 23:00 pre denný rozpis
const HOURLY_TIMELINE = Array.from({ length: 17 }, (_, i) => {
  const h = i + 7;
  return `${h.toString().padStart(2, '0')}:00`;
});

const DAYS_OF_WEEK = [
  { id: 1, sk: 'Pondelok', skShort: 'PO', en: 'Monday', enShort: 'MO' },
  { id: 2, sk: 'Utorok', skShort: 'UT', en: 'Tuesday', enShort: 'TU' },
  { id: 3, sk: 'Streda', skShort: 'ST', en: 'Wednesday', enShort: 'WE' },
  { id: 4, sk: 'Štvrtok', skShort: 'ŠT', en: 'Thursday', enShort: 'TH' },
  { id: 5, sk: 'Piatok', skShort: 'PI', en: 'Friday', enShort: 'FR' },
  { id: 6, sk: 'Sobota', skShort: 'SO', en: 'Saturday', enShort: 'SA' },
  { id: 0, sk: 'Nedeľa', skShort: 'NE', en: 'Sunday', enShort: 'SU' },
];

const PROMO_TAGS = [
  { 
    label: '0', 
    name: '0',
    value: '0', 
    idle: 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', 
    active: 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md shadow-slate-900/20 font-bold'
  },
  { 
    label: '-5%', 
    name: '-5%',
    value: '5', 
    idle: 'bg-sky-50 hover:bg-sky-100/80 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80', 
    active: 'bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-500/30 font-bold'
  },
  { 
    label: '-10%', 
    name: '-10%',
    value: '10', 
    idle: 'bg-teal-50 hover:bg-teal-100/80 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/80', 
    active: 'bg-teal-500 text-white border-teal-600 shadow-md shadow-teal-500/30 font-bold'
  },
  { 
    label: '-15%', 
    name: '-15%',
    value: '15', 
    idle: 'bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80', 
    active: 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/30 font-bold'
  },
  { 
    label: '-20%', 
    name: '-20%',
    value: '20', 
    idle: 'bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80', 
    active: 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/30 font-bold'
  },
  { 
    label: '-30%', 
    name: '-30%',
    value: '30', 
    idle: 'bg-orange-50 hover:bg-orange-100/80 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/80', 
    active: 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-500/30 font-bold'
  },
  { 
    label: '-50%', 
    name: '-50%',
    value: '50', 
    idle: 'bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80', 
    active: 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/30 font-bold'
  },
  { 
    label: '-75%', 
    name: '-75%',
    value: '75', 
    idle: 'bg-purple-50 hover:bg-purple-100/80 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80', 
    active: 'bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-600/30 font-bold'
  },
  { 
    label: '-100%', 
    name: '-100%',
    value: '100', 
    idle: 'bg-red-50 hover:bg-red-100/80 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/80', 
    active: 'bg-red-600 text-white border-red-700 shadow-md shadow-red-600/30 font-bold'
  },
];

const getDiscountBadgeStyle = (percent: number | string | null | undefined, variant: 'solid' | 'subtle' = 'subtle') => {
  const p = percent ? String(percent) : '0';
  switch (p) {
    case '0':
      return variant === 'solid'
        ? 'bg-slate-600 text-white border-slate-700 shadow-xs'
        : 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/40';
    case '5':
      return variant === 'solid'
        ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
        : 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40';
    case '10':
      return variant === 'solid'
        ? 'bg-teal-500 text-white border-teal-600 shadow-xs'
        : 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/40';
    case '15':
      return variant === 'solid'
        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
        : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40';
    case '20':
      return variant === 'solid'
        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40';
    case '30':
      return variant === 'solid'
        ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
        : 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40';
    case '50':
      return variant === 'solid'
        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
        : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40';
    case '75':
      return variant === 'solid'
        ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
        : 'bg-purple-500/20 text-purple-600 dark:text-[#A78BFA] border-purple-500/40';
    case '100':
      return variant === 'solid'
        ? 'bg-red-600 text-white border-red-700 shadow-xs'
        : 'bg-red-600/20 text-red-600 dark:text-red-400 border-red-600/40';
    default:
      return variant === 'solid'
        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
        : 'bg-rose-500/20 text-rose-600 dark:text-[#FF5A7A] border-rose-500/40';
  }
};

export default function AdminReservationDashboard({ language }: Props) {
  // 🚀 RADIAL / FLOATING HELPER MENU STAV
  const [isRadialOpen, setIsRadialOpen] = useState(false);
  const [activeRadialTool, setActiveRadialTool] = useState<'presets' | 'tags' | 'timeslot' | 'delete' | 'vacation' | 'direct' | null>(null);

  // Dnešný lokálny dátum pre ochranu pred minulosťou
  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const getLocalDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 1. Stavy pre FSM GENERÁTOR
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateCustomDiscounts, setDateCustomDiscounts] = useState<Record<string, string>>({});
  const [slotCustomDiscounts, setSlotCustomDiscounts] = useState<Record<string, string>>({}); // kluc: YYYY-MM-DD_HH:MM -> percent
  const [dropPromoModal, setDropPromoModal] = useState<{
    dateKey: string;
    tagValue: string;
    tagLabel: string;
    selectedHours: string[];
  } | null>(null);
  const [vacationDates, setVacationDates] = useState<string[]>([]);
  const [fsmStart, setFsmStart] = useState('08:00');
  const [fsmEnd, setFsmEnd] = useState('20:00');
  const [activePromoTag, setActivePromoTag] = useState<string>('0');

  const [loadingFsm, setLoadingFsm] = useState(false);
  const [fsmSuccess, setFsmSuccess] = useState('');
  const [fsmError, setFsmError] = useState('');

  // Modál pre Home Office
  const [showHomeOfficeModal, setShowHomeOfficeModal] = useState(false);

  // 2. Stavy pre Priamu rezerváciu s Live Autocomplete
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  const [directName, setDirectName] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [directDate, setDirectDate] = useState(todayIso);
  const [directTime, setDirectTime] = useState('10:00');
  const [directType, setDirectType] = useState('CLASSIC');
  const [directDuration, setDirectDuration] = useState(60);
  const [directPrice, setDirectPrice] = useState('45');
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [directSuccess, setDirectSuccess] = useState('');
  const [directError, setDirectError] = useState('');

  // 3. Stavy pre Kalendár a Hodinový rozpis (Hourly Schedule Modal 07:00–23:00)
  const [calCurrentDate, setCalCurrentDate] = useState<Date>(new Date());
  const [allCalendarEvents, setAllCalendarEvents] = useState<any[]>([]);
  const [loadingCalEvents, setLoadingCalEvents] = useState(false);
  
  // Modál denného harmonogramu (otvára sa kliknutím na ikonku času v bunke)
  const [scheduleModalDate, setScheduleModalDate] = useState<string | null>(null);
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);

  // Hromadný výber a mazanie cez Checkboxy
  const [selectedSlotIdsToDelete, setSelectedSlotIdsToDelete] = useState<string[]>([]);
  const [loadingBulkDelete, setLoadingBulkDelete] = useState(false);

  // Modál pre výber konkrétneho slotu na zmazanie v danom dni
  const [deletePickerDate, setDeletePickerDate] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const todayStr = getLocalDateKey(today);
    setDirectDate(todayStr);
    setSelectedDates([todayStr]);

    try {
      const savedVacations = localStorage.getItem('zenflow_admin_vacations');
      if (savedVacations) {
        const parsed: string[] = JSON.parse(savedVacations);
        const upcoming = parsed.filter((v) => v >= todayStr);
        setVacationDates(upcoming);
      }
    } catch {}

    const loadClients = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, email, role').order('full_name');
      if (data) setClients(data.filter((p: any) => p.role !== 'admin'));
    };
    loadClients();
    fetchCalendarOverview();
  }, []);

  const fetchCalendarOverview = async () => {
    setLoadingCalEvents(true);
    try {
      const res = await fetch('/api/appointments?includePast=true');
      const data = await res.json();
      if (res.ok && data.events) {
        setAllCalendarEvents(data.events);
      }
    } catch (err) {
      console.error('Chyba načítavania kalendára:', err);
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

  const extractFsmDiscount = (summary: string = ''): number | null => {
    const match = summary.match(/FSM_D(\d{1,3})/i);
    return match ? parseInt(match[1], 10) : null;
  };

  const [updatingDiscountSlotId, setUpdatingDiscountSlotId] = useState<string | null>(null);
  const [loadingBatchDiscount, setLoadingBatchDiscount] = useState(false);

  const handleUpdateSlotDiscount = async (eventId: string, discountPercent: string) => {
    setUpdatingDiscountSlotId(eventId);
    try {
      const res = await fetch('/api/admin/update-fsm-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, discountPercent }),
      });
      if (res.ok) {
        await fetchCalendarOverview();
      } else {
        const d = await res.json();
        alert(d.error || 'Chyba pri aktualizácii zľavy');
      }
    } catch {
      alert('Chyba spojenia so serverom.');
    } finally {
      setUpdatingDiscountSlotId(null);
    }
  };

  const handleUpdateHourDiscount = async (date: string, hourStr: string, discountPercent: string, eventId?: string) => {
    const key = `${date}_${hourStr}`;
    setUpdatingDiscountSlotId(key);
    try {
      const res = await fetch('/api/admin/update-fsm-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          date,
          selectedHours: [hourStr],
          discountPercent,
        }),
      });
      if (res.ok) {
        await fetchCalendarOverview();
      } else {
        const d = await res.json();
        alert(d.error || 'Chyba pri aktualizácii zľavy pre danú hodinu');
      }
    } catch {
      alert('Chyba spojenia so serverom.');
    } finally {
      setUpdatingDiscountSlotId(null);
    }
  };

  const handleUpdateDatesDiscount = async (targetDates: string[], discountPercent: string) => {
    if (targetDates.length === 0) return;
    setLoadingBatchDiscount(true);
    try {
      await Promise.all(
        targetDates.map((d) =>
          fetch('/api/admin/update-fsm-slot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: d, discountPercent }),
          })
        )
      );
      await fetchCalendarOverview();
    } catch {
      alert('Chyba pri hromadnej zmene zliav.');
    } finally {
      setLoadingBatchDiscount(false);
    }
  };

  // Kalendárne mapovanie udalostí
  const eventsByDateKey = useMemo(() => {
    const record: Record<string, { fsm: any[]; bookings: any[] }> = {};

    allCalendarEvents.forEach((ev) => {
      if (!ev.start?.dateTime) return;
      const evDate = new Date(ev.start.dateTime);
      const dateKey = getLocalDateKey(evDate);

      if (!record[dateKey]) {
        record[dateKey] = { fsm: [], bookings: [] };
      }

      const summary = (ev.summary || '').toUpperCase();
      if (summary.includes('FSM')) {
        record[dateKey].fsm.push(ev);
      } else if (summary.includes('REZERVÁCIA') || summary.includes('RES-')) {
        record[dateKey].bookings.push(ev);
      }
    });

    return record;
  }, [allCalendarEvents]);

  // Kalendárne výpočty
  const calYear = calCurrentDate.getFullYear();
  const calMonth = calCurrentDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDayIdx = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const emptyCells = Array.from({ length: firstDayIdx }, (_, i) => i);

  const monthNamesSK = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
  const monthNamesEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Kliknutie na deň (podpora pre double-click aj double-tap na mobile)
  const lastClickTimeRef = useRef<{ [dateKey: string]: number }>({});

  const handleDayClick = (dateKey: string) => {
    if (dateKey < todayIso) return;

    const now = Date.now();
    const lastClick = lastClickTimeRef.current[dateKey] || 0;
    const isDoubleTap = now - lastClick < 350;
    lastClickTimeRef.current[dateKey] = now;

    if (isDoubleTap) {
      setScheduleModalDate(dateKey);
      return;
    }

    if (activeRadialTool === 'direct') {
      setDirectDate(dateKey);
      return;
    }

    if (activeRadialTool === 'delete') {
      const dayEvs = eventsByDateKey[dateKey];
      const daySlotIds = [
        ...(dayEvs?.fsm.map((e: any) => e.id) || []),
        ...(dayEvs?.bookings.map((e: any) => e.id) || []),
      ];
      if (daySlotIds.length > 0) {
        setScheduleModalDate(dateKey);
      }
      return;
    }

    if (activeRadialTool === 'vacation') {
      toggleVacation(dateKey);
      return;
    }

    if (vacationDates.includes(dateKey)) {
      alert(language === 'sk' ? 'Tento deň je označený ako dovolenka. Termíny nie je možné pridať na dovolenku.' : 'This day is vacation.');
      return;
    }

    // 🚀 OBMEDZENIE PRE AKCIOVÉ TAGY: Iba dni, kde už existujú voľné FSM sloty
    if (activeRadialTool === 'tags') {
      const dayEvs = eventsByDateKey[dateKey];
      const hasFsmSlots = (dayEvs?.fsm?.length || 0) > 0;
      if (!hasFsmSlots) {
        alert(language === 'sk' 
          ? 'V tento deň nie je otvorený žiadny voľný FSM slot. Akciové tagy je možné priradiť iba na dni, kde už máte voľné sloty.' 
          : 'No free FSM slots on this day. Promo tags can only be applied to days with free slots.');
        return;
      }
    }

    setSelectedDates((prev) => {
      const next = prev.includes(dateKey) ? prev.filter((k) => k !== dateKey) : [...prev, dateKey].sort();
      if (!prev.includes(dateKey) && activePromoTag !== '0') {
        setDateCustomDiscounts((d) => ({ ...d, [dateKey]: activePromoTag }));
      }
      return next;
    });
  };

  const handleDropPromoTag = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    if (dateKey < todayIso) return;
    if (vacationDates.includes(dateKey)) {
      alert(language === 'sk' ? 'Na deň s dovolenkou nie je možné priradiť zľavu.' : 'Cannot add promo on vacation day.');
      return;
    }

    const droppedValue = e.dataTransfer.getData('text/promo-tag');
    const droppedLabel = e.dataTransfer.getData('text/promo-label') || `-${droppedValue}%`;
    if (!droppedValue) return;

    // 🚀 Ak na tento deň nie je otvorený voľný FSM slot, opýtame sa či chce vytvoriť nový slot
    const dayEvs = eventsByDateKey[dateKey];
    const hasFsmSlots = (dayEvs?.fsm?.length || 0) > 0;
    if (!hasFsmSlots) {
      const formattedDate = new Date(dateKey).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' });
      const confirmCreate = confirm(
        language === 'sk' 
          ? `V tento deň (${formattedDate}) zatiaľ nie je otvorený žiadny voľný slot.\n\nŽeláte si pre tento deň vytvoriť nový voľný slot so zľavou ${droppedLabel}?`
          : `No free slot on this day (${formattedDate}).\n\nDo you want to create a new free slot with discount ${droppedLabel}?`
      );
      if (confirmCreate) {
        setSelectedDates([dateKey]);
        setActivePromoTag(droppedValue);
        setDateCustomDiscounts((d) => ({ ...d, [dateKey]: droppedValue }));
        setActiveRadialTool('timeslot');
      }
      return;
    }

    // Vždy otvoríme časové okno pre daný deň na vyklikanie konkrétnych hodín alebo všetkých hodín naraz
    setDropPromoModal({
      dateKey,
      tagValue: droppedValue,
      tagLabel: droppedLabel,
      selectedHours: [],
    });
  };

  const addVacations = (datesToAdd: string[]) => {
    setVacationDates((prev) => {
      const set = new Set([...prev, ...datesToAdd]);
      const next = Array.from(set);
      try {
        localStorage.setItem('zenflow_admin_vacations', JSON.stringify(next));
      } catch {}
      return next;
    });
    setSelectedDates((prev) => prev.filter((d) => !datesToAdd.includes(d)));
  };

  const toggleVacation = (dateKey: string) => {
    setVacationDates((prev) => {
      const next = prev.includes(dateKey) ? prev.filter((d) => d !== dateKey) : [...prev, dateKey];
      try {
        localStorage.setItem('zenflow_admin_vacations', JSON.stringify(next));
      } catch {}
      return next;
    });
    // Ak sa deň označí ako dovolenka, okamžite ho odstránime z vybraných dní pre generovanie
    setSelectedDates((prev) => prev.filter((d) => d !== dateKey));
  };

  // Rýchle predvoľby (platia pre voľné sloty, dovolenku aj mazanie podľa otvorenej karty)
  const applyPresetTodayAfterWork = (startTime = '17:00') => {
    const todayStr = getLocalDateKey(new Date());

    // 1. REŽIM VOĽNO / DOVOLENKA: označí dnešok ako voľno
    if (activeRadialTool === 'vacation') {
      addVacations([todayStr]);
      return;
    }

    // 2. REŽIM MAZANIE: označí všetky sloty dnešného dňa na zmazanie
    if (activeRadialTool === 'delete') {
      const dayEvs = eventsByDateKey[todayStr];
      const daySlotIds = [
        ...(dayEvs?.fsm.map((e: any) => e.id) || []),
        ...(dayEvs?.bookings.map((e: any) => e.id) || []),
      ];
      if (daySlotIds.length > 0) {
        setSelectedSlotIdsToDelete((prev) => Array.from(new Set([...prev, ...daySlotIds])));
      }
      return;
    }

    // 3. REŽIM PRIAMA REZERVÁCIA: predvolí dnešný dátum a čas
    if (activeRadialTool === 'direct') {
      setDirectDate(todayStr);
      setDirectTime(startTime);
      return;
    }

    // 4. REŽIM VOĽNÉ SLOTY: predvolí dnešný deň
    if (vacationDates.includes(todayStr)) {
      alert(language === 'sk' ? 'Dnes máte nastavenú dovolenku.' : 'Today is vacation.');
      return;
    }
    setSelectedDates([todayStr]);
    setFsmStart(startTime);
    setFsmEnd('20:00');
    if (!activeRadialTool) {
      setActiveRadialTool('timeslot');
    }
  };

  const applyPresetHomeOffice = (rangeType: 'today' | 'this_week' | 'this_month') => {
    const now = new Date();
    const todayStr = getLocalDateKey(now);

    let dates: string[] = [];
    if (rangeType === 'today') {
      dates = [todayStr];
    } else if (rangeType === 'this_week') {
      const nowCopy = new Date(now);
      const dayOfWeek = nowCopy.getDay();
      const diffToMon = nowCopy.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(nowCopy.setDate(diffToMon));

      for (let i = 0; i < 5; i++) {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        const dStr = getLocalDateKey(d);
        if (dStr >= todayStr) dates.push(dStr);
      }
    } else if (rangeType === 'this_month') {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let day = now.getDate(); day <= lastDay; day++) {
        const d = new Date(now.getFullYear(), now.getMonth(), day);
        const dayOfWeek = d.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          dates.push(getLocalDateKey(d));
        }
      }
    }

    setShowHomeOfficeModal(false);

    // 1. REŽIM VOĽNO / DOVOLENKA: označí celý vybraný rozsah ako dovolenku
    if (activeRadialTool === 'vacation') {
      addVacations(dates);
      return;
    }

    // 2. REŽIM MAZANIE: označí všetky sloty v dňoch rozsahu na zmazanie
    if (activeRadialTool === 'delete') {
      const allSlotIds: string[] = [];
      dates.forEach((dKey) => {
        const dayEvs = eventsByDateKey[dKey];
        if (dayEvs) {
          dayEvs.fsm.forEach((e: any) => allSlotIds.push(e.id));
          dayEvs.bookings.forEach((e: any) => allSlotIds.push(e.id));
        }
      });
      if (allSlotIds.length > 0) {
        setSelectedSlotIdsToDelete((prev) => Array.from(new Set([...prev, ...allSlotIds])));
      }
      return;
    }

    // 3. REŽIM PRIAMA REZERVÁCIA
    if (activeRadialTool === 'direct') {
      setDirectDate(dates[0] || todayStr);
      setDirectTime('09:00');
      return;
    }

    // 4. REŽIM VOĽNÉ SLOTY: predvolí vybrané dni a časy 09:00–15:00
    const nonVacation = dates.filter((d) => !vacationDates.includes(d));
    setSelectedDates(nonVacation);
    setFsmStart('09:00');
    setFsmEnd('15:00');
    if (!activeRadialTool) {
      setActiveRadialTool('timeslot');
    }
  };

  const applyPresetThisWeek = () => {
    const now = new Date();
    const todayStr = getLocalDateKey(now);
    const nowCopy = new Date(now);
    const dayOfWeek = nowCopy.getDay();
    const diffToMon = nowCopy.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(nowCopy.setDate(diffToMon));
    const dates: string[] = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dStr = getLocalDateKey(d);
      if (dStr >= todayStr && !vacationDates.includes(dStr)) {
        dates.push(dStr);
      }
    }
    setSelectedDates(dates);
    setActiveRadialTool('timeslot');
  };

  const applyPresetThisMonth = (onlyWorkdays = false) => {
    const now = new Date();
    const dates: string[] = [];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (let day = now.getDate(); day <= lastDay; day++) {
      const d = new Date(now.getFullYear(), now.getMonth(), day);
      const dayOfWeek = d.getDay();
      const dStr = getLocalDateKey(d);
      if (!onlyWorkdays || (dayOfWeek >= 1 && dayOfWeek <= 5)) {
        if (!vacationDates.includes(dStr)) {
          dates.push(dStr);
        }
      }
    }
    setSelectedDates(dates);
    setActiveRadialTool('timeslot');
  };

  // Vygenerovanie voľných FSM slotov
  const handleCreateFsm = async (e: React.FormEvent) => {
    e.preventDefault();
    // Vylúčime akýkoľvek deň, na ktorom je dovolenka
    const validDates = selectedDates.filter((d) => !vacationDates.includes(d));

    if (validDates.length === 0) {
      setFsmError(language === 'sk' ? 'Na vybrané dni pripadá dovolenka alebo nie je označený žiadny deň.' : 'Selected dates are vacation or empty.');
      return;
    }

    setLoadingFsm(true);
    setFsmSuccess('');
    setFsmError('');

    try {
      const groupsByDiscount: Record<string, string[]> = {};
      validDates.forEach((d) => {
        const disc = dateCustomDiscounts[d] || activePromoTag || '0';
        if (!groupsByDiscount[disc]) groupsByDiscount[disc] = [];
        groupsByDiscount[disc].push(d);
      });

      for (const [discPercent, datesArr] of Object.entries(groupsByDiscount)) {
        await fetch('/api/admin/create-fsm-slot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dates: datesArr,
            startTime: fsmStart,
            endTime: fsmEnd,
            discountPercent: discPercent,
          }),
        });
      }

      setFsmSuccess(
        language === 'sk' 
          ? `Voľné sloty pre (${validDates.length}) dní boli úspešne vygenerované!` 
          : `Free slots for (${validDates.length}) days opened!`
      );
      fetchCalendarOverview();
      setTimeout(() => {
        setFsmSuccess('');
        setActiveRadialTool(null);
      }, 3500);
    } catch {
      setFsmError('Nepodarilo sa spojiť so serverom.');
    } finally {
      setLoadingFsm(false);
    }
  };

  const handleDeleteSlot = async (eventId: string) => {
    if (!confirm(language === 'sk' ? 'Naozaj chcete vymazať tento termín z kalendára?' : 'Delete this slot?')) return;
    setDeletingSlotId(eventId);

    try {
      const res = await fetch('/api/admin/cancel-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (res.ok) {
        await fetchCalendarOverview();
      } else {
        alert('Chyba pri mazaní.');
      }
    } catch {
      alert('Chyba pripojenia.');
    } finally {
      setDeletingSlotId(null);
    }
  };

  const toggleSlotSelectionToDelete = (slotId: string) => {
    setSelectedSlotIdsToDelete((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  };

  const handleBulkDeleteSlots = async (slotIdsToDel?: string[]) => {
    const ids = slotIdsToDel || selectedSlotIdsToDelete;
    if (ids.length === 0) return;

    if (
      !confirm(
        language === 'sk'
          ? `Naozaj chcete jedným klikom vymazať všetkých (${ids.length}) označených termínov?`
          : `Delete all ${ids.length} selected slots in one click?`
      )
    ) {
      return;
    }

    setLoadingBulkDelete(true);
    try {
      for (const eventId of ids) {
        await fetch('/api/admin/cancel-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId }),
        });
      }
      setSelectedSlotIdsToDelete([]);
      await fetchCalendarOverview();
    } catch {
      alert('Chyba pri hromadnom mazaní.');
    } finally {
      setLoadingBulkDelete(false);
    }
  };

  const filteredClientSuggestions = useMemo(() => {
    if (!clientSearchInput.trim()) return [];
    const query = clientSearchInput.toLowerCase();
    return clients.filter(
      (c) =>
        (c.full_name || '').toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [clientSearchInput, clients]);

  const selectClientSuggestion = (client: any) => {
    setDirectName(client.full_name || client.email);
    setDirectEmail(client.email);
    setClientSearchInput(client.full_name || client.email);
    setShowClientSuggestions(false);
  };

  const handleCreateDirectBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directName.trim() || !directEmail.trim()) {
      setDirectError(language === 'sk' ? 'Zadajte meno a e-mail klienta.' : 'Enter client name and email.');
      return;
    }

    setLoadingDirect(true);
    setDirectSuccess('');
    setDirectError('');

    const generatedRef = 'RES-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const slotIso = new Date(`${directDate}T${directTime}:00`).toISOString();

    const payload = {
      name: directName.trim(),
      email: directEmail.trim(),
      phone: directPhone.trim() || '-',
      slot: slotIso,
      duration: directDuration,
      type: directType,
      basePrice: parseInt(directPrice, 10) || 45,
      finalPrice: parseInt(directPrice, 10) || 45,
      customerNote: `Priama rezervácia administrátorom | Ref: #${generatedRef}`,
      bookingRef: generatedRef,
    };

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDirectSuccess(language === 'sk' ? `Rezervácia #${generatedRef} pre ${directName} bola vytvorená!` : `Booking created!`);
        setDirectName('');
        setDirectEmail('');
        setDirectPhone('');
        setClientSearchInput('');
        fetchCalendarOverview();
        setTimeout(() => setDirectSuccess(''), 4500);
      } else {
        setDirectError('Chyba pri vytváraní rezervácie.');
      }
    } catch {
      setDirectError('Nepodarilo sa spojiť so serverom.');
    } finally {
      setLoadingDirect(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 font-sans text-left text-[#1E293B] dark:text-[#DDE0F2] pb-24 relative pt-4 sm:pt-6">
      
      {/* 🚀 1. HORNÝ COMMAND HUB: FUTURISTICKÉ RADIAL MENU + GLOW SPOJKA + POD-MENU */}
      <FuturisticRadialMenu
        activeId={activeRadialTool}
        onSelect={(id) => {
          if (activeRadialTool === id) {
            setActiveRadialTool(null);
          } else {
            setActiveRadialTool(id as any);
            setSelectedDates([]);
            setActivePromoTag('0');
          }
        }}
        selectedCount={selectedDates.length}
      >
        {activeRadialTool && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2B2F49] pb-2">
              <h3 className="font-semibold text-xs sm:text-sm text-[#0B0D22] dark:text-[#FFFFFF] flex items-center gap-2">
                {activeRadialTool === 'direct' && <><UserPlus size={15} className="text-[#8B5CF6]" /><span>Priama rezervácia klienta</span></>}
                {activeRadialTool === 'timeslot' && <><Clock size={15} className="text-[#10B981]" /><span>Pridať voľné sloty</span></>}
                {activeRadialTool === 'vacation' && <><Palmtree size={15} className="text-[#EAB308]" /><span>Voľno a dovolenka</span></>}
                {activeRadialTool === 'delete' && <><Trash2 size={15} className="text-[#EF4444]" /><span>Zmazať sloty z kalendára</span></>}
              </h3>

              <button
                type="button"
                onClick={() => setActiveRadialTool(null)}
                className="text-[#64748B] hover:text-[#0B0D22] dark:hover:text-white p-1 rounded-md cursor-pointer"
                title="Zavrieť panel"
              >
                <X size={15} />
              </button>
            </div>

              {/* 3. PRIDAŤ VOĽNÉ SLOTY DO SYSTÉMU S MOŽNOSŤOU AKCIE */}
              {activeRadialTool === 'timeslot' && (
                <form onSubmit={handleCreateFsm} className="space-y-3.5">
                  {/* 1. ČASOVÝ INTERVAL */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0B0D22] dark:text-[#FFFFFF] mb-1">
                        Začiatok:
                      </label>
                      <select
                        value={fsmStart}
                        onChange={(e) => setFsmStart(e.target.value)}
                        className="w-full p-2 rounded-xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50 dark:bg-[#010314] text-xs font-bold focus:outline-none"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={`fsm-start-${t}`} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#0B0D22] dark:text-[#FFFFFF] mb-1">
                        Koniec:
                      </label>
                      <select
                        value={fsmEnd}
                        onChange={(e) => setFsmEnd(e.target.value)}
                        className="w-full p-2 rounded-xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50 dark:bg-[#010314] text-xs font-bold focus:outline-none"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={`fsm-end-${t}`} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 2. MODERNÉ TLAČIDLÁ PRE ZĽAVY / AKCIE (1 RIADOK, MODERNÝ SANS FONT) */}
                  <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#2B2F49]">
                    <div className="flex items-center justify-between gap-1 sm:gap-1.5 w-full overflow-x-auto no-scrollbar py-0.5">
                      {PROMO_TAGS.map((tag) => {
                        const isSelected = activePromoTag === tag.value;
                        return (
                          <button
                            key={tag.label}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/promo-tag', tag.value);
                              e.dataTransfer.setData('text/promo-label', tag.label);
                            }}
                            onClick={() => {
                              setActivePromoTag(tag.value);
                              if (selectedDates.length > 0) {
                                const updated = { ...dateCustomDiscounts };
                                selectedDates.forEach((d) => {
                                  updated[d] = tag.value;
                                });
                                setDateCustomDiscounts(updated);
                              }
                            }}
                            className={`group relative flex-1 min-w-[28px] sm:min-w-[34px] py-1.5 px-1 sm:px-1.5 rounded-xl border text-[11px] sm:text-xs font-bold tracking-tight transition-all duration-200 active:scale-95 cursor-pointer select-none flex items-center justify-center shrink-0 sm:shrink ${
                              isSelected
                                ? `${tag.active} scale-105 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-[#0B0D22] z-10`
                                : `${tag.idle} hover:-translate-y-0.5 shadow-2xs`
                            }`}
                            title={tag.value === '0' ? (language === 'sk' ? 'Bez zľavy (0)' : 'No discount (0)') : `Akcia ${tag.label}`}
                          >
                            <span>{tag.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. OZNAČENÉ DNI & SUBMIT */}
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold flex items-center justify-between">
                    <span>Označené dni v kalendári:</span>
                    <span className="text-[#10B981] font-bold font-mono text-sm">
                      {selectedDates.filter((d) => !vacationDates.includes(d)).length} dní
                    </span>
                  </div>

                  {fsmError && (
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-[#FF5A7A]/15 text-rose-600 dark:text-[#FF5A7A] text-[11px] font-medium flex items-center gap-1.5">
                      <AlertCircle size={13} />
                      <span>{fsmError}</span>
                    </div>
                  )}

                  {fsmSuccess && (
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#10B981]/15 text-emerald-600 dark:text-[#10B981] text-[11px] font-medium flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>{fsmSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loadingFsm || selectedDates.filter((d) => !vacationDates.includes(d)).length === 0}
                    className="w-full py-3 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                  >
                    {loadingFsm ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
                    <span>
                      {selectedDates.filter((d) => !vacationDates.includes(d)).length > 0
                        ? `Pridať voľné sloty do systému (${fsmStart}–${fsmEnd})${activePromoTag !== '0' ? ` so zľavou -${activePromoTag}%` : ''} pre (${selectedDates.filter((d) => !vacationDates.includes(d)).length}) dní`
                        : 'Vyberte dni v kalendári nižšie pre pridanie slotov'}
                    </span>
                  </button>
                </form>
              )}

              {/* 4. ZMAZAŤ SLOTY (INFO PANEL & 1-KLIK HROMADNÉ MAZANIE) */}
              {activeRadialTool === 'delete' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#0B0D22] dark:text-[#FFFFFF]">
                        Vyberte si sloty, ktoré chcete zmazať:
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70">
                        V kalendári nižšie sú zobrazené checkboxy namiesto košov. Kliknutím na deň označíte sloty.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allAvailableIds = allCalendarEvents
                            .filter((ev) => ev.start?.dateTime && getLocalDateKey(new Date(ev.start.dateTime)) >= todayIso)
                            .map((ev) => ev.id);
                          setSelectedSlotIdsToDelete(allAvailableIds);
                        }}
                        className="text-[11px] font-semibold text-[#6633EE] dark:text-[#A78BFA] hover:underline cursor-pointer"
                      >
                        Vybrať všetky v mesiaci
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSlotIdsToDelete([])}
                        className="text-[11px] font-semibold text-[#64748B] hover:underline cursor-pointer"
                      >
                        Odznačiť
                      </button>
                    </div>
                  </div>

                  {/* Informačný blok s počtom vybratých slotov */}
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-xs font-bold text-[#0B0D22] dark:text-[#FFFFFF]">
                        Množstvo vybratých slotov na zmazanie:
                      </span>
                    </div>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                      {selectedSlotIdsToDelete.length} slotov
                    </span>
                  </div>

                  {/* Tlačidlo na vymazanie všetkého vybratého na jeden klik */}
                  <button
                    type="button"
                    disabled={selectedSlotIdsToDelete.length === 0 || loadingBulkDelete}
                    onClick={() => handleBulkDeleteSlots()}
                    className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                  >
                    {loadingBulkDelete ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    <span>
                      {selectedSlotIdsToDelete.length > 0
                        ? `Jedným klikom vymazať vybrané (${selectedSlotIdsToDelete.length}) slotov`
                        : 'Vyklikajte dni v kalendári nižšie pre označenie na zmazanie'}
                    </span>
                  </button>
                </div>
              )}

              {/* 5. DOVOLENKA & VOĽNO */}
              {activeRadialTool === 'vacation' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/70">
                    💡 Klikaním na dni v kalendári nižšie ich označíte / odznačíte ako <strong>Voľno</strong>.
                  </p>
                  {(() => {
                    const upcomingVacations = vacationDates.filter((v) => v >= todayIso).sort();
                    if (upcomingVacations.length === 0) {
                      return (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-xs text-[#64748B] text-center">
                          Zatiaľ nemáte vybrané žiadne nadchádzajúce voľno.
                        </div>
                      );
                    }
                    return (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            Vybrané voľno ({upcomingVacations.length}):
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setVacationDates((prev) => {
                                const next = prev.filter((v) => v < todayIso);
                                try {
                                  localStorage.setItem('zenflow_admin_vacations', JSON.stringify(next));
                                } catch {}
                                return next;
                              });
                            }}
                            className="text-[11px] font-semibold text-[#64748B] hover:text-rose-500 hover:underline cursor-pointer"
                          >
                            Zrušiť všetko
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                          {upcomingVacations.map((v) => (
                            <span
                              key={v}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-700 dark:text-amber-300 shadow-2xs"
                            >
                              <span>{formatFullDateText(v)}</span>
                              <button
                                type="button"
                                onClick={() => toggleVacation(v)}
                                className="text-amber-600 hover:text-rose-600 dark:text-amber-400 dark:hover:text-rose-400 p-0.5 rounded cursor-pointer"
                                title="Odstrániť voľno"
                              >
                                <X size={13} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => setActiveRadialTool(null)}
                    className="w-full py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#CA8A04] text-black font-bold text-xs transition cursor-pointer shadow-xs active:scale-98"
                  >
                    Hotovo
                  </button>
                </div>
              )}

              {/* 6. PRIAMA REZERVÁCIA KLIENTA */}
              {activeRadialTool === 'direct' && (
                <div className="space-y-3.5">
                  <form onSubmit={handleCreateDirectBooking} className="space-y-3">
                    {/* LIVE AUTOCOMPLETE PRE KLIENTA */}
                    <div className="relative">
                      <label className="block text-[11px] font-bold text-[#0B0D22] dark:text-[#FFFFFF] mb-1">
                        Vyhľadať / Zadať klienta:
                      </label>
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-2.5 text-[#64748B]" />
                        <input
                          type="text"
                          required
                          placeholder="Píšte meno alebo e-mail klienta (napr. Ján Novák)"
                          value={clientSearchInput}
                          onChange={(e) => {
                            setClientSearchInput(e.target.value);
                            setDirectName(e.target.value);
                            setShowClientSuggestions(true);
                          }}
                          onFocus={() => setShowClientSuggestions(true)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50 dark:bg-[#010314] text-xs font-medium focus:outline-none focus:border-[#8B5CF6]"
                        />
                      </div>

                      {showClientSuggestions && filteredClientSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xl divide-y divide-[#E2E8F0] dark:divide-[#2B2F49] overflow-hidden max-h-40 overflow-y-auto">
                          {filteredClientSuggestions.map((c) => (
                            <button
                              type="button"
                              key={`sugg-${c.id}`}
                              onClick={() => selectClientSuggestion(c)}
                              className="w-full p-2 text-left hover:bg-slate-50 dark:hover:bg-[#010314] transition cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-semibold text-[#0B0D22] dark:text-[#FFFFFF]">{c.full_name || 'Klient'}</p>
                                <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60">{c.email}</p>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#8B5CF6]/15 text-[#8B5CF6]">
                                Vybrať
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Email:</label>
                        <input
                          type="email"
                          required
                          value={directEmail}
                          onChange={(e) => setDirectEmail(e.target.value)}
                          placeholder="klient@email.sk"
                          className="w-full p-2 rounded-xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50 dark:bg-[#010314] text-xs font-medium focus:outline-none focus:border-[#8B5CF6]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Telefón:</label>
                        <input
                          type="tel"
                          value={directPhone}
                          onChange={(e) => setDirectPhone(e.target.value)}
                          placeholder="+421 9..."
                          className="w-full p-2 rounded-xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50 dark:bg-[#010314] text-xs font-medium focus:outline-none focus:border-[#8B5CF6]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Čas:</label>
                        <select
                          value={directTime}
                          onChange={(e) => setDirectTime(e.target.value)}
                          className="w-full p-2 rounded-xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50 dark:bg-[#010314] text-xs font-bold focus:outline-none"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={`dir-time-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Dĺžka:</label>
                        <select
                          value={directDuration}
                          onChange={(e) => setDirectDuration(parseInt(e.target.value, 10))}
                          className="w-full p-2 rounded-xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50 dark:bg-[#010314] text-xs font-bold focus:outline-none"
                        >
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                          <option value={90}>90 min</option>
                          <option value={120}>120 min</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Procedúra:</label>
                        <select
                          value={directType}
                          onChange={(e) => setDirectType(e.target.value)}
                          className="w-full p-2 rounded-xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50 dark:bg-[#010314] text-xs font-bold focus:outline-none"
                        >
                          <option value="CLASSIC">Klasická masáž</option>
                          <option value="SPORT">Športová masáž</option>
                          <option value="RELAX">Relaxačná masáž</option>
                          <option value="AROMA">Aromaterapia</option>
                          <option value="VIP">VIP 18+ Senzuálna</option>
                          <option value="CUPPING">Bankovanie</option>
                          <option value="PREGNANCY">Tehotenská masáž</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Cena (€):</label>
                        <input
                          type="number"
                          value={directPrice}
                          onChange={(e) => setDirectPrice(e.target.value)}
                          className="w-full p-2 rounded-xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-slate-50 dark:bg-[#010314] text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    {directError && (
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-[#FF5A7A]/15 text-rose-600 dark:text-[#FF5A7A] text-[11px] font-medium flex items-center gap-1.5 border border-rose-200 dark:border-[#FF5A7A]/30">
                        <AlertCircle size={13} />
                        <span>{directError}</span>
                      </div>
                    )}

                    {directSuccess && (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#10B981]/15 text-emerald-600 dark:text-[#10B981] text-[11px] font-medium flex items-center gap-1.5 border border-emerald-200 dark:border-[#10B981]/30">
                        <CheckCircle2 size={13} />
                        <span>{directSuccess}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loadingDirect}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition active:scale-98 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loadingDirect ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                      <span>Vytvoriť priamu rezerváciu</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </FuturisticRadialMenu>

        {/* 🚀 2. PLNOFORMÁTOVÝ VEĽKÝ KALENDÁR (100% ŠÍRKA) */}
        <div className="calendar-container w-full p-2.5 sm:p-5 lg:p-6 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm space-y-3 sm:space-y-4 relative">
        
        {/* Hlavička kalendára */}
        <div className="border-b border-[#E2E8F0] dark:border-[#2B2F49] pb-3.5 space-y-2.5">
          
          {/* NÁZOV MESIACA */}
          <div className="flex items-center gap-2">
            <Calendar size={22} className="text-[#6633EE] dark:text-[#A78BFA]" />
            <h2 className="font-semibold text-lg sm:text-xl text-[#0B0D22] dark:text-[#FFFFFF]">
              {language === 'sk' ? monthNamesSK[calMonth] : monthNamesEN[calMonth]} {calYear}
            </h2>
          </div>

          {/* V JEDNEJ ÚROVNI (V ROVNAKEJ LINKE): VĽAVO SUITCASE & HOME | VPRAVO DNES A ŠÍPKY */}
          <div className="flex items-center justify-between gap-2 w-full">
            {/* ĽAVÁ STRANA: SUITCASE & HOME */}
            <div className="flex items-center gap-1.5">
              {/* RÝCHLA PREDVOĽBA: PO PRÁCI (Briefcase - Modrá) */}
              <button
                type="button"
                onClick={() => applyPresetTodayAfterWork('17:00')}
                className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white border border-blue-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-xs active:scale-95"
                title={
                  activeRadialTool === 'vacation'
                    ? 'Nastaviť dnešok ako voľno'
                    : activeRadialTool === 'delete'
                    ? 'Označiť dnešné sloty na zmazanie'
                    : language === 'sk'
                    ? 'Rýchla predvoľba: Po práci (Dnes 17:00 – 20:00)'
                    : 'Quick preset: After work (Today 17:00 – 20:00)'
                }
                aria-label={language === 'sk' ? 'Po práci' : 'After work'}
              >
                <Briefcase size={16} />
              </button>

              {/* RÝCHLA PREDVOĽBA: HOME OFFICE (HomeIcon - Smaragdová) */}
              <button
                type="button"
                onClick={() => {
                  if (!activeRadialTool) {
                    setActiveRadialTool('timeslot');
                  }
                  setShowHomeOfficeModal(true);
                }}
                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white border border-emerald-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-xs active:scale-95"
                title={
                  activeRadialTool === 'vacation'
                    ? 'Rýchly výber dní pre voľno'
                    : activeRadialTool === 'delete'
                    ? 'Rýchly výber dní na zmazanie'
                    : language === 'sk'
                    ? 'Rýchla predvoľba: Home Office (09:00 – 15:00)'
                    : 'Quick preset: Home Office (09:00 – 15:00)'
                }
                aria-label="Home Office"
              >
                <HomeIcon size={16} />
              </button>
            </div>

            {/* PRAVÁ STRANA: NAVIGÁCIA (ŠÍPKY A DNES) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setCalCurrentDate(new Date(calYear, calMonth - 1, 1))}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#010314] text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-white transition cursor-pointer border border-[#E2E8F0] dark:border-[#2B2F49]"
                title={language === 'sk' ? 'Predchádzajúci mesiac' : 'Previous month'}
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() => setCalCurrentDate(new Date())}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#010314] text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE] transition cursor-pointer shadow-2xs"
              >
                {language === 'sk' ? 'Dnes' : 'Today'}
              </button>

              <button
                type="button"
                onClick={() => setCalCurrentDate(new Date(calYear, calMonth + 1, 1))}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#010314] text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-white transition cursor-pointer border border-[#E2E8F0] dark:border-[#2B2F49]"
                title={language === 'sk' ? 'Nasledujúci mesiac' : 'Next month'}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Názvy dní v týždni */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 text-center font-semibold text-[11px] sm:text-xs text-[#64748B] dark:text-[#C7CAE0]/70 pb-1">
          {DAYS_OF_WEEK.map((d) => (
            <span key={`dayname-${d.id}`} className="hidden sm:inline">{language === 'sk' ? d.sk : d.en}</span>
          ))}
          {DAYS_OF_WEEK.map((d) => (
            <span key={`dayname-short-${d.id}`} className="sm:hidden">{language === 'sk' ? d.skShort : d.enShort}</span>
          ))}
        </div>

        {/* Mriežka dní (Plná šírka s veľkými bunkami) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
          {emptyCells.map((_, i) => (
            <div key={`empty-cell-${i}`} className="min-h-[64px] sm:min-h-[85px] md:min-h-[95px] rounded-xl sm:rounded-2xl opacity-0 pointer-events-none" />
          ))}

          {daysArray.map((day) => {
            const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isPast = dateKey < todayIso;
            const isToday = dateKey === todayIso;
            const isVacation = vacationDates.includes(dateKey);

            const dayEvents = eventsByDateKey[dateKey] || { fsm: [], bookings: [] };
            const daySlotIds = [
              ...dayEvents.fsm.map((e: any) => e.id),
              ...dayEvents.bookings.map((e: any) => e.id),
            ];
            const fsmCount = dayEvents.fsm.length;
            const bookingCount = dayEvents.bookings.length;
            const hasSlots = daySlotIds.length > 0;
            const isDeleteMode = activeRadialTool === 'delete';
            const isDirectMode = activeRadialTool === 'direct';
            
            const selectedSlotIdsInDay = daySlotIds.filter((id) => selectedSlotIdsToDelete.includes(id));
            const isDayFullyDeleteSelected = hasSlots && selectedSlotIdsInDay.length === daySlotIds.length;
            const isDayPartiallyDeleteSelected = selectedSlotIdsInDay.length > 0 && !isDayFullyDeleteSelected;
            const isDirectSelected = isDirectMode && directDate === dateKey;
            const customDiscount = dateCustomDiscounts[dateKey];

            const isSelected = isDeleteMode
              ? isDayFullyDeleteSelected
              : isDirectMode
              ? isDirectSelected
              : selectedDates.includes(dateKey);

            return (
              <div
                key={`calendar-cell-${dateKey}`}
                onClick={() => handleDayClick(dateKey)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (dateKey >= todayIso) {
                    setScheduleModalDate(dateKey);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropPromoTag(e, dateKey)}
                title={!isPast ? (language === 'sk' ? 'Dvojklik pre hodinový rozpis (07:00–23:00)' : 'Double click for hourly schedule') : undefined}
                className={`group min-h-[64px] sm:min-h-[85px] md:min-h-[95px] p-1 sm:p-2 md:p-2.5 rounded-xl sm:rounded-2xl border flex flex-col justify-between text-left transition-all duration-200 relative select-none overflow-hidden ${
                  isPast
                    ? 'opacity-35 border-transparent bg-slate-100/50 dark:bg-[#010314]/30 cursor-not-allowed text-[#94A3B8]'
                    : isDeleteMode
                    ? isDayFullyDeleteSelected
                      ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/40 shadow-sm cursor-pointer'
                      : isDayPartiallyDeleteSelected
                      ? 'bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/30 cursor-pointer'
                      : hasSlots
                      ? 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-300 dark:border-rose-900/40 cursor-pointer'
                      : 'bg-slate-50/70 dark:bg-[#010314]/60 border-[#E2E8F0] dark:border-[#2B2F49] opacity-40 cursor-not-allowed'
                    : isDirectSelected
                    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] shadow-sm ring-2 ring-[#8B5CF6]/40 cursor-pointer'
                    : isVacation
                    ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/40 ring-1 ring-amber-500/30 cursor-pointer'
                    : activeRadialTool === 'tags'
                    ? fsmCount > 0
                      ? isSelected
                        ? 'bg-[#F97316]/15 border-[#F97316] ring-2 ring-[#F97316]/40 shadow-sm cursor-pointer'
                        : 'bg-orange-500/5 hover:bg-orange-500/15 border-[#F97316]/40 hover:border-[#F97316] cursor-pointer'
                      : 'opacity-30 bg-slate-100/40 dark:bg-[#010314]/30 border-dashed border-[#E2E8F0] dark:border-[#2B2F49] cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#6633EE]/10 dark:bg-[#6633EE]/20 border-[#6633EE] shadow-sm ring-2 ring-[#6633EE]/40 cursor-pointer'
                    : 'bg-slate-50/70 dark:bg-[#010314]/60 border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE]/60 hover:bg-slate-100 dark:hover:bg-[#010314] cursor-pointer'
                }`}
              >
                {/* Horný riadok: Číslo dňa, Akcia a Ikonka Času / Checkbox Mazania */}
                <div className="flex items-start justify-between w-full gap-0.5 sm:gap-1">
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <span className={`text-xs sm:text-sm font-bold tabular-nums ${
                      isDeleteMode && isDayFullyDeleteSelected
                        ? 'text-rose-600 dark:text-rose-400'
                        : isDeleteMode && isDayPartiallyDeleteSelected
                        ? 'text-amber-600 dark:text-amber-400'
                        : isDirectSelected
                        ? 'text-[#8B5CF6] dark:text-[#A78BFA]'
                        : isSelected 
                        ? 'text-[#6633EE] dark:text-[#A78BFA]' 
                        : isToday 
                        ? 'text-[#6633EE] dark:text-[#A78BFA]' 
                        : 'text-[#0B0D22] dark:text-[#FFFFFF]'
                    }`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#6633EE] shrink-0" title="Dnes" />
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    {/* Priradená akcia (z reálnych Google Calendar FSM slotov alebo custom výberu) */}
                    {!isDeleteMode && (() => {
                      const fsmDiscounts = dayEvents.fsm
                        .map((e) => extractFsmDiscount(e.summary))
                        .filter((d): d is number => d !== null);

                      if (fsmDiscounts.length > 0) {
                        const uniqueDiscounts = Array.from(new Set(fsmDiscounts));
                        if (uniqueDiscounts.length === 1) {
                          return (
                            <span
                              className={`text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded-md border shadow-2xs ${getDiscountBadgeStyle(uniqueDiscounts[0], 'subtle')}`}
                              title={`Akcia -${uniqueDiscounts[0]}%`}
                            >
                              -{uniqueDiscounts[0]}%
                            </span>
                          );
                        } else {
                          // Viacero rôznych zliav v daný deň: zobrazíme len štýlový info tag "%"
                          return (
                            <span
                              className="text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded-md border border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-300 shadow-2xs flex items-center justify-center min-w-[20px]"
                              title={`Rôzne zľavy v tento deň (${uniqueDiscounts.map((d) => `-${d}%`).join(', ')}). Kliknite pre podrobný rozpis hodín.`}
                            >
                              %
                            </span>
                          );
                        }
                      }

                      if (customDiscount && customDiscount !== '0') {
                        return (
                          <span className={`text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded-md border shadow-2xs ${getDiscountBadgeStyle(customDiscount, 'subtle')}`}>
                            -{customDiscount}%
                          </span>
                        );
                      }

                      const daySlotDiscounts = Object.keys(slotCustomDiscounts).filter((k) => k.startsWith(dateKey));
                      if (daySlotDiscounts.length > 0) {
                        const firstVal = slotCustomDiscounts[daySlotDiscounts[0]];
                        return (
                          <span className={`text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded-md border shadow-2xs ${getDiscountBadgeStyle(firstVal, 'subtle')}`}>
                            -{firstVal}% ({daySlotDiscounts.length}x)
                          </span>
                        );
                      }
                      return null;
                    })()}

                    {/* V REŽIME MAZANIA: CHECKBOX PRE CELÝ DEŇ */}
                    {isDeleteMode && hasSlots && (
                      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isDayFullyDeleteSelected}
                          onChange={() => {
                            if (isDayFullyDeleteSelected) {
                              setSelectedSlotIdsToDelete((prev) => prev.filter((id) => !daySlotIds.includes(id)));
                            } else {
                              setSelectedSlotIdsToDelete((prev) => Array.from(new Set([...prev, ...daySlotIds])));
                            }
                          }}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600 shrink-0"
                          title={isDayFullyDeleteSelected ? "Odznačiť celý deň" : "Označiť všetky sloty dňa na zmazanie"}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Dovolenka Badge */}
                {isVacation && (
                  <div className="px-1 sm:px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[8px] sm:text-[9.5px] font-bold flex items-center gap-1">
                    <Palmtree size={10} className="sm:w-3 sm:h-3" />
                    <span>Dovolenka</span>
                  </div>
                )}

                {/* Indikátory slotov a rezervácií */}
                <div className="space-y-0.5 sm:space-y-1 w-full pt-0.5 sm:pt-1">
                  {isDeleteMode && hasSlots ? (
                    <div className={`flex items-center justify-between px-1 sm:px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold border transition ${
                      isDayFullyDeleteSelected
                        ? 'bg-rose-600 text-white border-rose-600'
                        : isDayPartiallyDeleteSelected
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}>
                      <span className="truncate">
                        <span className="sm:hidden font-mono">
                          {isDayFullyDeleteSelected ? 'Všetky' : isDayPartiallyDeleteSelected ? `${selectedSlotIdsInDay.length}/${daySlotIds.length}` : `${daySlotIds.length}x`}
                        </span>
                        <span className="hidden sm:inline">
                          {isDayFullyDeleteSelected
                            ? `Všetkých ${daySlotIds.length}`
                            : isDayPartiallyDeleteSelected
                            ? `Vybraté ${selectedSlotIdsInDay.length}/${daySlotIds.length}`
                            : `${daySlotIds.length} slotov`}
                        </span>
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono font-bold shrink-0">DEL</span>
                    </div>
                  ) : (
                    <>
                      {fsmCount > 0 && (
                        <div className="flex items-center justify-between px-1 sm:px-1.5 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981] text-[9px] sm:text-[10px] font-bold border border-[#10B981]/30">
                          <span className="truncate">
                            <span className="sm:hidden font-mono">{fsmCount}x</span>
                            <span className="hidden sm:inline">{fsmCount} voľných</span>
                          </span>
                          <span className="text-[8px] sm:text-[9px] font-mono shrink-0">FSM</span>
                        </div>
                      )}

                      {bookingCount > 0 && (
                        <div className="flex items-center justify-between px-1 sm:px-1.5 py-0.5 rounded-md bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] text-[9px] sm:text-[10px] font-bold border border-[#6633EE]/30">
                          <span className="truncate">
                            <span className="sm:hidden font-mono">{bookingCount}x</span>
                            <span className="hidden sm:inline">{bookingCount} rezerv.</span>
                          </span>
                          <span className="text-[8px] sm:text-[9px] font-mono shrink-0">RES</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda pod kalendárom */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-[#2B2F49] text-xs text-[#64748B] dark:text-[#C7CAE0]/70 gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span>{language === 'sk' ? 'Voľný FSM blok' : 'Open FSM Slot'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6633EE]" />
              <span>{language === 'sk' ? 'Obsadená rezervácia' : 'Booked Slot'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>{language === 'sk' ? 'Dovolenka' : 'Vacation'}</span>
            </div>
          </div>

          <span className="text-[11px] italic">
            {language === 'sk' ? '💡 Dvojklik na deň zobrazí hodinový rozpis 07:00–23:00' : '💡 Double click day for 07:00–23:00 hourly schedule'}
          </span>
        </div>

      </div>

      {/* 🚀 5. HODINOVÝ HARMONOGRAM DŇA (07:00 – 23:00 MODAL) */}
      {scheduleModalDate && (
        <div className="fixed inset-0 z-50 bg-[#0B0D22]/60 dark:bg-[#010314]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl max-w-lg w-full space-y-4 text-left animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2B2F49] pb-3 shrink-0">
              <div>
                <h3 className="font-semibold text-base text-[#0B0D22] dark:text-[#FFFFFF] flex items-center gap-2">
                  <Clock size={18} className="text-[#6633EE] dark:text-[#A78BFA]" />
                  <span>Hodinový harmonogram: {formatFullDateText(scheduleModalDate)}</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60">
                  Časový rozsah od 07:00 do 23:00 hod.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setScheduleModalDate(null)}
                className="text-[#64748B] hover:text-[#0B0D22] dark:hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto no-scrollbar space-y-2 pr-1 flex-1">
              {(() => {
                const dayData = eventsByDateKey[scheduleModalDate] || { fsm: [], bookings: [] };
                const dayEventsList = [
                  ...dayData.fsm.map((e) => ({ ...e, typeCat: 'fsm' })),
                  ...dayData.bookings.map((e) => ({ ...e, typeCat: 'booking' })),
                ];
                const isDeleteMode = activeRadialTool === 'delete';

                return HOURLY_TIMELINE.map((hourStr) => {
                  const hourNum = parseInt(hourStr.split(':')[0], 10);
                  
                  const matchingEvent = dayEventsList.find((ev) => {
                    if (!ev.start?.dateTime) return false;
                    const evStartHour = new Date(ev.start.dateTime).getHours();
                    const evEndHour = new Date(ev.end?.dateTime || ev.start.dateTime).getHours();
                    return evStartHour === evEndHour
                      ? hourNum === evStartHour
                      : (hourNum >= evStartHour && hourNum < evEndHour);
                  });

                  if (matchingEvent) {
                    const isFsm = matchingEvent.typeCat === 'fsm';
                    const startTime = format24hTimeText(matchingEvent.start?.dateTime);
                    const endTime = format24hTimeText(matchingEvent.end?.dateTime);
                    const fsmDiscount = isFsm ? extractFsmDiscount(matchingEvent.summary) : null;
                    const isSlotSelectedForDelete = selectedSlotIdsToDelete.includes(matchingEvent.id);

                    return (
                      <div
                        key={`sched-${hourStr}`}
                        onClick={() => {
                          if (isDeleteMode) {
                            toggleSlotSelectionToDelete(matchingEvent.id);
                          }
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition select-none ${
                          isDeleteMode
                            ? isSlotSelectedForDelete
                              ? 'bg-rose-500/15 border-rose-500/50 ring-1 ring-rose-500/40 text-[#0B0D22] dark:text-[#FFFFFF] cursor-pointer'
                              : 'bg-rose-500/5 border-rose-500/20 hover:border-rose-400 text-[#0B0D22] dark:text-[#FFFFFF] cursor-pointer'
                            : isFsm
                            ? fsmDiscount
                              ? `${getDiscountBadgeStyle(fsmDiscount, 'subtle')} text-[#0B0D22] dark:text-[#FFFFFF]`
                              : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#0B0D22] dark:text-[#FFFFFF] hover:border-[#10B981]/60'
                            : 'bg-[#6633EE]/10 border-[#6633EE]/30 text-[#0B0D22] dark:text-[#FFFFFF] hover:border-[#6633EE]/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {isDeleteMode && (
                            <input
                              type="checkbox"
                              checked={isSlotSelectedForDelete}
                              onChange={() => toggleSlotSelectionToDelete(matchingEvent.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600 shrink-0"
                            />
                          )}
                          <span className="text-xs font-mono font-bold w-11 text-[#6633EE] dark:text-[#A78BFA] shrink-0">
                            {hourStr}
                          </span>
                          <div className="truncate flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              isFsm 
                                ? fsmDiscount 
                                  ? `${getDiscountBadgeStyle(fsmDiscount, 'subtle')} border font-mono` 
                                  : 'bg-[#10B981]/20 text-[#10B981]' 
                                : 'bg-[#6633EE]/20 text-[#6633EE] dark:text-[#A78BFA]'
                            }`}>
                              {isFsm ? (fsmDiscount ? `FSM_D${fsmDiscount}` : 'FSM') : 'Rezervácia'}
                            </span>

                            {fsmDiscount && (
                              <span className={`text-[10px] font-bold tracking-tight px-2 py-0.5 rounded-md shadow-2xs ${getDiscountBadgeStyle(fsmDiscount, 'solid')}`}>
                                -{fsmDiscount}%
                              </span>
                            )}

                            <span className="text-[11px] text-[#64748B] font-mono">({startTime}–{endTime})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* MOŽNOSŤ PRIRADIŤ / ZMENIŤ / ODOBRAŤ AKCIOVÝ TAG PRE TENTO FSM SLOT */}
                          {isFsm && (
                            <div className="flex items-center gap-1">
                              {updatingDiscountSlotId === `${scheduleModalDate}_${hourStr}` ? (
                                <Loader2 size={13} className="animate-spin text-[#F97316]" />
                              ) : (
                                <select
                                  value={fsmDiscount ? String(fsmDiscount) : '0'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const curVal = fsmDiscount ? String(fsmDiscount) : '0';
                                    if (val === curVal) return;
                                    if (scheduleModalDate) {
                                      handleUpdateHourDiscount(scheduleModalDate, hourStr, val, matchingEvent.id);
                                    }
                                  }}
                                  className="py-1 px-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2B2F49] bg-white dark:bg-[#0B0D22] text-[10px] font-bold cursor-pointer focus:outline-none focus:border-[#F97316]"
                                  title="Zmeniť akciu / zľavu pre túto hodinu"
                                >
                                  <option value="0">Plná cena (0%)</option>
                                  <option value="5">-5% Akcia</option>
                                  <option value="10">-10% Akcia</option>
                                  <option value="15">-15% Akcia</option>
                                  <option value="20">-20% Akcia</option>
                                  <option value="30">-30% Akcia</option>
                                  <option value="50">-50% Akcia</option>
                                  <option value="75">-75% Akcia</option>
                                  <option value="100">-100% Akcia</option>
                                </select>
                              )}
                            </div>
                          )}

                          {isDeleteMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlot(matchingEvent.id);
                              }}
                              disabled={deletingSlotId === matchingEvent.id}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-[#FF5A7A]/15 border border-rose-200 dark:border-[#FF5A7A]/30 text-rose-600 dark:text-[#FF5A7A] hover:bg-rose-100 transition cursor-pointer"
                              title="Vymazať z kalendára"
                            >
                              {deletingSlotId === matchingEvent.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`sched-${hourStr}`}
                      className="p-2 rounded-xl bg-slate-50/60 dark:bg-[#010314]/40 border border-[#E2E8F0]/60 dark:border-[#2B2F49]/40 flex items-center justify-between text-xs text-[#64748B] dark:text-[#C7CAE0]/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold w-12 text-slate-400 dark:text-slate-500">{hourStr}</span>
                        <span className="text-[11px] italic">Voľno</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#2B2F49] flex items-center justify-between gap-2 shrink-0">
              {activeRadialTool === 'delete' ? (
                selectedSlotIdsToDelete.length > 0 ? (
                  <button
                    type="button"
                    disabled={loadingBulkDelete}
                    onClick={() => handleBulkDeleteSlots()}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-40"
                  >
                    {loadingBulkDelete ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    <span>Vymazať označené ({selectedSlotIdsToDelete.length})</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-rose-500/80 italic font-medium">
                    💡 Zaškrtnite sloty, ktoré chcete vymazať
                  </span>
                )
              ) : (
                <span className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/60 italic">
                  Prehľad a správa zliav
                </span>
              )}

              <button
                type="button"
                onClick={() => setScheduleModalDate(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#010314] text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE] transition cursor-pointer"
              >
                Zavrieť
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🚀 6. MODÁL PRE VÝBER SLOTU NA ZMAZANIE (DELETE PICKER) */}
      {deletePickerDate && (
        <div className="fixed inset-0 z-50 bg-[#0B0D22]/60 dark:bg-[#010314]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl max-w-md w-full space-y-4 text-left animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2B2F49] pb-3">
              <h3 className="font-semibold text-sm text-[#0B0D22] dark:text-[#FFFFFF] flex items-center gap-2">
                <Trash2 size={16} className="text-rose-500" />
                <span>Zmazať slot: {formatFullDateText(deletePickerDate)}</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeletePickerDate(null)}
                className="text-[#64748B] hover:text-[#0B0D22] dark:hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60">
              Vyberte konkrétny termín, ktorý si želáte odstrániť z Google Kalendára:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(() => {
                const dayData = eventsByDateKey[deletePickerDate] || { fsm: [], bookings: [] };
                const allSlots = [
                  ...dayData.fsm.map((e) => ({ ...e, cat: 'fsm' })),
                  ...dayData.bookings.map((e) => ({ ...e, cat: 'booking' })),
                ];

                if (allSlots.length === 0) {
                  return <p className="text-xs text-slate-400 py-4 text-center">Žiadne sloty.</p>;
                }

                return allSlots.map((item) => (
                  <div
                    key={`del-pick-${item.id}`}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#0B0D22] dark:text-[#FFFFFF] truncate">{item.summary}</p>
                      <p className="text-[11px] text-[#64748B] font-mono">
                        {format24hTimeText(item.start?.dateTime)} – {format24hTimeText(item.end?.dateTime)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await handleDeleteSlot(item.id);
                        setDeletePickerDate(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-500 text-white font-semibold text-[11px] hover:bg-rose-600 transition cursor-pointer"
                    >
                      Vymazať
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 7. MODÁL: ČASOVÉ OKNO PRE VÝBER SLOTU S AKCIOVÝM TAGOM (DRAG & DROP) */}
      {dropPromoModal && (
        <div className="fixed inset-0 z-50 bg-[#0B0D22]/60 dark:bg-[#010314]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl max-w-md w-full space-y-4 text-left animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2B2F49] pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl font-bold tracking-tight text-xs flex items-center justify-center border shadow-xs ${getDiscountBadgeStyle(dropPromoModal.tagValue, 'subtle')}`}>
                  {dropPromoModal.tagLabel}
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-[#0B0D22] dark:text-[#FFFFFF]">
                    Vybrať sloty pre akciu {dropPromoModal.tagLabel}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60">
                    Deň: {formatFullDateText(dropPromoModal.dateKey)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDropPromoModal(null)}
                className="text-[#64748B] hover:text-[#0B0D22] dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/70 shrink-0">
              Vyberte konkrétne hodiny v rámci otvorených termínov, na ktoré sa má aplikovať zľava <strong>{dropPromoModal.tagLabel}</strong> (blok sa automaticky rozdelí):
            </p>

            {/* Zoznam 1-hodinových segmentov v rámci otvorených FSM blokov */}
            <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 max-h-72">
              {(() => {
                const dayFsmEvents = eventsByDateKey[dropPromoModal.dateKey]?.fsm || [];
                
                type AvailableHour = {
                  hourStr: string;
                  label: string;
                  currentSummary: string;
                  currentDiscount: number | null;
                  eventId: string;
                };

                const availableHours: AvailableHour[] = [];
                dayFsmEvents.forEach((ev) => {
                  if (!ev.start?.dateTime || !ev.end?.dateTime) return;
                  const startH = new Date(ev.start.dateTime).getHours();
                  const endH = new Date(ev.end.dateTime).getHours();
                  const disc = extractFsmDiscount(ev.summary);

                  for (let h = startH; h < endH; h++) {
                    const hh = String(h).padStart(2, '0');
                    const hhNext = String(h + 1).padStart(2, '0');
                    availableHours.push({
                      hourStr: `${hh}:00`,
                      label: `${hh}:00 – ${hhNext}:00`,
                      currentSummary: ev.summary || 'FSM',
                      currentDiscount: disc,
                      eventId: ev.id,
                    });
                  }
                });

                if (availableHours.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#010314] text-center text-xs text-[#64748B] space-y-1 border border-[#E2E8F0] dark:border-[#2B2F49]">
                      <p className="font-semibold text-rose-500">V tento deň nie sú žiadne voľné FSM sloty.</p>
                      <p className="text-[11px]">Akciové tagy je možné priradiť iba k existujúcim voľným termínom.</p>
                    </div>
                  );
                }

                return availableHours.map((slot) => {
                  const isChecked = dropPromoModal.selectedHours.includes(slot.hourStr);

                  const toggleHour = () => {
                    setDropPromoModal((prev) => {
                      if (!prev) return null;
                      const next = prev.selectedHours.includes(slot.hourStr)
                        ? prev.selectedHours.filter((h) => h !== slot.hourStr)
                        : [...prev.selectedHours, slot.hourStr].sort();
                      return { ...prev, selectedHours: next };
                    });
                  };

                  return (
                    <div
                      key={`drop-fsm-hour-${slot.hourStr}`}
                      onClick={toggleHour}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition cursor-pointer select-none ${
                        isChecked
                          ? `${getDiscountBadgeStyle(dropPromoModal.tagValue, 'subtle')} ring-1`
                          : 'bg-slate-50 dark:bg-[#010314] border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#F97316]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={toggleHour}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#0B0D22] dark:text-[#FFFFFF]">
                              {slot.label}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                              slot.currentDiscount
                                ? `${getDiscountBadgeStyle(slot.currentDiscount, 'subtle')} font-mono`
                                : 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30'
                            }`}>
                              {slot.currentSummary}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isChecked && (
                        <span className={`text-[11px] font-bold tracking-tight px-2 py-0.5 rounded-md shadow-xs ${getDiscountBadgeStyle(dropPromoModal.tagValue, 'solid')}`}>
                          {dropPromoModal.tagLabel}
                        </span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Spodné tlačidlá */}
            <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#2B2F49] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const dayFsmEvents = eventsByDateKey[dropPromoModal.dateKey]?.fsm || [];
                    const allHours: string[] = [];
                    dayFsmEvents.forEach((ev) => {
                      if (!ev.start?.dateTime || !ev.end?.dateTime) return;
                      const startH = new Date(ev.start.dateTime).getHours();
                      const endH = new Date(ev.end.dateTime).getHours();
                      for (let h = startH; h < endH; h++) {
                        allHours.push(`${String(h).padStart(2, '0')}:00`);
                      }
                    });
                    setDropPromoModal((prev) => (prev ? { ...prev, selectedHours: Array.from(new Set(allHours)).sort() } : null));
                  }}
                  className="text-[11px] font-semibold text-[#6633EE] dark:text-[#A78BFA] hover:underline cursor-pointer"
                >
                  Vybrať všetky hodiny
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const dateK = dropPromoModal.dateKey;
                    const updated = { ...slotCustomDiscounts };
                    Object.keys(updated).forEach((k) => {
                      if (k.startsWith(dateK)) delete updated[k];
                    });
                    setSlotCustomDiscounts(updated);
                    await handleUpdateDatesDiscount([dateK], '0');
                    setDropPromoModal(null);
                  }}
                  className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                >
                  ❌ Odobrať akciu zo dňa
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDropPromoModal(null)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#010314] text-xs font-semibold text-[#64748B] hover:text-[#0B0D22] dark:hover:text-white transition cursor-pointer"
                >
                  Zrušiť
                </button>
                <button
                  type="button"
                  disabled={dropPromoModal.selectedHours.length === 0 || loadingBatchDiscount}
                  onClick={async () => {
                    setLoadingBatchDiscount(true);
                    try {
                      const res = await fetch('/api/admin/update-fsm-slot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          date: dropPromoModal.dateKey,
                          selectedHours: dropPromoModal.selectedHours,
                          discountPercent: dropPromoModal.tagValue,
                        }),
                      });
                      if (res.ok) {
                        await fetchCalendarOverview();
                      } else {
                        const d = await res.json();
                        alert(d.error || 'Chyba pri aplikácii zľavy na vybrané hodiny');
                      }
                    } catch {
                      alert('Chyba spojenia so serverom.');
                    } finally {
                      setLoadingBatchDiscount(false);
                      setDropPromoModal(null);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-white font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-40 ${getDiscountBadgeStyle(dropPromoModal.tagValue, 'solid')}`}
                >
                  {loadingBatchDiscount ? <Loader2 size={13} className="animate-spin" /> : null}
                  <span>Uložiť zľavu ({dropPromoModal.tagLabel}) pre ({dropPromoModal.selectedHours.length}) h</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: MÁM HOME OFFICE */}
      {showHomeOfficeModal && (
        <div className="fixed inset-0 z-50 bg-[#0B0D22]/60 dark:bg-[#010314]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl max-w-sm w-full space-y-4 text-left animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#0B0D22] dark:text-[#FFFFFF] flex items-center gap-1.5">
                <HomeIcon size={16} className="text-emerald-500 dark:text-emerald-400" />
                <span>
                  {activeRadialTool === 'vacation'
                    ? 'Nastaviť voľno / dovolenku'
                    : activeRadialTool === 'delete'
                    ? 'Označiť sloty na zmazanie'
                    : 'Mám Home Office (09:00–15:00)'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHomeOfficeModal(false)}
                className="text-[#64748B] hover:text-[#0B0D22] dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60">
              {activeRadialTool === 'vacation'
                ? 'Zvoľte rozsah dní pre nastavenie voľna:'
                : activeRadialTool === 'delete'
                ? 'Zvoľte rozsah dní pre hromadné označenie na zmazanie:'
                : 'Zvoľte rozsah pre otvorenie denných termínov:'}
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => applyPresetHomeOffice('today')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-[#010314] hover:border-emerald-500 hover:bg-emerald-500/5 border border-[#E2E8F0] dark:border-[#2B2F49] font-semibold text-xs text-left transition flex items-center justify-between cursor-pointer"
              >
                <span>Iba na dnešný deň</span>
                <ChevronRight size={14} className="text-emerald-500" />
              </button>
              <button
                type="button"
                onClick={() => applyPresetHomeOffice('this_week')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-[#010314] hover:border-emerald-500 hover:bg-emerald-500/5 border border-[#E2E8F0] dark:border-[#2B2F49] font-semibold text-xs text-left transition flex items-center justify-between cursor-pointer"
              >
                <span>Na celý tento týždeň (PO–PI)</span>
                <ChevronRight size={14} className="text-emerald-500" />
              </button>
              <button
                type="button"
                onClick={() => applyPresetHomeOffice('this_month')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-[#010314] hover:border-emerald-500 hover:bg-emerald-500/5 border border-[#E2E8F0] dark:border-[#2B2F49] font-semibold text-xs text-left transition flex items-center justify-between cursor-pointer"
              >
                <span>Na všetky pracovné dni v mesiaci</span>
                <ChevronRight size={14} className="text-emerald-500" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}