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

    // 1. Vymazanie pridružených dát zo tabuliek
    await supabase.from('cancellation_requests').delete().eq('user_id', userId);
    await supabase.from('gifts').delete().eq('user_id', userId);
    await supabase.from('stamps').delete().eq('user_id', userId);
    
    // 2. Vymazanie profilu
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Chyba pri mazaní profilu:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Pokus o vymazanie z auth.users (ak je nastavený SERVICE_ROLE_KEY)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (authErr) {
        console.warn('Upozornenie: Nepodarilo sa vymazať z auth.users (možno nepodporované):', authErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Používateľ bol úspešne vymazaný z databázy.' });
  } catch (err: any) {
    console.error('Chyba pri mazaní používateľa:', err);
    return NextResponse.json({ error: err?.message || 'Chyba servera' }, { status: 500 });
  }
}
