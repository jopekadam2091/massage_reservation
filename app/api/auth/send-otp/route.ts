import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendOtpVerificationEmail } from '@/app/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { email, fullName } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Zadajte platnú e-mailovú adresu.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Kontrola či používateľ s daným e-mailom už neexistuje
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ 
        error: 'Používateľ s týmto e-mailom už existuje. Prihláste sa prosím.' 
      }, { status: 400 });
    }

    // 2. Vygenerovanie náhodného 6-miestneho kódu (100000 - 999999)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minút platnosť

    // 3. Vytvorenie bezpečného kryptografického HMAC tokenu
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'zenflow-otp-secure-token-secret-2026';
    const otpToken = crypto
      .createHmac('sha256', secret)
      .update(`${cleanEmail}:${code}:${expiresAt}`)
      .digest('hex');

    // 4. Odoslanie e-mailu cez náš Gmail účet (Nodemailer)
    await sendOtpVerificationEmail({
      to: cleanEmail,
      name: fullName || 'Vážený zákazník',
      code: code,
    });

    return NextResponse.json({
      success: true,
      message: 'Overovací kód bol odoslaný na váš e-mail.',
      expiresAt,
      otpToken,
    });
  } catch (err: any) {
    console.error('Chyba pri odosielaní OTP:', err);
    return NextResponse.json({ 
      error: err?.message || 'Nepodarilo sa odoslať overovací e-mail. Skontrolujte nastavenie SMTP.' 
    }, { status: 500 });
  }
}
