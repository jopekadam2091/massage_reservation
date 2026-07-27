'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Profile } from '@/app/types';
import { 
  X, Search, Trash2, Ban, CheckCircle, Shield, PlusCircle, 
  Layers, AlertTriangle, Loader2, Users, RefreshCw, RotateCcw
} from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  language: string;
};

export default function AdminUserManagementModal({ isOpen, onClose, language }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Stavy pre modal hromadných pečiatok
  const [bulkStampTarget, setBulkStampTarget] = useState<Profile | null>(null);
  const [bulkCount, setBulkCount] = useState<number>(3);
  const [bulkPrice, setBulkPrice] = useState<string>('45');
  const [bulkError, setBulkError] = useState<string>('');
  const [bulkSubmitting, setBulkSubmitting] = useState<boolean>(false);

  // Stav pre potvrdenie vymazania a resetu
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.users) {
        setProfiles(data.users);
      } else {
        console.error('Chyba pri načítaní používateľov:', data.error);
      }
    } catch (err) {
      console.error('Chyba načítavania používateľov:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProfiles = profiles.filter((p) =>
    (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 1. Vymazanie používateľa
  const handleDeleteUser = async (profile: Profile) => {
    setActionLoadingId(profile.id);
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });
      const data = await res.json();

      if (res.ok) {
        setDeleteTarget(null);
        await fetchProfiles();
        alert(language === 'sk' ? 'Používateľ bol úspešne vymazaný z databázy.' : 'User successfully deleted.');
      } else {
        alert(data.error || 'Chyba pri mazaní používateľa.');
      }
    } catch {
      alert('Chyba pripojenia.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Ban / Unban používateľa
  const handleToggleBan = async (profile: Profile) => {
    const newBanStatus = !profile.is_banned;
    const confirmMsg = newBanStatus
      ? (language === 'sk' ? `Naozaj chcete zabanovať používateľa ${profile.full_name || profile.email}?` : `Ban user ${profile.full_name || profile.email}?`)
      : (language === 'sk' ? `Chcete odblokovať používateľa ${profile.full_name || profile.email}?` : `Unban user ${profile.full_name || profile.email}?`);

    if (!confirm(confirmMsg)) return;

    setActionLoadingId(profile.id);
    try {
      const res = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, isBanned: newBanStatus }),
      });
      const data = await res.json();

      if (res.ok) {
        await fetchProfiles();
      } else {
        alert(data.error || 'Chyba pri zmene stavu účtu.');
      }
    } catch {
      alert('Chyba pripojenia.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Reset histórie používateľa
  const handleResetHistory = async (profile: Profile) => {
    setActionLoadingId(profile.id);
    try {
      const res = await fetch('/api/admin/users/reset-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });
      const data = await res.json();

      if (res.ok) {
        setResetTarget(null);
        await fetchProfiles();
        alert(language === 'sk' ? 'História používateľa bola úspešne resetovaná (karta je na 0).' : 'User history successfully reset.');
      } else {
        alert(data.error || 'Chyba pri resetovaní histórie.');
      }
    } catch {
      alert('Chyba pripojenia.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Hromadné pridanie pečiatok
  const handleBulkStampsSubmit = async () => {
    if (!bulkStampTarget) return;

    const priceNum = parseFloat(bulkPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setBulkError(language === 'sk' ? 'Zadajte platnú sumu za masáž.' : 'Enter a valid price.');
      return;
    }
    if (bulkCount < 1 || bulkCount > 10) {
      setBulkError(language === 'sk' ? 'Počet pečiatok musí byť od 1 do 10.' : 'Stamp count must be 1 to 10.');
      return;
    }

    setBulkSubmitting(true);
    setBulkError('');

    try {
      const res = await fetch('/api/admin/users/bulk-stamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: bulkStampTarget.id,
          count: bulkCount,
          price: priceNum,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setBulkStampTarget(null);
        await fetchProfiles();
        alert(language === 'sk' ? `Úspešne pridaných ${bulkCount} pečiatok!` : `Successfully added ${bulkCount} stamps!`);
      } else {
        setBulkError(data.error || 'Chyba pri pridávaní pečiatok.');
      }
    } catch {
      setBulkError('Chyba pripojenia.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative text-left">
        
        {/* Zavrieť modal */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Hlavička */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 leading-tight">
              {language === 'sk' ? 'Správa používateľov' : 'User Management'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {language === 'sk' 
                ? 'Vymazávanie, zabanovanie a hromadné pripisovanie pečiatok' 
                : 'Delete users, ban accounts, and bulk add stamps'}
            </p>
          </div>
        </div>

        {/* Vyhľadávanie + Obnoviť */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder={language === 'sk' ? 'Vyhľadať meno alebo e-mail...' : 'Search name or email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <button
            type="button"
            onClick={fetchProfiles}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 cursor-pointer"
            title={language === 'sk' ? 'Obnoviť zoznam' : 'Refresh list'}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Zoznam používateľov */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <p className="text-xs">{language === 'sk' ? 'Načítavam používateľov...' : 'Loading users...'}</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {language === 'sk' ? 'Nenašli sa žiadni používatelia.' : 'No users found.'}
            </div>
          ) : (
            filteredProfiles.map((p) => {
              const activeStamps = p.stamps.filter((s) => !s.claimed && !s.removed_at).length;
              const maxStamps = p.program_type === '5_stamps' ? 5 : 10;
              const isBanned = !!p.is_banned;
              const isAdminRole = p.role === 'admin';
              const isLoadingThis = actionLoadingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isBanned
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Detail používateľa */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                          {p.full_name || (language === 'sk' ? 'Bez mena' : 'No name')}
                        </h4>

                        {isAdminRole && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            <Shield size={10} />
                            {language === 'sk' ? 'Admin' : 'Admin'}
                          </span>
                        )}

                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 animate-pulse">
                            <Ban size={10} />
                            {language === 'sk' ? 'ZABANOVANÝ' : 'BANNED'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={10} />
                            {language === 'sk' ? 'Aktívny' : 'Active'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.email}</p>

                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          {language === 'sk' ? 'Pečiatky:' : 'Stamps:'} <strong className="text-slate-700 dark:text-slate-200">{activeStamps}/{maxStamps}</strong>
                        </span>
                        <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          {p.program_type === '5_stamps' ? '5-pečiatkový' : '10-pečiatkový'}
                        </span>
                      </div>
                    </div>

                    {/* Akčné tlačidlá */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      
                      {/* 1. HROMADNÉ PEČIATKY */}
                      <button
                        type="button"
                        onClick={() => {
                          setBulkStampTarget(p);
                          setBulkCount(3);
                          setBulkPrice('45');
                          setBulkError('');
                        }}
                        disabled={isLoadingThis || isBanned}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-40 cursor-pointer"
                        title={language === 'sk' ? 'Hromadné pridanie pečiatok' : 'Bulk add stamps'}
                      >
                        <Layers size={13} />
                        <span>{language === 'sk' ? 'Hromadne' : 'Bulk stamps'}</span>
                      </button>

                      {/* 2. ZABANOVAŤ / ODBANOVAŤ */}
                      <button
                        type="button"
                        onClick={() => handleToggleBan(p)}
                        disabled={isLoadingThis || isAdminRole}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 disabled:opacity-40 cursor-pointer ${
                          isBanned
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
                        }`}
                        title={isBanned ? (language === 'sk' ? 'Odbanovať používateľa' : 'Unban user') : (language === 'sk' ? 'Zabanovať používateľa' : 'Ban user')}
                      >
                        <Ban size={13} />
                        <span>{isBanned ? (language === 'sk' ? 'Odbanovať' : 'Unban') : (language === 'sk' ? 'Zabanovať' : 'Ban')}</span>
                      </button>

                      {/* 3. RESET HISTÓRIE */}
                      <button
                        type="button"
                        onClick={() => setResetTarget(p)}
                        disabled={isLoadingThis}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 disabled:opacity-40 cursor-pointer"
                        title={language === 'sk' ? 'Resetovať históriu masáží a odmien' : 'Reset user history'}
                      >
                        <RotateCcw size={13} />
                        <span>{language === 'sk' ? 'Reset' : 'Reset'}</span>
                      </button>

                      {/* 4. VYMAZAŤ Z DATABÁZY */}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(p)}
                        disabled={isLoadingThis || isAdminRole}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/70 transition active:scale-95 disabled:opacity-40 cursor-pointer"
                        title={language === 'sk' ? 'Vymazať z databázy' : 'Delete from DB'}
                      >
                        <Trash2 size={13} />
                        <span>{language === 'sk' ? 'Vymazať' : 'Delete'}</span>
                      </button>

                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* --- SUB-MODAL 1: HROMADNÉ PRIDANIE PEČIATOK --- */}
      {bulkStampTarget && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 shadow-2xl space-y-4 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" />
                <span>{language === 'sk' ? 'Hromadné pečiatky' : 'Bulk Stamps'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setBulkStampTarget(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {language === 'sk' ? 'Klient: ' : 'Client: '}
              <strong className="text-indigo-600 dark:text-indigo-400">
                {bulkStampTarget.full_name || bulkStampTarget.email}
              </strong>
            </p>

            {bulkError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                {bulkError}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'sk' ? 'Počet pečiatok na priradenie (1–10):' : 'Number of stamps to add (1–10):'}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBulkCount(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                        bulkCount === num
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {num}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'sk' ? 'Cena za 1 masáž (€):' : 'Price per massage (€):'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkStampTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition"
              >
                {language === 'sk' ? 'Zrušiť' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleBulkStampsSubmit}
                disabled={bulkSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {bulkSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <PlusCircle size={14} />
                )}
                <span>{language === 'sk' ? `Pridať ${bulkCount}x` : `Add ${bulkCount}x`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL 2: POTVRDENIE VYMAZANIA POUŽÍVATEĽA --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                {language === 'sk' ? 'Naozaj vymazať používateľa?' : 'Delete user permanently?'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'sk' 
                  ? `Účet ${deleteTarget.full_name || deleteTarget.email} a všetky jeho pečiatky a odmeny budú nenávratne vymazané z databázy.` 
                  : `Account ${deleteTarget.full_name || deleteTarget.email} and all stamps will be permanently deleted.`}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition"
              >
                {language === 'sk' ? 'Zrušiť' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteUser(deleteTarget)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Trash2 size={14} />
                <span>{language === 'sk' ? 'Vymazať' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL 3: POTVRDENIE RESETU HISTÓRIE --- */}
      {resetTarget && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
              <RotateCcw size={24} />
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                {language === 'sk' ? 'Resetovať históriu masáží?' : 'Reset user history?'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'sk' 
                  ? `Pre používateľa ${resetTarget.full_name || resetTarget.email} sa vymažú všetky pečiatky a odmeny. Karta sa vráti na 0.` 
                  : `All stamps and rewards for ${resetTarget.full_name || resetTarget.email} will be cleared back to 0.`}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                {language === 'sk' ? 'Zrušiť' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={() => handleResetHistory(resetTarget)}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <RotateCcw size={14} />
                <span>{language === 'sk' ? 'Resetovať' : 'Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
