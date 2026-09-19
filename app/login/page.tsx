'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import OtpVerificationInput from '../components/OtpVerificationInput';
import { 
  User, Lock, Mail, Eye, EyeOff, Tag, ArrowRight, Check, Sparkles, AlertCircle
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Stavy formulára
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  
  // Stavy pre 6-miestne OTP overenie registrácie
  const [otpStep, setOtpStep] = useState<'form' | 'otp'>('form');
  const [otpToken, setOtpToken] = useState<string>('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0);

  // 🛡️ Stavy pre 2FA e-mailové overenie administrátora
  const [adminOtpStep, setAdminOtpStep] = useState<'form' | 'admin-otp'>('form');
  const [adminOtpToken, setAdminOtpToken] = useState<string>('');
  const [adminOtpExpiresAt, setAdminOtpExpiresAt] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const toggleToRegister = () => {
    if (isRegistering) return;
    setIsRegistering(true);
    setOtpStep('form');
    setAdminOtpStep('form');
    setErrorMsg('');
    setInfoMsg('');
  };

  const toggleToLogin = () => {
    if (!isRegistering) return;
    setIsRegistering(false);
    setOtpStep('form');
    setAdminOtpStep('form');
    setErrorMsg('');
    setInfoMsg('');
  };

  // 1. Logika pre prihlásenie (Email + Heslo) s 2FA pre Admina
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = email.trim();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'admin') {
      // 🛡️ Pre administrátora vyžadujeme 2FA overenie cez e-mail
      try {
        const res = await fetch('/api/auth/admin-otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });

        const resData = await res.json();

        if (!res.ok || resData.error) {
          setErrorMsg(resData.error || (language === 'sk' ? 'Nepodarilo sa odoslať 2FA kód administrátora.' : 'Failed to send admin 2FA code.'));
          setLoading(false);
          return;
        }

        setAdminOtpToken(resData.adminOtpToken);
        setAdminOtpExpiresAt(resData.expiresAt);
        setAdminOtpStep('admin-otp');
        setInfoMsg(
          language === 'sk'
            ? 'Na váš administrátorský e-mail bol odoslaný 6-miestny bezpečnostný kód.'
            : 'A 6-digit security code has been sent to your administrator email.'
        );
      } catch (err: any) {
        setErrorMsg(err?.message || (language === 'sk' ? 'Chyba pri odosielaní 2FA kódu.' : 'Failed to send 2FA code.'));
      } finally {
        setLoading(false);
      }
    } else {
      // Bežný klient pokračuje priamo do profilu
      router.push('/profil');
    }
  };

  // 🛡️ 1b. Overenie 2FA kódu administrátora
  const handleVerifyAdminOtp = async (code: string) => {
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('/api/auth/admin-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code,
          adminOtpToken,
          expiresAt: adminOtpExpiresAt,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || (language === 'sk' ? 'Nesprávny bezpečnostný kód.' : 'Invalid security code.'));
        setLoading(false);
        return;
      }

      // Uloženie overeného 2FA stavu do sessionStorage pre admin stránku
      sessionStorage.setItem('admin_2fa_verified', 'true');
      if (data.verifiedToken) {
        sessionStorage.setItem('admin_verified_token', data.verifiedToken);
      }

      router.push('/admin');
    } catch (err: any) {
      setErrorMsg(err?.message || (language === 'sk' ? 'Chyba pri overovaní kódu.' : 'Verification error.'));
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ 1c. Opätovné odoslanie 2FA kódu administrátora
  const handleResendAdminOtp = async () => {
    setErrorMsg('');
    setInfoMsg('');
    try {
      const res = await fetch('/api/auth/admin-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || (language === 'sk' ? 'Nepodarilo sa znovu odoslať kód.' : 'Failed to resend code.'));
        return;
      }

      setAdminOtpToken(data.adminOtpToken);
      setAdminOtpExpiresAt(data.expiresAt);
      setInfoMsg(language === 'sk' ? 'Nový kód bol odoslaný na váš administrátorský e-mail.' : 'New code sent to your admin email.');
    } catch (err: any) {
      setErrorMsg(err?.message || (language === 'sk' ? 'Chyba pripojenia.' : 'Network error.'));
    }
  };

  // 2. Krok 1 registrácie: Odoslanie 6-miestneho OTP kódu na e-mail
  const handleStartRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    if (password.length < 6) {
      setErrorMsg(language === 'sk' ? 'Heslo musí mať aspoň 6 znakov.' : 'Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || (language === 'sk' ? 'Chyba pri odosielaní kódu.' : 'Failed to send OTP code.'));
        setLoading(false);
        return;
      }

      setOtpToken(data.otpToken);
      setOtpExpiresAt(data.expiresAt);
      setOtpStep('otp');
      setInfoMsg(language === 'sk' ? 'Overovací kód bol odoslaný na váš e-mail.' : 'Verification code sent to your email.');
    } catch (err: any) {
      setErrorMsg(err?.message || (language === 'sk' ? 'Chyba pripojenia k serveru.' : 'Network error.'));
    } finally {
      setLoading(false);
    }
  };

  // 3. Krok 2 registrácie: Overenie zadaného 6-miestneho kódu
  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          referralCode: referralCode.trim(),
          code,
          expiresAt: otpExpiresAt,
          otpToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || (language === 'sk' ? 'Nesprávny overovací kód.' : 'Invalid code.'));
        setLoading(false);
        return;
      }

      // Automatické prihlásenie po úspešnom overení
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr) {
        setInfoMsg(language === 'sk' ? 'Účet bol vytvorený! Môžete sa prihlásiť.' : 'Account created! You can now log in.');
        setIsRegistering(false);
        setOtpStep('form');
      } else {
        router.push('/profil');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (language === 'sk' ? 'Chyba pri overovaní kódu.' : 'Verification error.'));
    } finally {
      setLoading(false);
    }
  };

  // 4. Opätovné odoslanie OTP kódu
  const handleResendOtp = async () => {
    setErrorMsg('');
    setInfoMsg('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || (language === 'sk' ? 'Nepodarilo sa znovu odoslať kód.' : 'Failed to resend code.'));
        return;
      }

      setOtpToken(data.otpToken);
      setOtpExpiresAt(data.expiresAt);
      setInfoMsg(language === 'sk' ? 'Nový kód bol odoslaný na váš e-mail.' : 'New code sent to your email.');
    } catch (err: any) {
      setErrorMsg(err?.message || (language === 'sk' ? 'Chyba pripojenia.' : 'Network error.'));
    }
  };

  // 5. Obnova hesla (Forgot password)
  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg(language === 'sk' ? 'Zadajte najprv váš e-mail' : 'Please enter your email first');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setInfoMsg(
        language === 'sk'
          ? 'Link na obnovu hesla bol odoslaný na váš e-mail! 📧'
          : 'Password reset link sent to your email! 📧'
      );
    }
  };

  return (
    <main suppressHydrationWarning className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-[calc(env(safe-area-inset-top,24px)+5rem)] sm:pt-28 lg:pt-32 pb-32 sm:pb-36 font-sans overflow-hidden bg-transparent text-[#0B0D22] dark:text-[#FFFFFF]">
      
      {/* ⚡ Electric Purple Glowing Background Halos */}
      <div suppressHydrationWarning className="absolute top-1/4 left-1/3 w-[550px] h-[550px] rounded-full bg-[#6633EE]/15 blur-[150px] pointer-events-none animate-pulse" />
      <div suppressHydrationWarning className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-[#A78BFA]/10 blur-[150px] pointer-events-none animate-pulse" />

      {/* 💎 MAIN SLIDING PANEL CARD CONTAINER */}
      <div suppressHydrationWarning className="relative z-10 w-full max-w-5xl min-h-[560px] sm:min-h-[600px] rounded-2xl bg-white dark:bg-[#0B0D22] backdrop-blur-2xl border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative text-[#1E293B] dark:text-[#DDE0F2]">
        
        {/* =================================================================== */}
        {/* 1. LOGIN FORM PANEL (Stack on mobile, Left side on desktop)         */}
        {/* =================================================================== */}
        <div 
          className={`col-start-1 row-start-1 md:col-auto md:row-auto w-full h-full p-6 sm:p-12 md:pl-12 md:pr-14 lg:pl-16 lg:pr-16 flex flex-col justify-center space-y-6 transition-all duration-500 ease-in-out ${
            isRegistering 
              ? 'opacity-0 pointer-events-none scale-95 md:translate-x-12' 
              : 'opacity-100 pointer-events-auto scale-100 md:translate-x-0'
          }`}
        >
          {adminOtpStep === 'admin-otp' ? (
            /* 🛡️ 6-DIGIT 2FA VERIFICATION VIEW PRE ADMINA */
            <OtpVerificationInput
              email={email}
              onVerify={handleVerifyAdminOtp}
              onResend={handleResendAdminOtp}
              onBack={() => {
                setAdminOtpStep('form');
                setErrorMsg('');
                setInfoMsg('');
              }}
              loading={loading}
              errorMsg={errorMsg}
              infoMsg={infoMsg}
              language={language}
            />
          ) : (
            <>
              <div className="space-y-1.5 text-left w-full">
                <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B0D22] dark:text-[#FFFFFF] tracking-tight">
                  {language === 'sk' ? 'Prihlásenie' : 'Login'}
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#C7CAE0] font-normal">
                  {language === 'sk' ? 'Zadajte vaše údaje pre prístup k účtu' : 'Enter your credentials to access your account'}
                </p>
              </div>

              {/* Error / Info Alerts */}
              {errorMsg && !isRegistering && (
                <div className="p-3.5 text-xs font-medium text-[#FF5A7A] bg-[#FF5A7A]/15 rounded-full border border-[#FF5A7A]/30 animate-fadeIn w-full flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {infoMsg && !isRegistering && (
                <div className="p-3.5 text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] bg-[#6633EE]/15 rounded-full border border-[#6633EE]/30 animate-fadeIn flex items-center gap-2 w-full">
                  <Check size={16} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                  <span>{infoMsg}</span>
                </div>
              )}

              {/* Stretched Form Container */}
              <form onSubmit={handleLogin} className="w-full space-y-5 text-left">
                {/* Email Input */}
                <div className="space-y-1.5 w-full">
                  <label className="block text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] uppercase tracking-wider">
                    {language === 'sk' ? 'E-mailová adresa' : 'Email'}
                  </label>
                  <div className="relative w-full border-b border-[#E2E8F0] dark:border-[#2B2F49] focus-within:border-[#6633EE] transition-colors">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent py-2.5 pr-10 text-[#0B0D22] dark:text-[#FFFFFF] placeholder-[#94A3B8] dark:placeholder-[#C7CAE0]/50 text-sm font-normal focus:outline-none"
                      placeholder={language === 'sk' ? 'Zadajte váš e-mail' : 'Enter your email'}
                    />
                    <Mail size={18} className="absolute right-1 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#C7CAE0]/60 pointer-events-none" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center justify-between w-full">
                    <label className="block text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] uppercase tracking-wider">
                      {language === 'sk' ? 'Heslo' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-normal text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-[#FFFFFF] transition cursor-pointer"
                    >
                      {language === 'sk' ? 'Zabudli ste heslo?' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative w-full border-b border-[#E2E8F0] dark:border-[#2B2F49] focus-within:border-[#6633EE] transition-colors">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent py-2.5 pr-10 text-[#0B0D22] dark:text-[#FFFFFF] placeholder-[#94A3B8] dark:placeholder-[#C7CAE0]/50 text-sm font-normal focus:outline-none"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#C7CAE0]/60 hover:text-[#0B0D22] dark:hover:text-white p-1 cursor-pointer transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Full Width Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-xs uppercase tracking-wider mt-5"
                >
                  <span>{loading ? (language === 'sk' ? 'Spracovávam...' : 'Working...') : (language === 'sk' ? 'Prihlásiť sa' : 'Login')}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Bottom Switch Link */}
              <div className="pt-2 text-xs text-[#64748B] dark:text-[#C7CAE0] w-full">
                {language === 'sk' ? 'Nemáte ešte účet?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={toggleToRegister}
                  className="font-medium text-[#6633EE] dark:text-[#A78BFA] hover:text-[#0B0D22] dark:hover:text-[#FFFFFF] transition cursor-pointer underline ml-1"
                >
                  {language === 'sk' ? 'Registrovať sa' : 'Sign Up'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* =================================================================== */}
        {/* 2. SIGN UP & OTP VERIFICATION PANEL (Right side on desktop)         */}
        {/* =================================================================== */}
        <div 
          className={`col-start-1 row-start-1 md:col-auto md:row-auto w-full h-full p-6 sm:p-12 md:pl-14 md:pr-12 lg:pl-16 lg:pr-16 flex flex-col justify-center space-y-5 transition-all duration-500 ease-in-out ${
            !isRegistering 
              ? 'opacity-0 pointer-events-none scale-95 md:-translate-x-12' 
              : 'opacity-100 pointer-events-auto scale-100 md:translate-x-0'
          }`}
        >
          {otpStep === 'otp' ? (
            /* 6-DIGIT OTP VERIFICATION VIEW */
            <OtpVerificationInput
              email={email}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={() => setOtpStep('form')}
              loading={loading}
              errorMsg={errorMsg}
              infoMsg={infoMsg}
              language={language}
            />
          ) : (
            /* STANDARD REGISTRATION FORM */
            <>
              <div className="space-y-1.5 text-left w-full">
                <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B0D22] dark:text-[#FFFFFF] tracking-tight">
                  {language === 'sk' ? 'Registrácia' : 'Sign Up'}
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#C7CAE0] font-normal">
                  {language === 'sk' ? 'Vytvorte si účet s overením cez e-mail' : 'Create an account with email verification'}
                </p>
              </div>

              {/* Error / Info Alerts */}
              {errorMsg && isRegistering && (
                <div className="p-3.5 text-xs font-medium text-[#FF5A7A] bg-[#FF5A7A]/15 rounded-full border border-[#FF5A7A]/30 animate-fadeIn w-full flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {infoMsg && isRegistering && (
                <div className="p-3.5 text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] bg-[#6633EE]/15 rounded-full border border-[#6633EE]/30 animate-fadeIn flex items-center gap-2 w-full">
                  <Check size={16} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
                  <span>{infoMsg}</span>
                </div>
              )}

              {/* Stretched Form Container */}
              <form onSubmit={handleStartRegistration} className="w-full space-y-4 text-left">
                {/* Full Name Input */}
                <div className="space-y-1.5 w-full">
                  <label className="block text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] uppercase tracking-wider">
                    {language === 'sk' ? 'Meno a Priezvisko' : 'Full Name'}
                  </label>
                  <div className="relative w-full border-b border-[#E2E8F0] dark:border-[#2B2F49] focus-within:border-[#6633EE] transition-colors">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-transparent py-2.5 pr-10 text-[#0B0D22] dark:text-[#FFFFFF] placeholder-[#94A3B8] dark:placeholder-[#C7CAE0]/50 text-sm font-normal focus:outline-none"
                      placeholder={language === 'sk' ? 'napr. Ján Novák' : 'e.g. John Doe'}
                    />
                    <User size={18} className="absolute right-1 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#C7CAE0]/60 pointer-events-none" />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-1.5 w-full">
                  <label className="block text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] uppercase tracking-wider">
                    {language === 'sk' ? 'E-mailová adresa' : 'Email'}
                  </label>
                  <div className="relative w-full border-b border-[#E2E8F0] dark:border-[#2B2F49] focus-within:border-[#6633EE] transition-colors">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent py-2.5 pr-10 text-[#0B0D22] dark:text-[#FFFFFF] placeholder-[#94A3B8] dark:placeholder-[#C7CAE0]/50 text-sm font-normal focus:outline-none"
                      placeholder={language === 'sk' ? 'Zadajte váš e-mail' : 'Enter your email'}
                    />
                    <Mail size={18} className="absolute right-1 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#C7CAE0]/60 pointer-events-none" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5 w-full">
                  <label className="block text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] uppercase tracking-wider">
                    {language === 'sk' ? 'Heslo' : 'Password'}
                  </label>
                  <div className="relative w-full border-b border-[#E2E8F0] dark:border-[#2B2F49] focus-within:border-[#6633EE] transition-colors">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent py-2.5 pr-10 text-[#0B0D22] dark:text-[#FFFFFF] placeholder-[#94A3B8] dark:placeholder-[#C7CAE0]/50 text-sm font-normal focus:outline-none"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#C7CAE0]/60 hover:text-[#0B0D22] dark:hover:text-white p-1 cursor-pointer transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Referral Code (Odporúčací kód) */}
                <div className="space-y-1.5 w-full">
                  <label className="block text-xs font-medium text-[#6633EE] dark:text-[#A78BFA] uppercase tracking-wider">
                    {language === 'sk' ? 'Odporúčací kód (nepovinné)' : 'Referral Code (Optional)'}
                  </label>
                  <div className="relative w-full border-b border-[#E2E8F0] dark:border-[#2B2F49] focus-within:border-[#6633EE] transition-colors">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full bg-transparent py-2.5 pr-10 text-[#6633EE] dark:text-[#A78BFA] placeholder-[#94A3B8] dark:placeholder-[#C7CAE0]/50 text-sm font-mono uppercase tracking-wider focus:outline-none"
                      placeholder="E.G. ZEN2026"
                    />
                    <Tag size={18} className="absolute right-1 top-1/2 -translate-y-1/2 text-[#6633EE]/80 dark:text-[#A78BFA]/80 pointer-events-none" />
                  </div>
                </div>

                {/* Full Width Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-xs uppercase tracking-wider mt-5"
                >
                  <span>{loading ? (language === 'sk' ? 'Odosielam kód...' : 'Sending code...') : (language === 'sk' ? 'Pokračovať na overenie' : 'Continue to Verification')}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Bottom Switch Link */}
              <div className="pt-2 text-xs text-[#64748B] dark:text-[#C7CAE0] w-full">
                {language === 'sk' ? 'Už máte účet?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={toggleToLogin}
                  className="font-medium text-[#6633EE] dark:text-[#A78BFA] hover:text-[#0B0D22] dark:hover:text-[#FFFFFF] transition cursor-pointer underline ml-1"
                >
                  {language === 'sk' ? 'Prihlásiť sa' : 'Login'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* =================================================================== */}
        {/* 3. THE 150% OVERSIZED ANGLED SLIDING WINDOW PANEL (DESKTOP ONLY)   */}
        {/* =================================================================== */}
        <div 
          className="hidden md:block absolute top-0 h-full w-[150%] z-20 bg-gradient-to-br from-[#6633EE] via-[#7C3AED] to-[#4F46E5] shadow-2xl transition-all duration-700 ease-in-out"
          style={{
            left: isRegistering ? '-100%' : '50%',
            clipPath: isRegistering 
              ? 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' 
              : 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)',
          }}
        >
          {/* Subtle Ambient Radial Highlight inside angled panel */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18)_0,transparent_70%)] pointer-events-none" />

          {/* LOGIN STATE OVERLAY TEXT */}
          <div 
            className={`absolute left-0 top-0 w-1/3 h-full p-8 sm:p-12 flex flex-col justify-center items-center text-center text-white transition-all duration-500 ease-in-out ${
              isRegistering ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'
            }`}
          >
            <div className="space-y-5 max-w-sm">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <Sparkles size={28} className="text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none text-white">
                {language === 'sk' ? 'AHOJ, PRIATEĽ!' : 'HELLO, FRIEND!'}
              </h2>
              <p className="text-xs sm:text-sm text-[#DDE0F2] font-normal leading-relaxed max-w-xs mx-auto">
                {language === 'sk'
                  ? 'Zaregistrujte sa cez rýchle overenie a získajte vernostné výhody a zľavy.'
                  : 'Sign up with instant email verification to unlock loyalty rewards and discounts.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={toggleToRegister}
                  className="py-3 px-8 rounded-full border border-white text-white font-medium text-xs uppercase tracking-widest hover:bg-white hover:text-[#010314] transition active:scale-95 cursor-pointer shadow-lg"
                >
                  {language === 'sk' ? 'Registrácia' : 'Sign Up'}
                </button>
              </div>
            </div>
          </div>

          {/* SIGN UP STATE OVERLAY TEXT */}
          <div 
            className={`absolute right-0 top-0 w-1/3 h-full p-8 sm:p-12 flex flex-col justify-center items-center text-center text-white transition-all duration-500 ease-in-out ${
              !isRegistering ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'
            }`}
          >
            <div className="space-y-5 max-w-sm">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <Sparkles size={28} className="text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none text-white">
                {language === 'sk' ? 'VITAJTE SPÄŤ!' : 'WELCOME BACK!'}
              </h2>
              <p className="text-xs sm:text-sm text-[#DDE0F2] font-normal leading-relaxed max-w-xs mx-auto">
                {language === 'sk'
                  ? 'Už máte vytvorený účet? Prihláste sa pomocou vášho e-mailu a hesla.'
                  : 'Already have an account? Sign in with your email and password.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={toggleToLogin}
                  className="py-3 px-8 rounded-full border border-white text-white font-medium text-xs uppercase tracking-widest hover:bg-white hover:text-[#010314] transition active:scale-95 cursor-pointer shadow-lg"
                >
                  {language === 'sk' ? 'Prihlásiť sa' : 'Login'}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Back to Home Link */}
      <div className="absolute bottom-4 z-20">
        <Link
          href="/"
          className="text-xs font-normal text-[#64748B] dark:text-[#C7CAE0] hover:text-[#0B0D22] dark:hover:text-[#FFFFFF] transition"
        >
          ← {language === 'sk' ? 'Späť na úvodnú stránku' : 'Back to Home'}
        </Link>
      </div>

    </main>
  );
}