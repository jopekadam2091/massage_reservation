'use client';

import React, { useState } from 'react';
import { X, Star, CheckCircle2, MessageSquare, Shield, Sparkles, User } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  userName?: string | null;
  language?: string;
  defaultAnonymous?: boolean;
}

function formatNameWithInitial(input: string, prev: string = ''): string {
  // Ak používateľ maže znaky
  if (input.length < prev.length) {
    // Ak zmazal bodku z "Meno X.", zmažeme aj iniciál a necháme "Meno "
    if (/\s\S\.$/.test(prev) && input === prev.slice(0, -1)) {
      return prev.slice(0, -2);
    }
    return input;
  }

  // Odstránenie počiatočných medzier
  const val = input.replace(/^\s+/, '');
  if (!val) return '';

  const spaceIndex = val.indexOf(' ');
  if (spaceIndex === -1) {
    // Používateľ ešte len píše krstné meno (bez medzery)
    return val;
  }

  const firstName = val.slice(0, spaceIndex);
  const remainder = val.slice(spaceIndex + 1).replace(/^\s+/, '');

  if (remainder.length === 0) {
    return `${firstName} `;
  }

  // Prvý znak po medzere – povolíme len jedno písmeno a automaticky pridáme bodku
  const initialChar = remainder.charAt(0);
  if (!/\p{L}/u.test(initialChar)) {
    return `${firstName} `;
  }

  const upperInitial = initialChar.toUpperCase();
  return `${firstName} ${upperInitial}.`;
}

export default function ReviewModal({
  isOpen,
  onClose,
  userId,
  userName,
  language = 'sk',
  defaultAnonymous = false,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [customName, setCustomName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(Boolean(defaultAnonymous));
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

    const effectiveAnonymous = isAnonymous || (!userName && !customName.trim());
    const effectiveName = effectiveAnonymous ? null : (userName || customName.trim());

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || null,
          user_name: effectiveName,
          rating,
          comment: comment.trim(),
          is_anonymous: effectiveAnonymous,
          source: userId ? 'profile' : 'landing_modal',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setComment('');
          setCustomName('');
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
                {isSK ? 'Podeľte sa o vaše skúsenosti s masážou' : 'Share your massage experience'}
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
                  ? 'Napíšte, ako sa vám páčila masáž, atmosféra alebo prístup...'
                  : 'Write what you loved about the massage, atmosphere or service...'}
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] text-xs text-[#0B0D22] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#6633EE] transition resize-none"
              />
            </div>

            {/* Identita a voľba anonymity */}
            <div className="space-y-1.5">
              {userName ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#010314] border border-[#E2E8F0] dark:border-[#2B2F49] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748B] dark:text-[#C7CAE0]/70">
                      {isSK ? 'Prihlásený profil:' : 'Logged in as:'}
                    </span>
                    <span className={`font-semibold transition-colors flex items-center gap-1 ${isAnonymous ? 'line-through text-slate-400 dark:text-slate-500' : 'text-[#0B0D22] dark:text-white'}`}>
                      <User size={13} className="text-[#6633EE] dark:text-[#A78BFA]" />
                      <span>{userName}</span>
                    </span>
                  </div>

                  <label className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-[#1E2238] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#6633EE] focus:ring-[#6633EE] cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-[#0B0D22] dark:text-[#FFFFFF] flex items-center gap-1.5">
                      <Shield size={12} className="text-[#6633EE] dark:text-[#A78BFA]" />
                      <span>{isSK ? 'Uverejniť anonymne' : 'Publish anonymously'}</span>
                    </span>
                  </label>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className={`text-xs font-semibold flex items-center gap-1 transition-colors ${isAnonymous ? 'text-slate-400 dark:text-slate-500' : 'text-[#0B0D22] dark:text-[#FFFFFF]'}`}>
                      <User size={12} className={isAnonymous ? 'text-slate-400' : 'text-[#6633EE] dark:text-[#A78BFA]'} />
                      <span>{isSK ? 'Meno a iniciál priezviska' : 'Name and surname initial'}</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#6633EE] focus:ring-[#6633EE] cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-[#6633EE] dark:text-[#A78BFA] group-hover:underline flex items-center gap-1">
                        <Shield size={12} />
                        <span>{isSK ? 'Uverejniť anonymne' : 'Publish anonymously'}</span>
                      </span>
                    </label>
                  </div>

                  <input
                    type="text"
                    disabled={isAnonymous}
                    value={isAnonymous ? '' : customName}
                    onChange={(e) => setCustomName(formatNameWithInitial(e.target.value, customName))}
                    placeholder={isAnonymous ? (isSK ? 'Anonymný užívateľ' : 'Anonymous user') : (isSK ? 'napr. Peter K.' : 'e.g. Peter K.')}
                    className={`w-full p-2.5 rounded-xl border text-xs transition ${isAnonymous
                        ? 'bg-slate-100 dark:bg-[#060818] border-slate-200 dark:border-[#1E2238] text-slate-400 dark:text-slate-600 placeholder-slate-400 dark:placeholder-slate-600 cursor-not-allowed opacity-60 select-none'
                        : 'bg-slate-50 dark:bg-[#010314] border-[#E2E8F0] dark:border-[#2B2F49] text-[#0B0D22] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#6633EE]'
                      }`}
                  />
                </div>
              )}
            </div>

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
                  : (isSK ? 'Odoslať recenziu' : 'Submit Review')}
              </span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
