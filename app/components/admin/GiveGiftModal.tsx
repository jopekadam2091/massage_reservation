'use client';

import { useState } from 'react';
import { Profile } from '@/app/types';
import { Gift, AlertCircle, X, Tag, Sparkles } from 'lucide-react';

interface GiftOption {
  id: string;
  labelSk: string;
  labelEn: string;
  icon: React.ElementType;
}

const GIFT_OPTIONS: GiftOption[] = [
  { id: 'discount_code', labelSk: 'Zľavový kód (vlastný text)', labelEn: 'Discount Code (custom text)', icon: Tag },
  { id: 'next_visit_gift', labelSk: 'Darček pri ďalšej návšteve 🎁', labelEn: 'Gift on your next visit 🎁', icon: Gift },
  { id: 'vip_upgrade', labelSk: 'VIP masáž za cenu Klasickej ✨', labelEn: 'VIP Massage for the price of Classic ✨', icon: Sparkles }
];

type Props = {
  profile: Profile | null;
  onClose: () => void;
  onConfirm: () => void;
  selectedGift: string;
  setSelectedGift: (gift: string) => void;
  customCode: string;
  setCustomCode: (code: string) => void;
  giftError: string;
  hasActiveGift: boolean;
  language: string;
};

export default function GiveGiftModal({
  profile,
  onClose,
  onConfirm,
  selectedGift,
  setSelectedGift,
  customCode,
  setCustomCode,
  giftError,
  hasActiveGift,
  language,
}: Props) {
  const [discountPercent, setDiscountPercent] = useState<number>(20);

  if (!profile) return null;

  const handleConfirmWithGoogleSheet = async () => {
    if (selectedGift === 'discount_code' && customCode.trim()) {
      // Automatický zápis do Google Sheets
      try {
        await fetch('/api/admin/add-discount-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: customCode.trim(), percent: discountPercent }),
        });
      } catch (err) {
        console.error('Nepodarilo sa zapísať kód do Google Sheets:', err);
      }
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 relative text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow">
            <Gift size={22} />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {language === 'sk' ? 'Venovať prekvapenie' : 'Give a Surprise'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {language === 'sk' ? 'Pre klienta: ' : 'For client: '} <strong>{profile.full_name || profile.email}</strong>
          </p>
          {hasActiveGift && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold px-2">
              {language === 'sk'
                ? '⚠️ Klient má už aktívne prekvapenie — potvrdením ho nahradíte novým.'
                : '⚠️ Client already has an active surprise — confirming will replace it.'}
            </p>
          )}
        </div>

        <div className="text-left space-y-2 pt-1">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'sk' ? 'Vyberte typ prekvapenia:' : 'Select surprise type:'}
          </label>
          <div className="space-y-1.5">
            {GIFT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedGift(option.id)}
                className={`w-full p-3 flex items-center gap-2 text-xs rounded-xl border text-left transition ${
                  selectedGift === option.id
                    ? 'bg-purple-500 border-purple-500 text-white shadow-sm font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <option.icon size={14} className="shrink-0" />
                {language === 'sk' ? option.labelSk : option.labelEn}
              </button>
            ))}
          </div>
        </div>

        {selectedGift === 'discount_code' && (
          <div className="text-left space-y-2 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/40">
            <div>
              <label className="block text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-1">
                {language === 'sk' ? 'Zľavový kód (text)' : 'Discount Code'}
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="RELAX20"
                className="w-full px-3 py-2 border border-purple-200 dark:border-purple-800 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 font-mono uppercase tracking-widest text-center text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {language === 'sk' ? 'Výška zľavy v % (zápis do Google Sheet):' : 'Discount percentage %:'}
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseInt(e.target.value, 10) || 20)}
                className="w-full px-3 py-1.5 border border-purple-200 dark:border-purple-800 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-center text-xs"
              />
            </div>
          </div>
        )}

        {giftError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs text-left font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <p>{giftError}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {language === 'sk' ? 'Zrušiť' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirmWithGoogleSheet}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition shadow-sm"
          >
            {language === 'sk' ? 'Potvrdiť' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}