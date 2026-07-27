import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BadgeRegistry } from '@/app/constants/badges';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Chýba ID používateľa' }, { status: 400 });
    }

    // 1. Načítanie profilu, pečiatok, darčekov a odporúčaní
    let profileData: any = null;
    try {
      const { data: p } = await supabase.from('profiles').select('id, full_name, email, birth_date, created_at').eq('id', userId).maybeSingle();
      profileData = p;
    } catch {
      const { data: p } = await supabase.from('profiles').select('id, full_name, email, created_at').eq('id', userId).maybeSingle();
      profileData = p;
    }

    const [
      { data: stamps },
      { data: gifts },
      { data: referredUsers }
    ] = await Promise.all([
      supabase.from('stamps').select('id, price, created_at, claimed').eq('user_id', userId).is('removed_at', null),
      supabase.from('gifts').select('id, gift_type, custom_code, created_at').eq('user_id', userId),
      supabase.from('profiles').select('id').eq('referred_by', userId),
    ]);

    const allStamps = stamps || [];
    const allGifts = gifts || [];
    const referralCount = (referredUsers || []).length;
    const totalStampsCount = allStamps.length;

    // 2. Extrakcia dátumov a analýza mesiacov
    const dates: Date[] = allStamps.map((s) => new Date(s.created_at));

    // Zoskupenie podľa ROK-MESIAC
    const monthKeys = new Set<string>();
    const monthCounts: Record<string, number> = {};

    dates.forEach((d) => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.add(key);
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });

    // Výpočet súvislých mesiacov (Monthly Zen / Iron Back)
    const sortedMonths = Array.from(monthKeys).sort();
    let maxConsecutiveMonths = sortedMonths.length > 0 ? 1 : 0;
    let currentConsecutive = sortedMonths.length > 0 ? 1 : 0;

    for (let i = 1; i < sortedMonths.length; i++) {
      const [prevY, prevM] = sortedMonths[i - 1].split('-').map(Number);
      const [currY, currM] = sortedMonths[i].split('-').map(Number);

      const diff = (currY - prevY) * 12 + (currM - prevM);
      if (diff === 1) {
        currentConsecutive++;
        if (currentConsecutive > maxConsecutiveMonths) {
          maxConsecutiveMonths = currentConsecutive;
        }
      } else {
        currentConsecutive = 1;
      }
    }

    // Výpočet max masáží v 1 mesiaci (Double Dose)
    const maxInSingleMonth = Object.values(monthCounts).reduce((max, val) => Math.max(max, val), 0);

    // Výpočet časových slotov
    let hasEarlyBird = false;
    let hasNightOwl = false;
    let hasWeekend = false;
    let hasLongSession = false;
    let hasHotTrail = false;
    let hasBirthday = false;

    dates.forEach((d) => {
      const hour = d.getHours();
      const day = d.getDay(); // 0: Nedeľa, 5: Piatok, 6: Sobota

      if (hour < 10) hasEarlyBird = true;
      if (hour >= 18) hasNightOwl = true;
      if (day === 0 || day === 6 || (day === 5 && hour >= 14)) hasWeekend = true;
    });

    // Kontrola narodeninového mesiaca
    if (profileData?.birth_date) {
      const birthMonth = new Date(profileData.birth_date).getMonth();
      const currentMonth = new Date().getMonth();

      if (birthMonth === currentMonth && totalStampsCount >= 1) {
        hasBirthday = true;
      } else {
        // Skontrolujeme, či nejaká absolvovaná masáž bola v narodeninovom mesiaci
        dates.forEach((d) => {
          if (d.getMonth() === birthMonth) hasBirthday = true;
        });
      }
    }

    // Ak má darček VIP upgrade alebo zľavové kódy pre lávové kamene
    if (allGifts.some((g) => g.gift_type === 'vip_upgrade' || g.gift_type === 'discount_code')) {
      hasHotTrail = true;
    }

    // Ak má aspoň 1 masáž, považujeme Explorer za čiastočne rozbehnutý
    const distinctTypesCount = totalStampsCount >= 3 ? 3 : (totalStampsCount >= 1 ? 2 : 0);
    if (totalStampsCount >= 2) hasLongSession = true;
    if (totalStampsCount >= 5) hasHotTrail = true;

    // 3. Vyhodnotenie všetkých 13 odznakov
    const badgeStatuses = BadgeRegistry.BADGES.map((b) => {
      let isUnlocked = false;
      let currentProgress = 0;
      let unlockedAt: string | null = null;

      switch (b.id) {
        case 'collector':
          currentProgress = Math.min(totalStampsCount, 10);
          isUnlocked = totalStampsCount >= 10;
          break;

        case 'grandmaster':
          currentProgress = Math.min(totalStampsCount, 20);
          isUnlocked = totalStampsCount >= 20;
          break;

        case 'wingman':
          currentProgress = Math.min(referralCount, 1);
          isUnlocked = referralCount >= 1;
          break;

        case 'monthly_zen':
          currentProgress = Math.min(maxConsecutiveMonths, 3);
          isUnlocked = maxConsecutiveMonths >= 3;
          break;

        case 'iron_back':
          currentProgress = Math.min(maxConsecutiveMonths, 6);
          isUnlocked = maxConsecutiveMonths >= 6;
          break;

        case 'double_dose':
          currentProgress = Math.min(maxInSingleMonth, 2);
          isUnlocked = maxInSingleMonth >= 2;
          break;

        case 'explorer':
          currentProgress = Math.min(distinctTypesCount, 3);
          isUnlocked = distinctTypesCount >= 3;
          break;

        case 'marathoner':
          currentProgress = hasLongSession ? 1 : 0;
          isUnlocked = hasLongSession;
          break;

        case 'hot_trail':
          currentProgress = hasHotTrail ? 1 : 0;
          isUnlocked = hasHotTrail;
          break;

        case 'early_bird':
          currentProgress = hasEarlyBird ? 1 : 0;
          isUnlocked = hasEarlyBird;
          break;

        case 'night_owl':
          currentProgress = hasNightOwl ? 1 : 0;
          isUnlocked = hasNightOwl;
          break;

        case 'weekend_warrior':
          currentProgress = hasWeekend ? 1 : 0;
          isUnlocked = hasWeekend;
          break;

        case 'birthday_treat':
          currentProgress = hasBirthday ? 1 : (totalStampsCount >= 4 ? 1 : 0);
          isUnlocked = currentProgress >= 1;
          break;

        default:
          break;
      }

      if (isUnlocked && dates.length > 0) {
        unlockedAt = dates[0].toISOString();
      }

      return {
        badge_id: b.id,
        is_unlocked: isUnlocked,
        unlocked_at: unlockedAt,
        current_progress: currentProgress,
        max_progress: b.targetValue,
      };
    });

    return NextResponse.json({
      success: true,
      badges: badgeStatuses,
      totalUnlocked: badgeStatuses.filter((b) => b.is_unlocked).length,
      totalAvailable: badgeStatuses.length,
    });
  } catch (err: any) {
    console.error('Chyba pri vyhodnocovaní odznakov:', err);
    return NextResponse.json({ error: err?.message || 'Chyba servera' }, { status: 500 });
  }
}
