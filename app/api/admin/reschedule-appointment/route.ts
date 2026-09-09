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

export async function PATCH(request: Request) {
  try {
    const { eventId, newStartIso, newEndIso } = await request.json();

    if (!eventId || !newStartIso || !newEndIso) {
      return NextResponse.json({ error: 'Chýbajú povinné parametre' }, { status: 400 });
    }

    const updatedEvent = await calendar.events.patch({
      calendarId: CALENDAR_ID,
      eventId: eventId,
      requestBody: {
        start: { dateTime: newStartIso },
        end: { dateTime: newEndIso },
      },
    });

    return NextResponse.json({ success: true, event: updatedEvent.data });
  } catch (error: any) {
    console.error('Chyba pri presúvaní rezervácie v kalendári:', error);
    return NextResponse.json({ error: 'Nepodarilo sa presunúť rezerváciu' }, { status: 500 });
  }
}
