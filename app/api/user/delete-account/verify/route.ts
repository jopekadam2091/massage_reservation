import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { userId, code, expiresAt, otpToken } = await req.json();

    if (!userId || !code || !expiresAt || !otpToken) {
      return NextResponse.json({ error: 'Chýbajú povinné údaje pre overenie.' }, { status: 400 });
    }

    // 1. Získanie e-mailu používateľa
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (!profile || !profile.email) {
      return NextResponse.json({ error: 'Profil používateľa nebol nájdený.' }, { status: 404 });
    }

    const cleanEmail = profile.email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    // 2. Kontrola expirácie
    if (Date.now() > Number(expiresAt)) {
      return NextResponse.json({
        error: 'Platnosť overovacieho kódu vypršala. Vyžiadajte si nový kód.',
      }, { status: 400 });
    }

    // 3. Overenie HMAC tokenu
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'zenflow-delete-account-secret-2026';
    const expectedToken = crypto
      .createHmac('sha256', secret)
      .update(`delete:${userId}:${cleanEmail}:${cleanCode}:${expiresAt}`)
      .digest('hex');

    if (otpToken !== expectedToken) {
      return NextResponse.json({
        error: 'Nesprávny overovací kód. Skontrolujte prosím zadané čísla.',
      }, { status: 400 });
    }

    // 4. Trvalé vymazanie všetkých údajov používateľa z databázy
    await supabase.from('cancellation_requests').delete().eq('user_id', userId);
    await supabase.from('gifts').delete().eq('user_id', userId);
    await supabase.from('stamps').delete().eq('user_id', userId);

    try {
      await supabase.from('user_badges').delete().eq('user_id', userId);
    } catch {}

    // 5. Vymazanie profilu
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('Chyba pri mazaní profilu:', profileDeleteError);
      return NextResponse.json({ error: profileDeleteError.message }, { status: 500 });
    }

    // 6. Vymazanie z auth.users
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (authErr) {
        console.warn('Upozornenie pri auth.admin.deleteUser:', authErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Váš účet a všetky súvisiace údaje boli trvalo a nenávratne vymazané.',
    });
  } catch (err: any) {
    console.error('Chyba pri trvalom vymazávaní účtu:', err);
    return NextResponse.json({
      error: err?.message || 'Chyba servera pri vymazávaní účtu.',
    }, { status: 500 });
  }
}
