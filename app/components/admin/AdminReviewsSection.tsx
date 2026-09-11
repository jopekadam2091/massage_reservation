'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, Check, X, Trash2, Plus, QrCode, RefreshCw, 
  MessageSquare, User, CheckCircle2, AlertCircle, Copy, ExternalLink, ShieldCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ReviewItem {
  id: string;
  user_id?: string | null;
  user_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  is_anonymous: boolean;
  source: 'profile' | 'qr_code' | 'admin_manual';
  created_at: string;
}

interface AdminReviewsSectionProps {
  language: string;
}

export default function AdminReviewsSection({ language }: AdminReviewsSectionProps) {
  const isSK = language === 'sk';

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modály
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Formulár pre ručné pridanie
  const [manualName, setManualName] = useState('');
  const [manualRating, setManualRating] = useState(5);
  const [manualComment, setManualComment] = useState('');
  const [manualAnonymous, setManualAnonymous] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // QR Kód URL
  const [qrUrl, setQrUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQrUrl(`${window.location.origin}/recenzia`);
    }
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
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
    if (!window.confirm(isSK ? 'Naozaj chcete zmazať túto recenziu?' : 'Do you really want to delete this review?')) {
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

  const handleCopyQrLink = () => {
    if (qrUrl) {
      navigator.clipboard.writeText(qrUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const pendingReviews = reviews.filter((r) => r.status === 'pending');
  const approvedReviews = reviews.filter((r) => r.status === 'approved');
  const displayedReviews =
    activeTab === 'pending'
      ? pendingReviews
      : activeTab === 'approved'
      ? approvedReviews
      : reviews;

  return (
    <div className="space-y-4 text-left">
      {/* Horný akčný panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[#6633EE] dark:text-[#A78BFA]" />
            <h2 className="font-bold text-sm sm:text-base text-[#0B0D22] dark:text-white uppercase tracking-wider">
              {isSK ? 'Správa Recenzií & Hodnotení' : 'Reviews & Ratings Management'}
            </h2>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/70">
            {isSK 
              ? 'Schvaľujte prichádzajúce recenzie, pridávajte nové ručne alebo zdieľajte QR kód pre klientov.' 
              : 'Approve incoming reviews, add reviews manually or share a QR code for clients.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#010314] text-[#0B0D22] dark:text-white border border-[#E2E8F0] dark:border-[#2B2F49] hover:border-[#6633EE] text-xs font-semibold transition cursor-pointer"
          >
            <QrCode size={14} className="text-[#6633EE] dark:text-[#A78BFA]" />
            <span>{isSK ? 'QR Kód na recenzie' : 'Review QR Code'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6633EE] to-[#7C3AED] text-white hover:opacity-95 text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            <span>{isSK ? 'Pridať recenziu' : 'Add Review'}</span>
          </button>

          <button
            type="button"
            onClick={fetchReviews}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#010314] text-slate-400 hover:text-white border border-[#E2E8F0] dark:border-[#2B2F49] transition cursor-pointer"
            title={isSK ? 'Obnoviť' : 'Refresh'}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Štatistiky a záložky */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] dark:border-[#2B2F49] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-[#6633EE] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-[#0B0D22] text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-white'
          }`}
        >
          <span>{isSK ? 'Na schválenie' : 'Pending'}</span>
          {pendingReviews.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'pending' ? 'bg-white text-[#6633EE]' : 'bg-[#FF5A7A] text-white'
            }`}>
              {pendingReviews.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-[#6633EE] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-[#0B0D22] text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-white'
          }`}
        >
          <span>{isSK ? 'Schválené' : 'Approved'}</span>
          <span className="opacity-75 text-[10px]">({approvedReviews.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#6633EE] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-[#0B0D22] text-[#64748B] dark:text-[#C7CAE0]/70 hover:text-white'
          }`}
        >
          <span>{isSK ? 'Všetky' : 'All'}</span>
          <span className="opacity-75 text-[10px]">({reviews.length})</span>
        </button>
      </div>

      {/* Zoznam recenzií */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">
          <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#6633EE]" />
          <span>{isSK ? 'Načítavam recenzie...' : 'Loading reviews...'}</span>
        </div>
      ) : displayedReviews.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-2">
          <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/60">
            {activeTab === 'pending'
              ? (isSK ? 'Žiadne recenzie nečakajú na schválenie.' : 'No reviews pending approval.')
              : (isSK ? 'Zatiaľ neboli nájdené žiadne recenzie.' : 'No reviews found.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedReviews.map((rev) => {
            const isPending = rev.status === 'pending';
            const isApproved = rev.status === 'approved';
            const dateText = new Date(rev.created_at).toLocaleDateString(isSK ? 'sk-SK' : 'en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

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
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#0B0D22] dark:text-white">
                          {rev.user_name}
                        </span>
                        {rev.is_anonymous && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-medium">
                            {isSK ? 'Anonym' : 'Anonymous'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/60">
                        {dateText} • {rev.source === 'qr_code' ? 'QR Kód' : rev.source === 'admin_manual' ? (isSK ? 'Ručne vložené' : 'Manual') : (isSK ? 'Klientsky profil' : 'Profile')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
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
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
                        >
                          <Check size={13} />
                          <span>{isSK ? 'Schváliť' : 'Approve'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                          disabled={actionLoading === rev.id}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
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
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Check size={12} />
                        <span>{isSK ? 'Prehodnotiť a schváliť' : 'Approve'}</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    disabled={actionLoading === rev.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    title={isSK ? 'Zmazať' : 'Delete'}
                  >
                    <Trash2 size={14} />
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
                className="text-slate-400 hover:text-white"
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
      {/* MODAL: QR KÓD PRE ANONYMNÉ / RÝCHLE RECENZIE NA RECEPCII        */}
      {/* ================================================================ */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] p-6 text-center space-y-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-[#0B0D22] dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="space-y-1 pt-1">
              <h3 className="font-extrabold text-base text-[#0B0D22] dark:text-white">
                {isSK ? 'QR Kód na zber recenzií' : 'Review QR Code'}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/70">
                {isSK 
                  ? 'Umiestnite tento QR kód na recepcii salónu. Klient ho po masáži naskenuje a pošle hodnotenie.' 
                  : 'Display this QR code at your reception for clients to scan and review.'}
              </p>
            </div>

            {/* QR Kód v čistom bielom ráme */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 inline-block shadow-lg mx-auto">
              <QRCodeSVG
                value={qrUrl || 'https://massage-reservation.sk/recenzia'}
                size={190}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-[11px] font-mono text-[#6633EE] dark:text-[#A78BFA] truncate">
                {qrUrl}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyQrLink}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-[#010314] hover:bg-slate-200 dark:hover:bg-[#1A1F36] text-xs font-semibold text-[#0B0D22] dark:text-white border border-[#E2E8F0] dark:border-[#2B2F49] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedLink ? (isSK ? 'Skopírované!' : 'Copied!') : (isSK ? 'Kopírovať odkaz' : 'Copy link')}</span>
                </button>

                <a
                  href="/recenzia"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-[#6633EE]/10 hover:bg-[#6633EE]/20 text-[#6633EE] dark:text-[#A78BFA] border border-[#6633EE]/30 transition"
                  title={isSK ? 'Otvoriť stránku' : 'Open page'}
                >
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
