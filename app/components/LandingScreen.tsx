'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/lib/LanguageContext';
import {
  ArrowRight, ArrowLeft, LogIn, User, Sparkles, X, Star,
  CheckCircle2, QrCode, Globe
} from 'lucide-react';




const REVIEWS_DATA = {
  SK: [
    {
      id: 1,
      name: 'Michal K.',
      rating: 5,
      date: 'Pred 2 dňami',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Overená návšteva',
      text: 'Neuveriteľný relax a uvoľnenie chrbta po náročnom týždni v kancelárii. Určite sa vrátim!',
      verified: true,
    },
    {
      id: 2,
      name: 'Peter S.',
      rating: 5,
      date: 'Pred 4 dňami',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Overená návšteva • VIP salón',
      text: 'VIP rituál predčil všetky očakávania. 100% diskrétnosť, voňavé teplé oleje a maximálny pokoj.',
      verified: true,
    },
    {
      id: 3,
      name: 'Martin D.',
      rating: 5,
      date: 'Pred týždňom',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Overená návšteva • Regenerácia',
      text: 'Profesionálny prístup, čistota priestoru a skvelá energia. Bolesť krku zmizla hneď po procedúre.',
      verified: true,
    },
    {
      id: 4,
      name: 'Tomáš B.',
      rating: 5,
      date: 'Pred 2 týždňami',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Overená návšteva • Športový relax',
      text: 'Exkluzívne prostredie, citlivý prístup a dokonalá atmosféra. Najlepší rituál, aký som kedy zažil.',
      verified: true,
    },
    {
      id: 5,
      name: 'Marek V.',
      rating: 5,
      date: 'Pred 3 týždňami',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Overená návšteva • Pravidelný klient',
      text: 'Skvelá regenerácia pre športovcov. Cítim sa ako znovuzrodený, odporúčam všetkým.',
      verified: true,
    },
    {
      id: 6,
      name: 'Anonymný užívateľ',
      rating: 5,
      date: 'Pred mesiacom',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Overená návšteva • Absolútne súkromie',
      text: 'Špičkový servis od privítania až po záver. Absolútne súkromie a autentický luxusný oddych.',
      verified: true,
    },
  ],
  EN: [
    {
      id: 1,
      name: 'Michael K.',
      rating: 5,
      date: '2 days ago',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Verified visit',
      text: 'Incredible relaxation and back relief after a busy week at work. Will definitely come back!',
      verified: true,
    },
    {
      id: 2,
      name: 'Peter S.',
      rating: 5,
      date: '4 days ago',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Verified visit • VIP lounge',
      text: 'The VIP ritual exceeded all expectations. 100% discreet, fragrant warm oils, and total peace.',
      verified: true,
    },
    {
      id: 3,
      name: 'Martin D.',
      rating: 5,
      date: '1 week ago',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Verified visit • Recovery',
      text: 'Professional touch, clean private space, and great energy. Neck tension vanished right away.',
      verified: true,
    },
    {
      id: 4,
      name: 'Thomas B.',
      rating: 5,
      date: '2 weeks ago',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Verified visit • Sports relax',
      text: 'Exclusive ambience, sensitive technique, and perfect atmosphere. Best ritual I have experienced.',
      verified: true,
    },
    {
      id: 5,
      name: 'Mark V.',
      rating: 5,
      date: '3 weeks ago',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Verified visit • Regular client',
      text: 'Amazing athletic recovery. Feeling completely renewed, highly recommend to everyone.',
      verified: true,
    },
    {
      id: 6,
      name: 'Anonymous user',
      rating: 5,
      date: '1 month ago',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      subtitle: 'Verified visit • Total privacy',
      text: 'Top notch service from welcome to goodbye. Complete privacy and authentic luxury rest.',
      verified: true,
    },
  ],
};

// 📝 Formátovanie mena klienta podľa pravidiel:
// Anonymný -> "Anonymný užívateľ" (SK) / "Anonymous user" (EN)
// Zadané meno a priezvisko -> "Meno P." (prvé meno + začiatočné písmeno druhého s bodkou)
function formatReviewName(rawName: string | undefined | null, isSK: boolean): string {
  const trimmed = (rawName || '').trim();
  if (!trimmed) {
    return isSK ? 'Anonymný užívateľ' : 'Anonymous user';
  }

  const lower = trimmed.toLowerCase();
  if (
    lower === 'anonym' ||
    lower === 'anonymous' ||
    lower.startsWith('anonym') ||
    lower.includes('anonymous user') ||
    lower.includes('anonymný') ||
    lower.includes('anonymny')
  ) {
    return isSK ? 'Anonymný užívateľ' : 'Anonymous user';
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0];
  }

  const firstName = parts[0];
  const secondInitial = parts[1].charAt(0).toUpperCase();
  return `${firstName} ${secondInitial}.`;
}

