'use client';
import { useState } from 'react';

export default function Home() {
  // Globálny stav pre prepínanie identity: 'photo' alebo 'massage'
  const [mode, setMode] = useState<'photo' | 'massage'>('photo');

  // --- STAVY PRE MASÁŽNY FORMULÁR ---
  const [massageStep, setMassageStep] = useState(1);
  const [selectedType, setSelectedType] = useState<'Klasik' | 'VIP' | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [massageClientInfo, setMassageClientInfo] = useState({ name: '', email: '', phone: '' });

  // --- STAVY PRE FOTO FORMULÁR ---
  const [photoInfo, setPhotoInfo] = useState({
    type: 'Portrét',
    environment: 'Interiér',
    description: '',
    name: '',
    email: ''
  });

  // Simatizované voľné sloty z kalendára (tu neskôr napojíme reálne API)
  const availableSlots = [
    "Pondelok 14:00",
    "Streda 10:30",
    "Piatok 16:00"
  ];

  // Cenová mapa pre masáže (Sem si môžeš prepísať svoje reálne ceny!)
  const prices = {
    Klasik: { 30: '25€', 45: '35€', 60: '45€' },
    VIP: { 45: '55€', 60: '70€', 90: '95€' }
  };

  const handleMassageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Rezervácia odoslaná! Masáž: ${selectedType} (${selectedDuration}min), Termín: ${selectedSlot}. Na email ${massageClientInfo.email} príde potvrdenie.`);
    // Tu sa neskôr spustí API volanie na prepojenie s Google kalendárom
  };

  const handlePhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Správa pre fotografa odoslaná! Typ: ${photoInfo.type}, Prostredie: ${photoInfo.environment}. Ozvem sa vám osobne.`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 ease-in-out pb-20 ${
      mode === 'photo' ? 'bg-[#1a1a1a] text-white' : 'bg-[#f9f6f0] text-[#3a3225]'
    }`}>
      
      {/* HEADER S PREPÍNAČOM */}
      <header className={`p-6 max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center border-b transition-colors duration-700 ${
        mode === 'photo' ? 'border-gray-800' : 'border-amber-200'
      }`}>
        <div className="text-xl font-bold tracking-wider uppercase mb-4 sm:mb-0">
          {mode === 'photo' ? '📷 Fotograf' : '💆‍♂️ Exkluzívne Masáže'}
        </div>
        
        <div className="relative bg-opacity-20 bg-gray-500 rounded-full p-1 flex w-64 shadow-inner">
          <button
            onClick={() => setMode('photo')}
            className={`w-1/2 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
              mode === 'photo' ? 'bg-white text-black shadow-md scale-105' : 'text-gray-400'
            }`}
          >
            Fotograf
          </button>
          <button
            onClick={() => setMode('massage')}
            className={`w-1/2 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
              mode === 'massage' ? 'bg-[#8a7355] text-white shadow-md scale-105' : 'text-gray-400'
            }`}
          >
            Masáže
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 mt-10">
        {mode === 'photo' ? (
          /* =======================================
             SEKCIA FOTOGRAF
             ======================================= */
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold mb-2">Zachytenie Vášho Momentu</h1>
              <p className="text-gray-400">Ateliér na byte v Bratislave alebo fotenie v exteriéri podľa dohody.</p>
            </div>

            <form onSubmit={handlePhotoSubmit} className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 space-y-6">
              <h2 className="text-xl font-bold border-b border-neutral-800 pb-2 text-white">Dohodnúť umelecké fotenie</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Typ fotenia</label>
                  <select 
                    value={photoInfo.type}
                    onChange={(e) => setPhotoInfo({...photoInfo, type: e.target.value})}
                    className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white"
                  >
                    <option>Portrét</option>
                    <option>Budoár</option>
                    <option>Umelecká fotografia</option>
                    <option>Párové / Svadobné</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Prostredie</label>
                  <select 
                    value={photoInfo.environment}
                    onChange={(e) => setPhotoInfo({...photoInfo, environment: e.target.value})}
                    className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white"
                  >
                    <option>Interiér (u mňa na byte)</option>
                    <option>Exteriér (podľa dohody)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Vaša predstava a popis</label>
                <textarea 
                  rows={4}
                  placeholder="Popíšte, akú náladu, svetlo alebo príbeh chcete fotografiou zachytiť..."
                  value={photoInfo.description}
                  onChange={(e) => setPhotoInfo({...photoInfo, description: e.target.value})}
                  className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-gray-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
                <input 
                  type="text" placeholder="Vaše meno" required
                  value={photoInfo.name} onChange={(e) => setPhotoInfo({...photoInfo, name: e.target.value})}
                  className="p-3 bg-neutral-800 border border-neutral-700 rounded text-white"
                />
                <input 
                  type="email" placeholder="Váš Email" required
                  value={photoInfo.email} onChange={(e) => setPhotoInfo({...photoInfo, email: e.target.value})}
                  className="p-3 bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <button type="submit" className="w-full bg-white text-black py-3 rounded font-bold hover:bg-gray-200 transition">
                Poslať správu a dohodnúť termín
              </button>
            </form>
          </div>
        ) : (
          /* =======================================
             SEKCIA MASÁŽE (3-KROKOVÝ EXKLUZÍVNY SYSTÉM)
             ======================================= */
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold mb-2 text-[#5c4a37]">Osobný Reset & Uvoľnenie</h1>
              <p className="text-amber-900 bg-amber-100/60 p-3 rounded border border-amber-200 inline-block text-sm">
                📍 Exkluzívne privátne masáže u mňa na byte. Rezervácia možná len cez voľné sloty.
              </p>
            </div>

            {/* Indikátor krokov (Stepper UI) */}
            <div className="flex justify-between max-w-md mx-auto mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border transition ${
                    massageStep === step ? 'bg-[#8a7355] text-white border-[#8a7355]' : 'bg-white text-gray-400 border-gray-200'
                  }`}>
                    {step}
                  </div>
                  <span className={`text-xs font-semibold ${massageStep === step ? 'text-[#8a7355]' : 'text-gray-400'}`}>
                    {step === 1 ? 'Úroveň' : step === 2 ? 'Čas' : 'Termín'}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm text-gray-800">
              
              {/* KROK 1: VÝBER KLASIK / VIP */}
              {massageStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-center text-[#5c4a37]">1. Krok: Vyberte si úroveň starostlivosti</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => { setSelectedType('Klasik'); setSelectedDuration(null); setMassageStep(2); }}
                      className={`p-6 rounded-xl border text-left transition ${selectedType === 'Klasik' ? 'border-[#8a7355] bg-amber-50/30' : 'border-gray-200 hover:border-amber-300'}`}
                    >
                      <h3 className="font-bold text-lg text-[#5c4a37]">Klasik Masáž</h3>
                      <p className="text-xs text-gray-500 mt-1">Dôkladné uvoľnenie svalového napätia, regenerácia tela.</p>
                      <span className="inline-block mt-4 text-xs font-semibold text-[#8a7355]">Možnosti: 30, 45, 60 min</span>
                    </button>

                    <button 
                      onClick={() => { setSelectedType('VIP'); setSelectedDuration(null); setMassageStep(2); }}
                      className={`p-6 rounded-xl border text-left transition ${selectedType === 'VIP' ? 'border-[#8a7355] bg-amber-50/30' : 'border-gray-200 hover:border-amber-300'}`}
                    >
                      <h3 className="font-bold text-lg text-[#5c4a37]">VIP Masáž ✨</h3>
                      <p className="text-xs text-gray-500 mt-1">Exkluzívny rituál vrátane aromaterapie, masáže hlavy a maximálneho pokoja.</p>
                      <span className="inline-block mt-4 text-xs font-semibold text-[#8a7355]">Možnosti: 45, 60, 90 min</span>
                    </button>
                  </div>
                </div>
              )}

              {/* KROK 2: DYNAMICKÝ VÝBER MINÚT */}
              {massageStep === 2 && selectedType && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-center text-[#5c4a37]">2. Krok: Zvoľte si dĺžku trvania ({selectedType})</h2>
                  <div className="flex flex-col space-y-3 max-w-sm mx-auto">
                    {(selectedType === 'Klasik' ? [30, 45, 60] : [45, 60, 90]).map((dur) => (
                      <button
                        key={dur}
                        onClick={() => { setSelectedDuration(dur); setMassageStep(3); }}
                        className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center hover:border-amber-400 transition"
                      >
                        <span className="font-semibold">{dur} minút</span>
                        <span className="text-sm font-bold text-[#8a7355]">
                          {prices[selectedType][dur as keyof (typeof prices)['Klasik' | 'VIP']]}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setMassageStep(1)} className="text-xs text-gray-400 hover:underline block text-center mt-4">
                    ⬅ Späť na výber typu
                  </button>
                </div>
              )}

              {/* KROK 3: EXKLUZÍVNY KALENDÁR A KONTAKT */}
              {massageStep === 3 && selectedType && selectedDuration && (
                <form onSubmit={handleMassageSubmit} className="space-y-6">
                  <h2 className="text-xl font-bold text-center text-[#5c4a37]">3. Krok: Vyberte si exkluzívny voľný termín</h2>
                  
                  <div className="p-4 bg-amber-50/50 rounded-lg text-xs text-amber-900 text-center border border-amber-100">
                    Vybrané: <strong>{selectedType} Masáž na {selectedDuration} minút</strong>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        type="button" key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 text-sm rounded border font-medium transition ${
                          selectedSlot === slot ? 'bg-[#8a7355] text-white border-[#8a7355]' : 'bg-white border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>

                  {selectedSlot && (
                    <div className="space-y-4 pt-4 border-t border-gray-100 animate-fadeIn">
                      <h3 className="font-bold text-sm text-gray-700">Kontaktné údaje pre overenie a zaslanie adresy</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input 
                          type="text" placeholder="Meno a Priezvisko" required
                          value={massageClientInfo.name} onChange={(e) => setMassageClientInfo({...massageClientInfo, name: e.target.value})}
                          className="p-3 border border-gray-200 rounded text-sm bg-gray-50 focus:bg-white"
                        />
                        <input 
                          type="email" placeholder="Email" required
                          value={massageClientInfo.email} onChange={(e) => setMassageClientInfo({...massageClientInfo, email: e.target.value})}
                          className="p-3 border border-gray-200 rounded text-sm bg-gray-50 focus:bg-white"
                        />
                        <input 
                          type="tel" placeholder="Telefón" required
                          value={massageClientInfo.phone} onChange={(e) => setMassageClientInfo({...massageClientInfo, phone: e.target.value})}
                          className="p-3 border border-gray-200 rounded text-sm bg-gray-50 focus:bg-white"
                        />
                      </div>
                      
                      <button type="submit" className="w-full bg-[#8a7355] text-white py-3 rounded-lg font-bold hover:bg-[#725e45] transition">
                        Záväzne rezervovať exkluzívny termín
                      </button>
                    </div>
                  )}

                  <button type="button" onClick={() => setMassageStep(2)} className="text-xs text-gray-400 hover:underline block text-center mx-auto mt-4">
                    ⬅ Späť na výber času
                  </button>
                </form>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
