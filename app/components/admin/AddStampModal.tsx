'use client';

import { Profile } from '@/app/types';
import { PlusCircle, AlertCircle, X } from 'lucide-react';

const PRESET_PRICES = [30, 40, 45, 65, 75, 90];

type Props = {
  profile: Profile | null;
  onClose: () => void;
  onConfirm: () => void;
  stampPrice: string;
  setStampPrice: (price: string) => void;
  stampError: string;
  activeStampsCount: number;
  maxStamps: number;
  language: string;
};

export default function AddStampModal({
  profile,
  onClose,
  onConfirm,
  stampPrice,
  setStampPrice,
  stampError,
  activeStampsCount,
  maxStamps,
  language,
}: Props) {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow">
            <PlusCircle size={22} />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {language === 'sk' ? 'Pridať novú pečiatku' : 'Add New Stamp'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {language === 'sk' ? 'Pre klienta: ' : 'For client: '} <strong>{profile.full_name || profile.email}</strong>
          </p>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
            {language === 'sk' ? 'Aktuálny stav karty: ' : 'Current card status: '} {activeStampsCount} / {maxStamps}
          </p>
        </div>

        <div className="text-left space-y-1.5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'sk' ? 'Rýchly výber ceny:' : 'Quick price select:'}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_PRICES.map((price) => (
              <button
                key={price}
                type="button"
                onClick={() => setStampPrice(price.toString())}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  stampPrice === price.toString()
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {price}€
              </button>
            ))}
          </div>
        </div>

        <div className="text-left space-y-1.5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'sk' ? 'Cena realizovanej masáže (€):' : 'Price of the massage (€):'}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="napr. 45"
            value={stampPrice}
            onChange={(e) => setStampPrice(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-center text-lg"
          />
        </div>

        {stampError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs text-left font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <p>{stampError}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {language === 'sk' ? 'Zrušiť' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition shadow-sm"
          >
            {language === 'sk' ? 'Potvrdiť' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}