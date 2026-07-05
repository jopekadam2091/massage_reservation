// app/api/discount-code/route.ts
//
// Sheet "MassageCodes", tab "Hárok1" (uprav SHEET_NAME nižšie, ak sa tvoj tab volá inak).
// Stĺpce: A = Codename, B = Discount (napr. "50%"), C = Usage (-1 = neobmedzené), D = Status (Active/Inactive)
//
// Potrebné premenné prostredia (.env.local):
//   GOOGLE_CLIENT_EMAIL=...                 (rovnaké ako pre Kalendár)
//   GOOGLE_PRIVATE_KEY=...                  (rovnaké ako pre Kalendár)
//   DISCOUNT_SHEET_ID=11Ypa5Wnq-JwblPW44gZM8y9mUsftnbqF_wdKsNsg414
//
// Service account (rovnaký, aký používaš pre Google Calendar) musí mať na tomto
// Sheete práva "Editor" (Zdieľať -> pridať jeho email), lebo pri použití kódu sa
// do Sheetu aj zapisuje (odpočítanie počtu použití).

import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const SHEET_ID = process.env.DISCOUNT_SHEET_ID as string;
const SHEET_NAME = 'Hárok1'; // uprav, ak sa tvoj tab volá inak
const RANGE = `${SHEET_NAME}!A2:D`; // dáta od riadku 2 (riadok 1 = hlavička)

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get('code') || '').trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ valid: false, reason: 'missing_code' }, { status: 400 });
  }

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE
    });

    const rows = result.data.values || [];

    const rowIndex = rows.findIndex(
      (row) => (row[0] || '').toString().trim().toUpperCase() === code
    );

    if (rowIndex === -1) {
      return NextResponse.json({ valid: false, reason: 'not_found' });
    }

    const row = rows[rowIndex];

    // Discount je vo formáte "50%" -> odstránime % a spravíme číslo
    const percent = parseInt((row[1] || '0').toString().replace('%', '').trim(), 10) || 0;

    // Usage: -1 = neobmedzené, inak počet zostávajúcich použití
    const usageRaw = parseInt((row[2] ?? '0').toString().trim(), 10);
    const isUnlimited = usageRaw === -1;

    const status = (row[3] || '').toString().trim().toLowerCase();

    if (status !== 'active') {
      return NextResponse.json({ valid: false, reason: 'inactive' });
    }

    if (!isUnlimited && (isNaN(usageRaw) || usageRaw <= 0)) {
      return NextResponse.json({ valid: false, reason: 'exhausted' });
    }

    if (percent <= 0) {
      return NextResponse.json({ valid: false, reason: 'invalid_percent' });
    }

    // Ak nie je neobmedzený, odpočítame jedno použitie späť do Sheetu
    if (!isUnlimited) {
      const newUsage = usageRaw - 1;
      const sheetRowNumber = rowIndex + 2; // +2 lebo dáta začínajú na riadku 2
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!C${sheetRowNumber}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[newUsage]] }
      });
    }

    return NextResponse.json({ valid: true, percent });
  } catch (err) {
    console.error('Chyba pri overovaní zľavového kódu:', err);
    return NextResponse.json({ valid: false, reason: 'server_error' }, { status: 500 });
  }
}
