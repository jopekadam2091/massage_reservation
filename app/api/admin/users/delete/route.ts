import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userIds: string[] = Array.isArray(body.userIds) 
      ? body.userIds 
      : body.userId ? [body.userId] : [];

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'Chýba ID používateľa na vymazanie' }, { status: 400 });
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        // 1. Vymazanie pridružených dát zo tabuliek
        try {
          await supabase.from('cancellation_requests').delete().eq('user_id', userId);
        } catch (e) {
          console.warn('Upozornenie pri mazaní cancellation_requests:', e);
        }

        try {
          await supabase.from('gifts').delete().eq('user_id', userId);
        } catch (e) {
          console.warn('Upozornenie pri mazaní gifts:', e);
        }

        try {
          await supabase.from('stamps').delete().eq('user_id', userId);
        } catch (e) {
          console.warn('Upozornenie pri mazaní stamps:', e);
        }

        try {
          await supabase.from('user_badges').delete().eq('user_id', userId);
        } catch (e) {
          console.warn('Upozornenie pri mazaní user_badges:', e);
        }

        try {
          await supabase.from('profiles').update({ referred_by: null }).eq('referred_by', userId);
        } catch (e) {
          console.warn('Upozornenie pri odpojení referred_by:', e);
        }

        try {
          await supabase.from('reviews').update({ user_id: null }).eq('user_id', userId);
        } catch (e) {
          console.warn('Upozornenie pri odpojení reviews:', e);
        }
        
        // 2. Vymazanie profilu
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) {
          console.error(`Chyba pri mazaní profilu ${userId}:`, profileError);
          errors.push(`ID ${userId}: ${profileError.message}`);
          continue;
        }

        // 3. Pokus o vymazanie z auth.users (ak je nastavený SERVICE_ROLE_KEY)
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            await supabase.auth.admin.deleteUser(userId);
          } catch (authErr) {
            console.warn('Upozornenie: Nepodarilo sa vymazať z auth.users:', authErr);
          }
        }

        deletedCount++;
      } catch (errUser: any) {
        errors.push(`ID ${userId}: ${errUser?.message || 'Chyba'}`);
      }
    }

    if (deletedCount === 0 && errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      totalRequested: userIds.length,
      errors: errors.length > 0 ? errors : undefined,
      message: deletedCount === 1
        ? 'Používateľ bol úspešne vymazaný z databázy.'
        : `${deletedCount} používateľov bolo úspešne vymazaných z databázy.`
    });
  } catch (err: any) {
    console.error('Chyba pri mazaní používateľov:', err);
    return NextResponse.json({ error: err?.message || 'Chyba servera' }, { status: 500 });
  }
}
