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

// 2. ZÁPIS REZERVÁCIE DO KALENDÁRA (POST) - Opravený o časové pásmo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, instagram, slot, duration, type } = body;

    if (!slot) {
      return NextResponse.json({ error: 'Chýba vybraný termín' }, { status: 400 });
    }

    // 1. Očistíme textový reťazec, aby sme získali čistý lokálny čas (napr. "2026-07-03T16:00:00")
    const localDateTimeString = slot.slice(0, 19);
    
    // 2. Vytvoríme pomocný dátum na bezpečné pripočítanie dĺžky masáže
    const startDate = new Date(localDateTimeString + 'Z');
    const endDate = new Date(startDate.getTime() + (duration || 60) * 60000);
    const endDateTimeString = endDate.toISOString().slice(0, 19);

    // 3. Pošleme do Google Kalendára presný čas aj s informáciou, že ide o Bratislavu
    const event = {
      summary: `REZERVÁCIA: ${type} - ${name}`,
      description: `Meno: ${name}\nEmail: ${email}\nTel: ${phone}\nIG: ${instagram}\nBalíček: ${type} (${duration} min)`,
      start: { 
        dateTime: localDateTimeString,
        timeZone: 'Europe/Bratislava'
      },
      end: { 
        dateTime: endDateTimeString,
        timeZone: 'Europe/Bratislava'
      },
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
