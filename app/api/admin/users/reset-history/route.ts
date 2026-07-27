import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Chýba ID používateľa' }, { status: 400 });
    }

    // 1. Vymazanie/vynulovanie pečiatok a darčekov
    await Promise.all([
      supabase.from('stamps').delete().eq('user_id', userId),
      supabase.from('gifts').delete().eq('user_id', userId),
      supabase.from('cancellation_requests').delete().eq('user_id', userId),
    ]);

    // 2. Reset stavu referalu na profile
    await supabase
      .from('profiles')
      .update({ referral_discount_status: null })
      .eq('id', userId);

    return NextResponse.json({ 
      success: true, 
      message: 'História používateľa bola úspešne resetovaná (karta je na 0 pečiatkach).' 
    });
  } catch (err: any) {
    console.error('Chyba pri resetovaní histórie:', err);
    return NextResponse.json({ error: err?.message || 'Chyba servera' }, { status: 500 });
  }
}
