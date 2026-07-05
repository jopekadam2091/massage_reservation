'use client';
import { useState, useEffect } from 'react';

type LangType = 'SK' | 'EN';
type MassageType = 'Klasik' | 'VIP';
type ContactMethod = 'phone' | 'instagram' | 'email';
type Feature = { text: string; icon?: 'chili' | 'check' };



type PackageItem = {
  duration: number;
  badge: string;
  desc: string;
  features: Feature[];
};

type PackagesData = {
  Klasik: PackageItem[];
  VIP: PackageItem[];
};

type TimeSlot = {
  formattedTime: string;    // napr. "21:45"
  startIso: string;         // kompletný ISO string pre API
  availableMinutes: number; // koľko minút voľna v bloku ešte zostáva od tohto momentu
  discountPercent: number;  // 0 = bez zľavy, inak percento zľavy platné pre celý blok
};

const featureIcons: Record<string, string> = {
  chili: '🌶️',
  check: '💎',
};

// ============================================================================
// TÉMA PRE ZĽAVOVÉ ("AKCIA") ZVÝRAZNENIE
// ----------------------------------------------------------------------------
// Skutočná farebná téma sa načítava za behu z Google Sheetu (tab "DiscountColor",
// endpoint /api/discount-theme) - pozri riadok so state 'discountTheme' nižšie.
// Táto konštanta je len BEZPEČNÝ FALLBACK pre prípad, že by sheet/endpoint
// nebol dostupný, aby appka nikdy nezostala bez farieb.
// ============================================================================
const DEFAULT_DISCOUNT_THEME = {
  fill: '#06b6d4',                     // plná farba (aktívny deň/slot, badge -X%)
  badgeText: '#ffffff',                // farba textu na 'fill' pozadí
  border: 'rgba(34,211,238,0.6)',      // orámovanie v pokojnom (outline) stave
  borderHover: '#22d3ee',              // orámovanie pri hover
  text: '#22d3ee',                     // farba textu v outline stave
  textAccent: '#67e8f9',               // svetlejší text (cenový súhrn)
  glow: 'rgba(34,211,238,0.85)',       // glow pri výbere
  glowSoft: 'rgba(34,211,238,0.45)',   // glow v pokoji
  glowHover: 'rgba(34,211,238,0.65)',  // glow pri hover
};

