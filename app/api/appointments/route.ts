import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBookingConfirmationEmail } from '@/app/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar']
);

const calendar = google.calendar({ version: 'v3', auth });
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID as string;

const FSM_REGEX = /fsm/i;

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

async function adjustAvailabilityEvent(ev: FsmEvent, bookingStart: Date, bookingEnd: Date) {
  const evStart = ev.start.getTime();
  const evEnd = ev.end.getTime();
  const bStart = bookingStart.getTime();
  const bEnd = bookingEnd.getTime();

  if (bEnd <= evStart || bStart >= evEnd) return;

  if (bStart <= evStart && bEnd >= evEnd) {
    if (ev.id) {
      await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: ev.id }).catch(() => {});
    }
    return;
  }

  const summary = ev.summary || 'FSM';

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
      customerNote,
      appliedGiftIds
    } = body;

    if (!slot) {
      return NextResponse.json({ error: 'Chýba vybraný termín' }, { status: 400 });
    }

    const bookingStart = new Date(slot);
    const bookingEnd = new Date(bookingStart.getTime() + (duration || 60) * 60000);

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

      for (const ev of fsmRelated) {
        await adjustAvailabilityEvent(ev, bookingStart, bookingEnd);
      }
    } catch (adjustError) {
      console.error('Chyba pri úprave voľných blokov:', adjustError);
    }

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
      descriptionParts.push('', `Poznámky & Odmeny: ${String(customerNote).trim()}`);
    }

    const event = {
      summary: `REZERVÁCIA: ${type} - ${name}`,
      description: descriptionParts.join('\n'),
      start: { dateTime: bookingStart.toISOString() },
      end: { dateTime: bookingEnd.toISOString() },
      colorId: '10',
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });

    // 🚀 SPÁLENIE POUŽITÉHO DARČEKA V SUPABASE
    if (Array.isArray(appliedGiftIds) && appliedGiftIds.length > 0) {
      try {
        await supabase
          .from('gifts')
          .update({ used: true })
          .in('id', appliedGiftIds);
      } catch (giftError) {
        console.error('Chyba pri aktualizácii darčeka:', giftError);
      }
    }

    // 🚀 KONTROLA PREFERENCIE POUŽÍVATEĽA PRED ODOSLANÍM E-MAILU
    let allowEmail = true;
    if (email) {
      try {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email_notifications')
          .eq('email', email)
          .maybeSingle();

        if (userProfile && userProfile.email_notifications === false) {
          allowEmail = false;
        }
      } catch (err) {
        console.error('Chyba kontroly e-mailových notifikácií:', err);
      }
    }

    // 🚀 ODOSLANIE POTVRDZOVACIEHO E-MAILU (IBA AK SÚ NOTIFIKÁCIE POVOLENÉ)
    if (email && allowEmail) {
      sendBookingConfirmationEmail({
        to: email,
        name: name || 'Zákazník',
        type: type || 'Masáž',
        duration: duration || 60,
        slot,
        finalPrice: finalPrice || basePrice || 0,
        customerNote,
      }).catch((err) => console.error('Chyba e-mailovej notifikácie:', err));
    }

    return NextResponse.json({ success: true, event: response.data });
  } catch (error) {
    console.error('Chyba pri kompletnom spracovaní rezervácie:', error);
    return NextResponse.json({ error: 'Chyba pri zápise do kalendára' }, { status: 500 });
  }
}