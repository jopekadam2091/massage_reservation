'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

export default function AuthPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [programType, setProgramType] = useState<'5_stamps' | '10_stamps'>('10_stamps');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // 1. Logika pre prihlásenie
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Overíme rolu prihláseného používateľa
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/profil');
    }
  };

  // 2. Logika pre registráciu
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setErrorMsg(authError?.message || t.registrationFailed);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'client',
      },
    ]);

    if (profileError) {
      setErrorMsg(profileError.message);
      setLoading(false);
      return;
    }

    if (referralCode.trim()) {
      const { error: referralError } = await supabase.rpc('handle_referral_signup', {
        new_user_id: authData.user.id,
        ref_code: referralCode.trim(),
      });
      if (referralError) {
        console.error('Referral kód sa nepodarilo spracovať:', referralError.message);
      }
    }

    router.push('/profil');
  };

  return (
    <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-zinc-900 transition-colors duration-300 relative font-sans">
      
      {/* Sklenená prihlasovacia karta s pôvodným vizuálom */}
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/60 dark:border-zinc-700 transition-all duration-300 animate-scaleIn text-left">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight">{t.appTitle}</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
            {isRegistering ? t.subtitleRegister : t.subtitleLogin}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-center animate-fadeIn">
            {errorMsg}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          {isRegistering && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{t.fullNameLabel}</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder={t.fullNamePlaceholder}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{t.emailLabel}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="vashov@email.sk"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{t.passwordLabel}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {isRegistering && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Odporúčací kód (nepovinné)
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="input-field uppercase font-mono"
                placeholder="napr. AB12CD34"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-emerald mt-2 py-3 rounded-xl cursor-pointer"
          >
            {loading ? t.working : isRegistering ? t.registerBtn : t.loginBtn}
          </button>
        </form>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg('');
            }}
            className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition cursor-pointer"
          >
            {isRegistering ? t.toggleToLogin : t.toggleToRegister}
          </button>
        </div>
      </div>
    </main>
  );
}