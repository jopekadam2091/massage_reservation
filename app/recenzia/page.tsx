'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, CheckCircle2, Sparkles, MessageSquare, ArrowLeft, Heart } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function PublicReviewPage() {
  const { language } = useLanguage();
  const isSK = language === 'sk';

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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
          user_name: isAnonymous ? null : (name.trim() || null),
          rating,
          comment: comment.trim(),
          is_anonymous: isAnonymous,
          source: 'qr_code',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || (isSK ? 'Chyba pri odosielaní recenzie.' : 'Failed to submit review.'));
      }
    } catch {
      setError(isSK ? 'Chyba spojenia.' : 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-100 font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#6633EE]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-6 sm:p-7 rounded-3xl bg-[#0B0D22]/90 border border-[#2B2F49] shadow-2xl backdrop-blur-md space-y-5 text-left">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#A78BFA] hover:text-white transition"
          >
            <ArrowLeft size={14} />
            <span>{isSK ? 'Späť na salón' : 'Back to salon'}</span>
          </Link>
          <span className="px-2.5 py-0.5 rounded-full bg-[#6633EE]/20 border border-[#6633EE]/40 text-[#A78BFA] text-[10px] font-bold uppercase tracking-wider">
            {isSK ? 'Hodnotenie salónu' : 'Salon Review'}
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{isSK ? 'Vaša skúsenosť' : 'Your Experience'}</span>
            <Heart size={20} className="text-[#FF5A7A] fill-[#FF5A7A]" />
          </h1>
          <p className="text-xs text-slate-400">
            {isSK 
              ? 'Veľmi si vážime vašu spätnú väzbu. Pomáha nám neustále skvalitňovať masáže a servis.' 
              : 'We value your feedback. It helps us improve our massage therapies and services.'}
          </p>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-3.5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isSK ? 'Ďakujeme za vaše hodnotenie!' : 'Thank you for your review!'}
            </h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              {isSK 
                ? 'Vaša recenzia bola zaznamenaná a po overení administrátorom bude publikovaná.' 
                : 'Your review has been recorded and will be published after verification.'}
            </p>
            <div className="pt-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#6633EE] to-[#7C3AED] text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:opacity-95 transition"
              >
                <span>{isSK ? 'Prejsť do rezervácie' : 'Book a Massage'}</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hviezdičky */}
            <div className="p-3.5 rounded-2xl bg-[#010314] border border-[#2B2F49] text-center space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                {isSK ? 'Ako hodnotíte našu masáž?' : 'How do you rate our massage?'}
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
                        size={30}
                        className={`transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meno (ak nie je anonymné) */}
            {!isAnonymous && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  {isSK ? 'Vaše meno (alebo iniciály)' : 'Your name (or initials)'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isSK ? 'napr. Martin K.' : 'e.g. Martin K.'}
                  className="w-full p-3 rounded-xl bg-[#010314] border border-[#2B2F49] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6633EE] transition"
                />
              </div>
            )}

            {/* Prepínač anonymity */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#010314] border border-[#2B2F49] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-[#6633EE] focus:ring-[#6633EE] cursor-pointer"
              />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-white block">
                  {isSK ? 'Hodnotiť úplne anonymne' : 'Submit fully anonymously'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isSK ? 'Vaše meno nebude zverejnené' : 'Your identity will not be displayed'}
                </span>
              </div>
            </label>

            {/* Text recenzie */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                {isSK ? 'Slovné hodnotenie' : 'Comment'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isSK 
                  ? 'Napíšte, ako sa vám páčila masáž a celková starostlivosť...' 
                  : 'Tell us about your experience...'}
                rows={4}
                className="w-full p-3 rounded-xl bg-[#010314] border border-[#2B2F49] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6633EE] transition resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-medium bg-rose-500/15 p-2.5 rounded-xl border border-rose-500/30">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#6633EE] to-[#7C3AED] hover:opacity-95 active:scale-[0.99] transition cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
    </main>
  );
}
