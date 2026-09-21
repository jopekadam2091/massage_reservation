'use client';

import { QrCode, AlertCircle, X } from 'lucide-react';

const PRESET_PRICES = [30, 40, 45, 65, 75, 90];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  scanStampPrice: string;
  setScanStampPrice: (price: string) => void;
  scanFlowError: string;
  language: string;
};

export default function ScanPriceModal({
  isOpen,
  onClose,
  onConfirm,
  scanStampPrice,
  setScanStampPrice,
  scanFlowError,
  language,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-sm bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-3xl p-6 shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200">
        
        {/* Hlavička */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#6633EE]/10 dark:bg-[#6633EE]/20 text-[#6633EE] dark:text-[#A78BFA] flex items-center justify-center">
              <QrCode size={18} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {language === 'sk' ? 'Hodnota masáže' : 'Massage Price'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-left">
          {language === 'sk' 
            ? 'Zadajte alebo zvoľte sumu masáže, ktorú klient absolvoval. Po potvrdení sa otvorí kamera na naskenovanie jeho QR kódu.' 
            : 'Enter or choose the price of the massage. After confirming, the camera will open to scan the client\'s QR code.'}
        </p>

        {/* Rýchle predvoľby */}
        <div className="space-y-1.5 text-left">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'sk' ? 'Rýchly výber sumy:' : 'Quick Select:'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_PRICES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setScanStampPrice(String(p))}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  scanStampPrice === String(p)
                    ? 'bg-[#6633EE] text-white border-[#6633EE] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/60 hover:border-[#6633EE]/50'
                }`}
              >
                {p} €
              </button>
            ))}
          </div>
        </div>

        {/* Manuálny vstup */}
        <div className="space-y-1.5 text-left">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'sk' ? 'Alebo zadajte vlastnú sumu (€):' : 'Or enter custom amount (€):'}
          </label>
          <input
            type="number"
            step="0.5"
            placeholder="Napr. 45"
            value={scanStampPrice}
            onChange={(e) => setScanStampPrice(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6633EE] font-medium text-center text-lg"
          />
        </div>

        {scanFlowError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs text-left font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <p>{scanFlowError}</p>
          </div>
        )}

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition cursor-pointer active:scale-95"
          >
            {language === 'sk' ? 'Zrušiť' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-[1.4] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#6633EE] hover:bg-[#5324d6] text-white font-bold text-xs transition shadow-md active:scale-95 cursor-pointer text-center"
          >
            <QrCode size={22} className="shrink-0 text-white" />
            <span className="leading-tight text-center">
              {language === 'sk' ? (
                <>
                  Pokračovať a<br />naskenovať
                </>
              ) : (
                <>
                  Continue &<br />scan
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}