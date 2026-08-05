export interface BadgeDefinition {
  id: string;
  category: 'loyalty' | 'frequency' | 'services' | 'milestones';
  categoryLabel: { sk: string; en: string };
  title: { sk: string; en: string };
  description: { sk: string; en: string };
  iconName: string;
  // 3D Medallion Colors
  unlockedBg: string; // Gradient background for unlocked state
  unlockedBorder: string; // Glossy border for unlocked state
  glowColor: string; // Ambient glow
  lockedBg: string; // Grayscale metallic background
  targetValue: number;
  unit?: { sk: string; en: string };
}

export class BadgeRegistry {
  public static BADGES: BadgeDefinition[] = [
    // 1. Vernosť a komunita
    {
      id: 'collector',
      category: 'loyalty',
      categoryLabel: { sk: 'Vernosť a komunita', en: 'Loyalty & Community' },
      title: { sk: 'Zberateľ', en: 'Collector' },
      description: { 
        sk: 'Získaj 10 pečiatok za absolvované masáže a otvor si prvé ocenenie.', 
        en: 'Collect 10 stamps for completed massages to unlock your first reward.' 
      },
      iconName: 'GiLaurelCrown',
      unlockedBg: 'from-blue-500 via-sky-600 to-indigo-700',
      unlockedBorder: 'border-sky-300/60 shadow-sky-500/40',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 10,
      unit: { sk: 'pečiatok', en: 'stamps' }
    },
    {
      id: 'grandmaster',
      category: 'loyalty',
      categoryLabel: { sk: 'Vernosť a komunita', en: 'Loyalty & Community' },
      title: { sk: 'VIP Zberateľ', en: 'Grandmaster' },
      description: { 
        sk: 'Absolvuj 20 a viac masáží a získaj najvyšší titul VIP Grandmaster.', 
        en: 'Complete 20+ massages to earn the highest VIP Grandmaster status.' 
      },
      iconName: 'GiCrown',
      unlockedBg: 'from-amber-400 via-yellow-500 to-amber-600',
      unlockedBorder: 'border-yellow-200/80 shadow-amber-500/50',
      glowColor: 'rgba(245, 158, 11, 0.5)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 20,
      unit: { sk: 'masáží', en: 'massages' }
    },
    {
      id: 'wingman',
      category: 'loyalty',
      categoryLabel: { sk: 'Vernosť a komunita', en: 'Loyalty & Community' },
      title: { sk: 'Ambasádor', en: 'Wingman' },
      description: { 
        sk: 'Priveď do salónu nového klienta pomocou svojho pozývacieho kódu.', 
        en: 'Refer a new client using your referral code.' 
      },
      iconName: 'GiWingedShield',
      unlockedBg: 'from-purple-500 via-indigo-600 to-purple-800',
      unlockedBorder: 'border-purple-300/60 shadow-purple-500/40',
      glowColor: 'rgba(168, 85, 247, 0.4)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 1,
      unit: { sk: 'odporúčanie', en: 'referral' }
    },

    // 2. Pravidelnosť a konzistencia
    {
      id: 'monthly_zen',
      category: 'frequency',
      categoryLabel: { sk: 'Pravidelnosť', en: 'Regularity' },
      title: { sk: 'Mesačný Zen', en: 'Monthly Zen' },
      description: { 
        sk: 'Absolvuj masáž aspoň raz za mesiac počas 3 mesiacov po sebe.', 
        en: 'Attend at least one massage per month for 3 consecutive months.' 
      },
      iconName: 'GiLotus',
      unlockedBg: 'from-emerald-400 via-teal-500 to-emerald-700',
      unlockedBorder: 'border-emerald-300/60 shadow-emerald-500/40',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 3,
      unit: { sk: 'mesiace', en: 'months' }
    },
    {
      id: 'iron_back',
      category: 'frequency',
      categoryLabel: { sk: 'Pravidelnosť', en: 'Regularity' },
      title: { sk: 'Železný chrbát', en: 'Iron Back' },
      description: { 
        sk: 'Chodievaj pravidelne na masáž každý mesiac počas 6 mesiacov bez vynechania.', 
        en: 'Maintain regular monthly massages for 6 consecutive months.' 
      },
      iconName: 'GiShieldReflect',
      unlockedBg: 'from-slate-600 via-cyan-800 to-slate-900',
      unlockedBorder: 'border-cyan-300/50 shadow-cyan-500/30',
      glowColor: 'rgba(6, 182, 212, 0.3)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 6,
      unit: { sk: 'mesiacov', en: 'months' }
    },
    {
      id: 'double_dose',
      category: 'frequency',
      categoryLabel: { sk: 'Pravidelnosť', en: 'Regularity' },
      title: { sk: 'Dvojitá dávka', en: 'Double Dose' },
      description: { 
        sk: 'Dopraj si dve masáže v priebehu jedného kalendárneho mesiaca.', 
        en: 'Enjoy two massages within a single calendar month.' 
      },
      iconName: 'GiLightningHelix',
      unlockedBg: 'from-orange-500 via-amber-500 to-red-600',
      unlockedBorder: 'border-amber-300/60 shadow-amber-500/40',
      glowColor: 'rgba(249, 115, 22, 0.4)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 2,
      unit: { sk: 'masáže / mesiac', en: 'massages / month' }
    },

    // 3. Skúšanie nových služieb
    {
      id: 'explorer',
      category: 'services',
      categoryLabel: { sk: 'Skúšanie služieb', en: 'Trying Services' },
      title: { sk: 'Objaviteľ', en: 'Explorer' },
      description: { 
        sk: 'Vyskúšaj postupne 3 rôzne druhy masáží z ponuky salónu.', 
        en: 'Try 3 different types of massage procedures from our menu.' 
      },
      iconName: 'GiCompass',
      unlockedBg: 'from-cyan-500 via-teal-600 to-blue-700',
      unlockedBorder: 'border-cyan-300/60 shadow-cyan-500/40',
      glowColor: 'rgba(6, 182, 212, 0.4)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 3,
      unit: { sk: 'druhy masáží', en: 'massage types' }
    },
    {
      id: 'marathoner',
      category: 'services',
      categoryLabel: { sk: 'Skúšanie služieb', en: 'Trying Services' },
      title: { sk: 'Maratónec', en: 'Marathoner' },
      description: { 
        sk: 'Absolvuj extra dlhú procedúru v trvaní 90 minút.', 
        en: 'Complete an extra long session lasting 90 minutes.' 
      },
      iconName: 'GiStopwatch',
      unlockedBg: 'from-rose-500 via-red-600 to-rose-800',
      unlockedBorder: 'border-rose-300/60 shadow-rose-500/40',
      glowColor: 'rgba(244, 63, 94, 0.4)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 1,
      unit: { sk: 'dlhá masáž', en: 'long session' }
    },
    {
      id: 'hot_trail',
      category: 'services',
      categoryLabel: { sk: 'Skúšanie služieb', en: 'Trying Services' },
      title: { sk: 'Horúca stopa', en: 'Hot Trail' },
      description: { 
        sk: 'Vychutnaj si špeciálnu prémiovú procedúru (napr. lávové kamene alebo VIP masáž).', 
        en: 'Enjoy a special premium procedure (e.g. hot stones or VIP massage).' 
      },
      iconName: 'GiFlame',
      unlockedBg: 'from-orange-600 via-red-600 to-amber-600',
      unlockedBorder: 'border-orange-300/60 shadow-orange-500/40',
      glowColor: 'rgba(234, 88, 12, 0.4)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 1,
      unit: { sk: 'prémiová masáž', en: 'premium massage' }
    },

    // 4. Časové míľniky
    {
      id: 'early_bird',
      category: 'milestones',
      categoryLabel: { sk: 'Časové míľniky', en: 'Time Milestones' },
      title: { sk: 'Ranné vtáča', en: 'Early Bird' },
      description: { 
        sk: 'Absolvuj masáž v ranných hodinách (rezervácia so štartom do 10:00).', 
        en: 'Attend a morning massage session (start time before 10:00).' 
      },
      iconName: 'GiSun',
      unlockedBg: 'from-sky-400 via-blue-500 to-indigo-600',
      unlockedBorder: 'border-sky-200/70 shadow-sky-400/40',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 1,
      unit: { sk: 'ranná masáž', en: 'morning session' }
    },
    {
      id: 'night_owl',
      category: 'milestones',
      categoryLabel: { sk: 'Časové míľniky', en: 'Time Milestones' },
      title: { sk: 'Nočná sova', en: 'Night Owl' },
      description: { 
        sk: 'Absolvuj masáž vo večerných hodinách (rezervácia so štartom po 18:00).', 
        en: 'Attend an evening massage session (start time after 18:00).' 
      },
      iconName: 'GiOwl',
      unlockedBg: 'from-indigo-600 via-purple-700 to-slate-900',
      unlockedBorder: 'border-indigo-300/60 shadow-indigo-500/40',
      glowColor: 'rgba(99, 102, 241, 0.4)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 1,
      unit: { sk: 'večerná masáž', en: 'evening session' }
    },
    {
      id: 'weekend_warrior',
      category: 'milestones',
      categoryLabel: { sk: 'Časové míľniky', en: 'Time Milestones' },
      title: { sk: 'Záchranca víkendu', en: 'Weekend Warrior' },
      description: { 
        sk: 'Príď na masáž v piatok poobede alebo počas víkendu.', 
        en: 'Visit the salon on Friday afternoon or over the weekend.' 
      },
      iconName: 'GiPartyFlags',
      unlockedBg: 'from-emerald-500 via-green-600 to-teal-800',
      unlockedBorder: 'border-emerald-300/60 shadow-emerald-500/40',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 1,
      unit: { sk: 'víkendová masáž', en: 'weekend session' }
    },
    {
      id: 'birthday_treat',
      category: 'milestones',
      categoryLabel: { sk: 'Časové míľniky', en: 'Time Milestones' },
      title: { sk: 'Oslávenec', en: 'Birthday Treat' },
      description: { 
        sk: 'Absolvuj masáž v mesiaci svojich narodenín.', 
        en: 'Enjoy a massage during your birthday month.' 
      },
      iconName: 'GiCakeSlice',
      unlockedBg: 'from-pink-500 via-rose-500 to-purple-600',
      unlockedBorder: 'border-pink-300/60 shadow-pink-500/40',
      glowColor: 'rgba(236, 72, 153, 0.4)',
      lockedBg: 'from-slate-700 via-slate-800 to-slate-900',
      targetValue: 1,
      unit: { sk: 'narodeninová masáž', en: 'birthday session' }
    }
  ];
}
