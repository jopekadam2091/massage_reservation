'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, RotateCw, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface Props {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  loading: boolean;
  errorMsg: string;
  infoMsg: string;
  language: string;
}

export default function OtpVerificationInput({
  email,
  onVerify,
  onResend,
  onBack,
  loading,
  errorMsg,
  infoMsg,
  language,
}: Props) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [resending, setResending] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus na prvé políčko pri načítaní
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Odpočítavanie pre znovu odoslanie kódu
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    // Povolíme iba číslice
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Ak používateľ zadal alebo vložil viac číslic (napr. cez paste priamo do políčka)
    if (cleanVal.length > 1) {
      handlePasteString(cleanVal);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Automatický posun na ďalšie políčko
    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }

    // Ak sú všetky číslice vyplnené, automaticky overíme
    if (index === 5 && cleanVal) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        onVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    handlePasteString(pasteData);
  };

  const handlePasteString = (str: string) => {
    const chars = str.split('').slice(0, 6);
    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = chars[i] || '';
    }
    setDigits(newDigits);

    const nextIndex = Math.min(chars.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (chars.length === 6) {
      onVerify(newDigits.join(''));
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length !== 6) return;
    onVerify(fullCode);
  };

  const handleTriggerResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await onResend();
      setResendCooldown(60);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in zoom-in-95 duration-300">
      
      {/* Hlavička overenia */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#6633EE]/15 border border-[#6633EE]/30 text-[#6633EE] dark:text-[#A78BFA] text-[11px] font-medium uppercase tracking-wider mb-1">
          <ShieldCheck size={13} />
          <span>{language === 'sk' ? 'Bezpečné overenie' : 'Security Verification'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B0D22] dark:text-[#FFFFFF] tracking-tight">
          {language === 'sk' ? 'Zadajte overovací kód' : 'Enter Verification Code'}
        </h2>
        <p className="text-xs text-[#64748B] dark:text-[#C7CAE0] font-normal leading-relaxed">
          {language === 'sk' ? (
            <>
              Na váš e-mail <strong className="text-[#0B0D22] dark:text-[#FFFFFF]">{email}</strong> sme odoslali 6-miestny kód.
            </>
          ) : (
            <>
              We sent a 6-digit verification code to <strong className="text-[#0B0D22] dark:text-[#FFFFFF]">{email}</strong>.
            </>
          )}
        </p>
      </div>

      {/* Chybové a informačné hlásenia */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-xs font-medium text-[#FF5A7A] flex items-center gap-2 animate-shake">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && (
        <div className="p-3.5 rounded-2xl bg-[#6633EE]/15 border border-[#6633EE]/30 text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* 6-MIESTNE SEGMENTED INPUT BOXES */}
      <form onSubmit={handleManualSubmit} className="space-y-6">
        <div className="flex justify-between items-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl bg-slate-50 dark:bg-[#010314] text-[#0B0D22] dark:text-[#FFFFFF] border transition-all duration-200 focus:outline-none ${
                digit 
                  ? 'border-[#6633EE] shadow-[0_0_15px_rgba(102,51,238,0.35)] bg-white dark:bg-[#0B0D22]' 
                  : 'border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE]/40'
              } focus:border-[#6633EE] focus:ring-2 focus:ring-[#6633EE]/30`}
            />
          ))}
        </div>

        {/* Tlačidlo overenia */}
        <button
          type="submit"
          disabled={loading || digits.join('').length !== 6}
          className="w-full btn-primary text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>{language === 'sk' ? 'Overujem kód...' : 'Verifying...'}</span>
            </>
          ) : (
            <>
              <span>{language === 'sk' ? 'Overiť & Dokončiť registráciu' : 'Verify & Complete Sign Up'}</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {/* Odpočítavanie a opätovné odoslanie kódu */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs border-t border-[#E2E8F0] dark:border-[#2B2F49]">
        <button
          type="button"
          onClick={onBack}
          className="text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-[#FFFFFF] transition flex items-center gap-1.5 cursor-pointer font-medium"
        >
          <ArrowLeft size={14} />
          <span>{language === 'sk' ? 'Zmeniť e-mail' : 'Change email'}</span>
        </button>

        <div className="flex items-center gap-2">
          {resendCooldown > 0 ? (
            <span className="text-[#64748B] dark:text-[#C7CAE0]/60 font-mono text-[11px]">
              {language === 'sk' ? `Znovu odoslať o ${resendCooldown}s` : `Resend in ${resendCooldown}s`}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleTriggerResend}
              disabled={resending}
              className="text-[#6633EE] dark:text-[#A78BFA] hover:text-[#0B0D22] dark:hover:text-[#FFFFFF] font-medium transition cursor-pointer flex items-center gap-1"
            >
              <RotateCw size={13} className={resending ? 'animate-spin text-[#6633EE]' : ''} />
              <span>{language === 'sk' ? 'Znovu odoslať kód' : 'Resend code'}</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
