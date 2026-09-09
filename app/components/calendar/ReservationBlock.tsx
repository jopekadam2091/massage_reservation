'use client';

import React from 'react';
import { Clock, User, Phone, Tag, GripVertical, AlertCircle, Sparkles } from 'lucide-react';

export type ScheduleEvent = {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO string
  end: string;   // ISO string
  isFsm?: boolean;
  type?: 'Klasik' | 'VIP' | 'Aromaterapia' | 'Športová' | 'FSM' | string;
  durationMinutes?: number;
  clientName?: string;
  clientPhone?: string;
  price?: string;
  hasConflict?: boolean;
};

type Props = {
  event: ScheduleEvent;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, event: ScheduleEvent) => void;
  onClick?: (event: ScheduleEvent) => void;
  language: string;
  compact?: boolean;
};

export default function ReservationBlock({
  event,
  isDraggable = true,
  onDragStart,
  onClick,
  language,
  compact = false,
}: Props) {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);

  const startTimeStr = startDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = endDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

  const durationMin = event.durationMinutes || Math.round((endDate.getTime() - startDate.getTime()) / 60000);

  // Procedure visual styling (Unified Spa & Wellness Sanctuary Palette)
  const getBadgeStyle = () => {
    const summaryUpper = (event.summary + ' ' + (event.type || '')).toUpperCase();
    if (event.isFsm || summaryUpper.includes('FSM')) {
      return {
        bg: 'bg-cyan-500/10 dark:bg-cyan-950/40 border-cyan-500/20 text-cyan-700 dark:text-cyan-300',
        badge: 'bg-cyan-500 text-slate-950 font-extrabold',
        accent: '#06B6D4',
        label: 'FSM Voľno',
      };
    }
    if (summaryUpper.includes('VIP') || summaryUpper.includes('SUPREME')) {
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/30 text-amber-900 dark:text-amber-200',
        badge: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black shadow-sm',
        accent: '#D4AF37',
        label: 'VIP Supreme',
      };
    }
    if (summaryUpper.includes('AROMA') || summaryUpper.includes('HERBAL')) {
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
        badge: 'bg-emerald-600 text-white font-extrabold shadow-sm',
        accent: '#10B981',
        label: 'Aromaterapia',
      };
    }
    if (summaryUpper.includes('ŠPORT') || summaryUpper.includes('DEEP')) {
      return {
        bg: 'bg-amber-600/10 dark:bg-amber-950/40 border-amber-600/30 text-amber-900 dark:text-amber-200',
        badge: 'bg-amber-600 text-white font-extrabold shadow-sm',
        accent: '#D97706',
        label: 'Športová / Deep',
      };
    }
    // Default Classic (Healing Spa Jade)
    return {
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
      badge: 'bg-emerald-600 text-white font-extrabold shadow-sm',
      accent: '#10B981',
      label: 'Klasik',
    };
  };

  const style = getBadgeStyle();

  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => onDragStart && onDragStart(e, event)}
      onClick={() => onClick && onClick(event)}
      className={`group relative rounded-2xl border backdrop-blur-md p-3 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] select-none cursor-grab active:cursor-grabbing active:scale-[0.97] hover:shadow-lg ${style.bg} ${
        event.hasConflict
          ? 'ring-2 ring-amber-500/80 shadow-amber-500/20 animate-pulse'
          : 'hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isDraggable && (
            <span className="text-slate-400 group-hover:text-slate-200 transition shrink-0 opacity-60">
              <GripVertical size={14} />
            </span>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${style.badge}`}>
                {style.label}
              </span>
              <span className="text-slate-400 dark:text-slate-400 font-bold text-[11px] flex items-center gap-1">
                <Clock size={11} />
                {startTimeStr} - {endTimeStr} ({durationMin}m)
              </span>
            </div>

            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
              {event.clientName || event.summary}
            </h4>
          </div>
        </div>

        {event.hasConflict && (
          <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white font-black text-[9px] uppercase tracking-wide shrink-0 flex items-center gap-1 shadow-sm">
            <AlertCircle size={10} />
            Kolízia
          </span>
        )}
      </div>

      {!compact && (
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {event.clientPhone && (
            <span className="flex items-center gap-1">
              <Phone size={11} className="text-emerald-500" />
              {event.clientPhone}
            </span>
          )}
          {event.price && (
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {event.price}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
