import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const SHEET_ID = process.env.DISCOUNT_SHEET_ID as string;
const SHEET_NAME = 'Mcodes'; // Rovnaký tab ako vo vašom existujúcom /api/discount-code

export async function POST(req: Request) {
  try {
    const { code, percent, usage = 1 } = await req.json();
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!SHEET_ID || !clientEmail || !privateKey) {
      return NextResponse.json(
        { error: 'Chýba konfigurácia pre Google Sheets v .env.local' },
        { status: 500 }
      );
    }

    privateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Formátovanie percenta zľavy (napr. 20 -> "20%")
    const formattedPercent = typeof percent === 'number' ? `${percent}%` : `${percent}`.includes('%') ? percent : `${percent}%`;

    // ZÁPIS PODĽA VAŠEJ EXISTUJÚCEJ SCHÉMY "Mcodes":
    // Stĺpec A: Codename, Stĺpec B: Discount, Stĺpec C: Usage, Stĺpec D: Status
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:D`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          code.toUpperCase().trim(), // Stĺpec A = Codename
          formattedPercent,           // Stĺpec B = Discount ("20%")
          usage,                      // Stĺpec C = Usage (1 = jednorazový darčekový kód)
          'Active'                    // Stĺpec D = Status ("Active")
        ]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Chyba pri zápise nového kódu do Mcodes tabuľky:', error);
    return NextResponse.json(
      { error: error?.message || 'Chyba zápisu do Google Sheet' },
      { status: 500 }
    );
  }
}