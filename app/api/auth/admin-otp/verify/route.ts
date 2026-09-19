import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { email, code, adminOtpToken, expiresAt } = await req.json();

    if (!email || !code || !adminOtpToken || !expiresAt) {
      return NextResponse.json({ error: 'Chýbajú povinné údaje pre overenie.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    // 1. Kontrola expirácie kódu
    if (Date.now() > Number(expiresAt)) {
      return NextResponse.json({ 
        error: 'Platnosť bezpečnostného kódu vypršala. Požiadajte o nový kód.' 
      }, { status: 400 });
    }

    // 2. Overenie HMAC podpisu
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'zenflow-admin-2fa-token-secret-2026';
    const expectedToken = crypto
      .createHmac('sha256', secret)
      .update(`ADMIN_2FA:${cleanEmail}:${cleanCode}:${expiresAt}`)
      .digest('hex');

    if (adminOtpToken !== expectedToken) {
      return NextResponse.json({ 
        error: 'Nesprávny overovací kód. Skontrolujte kód z e-mailu a skúste znova.' 
      }, { status: 400 });
    }

    // 3. Kontrola či je používateľ stále admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Prístup zamietnutý. Účet nemá administrátorské práva.' 
      }, { status: 403 });
    }

    // 4. Vygenerovanie overeného session tokenu pre admin rozhranie
    const verifiedSessionToken = crypto
      .createHmac('sha256', secret)
      .update(`ADMIN_VERIFIED_SESSION:${profile.id}:${Date.now()}`)
      .digest('hex');

    return NextResponse.json({
      success: true,
      message: 'Administrátor bol úspešne overený.',
      verifiedToken: verifiedSessionToken,
      userId: profile.id,
    });
  } catch (err: any) {
    console.error('Chyba pri overovaní Admin 2FA OTP:', err);
    return NextResponse.json({ 
      error: err?.message || 'Nastala neočakávaná chyba pri overovaní.' 
    }, { status: 500 });
  }
}
