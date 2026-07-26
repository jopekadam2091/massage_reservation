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

export async function POST(req: Request) {
  try {
    const { date, startTime, endTime, discountPercent } = await req.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Vyplňte dátum a čas od-do' }, { status: 400 });
    }

    const startIso = new Date(`${date}T${startTime}:00`).toISOString();
    const endIso = new Date(`${date}T${endTime}:00`).toISOString();

    const percentNum = parseInt(discountPercent, 10);
    const summary = percentNum > 0 ? `FSM_D${percentNum}` : 'FSM';

    const event = {
      summary: summary,
      description: 'Otvorený voľný čas pre rezervácie masáží',
      start: { dateTime: startIso },
      end: { dateTime: endIso },
      colorId: '8', // Sivá neutrálna farba pre FSM blok
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });

    return NextResponse.json({ success: true, event: response.data });
  } catch (err: any) {
    console.error('Chyba pri vytváraní FSM bloku:', err);
    return NextResponse.json({ error: err?.message || 'Chyba pri otváraní termínu' }, { status: 500 });
  }
}