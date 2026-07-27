import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { userId, count, price } = await req.json();

    if (!userId || !count || count <= 0 || !price || price <= 0) {
      return NextResponse.json({ error: 'Neplatné parametre požiadavky' }, { status: 400 });
    }

    const stampRecords = Array.from({ length: Math.min(count, 10) }, () => ({
      user_id: userId,
      price: parseFloat(price),
      claimed: false,
    }));

    const { data, error } = await supabase
      .from('stamps')
      .insert(stampRecords)
      .select();

    if (error) {
      console.error('Chyba pri hromadnom pridávaní pečiatok:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Úspešne pridaných ${data.length} pečiatok!`,
      stamps: data 
    });
  } catch (err: any) {
    console.error('Chyba servera pri hromadných pečiatkach:', err);
    return NextResponse.json({ error: err?.message || 'Chyba servera' }, { status: 500 });
  }
}
