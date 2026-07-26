import { PackagesData } from '@/app/types';

export const translations = {
  SK: {
    massage: 'Masáže',
    massageHoverCta: 'Rezervujte si masáž',
    massageTitle: 'Rezervácia masáže',
    massageSubtitle: 'Exkluzívne privátne masáže. Rezervácia možná len cez voľné sloty.',
    step1: 'Úroveň', step2: 'Balíček', step3: 'Termín',
    step1Title: '1. Krok: Vyberte si úroveň starostlivosti',
    klasikTitle: 'MASÁŽ CLASSIC',
    klasikDesc: 'Dôkladné uvoľnenie svalového napätia, regenerácia tela.',
    vipTitle: 'MASÁŽ VIP PREMIUM',
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
    successTitle: 'Rezervácia bola úspešná!',
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
    mostPopularLabel: 'Najžiadanejší',
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
    vipTitle: 'VIP PREMIUM MASSAGE',
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
    successTitle: 'Booking successful!',
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
    mostPopularLabel: 'Most Popular',
    selectLevelBtn: 'Select this level'
  }
};

export const packagesTranslations: Record<'SK' | 'EN', PackagesData> = {
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