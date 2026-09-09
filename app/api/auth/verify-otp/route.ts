import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { email, password, fullName, referralCode, code, expiresAt, otpToken } = await req.json();

    if (!email || !password || !code || !otpToken || !expiresAt) {
      return NextResponse.json({ error: 'Chýbajú povinné údaje pre overenie.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    // 1. Kontrola expirácie
    if (Date.now() > Number(expiresAt)) {
      return NextResponse.json({ 
        error: 'Platnosť overovacieho kódu vypršala. Požiadajte o nový kód.' 
      }, { status: 400 });
    }

    // 2. Overenie HMAC tokenu
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'zenflow-otp-secure-token-secret-2026';
    const expectedToken = crypto
      .createHmac('sha256', secret)
      .update(`${cleanEmail}:${cleanCode}:${expiresAt}`)
      .digest('hex');

    if (otpToken !== expectedToken) {
      return NextResponse.json({ 
        error: 'Nesprávny overovací kód. Skontrolujte prosím zadané čísla.' 
      }, { status: 400 });
    }

    // 3. Vytvorenie používateľa v Supabase cez Admin API (priamy email_confirm: true obíde limity)
    let userId: string | null = null;

    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'Zákazník',
      },
    });

    if (createError) {
      // Ak používateľ už náhodou v Auth existuje (ale v profile nie), pokúsime sa zistiť ID
      console.warn('Upozornenie pri auth.admin.createUser:', createError.message);
      const { data: userList } = await supabase.auth.admin.listUsers();
      const existingUser = userList?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );
      if (existingUser) {
        userId = existingUser.id;
        // Nastavíme heslo a potvrdenie
        await supabase.auth.admin.updateUserById(userId, {
          password: password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });
      } else {
        return NextResponse.json({ 
          error: createError.message || 'Nepodarilo sa vytvoriť používateľský účet.' 
        }, { status: 500 });
      }
    } else {
      userId = createData.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Nepodarilo sa získať ID používateľa.' }, { status: 500 });
    }

    // 4. Vytvorenie / aktualizácia profilu
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: cleanEmail,
        full_name: fullName || 'Zákazník',
        role: 'client',
      });

    if (profileError) {
      console.error('Chyba pri ukladaní profilu:', profileError.message);
    }

    // 5. Spracovanie referral kódu, ak bol zadaný
    if (referralCode && referralCode.trim()) {
      try {
        await supabase.rpc('handle_referral_signup', {
          new_user_id: userId,
          ref_code: referralCode.trim(),
        });
      } catch (refErr) {
        console.error('Chyba spracovania referral kódu:', refErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Účet bol úspešne overený a vytvorený!',
      userId,
    });
  } catch (err: any) {
    console.error('Chyba pri overovaní OTP:', err);
    return NextResponse.json({ 
      error: err?.message || 'Chyba pri overovaní kódu.' 
    }, { status: 500 });
  }
}
