'use client';

import React from 'react';
import { Bell, Check, X, Tag, User } from 'lucide-react';

type Props = {
  pendingRequests: any[];
  onApprove: (requestId: string, bookingRef: string) => void;
  onReject: (requestId: string) => void;
  language: string;
};

export default function CancellationRequestsSection({
  pendingRequests,
  onApprove,
  onReject,
  language,
}: Props) {
  if (!pendingRequests || pendingRequests.length === 0) return null;

  return (
    <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/60 shadow-lg space-y-3 font-sans text-left animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-sm uppercase tracking-wide">
          <div className="relative">
            <Bell size={18} className="animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <span>
            {language === 'sk'
              ? `Žiadosti o storno rezervácie (${pendingRequests.length})`
              : `Booking cancellation requests (${pendingRequests.length})`}
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-black uppercase">
          {language === 'sk' ? 'Čaká na schválenie' : 'Pending approval'}
        </span>
      </div>

      <div className="space-y-2.5">
        {pendingRequests.map((req) => (
          <div
            key={req.id}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1 text-xs min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Tag size={12} />
                  <span>#{req.booking_ref}</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(req.created_at).toLocaleString('sk-SK')}
                </span>
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 truncate">
                <User size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{req.profiles?.full_name || req.profiles?.email || 'Klient'}</span>
              </p>
              {req.reason && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-snug">
                  „{req.reason}“
                </p>
              )}
            </div>

            {/* AKČNÉ TLAČIDLÁ */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Schváliť */}
              <button
                type="button"
                onClick={() => onApprove(req.id, req.booking_ref)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Check size={14} />
                <span>{language === 'sk' ? 'Schváliť storno' : 'Approve Storno'}</span>
              </button>

              {/* 🚀 ORANŽOVÉ ŠIRŠIE TLAČIDLO ZAMIETNUŤ (BEZ ZALOMENIA) */}
              <button
                type="button"
                onClick={() => onReject(req.id)}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap min-w-[105px] justify-center"
              >
                <X size={14} />
                <span>{language === 'sk' ? 'Zamietnuť' : 'Reject'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}