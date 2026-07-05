import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar']
);

const calendar = google.calendar({ version: 'v3', auth });
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID as string;

const FSM_REGEX = /fsm/i;

// 1. ČÍTANIE VOĽNÝCH TERMÍNOV (GET) - bez zmeny
export async function GET() {
  try {
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    return NextResponse.json({ events: response.data.items });
  } catch (error) {
    return NextResponse.json({ error: 'Chyba pri načítaní kalendára' }, { status: 500 });
  }
}

type FsmEvent = {
  id?: string | null;
  summary?: string | null;
  start: Date;
  end: Date;
};

// Podľa toho, ako rezervácia zasahuje do existujúceho "fsm" bloku, ho buď úplne
// vymaže, skráti z jednej strany, alebo rozdelí na dve samostatné časti (pred a po).
async function adjustAvailabilityEvent(ev: FsmEvent, bookingStart: Date, bookingEnd: Date) {
  const evStart = ev.start.getTime();
  const evEnd = ev.end.getTime();
  const bStart = bookingStart.getTime();
  const bEnd = bookingEnd.getTime();

  // Žiadny časový prekryv -> nič sa nemení
  if (bEnd <= evStart || bStart >= evEnd) return;

  // Rezervácia pokrýva celý blok -> vymazať
  if (bStart <= evStart && bEnd >= evEnd) {
    if (ev.id) {
      await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: ev.id }).catch(() => {});
    }
    return;
  }

  const summary = ev.summary || 'FSM';

  // Rezervácia je celá vnútri bloku -> rozdeliť na dve časti (pred a po rezervácii)
  if (bStart > evStart && bEnd < evEnd) {
    if (ev.id) {
      await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: ev.id }).catch(() => {});
    }
    await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary,
        start: { dateTime: ev.start.toISOString() },
        end: { dateTime: bookingStart.toISOString() }
      }
    });
    await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary,
        start: { dateTime: bookingEnd.toISOString() },
        end: { dateTime: ev.end.toISOString() }
      }
    });
    return;
  }

  // Prekryv na začiatku bloku -> posunúť začiatok bloku na koniec rezervácie
  if (bStart <= evStart && bEnd < evEnd && bEnd > evStart) {
    if (ev.id) {
      await calendar.events.patch({
        calendarId: CALENDAR_ID,
        eventId: ev.id,
        requestBody: { start: { dateTime: bookingEnd.toISOString() } }
      }).catch(() => {});
    }
    return;
  }

  // Prekryv na konci bloku -> skrátiť koniec bloku na začiatok rezervácie
  if (bStart > evStart && bStart < evEnd && bEnd >= evEnd) {
    if (ev.id) {
      await calendar.events.patch({
        calendarId: CALENDAR_ID,
        eventId: ev.id,
        requestBody: { end: { dateTime: bookingStart.toISOString() } }
      }).catch(() => {});
    }
    return;
  }
}

// 2. ZÁPIS REZERVÁCIE + INTELIGENTNÁ ÚPRAVA VOĽNÝCH BLOKOV (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      instagram,
      slot,
      duration,
      type,
      basePrice,
      discountPercent,
      discountCode,
      codeDiscountPercent,
      finalPrice,
      customerNote
    } = body;

    if (!slot) {
      return NextResponse.json({ error: 'Chýba vybraný termín' }, { status: 400 });
    }

    // "slot" je presný ISO string (UTC), ktorý frontend vytvoril priamo z reálneho
    // Date objektu (žiadna manuálna manipulácia s časovým pásmom netreba).
    const bookingStart = new Date(slot);
    const bookingEnd = new Date(bookingStart.getTime() + (duration || 60) * 60000);

    // ==========================================
    // 🔥 KROK A: NÁJDENIE A ÚPRAVA VŠETKÝCH "FSM" BLOKOV ZASIAHNUTÝCH REZERVÁCIOU
    // (bežné aj zľavové - každý sa posudzuje samostatne podľa vlastného prekryvu)
    // ==========================================
    try {
      const timeMinFetch = new Date(bookingStart.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const timeMaxFetch = new Date(bookingStart.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const existingEvents = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin: timeMinFetch,
        timeMax: timeMaxFetch,
        singleEvents: true,
      });

      const fsmRelated: FsmEvent[] = (existingEvents.data.items || [])
        .filter(
          (item) =>
            item.summary &&
            FSM_REGEX.test(item.summary) &&
            item.start?.dateTime &&
            item.end?.dateTime
        )
        .map((item) => ({
          id: item.id,
          summary: item.summary,
          start: new Date(item.start!.dateTime as string),
          end: new Date(item.end!.dateTime as string)
        }));

      // Spracované postupne (nie paralelne), aby sa predišlo konfliktom pri viacerých zásahoch naraz
      for (const ev of fsmRelated) {
        await adjustAvailabilityEvent(ev, bookingStart, bookingEnd);
      }
    } catch (adjustError) {
      console.error('Chyba pri úprave voľných blokov:', adjustError);
    }

    // ==========================================
    // 📝 KROK B: ZÁPIS NOVEJ REZERVÁCIE (ZELENÁ FARBA) S KOMPLETNÝMI CENOVÝMI ÚDAJMI
    // ==========================================
    const priceLines: string[] = [];
    priceLines.push(`Pôvodná cena: ${basePrice ?? '-'}€`);
    if (discountPercent && discountPercent > 0) {
      priceLines.push(`Zľava z termínu: -${discountPercent}%`);
    }
    if (discountCode && codeDiscountPercent && codeDiscountPercent > 0) {
      priceLines.push(`Zľavový kód: ${discountCode} (-${codeDiscountPercent}%)`);
    }
    priceLines.push(`Finálna cena: ${finalPrice ?? basePrice ?? '-'}€`);

    const descriptionParts = [
      `Meno: ${name}`,
      `Email: ${email || '-'}`,
      `Tel: ${phone || '-'}`,
      `IG: ${instagram || '-'}`,
      `Balíček: ${type} (${duration} min)`,
      '',
      ...priceLines
    ];

    if (customerNote && String(customerNote).trim()) {
      descriptionParts.push('', `Poznámka klienta: ${String(customerNote).trim()}`);
    }

    const event = {
      summary: `REZERVÁCIA: ${type} - ${name}`,
      description: descriptionParts.join('\n'),
      start: { dateTime: bookingStart.toISOString() },
      end: { dateTime: bookingEnd.toISOString() },
      colorId: '10', // sýtozelená farba v Google Kalendári
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });

    return NextResponse.json({ success: true, event: response.data });
  } catch (error) {
    console.error('Chyba pri kompletnom spracovaní rezervácie:', error);
    return NextResponse.json({ error: 'Chyba pri zápise do kalendára' }, { status: 500 });
  }
}
