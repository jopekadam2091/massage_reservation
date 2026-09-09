import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendDeleteAccountOtpEmail } from '@/app/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Chýba identifikátor používateľa.' }, { status: 400 });
    }

    // 1. Načítanie profilu používateľa
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr || !profile || !profile.email) {
      return NextResponse.json({ error: 'Používateľský profil nebol nájdený.' }, { status: 404 });
    }

    const cleanEmail = profile.email.toLowerCase().trim();

    // 2. Vygenerovanie 6-miestneho kódu
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minút

    // 3. Vytvorenie HMAC tokenu špeciálne pre vymazanie účtu
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'zenflow-delete-account-secret-2026';
    const otpToken = crypto
      .createHmac('sha256', secret)
      .update(`delete:${userId}:${cleanEmail}:${code}:${expiresAt}`)
      .digest('hex');

    // 4. Odoslanie e-mailu
    await sendDeleteAccountOtpEmail({
      to: cleanEmail,
      name: profile.full_name || 'Vážený klient',
      code: code,
    });

    return NextResponse.json({
      success: true,
      message: 'Overovací kód pre vymazanie účtu bol odoslaný na váš e-mail.',
      expiresAt,
      otpToken,
    });
  } catch (err: any) {
    console.error('Chyba pri odosielaní OTP pre vymazanie účtu:', err);
    return NextResponse.json({
      error: err?.message || 'Nepodarilo sa odoslať overovací kód.',
    }, { status: 500 });
  }
}
