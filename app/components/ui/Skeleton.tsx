'use client';

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded' | 'pill';
}

/**
 * 🌟 Základný Shimmer Skeleton komponent
 */
export function Skeleton({ className = '', variant = 'rounded', ...props }: SkeletonProps) {
  const variantClass = {
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
    circular: 'rounded-full aspect-square',
    pill: 'rounded-full',
  }[variant];

  return (
    <div
      className={`relative overflow-hidden bg-slate-200/75 dark:bg-[#151C2C] ${variantClass} ${className}`}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />
    </div>
  );
}

/**
 * 🎫 Skeleton pre hornú kartu aktívnych rezervácií na hlavnej stránke
 */
export function ActiveBookingsSkeleton() {
  return (
    <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="w-4 h-4" />
          <Skeleton className="w-36 h-3.5" />
        </div>
        <Skeleton variant="pill" className="w-16 h-4" />
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-44 h-3" />
          </div>
          <Skeleton variant="pill" className="w-20 h-7" />
        </div>
        <Skeleton className="w-full h-8 rounded-lg mt-2" />
      </div>
    </div>
  );
}

/**
 * 🔮 Skeleton pre Krok 1 (Výber úrovne starostlivosti - 2 kruhové karty 1:1)
 */
export function Step1LevelSkeleton() {
  return (
    <div className="max-w-4xl mx-auto font-sans text-center space-y-6 animate-fadeIn">
      {/* Hlavička kroku */}
      <div className="max-w-xl mx-auto mb-6 space-y-2.5">
        <div className="flex justify-center">
          <Skeleton variant="pill" className="w-56 h-6" />
        </div>
        <Skeleton className="w-72 sm:w-80 h-8 mx-auto" />
        <div className="flex justify-center gap-3 pt-0.5">
          <Skeleton variant="pill" className="w-48 h-4.5" />
          <Skeleton variant="pill" className="w-32 h-4.5" />
        </div>
        <Skeleton className="w-80 sm:w-96 h-3 mx-auto" />
      </div>

      {/* 2 Kruhové orbital karty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center justify-center pt-2">
        {/* Karta 1 - Klasická Masáž */}
        <div className="flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-[370px] sm:max-w-[390px] aspect-square rounded-full bg-white dark:bg-[#0B0D22] border border-slate-200 dark:border-slate-800 pt-5 sm:pt-6 px-6 pb-14 sm:pb-16 flex flex-col items-center justify-between shadow-lg relative">
            {/* Ikona v kruhu hore */}
            <div className="w-11 h-11 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
              <Skeleton variant="circular" className="w-5 h-5" />
            </div>

            {/* Medzera */}
            <div className="h-8 w-full" />

            {/* Stredný textový blok */}
            <div className="space-y-2 flex flex-col items-center w-full">
              <Skeleton className="w-44 h-7" />
              <Skeleton className="w-36 h-4" />

              {/* 3 bullet riadky */}
              <div className="space-y-2 pt-1 w-full max-w-[220px]">
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" className="w-5 h-5 shrink-0" />
                  <Skeleton className="w-40 h-3" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" className="w-5 h-5 shrink-0" />
                  <Skeleton className="w-36 h-3" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" className="w-5 h-5 shrink-0" />
                  <Skeleton className="w-40 h-3" />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Skeleton variant="pill" className="w-52 h-11" />
          </div>
        </div>

        {/* Karta 2 - VIP Premium */}
        <div className="flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-[370px] sm:max-w-[390px] aspect-square rounded-full bg-rose-50/40 dark:bg-[#1C0812]/80 border border-rose-200 dark:border-rose-900/50 pt-5 sm:pt-6 px-6 pb-14 sm:pb-16 flex flex-col items-center justify-between shadow-lg relative">
            {/* Ikona v kruhu hore + 18+ badge */}
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                <Skeleton variant="circular" className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-4 px-1.5 py-0.2 rounded-full bg-[#FF5A7A] text-white text-[9px] font-black tracking-wider">
                18+
              </span>
            </div>

            {/* Medzera */}
            <div className="h-8 w-full" />

            {/* Stredný textový blok */}
            <div className="space-y-2 flex flex-col items-center w-full">
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-36 h-7" />
                <Skeleton variant="pill" className="w-8 h-4" />
              </div>
              <Skeleton className="w-36 h-4" />

              {/* 3 bullet riadky */}
              <div className="space-y-2 pt-1 w-full max-w-[220px]">
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" className="w-5 h-5 shrink-0" />
                  <Skeleton className="w-44 h-3" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" className="w-5 h-5 shrink-0" />
                  <Skeleton className="w-40 h-3" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" className="w-5 h-5 shrink-0" />
                  <Skeleton className="w-48 h-3" />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Skeleton variant="pill" className="w-52 h-11" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 💎 Skeleton pre Krok 2 (Balíčky a dĺžka masáže - 3 karty)
 */
export function Step2PackagesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-[24px] bg-white dark:bg-[#0B0D22] border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 flex flex-col justify-between shadow-sm"
        >
          <div className="space-y-4">
            {/* Header odznak */}
            <div className="flex items-center justify-between">
              <Skeleton variant="pill" className="w-24 h-5" />
              <Skeleton variant="circular" className="w-7 h-7" />
            </div>

            {/* Cena */}
            <div className="space-y-1">
              <Skeleton className="w-28 h-8" />
              <Skeleton className="w-16 h-3" />
            </div>

            {/* Procedúry */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-36 h-3.5" />
              </div>
              <div className="space-y-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <Skeleton className="w-28 h-3" />
                <Skeleton className="w-44 h-3.5" />
              </div>
              <div className="space-y-2 pt-1">
                <Skeleton className="w-32 h-3" />
                <div className="space-y-1.5">
                  <Skeleton className="w-full h-3" />
                  <Skeleton className="w-5/6 h-3" />
                  <Skeleton className="w-4/5 h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Tlačidlo */}
          <Skeleton className="w-full h-11 rounded-xl mt-4" />
        </div>
      ))}
    </div>
  );
}

