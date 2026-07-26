'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'sk' | 'en';

const translations = {
  sk: {
    // Navigácia
    navReservation: 'Rezervácia',
    navLoyaltyCard: 'Vernostná karta',
    navAdmin: 'Admin zóna',
    navLogin: 'Prihlásiť sa',
    navLogout: 'Odhlásiť sa',

    // Auth
    appTitle: 'Vernostný program Masáž+',
    subtitleLogin: 'Prihlás sa do svojho profilu',
    subtitleRegister: 'Vytvor si vernostnú kartičku',
    fullNameLabel: 'Celé meno',
    fullNamePlaceholder: 'Janko Hraško',
    emailLabel: 'E-mail',
    passwordLabel: 'Heslo',
    programChoiceLabel: 'Výber vernostnej karty',
    program10Option: '10 Pečiatok (10. masáž so zľavou 55%)',
    program5Option: '5 Pečiatok (6. masáž so zľavou 25%)',
    loginBtn: 'Prihlásiť sa',
    registerBtn: 'Zaregistrovať sa',
    working: 'Pracujem na tom...',
    toggleToLogin: 'Už máš účet? Prihlás sa',
    toggleToRegister: 'Nemáš ešte kartičku? Zaregistruj sa',
    registrationFailed: 'Registrácia zlyhala.',

    // Profile
    loading: 'Načítavam profil...',
    guest: 'Hosť',
    loyaltyCode: 'Tvoj vernostný kód',
    scanHint: 'Ukáž tento kód personálu pri platbe na načítanie pečiatky.',
    appearanceSettings: 'Nastavenia vzhľadu',
    cardCustomization: 'Prispôsobenie vizuálu karty',
    chooseIcon: 'Vyber si ikonku',
    chooseColor: 'Vyber si farbu',
    language: 'Jazyk',
    darkMode: 'Tmavý režim',
    saveAndClose: 'Uložiť a zavrieť',
    logout: 'Odhlásiť sa',

    // Card
    massageReward: 'Massage Reward',
    loyaltyProgram: 'Vernostný program',
    massages5: '5 masáží',
    massages10: '10 masáží',
    cardHolder: 'Držiteľ karty',
    stamps: 'Pečiatky',
    of: 'z',
    collectStamps: 'Zbieraj pečiatky pri každej návšteve',
    currentDiscountValue: 'Aktuálna hodnota tvojej zľavy:',
    discountEligible: (amount: string) => ` Máš nárok na zľavu vo výške ${amount} € pri ďalšej návšteve!`,
    discountDisclaimer: ' Zľavu je možné využiť výhradne na jednu nasledujúcu masáž podliehajúcu týmto pravidlám:',
    discountRule1: 'Ak je hodnota masáže rovná zľave, odpočíta sa celá suma.',
    discountRule2: 'Ak je hodnota masáže vyššia ako zľava, zvyšnú sumu doplatíš.',
    discountRule3: 'Ak je hodnota masáže nižšia ako zľava, nevyužitý zvyšok zľavy bez náhrady prepadá.',
  },

  en: {
    // Navigácia
    navReservation: 'Reservation',
    navLoyaltyCard: 'Loyalty Card',
    navAdmin: 'Admin Zone',
    navLogin: 'Sign In',
    navLogout: 'Log Out',

    // Auth
    appTitle: 'Loyalty System Massage+',
    subtitleLogin: 'Sign in to your account',
    subtitleRegister: 'Create a new account',
    fullNameLabel: 'Full name',
    fullNamePlaceholder: 'John Smith',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    programChoiceLabel: 'Choose loyalty program',
    program10Option: '10 massages',
    program5Option: '5 massages',
    loginBtn: 'Sign in',
    registerBtn: 'Register',
    working: 'Please wait...',
    toggleToLogin: 'Already have an account? Sign in',
    toggleToRegister: "Don't have an account? Register",
    registrationFailed: 'Registration failed.',

    // Profile
    loading: 'Loading profile...',
    guest: 'Guest',
    loyaltyCode: 'Your loyalty code',
    scanHint: 'Show this code to staff when paying to receive a stamp.',
    appearanceSettings: 'Appearance settings',
    cardCustomization: 'Customize card appearance',
    chooseIcon: 'Choose an icon',
    chooseColor: 'Choose a color',
    language: 'Language',
    darkMode: 'Dark mode',
    saveAndClose: 'Save and close',
    logout: 'Log out',

    // Card
    massageReward: 'Massage Reward',
    loyaltyProgram: 'Loyalty Program',
    massages5: '5 massages',
    massages10: '10 massages',
    cardHolder: 'Card holder',
    stamps: 'Stamps',
    of: 'of',
    collectStamps: 'Collect stamps with every visit',
    currentDiscountValue: 'Current value of your discount:',
    discountEligible: (amount: string) => ` You are eligible for a €${amount} discount on your next visit!`,
    discountDisclaimer: ' The discount can only be applied to your very next massage under the following rules:',
    discountRule1: 'If the massage price matches the discount, the full amount is covered.',
    discountRule2: 'If the massage price is higher than the discount, you pay the remaining balance.',
    discountRule3: 'If the massage price is lower than the discount, any remaining discount amount expires.',
  },
} as const;

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (typeof translations)[Language];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('sk');

  useEffect(() => {
    const stored = localStorage.getItem('language') as Language | null;
    if (stored) {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'sk' ? 'en' : 'sk'));
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        toggleLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage musí byť použité vnútri LanguageProvider');
  }
  return context;
}