import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const SHEET_ID = process.env.DISCOUNT_SHEET_ID as string;
const SHEET_NAME = 'Mcodes';

// 🎲 Bezpečný generátor náhodných kódov (32 znakov bez mätúcich 0/O, 1/I)
function generateUnguessableWheelCode(prefix: string = 'KOLO10'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars[randomIndex];
  }
  return `${prefix}-${randomPart}`;
}

// 📊 Automatický zápis vygenerovaného zľavového kódu do Google Sheets (Mcodes)
async function writeDiscountToGoogleSheets(code: string, percent: string = '10%') {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!SHEET_ID || !clientEmail || !privateKey) {
    console.warn('Google Sheets konfigurácia nie je kompletná, kód nebol zapísaný do tabuľky.');
    return false;
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Stĺpec A: Codename, Stĺpec B: Discount ("10%"), Stĺpec C: Usage (1), Stĺpec D: Status ("Active")
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:D`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        code.toUpperCase().trim(),
        percent,
        1, // 1 použitie (jednorazový zľavový kód)
        'Active',
      ]],
    },
  });

  return true;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, giftType, customCode, stampPrice, discountPercent } = body;

    // 🔄 Testovací vývojársky reset výhier
    if (action === 'reset') {
      if (userId) {
        await supabase
          .from('gifts')
          .delete()
          .eq('user_id', userId)
          .or('custom_code.ilike.KOLO%,custom_code.ilike.DARCEK%,custom_code.in.(KOLO5EUR,KOLO10PCT,VIP-UPGRADE)');

        await supabase
          .from('stamps')
          .delete()
          .eq('user_id', userId)
          .eq('price', 40)
          .eq('claimed', false);
      }

      return NextResponse.json({ success: true, message: 'Výhry z kolesa boli resetované' });
    }

    // 1. Zápis pečiatky (free_stamp)
    if (giftType === 'free_stamp') {
      if (!userId) {
        return NextResponse.json({ error: 'Chýba identifikátor používateľa (userId)' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('stamps')
        .insert({
          user_id: userId,
          price: stampPrice || 40,
          claimed: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Chyba pri ukladaní pečiatky z kolesa:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, stamp: data });
    }

    // 2. Zápis benefitu (zľavový kód / darček k masáži) do Google Sheets a databázy (gifts)
    if (giftType && giftType !== 'no_win') {
      let codePrefix = 'KOLO10';
      let sheetDiscount = discountPercent || '10%';

      if (discountPercent === '5%') codePrefix = 'KOLO5';
      else if (discountPercent === '10%') codePrefix = 'KOLO10';
      else if (discountPercent === '15%') codePrefix = 'KOLO15';
      else if (giftType === 'next_visit_gift') {
        codePrefix = 'DARCEK';
        sheetDiscount = 'Darček k masáži';
      }

      const finalCode = (customCode && customCode !== 'KOLO10PCT')
        ? customCode.toUpperCase().trim()
        : generateUnguessableWheelCode(codePrefix);

      // Automatický zápis zľavového kódu do Google Sheets
      if (giftType === 'discount_code' || giftType === 'next_visit_gift') {
        try {
          await writeDiscountToGoogleSheets(finalCode, sheetDiscount);
          console.log(`[WHEEL] Kód ${finalCode} (${sheetDiscount}) bol úspešne zapísaný do Google Sheets (Mcodes).`);
        } catch (sheetErr) {
          console.error('Chyba pri zápise kolesového kódu do Google Sheets:', sheetErr);
        }
      }

      // Ak je používateľ prihlásený, zapíšeme benefit do profilu (tabuľka gifts)
      let giftData = null;
      if (userId) {
        const { data, error } = await supabase
          .from('gifts')
          .insert({
            user_id: userId,
            gift_type: giftType,
            custom_code: finalCode,
            used: false,
          })
          .select()
          .single();

        if (error) {
          console.error('Chyba pri ukladaní benefitu z kolesa do gifts:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        giftData = data;
      }

      return NextResponse.json({
        success: true,
        code: finalCode,
        gift: giftData,
      });
    }

    return NextResponse.json({ success: true, message: 'Bez výhry' });
  } catch (err: any) {
    console.error('Serverová chyba pri spracovaní výhry z kolesa:', err);
    return NextResponse.json({ error: err?.message || 'Serverová chyba' }, { status: 500 });
  }
}
