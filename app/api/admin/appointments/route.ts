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

export async function GET() {
  try {
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = response.data.items || [];

    // Filtrujeme iba skutočné vytvorené rezervácie
    const bookings = items
      .filter((item) => (item.summary || '').includes('REZERVÁCIA'))
      .map((item) => ({
        id: item.id,
        summary: item.summary,
        description: item.description,
        start: item.start?.dateTime || item.start?.date,
        end: item.end?.dateTime || item.end?.date,
      }));

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error('Chyba načítavania rezervácií pre admina:', error);
    return NextResponse.json({ error: 'Chyba načítania rezervácií' }, { status: 500 });
  }
}