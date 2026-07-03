'use client';
import { useState, useEffect } from 'react';

type LangType = 'SK' | 'EN';
type ModeType = 'photo' | 'massage' | null;
type MassageType = 'Klasik' | 'VIP';
type ContactMethod = 'phone' | 'instagram' | 'email';

export default function Home() {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lang, setLang] = useState<LangType>('SK');
  const [mode, setMode] = useState<ModeType>(null);

  // --- STAVY PRE MASÁŽNY STEPPER ---
  const [massageStep, setMassageStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<MassageType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  
  // --- DYNAMICKÝ KALENDÁR A GOOGLE API STAVY ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [slotsByDate, setSlotsByDate] = useState<Record<string, string[]>>({});
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // --- STAVY PRE KONTAKT ---
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
  const [clientName, setClientName] = useState('');

  // --- PREKLADY ---
  const translations = {
    SK: {
      photo: 'Fotografia',
      massage: 'Masáže',
      photoSubtitle: 'Ateliér na byte v Bratislave alebo fotenie v exteriéri podľa dohody.',
      photoTitle: 'Zachytenie Vášho Momentu',
      photoFormTitle: 'Dohodnúť umelecké fotenie',
      photoType: 'Typ fotenia',
      portrait: 'Portrét',
      boudoir: 'Budoár',
      artPhoto: 'Umelecká fotografia',
      environment: 'Prostredie',
      interior: 'Interiér (u mňa na byte)',
      exterior: 'Exteriér (podľa dohody)',
      descPlaceholder: 'Popíšte, akú náladu, svetlo alebo príbeh chcete fotografiou zachytiť...',
      descLabel: 'Vaša predstava a popis',
      name: 'Vaše meno',
      send: 'Poslať správu a dohodnúť termín',
      massageTitle: 'Osobný Reset & Uvoľnenie',
      massageSubtitle: 'Exkluzívne privátne masáže u mňa na byte. Rezervácia možná len cez voľné sloty.',
      step1: 'Úroveň', step2: 'Balíček', step3: 'Termín',
      step1Title: '1. Krok: Vyberte si úroveň starostlivosti',
      klasikTitle: 'MASÁŽ CLASSIC',
      klasikDesc: 'Dôkladné uvoľnenie svalového napätia, regenerácia tela.',
      vipTitle: 'MASÁŽ VIP PREMIUM ✨',
      vipDesc: 'Exkluzívny rituál vrátane aromaterapie, masáže hlavy a maximálneho pokoja.',
      step2Title: '2. Krok: Vyberte si optimálny balíček',
      step3Title: '3. Krok: Vyberte si exkluzívny voľný termín z kalendára',
      selected: 'Vybrané',
      minutes: 'minút',
      back: 'Späť',
      contactTitle: 'Kontaktné údaje pre overenie a zaslanie adresy',
      contactNotice: 'Zvoľte aspoň jeden spôsob kontaktu, kde vás zastihnem:',
      bookBtn: 'Záväzne rezervovať exkluzívny termín',
      homeBtn: '⬅ Domov',
      phone: 'Telefón',
      email: 'Email',
      instagram: 'Instagram',
      selectBtn: 'Vybrať tento balíček',
      months: ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'],
      mon: 'PO', tue: 'UT', wed: 'ST', thu: 'ŠT', fri: 'PI', sat: 'SO', sun: 'NE',
      chooseTime: 'Vyberte si čas na daný deň:',
      loading: 'Načítavam voľné termíny z kalendára...'
    },
    EN: {
      photo: 'Photography',
      massage: 'Massage',
      photoTitle: 'Capturing Your Moment',
      photoSubtitle: 'Studio in an apartment in Bratislava or outdoor shooting by agreement.',
      photoFormTitle: 'Arrange an artistic photoshoot',
      photoType: 'Photoshoot type',
      portrait: 'Portrait',
      boudoir: 'Boudoir',
      artPhoto: 'Artistic photography',
      environment: 'Environment',
      interior: 'Interior (at my apartment)',
      exterior: 'Exterior (by agreement)',
      descPlaceholder: 'Describe what mood, light or story you want to capture...',
      descLabel: 'Your vision and description',
      name: 'Your name',
      send: 'Send message and arrange date',
      massageTitle: 'Personal Reset & Relaxation',
      massageSubtitle: 'Exclusive private massages at my apartment. Booking only via available slots.',
      step1: 'Level', step2: 'Package', step3: 'Date',
      step1Title: '1. Step: Choose your level of care',
      klasikTitle: 'CLASSIC MASSAGE',
      klasikDesc: 'Thorough release of muscle tension, body regeneration.',
      vipTitle: 'VIP PREMIUM MASSAGE ✨',
      vipDesc: 'Exclusive ritual including aromatherapy, head massage and ultimate peace.',
      step2Title: '2. Step: Choose your package',
      step3Title: '3. Step: Choose an exclusive available slot from the calendar',
      selected: 'Selected',
      minutes: 'minutes',
      back: 'Back',
      contactTitle: 'Contact details for verification and address delivery',
      contactNotice: 'Choose at least one contact method to reach you:',
      bookBtn: 'Book exclusive appointment',
      homeBtn: '⬅ Home',
      phone: 'Phone',
      email: 'Email',
      instagram: 'Instagram',
      selectBtn: 'Select this package',
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA', sun: 'SU',
      chooseTime: 'Select time for the chosen day:',
      loading: 'Loading available slots from Google Calendar...'
    }
  };

  const t = translations[lang];

  // --- VÝPOČTY PRE DYNAMICKÝ KALENDÁR ---
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11
  
  // Počet dní v aktuálnom mesiaci
  const daysInMonthCount = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);
  
  // Deň v týždni, ktorým mesiac začína (aby pondelok bol 0 a nedeľa 6)
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const emptyCells = Array.from({ length: firstDayIndex }, (_, i) => i);

  // Pomocná funkcia na vytvorenie kľúča vo formáte RRRR-MM-DD
  const getDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Posun mesiacov
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
            const processedSlots: Record<string, string[]> = {};
            data.events.forEach((event: any) => {
              // Hľadáme udalosti s názvom "FSM" v Google kalendári
              if (event.summary.toLowerCase() === 'fsm' && event.start?.dateTime) {
                const date = new Date(event.start.dateTime);
                const year = date.getFullYear();
                const month = date.getMonth();
                const day = date.getDate();
                const dateKey = getDateKey(year, month, day);
                const time = date.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
                
                if (!processedSlots[dateKey]) {
                  processedSlots[dateKey] = [];
                }
                processedSlots[dateKey].push(time);
              }
            });
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

  const handleContactValueChange = (method: ContactMethod, value: string) => {
    setContactValues(prev => ({ ...prev, [method]: value }));
  };

  // --- FINÁLNE ODOSLANIE REZERVÁCIE ---
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const payload = {
      name: clientName,
      email: contactValues.email,
      phone: contactValues.phone,
      instagram: contactValues.instagram,
      slot: selectedSlot,
      duration: selectedDuration,
      type: selectedType === 'Klasik' ? 'CLASSIC' : 'VIP PREMIUM'
    };

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(lang === 'SK' ? 'Rezervácia bola úspešne zapísaná do Google Kalendára!' : 'Booking successfully added to Google Calendar!');
        setMassageStep(1);
        setSelectedType(null);
        setSelectedDuration(null);
        setSelectedDateKey(null);
        setSelectedSlot(null);
        setClientName('');
        setContactValues({ phone: '', instagram: '', email: '' });
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
    if (activeContacts.phone && !contactValues.phone.trim()) return false;
    if (activeContacts.instagram && !contactValues.instagram.trim()) return false;
    if (activeContacts.email && !contactValues.email.trim()) return false;
    return true;
  };

  const packagesData = {
    Klasik: [
      {
        duration: 30,
        badge: 'Lite',
        desc: 'Vhodný pre rýchlu masáž konkrétnejšej oblasti tela.',
        features: ['Masáž vybranej časti tela', 'Aromaterapia']
      },
      {
        duration: 45,
        badge: 'Supreme',
        desc: 'Vhodný pre rýchly relax celého tela.',
        features: ['Masáž celého tela', 'Možnosť vybrať extra čas na vybranú partiu', 'Aromaterapia']
      },
      {
        duration: 60,
        badge: 'Full Experience',
        desc: 'Dokonalý zážitok s extra časom.',
        features: ['Masáž celého tela', 'Možnosť vybrať extra čas na vybranú partiu', 'Aromaterapia']
      }
    ],
    VIP: [
      {
        duration: 45,
        badge: 'VIP Supreme',
        desc: 'Rýchla ochutnávka VIP procedúr.',
        features: ['Hĺbková masáž panvového dna', 'Masáž rúk', 'Hĺbková masáž gluteálnej oblasti', 'Aromaterapia']
      },
      {
        duration: 60,
        badge: 'VIP Pro',
        desc: 'Kompletný prémium senzuálny rituál v plnom rozsahu.',
        features: ['Hĺbková masáž panvového dna', 'Masáž rúk a dlaní', 'Terapeutická masáž prostaty', 'Hĺbková masáž gluteálnej oblasti', 'Aplikácia špeciálnych intímnych olejov', 'Aromaterapia', 'Dynamická perkusívna terapia (vibračná pištoľ)']
      },
      {
        duration: 90,
        badge: 'VIP Max',
        desc: 'Pro zážitok vytiahnutý na maximum, pre pôžitkárov.',
        features: ['Maximálne uvoľnenie', 'Drink v cene', 'Plus darček', 'Hĺbková masáž panvového dna', 'Masáž rúk a dlaní', 'Terapeutická masáž prostaty', 'Hĺbková masáž gluteálnej oblasti', 'Aplikácia špeciálnych intímnych olejov', 'Aromaterapia', 'Dynamická perkusívna terapia']
      }
    ]
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ease-in-out pb-20 ${
      mode === 'photo' ? 'bg-[#1a1a1a] text-white font-figtree' : mode === 'massage' ? 'bg-[#f9f6f0] text-[#3a3225] font-chillax' : 'bg-[#121212] text-white'
    }`}>
      
      {/* JAZYKOVÝ PREPÍNAČ */}
      <div className="absolute top-6 right-6 z-50 flex space-x-2 bg-neutral-800 bg-opacity-60 p-1 rounded-full backdrop-blur-sm border border-neutral-700 font-sans">
        <button type="button" onClick={() => setLang('SK')} className={`px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center space-x-1 ${lang === 'SK' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'}`}>
          <span>🇸🇰</span> <span>SK</span>
        </button>
        <button type="button" onClick={() => setLang('EN')} className={`px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center space-x-1 ${lang === 'EN' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'}`}>
          <span>🇬🇧</span> <span>EN</span>
        </button>
      </div>

      {/* RÁZCESTIE */}
      {mode === null && (
        <div className="flex flex-col h-screen w-full items-center justify-center">
          <button type="button" onClick={() => setMode('photo')} className="w-full h-1/2 flex flex-col items-center justify-center group hover:bg-neutral-900 transition-all duration-500 border-b border-neutral-800 font-figtree">
            <div className="text-5xl mb-2 group-hover:scale-110 transition-transform duration-300">👁️</div>
            <span className="text-xl font-light tracking-widest uppercase">{t.photo}</span>
          </button>
          <button type="button" onClick={() => setMode('massage')} className="w-full h-1/2 flex flex-col items-center justify-center group hover:bg-[#1f1f1f] transition-all duration-500 font-chillax">
            <div className="text-5xl mb-2 group-hover:scale-110 transition-transform duration-300">🙌</div>
            <span className="text-xl font-light tracking-widest uppercase">{t.massage}</span>
          </button>
        </div>
      )}

      {/* OBSAH A KROKY */}
      {mode !== null && (
        <>
          <header className="p-6 max-w-4xl mx-auto flex justify-between items-center">
            <button type="button" onClick={() => { setMode(null); setMassageStep(1); setSelectedType(null); setSelectedDuration(null); setSelectedDateKey(null); setSelectedSlot(null); }} className="text-xs uppercase tracking-widest font-bold px-4 py-2 rounded-full border transition border-current opacity-80 hover:opacity-100">
              {t.homeBtn}
            </button>
            <div className="text-sm font-semibold tracking-wider uppercase opacity-40">
              {mode === 'photo' ? '📷 ' + t.photo : '💆‍♂️ ' + t.massage}
            </div>
          </header>

          <main className="max-w-4xl mx-auto p-6 mt-4">
            {mode === 'photo' ? (
              <div className="max-w-xl mx-auto space-y-8 animate-fadeIn">
                <div>
                  <h1 className="text-3xl font-extrabold mb-2">{t.photoTitle}</h1>
                  <p className="text-gray-400 text-sm">{t.photoSubtitle}</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); alert('Brief sent!'); }} className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 space-y-6">
                  <h2 className="text-lg font-bold border-b border-neutral-800 pb-2">{t.photoFormTitle}</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">{t.photoType}</label>
                      <select className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none"><option>{t.portrait}</option><option>{t.boudoir}</option><option>{t.artPhoto}</option></select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">{t.environment}</label>
                      <select className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none"><option>{t.interior}</option><option>{t.exterior}</option></select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">{t.descLabel}</label>
                    <textarea rows={4} placeholder={t.descPlaceholder} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none" required />
                  </div>
                  <div className="space-y-4 pt-4 border-t border-neutral-800">
                    <input type="text" placeholder={t.name} required className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none" />
                    <input type="email" placeholder={t.email} required className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none" />
                  </div>
                  <button type="submit" className="w-full bg-white text-black py-3 rounded font-bold hover:bg-gray-200 transition">{t.send}</button>
                </form>
              </div>
            ) : (
              <div className="space-y-8 animate-fadeIn">
                <div className="max-w-xl mx-auto">
                  <h1 className="text-3xl font-extrabold mb-2 text-[#5c4a37]">{t.massageTitle}</h1>
                  <p className="text-amber-900 bg-amber-100/60 p-3 rounded border border-amber-200 block text-sm">{t.massageSubtitle}</p>
                </div>

                <div className="flex justify-between max-w-xs mx-auto mb-8">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center space-x-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition ${massageStep === step ? 'bg-[#8a7355] text-white' : 'bg-white text-gray-400'}`}>{step}</div>
                      <span className={`text-[10px] font-semibold ${massageStep === step ? 'text-[#8a7355]' : 'text-gray-400'}`}>{step === 1 ? t.step1 : step === 2 ? t.step2 : t.step3}</span>
                    </div>
                  ))}
                </div>

                {/* KROK 1 */}
                {massageStep === 1 && (
                  <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm text-gray-800 max-w-xl mx-auto">
                    <h2 className="text-lg font-bold text-center text-[#5c4a37] mb-4">{t.step1Title}</h2>
                    <div className="flex flex-col space-y-3">
                      <button type="button" onClick={() => { setSelectedType('Klasik'); setMassageStep(2); }} className="p-5 rounded-xl border text-left hover:border-amber-300 transition bg-gray-50/50">
                        <h3 className="font-bold text-base text-[#5c4a37]">{t.klasikTitle}</h3>
                        <p className="text-xs text-gray-500 mt-1">{t.klasikDesc}</p>
                      </button>
                      <button type="button" onClick={() => { setSelectedType('VIP'); setMassageStep(2); }} className="p-5 rounded-xl border text-left hover:border-amber-300 transition bg-gray-50/50">
                        <h3 className="font-bold text-base text-[#5c4a37]">{t.vipTitle}</h3>
                        <p className="text-xs text-gray-500 mt-1">{t.vipDesc}</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* KROK 2 */}
                {massageStep === 2 && selectedType && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center text-[#5c4a37]">{t.step2Title} ({selectedType === 'Klasik' ? t.klasikTitle : t.vipTitle})</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                      {packagesData[selectedType].map((pkg) => {
                        const priceStr = selectedType === 'Klasik' 
                          ? prices.Klasik[pkg.duration as 30 | 45 | 60] 
                          : prices.VIP[pkg.duration as 45 | 60 | 90];
                        
                        const isMiddle = pkg.badge === 'Supreme' || pkg.badge === 'VIP Pro';

                        return (
                          <div key={pkg.duration} className={`flex flex-col bg-white rounded-3xl border shadow-sm transition-all overflow-hidden ${
                            isMiddle ? 'border-amber-300 ring-2 ring-amber-200/50 bg-gradient-to-b from-amber-50/30 to-white' : 'border-gray-100'
                          }`}>
                            <div className="p-6 pb-0 flex flex-col items-start">
                              <span className="px-3 py-1 bg-gray-100 text-[11px] font-bold tracking-wider uppercase rounded-full text-gray-600 mb-4">
                                {pkg.badge}
                              </span>
                              <div className="flex items-baseline text-gray-900 mb-1">
                                <span className="text-4xl font-black tracking-tight">{priceStr.split(' ')[0]}</span>
                                <span className="text-lg font-bold ml-1 text-gray-500">eur</span>
                                <span className="text-xs font-semibold text-gray-400 ml-2">/ {pkg.duration} {t.minutes}</span>
                              </div>
                              <p className="text-xs text-gray-500 min-h-[32px] mt-1">{pkg.desc}</p>
                            </div>

                            <div className="p-6 pt-4">
                              <button 
                                type="button" 
                                onClick={() => { setSelectedDuration(pkg.duration); setMassageStep(3); }}
                                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-300 ${
                                  isMiddle 
                                    ? 'bg-[#3a3225] text-white hover:bg-[#5c4a37]' 
                                    : 'bg-gray-900 text-white hover:bg-black'
                                }`}
                              >
                                {t.selectBtn}
                              </button>
                            </div>

                            <div className="border-t border-gray-100 my-2 mx-6"></div>

                            <div className="p-6 pt-2 flex-grow">
                              <ul className="space-y-2.5 text-xs text-gray-600">
                                {pkg.features.map((feat, idx) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <span className="text-emerald-500 font-bold flex-shrink-0">✓</span>
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <button type="button" onClick={() => setMassageStep(1)} className="text-xs text-gray-400 block text-center mt-4 hover:underline mx-auto">{t.back}</button>
                  </div>
                )}

                {/* KROK 3: PREPOJENÝ KALENDÁR */}
                {massageStep === 3 && selectedType && selectedDuration && (
                  <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm text-gray-800 max-w-xl mx-auto">
                    <h2 className="text-lg font-bold text-center text-[#5c4a37] mb-2">{t.step3Title}</h2>
                    <div className="p-3 bg-amber-50 rounded-xl text-xs text-center border border-amber-100 text-[#5c4a37] mb-6">
                      {t.selected}: <strong>{selectedType === 'Klasik' ? 'CLASSIC' : 'VIP PREMIUM'} - {selectedDuration} {t.minutes}</strong>
                    </div>

                    {loadingCalendar ? (
                      <div className="text-center py-8 text-xs font-semibold text-gray-500">{t.loading}</div>
                    ) : (
                      <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 mb-6">
                        {/* HLAVIČKA KALENDÁRA S PREPÍNANÍM MESIACOV */}
                        <div className="flex justify-between items-center mb-4 px-2">
                          <span className="text-base font-bold tracking-tight text-gray-800">
                            {t.months[currentMonth]} {currentYear}
                          </span>
                          <div className="flex space-x-2">
                            <button 
                              type="button" 
                              onClick={handlePrevMonth}
                              className="p-1.5 px-3 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition shadow-sm"
                            >
                              ←
                            </button>
                            <button 
                              type="button" 
                              onClick={handleNextMonth}
                              className="p-1.5 px-3 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition shadow-sm"
                            >
                              →
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-2 tracking-wider">
                          <div>{t.mon}</div><div>{t.tue}</div><div>{t.wed}</div><div>{t.thu}</div><div>{t.fri}</div><div>{t.sat}</div><div>{t.sun}</div>
                        </div>

                        <div className="grid grid-cols-7 gap-1.5">
                          {/* Prázdne bunky pred začiatkom mesiaca */}
                          {emptyCells.map((_, idx) => (
                            <div key={`empty-${idx}`} className="p-2"></div>
                          ))}

                          {/* Reálne dni mesiaca */}
                          {daysArray.map((day) => {
                            const dateKey = getDateKey(currentYear, currentMonth, day);
                            const hasSlots = !!slotsByDate[dateKey] && slotsByDate[dateKey].length > 0;
                            const isCurrentSelected = selectedDateKey === dateKey;

                            return (
                              <button
                                type="button"
                                key={dateKey}
                                disabled={!hasSlots}
                                onClick={() => { setSelectedDateKey(dateKey); setSelectedSlot(null); }}
                                className={`aspect-square flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                                  hasSlots 
                                    ? isCurrentSelected
                                      ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-300 shadow'
                                      : 'bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200 border border-emerald-300/40 shadow-sm'
                                    : 'text-gray-400 bg-white border border-gray-100 opacity-60 cursor-not-allowed'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ZOBRAZENIE HODÍN PRE VYBRANÝ DEŇ */}
                    {selectedDateKey && slotsByDate[selectedDateKey] && (
                      <div className="animate-fadeIn space-y-2 mb-6 bg-emerald-50/40 border border-emerald-100 p-4 rounded-xl">
                        <p className="text-xs font-bold text-emerald-900">{t.chooseTime}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {slotsByDate[selectedDateKey].map((slotTime) => {
                            const slotIdentifier = `${selectedDateKey}T${slotTime}:00`;
                            return (
                              <button
                                type="button"
                                key={slotTime}
                                onClick={() => setSelectedSlot(slotIdentifier)}
                                className={`p-2.5 text-xs text-center font-bold rounded-lg border transition ${
                                  selectedSlot === slotIdentifier
                                    ? 'bg-[#8a7355] text-white border-[#8a7355] shadow'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-amber-300'
                                }`}
                              >
                                {slotTime}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* FINÁLNY REZERVAČNÝ FORMULÁR */}
                    {selectedSlot && (
                      <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4 border-t border-gray-100 mt-4 animate-fadeIn">
                        <h3 className="font-bold text-xs text-gray-700">{t.contactTitle}</h3>
                        <div className="p-3 bg-emerald-600 text-white font-bold rounded-xl text-xs text-center shadow-sm">
                          {t.selected} termín: {new Date(selectedSlot).toLocaleDateString('sk-SK')} o {new Date(selectedSlot).toLocaleTimeString('sk-SK', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <input 
                            type="text" 
                            placeholder={t.name} 
                            required 
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="p-3 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none" 
                          />
                        </div>

                        <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <p className="text-[11px] text-gray-500 font-medium">{t.contactNotice}</p>
                          
                          <div className="space-y-1">
                            <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                              <input type="checkbox" checked={activeContacts.phone} onChange={() => handleContactCheckboxChange('phone')} className="rounded border-gray-300 text-[#8a7355] focus:ring-[#8a7355]" />
                              <span>{t.phone}</span>
                            </label>
                            {activeContacts.phone && (
                              <input type="tel" required placeholder="+421 ..." value={contactValues.phone} onChange={(e) => handleContactValueChange('phone', e.target.value)} className="w-full p-2 border rounded-lg text-xs bg-white focus:outline-none" />
                            )}
                          </div>

                          <div className="space-y-1 pt-1">
                            <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                              <input type="checkbox" checked={activeContacts.instagram} onChange={() => handleContactCheckboxChange('instagram')} className="rounded border-gray-300 text-[#8a7355] focus:ring-[#8a7355]" />
                              <span>{t.instagram}</span>
                            </label>
                            {activeContacts.instagram && (
                              <input type="text" required placeholder="@uzivatel" value={contactValues.instagram} onChange={(e) => handleContactValueChange('instagram', e.target.value)} className="w-full p-2 border rounded-lg text-xs bg-white focus:outline-none" />
                            )}
                          </div>

                          <div className="space-y-1 pt-1">
                            <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                              <input type="checkbox" checked={activeContacts.email} onChange={() => handleContactCheckboxChange('email')} className="rounded border-gray-300 text-[#8a7355] focus:ring-[#8a7355]" />
                              <span>{t.email}</span>
                            </label>
                            {activeContacts.email && (
                              <input type="email" required placeholder="meno@domena.com" value={contactValues.email} onChange={(e) => handleContactValueChange('email', e.target.value)} className="w-full p-2 border rounded-lg text-xs bg-white focus:outline-none" />
                            )}
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          disabled={!isContactValid()}
                          className={`w-full py-3 rounded-xl font-bold transition text-sm shadow-sm ${
                            isContactValid() ? 'bg-[#8a7355] text-white hover:bg-[#725e45]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {t.bookBtn}
                        </button>
                      </form>
                    )}
                    <button type="button" onClick={() => setMassageStep(2)} className="text-xs text-gray-400 block text-center mt-4 hover:underline">{t.back}</button>
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
