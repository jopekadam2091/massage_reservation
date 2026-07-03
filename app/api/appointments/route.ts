import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar']
);

const calendar = google.calendar({ version: 'v3', auth });

// 1. ČÍTANIE VOĽNÝCH TERMÍNOV (GET)
export async function GET() {
  try {
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    return NextResponse.json({ events: response.data.items });
  } catch (error) {
    return NextResponse.json({ error: 'Chyba pri načítaní kalendára' }, { status: 500 });
  }
}

// 2. ZÁPIS REZERVÁCIE DO KALENDÁRA (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, instagram, slot, duration, type } = body;

    if (!slot) {
      return NextResponse.json({ error: 'Chýba vybraný termín' }, { status: 400 });
    }

    const startDate = new Date(slot);
    // Vypočítame koniec masáže podľa vybranej dĺžky (v minútach)
    const endDate = new Date(startDate.getTime() + (duration || 60) * 60000);

    const event = {
      summary: `REZERVÁCIA: ${type} - ${name}`,
      description: `Meno: ${name}\nEmail: ${email}\nTel: ${phone}\nIG: ${instagram}\nBalíček: ${type} (${duration} min)`,
      start: { dateTime: startDate.toISOString() },
      end: { dateTime: endDate.toISOString() },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event,
    });

    return NextResponse.json({ success: true, event: response.data });
  } catch (error) {
    console.error('Chyba pri zápise:', error);
    return NextResponse.json({ error: 'Chyba pri zápise do kalendára' }, { status: 500 });
  }
}