/**
 * 📅 Skeleton pre Krok 3 (Mriežka kalendára, termíny a navigácia 1:1)
 */
export function Step3CalendarSkeleton({ isVip = true }: { isVip?: boolean }) {
  const dayNames = ['PO', 'UT', 'ST', 'ŠT', 'PI', 'SO', 'NE'];

  return (
    <div className="space-y-6 max-w-xl mx-auto animate-fadeIn text-center font-sans">
      
      {/* 1. Mriežka kalendára vnútri bielej/tmavej karty */}
      <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 ${
        isVip 
          ? 'border-[#FF5A7A]/30 bg-white dark:bg-[#0D0207]/90' 
          : 'border-slate-200 dark:border-[#2B2F49] bg-white dark:bg-[#010314]/90'
      }`}>
        {/* Mesiac Header */}
        <div className="flex justify-between items-center px-2">
          <Skeleton className="w-36 h-5" />
          <div className="flex space-x-2 items-center">
            <Skeleton variant="circular" className="w-8 h-8" />
            <Skeleton variant="circular" className="w-8 h-8" />
          </div>
        </div>

        {/* Názvy dní v týždni */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {dayNames.map((d, i) => (
            <span key={i} className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Mriežka dní kalendára (5 riadkov x 7 dní) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-1">
          {/* Prvé 2 offsetové prázdne dni */}
          <div className="h-10 sm:h-12" />
          <div className="h-10 sm:h-12" />

          {/* 30 dní s jemným placeholderom čísel */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="h-10 sm:h-12 rounded-xl flex items-center justify-center text-xs font-semibold text-slate-300 dark:text-slate-700 select-none"
            >
              <Skeleton className="w-5 h-4 rounded-sm opacity-60" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Spodné tlačidlo "Späť na výber balíčka" */}
      <div className="flex justify-center pt-2">
        <Skeleton variant="pill" className="w-56 h-10" />
      </div>

    </div>
  );
}

import { Calendar, History, Settings, Gift, Sparkles, ShieldCheck } from 'lucide-react';

/**
 * 👤 Skeleton pre stránku Profilu (/profil) - presná 1:1 kópia reálnych kariet
 */
export function ProfilePageSkeleton() {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-6 pt-[calc(env(safe-area-inset-top,24px)+5rem)] sm:pt-28 lg:pt-32 pb-36 sm:pb-44 gap-4 bg-transparent transition-colors duration-300 font-sans overflow-hidden text-[#1E293B] dark:text-[#DDE0F2] animate-fadeIn">
      <div className="relative z-10 w-full max-w-sm sm:max-w-xl flex flex-col gap-4">
        
        {/* ================================================================ */}
        {/* 1. HLAVIČKA PROFILU SKELETON: AVATAR, MENO, EMAIL A TLAČIDLÁ     */}
        {/* ================================================================ */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm dark:shadow-md flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <Skeleton variant="circular" className="w-14 h-14" />
            </div>
            
            <div className="min-w-0 space-y-1.5 flex-1">
              <Skeleton className="w-32 sm:w-40 h-5" />
              <Skeleton className="w-40 sm:w-48 h-3.5" />
              <div className="pt-0.5">
                <Skeleton variant="pill" className="w-24 h-4.5" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Skeleton variant="pill" className="w-24 h-7" />
            <Skeleton variant="pill" className="w-20 h-7" />
          </div>
        </div>

        {/* ================================================================ */}
        {/* 2. KONTROLA REZERVÁCIÍ SKELETON                                  */}
        {/* ================================================================ */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm dark:shadow-md space-y-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#6633EE] dark:text-[#A78BFA]" />
              <h3 className="font-semibold text-xs text-[#0B0D22] dark:text-[#FFFFFF] uppercase tracking-wider">
                Kontrola rezervácií
              </h3>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-3">
            <Skeleton className="w-4/5 sm:w-3/4 h-3.5 mx-auto" />
            <div className="flex justify-center pt-1">
              <Skeleton variant="pill" className="w-52 h-9" />
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 3. HISTÓRIA NÁVŠTEV A PROCEDÚR SKELETON                           */}
        {/* ================================================================ */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm dark:shadow-md space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[#6633EE] dark:text-[#A78BFA]" />
              <h3 className="font-semibold text-xs text-[#0B0D22] dark:text-[#FFFFFF] uppercase tracking-wider">
                História návštev a procedúr
              </h3>
            </div>
            <Skeleton className="w-16 h-3.5" />
          </div>

          {/* Súhrnné štatistické boxy */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-1">
              <Skeleton className="w-8 h-6 mx-auto" />
              <Skeleton className="w-28 h-2.5 mx-auto" />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-1">
              <Skeleton className="w-8 h-6 mx-auto" />
              <Skeleton className="w-28 h-2.5 mx-auto" />
            </div>
          </div>

          <div className="text-center py-2">
            <Skeleton className="w-48 h-3 mx-auto" />
          </div>
        </div>

      </div>
    </main>
  );
}

import { Award } from 'lucide-react';

/**
 * 🏆 Skeleton pre samotnú mriežku odznakov (BadgesGrid)
 */
export function BadgesGridSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-y-6 gap-x-2 sm:gap-x-4 pt-1">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center text-center space-y-2">
          <div className="relative">
            <Skeleton variant="circular" className="w-14 h-14 sm:w-16 sm:h-16" />
            <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-slate-200 dark:bg-[#1E2538] border border-white dark:border-[#0B0D22]" />
          </div>
          <Skeleton className="w-14 sm:w-16 h-3" />
          <Skeleton className="w-9 sm:w-10 h-2.5" />
        </div>
      ))}
    </div>
  );
}

/**
 * 🎁 Skeleton pre stránku Vernosti (/vernost) - presná 1:1 kópia screenshotu
 */
export function LoyaltyPageSkeleton() {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-6 pt-[calc(env(safe-area-inset-top,24px)+5rem)] sm:pt-28 lg:pt-32 pb-36 sm:pb-44 gap-4 bg-transparent transition-colors duration-300 font-sans overflow-hidden text-[#1E293B] dark:text-[#DDE0F2] animate-fadeIn">
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col gap-4">
        
        {/* ================================================================ */}
        {/* 1. PEČIATKOVÁ KARTA SKELETON (MASSAGE REWARD)                    */}
        {/* ================================================================ */}
        <div className="relative overflow-hidden w-full max-w-md p-6 sm:p-8 rounded-2xl backdrop-blur-2xl border border-[#E2E8F0] dark:border-[#2B2F49] bg-white dark:bg-[#0B0D22] shadow-xl text-[#1E293B] dark:text-[#DDE0F2] text-left">
          
          {/* Hlavička karty */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="w-11 h-11" />
              <div className="space-y-1">
                <Skeleton className="w-32 sm:w-36 h-5" />
                <Skeleton className="w-24 h-3.5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Skeleton variant="circular" className="w-9 h-9" />
              <Skeleton variant="circular" className="w-9 h-9" />
            </div>
          </div>

          {/* Držiteľ karty */}
          <div className="mb-6 space-y-1">
            <Skeleton className="w-20 h-2.5" />
            <Skeleton className="w-36 sm:w-44 h-6" />
          </div>

          {/* Pečiatky header + mriežka 2x5 */}
          <div className="space-y-3">
            <Skeleton className="w-28 h-3.5" />

            <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square h-14 sm:h-16 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] flex items-center justify-center"
                >
                  <Skeleton className="w-4 h-5 rounded-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Spodný text */}
          <div className="pt-6 text-center">
            <Skeleton className="w-48 h-3 mx-auto" />
          </div>
        </div>

        {/* ================================================================ */}
        {/* 2. ODZNAKY A ÚSPECHY HLAVIČKA SKELETON                           */}
        {/* ================================================================ */}
        <div className="w-full space-y-4 font-sans text-left">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <Skeleton variant="circular" className="w-9 h-9" />
              <div className="space-y-1">
                <Skeleton className="w-32 sm:w-36 h-4" />
                <Skeleton className="w-44 sm:w-48 h-3" />
              </div>
            </div>

            <Skeleton variant="pill" className="w-20 h-7" />
          </div>

          {/* ================================================================ */}
          {/* 3. ODZNAKOVÁ MRIEŽKA 4 STĹPCE SKELETON                            */}
          {/* ================================================================ */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-md dark:shadow-2xl">
            <BadgesGridSkeleton />
          </div>
        </div>

      </div>
    </main>
  );
}

/**
 * 📜 Skeleton pre zoznam histórie (UserHistoryModal)
 */
export function UserHistorySkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
        >
          <Skeleton variant="rounded" className="w-8 h-8 rounded-xl shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5 text-left">
            <Skeleton className="w-36 h-3.5" />
            <Skeleton className="w-24 h-2.5" />
          </div>
          <Skeleton variant="pill" className="w-14 h-5 shrink-0" />
        </div>
      ))}
    </div>
  );
}
