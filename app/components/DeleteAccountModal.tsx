'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { 
  X, AlertTriangle, Trash2, ArrowLeft, ArrowRight, RotateCw, 
  CheckCircle2, AlertCircle, Loader2, ShieldAlert 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  language: string;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  language,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'warning' | 'otp'>('warning');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  
  const [otpToken, setOtpToken] = useState<string>('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0);
  const [resendCooldown, setResendCooldown] = useState<number>(60);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [infoMsg, setInfoMsg] = useState<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus na prvý input pri prechode na krok OTP
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Odpočítavanie pre opätovné odoslanie kódu
  useEffect(() => {
    if (step !== 'otp' || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  if (!isOpen) return null;

  // 1. Krok: Odoslanie overovacieho kódu na Gmail
  const handleRequestDeletionOtp = async () => {
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('/api/user/delete-account/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || (language === 'sk' ? 'Chyba pri odosielaní kódu.' : 'Failed to send verification code.'));
        setLoading(false);
        return;
      }

      setOtpToken(data.otpToken);
      setOtpExpiresAt(data.expiresAt);
      setResendCooldown(60);
      setStep('otp');
      setInfoMsg(
        language === 'sk'
          ? 'Bezpečnostný kód bol odoslaný na váš e-mail.'
          : 'Security code sent to your email.'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || (language === 'sk' ? 'Chyba pripojenia.' : 'Network error.'));
    } finally {
      setLoading(false);
    }
  };

  // 2. Krok: Overenie 6-miestneho kódu a trvalé vymazanie účtu
  const handleConfirmDeletion = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setErrorMsg(language === 'sk' ? 'Zadajte kompletný 6-miestny kód.' : 'Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('/api/user/delete-account/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code,
          expiresAt: otpExpiresAt,
          otpToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || (language === 'sk' ? 'Nesprávny kód.' : 'Invalid code.'));
        setLoading(false);
        return;
      }

      // Odhlásenie a presmerovanie na login
      await supabase.auth.signOut();
      onClose();
      router.push('/login');
    } catch (err: any) {
      setErrorMsg(err?.message || (language === 'sk' ? 'Chyba pri mazaní účtu.' : 'Error deleting account.'));
      setLoading(false);
    }
  };

  // Obsluha inputov
  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    if (cleanVal.length > 1) {
      handlePasteString(cleanVal);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && cleanVal) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        handleConfirmDeletion(fullCode);
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
      handleConfirmDeletion(newDigits.join(''));
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#0B0D22]/60 dark:bg-[#010314]/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-sans animate-fadeIn text-[#1E293B] dark:text-[#DDE0F2]">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#FF5A7A]/40 shadow-2xl space-y-5 text-center relative animate-in fade-in zoom-in-95 duration-200">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-white transition cursor-pointer p-1"
        >
          <X size={18} />
        </button>

        {step === 'warning' ? (
          /* ================================================================ */
          /* KROK 1: VAROVANIE A VYSVETLENIE NEVRATNOSTI                      */
          /* ================================================================ */
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-[#FF5A7A]/15 text-[#FF5A7A] border border-[#FF5A7A]/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,90,122,0.4)]">
              <ShieldAlert size={28} />
            </div>

            <div className="space-y-2 text-left">
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] text-[11px] font-bold uppercase tracking-wider mb-1">
                  {language === 'sk' ? 'Nevratná akcia' : 'Irreversible Action'}
                </span>
                <h2 className="text-xl sm:text-2xl font-semibold text-[#0B0D22] dark:text-[#FFFFFF] tracking-tight">
                  {language === 'sk' ? 'Trvalé vymazanie účtu' : 'Delete Account Permanently'}
                </h2>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-2 text-xs text-[#64748B] dark:text-[#C7CAE0]">
                <p className="font-semibold text-[#FF5A7A] flex items-center gap-1.5">
                  <AlertTriangle size={15} />
                  <span>{language === 'sk' ? 'Upozornenie o strate údajov:' : 'Data loss notice:'}</span>
                </p>
                <ul className="list-disc pl-4 space-y-1.5 leading-relaxed text-[#64748B] dark:text-[#C7CAE0]/80">
                  <li>
                    {language === 'sk'
                      ? 'Všetky vaše nazbierané pečiatky a uplatnené darčeky budú zmazané.'
                      : 'All your collected stamps and gifts will be permanently erased.'}
                  </li>
                  <li>
                    {language === 'sk'
                      ? 'Stratíte prístup k histórii masáží a odomknutým odznakom.'
                      : 'You will lose access to massage history and badges.'}
                  </li>
                  <li>
                    {language === 'sk'
                      ? 'Pre bezpečnosť vám na e-mail odošleme 6-miestny potvrdzovací kód.'
                      : 'For security, we will send a 6-digit confirmation code to your email.'}
                  </li>
                </ul>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 text-xs font-medium text-[#FF5A7A] bg-[#FF5A7A]/15 rounded-xl border border-[#FF5A7A]/30 text-left flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleRequestDeletionOtp}
                className="w-full btn-danger text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>{language === 'sk' ? 'Odosielam kód...' : 'Sending code...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>{language === 'sk' ? 'Pokračovať a poslať overovací kód' : 'Proceed & Send Confirmation Code'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full btn-secondary text-xs uppercase tracking-wider font-medium"
              >
                {language === 'sk' ? 'Zrušiť / Ponechať účet' : 'Cancel / Keep Account'}
              </button>
            </div>
          </>
        ) : (
          /* ================================================================ */
          /* KROK 2: 6-MIESTNE OVERENIE CEZ EMAIL                             */
          /* ================================================================ */
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-[#FF5A7A]/15 text-[#FF5A7A] border border-[#FF5A7A]/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,90,122,0.4)]">
              <ShieldAlert size={28} />
            </div>

            <div className="space-y-1 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FF5A7A]/15 border border-[#FF5A7A]/30 text-[#FF5A7A] text-[11px] font-bold uppercase tracking-wider mb-1">
                {language === 'sk' ? 'Potvrdenie kódom' : 'Code Confirmation'}
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#0B0D22] dark:text-[#FFFFFF] tracking-tight">
                {language === 'sk' ? 'Zadajte kód z e-mailu' : 'Enter Code from Email'}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#C7CAE0] font-normal leading-relaxed">
                {language === 'sk' ? (
                  <>
                    Na váš e-mail <strong className="text-[#0B0D22] dark:text-[#FFFFFF]">{userEmail}</strong> sme odoslali 6-miestny kód.
                  </>
                ) : (
                  <>
                    We sent a 6-digit code to <strong className="text-[#0B0D22] dark:text-[#FFFFFF]">{userEmail}</strong>.
                  </>
                )}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 text-xs font-medium text-[#FF5A7A] bg-[#FF5A7A]/15 rounded-xl border border-[#FF5A7A]/30 text-left flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="p-3 text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] bg-[#6633EE]/15 rounded-xl border border-[#6633EE]/30 text-left flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* 6 Segmented Input Boxes */}
            <div className="flex justify-between items-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl bg-slate-50 dark:bg-[#010314] text-[#0B0D22] dark:text-[#FFFFFF] border transition-all duration-200 focus:outline-none ${
                    digit 
                      ? 'border-[#FF5A7A] shadow-[0_0_15px_rgba(255,90,122,0.35)] bg-white dark:bg-[#0B0D22]' 
                      : 'border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#FF5A7A]/40'
                  } focus:border-[#FF5A7A] focus:ring-2 focus:ring-[#FF5A7A]/30`}
                />
              ))}
            </div>

            {/* Potvrdenie tlačidlom */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={loading || digits.join('').length !== 6}
                onClick={() => handleConfirmDeletion()}
                className="w-full btn-danger text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>{language === 'sk' ? 'Vymazávam účet...' : 'Deleting account...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>{language === 'sk' ? 'Trvalo vymazať môj účet' : 'Permanently Delete My Account'}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep('warning')}
                  className="text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-[#FFFFFF] transition flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>{language === 'sk' ? 'Späť' : 'Back'}</span>
                </button>

                {resendCooldown > 0 ? (
                  <span className="text-[#64748B] dark:text-[#C7CAE0]/60 font-mono text-[11px]">
                    {language === 'sk' ? `Znovu odoslať o ${resendCooldown}s` : `Resend in ${resendCooldown}s`}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestDeletionOtp}
                    disabled={loading}
                    className="text-[#6633EE] dark:text-[#A78BFA] hover:text-[#0B0D22] dark:hover:text-[#FFFFFF] font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
                    <span>{language === 'sk' ? 'Znovu odoslať kód' : 'Resend code'}</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
