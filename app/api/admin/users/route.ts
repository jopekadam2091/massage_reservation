import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 1. Skúsime načítat profilové dáta vrátane is_banned
    let { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        email, 
        role,
        program_type,
        referral_code,
        referred_by,
        referral_discount_status,
        is_banned
      `)
      .order('full_name', { ascending: true });

    // Ak stĺpec is_banned ešte neexistuje v Supabase DB, skúsime náhradný dotaz bez nemnohého stĺpca
    if (error) {
      console.warn('Upozornenie pri načítaní profilov (skúšam bez is_banned):', error.message);
      const resFallback = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          email, 
          role,
          program_type,
          referral_code,
          referred_by,
          referral_discount_status
        `)
        .order('full_name', { ascending: true });

      if (resFallback.error) {
        console.error('Chyba fallback dotazu profilov:', resFallback.error);
        return NextResponse.json({ error: resFallback.error.message }, { status: 500 });
      }
      profiles = (resFallback.data || []).map((p) => ({ ...p, is_banned: false }));
    }

    if (!profiles) return NextResponse.json({ users: [] });

    // Načítanie stamps
    const { data: stampsData } = await supabase.from('stamps').select('*');
    const stampsByUser: Record<string, any[]> = {};
    if (stampsData) {
      stampsData.forEach((s) => {
        if (!stampsByUser[s.user_id]) stampsByUser[s.user_id] = [];
        stampsByUser[s.user_id].push(s);
      });
    }

    // Načítanie gifts
    const { data: giftsData } = await supabase.from('gifts').select('*');
    const giftsByUser: Record<string, any[]> = {};
    if (giftsData) {
      giftsData.forEach((g) => {
        if (!giftsByUser[g.user_id]) giftsByUser[g.user_id] = [];
        giftsByUser[g.user_id].push(g);
      });
    }

    const formatted = profiles.map((p: any) => ({
      ...p,
      is_banned: !!p.is_banned,
      stamps: stampsByUser[p.id] || [],
      gifts: giftsByUser[p.id] || [],
    }));

    return NextResponse.json({ users: formatted });
  } catch (err: any) {
    console.error('Chyba servera pri načítavaní používateľov:', err);
    return NextResponse.json({ error: err?.message || 'Chyba servera' }, { status: 500 });
  }
}
