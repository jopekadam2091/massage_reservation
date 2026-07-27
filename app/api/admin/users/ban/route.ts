import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { userId, isBanned } = await req.json();

    if (!userId || typeof isBanned !== 'boolean') {
      return NextResponse.json({ error: 'Neplatné parametre požiadavky' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: isBanned })
      .eq('id', userId);

    if (error) {
      console.error('Chyba pri zmene ban statusu:', error);
      if (error.message.includes('is_banned')) {
        return NextResponse.json({ 
          error: 'V databáze Supabase v tabuľke "profiles" je potrebné vytvoriť stĺpec "is_banned" (typ boolean, výchozia hodnota false).' 
        }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      isBanned,
      message: isBanned 
        ? 'Používateľ bol úspešne zabanovaný.' 
        : 'Používateľ bol odblokovaný.' 
    });
  } catch (err: any) {
    console.error('Chyba servera pri banovaní používateľa:', err);
    return NextResponse.json({ error: err?.message || 'Chyba servera' }, { status: 500 });
  }
}