export default function Home() {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lang, setLang] = useState<LangType>('SK');
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [discountTheme, setDiscountTheme] = useState(DEFAULT_DISCOUNT_THEME);

  // --- STAVY PRE MASÁŽNY STEPPER ---
  const [massageStep, setMassageStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<MassageType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  
  // --- DYNAMICKÝ KALENDÁR A GOOGLE API STAVY ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [slotsByDate, setSlotsByDate] = useState<Record<string, TimeSlot[]>>({});
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // --- STAVY PRE KONTAKT A VALIDÁCIU TELEFÓNU ---
  const [activeContacts, setActiveContacts] = useState<Record<ContactMethod, boolean>>({
    phone: true,
    instagram: false,
    email: false,
  });
  const [contactValues, setContactValues] = useState<Record<ContactMethod, string>>({
    phone: '',
    instagram: '',
    email: '',
  });
  const [phonePrefix, setPhonePrefix] = useState<string>('+421'); 
  const [clientName, setClientName] = useState('');
  const [wantsNote, setWantsNote] = useState(false);
  const [customerNote, setCustomerNote] = useState('');

  // --- STAVY PRE ZĽAVOVÝ KÓD ---
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [appliedCodePercent, setAppliedCodePercent] = useState<number>(0);
  const [codeCheckStatus, setCodeCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [codeDebugInfo, setCodeDebugInfo] = useState<string>(''); // DOČASNÉ - odstrániť po vyriešení

  // --- PREKLADY ---
  const translations = {
    SK: {
      massage: 'Masáže',
      massageHoverCta: 'Rezervujte si masáž',
      massageTitle: 'Rezervácia masáže',
      massageSubtitle: 'Exkluzívne privátne masáže. Rezervácia možná len cez voľné sloty.',
      step1: 'Úroveň', step2: 'Balíček', step3: 'Termín',
      step1Title: '1. Krok: Vyberte si úroveň starostlivosti',
      klasikTitle: 'MASÁŽ CLASSIC',
      klasikDesc: 'Dôkladné uvoľnenie svalového napätia, regenerácia tela.',
      vipTitle: 'MASÁŽ VIP PREMIUM ✨',
      vipDesc: 'Exkluzívny rituál vrátane aromaterapie, masáže hlavy a maximálneho pokoja.',
      step2Title: '2. Krok: Vyberte si optimálny balíček',
      step3Title: '3. Krok: Vyberte si exkluzívny voľný termín z kalendára',
      selected: 'Vybrané',
      selectedTerm: 'Vybraný termín',
      minutes: 'minút',
      backToLevel: 'Späť na výber úrovne',
      backToPackages: 'Späť na výber balíčka',
      contactTitle: 'Kontaktné údaje pre overenie a zaslanie adresy',
      contactNotice: 'Zvoľte aspoň jeden spôsob kontaktu, kde vás zastihnem:',
      bookBtn: 'Záväzne rezervovať exkluzívny termín',
      homeBtn: 'Domov',
      phone: 'Telefón',
      email: 'Email',
      instagram: 'Instagram',
      name: 'Vaše meno',
      selectBtn: 'Vybrať tento balíček',
      months: ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'],
      mon: 'PO', tue: 'UT', wed: 'ST', thu: 'ŠT', fri: 'PI', sat: 'SO', sun: 'NE',
      chooseTime: 'Vyberte si čas na daný deň:',
      loading: 'Načítavam voľné termíny z kalendára...',
      successTitle: 'Rezervácia bola úspešná! 🎉',
      successText: 'Vaša rezervácia bola úspešne zapísaná do kalendára. Čoskoro vás budem kontaktovať pre potvrdenie a zaslanie adresy.',
      successHomeBtn: 'Späť na domovskú stránku',
      summaryTitle: 'Súhrn rezervácie',
      discountApplied: 'Zľava',
      finalPriceLabel: 'Cena k úhrade',
      discountBadgeShort: 'AKCIA',
      discountCodeLabel: 'Zľavový kód',
      discountCodePlaceholder: 'Zadajte zľavový kód)',
      applyCodeBtn: 'Použiť',
      codeCheckingMsg: 'Overujem kód...',
      codeValidMsg: 'Kód platný',
      codeInvalidMsg: 'Neplatný alebo expirovaný kód',
      removeCodeBtn: 'Odstrániť',
      codeDiscountLabel: 'Zľava z kódu',
      noteCheckboxLabel: 'Chcem pridať poznámku / špeciálnu požiadavku',
      notePlaceholder: 'Napíšte sem vašu poznámku alebo požiadavku...',
      mostPopularLabel: '★ Najžiadanejší',
      selectLevelBtn: 'Vybrať túto úroveň'
    },
    EN: {
      massage: 'Massage',
      massageHoverCta: 'Book a massage',
      massageTitle: 'Massage reservation',
      massageSubtitle: 'Exclusive private massages. Booking only via available slots.',
      step1: 'Level', step2: 'Package', step3: 'Date',
      step1Title: '1. Step: Choose your level of care',
      klasikTitle: 'CLASSIC MASSAGE',
      klasikDesc: 'Thorough release of muscle tension, body regeneration.',
      vipTitle: 'VIP PREMIUM MASSAGE ✨',
      vipDesc: 'Exclusive ritual including aromatherapy, head massage and ultimate peace.',
      step2Title: '2. Step: Choose your package',
      step3Title: '3. Step: Choose an exclusive available slot from the calendar',
      selected: 'Selected',
      selectedTerm: 'Selected time slot',
      minutes: 'minutes',
      backToLevel: 'Back to level selection',
      backToPackages: 'Back to package selection',
      contactTitle: 'Contact details for verification and address delivery',
      contactNotice: 'Choose at least one contact method to reach you:',
      bookBtn: 'Book exclusive appointment',
      homeBtn: 'Home',
      phone: 'Phone',
      email: 'Email',
      instagram: 'Instagram',
      name: 'Your name',
      selectBtn: 'Select this package',
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA', sun: 'SU',
      chooseTime: 'Select time for the chosen day:',
      loading: 'Loading available slots from Google Calendar...',
      successTitle: 'Booking successful! 🎉',
      successText: 'Your booking has been successfully saved to the calendar. I will contact you shortly to confirm and send the address.',
      successHomeBtn: 'Back to homepage',
      summaryTitle: 'Reservation summary',
      discountApplied: 'Discount',
      finalPriceLabel: 'Total price',
      discountBadgeShort: 'DEAL',
      discountCodeLabel: 'Discount code',
      discountCodePlaceholder: 'Enter discount code ',
      applyCodeBtn: 'Apply',
      codeCheckingMsg: 'Checking code...',
      codeValidMsg: 'Code valid',
      codeInvalidMsg: 'Invalid or expired code',
      removeCodeBtn: 'Remove',
      codeDiscountLabel: 'Code discount',
      noteCheckboxLabel: 'I want to add a note / special request',
      notePlaceholder: 'Write your note or request here...',
      mostPopularLabel: '★ Most Popular',
      selectLevelBtn: 'Select this level'
    }
  };

  const t = translations[lang];

  // --- VÝPOČTY PRE DYNAMICKÝ KALENDÁR ---
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const daysInMonthCount = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);
  
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const emptyCells = Array.from({ length: firstDayIndex }, (_, i) => i);

  const getDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDateKey(null);
    setSelectedSlot(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDateKey(null);
    setSelectedSlot(null);
  };

  const prices = {
    Klasik: { 30: '30 eur', 45: '40 eur', 60: '45 eur' },
    VIP: { 45: '65 eur', 60: '70 eur', 90: '90 eur' }
  };

  // --- EFEKT: NAČÍTANIE FARIEB ZĽAVOVÉHO ZVÝRAZNENIA Z GOOGLE SHEETU ---
  useEffect(() => {
    fetch('/api/discount-theme')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.found && data.theme) {
          setDiscountTheme(data.theme);
        }
        // Ak sheet nemá aktívny riadok alebo je nedostupný, ticho ostávame
        // na DEFAULT_DISCOUNT_THEME - appka nikdy nezostane bez farieb.
      })
      .catch(() => {
        // Endpoint nedostupný -> ostávame na DEFAULT_DISCOUNT_THEME.
      });
  }, []);

  // --- EFEKT: NAČÍTANIE Z GOOGLE KALENDÁRA ---
  useEffect(() => {
    if (massageStep === 3) {
      setLoadingCalendar(true);
      fetch('/api/appointments')
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          if (data.events) {
            // Dva podporované vzory zliav:
            // 1) SAMOSTATNÝ blok "FSM_D20" bez okolitého "FSM" bloku -> zľava platí pre celý tento blok.
            // 2) "FSM_D20" VNORENÝ vnútri väčšieho "FSM" bloku -> zľava platí len pre časový úsek,
            //    ktorý "FSM_D20" pokrýva; zvyšok "FSM" bloku ostáva za plnú cenu.
            const discountRegex = /^FSM_D(\d{1,3})$/i;

            const allFsmRaw = data.events
              .filter((e: any) => {
                const summary = (e.summary || '').trim();
                return summary.toLowerCase().includes('fsm') && e.start?.dateTime && e.end?.dateTime;
              })
              .map((e: any) => {
                const summary = (e.summary || '').trim();
                const match = summary.match(discountRegex);
                return {
                  start: new Date(e.start.dateTime),
                  end: new Date(e.end.dateTime),
                  isDiscount: !!match,
                  percent: match ? Math.min(100, Math.max(0, parseInt(match[1], 10))) : 0
                };
              });

            const plainBlocks = allFsmRaw.filter((e: any) => !e.isDiscount);
            const discountEvents = allFsmRaw.filter((e: any) => e.isDiscount);

            const overlapsAny = (a: { start: Date; end: Date }, list: { start: Date; end: Date }[]) =>
              list.some(
                (b) => a.start.getTime() < b.end.getTime() && a.end.getTime() > b.start.getTime()
              );

            // Vnorené = prekrývajú sa s aspoň jedným čistým "FSM" blokom -> nevytvárajú vlastné sloty,
            // len prekryjú zľavu na existujúce sloty daného bloku.
            const nestedDiscountWindows = discountEvents.filter((d: any) => overlapsAny(d, plainBlocks));
            // Samostatné = nemajú okolitý "FSM" blok -> generujú si vlastné sloty so zľavou.
            const standaloneDiscountBlocks = discountEvents.filter((d: any) => !overlapsAny(d, plainBlocks));

            const getNestedDiscountForSlot = (slotStart: Date) => {
              let maxPercent = 0;
              if (!selectedDuration) return maxPercent;
              const massageEndTime = slotStart.getTime() + selectedDuration * 60000;
              nestedDiscountWindows.forEach((w: any) => {
                // Zľava platí, len ak sa CELÁ masáž (od štartu po koniec) zmestí do zľavového okna
                const fitsFully =
                  slotStart.getTime() >= w.start.getTime() && massageEndTime <= w.end.getTime();
                if (fitsFully) {
                  maxPercent = Math.max(maxPercent, w.percent);
                }
              });
              return maxPercent;
            };

            const processedSlots: Record<string, TimeSlot[]> = {};

            const generateSlotsForBlock = (event: { start: Date; end: Date }, bakedPercent: number | null) => {
              const dateKey = getDateKey(
                event.start.getFullYear(),
                event.start.getMonth(),
                event.start.getDate()
              );

              if (!processedSlots[dateKey]) {
                processedSlots[dateKey] = [];
              }

              let slotStart = new Date(event.start.getTime());
              const blockEnd = event.end.getTime();

              while (slotStart.getTime() < blockEnd) {
                const remainingMinutes = Math.round((blockEnd - slotStart.getTime()) / 60000);

                const formattedTime = slotStart.toLocaleTimeString('sk-SK', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const discountPercent =
                  bakedPercent !== null ? bakedPercent : getNestedDiscountForSlot(slotStart);

                processedSlots[dateKey].push({
                  formattedTime,
                  startIso: slotStart.toISOString(),
                  availableMinutes: remainingMinutes,
                  discountPercent
                });

                slotStart.setMinutes(slotStart.getMinutes() + 15);
              }
            };

            plainBlocks
              .sort((a: any, b: any) => a.start.getTime() - b.start.getTime())
              .forEach((event: any) => generateSlotsForBlock(event, null));

            standaloneDiscountBlocks
              .sort((a: any, b: any) => a.start.getTime() - b.start.getTime())
              .forEach((event: any) => generateSlotsForBlock(event, event.percent));

            setSlotsByDate(processedSlots);
          }
          setLoadingCalendar(false);
        })
        .catch(() => {
          setLoadingCalendar(false);
        });
    }
  }, [massageStep]);

  const handleContactCheckboxChange = (method: ContactMethod) => {
    setActiveContacts(prev => ({ ...prev, [method]: !prev[method] }));
  };

  // Validácia: Iba čísla, maximálne 9 znakov
  const handlePhoneChange = (value: string) => {
    const onlyNums = value.replace(/\D/g, ''); 
    if (onlyNums.length <= 9) {
      setContactValues(prev => ({ ...prev, phone: onlyNums }));
    }
  };

  const handleContactValueChange = (method: ContactMethod, value: string) => {
    setContactValues(prev => ({ ...prev, [method]: value }));
  };

  // Pomocná funkcia, ktorá overí, či slot spĺňa podmienky dĺžky a inteligentnej rezervácie
  const isValidSlotDuration = (availableMinutes: number, duration: number) => {
    // Ak v bloku vôbec neostáva dosť času ani na dĺžku masáže, slot je neplatný
    if (availableMinutes < duration) return false;

    const leftoverMinutes = availableMinutes - duration;

    // Ak po skončení masáže zostane menej ako 30 minút (minimálna dĺžka masáže),
    // znamená to, že za týmto klientom sa už nikto ďalší nezmestí. 
    // Tým pádom nie je potrebné vynucovať 25-minútovú rezervu a slot schválime.
    if (leftoverMinutes < 30) return true;

    // Ak by po masáži zostalo v bloku 30 a viac minút, mohol by prísť ďalší človek,
    // preto riadne vyžadujeme 25-minútovú rezervu.
    return leftoverMinutes >= 25;
  };

  // --- CENOVÝ SÚHRN (základná cena, zľava, finálna cena) ---
  const getBasePriceNumber = () => {
    if (!selectedType || !selectedDuration) return 0;
    const priceStr =
      selectedType === 'Klasik'
        ? prices.Klasik[selectedDuration as 30 | 45 | 60]
        : prices.VIP[selectedDuration as 45 | 60 | 90];
    return parseInt(priceStr, 10);
  };

  const selectedSlotObj: TimeSlot | null =
    selectedDateKey && selectedSlot
      ? (slotsByDate[selectedDateKey] || []).find((s) => s.startIso === selectedSlot) || null
      : null;

  const selectedDiscountPercent = selectedSlotObj?.discountPercent || 0;
  const basePrice = getBasePriceNumber();
  const priceAfterSlotDiscount =
    selectedDiscountPercent > 0
      ? basePrice * (1 - selectedDiscountPercent / 100)
      : basePrice;
  const finalPrice =
    appliedCodePercent > 0
      ? Math.round(priceAfterSlotDiscount * (1 - appliedCodePercent / 100))
      : Math.round(priceAfterSlotDiscount);

  const handleApplyDiscountCode = async () => {
    const code = discountCodeInput.trim();
    if (!code) return;
    setCodeCheckStatus('checking');
    setCodeDebugInfo('');
    try {
      const url = `/api/discount-code?code=${encodeURIComponent(code)}`;
      const res = await fetch(url);
      const rawText = await res.text();

      // --- DOČASNÝ DEBUG - odstrániť po vyriešení ---
      setCodeDebugInfo(
        `URL: ${url}\nHTTP status: ${res.status}\nOdpoveď: ${rawText}`
      );
      // --- KONIEC DEBUGU ---

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        setCodeCheckStatus('invalid');
        return;
      }

      if (!res.ok) {
        setCodeCheckStatus('invalid');
        return;
      }

      if (data.valid && typeof data.percent === 'number' && data.percent > 0) {
        setAppliedCode(code.toUpperCase());
        setAppliedCodePercent(Math.min(100, Math.max(0, data.percent)));
        setCodeCheckStatus('valid');
      } else {
        setAppliedCode(null);
        setAppliedCodePercent(0);
        setCodeCheckStatus('invalid');
      }
    } catch (err: any) {
      setCodeDebugInfo(`Fetch zlyhal: ${err?.message || String(err)}`);
      setAppliedCode(null);
      setAppliedCodePercent(0);
      setCodeCheckStatus('invalid');
    }
  };

  const handleRemoveDiscountCode = () => {
    setDiscountCodeInput('');
    setAppliedCode(null);
    setAppliedCodePercent(0);
    setCodeCheckStatus('idle');
    setCodeDebugInfo('');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const finalPhoneNumber = activeContacts.phone ? `${phonePrefix}${contactValues.phone}` : '';

    const payload = {
      name: clientName,
      email: contactValues.email,
      phone: finalPhoneNumber,
      instagram: contactValues.instagram,
      slot: selectedSlot,
      duration: selectedDuration,
      type: selectedType === 'Klasik' ? 'CLASSIC' : 'VIP PREMIUM',
      basePrice,
      discountPercent: selectedDiscountPercent,
      discountCode: appliedCode,
      codeDiscountPercent: appliedCodePercent,
      finalPrice,
      customerNote: wantsNote ? customerNote.trim() : '',
      notes: (() => {
        const parts: string[] = [];
        if (selectedDiscountPercent > 0) parts.push(`Zľava z termínu: ${selectedDiscountPercent}%`);
        if (appliedCode && appliedCodePercent > 0) parts.push(`Zľavový kód ${appliedCode}: -${appliedCodePercent}%`);
        parts.push(`Pôvodná cena: ${basePrice}€ -> Cena po zľavách: ${finalPrice}€`);
        return parts.join(' | ');
      })()
    };

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowSuccessPopup(true);
        setMassageStep(1);
        setSelectedType(null);
        setSelectedDuration(null);
        setSelectedDateKey(null);
        setSelectedSlot(null);
        setClientName('');
        setContactValues({ phone: '', instagram: '', email: '' });
        setDiscountCodeInput('');
        setAppliedCode(null);
        setAppliedCodePercent(0);
        setCodeCheckStatus('idle');
        setWantsNote(false);
        setCustomerNote('');
      } else {
        alert(lang === 'SK' ? 'Chyba pri ukladaní rezervácie.' : 'Error saving appointment.');
      }
    } catch {
      alert(lang === 'SK' ? 'Nepodarilo sa spojiť so serverom.' : 'Connection error.');
    }
  };

  const isContactValid = () => {
    if (!clientName.trim()) return false;
    const hasAtLeastOneChecked = activeContacts.phone || activeContacts.instagram || activeContacts.email;
    if (!hasAtLeastOneChecked) return false;
    if (activeContacts.phone && contactValues.phone.length !== 9) return false;
    if (activeContacts.instagram && !contactValues.instagram.trim()) return false;
    if (activeContacts.email && !contactValues.email.trim()) return false;
    return true;
  };

 const packagesTranslations: Record<'SK' | 'EN', PackagesData> = {
  SK: {
    Klasik: [
  {
    duration: 30,
    badge: 'Lite',
    desc: 'Vhodný pre rýchlu masáž konkrétnejšej oblasti tela.',
    features: [
      { text: 'Masáž vybranej časti tela' },
      { text: 'Aromaterapia' }
    ]
  },
  {
    duration: 45,
    badge: 'Supreme',
    desc: 'Vhodný pre rýchly relax celého tela.',
    features: [
      { text: 'Masáž celého tela' },
      { text: 'Možnosť vybrať extra čas na vybranú partiu' },
      { text: 'Aromaterapia' }
    ]
  },
  {
    duration: 60,
    badge: 'Full Experience',
    desc: 'Dokonalý zážitok s extra časom.',
    features: [
      { text: 'Stimulujúca masáž celého tela' },
      { text: 'Možnosť vybrať extra čas na vybranú partiu' },
      { text: 'Aromaterapia' }
    ]
  }
],
    VIP: [
  {
    duration: 45,
    badge: 'VIP Supreme',
    desc: 'Rýchla ochutnávka VIP procedúr.',
    features: [
      { text: 'Hĺbková masáž chrbta a šije' },
      { text: 'Masáž rúk a dlaní' },
      { text: 'Relaxačná masáž nôh' },
      { text: 'Aplikovanie intímnych olejov', icon: 'chili' },
      { text: 'Aromaterapia' }
    ]
  },
  {
    duration: 60,
    badge: 'VIP Pro',
    desc: 'Kompletný prémium relaxačný rituál v plnom rozsahu.',
    features: [
      { text: 'Hĺbková masáž celého tela' },
      { text: 'Masáž rúk a dlaní' },
      { text: 'Aplikovanie intímnych olejov', icon: 'chili' },
      { text: 'Terapeutická masáž prostaty', icon: 'chili' },
      { text: 'Senzuálna masáž slabín', icon: 'chili' },
      { text: 'Aromaterapia' },
      { text: 'Dynamická perkusívna terapia (vibračná pištoľ)' }
    ]
  },
  {
    duration: 90,
    badge: 'VIP Max',
    desc: 'Pro zážitok vytiahnutý na maximum, pre milovníkov relaxu.',
    features: [
      { text: 'Maximálne uvoľnenie' },
      { text: 'Hĺbková masáž celého tela' },
      { text: 'Masáž rúk a dlaní' },
      { text: 'Aplikovanie intímnych olejov', icon: 'chili' },
      { text: 'Terapeutická masáž prostaty', icon: 'chili' },
      { text: 'Senzuálna masáž slabín', icon: 'chili' },
      { text: 'Aromaterapia' },
      { text: 'Dynamická perkusívna terapia' },
      { text: 'Nealko drink v cene' },
      { text: '+ Darček' }
    ]
  }
]
  },
 EN: {
  Klasik: [
    {
      duration: 30,
      badge: 'Lite',
      desc: 'Great for a quick massage of a specific body area.',
      features: [
        { text: 'Massage of a selected body part' },
        { text: 'Aromatherapy' }
      ]
    },
    {
      duration: 45,
      badge: 'Supreme',
      desc: 'Great for a quick full-body relax.',
      features: [
        { text: 'Full body massage' },
        { text: 'Option to add extra time on a chosen area' },
        { text: 'Aromatherapy' }
      ]
    },
    {
      duration: 60,
      badge: 'Full Experience',
      desc: 'A perfect experience with extra time.',
      features: [
        { text: 'Stimulated full body massage' },
        { text: 'Option to add extra time on a chosen area' },
        { text: 'Aromatherapy' }
      ]
    }
  ],
  VIP: [
    {
      duration: 45,
      badge: 'VIP Supreme',
      desc: 'A quick taste of the VIP treatments.',
      features: [
        { text: 'Deep back and neck massage' },
        { text: 'Hand massage' },
        { text: 'Relaxing foot massage' },
        { text: 'Intime oil application', icon: 'chili' },
        { text: 'Aromatherapy' }
      ]
    },
    {
      duration: 60,
      badge: 'VIP Pro',
      desc: 'A complete premium relaxation ritual in full scope.',
      features: [
        { text: 'Deep full body massage' },
        { text: 'Hand massage' },
        { text: 'Intime oil application', icon: 'chili' },
        { text: 'Therapeutic prostate massage', icon: 'chili' },
        { text: 'Intense frontal senzual massage', icon: 'chili' },
        { text: 'Aromatherapy' },
        { text: 'Dynamic percussive therapy (massage gun)' }
      ]
    },
    {
      duration: 90,
      badge: 'VIP Max',
      desc: 'The pro experience taken to the max, for relaxation lovers.',
      features: [
        { text: 'Maximum relaxation' },
        { text: 'Deep full body massage' },
        { text: 'Hand massage' },
        { text: 'Intime oil application', icon: 'chili' },
        { text: 'Therapeutic prostate massage', icon: 'chili' },
        { text: 'Intense frontal senzual massage', icon: 'chili' },
        { text: 'Aromatherapy' },
        { text: 'Dynamic percussive therapy' },
        { text: 'Complimentary soft drink' },
        { text: '+ Gift' }
      ]
    }
  ]
}
};
const packagesData = packagesTranslations[lang];
  return (
    <div
      className="min-h-screen transition-all duration-700 ease-in-out pb-20 bg-[#051F20] text-[#DAF1DE]"
      style={{
        '--discount-border': discountTheme.border,
        '--discount-border-hover': discountTheme.borderHover,
        '--discount-text': discountTheme.text,
        '--discount-text-accent': discountTheme.textAccent,
        '--discount-glow': discountTheme.glow,
        '--discount-glow-soft': discountTheme.glowSoft,
        '--discount-glow-hover': discountTheme.glowHover,
      } as React.CSSProperties}
    >

      {/* ÚSPEŠNÁ REZERVÁCIA - OVERLAY */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 animate-fadeIn">
          <div className="bg-[#DAF1DE] rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-[#8EB69B]/40">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#8EB69B]/30 flex items-center justify-center text-3xl">
              ✅
            </div>
            <h2 className="text-xl font-extrabold text-[#051F20] mb-3">
              {t.successTitle}
            </h2>
            <p className="text-sm text-[#0B2B26] mb-6 leading-relaxed">
              {t.successText}
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              className="w-full bg-[#163832] text-[#DAF1DE] py-3 rounded-xl font-bold text-sm hover:bg-[#0B2B26] transition shadow-sm"
            >
              {t.successHomeBtn}
            </button>
          </div>
        </div>
      )}

      {/* JAZYKOVÝ PREPÍNAČ */}
      <div className="absolute top-6 right-6 z-50 flex space-x-2 bg-[#0B2B26]/60 p-1 rounded-full backdrop-blur-sm border border-[#235347] font-sans">
        <button type="button" onClick={() => setLang('SK')} className={`px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center space-x-1 ${lang === 'SK' ? 'bg-[#DAF1DE] text-[#051F20] shadow' : 'text-[#8EB69B] hover:text-[#DAF1DE]'}`}>
          <span>🇸🇰</span> <span>SK</span>
        </button>
        <button type="button" onClick={() => setLang('EN')} className={`px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center space-x-1 ${lang === 'EN' ? 'bg-[#DAF1DE] text-[#051F20] shadow' : 'text-[#8EB69B] hover:text-[#DAF1DE]'}`}>
          <span>🇬🇧</span> <span>EN</span>
        </button>
      </div>

      {/* ÚVODNÁ OBRAZOVKA */}
      {showLanding && (
        <div className="flex h-screen w-full items-center justify-center bg-[#1a1a1a]">
          <button
            type="button"
            onClick={() => setShowLanding(false)}
            className="group flex flex-col items-center justify-center gap-2 rounded-3xl px-16 py-14 bg-[#2a2a2a] hover:bg-[#8EB69B] transition-all duration-300"
          >
            <div
              className="w-32 h-32 mb-2 bg-[#7a7a7a] group-hover:bg-[#051F20] group-hover:scale-110 transition-all duration-300"
              style={{
                WebkitMask: 'url(/logo_massage.svg) no-repeat center / contain',
                mask: 'url(/logo_massage.svg) no-repeat center / contain',
              }}
            />
            <span className="relative h-[3rem] flex items-center justify-center text-[2.5rem] font-light tracking-widest uppercase text-white group-hover:text-[#051F20] transition-colors duration-300">
              <span className="opacity-100 group-hover:opacity-0 transition-opacity duration-300">{t.massage}</span>
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">{t.massageHoverCta}</span>
            </span>
          </button>
        </div>
      )}

      {!showLanding && (
      <>
      <header className="p-6 max-w-4xl mx-auto flex justify-between items-center">
        <button
          type="button"
          onClick={() => {
            setShowLanding(true);
            setMassageStep(1);
            setSelectedType(null);
            setSelectedDuration(null);
            setSelectedDateKey(null);
            setSelectedSlot(null);
          }}
          className="text-xs uppercase tracking-widest font-chillax font-bold px-4 py-2 rounded-full border border-current bg-white/5 transition hover:bg-white/10 opacity-80 hover:opacity-100"
        >
          {t.homeBtn}
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 mt-4">
        <div className="space-y-8 animate-fadeIn">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-3xl font-extrabold mb-1 text-[#DAF1DE] font-chillax">{t.massageTitle}</h1>
            <p className="text-[#8EB69B] text-sm">{t.massageSubtitle}</p>
          </div>
          <div className="flex justify-between max-w-xs mx-auto mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center space-x-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition ${massageStep === step ? 'bg-[#8EB69B] text-[#051F20] border-[#8EB69B]' : 'bg-[#163832] text-[#8EB69B] border-[#235347]'}`}>{step}</div>
                <span className={`text-[10px] font-semibold ${massageStep === step ? 'text-[#DAF1DE]' : 'text-[#8EB69B]'}`}>{step === 1 ? t.step1 : step === 2 ? t.step2 : t.step3}</span>
              </div>
            ))}
          </div>
          {/* KROK 1 */}
          {massageStep === 1 && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-lg font-bold text-center text-[#DAF1DE] mb-6">{t.step1Title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pt-3">
                {/* CLASSIC */}
                <div className="relative flex flex-col h-full">
                  <div className="flex flex-col h-full rounded-2xl border border-[#235347] bg-[#0B2B26]/70 p-6 transition hover:border-[#8EB69B]/50">
                    <h3 className="font-bold text-lg text-[#DAF1DE] mb-2">{t.klasikTitle}</h3>
                    <p className="text-xs text-[#8EB69B] flex-grow mb-5">{t.klasikDesc}</p>
                    <button 
                      type="button" 
                      onClick={() => { setSelectedType('Klasik'); setMassageStep(2); }} 
                      className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-transparent border border-[#8EB69B]/50 text-[#DAF1DE] hover:border-[#8EB69B] hover:bg-[#163832] transition"
                    >
                      {t.selectLevelBtn}
                    </button>
                  </div>
                </div>

                {/* VIP PREMIUM */}
                <div className="relative flex flex-col h-full md:scale-[1.03] z-10">
                  <div className="flex flex-col h-full rounded-2xl border-2 border-[#8EB69B] bg-gradient-to-b from-[#1b453d] to-[#0B2B26] shadow-[0_0_45px_rgba(142,182,155,0.3)] p-6 transition">
                    <h3 className="font-extrabold text-lg text-[#DAF1DE] mb-2">{t.vipTitle}</h3>
                    <p className="text-xs text-[#8EB69B] font-medium flex-grow mb-5">{t.vipDesc}</p>
                    <button 
                      type="button" 
                      onClick={() => { setSelectedType('VIP'); setMassageStep(2); }} 
                      className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#DAF1DE] text-[#051F20] shadow-lg hover:bg-white hover:shadow-xl hover:-translate-y-0.5 transition"
                    >
                      {t.selectLevelBtn}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KROK 2 */}
          {massageStep === 2 && selectedType && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-[#DAF1DE]">{t.step2Title} ({selectedType === 'Klasik' ? t.klasikTitle : t.vipTitle})</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 items-stretch pt-3">
                {packagesData[selectedType].map((pkg) => {
                  const priceStr = selectedType === 'Klasik' 
                    ? prices.Klasik[pkg.duration as 30 | 45 | 60] 
                    : prices.VIP[pkg.duration as 45 | 60 | 90];
                  
                  const isMiddle = pkg.badge === 'Supreme' || pkg.badge === 'VIP Pro';
          
                  return (
                    <div key={pkg.duration} className={`relative flex flex-col h-full transition-all ${
                      isMiddle ? 'md:scale-[1.04] z-10' : ''
                    }`}>
                      {isMiddle && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#DAF1DE] text-[#051F20] text-[10px] font-extrabold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider z-20">
                          {t.mostPopularLabel}
                        </span>
                      )}
                      <div className={`flex flex-col h-full rounded-3xl border transition-all overflow-hidden ${
                        isMiddle
                          ? 'bg-gradient-to-b from-[#1b453d] to-[#0B2B26] border-2 border-[#8EB69B] shadow-[0_0_45px_rgba(142,182,155,0.3)]'
                          : 'bg-[#0B2B26]/70 border-[#235347]'
                      }`}>
                        <div className={`p-6 pb-0 flex flex-col items-start ${isMiddle ? 'pt-8 min-h-[216px]' : 'min-h-[190px]'}`}>
                          <span className={`px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full mb-4 ${
                            isMiddle ? 'bg-[#8EB69B] text-[#051F20]' : 'bg-[#235347] text-[#8EB69B]'
                          }`}>
                            {pkg.badge}
                          </span>
                          <div className={`flex items-baseline mb-1 ${isMiddle ? 'text-[#DAF1DE]' : 'text-[#DAF1DE]/90'}`}>
                            <span className={`font-black tracking-tight ${isMiddle ? 'text-5xl' : 'text-3xl'}`}>{priceStr.split(' ')[0]}</span>
                            <span className="text-lg font-bold ml-1 text-[#8EB69B]">eur</span>
                            <span className="text-xs font-semibold text-[#8EB69B] ml-2">/ {pkg.duration} {t.minutes}</span>
                          </div>
                          <p className="text-xs text-[#8EB69B] mt-1">{pkg.desc}</p>
                        </div>
            
                        <div className="p-6 pt-4">
                          <button 
                            type="button" 
                            onClick={() => { setSelectedDuration(pkg.duration); setMassageStep(3); }}
                            className={`w-full rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                              isMiddle 
                                ? 'py-4 bg-[#DAF1DE] text-[#051F20] shadow-lg hover:bg-white hover:shadow-xl hover:-translate-y-0.5' 
                                : 'py-3 bg-transparent border border-[#8EB69B]/50 text-[#DAF1DE] hover:border-[#8EB69B] hover:bg-[#163832]'
                            }`}
                          >
                            {t.selectBtn}
                          </button>
                        </div>
            
                        <div className="border-t border-[#235347] my-2 mx-6"></div>
            
                        <div className="p-6 pt-2 flex-grow">
                          <ul className="space-y-2.5 text-xs text-[#8EB69B]">
                            {pkg.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <span className="w-4 flex-shrink-0 text-center text-[#8EB69B] font-bold">
                                  {featureIcons[feat.icon ?? 'check']}
                                </span>
                                <span className={isMiddle ? 'text-[#DAF1DE]' : 'text-[#DAF1DE]/80'}>{feat.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button 
                type="button" 
                onClick={() => setMassageStep(1)} 
                className="mx-auto flex items-center justify-center px-6 py-3.5 rounded-xl border-2 border-[#8EB69B] text-[#8EB69B] bg-[#8EB69B]/10 font-chillax font-bold text-xs tracking-wider uppercase hover:bg-[#8EB69B] hover:text-[#051F20] transition-all duration-200 shadow-sm"
              >
                {t.backToLevel}
              </button>
            </div>
          )}

          {/* KROK 3: PREPOJENÝ KALENDÁR */}
          {massageStep === 3 && selectedType && selectedDuration && (
            <div className="bg-[#0B2B26] p-6 rounded-3xl border border-[#235347] text-[#DAF1DE] max-w-xl mx-auto">
              <h2 className="text-lg font-bold text-center text-[#DAF1DE] mb-2">{t.step3Title}</h2>
              <div className="p-3 bg-[#163832] rounded-xl text-xs text-center border border-[#235347] text-[#DAF1DE] mb-6">
                {t.selected}: <strong>{selectedType === 'Klasik' ? 'CLASSIC' : 'VIP PREMIUM'} - {selectedDuration} {t.minutes}</strong>
              </div>
          
              {loadingCalendar ? (
                <div className="text-center py-8 text-xs font-semibold text-[#8EB69B]">{t.loading}</div>
              ) : (
                <div className="border border-[#235347] rounded-2xl p-4 bg-[#051F20]/60 mb-6">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <span className="text-base font-bold tracking-tight text-[#DAF1DE]">
                      {t.months[currentMonth]} {currentYear}
                    </span>
                    <div className="flex space-x-2">
                      <button 
                        type="button" 
                        onClick={handlePrevMonth}
                        className="p-1.5 px-3 bg-[#235347] border border-[#235347] rounded-lg text-xs font-bold text-[#DAF1DE] hover:bg-[#8EB69B] hover:text-[#051F20] transition shadow-sm"
                      >
                        ←
                      </button>
                      <button 
                        type="button" 
                        onClick={handleNextMonth}
                        className="p-1.5 px-3 bg-[#235347] border border-[#235347] rounded-lg text-xs font-bold text-[#DAF1DE] hover:bg-[#8EB69B] hover:text-[#051F20] transition shadow-sm"
                      >
                        →
                      </button>
                    </div>
                  </div>
          
                  <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#8EB69B] mb-2 tracking-wider">
                    <div>{t.mon}</div><div>{t.tue}</div><div>{t.wed}</div><div>{t.thu}</div><div>{t.fri}</div><div>{t.sat}</div><div>{t.sun}</div>
                  </div>
          
                  <div className="grid grid-cols-7 gap-1.5">
                    {emptyCells.map((_, idx) => (
                      <div key={`empty-${idx}`} className="p-2"></div>
                    ))}
          
                    {daysArray.map((day) => {
                      const dateKey = getDateKey(currentYear, currentMonth, day);
                      const daySlots = slotsByDate[dateKey] || [];
          
                      const validSlots = daySlots.filter((slot) =>
                        isValidSlotDuration(slot.availableMinutes, selectedDuration)
                      );
                      const hasValidSlots = validSlots.length > 0;
          
                      const dayDiscount = validSlots.reduce(
                        (max, s) => Math.max(max, s.discountPercent || 0),
                        0
                      );
          
                      const isSelectedDay = selectedDateKey === dateKey;
                      const hasDayDiscount = hasValidSlots && dayDiscount > 0;

                      return (
                        <button
                          type="button"
                          key={dateKey}
                          disabled={!hasValidSlots}
                          onClick={() => { setSelectedDateKey(dateKey); setSelectedSlot(null); }}
                          className={`relative aspect-square flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                            hasValidSlots
                              ? hasDayDiscount
                                ? isSelectedDay
                                  ? 'text-white font-bold ring-2 ring-[var(--discount-text-accent)] shadow-[0_0_14px_var(--discount-glow)]'
                                  : 'bg-[#0B2B26] text-[var(--discount-text)] font-bold border border-[var(--discount-border)] shadow-[0_0_10px_var(--discount-glow-soft)] hover:border-[var(--discount-border-hover)] hover:bg-[#0f3330] hover:shadow-[0_0_14px_var(--discount-glow-hover)]'
                                : isSelectedDay
                                  ? 'bg-[#8EB69B] text-[#051F20] font-bold ring-2 ring-[#8EB69B] shadow'
                                  : 'bg-[#163832] text-[#DAF1DE] font-bold hover:bg-[#235347] border border-[#235347] shadow-sm'
                              : 'text-[#235347] bg-[#0B2B26]/50 border border-[#235347]/40 opacity-60 cursor-not-allowed'
                          }`}
                          style={hasDayDiscount && isSelectedDay ? { background: discountTheme.fill } : undefined}
                        >
                          {day}
                          {hasDayDiscount && (
                            <span
                              className="absolute -top-2 -right-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md leading-none min-w-[26px] text-center"
                              style={{ background: discountTheme.fill, color: discountTheme.badgeText }}
                            >
                              -{dayDiscount}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
          
              {selectedDateKey && slotsByDate[selectedDateKey] && (
                <div className="animate-fadeIn space-y-2 mb-6 bg-[#051F20]/60 border border-[#235347] p-4 rounded-xl">
                  <p className="text-xs font-bold text-[#8EB69B]">{t.chooseTime}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {slotsByDate[selectedDateKey].map((slot) => {
                      if (!isValidSlotDuration(slot.availableMinutes, selectedDuration)) {
                        return null;
                      }
          
                      const hasDiscount = slot.discountPercent > 0;
                      const isSelectedSlot = selectedSlot === slot.startIso;

                      return (
                        <button
                          type="button"
                          key={slot.startIso}
                          onClick={() => setSelectedSlot(slot.startIso)}
                          className={`relative p-2.5 text-xs text-center font-bold rounded-lg border transition ${
                            isSelectedSlot
                              ? hasDiscount
                                ? 'text-white border-transparent shadow-[0_0_12px_var(--discount-glow)]'
                                : 'bg-[#8EB69B] text-[#051F20] border-[#8EB69B] shadow'
                              : hasDiscount
                                ? 'bg-[#0B2B26] border-[var(--discount-border)] text-[var(--discount-text)] hover:border-[var(--discount-border-hover)] hover:bg-[#0f3330] shadow-[0_0_8px_var(--discount-glow-soft)] hover:shadow-[0_0_10px_var(--discount-glow-hover)]'
                                : 'bg-[#163832] border-[#235347] text-[#DAF1DE] hover:border-[#8EB69B]'
                          }`}
                          style={isSelectedSlot && hasDiscount ? { background: discountTheme.fill } : undefined}
                        >
                          {slot.formattedTime}
                          {hasDiscount && (
                            <span
                              className="absolute -top-2 -right-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md leading-none min-w-[26px] text-center"
                              style={{ background: discountTheme.fill, color: discountTheme.badgeText }}
                            >
                              -{slot.discountPercent}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
          
              {/* FINÁLNY REZERVAČNÝ FORMULÁR */}
              {selectedSlot && (
                <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4 border-t border-[#235347] mt-4 animate-fadeIn">
                  <h3 className="font-bold text-xs text-[#8EB69B]">{t.contactTitle}</h3>
                  <div
                    className="text-center text-sm font-bold"
                    style={{ color: selectedDiscountPercent > 0 ? discountTheme.textAccent : '#8EB69B' }}
                  >
                    {t.selectedTerm}: <span className="text-[#DAF1DE]">{new Date(selectedSlot).toLocaleDateString('sk-SK')} o {new Date(selectedSlot).toLocaleTimeString('sk-SK', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
          
                  {/* CENOVÝ SÚHRN */}
                  <div className="p-4 rounded-xl border border-[#235347] bg-[#051F20]/60 space-y-3">
                    <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#8EB69B]">{t.summaryTitle}</h3>
          
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm text-[#DAF1DE]">
                        <span>{selectedType === 'Klasik' ? t.klasikTitle : t.vipTitle} · {selectedDuration} {t.minutes}</span>
                        <span className={selectedDiscountPercent > 0 || appliedCodePercent > 0 ? 'line-through text-[#8EB69B]' : 'font-bold'}>
                          {basePrice} €
                        </span>
                      </div>
                      {selectedDiscountPercent > 0 && (
                        <div className="flex justify-between items-center text-sm font-semibold" style={{ color: discountTheme.textAccent }}>
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                              style={{ background: discountTheme.fill, color: discountTheme.badgeText }}
                            >
                              {t.discountBadgeShort}
                            </span>
                            {t.discountApplied} (-{selectedDiscountPercent}%)
                          </span>
                          <span>-{Math.round(basePrice - priceAfterSlotDiscount)} €</span>
                        </div>
                      )}
                    </div>
          
                    {/* ZĽAVOVÝ KÓD */}
                    <div className="pt-2 border-t border-[#235347]">
                      {!appliedCode ? (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#8EB69B]">{t.discountCodeLabel}</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={discountCodeInput}
                              onChange={(e) => {
                                setDiscountCodeInput(e.target.value);
                                if (codeCheckStatus === 'invalid') setCodeCheckStatus('idle');
                              }}
                              placeholder={t.discountCodePlaceholder}
                              className="flex-grow p-2.5 border border-[#235347] rounded-lg text-xs bg-[#0B2B26] focus:outline-none focus:border-[#8EB69B] text-[#DAF1DE] uppercase placeholder:text-[#8EB69B]/70"
                            />
                            <button
                              type="button"
                              onClick={handleApplyDiscountCode}
                              disabled={!discountCodeInput.trim() || codeCheckStatus === 'checking'}
                              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#8EB69B] text-[#051F20] hover:bg-[#DAF1DE] transition disabled:bg-[#235347] disabled:text-[#8EB69B] disabled:cursor-not-allowed"
                            >
                              {t.applyCodeBtn}
                            </button>
                          </div>
                          {codeCheckStatus === 'checking' && (
                            <p className="text-[10px] text-[#8EB69B]">{t.codeCheckingMsg}</p>
                          )}
                          {codeCheckStatus === 'invalid' && (
                            <p className="text-[10px] text-red-400 font-medium">{t.codeInvalidMsg}</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-sm text-emerald-400 font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                              {appliedCode}
                            </span>
                            {t.codeDiscountLabel} (-{appliedCodePercent}%)
                          </span>
                          <span className="flex items-center gap-2">
                            -{Math.round(priceAfterSlotDiscount - finalPrice)} €
                            <button
                              type="button"
                              onClick={handleRemoveDiscountCode}
                              className="text-[10px] underline text-[#8EB69B] hover:text-[#DAF1DE]"
                            >
                              {t.removeCodeBtn}
                            </button>
                          </span>
                        </div>
                      )}
                    </div>
          
                    {(selectedDiscountPercent > 0 || appliedCodePercent > 0) && (
                      <div className="flex justify-between items-center text-base font-extrabold text-[#DAF1DE] pt-2 border-t border-[#235347]">
                        <span>{t.finalPriceLabel}</span>
                        <span>{finalPrice} €</span>
                      </div>
                    )}
                  </div>
          
                  {/* KONTAKTNÁ KARTA — meno + spôsoby kontaktu zlúčené do jedného boxu */}
                  <div className="space-y-3 bg-[#051F20]/60 p-3 rounded-xl border border-[#235347]">
                    <input 
                      type="text" 
                      placeholder={t.name} 
                      required 
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full p-3 border border-[#235347] rounded-xl text-sm bg-[#0B2B26] focus:bg-[#163832] focus:outline-none focus:border-[#8EB69B] text-[#DAF1DE] placeholder:text-[#8EB69B]/70" 
                    />
          
                    <p className="text-[11px] text-[#8EB69B] font-medium">{t.contactNotice}</p>
                    
                    <div className="space-y-1">
                      <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-[#DAF1DE]">
                        <input type="checkbox" checked={activeContacts.phone} onChange={() => handleContactCheckboxChange('phone')} className="rounded border-[#235347] text-[#8EB69B] focus:ring-[#8EB69B]" />
                        <span>{t.phone}</span>
                      </label>
                      {activeContacts.phone && (
                        <div className="flex space-x-2">
                          <select 
                            value={phonePrefix} 
                            onChange={(e) => setPhonePrefix(e.target.value)}
                            className="p-2 border border-[#235347] rounded-lg text-xs bg-[#0B2B26] focus:outline-none text-[#DAF1DE] font-sans"
                          >
                            <option value="+421">🇸🇰 +421</option>
                            <option value="+420">🇨🇿 +420</option>
                          </select>
                          <input 
                            type="tel" 
                            required 
                            placeholder="905 123 456" 
                            value={contactValues.phone} 
                            onChange={(e) => handlePhoneChange(e.target.value)} 
                            className="flex-grow p-2 border border-[#235347] rounded-lg text-xs bg-[#0B2B26] focus:outline-none text-[#DAF1DE] tracking-wider placeholder:text-[#8EB69B]/70" 
                          />
                        </div>
                      )}
                      {activeContacts.phone && contactValues.phone.length > 0 && contactValues.phone.length < 9 && (
                        <p className="text-[10px] text-amber-400 font-medium pl-1">
                          {lang === 'SK' ? 'Zadajte presne 9 číslic' : 'Enter exactly 9 digits'} ({contactValues.phone.length}/9)
                        </p>
                      )}
                    </div>
          
                    <div className="space-y-1 pt-1">
                      <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-[#DAF1DE]">
                        <input type="checkbox" checked={activeContacts.instagram} onChange={() => handleContactCheckboxChange('instagram')} className="rounded border-[#235347] text-[#8EB69B] focus:ring-[#8EB69B]" />
                        <span>{t.instagram}</span>
                      </label>
                      {activeContacts.instagram && (
                        <input type="text" required placeholder="@uzivatel" value={contactValues.instagram} onChange={(e) => handleContactValueChange('instagram', e.target.value)} className="w-full p-2 border border-[#235347] rounded-lg text-xs bg-[#0B2B26] focus:outline-none text-[#DAF1DE] placeholder:text-[#8EB69B]/70" />
                      )}
                    </div>
          
                    <div className="space-y-1 pt-1">
                      <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-[#DAF1DE]">
                        <input type="checkbox" checked={activeContacts.email} onChange={() => handleContactCheckboxChange('email')} className="rounded border-[#235347] text-[#8EB69B] focus:ring-[#8EB69B]" />
                        <span>{t.email}</span>
                      </label>
                      {activeContacts.email && (
                        <input type="email" required placeholder="meno@domena.com" value={contactValues.email} onChange={(e) => handleContactValueChange('email', e.target.value)} className="w-full p-2 border border-[#235347] rounded-lg text-xs bg-[#0B2B26] focus:outline-none text-[#DAF1DE] placeholder:text-[#8EB69B]/70" />
                      )}
                    </div>
                  </div>
          
                  <div className="space-y-1.5 bg-[#051F20]/60 p-3 rounded-xl border border-[#235347]">
                    <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-[#DAF1DE]">
                      <input
                        type="checkbox"
                        checked={wantsNote}
                        onChange={() => setWantsNote((prev) => !prev)}
                        className="rounded border-[#235347] text-[#8EB69B] focus:ring-[#8EB69B]"
                      />
                      <span>{t.noteCheckboxLabel}</span>
                    </label>
                    {wantsNote && (
                      <textarea
                        rows={3}
                        value={customerNote}
                        onChange={(e) => setCustomerNote(e.target.value)}
                        placeholder={t.notePlaceholder}
                        className="w-full p-2.5 border border-[#235347] rounded-lg text-xs bg-[#0B2B26] focus:outline-none text-[#DAF1DE] placeholder:text-[#8EB69B]/70"
                      />
                    )}
                  </div>
          
                  <button 
                    type="submit" 
                    disabled={!isContactValid()}
                    className={`w-full py-3 rounded-xl font-bold transition text-sm shadow-sm ${
                      isContactValid() ? 'bg-[#8EB69B] text-[#051F20] hover:bg-[#DAF1DE] hover:text-[#051F20]' : 'bg-[#235347]/40 text-[#8EB69B] cursor-not-allowed'
                    }`}
                  >
                    {t.bookBtn}
                  </button>
                </form>
              )}
          
              <button 
                type="button" 
                onClick={() => setMassageStep(2)} 
                className="mx-auto mt-6 flex items-center justify-center px-6 py-3.5 rounded-xl border-2 border-[#8EB69B] text-[#8EB69B] bg-[#8EB69B]/10 font-chillax font-bold text-xs tracking-wider uppercase hover:bg-[#8EB69B] hover:text-[#051F20] transition-all duration-200 shadow-sm"
              >
                {t.backToPackages}
              </button>
            </div>
          )}
        </div>
      </main>
      </>
      )}
    </div>
  );
}
