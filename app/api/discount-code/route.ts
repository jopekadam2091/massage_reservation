// app/api/discount-theme/route.ts
//
// Sheet: rovnaký spreadsheet ako pre zľavové kódy (DISCOUNT_SHEET_ID),
// tab "DiscountColor" (uprav SHEET_NAME nižšie, ak sa tvoj tab volá inak).
//
// Stĺpce (v tomto poradí):
//   A = fill         (plná farba badge/aktívneho stavu; môže byť aj CSS gradient)
//   B = badgeText    (farba textu na 'fill' pozadí)
//   C = border       (orámovanie v pokojnom stave)
//   D = borderHover  (orámovanie pri hover)
//   E = text         (farba textu v outline stave)
//   F = textAccent   (svetlejší text, napr. cenový súhrn)
//   G = glow         (glow pri výbere)
//   H = glowSoft     (glow v pokoji)
//   I = glowHover    (glow pri hover)
//   J = status       (Active/Inactive - použije sa prvý riadok so statusom "active")
//
// Prvý riadok = hlavičky stĺpcov, dáta od riadku 2.
//
// Potrebné premenné prostredia (.env.local) - rovnaké ako pre discount-code:
//   GOOGLE_CLIENT_EMAIL=...
//   GOOGLE_PRIVATE_KEY=...
//   DISCOUNT_SHEET_ID=...
//
// Tento endpoint je len na čítanie, nič sa doň nezapisuje, takže stačí,
// aby mal service account k Sheetu aspoň právo "Viewer".

import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const SHEET_ID = process.env.DISCOUNT_SHEET_ID as string;
const SHEET_NAME = 'DiscountColor'; // uprav, ak sa tvoj tab volá inak
const RANGE = `${SHEET_NAME}!A2:J`; // dáta od riadku 2 (riadok 1 = hlavička)

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets.readonly']
);

const sheets = google.sheets({ version: 'v4', auth });

export async function GET() {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE
    });

    const rows = result.data.values || [];

    const activeRow = rows.find(
      (row) => (row[9] || '').toString().trim().toLowerCase() === 'active'
    );

    if (!activeRow) {
      return NextResponse.json({ found: false });
    }

    const clean = (v: unknown) => (v ?? '').toString().trim();

    const theme = {
      fill: clean(activeRow[0]),
      badgeText: clean(activeRow[1]),
      border: clean(activeRow[2]),
      borderHover: clean(activeRow[3]),
      text: clean(activeRow[4]),
      textAccent: clean(activeRow[5]),
      glow: clean(activeRow[6]),
      glowSoft: clean(activeRow[7]),
      glowHover: clean(activeRow[8])
    };

    // Ak je niektorá bunka prázdna, radšej to nahlásime ako nenájdené,
    // nech frontend použije bezpečný lokálny fallback namiesto polámanej témy.
    const hasEmptyValue = Object.values(theme).some((v) => v === '');
    if (hasEmptyValue) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, theme });
  } catch (err) {
    console.error('Chyba pri načítaní DiscountColor témy:', err);
    return NextResponse.json({ found: false, reason: 'server_error' }, { status: 500 });
  }
}
