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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = (url.searchParams.get('email') || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ bookings: [] });
    }

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = response.data.items || [];

    // Filtrujeme nadchádzajúce rezervácie patriace tomuto e-mailu
    const userBookings = items
      .filter((item) => {
        const isBooking = (item.summary || '').includes('REZERVÁCIA');
        const desc = (item.description || '').toLowerCase();
        return isBooking && desc.includes(email);
      })
      .map((item) => {
        const desc = item.description || '';
        const refMatch = (item.summary + ' ' + desc).match(/#?(RES-[A-Z0-9]+)/i);
        const bookingRef = refMatch ? refMatch[1].toUpperCase() : null;

        return {
          id: item.id,
          summary: item.summary,
          description: item.description,
          start: item.start?.dateTime || item.start?.date,
          end: item.end?.dateTime || item.end?.date,
          bookingRef,
        };
      });

    return NextResponse.json({ bookings: userBookings });
  } catch (error: any) {
    console.error('Chyba pri načítaní rezervácií užívateľa:', error);
    return NextResponse.json({ bookings: [] });
  }
}