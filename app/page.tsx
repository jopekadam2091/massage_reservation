'use client';
import { useState } from 'react';

// Definícia typov pre TypeScript, aby Vercel build nezlyhal
type LangType = 'SK' | 'EN';
type ModeType = 'photo' | 'massage' | null;
type MassageType = 'Klasik' | 'VIP';

export default function Home() {
  const [lang, setLang] = useState<LangType>('SK');
  const [mode, setMode] = useState<ModeType>(null);

  // --- STAVY PRE MASÁŽE ---
  const [massageStep, setMassageStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<MassageType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [massageClientInfo, setMassageClientInfo] = useState({ name: '', email: '', phone: '' });

  // --- STAVY PRE FOTO ---
  const [photoInfo, setPhotoInfo] = useState({
    type: 'Portrét',
    environment: 'Interiér',
    description: '',
    name: '',
    email: ''
  });

  // Kompletné textové preklady pre SK a EN vrátane formulárov
  const translations = {
    SK: {
      photo: 'Photography',
      massage: 'Massage',
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
      step1: 'Úroveň', step2: 'Čas', step3: 'Termín',
      step1Title: '1. Krok: Vyberte si úroveň starostlivosti',
      klasikTitle: 'Klasik Masáž',
      klasikDesc: 'Dôkladné uvoľnenie svalového napätia, regenerácia tela.',
      vipTitle: 'VIP Masáž ✨',
      vipDesc: 'Exkluzívny rituál vrátane aromaterapie, masáže hlavy a maximálneho pokoja.',
      step2Title: '2. Krok: Zvoľte si dĺžku trvania',
      step3Title: '3. Krok: Vyberte si exkluzívny voľný termín',
      selected: 'Vybrané',
      minutes: 'minút',
      back: 'Späť',
      contactTitle: 'Kontaktné údaje pre overenie a zaslanie adresy',
      bookBtn: 'Záväzne rezervovať exkluzívny termín',
      homeBtn: '⬅ Domov',
      phone: 'Telefón',
      email: 'Email'
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
      step1: 'Level', step2: 'Time', step3: 'Date',
      step1Title: '1. Step: Choose your level of care',
      klasikTitle: 'Classic Massage',
      klasikDesc: 'Thorough release of muscle tension, body regeneration.',
      vipTitle: 'VIP Massage ✨',
      vipDesc: 'Exclusive ritual including aromatherapy, head massage and ultimate peace.',
      step2Title: '2. Step: Choose duration',
      step3Title: '3. Step: Choose an exclusive available slot',
      selected: 'Selected',
      minutes: 'minutes',
      back: 'Back',
      contactTitle: 'Contact details for verification and address delivery',
      bookBtn: 'Book exclusive appointment',
      homeBtn: '⬅ Home',
      phone: 'Phone',
      email: 'Email'
    }
  };

  const t = translations[lang];
  
  // Ukážkové sloty, ktoré neskôr nahradíme API z Google Kalendára
  const availableSlots = ["Pondelok 14:00", "Streda 10:30", "Piatok 16:00"];
  
  const prices = {
    Klasik: { 30: '25€', 45: '35€', 60: '45€' },
    VIP: { 45: '55€', 60: '70€', 90: '95€' }
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ease-in-out pb-20 ${
      mode === 'photo' ? 'bg-[#1a1a1a] text-white' : mode === 'massage' ? 'bg-[#f9f6f0] text-[#3a3225]' : 'bg-[#121212] text-white'
    }`}>
      
      {/* JAZYKOVÝ PREPÍNAČ S IKONKAMI VLAJOK (Vždy vpravo hore) */}
      <div className="absolute top-6 right-6 z-50 flex space-x-2 bg-neutral-800 bg-opacity-60 p-1 rounded-full backdrop-blur-sm border border-neutral-700">
        <button 
          type="button" 
          onClick={() => setLang('SK')} 
          className={`px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center space-x-1 ${lang === 'SK' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'}`}
        >
          <span>🇸🇰</span> <span>SK</span>
        </button>
        <button 
          type="button" 
          onClick={() => setLang('EN')} 
          className={`px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center space-x-1 ${lang === 'EN' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'}`}
        >
          <span>🇬🇧</span> <span>EN</span>
        </button>
      </div>

      {/* =======================================
         0. KROK: ÚPLNE PRVÁ MINIMALISTICKÁ STRÁNKA (RÁZCESTIE)
         ======================================= */}
      {mode === null && (
        <div className="flex flex-col md:flex-row h-screen w-full items-center justify-center font-sans">
          {/* Sektor FOTOGRAF */}
          <button 
            type="button"
            onClick={() => setMode('photo')} 
            className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col items-center justify-center group hover:bg-neutral-900 transition-all duration-500 border-b md:border-b-0 md:border-r border-neutral-800"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">👁️</div>
            <span className="text-2xl font-light tracking-widest uppercase">{t.photo}</span>
          </button>

          {/* Sektor MASÁŽE */}
          <button 
            type="button"
            onClick={() => setMode('massage')} 
            className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col items-center justify-center group hover:bg-[#1f1f1f] transition-all duration-500"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">🙌</div>
            <span className="text-2xl font-light tracking-widest uppercase">{t.massage}</span>
          </button>
        </div>
      )}

      {/* =======================================
         VNÚTORNÝ OBSAH (ZOBRAZÍ SE AŽ PO VÝBERE)
         ======================================= */}
      {mode !== null && (
        <>
          {/* Zjednodušená navigácia - iba čisté tlačidlo Domov, žiadne prepínače identít */}
          <header className="p-6 max-w-6xl mx-auto flex justify-between items-center">
            <button 
              type="button" 
              onClick={() => { setMode(null); setMassageStep(1); setSelectedType(null); setSelectedDuration(null); setSelectedSlot(null); }} 
              className={`text-xs uppercase tracking-widest font-bold px-4 py-2 rounded-full border transition ${
                mode === 'photo' ? 'border-neutral-800 hover:bg-white hover:text-black' : 'border-amber-200 hover:bg-[#8a7355] hover:text-white'
              }`}
            >
              {t.homeBtn}
            </button>
            <div className="text-sm font-semibold tracking-wider uppercase opacity-40">
              {mode === 'photo' ? '📷 ' + t.photo : '💆‍♂️ ' + t.massage}
            </div>
          </header>

          <main className="max-w-4xl mx-auto p-6 mt-4">
            {mode === 'photo' ? (
              /* FOTO FORMULÁR */
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h1 className="text-4xl font-extrabold mb-2">{t.photoTitle}</h1>
                  <p className="text-gray-400">{t.photoSubtitle}</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); alert('Brief sent!'); }} className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 space-y-6">
                  <h2 className="text-xl font-bold border-b border-neutral-800 pb-2">{t.photoFormTitle}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">{t.photoType}</label>
                      <select className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none">
                        <option>{t.portrait}</option>
                        <option>{t.boudoir}</option>
                        <option>{t.artPhoto}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">{t.environment}</label>
                      <select className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none">
                        <option>{t.interior}</option>
                        <option>{t.exterior}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">{t.descLabel}</label>
                    <textarea rows={4} placeholder={t.descPlaceholder} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none" required />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
                    <input type="text" placeholder={t.name} required className="p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none" />
                    <input type="email" placeholder={t.email} required className="p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none" />
                  </div>

                  <button type="submit" className="w-full bg-white text-black py-3 rounded font-bold hover:bg-gray-200 transition">{t.send}</button>
                </form>
              </div>
            ) : (
              /* MASÁŽNY STEPPER */
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h1 className="text-4xl font-extrabold mb-2 text-[#5c4a37]">{t.massageTitle}</h1>
                  <p className="text-amber-900 bg-amber-100/60 p-3 rounded border border-amber-200 inline-block text-sm">{t.massageSubtitle}</p>
                </div>

                {/* Stepper UI */}
                <div className="flex justify-between max-w-md mx-auto mb-8">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border transition ${massageStep === step ? 'bg-[#8a7355] text-white' : 'bg-white text-gray-400'}`}>{step}</div>
                      <span className={`text-xs font-semibold ${massageStep === step ? 'text-[#8a7355]' : 'text-gray-400'}`}>{step === 1 ? t.step1 : step === 2 ? t.step2 : t.step3}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm text-gray-800">
                  {/* KROK 1: VÝBER ÚROVNE */}
                  {massageStep === 1 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-center text-[#5c4a37]">{t.step1Title}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button type="button" onClick={() => { setSelectedType('Klasik'); setMassageStep(2); }} className="p-6 rounded-xl border text-left hover:border-amber-300 transition">
                          <h3 className="font-bold text-lg text-[#5c4a37]">{t.klasikTitle}</h3>
                          <p className="text-xs text-gray-500 mt-1">{t.klasikDesc}</p>
                        </button>
                        <button type="button" onClick={() => { setSelectedType('VIP'); setMassageStep(2); }} className="p-6 rounded-xl border text-left hover:border-amber-300 transition">
                          <h3 className="font-bold text-lg text-[#5c4a37]">{t.vipTitle}</h3>
                          <p className="text-xs text-gray-500 mt-1">{t.vipDesc}</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* KROK 2: DĹŽKA TRVANIA */}
                  {massageStep === 2 && selectedType && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-center text-[#5c4a37]">{t.step2Title} ({selectedType})</h2>
                      <div className="flex flex-col space-y-3 max-w-sm mx-auto">
                        {(selectedType === 'Klasik' ? [30, 45, 60] : [45, 60, 90]).map((dur) => (
                          <button type="button" key={dur} onClick={() => { setSelectedDuration(dur); setMassageStep(3); }} className="p-4 bg-gray-50 border rounded-lg flex justify-between items-center hover:border-amber-400 transition">
                            <span className="font-semibold">{dur} {t.minutes}</span>
                            <span className="text-sm font-bold text-[#8a7355]">
                              {selectedType === 'Klasik' 
                                ? prices.Klasik[dur as keyof typeof prices.Klasik] 
                                : prices.VIP[dur as keyof typeof prices.VIP]}
                            </span>
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => setMassageStep(1)} className="text-xs text-gray-400 block text-center mt-4 hover:underline">{t.back}</button>
                    </div>
                  )}

                  {/* KROK 3: TERMÍN A KONTAKT */}
                  {massageStep === 3 && selectedType && selectedDuration && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-center text-[#5c4a37]">{t.step3Title}</h2>
                      <div className="p-3 bg-amber-50 rounded-lg text-xs text-center border border-amber-100 text-[#5c4a37]">
                        {t.selected}: <strong>{selectedType} Masáž - {selectedDuration} {t.minutes}</strong>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {availableSlots.map((slot) => (
                          <button type="button" key={slot} onClick={() => setSelectedSlot(slot)} className={`p-3 text-sm rounded border transition ${selectedSlot === slot ? 'bg-[#8a7355] text-white' : 'bg-white hover:border-amber-300'}`}>{slot}</button>
                        ))}
                      </div>
                      {selectedSlot && (
                        <form onSubmit={(e) => { e.preventDefault(); alert('Reserved!'); }} className="space-y-4 pt-4 border-t border-gray-100">
                          <h3 className="font-bold text-sm text-gray-700">{t.contactTitle}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input type="text" placeholder={t.name} required className="p-3 border rounded text-sm bg-gray-50 focus:bg-white focus:outline-none" />
                            <input type="email" placeholder={t.email} required className="p-3 border rounded text-sm bg-gray-50 focus:bg-white focus:outline-none" />
                            <input type="tel" placeholder={t.phone} required className="p-3 border rounded text-sm bg-gray-50 focus:bg-white focus:outline-none" />
                          </div>
                          <button type="submit" className="w-full bg-[#8a7355] text-white py-3 rounded-lg font-bold hover:bg-[#725e45] transition">{t.bookBtn}</button>
                        </form>
                      )}
                      <button type="button" onClick={() => setMassageStep(2)} className="text-xs text-gray-400 block text-center mt-4 hover:underline">{t.back}</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
