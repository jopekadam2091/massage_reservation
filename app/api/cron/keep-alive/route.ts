import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// Vynúti dynamické volanie - Next.js nebude odpoveď cachovať
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryKey = searchParams.get('key');
    const authHeader = request.headers.get('authorization');

    // Ak je v .env nastavený CRON_SECRET, overíme ho (buď cez hlavičku Bearer, alebo cez ?key=...)
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret) {
      const isHeaderValid = authHeader === `Bearer ${expectedSecret}`;
      const isQueryValid = queryKey === expectedSecret;

      if (!isHeaderValid && !isQueryValid) {
        return NextResponse.json(
          { error: 'Neautorizovaný prístup (neplatný CRON kľúč)' },
          { status: 401 }
        );
      }
    }

    // Bleskový a úsporný dopyt do Supabase:
    // 'head: true' znamená, že nestiahne žiadne dáta, iba overí spojenie a vráti počet riadkov
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('⚠️ [Keep-Alive Ping] Chyba pri dopyte do databázy:', error);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Chyba pripojenia k Supabase',
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase databáza je aktívna a pripravená.',
      timestamp: new Date().toISOString(),
      activeProfilesCount: count ?? 0,
    });
  } catch (err: any) {
    console.error('⚠️ [Keep-Alive Ping] Neočakávaná chyba:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: err.message || 'Neznáma chyba na serveri',
      },
      { status: 500 }
    );
  }
}
