'use client';

import React, { useState, useMemo } from 'react';
import { Profile } from '@/app/types';
import { 
  Database, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Minus,
  CheckSquare,
  Square,
  ShieldCheck, 
  UserX, 
  Users, 
  Calendar, 
  Stamp, 
  Gift, 
  Filter, 
  ArrowUpDown, 
  RefreshCw, 
  Mail, 
  Fingerprint, 
  Ban,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { formatCreationTime } from '@/app/utils/bookingUtils';

interface AdminDatabaseSectionProps {
  profiles: Profile[];
  refreshProfiles: () => Promise<void>;
  language: 'sk' | 'en';
}

export default function AdminDatabaseSection({
  profiles,
  refreshProfiles,
  language,
}: AdminDatabaseSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin' | 'banned' | 'test'>('all');
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'name_asc' | 'stamps_desc'>('created_desc');
  
  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Deletion modal state (single user)
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  
  // Deletion modal state (batch)
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfiles();
    setIsRefreshing(false);
  };

  // Stats
  const stats = useMemo(() => {
    const total = profiles.length;
    const admins = profiles.filter((p) => p.role === 'admin').length;
    const banned = profiles.filter((p) => p.is_banned).length;
    const withStamps = profiles.filter((p) => p.stamps && p.stamps.filter((s) => !s.removed_at).length > 0).length;
    const testAccounts = profiles.filter((p) => {
      const name = (p.full_name || '').toLowerCase();
      const email = p.email.toLowerCase();
      return name.includes('test') || email.includes('test') || email.includes('example.com') || (!p.full_name && (!p.stamps || p.stamps.length === 0));
    }).length;

    return { total, admins, banned, withStamps, testAccounts };
  }, [profiles]);

  // Filtered & Sorted list
  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return profiles
      .filter((p) => {
        // Search
        const matchSearch =
          (p.full_name || '').toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.referral_code || '').toLowerCase().includes(q);

        if (!matchSearch) return false;

        // Role / Status Filter
        if (roleFilter === 'admin') return p.role === 'admin';
        if (roleFilter === 'user') return p.role !== 'admin';
        if (roleFilter === 'banned') return !!p.is_banned;
        if (roleFilter === 'test') {
          const name = (p.full_name || '').toLowerCase();
          const email = p.email.toLowerCase();
          return name.includes('test') || email.includes('test') || email.includes('example.com') || (!p.full_name && (!p.stamps || p.stamps.length === 0));
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'created_desc') {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        }
        if (sortBy === 'created_asc') {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeA - timeB;
        }
        if (sortBy === 'name_asc') {
          const nameA = (a.full_name || a.email).toLowerCase();
          const nameB = (b.full_name || b.email).toLowerCase();
          return nameA.localeCompare(nameB);
        }
        if (sortBy === 'stamps_desc') {
          const stampsA = a.stamps ? a.stamps.filter((s) => !s.removed_at).length : 0;
          const stampsB = b.stamps ? b.stamps.filter((s) => !s.removed_at).length : 0;
          return stampsB - stampsA;
        }
        return 0;
      });
  }, [profiles, searchQuery, roleFilter, sortBy]);

  // Master Checkbox Status
  const allFilteredSelected = useMemo(() => {
    if (filteredProfiles.length === 0) return false;
    return filteredProfiles.every((p) => selectedUserIds.includes(p.id));
  }, [filteredProfiles, selectedUserIds]);

  const someFilteredSelected = useMemo(() => {
    if (filteredProfiles.length === 0) return false;
    const count = filteredProfiles.filter((p) => selectedUserIds.includes(p.id)).length;
    return count > 0 && count < filteredProfiles.length;
  }, [filteredProfiles, selectedUserIds]);

  const handleToggleMasterCheckbox = () => {
    if (allFilteredSelected) {
      // Deselect all visible filtered
      const filteredIdSet = new Set(filteredProfiles.map((p) => p.id));
      setSelectedUserIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      // Select all visible filtered
      const newSelected = new Set(selectedUserIds);
      filteredProfiles.forEach((p) => newSelected.add(p.id));
      setSelectedUserIds(Array.from(newSelected));
    }
  };

  const handleToggleUserSelection = (userId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleDeselectAll = () => {
    setSelectedUserIds([]);
  };

  const handleSelectAllVisible = () => {
    const newSelected = new Set(selectedUserIds);
    filteredProfiles.forEach((p) => newSelected.add(p.id));
    setSelectedUserIds(Array.from(newSelected));
  };

  // Single User Deletion
  const handleDeleteSingleUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToDelete.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (language === 'sk' ? 'Chyba pri mazaní profilu.' : 'Failed to delete profile.'));
      }

      setActionSuccess(
        language === 'sk'
          ? `Profil "${userToDelete.full_name || userToDelete.email}" bol úspešne a natrvalo vymazaný z databázy.`
          : `Profile "${userToDelete.full_name || userToDelete.email}" was permanently deleted from database.`
      );
      setSelectedUserIds((prev) => prev.filter((id) => id !== userToDelete.id));
      setUserToDelete(null);
      await refreshProfiles();
    } catch (err: any) {
      console.error('Delete error:', err);
      setActionError(err?.message || (language === 'sk' ? 'Nastala neočakávaná chyba.' : 'An unexpected error occurred.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Batch Deletion
  const handleBatchDelete = async () => {
    if (selectedUserIds.length === 0) return;

    setIsDeleting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (language === 'sk' ? 'Chyba pri hromadnom mazaní profilov.' : 'Failed to delete profiles.'));
      }

      setActionSuccess(
        language === 'sk'
          ? `${data.deletedCount || selectedUserIds.length} profilov bolo úspešne a natrvalo vymazaných z databázy.`
          : `${data.deletedCount || selectedUserIds.length} profiles were permanently deleted from database.`
      );
      setSelectedUserIds([]);
      setShowBatchDeleteModal(false);
      await refreshProfiles();
    } catch (err: any) {
      console.error('Batch delete error:', err);
      setActionError(err?.message || (language === 'sk' ? 'Nastala neočakávaná chyba.' : 'An unexpected error occurred.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Selected profiles objects for batch modal
  const selectedProfilesList = useMemo(() => {
    const idSet = new Set(selectedUserIds);
    return profiles.filter((p) => idSet.has(p.id));
  }, [profiles, selectedUserIds]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200 relative pb-36">
      {/* Top Banner / Explanation */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] border border-[#6633EE]/20 flex items-center justify-center shrink-0">
            <Database size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-[#0B0D22] dark:text-white flex items-center gap-2">
              <span>{language === 'sk' ? 'Správa databázy profilov' : 'Database Profile Management'}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-[#151938] text-slate-600 dark:text-[#C7CAE0]">
                {profiles.length} {language === 'sk' ? 'záznamov' : 'records'}
              </span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60 mt-0.5">
              {language === 'sk'
                ? 'Hromadné i individuálne mazanie testovacích alebo nechcených účtov priamo zo Supabase.'
                : 'Bulk and individual deletion of test or obsolete accounts directly from Supabase.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#151938] text-slate-700 dark:text-[#DDE0F2] text-xs font-semibold hover:bg-slate-200 dark:hover:bg-[#1E234B] border border-slate-200 dark:border-[#2B2F49] transition cursor-pointer shrink-0 disabled:opacity-60"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#6633EE]' : ''} />
          <span>{language === 'sk' ? 'Obnoviť zoznam' : 'Refresh list'}</span>
        </button>
      </div>

      {/* Success / Error Messages */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer text-xs font-semibold"
          >
            {language === 'sk' ? 'Zavrieť' : 'Dismiss'}
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-700 dark:text-rose-300 hover:underline cursor-pointer text-xs font-semibold"
          >
            {language === 'sk' ? 'Zavrieť' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] dark:text-[#C7CAE0]/70 text-xs font-semibold">
            <span>{language === 'sk' ? 'Všetky profily' : 'All Profiles'}</span>
            <Users size={15} className="text-[#6633EE]" />
          </div>
          <div className="text-lg font-bold text-[#0B0D22] dark:text-white mt-1">
            {stats.total}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] dark:text-[#C7CAE0]/70 text-xs font-semibold">
            <span>{language === 'sk' ? 'Administrátori' : 'Admins'}</span>
            <ShieldCheck size={15} className="text-amber-500" />
          </div>
          <div className="text-lg font-bold text-[#0B0D22] dark:text-white mt-1">
            {stats.admins}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] dark:text-[#C7CAE0]/70 text-xs font-semibold">
            <span>{language === 'sk' ? 'S pečiatkami' : 'With stamps'}</span>
            <Stamp size={15} className="text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-[#0B0D22] dark:text-white mt-1">
            {stats.withStamps}
          </div>
        </div>

        <div 
          onClick={() => setRoleFilter('test')}
          className="p-3.5 rounded-xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs hover:border-[#6633EE]/50 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[#64748B] dark:text-[#C7CAE0]/70 text-xs font-semibold">
            <span>{language === 'sk' ? 'Testovacie profily' : 'Test Profiles'}</span>
            <Sparkles size={15} className="text-purple-400" />
          </div>
          <div className="text-lg font-bold text-[#0B0D22] dark:text-white mt-1 flex items-center justify-between">
            <span>{stats.testAccounts}</span>
            <span className="text-[10px] font-normal text-[#6633EE] dark:text-[#A78BFA] underline">
              {language === 'sk' ? 'Zobraziť' : 'Show'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              placeholder={language === 'sk' ? 'Hľadať podľa mena, e-mailu alebo ID používateľa...' : 'Search by name, email, or user ID...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-xl text-xs text-[#0B0D22] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#6633EE] transition"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={15} className="text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-xl text-xs text-[#0B0D22] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6633EE] transition cursor-pointer"
            >
              <option value="created_desc">
                {language === 'sk' ? 'Najnovšie zaregistrovaní' : 'Newest registered'}
              </option>
              <option value="created_asc">
                {language === 'sk' ? 'Najstaršie zaregistrovaní' : 'Oldest registered'}
              </option>
              <option value="name_asc">
                {language === 'sk' ? 'Podľa mena (A-Z)' : 'By name (A-Z)'}
              </option>
              <option value="stamps_desc">
                {language === 'sk' ? 'Najviac pečiatok' : 'Most stamps'}
              </option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-[#1E234B]">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#C7CAE0]/60 mr-1">
            <Filter size={13} />
            <span>{language === 'sk' ? 'Filter:' : 'Filter:'}</span>
          </div>

          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-[#6633EE] text-white'
                : 'bg-slate-100 dark:bg-[#151938] text-slate-600 dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white'
            }`}
          >
            {language === 'sk' ? `Všetci (${profiles.length})` : `All (${profiles.length})`}
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('user')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              roleFilter === 'user'
                ? 'bg-[#6633EE] text-white'
                : 'bg-slate-100 dark:bg-[#151938] text-slate-600 dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white'
            }`}
          >
            {language === 'sk' ? `Bežní klienti (${profiles.length - stats.admins})` : `Regular clients (${profiles.length - stats.admins})`}
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('test')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              roleFilter === 'test'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200/50 dark:border-purple-800/40'
            }`}
          >
            <Sparkles size={12} />
            <span>{language === 'sk' ? `Testovacie účty (${stats.testAccounts})` : `Test accounts (${stats.testAccounts})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              roleFilter === 'admin'
                ? 'bg-[#6633EE] text-white'
                : 'bg-slate-100 dark:bg-[#151938] text-slate-600 dark:text-[#C7CAE0]/70 hover:text-[#0B0D22] dark:hover:text-white'
            }`}
          >
            {language === 'sk' ? `Admini (${stats.admins})` : `Admins (${stats.admins})`}
          </button>

          {stats.banned > 0 && (
            <button
              type="button"
              onClick={() => setRoleFilter('banned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === 'banned'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
              }`}
            >
              {language === 'sk' ? `Zablokovaní (${stats.banned})` : `Banned (${stats.banned})`}
            </button>
          )}
        </div>
      </div>

      {/* 🚀 BATCH & MASTER CHECKBOX BAR */}
      <div className="p-3 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Master Checkbox + Selection Stats */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleMasterCheckbox}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer border ${
              allFilteredSelected || someFilteredSelected
                ? 'bg-[#6633EE] text-white border-[#6633EE] shadow-xs'
                : 'bg-slate-50 dark:bg-[#010314] border-slate-300 dark:border-slate-600 hover:border-[#6633EE] text-transparent'
            }`}
            title={
              allFilteredSelected
                ? (language === 'sk' ? 'Zrušiť označenie všetkých' : 'Deselect all')
                : (language === 'sk' ? 'Označiť všetkých zobrazených' : 'Select all visible')
            }
          >
            {allFilteredSelected && <Check size={14} className="stroke-[3]" />}
            {someFilteredSelected && <Minus size={14} className="stroke-[3]" />}
          </button>

          <div className="text-xs">
            <span className="font-semibold text-[#0B0D22] dark:text-white">
              {allFilteredSelected
                ? (language === 'sk' ? 'Všetky profily označené' : 'All profiles selected')
                : someFilteredSelected
                ? (language === 'sk' ? `Označená časť (${selectedUserIds.length}/${filteredProfiles.length})` : `Partially selected (${selectedUserIds.length}/${filteredProfiles.length})`)
                : (language === 'sk' ? 'Označiť všetky profily' : 'Select all profiles')}
            </span>
            <span className="text-[#64748B] dark:text-[#C7CAE0]/60 ml-2">
              ({filteredProfiles.length} {language === 'sk' ? 'zobrazených' : 'visible'})
            </span>
          </div>
        </div>

        {/* Right: Quick action buttons */}
        <div className="flex items-center gap-2">
          {selectedUserIds.length > 0 && (
            <button
              type="button"
              onClick={handleDeselectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#151938] text-slate-600 dark:text-[#C7CAE0]/80 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-[#1E234B] transition cursor-pointer"
            >
              <X size={13} />
              <span>{language === 'sk' ? 'Zrušiť výber' : 'Deselect'}</span>
            </button>
          )}

          {!allFilteredSelected && filteredProfiles.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-[#6633EE]/15 text-[#6633EE] dark:text-[#A78BFA] text-xs font-semibold hover:bg-purple-100 dark:hover:bg-[#6633EE]/25 transition cursor-pointer border border-[#6633EE]/20"
            >
              <CheckSquare size={13} />
              <span>{language === 'sk' ? 'Označiť zobrazených' : 'Select visible'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Profiles List */}
      <div className="space-y-2.5">
        {filteredProfiles.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-2xl">
            <UserX size={32} className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {language === 'sk' ? 'Nenašli sa žiadne profily zodpovedajúce filtrom.' : 'No profiles match the filter criteria.'}
            </p>
          </div>
        ) : (
          filteredProfiles.map((p) => {
            const isSelected = selectedUserIds.includes(p.id);
            const activeStamps = p.stamps ? p.stamps.filter((s) => !s.removed_at).length : 0;
            const activeGifts = p.gifts ? p.gifts.filter((g) => !g.used && !g.revoked_at).length : 0;
            const isTest = 
              (p.full_name || '').toLowerCase().includes('test') || 
              p.email.toLowerCase().includes('test') || 
              p.email.toLowerCase().includes('example.com') ||
              (!p.full_name && activeStamps === 0);

            return (
              <div
                key={p.id}
                onClick={() => handleToggleUserSelection(p.id)}
                className={`p-4 rounded-2xl bg-white dark:bg-[#0B0D22] border transition-all duration-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none ${
                  isSelected
                    ? 'border-[#6633EE] bg-purple-50/40 dark:bg-[#6633EE]/10 ring-1 ring-[#6633EE]/30'
                    : isTest
                    ? 'border-purple-200 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/10 hover:border-[#6633EE]/40'
                    : 'border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE]/40'
                }`}
              >
                {/* Left Side: Checkbox, Avatar & Details */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* Individual Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleUserSelection(p.id, e)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition cursor-pointer border mt-0.5 sm:mt-0 ${
                      isSelected
                        ? 'bg-[#6633EE] text-white border-[#6633EE] shadow-xs'
                        : 'bg-slate-50 dark:bg-[#010314] border-slate-300 dark:border-slate-600 hover:border-[#6633EE] text-transparent'
                    }`}
                  >
                    {isSelected && <Check size={14} className="stroke-[3]" />}
                  </button>

                  {/* Avatar Initials */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                    p.role === 'admin'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : isTest
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : 'bg-[#6633EE]/10 dark:bg-[#6633EE]/20 text-[#6633EE] dark:text-[#A78BFA] border-[#6633EE]/20'
                  }`}>
                    {p.full_name
                      ? p.full_name.substring(0, 2).toUpperCase()
                      : p.email.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-xs text-[#0B0D22] dark:text-white truncate">
                        {p.full_name || (language === 'sk' ? 'Bez mena' : 'No name')}
                      </span>

                      {/* Badges */}
                      {p.role === 'admin' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <ShieldCheck size={11} />
                          <span>Admin</span>
                        </span>
                      )}

                      {isTest && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <Sparkles size={11} />
                          <span>Test</span>
                        </span>
                      )}

                      {p.is_banned && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <Ban size={11} />
                          <span>{language === 'sk' ? 'Blokovaný' : 'Banned'}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B] dark:text-[#C7CAE0]/70">
                      {/* Email */}
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" />
                        <span className="font-mono text-[11px] truncate max-w-[200px] sm:max-w-none">{p.email}</span>
                      </span>

                      {/* Registration Date */}
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{p.created_at ? formatCreationTime(p.created_at, language)?.formattedDateTime : (language === 'sk' ? 'Neznámy dátum' : 'Unknown date')}</span>
                      </span>
                    </div>

                    {/* Supabase ID and badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#010314] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#2B2F49]">
                        <Fingerprint size={11} className="text-slate-400" />
                        <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 max-w-[120px] sm:max-w-[200px] truncate">
                          {p.id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(p.id, e)}
                          className="text-slate-400 hover:text-[#6633EE] transition p-0.5 cursor-pointer"
                          title={language === 'sk' ? 'Kopírovať ID' : 'Copy ID'}
                        >
                          {copiedId === p.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        </button>
                      </div>

                      {/* Stamps & Gifts info */}
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 bg-slate-50 dark:bg-[#151938] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#2B2F49]">
                        <Stamp size={11} className="text-purple-500" />
                        <span>{activeStamps} {language === 'sk' ? 'pečiatok' : 'stamps'}</span>
                      </span>

                      {activeGifts > 0 && (
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <Gift size={11} />
                          <span>{activeGifts} {language === 'sk' ? 'prekvapenie' : 'surprise'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Delete Button */}
                <div className="flex items-center justify-end md:justify-start shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#1E234B]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserToDelete(p);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-800 transition active:scale-95 cursor-pointer shadow-2xs"
                    title={language === 'sk' ? 'Vymazať profil z databázy' : 'Delete profile from database'}
                  >
                    <Trash2 size={14} />
                    <span>{language === 'sk' ? 'Vymazať z DB' : 'Delete from DB'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🚀 STICKY BULK ACTION BAR */}
      {selectedUserIds.length > 0 && (
        <div 
          className="fixed left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-lg bg-[#0B0D22]/95 dark:bg-[#151938]/95 backdrop-blur-md text-white border border-[#6633EE]/50 p-3.5 sm:p-4 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200 ring-1 ring-white/10"
          style={{ bottom: 'calc(5.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#6633EE] flex items-center justify-center shrink-0 shadow-sm">
              <CheckSquare size={16} className="text-white" />
            </div>
            <div className="truncate">
              <span className="font-bold text-xs sm:text-sm block leading-tight">
                {language === 'sk'
                  ? `Vybraných ${selectedUserIds.length} ${selectedUserIds.length === 1 ? 'profil' : selectedUserIds.length < 5 ? 'profily' : 'profilov'}`
                  : `${selectedUserIds.length} ${selectedUserIds.length === 1 ? 'profile' : 'profiles'} selected`}
              </span>
              <span className="text-[11px] text-slate-300 block">
                {language === 'sk' ? 'Hromadná akcia pre označené záznamy' : 'Bulk actions for selected records'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition cursor-pointer"
            >
              {language === 'sk' ? 'Zrušiť' : 'Deselect'}
            </button>

            <button
              type="button"
              onClick={() => setShowBatchDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>{language === 'sk' ? `Vymazať (${selectedUserIds.length})` : `Delete (${selectedUserIds.length})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single User Deletion */}
      {userToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B0D22] dark:text-white leading-snug">
                  {language === 'sk' ? 'Naozaj chcete natrvalo vymazať profil?' : 'Permanently delete this profile?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'sk' ? 'Táto operácia je nevratná a odstráni záznam priamo zo Supabase.' : 'This operation cannot be undone and deletes the record from Supabase.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === 'sk' ? 'Meno:' : 'Name:'}</span>
                <span className="font-semibold text-[#0B0D22] dark:text-white">
                  {userToDelete.full_name || (language === 'sk' ? 'Bez mena' : 'No name')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === 'sk' ? 'E-mail:' : 'Email:'}</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === 'sk' ? 'ID účtu:' : 'Account ID:'}</span>
                <span className="font-mono text-[11px] text-slate-500">{userToDelete.id}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
              <Info size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                {language === 'sk'
                  ? 'Budú odstránené aj všetky pridružené pečiatky, udelené prekvapenia, požiadavky na storno a overenia.'
                  : 'All associated stamps, active gifts, storno requests, and authentications will also be deleted.'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#151938] text-slate-700 dark:text-[#DDE0F2] text-xs font-semibold hover:bg-slate-200 dark:hover:bg-[#1E234B] transition cursor-pointer disabled:opacity-50"
              >
                {language === 'sk' ? 'Zrušiť' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleDeleteSingleUser}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{language === 'sk' ? 'Mazanie...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>{language === 'sk' ? 'Áno, natrvalo vymazať' : 'Yes, delete permanently'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 Confirmation Modal for BATCH Deletion */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B0D22] dark:text-white leading-snug">
                  {language === 'sk'
                    ? `Naozaj chcete natrvalo vymazať ${selectedUserIds.length} profilov?`
                    : `Permanently delete ${selectedUserIds.length} profiles?`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'sk'
                    ? 'Táto operácia hromadne a nevratne vymaže všetky označené účty zo Supabase.'
                    : 'This bulk operation is irreversible and will delete all selected accounts from Supabase.'}
                </p>
              </div>
            </div>

            {/* List of Profiles to be Deleted */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] max-h-48 overflow-y-auto space-y-2 divide-y divide-slate-200/60 dark:divide-[#2B2F49]/60 text-xs">
              {selectedProfilesList.slice(0, 8).map((p) => (
                <div key={p.id} className="pt-2 first:pt-0 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#0B0D22] dark:text-white block">
                      {p.full_name || (language === 'sk' ? 'Bez mena' : 'No name')}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">{p.email}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-200/70 dark:bg-[#151938] px-2 py-0.5 rounded">
                    {p.id.slice(0, 8)}...
                  </span>
                </div>
              ))}
              {selectedProfilesList.length > 8 && (
                <p className="text-center text-[11px] font-semibold text-purple-600 dark:text-purple-400 pt-2">
                  {language === 'sk'
                    ? `... a ďalších ${selectedProfilesList.length - 8} profilov`
                    : `... and ${selectedProfilesList.length - 8} more profiles`}
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-200">
              <Info size={15} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>
                {language === 'sk'
                  ? `Všetky pečiatky, prekvapenia, žiadosti o storno a prepojenia týchto ${selectedUserIds.length} používateľov budú vymazané.`
                  : `All stamps, gifts, storno requests, and authentications of these ${selectedUserIds.length} users will be permanently deleted.`}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#151938] text-slate-700 dark:text-[#DDE0F2] text-xs font-semibold hover:bg-slate-200 dark:hover:bg-[#1E234B] transition cursor-pointer disabled:opacity-50"
              >
                {language === 'sk' ? 'Zrušiť' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleBatchDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{language === 'sk' ? 'Hromadné mazanie...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>
                      {language === 'sk'
                        ? `Áno, vymazať ${selectedUserIds.length} ${selectedUserIds.length === 1 ? 'profil' : selectedUserIds.length < 5 ? 'profily' : 'profilov'}`
                        : `Yes, delete ${selectedUserIds.length} profiles`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
