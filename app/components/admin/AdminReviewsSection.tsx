'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, Check, X, Trash2, Plus, RefreshCw, 
  MessageSquare, User, CheckCircle2, AlertCircle, Copy, ExternalLink, ShieldCheck,
  Filter, ArrowUpDown, Calendar, Clock, Search, Database, CheckCheck
} from 'lucide-react';
import { formatCreationTime, isWithinRegistrationPeriod } from '@/app/utils/bookingUtils';

interface ReviewItem {
  id: string;
  user_id?: string | null;
  user_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  is_anonymous: boolean;
  source: 'profile' | 'qr_code' | 'admin_manual' | 'landing_modal';
  created_at: string;
  approved_at?: string | null;
}

interface AdminReviewsSectionProps {
  language: string;
}

const SQL_SETUP_SCRIPT = `-- Tabuľka recenzií v Supabase
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    source TEXT DEFAULT 'profile',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reviews_status_created ON public.reviews(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access" ON public.reviews;
CREATE POLICY "Admins have full access" ON public.reviews FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');`;

export default function AdminReviewsSection({ language }: AdminReviewsSectionProps) {
  const isSK = language === 'sk';

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [reviewsSortBy, setReviewsSortBy] = useState<string>('date_desc');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modály
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Formulár pre ručné pridanie
  const [manualName, setManualName] = useState('');
  const [manualRating, setManualRating] = useState(5);
  const [manualComment, setManualComment] = useState('');
  const [manualAnonymous, setManualAnonymous] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        if (typeof data.isDbConnected === 'boolean') {
          setIsDbConnected(data.isDbConnected);
        }
      }
    } catch (e) {
      console.error('Chyba načítania recenzií:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (e) {
      console.error('Chyba aktualizácie statusu:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm(isSK ? 'Naozaj chcete zmazať túto recenziu? Táto akcia je trvalá.' : 'Do you really want to permanently delete this review?')) {
      return;
    }
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error('Chyba vymazania recenzie:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateManualReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualComment.trim()) return;

    setModalSubmitting(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_manual',
          reviewData: {
            user_name: manualName,
            rating: manualRating,
            comment: manualComment,
            is_anonymous: manualAnonymous,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        setReviews((prev) => [data.review, ...prev]);
        setIsAddModalOpen(false);
        setManualName('');
        setManualComment('');
        setManualRating(5);
        setManualAnonymous(false);
      }
    } catch (e) {
      console.error('Chyba vytvorenia recenzie:', e);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  const pendingReviews = reviews.filter((r) => r.status === 'pending');
  const approvedReviews = reviews.filter((r) => r.status === 'approved');
  const baseTabReviews =
    activeTab === 'pending'
      ? pendingReviews
      : activeTab === 'approved'
      ? approvedReviews
      : reviews;

  const displayedReviews = useMemo(() => {
    let list = [...baseTabReviews];

    // Filter hľadania textu / mena
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.user_name || '').toLowerCase().includes(q) ||
          (r.comment || '').toLowerCase().includes(q)
      );
    }

    // Filter dátumu
    if (dateFilter !== 'all') {
      list = list.filter((r) => isWithinRegistrationPeriod(r.created_at, dateFilter));
    }

    // Filter hodnotenia
    if (ratingFilter !== 'all') {
      const star = parseInt(ratingFilter, 10);
      list = list.filter((r) => r.rating === star);
    }

    // Zoradenie
    return list.sort((a, b) => {
      if (reviewsSortBy === 'date_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (reviewsSortBy === 'date_asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (reviewsSortBy === 'rating_desc') {
        return b.rating - a.rating;
      }
      if (reviewsSortBy === 'rating_asc') {
        return a.rating - b.rating;
      }
      if (reviewsSortBy === 'name_asc') {
        return (a.user_name || '').localeCompare(b.user_name || '', 'sk');
      }
      if (reviewsSortBy === 'name_desc') {
        return (b.user_name || '').localeCompare(a.user_name || '', 'sk');
      }
      return 0;
    });
  }, [baseTabReviews, searchQuery, dateFilter, ratingFilter, reviewsSortBy]);

  const hasActiveFilters = dateFilter !== 'all' || ratingFilter !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="space-y-4 text-left">
      {/* Horný akčný panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <MessageSquare size={18} className="text-[#6633EE] dark:text-[#A78BFA]" />
            <h2 className="font-bold text-sm sm:text-base text-[#0B0D22] dark:text-white uppercase tracking-wider">
              {isSK ? 'Správa Recenzií & Hodnotení' : 'Reviews & Ratings Management'}
            </h2>

            {/* DB status indikátor */}
            {isDbConnected === true ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Database size={10} />
                <span>Supabase DB</span>
              </span>
            ) : isDbConnected === false ? (
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
                title={isSK ? 'Kliknite pre aktiváciu databázy v Supabase' : 'Click to setup Supabase DB'}
              >
                <AlertCircle size={10} />
                <span>{isSK ? 'Záložný súbor (Aktivovať DB)' : 'File Storage (Setup DB)'}</span>
              </button>
            ) : null}
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/70">
            {isSK 
              ? 'Schvaľujte prichádzajúce recenzie, filtrujte ich podľa potrieb alebo pridávajte nové.' 
              : 'Approve incoming reviews, filter them as needed or add new reviews manually.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#6633EE] to-[#7C3AED] text-white hover:opacity-95 text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95"
          >
            <Plus size={14} />
            <span>{isSK ? 'Pridať recenziu' : 'Add Review'}</span>
          </button>

          <button
            type="button"
            onClick={fetchReviews}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#010314] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-[#E2E8F0] dark:border-[#2B2F49] transition cursor-pointer active:scale-95 shrink-0"
            title={isSK ? 'Obnoviť zoznam' : 'Refresh list'}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Upozornenie ak Supabase tabuľka ešte nie je vytvorená */}
      {isDbConnected === false && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={17} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-xs sm:text-sm">
                {isSK ? 'Recenzie sa momentálne ukladajú v záložnom JSON súbore' : 'Reviews are currently stored in a fallback JSON file'}
              </span>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                {isSK 
                  ? 'Aby sa recenzie ukladali a mazali priamo v PostgreSQL databáze (a nezmizli po reštarte hostingu), stačí spustiť 1-klikový SQL kód v Supabase SQL Editore.' 
                  : 'To persist reviews in the PostgreSQL database, execute the prepared SQL snippet in your Supabase SQL Editor.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSqlModalOpen(true)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition cursor-pointer shrink-0 shadow-xs text-center"
          >
            {isSK ? 'Zobraziť SQL kód' : 'View SQL script'}
          </button>
        </div>
      )}

      {/* SEGMENTOVANÉ ZÁLOŽKY - ROVNAKÁ ŠÍRKA NA MOBILE */}
      <div className="grid grid-cols-3 sm:flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-[#6633EE] text-white shadow-sm'
              : 'text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="truncate">{isSK ? 'Na schválenie' : 'Pending'}</span>
          {pendingReviews.length > 0 ? (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${
              activeTab === 'pending' ? 'bg-white text-[#6633EE]' : 'bg-[#FF5A7A] text-white'
            }`}>
              {pendingReviews.length}
            </span>
          ) : (
            <span className="opacity-60 text-[10px] shrink-0">(0)</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-[#6633EE] text-white shadow-sm'
              : 'text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="truncate">{isSK ? 'Schválené' : 'Approved'}</span>
          <span className="opacity-75 text-[10px] shrink-0">({approvedReviews.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#6633EE] text-white shadow-sm'
              : 'text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="truncate">{isSK ? 'Všetky' : 'All'}</span>
          <span className="opacity-75 text-[10px] shrink-0">({reviews.length})</span>
        </button>
      </div>

      {/* OVLÁDACIA LIŠTA: RESPONZÍVNE FILTROVANIE A ZORADENIE RECENZIÍ */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-3 shadow-xs">
        {/* VYHĽADÁVANIE (MENO ALEBO TEXT) */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isSK ? 'Hľadať v recenziách (autor, obsah)...' : 'Search reviews (author, comment)...'}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-xs text-[#0B0D22] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#6633EE]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded-full cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* VÝBER ČASOVÉHO OBDOBIA (HORIZONTÁLNY SCROLL NA MOBILE) */}
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center gap-1 text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] shrink-0">
            <Filter size={13} className="text-[#6633EE] dark:text-[#A78BFA]" />
            <span className="hidden xs:inline">{isSK ? 'Obdobie:' : 'Period:'}</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
            {[
              { id: 'all', labelSk: 'Všetky', labelEn: 'All' },
              { id: 'today', labelSk: 'Dnes', labelEn: 'Today' },
              { id: 'week', labelSk: '7 dní', labelEn: '7 days' },
              { id: 'month', labelSk: '30 dní', labelEn: '30 days' },
              { id: 'year', labelSk: 'Tento rok', labelEn: 'This year' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  dateFilter === tab.id
                    ? 'bg-[#6633EE] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#010314] text-[#64748B] dark:text-[#C7CAE0]/70 border border-[#E2E8F0] dark:border-[#2B2F49] hover:bg-slate-200 dark:hover:bg-[#1E2238]'
                }`}
              >
                {isSK ? tab.labelSk : tab.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* PREHĽADNÁ 2-STĹPCOVÁ MRIEŽKA PRE HODNOTENIE A ZORADENIE NA MOBILE */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E2E8F0] dark:border-[#2B2F49]/70">
          <div className="relative flex items-center">
            <Star size={13} className="absolute left-2.5 text-amber-500 fill-amber-500 pointer-events-none" />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              aria-label={isSK ? 'Filter hodnotenia' : 'Rating filter'}
              className="w-full text-xs font-semibold pl-7 pr-2 py-2 rounded-xl bg-slate-100 dark:bg-[#010314] text-[#1E293B] dark:text-[#DDE0F2] border border-[#E2E8F0] dark:border-[#2B2F49] focus:outline-none focus:border-[#6633EE] shadow-xs cursor-pointer truncate"
            >
              <option value="all">{isSK ? 'Všetky hviezdičky' : 'All stars'}</option>
              <option value="5">5 hviezdičiek</option>
              <option value="4">4 hviezdičky</option>
              <option value="3">3 hviezdičky</option>
              <option value="2">2 hviezdičky</option>
              <option value="1">1 hviezdička</option>
            </select>
          </div>

          <div className="relative flex items-center">
            <ArrowUpDown size={13} className="absolute left-2.5 text-[#6633EE] dark:text-[#A78BFA] pointer-events-none" />
            <select
              value={reviewsSortBy}
              onChange={(e) => setReviewsSortBy(e.target.value)}
              aria-label={isSK ? 'Zoradiť recenzie' : 'Sort reviews'}
              className="w-full text-xs font-semibold pl-7 pr-2 py-2 rounded-xl bg-slate-100 dark:bg-[#010314] text-[#1E293B] dark:text-[#DDE0F2] border border-[#E2E8F0] dark:border-[#2B2F49] focus:outline-none focus:border-[#6633EE] shadow-xs cursor-pointer truncate"
            >
              <option value="date_desc">{isSK ? 'Najnovšie prvé' : 'Newest first'}</option>
              <option value="date_asc">{isSK ? 'Najstaršie prvé' : 'Oldest first'}</option>
              <option value="rating_desc">{isSK ? 'Najvyššie hodnotenie' : 'Highest rating'}</option>
              <option value="rating_asc">{isSK ? 'Najnižšie hodnotenie' : 'Lowest rating'}</option>
              <option value="name_asc">{isSK ? 'Autor (A - Z)' : 'Author (A - Z)'}</option>
              <option value="name_desc">{isSK ? 'Autor (Z - A)' : 'Author (Z - A)'}</option>
            </select>
          </div>
        </div>

        {/* STAVOVÝ POPIS AK JE AKTÍVNY FILTER */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70 pt-1 border-t border-[#E2E8F0] dark:border-[#2B2F49]">
            <span>
              {isSK 
                ? `Zobrazených ${displayedReviews.length} z ${baseTabReviews.length} recenzií.` 
                : `Showing ${displayedReviews.length} of ${baseTabReviews.length} reviews.`}
            </span>
            <button
              type="button"
              onClick={() => {
                setDateFilter('all');
                setRatingFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] font-semibold text-[#6633EE] dark:text-[#A78BFA] hover:underline cursor-pointer"
            >
              {isSK ? 'Zrušiť filtre' : 'Clear filters'}
            </button>
          </div>
        )}
      </div>

      {/* ZOZNAM RECENZIÍ */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">
          <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#6633EE]" />
          <span>{isSK ? 'Načítavam recenzie...' : 'Loading reviews...'}</span>
        </div>
      ) : displayedReviews.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-2">
          <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60">
            {hasActiveFilters 
              ? (isSK ? 'Zadaným filtrom nevyhovujú žiadne recenzie.' : 'No reviews match your filters.')
              : activeTab === 'pending'
              ? (isSK ? 'Žiadne recenzie nečakajú na schválenie.' : 'No reviews pending approval.')
              : (isSK ? 'Zatiaľ neboli nájdené žiadne recenzie.' : 'No reviews found.')}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setDateFilter('all');
                setRatingFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#010314] text-xs font-semibold text-[#6633EE] dark:text-[#A78BFA] border border-[#E2E8F0] dark:border-[#2B2F49] hover:bg-slate-200 dark:hover:bg-[#1E2238] transition cursor-pointer"
            >
              {isSK ? 'Resetovať filtre' : 'Reset filters'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedReviews.map((rev) => {
            const isPending = rev.status === 'pending';
            const isApproved = rev.status === 'approved';
            const createdInfo = formatCreationTime(rev.created_at, language);

            return (
              <div
                key={rev.id}
                className={`p-4 rounded-2xl bg-white dark:bg-[#0B0D22] border transition-all flex flex-col justify-between gap-3 shadow-xs ${
                  isPending 
                    ? 'border-amber-400/50 bg-amber-500/5 dark:bg-amber-500/5' 
                    : isApproved
                    ? 'border-[#E2E8F0] dark:border-[#2B2F49]'
                    : 'border-rose-500/30 bg-rose-500/5'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Hlavička karty */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-[#0B0D22] dark:text-white truncate">
                          {rev.user_name}
                        </span>
                        {rev.is_anonymous && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-medium shrink-0">
                            {isSK ? 'Anonym' : 'Anonymous'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-[#6633EE] dark:text-[#A78BFA]" />
                          <span>{createdInfo?.formattedDateTime || new Date(rev.created_at).toLocaleDateString()}</span>
                        </span>
                        {createdInfo?.relative && (
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-[#010314] text-[#6633EE] dark:text-[#A78BFA] border border-[#E2E8F0] dark:border-[#2B2F49] font-medium">
                            {createdInfo.relative}
                          </span>
                        )}
                        <span>•</span>
                        <span>
                          {rev.source === 'qr_code' 
                            ? (isSK ? 'Webový formulár' : 'Web form') 
                            : rev.source === 'admin_manual' 
                            ? (isSK ? 'Ručne vložené' : 'Manual') 
                            : rev.source === 'landing_modal'
                            ? (isSK ? 'Landing modal' : 'Landing modal')
                            : (isSK ? 'Klientsky profil' : 'Profile')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isPending && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-500 text-[10px] font-bold">
                          {isSK ? 'Čaká na schválenie' : 'Pending'}
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          <span>{isSK ? 'Schválené' : 'Approved'}</span>
                        </span>
                      )}
                      {rev.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-500 text-[10px] font-bold">
                          {isSK ? 'Zamietnuté' : 'Rejected'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hviezdičky */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}
                      />
                    ))}
                    <span className="text-xs font-bold text-amber-500 ml-1.5">{rev.rating}.0</span>
                  </div>

                  {/* Text recenzie */}
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic bg-slate-50 dark:bg-[#010314] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2B2F49]">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                {/* Akčné tlačidlá */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#2B2F49]/70">
                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(rev.id, 'approved')}
                          disabled={actionLoading === rev.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                        >
                          <Check size={13} />
                          <span>{isSK ? 'Schváliť' : 'Approve'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                          disabled={actionLoading === rev.id}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer active:scale-95"
                        >
                          <X size={13} />
                          <span>{isSK ? 'Zamietnuť' : 'Reject'}</span>
                        </button>
                      </>
                    )}

                    {rev.status === 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(rev.id, 'approved')}
                        disabled={actionLoading === rev.id}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95"
                      >
                        <Check size={13} />
                        <span>{isSK ? 'Prehodnotiť a schváliť' : 'Reconsider & Approve'}</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    disabled={actionLoading === rev.id}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer active:scale-95"
                    title={isSK ? 'Trvale zmazať recenziu' : 'Permanently delete review'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: RUČNÉ PRIDANIE RECENZIE                                   */}
      {/* ================================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#2B2F49]">
              <h3 className="font-bold text-sm text-[#0B0D22] dark:text-white">
                {isSK ? 'Pridať recenziu ručne' : 'Add Review Manually'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualReview} className="space-y-3.5 text-left">
              <div>
                <label className="text-xs font-semibold text-[#0B0D22] dark:text-white block mb-1">
                  {isSK ? 'Meno klienta' : 'Client Name'}
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder={isSK ? 'napr. Ján N.' : 'e.g. John D.'}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-xs text-[#0B0D22] dark:text-white focus:outline-none focus:border-[#6633EE]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0B0D22] dark:text-white block mb-1">
                  {isSK ? 'Hodnotenie (Hviezdičky)' : 'Rating (Stars)'}
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setManualRating(s)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        size={22}
                        className={s <= manualRating ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">{manualRating}.0 / 5</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0B0D22] dark:text-white block mb-1">
                  {isSK ? 'Text recenzie' : 'Review Text'}
                </label>
                <textarea
                  value={manualComment}
                  onChange={(e) => setManualComment(e.target.value)}
                  rows={3}
                  placeholder={isSK ? 'Sem napíšte znenie recenzie...' : 'Write the review comment here...'}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-xs text-[#0B0D22] dark:text-white focus:outline-none focus:border-[#6633EE] resize-none"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualAnonymous}
                  onChange={(e) => setManualAnonymous(e.target.checked)}
                  className="rounded text-[#6633EE]"
                />
                <span className="text-xs text-[#64748B] dark:text-[#C7CAE0]">
                  {isSK ? 'Označiť ako anonymnú recenziu' : 'Mark as anonymous'}
                </span>
              </label>

              <button
                type="submit"
                disabled={modalSubmitting}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#6633EE] to-[#7C3AED] hover:opacity-95 transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                {modalSubmitting ? (isSK ? 'Ukladám...' : 'Saving...') : (isSK ? 'Vložiť a schváliť' : 'Save and Approve')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: AKTIVÁCIA SUPABASE DATABÁZY                               */}
      {/* ================================================================ */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#2B2F49]">
              <div className="flex items-center gap-2">
                <Database size={17} className="text-[#6633EE] dark:text-[#A78BFA]" />
                <h3 className="font-bold text-sm text-[#0B0D22] dark:text-white">
                  {isSK ? 'Aktivácia tabuľky recenzií v Supabase' : 'Setup Reviews Table in Supabase'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed overflow-y-auto pr-1">
              <p>
                {isSK 
                  ? 'Aplikácia automaticky rozpozná, keď vytvoríte tabuľku recenzií. Pre trvalé ukladanie a mazanie recenzií vykonajte tieto 3 jednoduché kroky:' 
                  : 'Follow these 3 simple steps to activate the PostgreSQL reviews table in your Supabase project:'}
              </p>

              <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-[#C7CAE0]">
                <li>
                  {isSK ? 'Otvorte si svoj ' : 'Open your '}
                  <span className="font-semibold text-[#6633EE] dark:text-[#A78BFA]">Supabase Dashboard</span> 
                  {isSK ? ' a prejdite do sekcie ' : ' and navigate to '}
                  <span className="font-semibold">SQL Editor</span>.
                </li>
                <li>{isSK ? 'Vložte nižšie uvedený SQL skript do nového okna.' : 'Paste the SQL script below into a new query.'}</li>
                <li>{isSK ? 'Kliknite na zelené tlačidlo "Run".' : 'Click the green "Run" button.'}</li>
              </ol>

              <div className="relative">
                <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto border border-slate-800 max-h-56">
                  {SQL_SETUP_SCRIPT}
                </pre>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-[#6633EE] hover:bg-[#7C3AED] text-white font-semibold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  {sqlCopied ? (
                    <>
                      <CheckCheck size={13} className="text-emerald-300" />
                      <span>{isSK ? 'Skopírované!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>{isSK ? 'Kopírovať SQL' : 'Copy SQL'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0 text-emerald-500" />
                <span>
                  {isSK 
                    ? 'Akonáhle SQL spustíte, po kliknutí na "Obnoviť zoznam" sa stav automaticky zmení na "Supabase DB".' 
                    : 'Once executed, click "Refresh" to immediately connect to the Supabase PostgreSQL table.'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#2B2F49] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  fetchReviews();
                  setIsSqlModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#6633EE] hover:bg-[#7C3AED] text-white font-semibold text-xs transition cursor-pointer"
              >
                {isSK ? 'Hotovo, obnoviť stav' : 'Done, refresh status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
