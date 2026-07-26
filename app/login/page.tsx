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
    <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative font-sans">
      
      {/* Sklenená prihlasovacia karta s pôvodným vizuálom */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/40 dark:border-slate-800 transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t.appTitle}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
            {isRegistering ? t.subtitleRegister : t.subtitleLogin}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.fullNameLabel}</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 mt-1 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                placeholder={t.fullNamePlaceholder}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.emailLabel}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
              placeholder="vashov@email.sk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.passwordLabel}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
              placeholder="••••••••"
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Odporúčací kód (nepovinné)
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full px-4 py-2 mt-1 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase transition"
                placeholder="napr. AB12CD34"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold bg-emerald-600 rounded-xl hover:bg-emerald-700 active:scale-95 transition disabled:bg-emerald-400 mt-2 shadow-sm"
          >
            {loading ? t.working : isRegistering ? t.registerBtn : t.loginBtn}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg('');
            }}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline transition"
          >
            {isRegistering ? t.toggleToLogin : t.toggleToRegister}
          </button>
        </div>
      </div>
    </main>
  );
}