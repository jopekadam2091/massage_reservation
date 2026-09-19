import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendAdminLoginOtpEmail } from '@/app/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Zadajte platnú e-mailovú adresu.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Kontrola či je používateľ admin v profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Tento účet nemá administrátorské oprávnenia.' 
      }, { status: 403 });
    }

    // 2. Vygenerovanie náhodného 6-miestneho kódu
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minút

    // 3. Vytvorenie kryptografického HMAC tokenu
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'zenflow-admin-2fa-token-secret-2026';
    const adminOtpToken = crypto
      .createHmac('sha256', secret)
      .update(`ADMIN_2FA:${cleanEmail}:${code}:${expiresAt}`)
      .digest('hex');

    // 4. Odoslanie e-mailu s 2FA kódom
    await sendAdminLoginOtpEmail({
      to: cleanEmail,
      name: profile.full_name || 'Administrátor',
      code: code,
    });

    return NextResponse.json({
      success: true,
      message: 'Bezpečnostný kód bol odoslaný na váš administrátorský e-mail.',
      expiresAt,
      adminOtpToken,
    });
  } catch (err: any) {
    console.error('Chyba pri odosielaní Admin 2FA OTP:', err);
    return NextResponse.json({ 
      error: err?.message || 'Nepodarilo sa odoslať overovací e-mail administrátora.' 
    }, { status: 500 });
  }
}
