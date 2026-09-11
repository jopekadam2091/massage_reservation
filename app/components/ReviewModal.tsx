'use client';

import React, { useState } from 'react';
import { X, Star, CheckCircle2, MessageSquare, Shield, Sparkles } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  userName?: string | null;
  language?: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  userId,
  userName,
  language = 'sk',
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isSK = language === 'sk';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 5) {
      setError(isSK ? 'Recenzia musí obsahovať aspoň 5 znakov.' : 'Review must be at least 5 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || null,
          user_name: userName || null,
          rating,
          comment: comment.trim(),
          is_anonymous: isAnonymous,
          source: 'profile',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setComment('');
          onClose();
        }, 2500);
      } else {
        setError(data.error || (isSK ? 'Chyba pri odosielaní recenzie.' : 'Error submitting review.'));
      }
    } catch {
      setError(isSK ? 'Spojenie so serverom zlyhalo.' : 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl p-5 sm:p-6 text-left space-y-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#6633EE]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Hlavička */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#2B2F49]/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#6633EE]/10 flex items-center justify-center text-[#6633EE] dark:text-[#A78BFA]">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B0D22] dark:text-[#FFFFFF]">
                {isSK ? 'Napísať recenziu' : 'Write a Review'}
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#C7CAE0]/70">
                {isSK ? 'Podeľte sa o vaše skúsenosti so salónom' : 'Share your salon experience'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-[#0B0D22] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E2238] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-lg">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-base font-bold text-[#0B0D22] dark:text-[#FFFFFF]">
              {isSK ? 'Ďakujeme za vašu recenziu!' : 'Thank you for your review!'}
            </h4>
            <p className="text-xs text-[#64748B] dark:text-[#C7CAE0]/80 max-w-xs leading-relaxed">
              {isSK
                ? 'Vaša recenzia bola odoslaná na schválenie administrátorom a čoskoro sa zobrazí v systéme.'
                : 'Your review was submitted for admin approval and will appear shortly.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Výber počtu hviezdičiek */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-center space-y-1.5">
              <span className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] uppercase tracking-wider block">
                {isSK ? 'Vaša spokojnosť' : 'Your Rating'}
              </span>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-125 cursor-pointer"
                    >
                      <Star
                        size={28}
                        className={`transition-colors ${active
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : 'text-slate-300 dark:text-slate-600'
                          }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#6633EE] dark:text-[#A78BFA] font-medium pt-0.5">
                {rating === 5 && (isSK ? ' Výborné - Maximálna spokojnosť' : ' Excellent - Highly satisfied')}
                {rating === 4 && (isSK ? ' Veľmi dobré - Príjemný zážitok' : ' Very good - Pleasant experience')}
                {rating === 3 && (isSK ? ' Dobré - Štandardná služba' : ' Good - Standard session')}
                {rating === 2 && (isSK ? ' Priemerné' : ' Fair')}
                {rating === 1 && (isSK ? ' Nespokojnosť' : ' Dissatisfied')}
              </p>
            </div>

            {/* Textové pole recenzie */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] block">
                {isSK ? 'Vaša skúsenosť a hodnotenie' : 'Your Review Comment'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isSK
                  ? 'Napíšte, ako sa vám páčila masáž, prostredie salónu alebo prístup...'
                  : 'Write what you loved about the massage, atmosphere or service...'}
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-xs text-[#0B0D22] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#6633EE] transition resize-none"
              />
            </div>

            {/* Prepínač anonymity */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#6633EE] focus:ring-[#6633EE] cursor-pointer"
              />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] block">
                  {isSK ? 'Uverejniť anonymne' : 'Publish anonymously'}
                </span>
                <span className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/70 block">
                  {isSK ? 'Vaše meno a profil zostanú skryté' : 'Your name and identity will remain private'}
                </span>
              </div>
            </label>

            {error && (
              <p className="text-xs text-rose-500 font-medium bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                {error}
              </p>
            )}

            {/* Tlačidlo odoslania */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#6633EE] to-[#7C3AED] hover:opacity-95 active:scale-[0.99] transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              <span>
                {loading
                  ? (isSK ? 'Odosielam...' : 'Submitting...')
                  : (isSK ? 'Odoslať recenziu na schválenie' : 'Submit Review for Approval')}
              </span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