type Props = {
  onEnter: () => void;
  sessionUser?: any;
};

export default function LandingScreen({ onEnter, sessionUser }: Props) {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const isSK = language === 'sk';

  const [dynamicReviews, setDynamicReviews] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
          const mapped = data.reviews.map((r: any) => ({
            id: r.id,
            name: r.user_name,
            rating: r.rating,
            date: new Date(r.created_at).toLocaleDateString(isSK ? 'sk-SK' : 'en-US', { day: 'numeric', month: 'short' }),
            subtitle: isSK ? 'Overená recenzia' : 'Verified review',
            text: r.comment,
            verified: true,
          }));
          setDynamicReviews(mapped);
        }
      })
      .catch(() => { });
  }, [isSK]);

  const defaultList = isSK ? REVIEWS_DATA.SK : REVIEWS_DATA.EN;
  const reviewsList = dynamicReviews.length > 0 ? dynamicReviews : defaultList;

  const [showAuthChoice, setShowAuthChoice] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // 🎡 Horizontálny bezšvový nekonečný carousel recenzií
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);

  // 4-násobná sada kariet pre plynulý nekonečný wrap-around (1. buffer vľavo, 2. a 3. stred, 4. buffer vpravo)
  const infiniteReviews = [
    ...reviewsList,
    ...reviewsList,
    ...reviewsList,
    ...reviewsList,
  ];

  const getCardStep = () => {
    if (!scrollContainerRef.current) return 380;
    const cards = scrollContainerRef.current.children;
    if (cards.length >= 2) {
      const diff = (cards[1] as HTMLElement).offsetLeft - (cards[0] as HTMLElement).offsetLeft;
      if (diff > 50) return diff;
    }
    return 380;
  };

  const getSingleSetWidth = () => {
    if (!scrollContainerRef.current) return 0;
    const cards = scrollContainerRef.current.children;
    const len = reviewsList.length;
    if (cards.length > len && cards[len] && cards[0]) {
      const dist = (cards[len] as HTMLElement).offsetLeft - (cards[0] as HTMLElement).offsetLeft;
      if (dist > 0) return dist;
    }
    return getCardStep() * len;
  };

  // Vypočíta presný scroll pre vycentrovanie karty v kontajneri
  const getBaseCenterScroll = () => {
    if (!scrollContainerRef.current) return 0;
    const el = scrollContainerRef.current;
    const cards = el.children;
    const len = reviewsList.length;
    if (cards.length > len && cards[len]) {
      const card = cards[len] as HTMLElement;
      return card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
    }
    return getSingleSetWidth();
  };

  // 🎯 Dynamický optický efekt: karta v strede je 100% zaostrená a ostrá,
  // zatiaľ čo bočné nakúkajúce karty sú zablurované a plynule sa odblurujú pri vstupe do stredu
  const updateCardFocus = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const containerRect = el.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const cards = el.children;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const dist = Math.abs(containerCenter - cardCenter);

      if (isMobile) {
        // Na mobile: karta v strede je dokonale ostrá, obe susedné nakúkajúce sú zablurované
        const maxDist = cardRect.width * 0.85;
        const ratio = Math.min(Math.max(dist / maxDist, 0), 1);
        const blur = (ratio * 4.5).toFixed(1);
        const opacity = (1 - ratio * 0.62).toFixed(2);
        const scale = (1 - ratio * 0.08).toFixed(3);

        card.style.filter = `blur(${blur}px)`;
        card.style.opacity = opacity;
        card.style.transform = `scale(${scale})`;
      } else {
        // Na desktope: stredné karty v zornom poli sú ostré, okrajové sa plynule rozostrujú
        const maxDist = containerRect.width * 0.42;
        const ratio = Math.min(Math.max(dist / maxDist, 0), 1);
        const blur = (ratio * 3.5).toFixed(1);
        const opacity = (1 - ratio * 0.55).toFixed(2);
        const scale = (1 - ratio * 0.06).toFixed(3);

        card.style.filter = `blur(${blur}px)`;
        card.style.opacity = opacity;
        card.style.transform = `scale(${scale})`;
      }
    }
  }, []);

  // Inicializácia do vycentrovanej 2. sady kariet s vypočítaným zaostrením
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const initScroll = () => {
      const baseCenter = getBaseCenterScroll();
      if (baseCenter > 0) {
        el.scrollLeft = baseCenter;
      }
      updateCardFocus();
    };

    const raf = requestAnimationFrame(initScroll);
    const timer = setTimeout(initScroll, 60);
    window.addEventListener('resize', initScroll);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', initScroll);
    };
  }, [reviewsList, updateCardFocus]);

  // Plynulé sledovanie scrollu pre reálny odblur / zaostrenie pri posune
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateCardFocus();
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [updateCardFocus]);

  // Detekcia scrollu pre tichý okamžitý wrap-around bez viditeľného skoku späť
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleWrap = () => {
      const singleSetWidth = getSingleSetWidth();
      const baseCenter = getBaseCenterScroll();
      if (singleSetWidth <= 0) return;

      // Ak prejdeme za 2. sadu dopredu, ticho a okamžite posunieme o 1 sadu späť (na vizuálne identické miesto)
      if (el.scrollLeft >= baseCenter + singleSetWidth - 10) {
        el.scrollLeft -= singleSetWidth;
        updateCardFocus();
      }
      // Ak prejdeme príliš doľava, ticho a okamžite posunieme o 1 sadu dopredu
      else if (el.scrollLeft <= baseCenter - singleSetWidth * 0.5) {
        el.scrollLeft += singleSetWidth;
        updateCardFocus();
      }
    };

    const onScrollEnd = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleWrap, 100);
    };

    el.addEventListener('scroll', onScrollEnd, { passive: true });
    el.addEventListener('scrollend', handleWrap);

    return () => {
      el.removeEventListener('scroll', onScrollEnd);
      el.removeEventListener('scrollend', handleWrap);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [reviewsList, updateCardFocus]);

  // Pomalý automatický posun každých 6.5s, koordinovaný s manuálnym ovládaním používateľa
  const autoScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAutoScroll = () => {
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
    }
    if (isAutoScrollPaused) return;

    autoScrollTimerRef.current = setTimeout(() => {
      if (!scrollContainerRef.current) return;
      const step = getCardStep();
      scrollContainerRef.current.scrollBy({ left: step, behavior: 'smooth' });
      resetAutoScroll();
    }, 6500);
  };

  useEffect(() => {
    resetAutoScroll();
    return () => {
      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current);
      }
    };
  }, [isAutoScrollPaused, reviewsList]);

  // Ovládanie šípkami v hornej pravej časti
  const handleScrollLeft = () => {
    if (!scrollContainerRef.current) return;
    const step = getCardStep();
    scrollContainerRef.current.scrollBy({ left: -step, behavior: 'smooth' });
    resetAutoScroll();
  };

  const handleScrollRight = () => {
    if (!scrollContainerRef.current) return;
    const step = getCardStep();
    scrollContainerRef.current.scrollBy({ left: step, behavior: 'smooth' });
    resetAutoScroll();
  };


  // Spustí plynulý fade prechod do rezervačného systému
  const triggerEnterReservation = () => {
    setIsFading(true);
    try {
      sessionStorage.setItem('welcome_seen', 'true');
      sessionStorage.setItem('guest_notice_dismissed', 'true');
    } catch { }
    setTimeout(() => {
      onEnter();
    }, 450);
  };

  const handleVstupitClick = () => {
    if (sessionUser) {
      // Používateľ je už prihlásený -> rovno plynulý fade do rezervácií
      triggerEnterReservation();
    } else {
      // Používateľ nie je prihlásený -> zobrazíme voľbu prihlásenia alebo hosťa
      setShowAuthChoice(true);
    }
  };

  const handleLoginClick = () => {
    try {
      sessionStorage.setItem('welcome_seen', 'true');
    } catch { }
    setIsFading(true);
    setTimeout(() => {
      router.push('/login');
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 font-sans bg-[#F4F6FB] dark:bg-[#010314] text-[#0B0D22] dark:text-white transition-all duration-500 ease-out select-none ${isFading ? 'opacity-0 scale-[0.98] pointer-events-none' : 'opacity-100 scale-100'
        }`}
    >
      {/* 🔮 SVIETIACE POZADIE / AMBIENT GLOW AURAS */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[34rem] h-[20rem] rounded-full bg-gradient-to-b from-[#6633EE]/20 dark:from-[#6633EE]/35 via-[#A78BFA]/10 to-transparent blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[24rem] h-[24rem] rounded-full bg-[#6633EE]/10 dark:bg-[#6633EE]/20 blur-[130px] pointer-events-none" />

      {/* 🌐 HORNÁ LIŠTA: NAPRAVO HORE JAZYK LEN PRE NEPRIHLÁSENÝCH */}
      {!sessionUser && (
        <header
          className="fixed z-70 flex items-center gap-3 pointer-events-auto"
          style={{
            top: 'max(1.1rem, env(safe-area-inset-top, 18px))',
            right: 'max(1.25rem, env(safe-area-inset-right, 20px))'
          }}
        >
          {/* Prepínač jazyka SK / EN */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 text-[15px] sm:text-base font-bold text-[#0B0D22] dark:text-[#FFFFFF] hover:text-[#6633EE] dark:hover:text-[#A78BFA] transition-all cursor-pointer active:scale-95 py-1 select-none drop-shadow-sm"
            title={isSK ? 'Prepnúť do angličtiny' : 'Switch to Slovak'}
          >
            <Globe size={18} className="text-[#6633EE] dark:text-[#A78BFA]" />
            <span className="uppercase tracking-wider font-extrabold">{language}</span>
          </button>
        </header>
      )}

      {/* 📜 HLAVNÝ OBSAH LANDING SCREENU */}
      <div className="w-full h-full max-h-screen overflow-hidden flex flex-col items-center justify-between p-3 sm:p-5 pt-11 sm:pt-14 pb-2 sm:pb-3">

        {/* 💎 1. HORNÁ ČASŤ: LOGO, NÁPISY & VSTUP DO REZERVÁCIE */}
        <div className="relative z-10 w-full max-w-md mx-auto text-center space-y-1.5 sm:space-y-2.5 animate-in fade-in zoom-in-95 duration-400 flex flex-col items-center shrink-0">

          {/* LOGO BEZ KRUHU (2x VÄČŠIE S AMBIENT AURA ŽIAROU) */}
          <div className="relative w-28 h-24 sm:w-32 sm:h-28 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full bg-[#6633EE]/30 blur-2xl animate-pulse pointer-events-none" />
            <svg
              id="Hand_Logo_SVG"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 500 414.01"
              className="relative z-10 w-full h-full text-[#6633EE] dark:text-[#A78BFA] drop-shadow-[0_0_16px_rgba(102,51,238,0.8)]"
            >
                <g id="Hand_Logo">
                  <path
                    className="path-draw-1"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M411.93,151.15c25.72-17.8,50.34-37.43,72.8-56.57,2.09-1.78,7.7-1.59,9.34-.34,1.97,1.5,2.51,8.3.61,9.97-25.48,22.33-50.03,42.39-77.91,60.53-29.33,19.09-63.3,22.75-95.2,9.29-33.44-14.11-49.21-33.13-76.78-38.23-37.31,15.29-44.01,65.9-91.86,54.71-15.85,11.3-33.72,19.07-51.84,6.91-12.78,8.19-26.99,8.44-39.21.06-4.53-3.1-6.27-10.93-2.46-15.45l46.13-54.84c-20.79,10.96-51.85,25.55-70.77,6.64-1.96-1.96-4.23-6.12-4.54-8.33-.38-2.65,2.43-8.55,4.63-10.02l77.38-51.76c21.45-14.35,42.05-26.16,65.93-35.58l38.54-15.2c17.43-6.87,33.96-6.82,51.59-.67l86.41,30.16c40.82,14.25,72.78-7.19,101.01-37.32,1.64-1.74,7.65-1.85,9.45-.39,2.1,1.7,2.51,8.23.29,10.58-34.47,36.51-68.61,56.98-117.33,39.99l-86.92-30.32c-12.63-4.41-26.44-3.57-38.73,1.34l-57.19,22.85c-15.98,6.38-30.22,16.65-44.75,26.3l-74.01,49.15c13.42,14.02,65.38-16.39,79.05-24.56,12.24-7.31,27.63-11.83,38.36-19.96,9.47-7.18,14.28-17.48,29.76-15.57,44.68,5.52,75.88,22.45,114.44,14.9,13.65-2.67,22.46,30.3-60.21,11.01l-45.98-10.73c-5.52-1.29-17.08-.87-20.79,2.92-5.33,5.43,2.09,15.1,7.31,18.19,33.83,20.09,53.68,8.97,100.45,39.16,39.05,25.2,78.47,42,123,11.18ZM104.72,178.01l42.53-47.55c7.99-8.93,16.74-14.44,26.86-22.73l-7.75-11.78c-9.46,6.22-23.5,7.43-30.38,15.71l-42.64,51.31-19.35,24.32c10.05,3.58,22.36.06,30.74-9.3ZM146.99,175.05l48.06-53.16c-.64-1.91-8.31-6.33-10.96-4.28-9.33,7.26-21.41,15.71-29.38,25.01l-39.32,45.87c12.66,2.62,23.01-3.96,31.6-13.45ZM227.14,129.23c-5.91-1.09-12.75-2.11-17.08-1.88-16,15.24-31.64,31.78-44.83,49.36,20.51,5.75,44.83-38.66,61.92-47.48Z"
                  />
                  <path
                    className="path-draw-2"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M462.77,291.66c-9.41-15.36-57.59,11.22-70.73,19.17-15.02,9.09-33,14.6-47.09,24.41-9.63,6.7-12.7,17.95-29.69,15.45-17.91-2.64-37.75-6.45-56.45-11.39-19.82-5.23-39.33-7.6-59.84-3.87-2.21.4-7.07-4.18-6.94-6.55,1.02-18.15,58.6-6.75,71.94-3.04,10.57,2.94,63.75,18.1,65.24,4.83.36-3.18-1.69-10.32-4.36-12.63-27.11-23.47-56.47-10.36-104.81-43.36-36.17-24.69-75.98-39.8-116.75-14.64-31.61,19.5-59.67,41.98-88.86,65.69-2.61,2.12-7.69,1.79-9.3-.3-1.71-2.23-1.53-9.7.72-11.49,28.38-22.67,55.14-43.97,85.25-63.31,24.52-15.75,52.66-21.62,80.56-14.99,40.13,9.53,56.19,33.63,93.07,45.39,35.72-17.44,51.8-73.26,92.99-54.73,15.19-19.24,33.03-14.63,51.06-11.37,2.67.48,39.48-10.88,44.73,10.46.6,2.43-2.45,6.83-4.32,9.13l-41.19,50.77c13.55-4.61,24.13-10.86,37.01-12.28,15.52-1.71,33.89,5.52,34.51,18.23.12,2.38-2.47,7.67-4.44,8.99l-75.78,50.91c-14.22,9.55-27.72,20.39-43.48,26.42l-72.76,27.84c-11.55,4.42-24.37,3.53-35.95-.5l-94.3-32.76c-40.06-13.92-73.76,7.31-100.86,35.02-1.85,1.9-6.96,2.54-8.88,2.01-2.3-.64-4.25-7.45-2.6-9.37,32.23-37.46,73.3-57.28,120.66-40.46l89.45,31.76c10.8,3.83,21.28,3.15,31.9-.82l50.26-18.81c18.78-7.03,35.27-16.13,52.1-27.44l77.94-52.38ZM330.39,292.93c35.18-24.56,37.01-37.46,65.58-66.68-19.4-3.97-34.7,14.53-46.65,28.97-11.97,14.46-23.8,27.54-36.6,38.91,3.64,1.99,8.16,5.44,10.04,4.13l7.63-5.33ZM342.3,319.57c9.85-5.66,24.73-7.37,32.79-16.66,21.38-24.65,40.98-49.25,61.41-75.44-14.22-3.46-26.11,3.78-34.98,13.64l-40.3,44.82c-7.78,8.65-17.74,14.04-27.04,21.4l8.12,12.24ZM299.73,288.14c16.41-15.87,31.64-31.98,45.95-50.35-22.8-4.82,41.18,34.37-61.98,47.81l16.04,2.54Z"
                  />
                </g>
              </svg>
          </div>

          {/* JEMNÁ MEDZERA MEDZI LOGOM A NÁPISOM */}
          <div className="space-y-0.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-[#6633EE] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent leading-tight">
              {isSK ? 'Vitajte' : 'Welcome'}
            </h1>
            <p className="text-xs sm:text-sm font-bold tracking-widest text-[#64748B] dark:text-[#C7CAE0] uppercase mt-0.5">
              {isSK ? 'Exkluzívne masáže' : 'Exclusive Massages'}
            </p>
          </div>

          {/* TLAČIDLO VSTÚPIŤ (ODSADENÉ NIŽŠIE OD TEXTOV) */}
          <div className="pt-4 sm:pt-5 w-full max-w-[280px] sm:max-w-[320px]">
            <button
              type="button"
              onClick={handleVstupitClick}
              className="w-full min-h-[48px] sm:min-h-[52px] h-[48px] sm:h-[52px] px-6 rounded-2xl bg-gradient-to-r from-[#6633EE] via-[#7C3AED] to-[#8B5CF6] hover:from-[#7C3AED] hover:to-[#6633EE] text-white font-extrabold text-sm sm:text-base tracking-wide shadow-[0_0_24px_rgba(102,51,238,0.5)] hover:shadow-[0_0_34px_rgba(102,51,238,0.7)] transition-all duration-200 active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span>{isSK ? 'Vstúpiť do rezervácie' : 'Enter Booking'}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

        </div>

        {/* 🌟 2. DOLNÁ ČASŤ: SEKCIA RECENZIÍ (POSUNUTÁ NAHOR O 3x VÝŠKU TEXTU OD SPODKU) */}
        <section className="relative z-10 -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full max-w-6xl mt-auto mb-[72px] sm:mb-[80px] py-1 pointer-events-auto select-none shrink-0">

          {/* HLAVIČKA: NÁPIS VĽAVO, KRUHOVÉ ŠÍPKY VPRAVO */}
          <div className="flex items-center justify-between gap-3 mb-2 px-5 sm:px-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#0B0D22] dark:text-white tracking-tight leading-tight">
                {isSK ? 'Čo hovoria naši ' : 'What Our '}
                <span className="text-[#64748B] dark:text-[#94A3B8] font-semibold">
                  {isSK ? 'klienti' : 'Clients Say'}
                </span>
              </h2>
            </div>

            {/* OVLÁDACIE KRUHOVÉ ŠÍPKY */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleScrollLeft}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-[#0B0D22] dark:bg-white text-white dark:text-[#0B0D22] hover:bg-[#6633EE] dark:hover:bg-[#6633EE] hover:text-white dark:hover:text-white shadow-md transition-all duration-200 cursor-pointer active:scale-95"
                aria-label={isSK ? 'Predchádzajúca recenzia' : 'Previous review'}
              >
                <ArrowLeft size={15} />
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-[#0B0D22] dark:bg-white text-white dark:text-[#0B0D22] hover:bg-[#6633EE] dark:hover:bg-[#6633EE] hover:text-white dark:hover:text-white shadow-md transition-all duration-200 cursor-pointer active:scale-95"
                aria-label={isSK ? 'Ďalšia recenzia' : 'Next review'}
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* HORIZONTÁLNY PÁS KARIET RECENZIÍ (POSUNUTÝCH NIŽŠIE ABY NEBOLI NATLAČENÉ NA TEXT) */}
          <div
            ref={scrollContainerRef}
            onMouseEnter={() => setIsAutoScrollPaused(true)}
            onMouseLeave={() => setIsAutoScrollPaused(false)}
            onTouchStart={() => setIsAutoScrollPaused(true)}
            onTouchEnd={() => setIsAutoScrollPaused(false)}
            className="w-full overflow-x-auto no-scrollbar flex gap-3.5 sm:gap-5 py-2 px-4 sm:px-6 mt-3 sm:mt-4"
          >
            {infiniteReviews.map((review, idx) => (
              <div
                key={`${review.id}-${idx}`}
                style={{ height: '270px', minHeight: '270px' }}
                className="w-[260px] sm:w-[320px] md:w-[340px] shrink-0 p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#0B0D22]/90 backdrop-blur-2xl border border-[#E2E8F0] dark:border-[#2B2F49] shadow-lg flex flex-col justify-between text-left hover:border-[#6633EE]/60 hover:shadow-2xl transition-[filter,opacity,transform,border-color,box-shadow] duration-300 will-change-[filter,opacity,transform]"
              >
                {/* Horný riadok: Meno človeka vľavo, luxury hviezdičky v pilulke vpravo */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm sm:text-base text-[#0B0D22] dark:text-white tracking-tight truncate">
                        {formatReviewName(review.name, isSK)}
                      </span>
                      {review.verified && (
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      )}
                    </div>
                    {review.subtitle && (
                      <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] font-medium truncate">
                        {review.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Hviezdičky priamo na karte bez bubliny */}
                  <div className="flex items-center gap-0.5 text-[#E5C158] drop-shadow-[0_0_6px_rgba(229,193,88,0.5)] shrink-0 pt-0.5">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-[#E5C158] stroke-[#D4AF37] stroke-[0.5]" />
                    ))}
                  </div>
                </div>

                {/* Stred: Text recenzie */}
                <div className="my-auto py-2 flex-1 flex items-center">
                  <p className="text-xs sm:text-sm font-medium text-[#0B0D22] dark:text-white leading-relaxed tracking-tight line-clamp-6">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>

                {/* Spodná časť: Dátum recenzie */}
                {review.date && (
                  <div className="pt-2 border-t border-slate-100 dark:border-[#1E2342] flex items-center justify-between text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8]">
                    <span className="font-semibold text-[#6633EE] dark:text-[#A78BFA]">{isSK ? 'Overená recenzia' : 'Verified review'}</span>
                    <span>{review.date}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 📌 SPODNÁ LIŠTA OBRAZOVKY: INFORMÁCIA O MOŽNOSTI PRIDAŤ RECENZIU */}
        <footer className="relative z-10 shrink-0 pt-1 pb-1 text-center pointer-events-auto">
          <p className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center justify-center gap-1.5 px-4 max-w-xl mx-auto leading-tight">
            <QrCode size={12} className="text-[#6633EE] dark:text-[#A78BFA] shrink-0" />
            <span>
              {isSK
                ? 'Recenziu môžete pridať po prihlásení v profile alebo naskenovaním QR kódu v salóne.'
                : 'You can submit a review in your profile or by scanning the QR code in the salon.'}
            </span>
          </p>
        </footer>
      </div>

      {/* 🚀 DIALÓG: PRIHLÁSIŤ SA ALEBO POKRAČOVAŤ AKO HOSŤ */}
      {showAuthChoice && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 rounded-[24px] bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] shadow-2xl text-center space-y-4 relative animate-in zoom-in-95 duration-200 text-[#1E293B] dark:text-[#DDE0F2]">

            {/* Zatvárací krížik */}
            <button
              type="button"
              onClick={() => setShowAuthChoice(false)}
              className="absolute top-4 right-4 text-[#64748B] hover:text-[#0B0D22] dark:hover:text-white p-1 cursor-pointer transition-colors"
              title={isSK ? 'Zavrieť' : 'Close'}
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 mx-auto rounded-full bg-[#6633EE]/15 border border-[#6633EE]/30 text-[#6633EE] dark:text-[#A78BFA] flex items-center justify-center shadow-[0_0_18px_rgba(102,51,238,0.3)]">
              <Sparkles size={22} />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#0B0D22] dark:text-white tracking-tight">
                {isSK ? 'Ako si prajete vstúpiť?' : 'How would you like to enter?'}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#C7CAE0] leading-relaxed">
                {isSK
                  ? 'Môžete si rezervovať termín ako hosť, alebo sa prihlásiť do svojho profilu.'
                  : 'You can book as a guest or sign in to your account.'}
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {/* Voľba 1: Prihlásiť sa */}
              <button
                type="button"
                onClick={handleLoginClick}
                className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-[#6633EE] via-[#7C3AED] to-[#8B5CF6] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(102,51,238,0.4)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
              >
                <LogIn size={15} />
                <span>{isSK ? 'Prihlásiť sa' : 'Sign In'}</span>
              </button>

              {/* Voľba 2: Pokračovať ako hosť */}
              <button
                type="button"
                onClick={triggerEnterReservation}
                className="w-full min-h-[44px] rounded-xl bg-slate-100 dark:bg-[#010314] hover:bg-slate-200 dark:hover:bg-[#121633] text-[#0B0D22] dark:text-[#FFFFFF] border border-[#E2E8F0] dark:border-[#2B2F49] font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <User size={15} className="text-[#64748B] dark:text-[#A78BFA]" />
                <span>{isSK ? 'Pokračovať ako hosť' : 'Continue as Guest'}</span>
                <ArrowRight size={14} className="text-[#64748B] dark:text-[#A78BFA]" />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}