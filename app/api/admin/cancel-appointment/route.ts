import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sendCancellationDecisionEmail } from '@/app/lib/email';

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar']
);

const calendar = google.calendar({ version: 'v3', auth });
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID as string;

async function handleCancel(eventId?: string, query?: string) {
  if (!CALENDAR_ID) {
    return { error: 'Chýba GOOGLE_CALENDAR_ID v .env.local', status: 500 };
  }

  let targetEvent: any = null;

  // 1. Vyhľadanie udalosti podľa ID
  if (eventId) {
    try {
      const res = await calendar.events.get({ calendarId: CALENDAR_ID, eventId: eventId });
      targetEvent = res.data;
    } catch {}
  } else if (query && query.trim()) {
    const searchTerm = query.trim().toLowerCase();
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      singleEvents: true,
    });

    const events = response.data.items || [];
    targetEvent = events.find((ev) => {
      const summary = (ev.summary || '').toLowerCase();
      const description = (ev.description || '').toLowerCase();
      return summary.includes(searchTerm) || description.includes(searchTerm);
    });
  }

  if (!targetEvent) {
    return { error: 'Nenašla sa žiadna rezervácia', status: 404 };
  }

  // Extrakcia údajov pre e-mail pred zmazaním
  const desc = targetEvent.description || '';
  const emailMatch = desc.match(/Email:\s*([^\s\n]+)/i);
  const nameMatch = desc.match(/Meno:\s*([^\n]+)/i);
  const refMatch = (targetEvent.summary + ' ' + desc).match(/#?(RES-[A-Z0-9]+)/i);

  const clientEmail = emailMatch ? emailMatch[1].trim() : null;
  const clientName = nameMatch ? nameMatch[1].trim() : 'Klient';
  const bookingRef = refMatch ? refMatch[1].toUpperCase() : '';

  // Vymazanie z Google Kalendára
  if (targetEvent.id) {
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: targetEvent.id,
    });
  }

  // Odoslanie e-mailu klientovi o stornovaní
  if (clientEmail) {
    sendCancellationDecisionEmail({
      to: clientEmail,
      name: clientName,
      bookingRef: bookingRef,
      status: 'approved',
    }).catch(() => {});
  }

  return { success: true, message: `Rezervácia "${targetEvent.summary}" bola úspešne zrušená!` };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await handleCancel(body.eventId, body.query);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Chyba pri rušení' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const query = url.searchParams.get('query') || body.query;
    const eventId = url.searchParams.get('eventId') || body.eventId;

    const result = await handleCancel(eventId, query);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Chyba pri rušení' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}