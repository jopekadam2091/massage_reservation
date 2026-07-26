'use client';

import React from 'react';
import { Clock, X } from 'lucide-react';

type AfterWorkModalProps = {
  language: string;
  onClose: () => void;
  onConfirm: (startTime: string) => void;
};

export const AfterWorkModal: React.FC<AfterWorkModalProps> = ({
  language,
  onClose,
  onConfirm,
}) => {
  const times = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 font-sans animate-fadeIn">
      <div className="w-full max-w-xs p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
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
          {times.map((time) => (
            <button
              key={`afterwork-${time}`}
              type="button"
              onClick={() => onConfirm(time)}
              className="py-2.5 rounded-xl text-xs font-black border transition cursor-pointer bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-2xs"
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};