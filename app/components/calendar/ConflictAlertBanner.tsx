'use client';

import React from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';

export type ConflictItem = {
  id1: string;
  id2: string;
  title1: string;
  title2: string;
  timeRange1: string;
  timeRange2: string;
};

type Props = {
  conflicts: ConflictItem[];
  language: string;
  onDismiss?: () => void;
};

export default function ConflictAlertBanner({ conflicts, language, onDismiss }: Props) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md p-4 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-lg shadow-amber-950/20 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-500 shrink-0 animate-pulse">
            <AlertTriangle size={16} />
          </div>
          <span>
            {language === 'sk'
              ? `Upozornenie: Zistená časová kolízia (${conflicts.length})`
              : `Warning: Schedule conflict detected (${conflicts.length})`}
          </span>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-amber-500/70 hover:text-amber-500 transition p-1 rounded-lg hover:bg-amber-500/10 cursor-pointer active:scale-95"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="mt-2.5 space-y-2">
        {conflicts.map((c, i) => (
          <div
            key={`${c.id1}-${c.id2}-${i}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-950/40 border border-amber-500/20 text-xs text-slate-800 dark:text-slate-200 gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-amber-700 dark:text-amber-300 truncate">
                {c.title1} ({c.timeRange1})
              </span>
              <span className="text-amber-500 font-black">↔</span>
              <span className="font-semibold text-amber-700 dark:text-amber-300 truncate">
                {c.title2} ({c.timeRange2})
              </span>
            </div>
            <span className="text-[11px] font-medium text-amber-600/90 dark:text-amber-400/90 shrink-0 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              <Clock size={12} />
              {language === 'sk' ? 'Prekrytie masáží' : 'Overlapping slot'}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
        {language === 'sk'
          ? '💡 Systém neblokuje akciu. Použite Drag & Drop presun v hodinovej časovej osi pre úpravu času masáže.'
          : '💡 Action is not blocked. Use Drag & Drop in the hourly timeline to adjust schedule.'}
      </p>
    </div>
  );
}
