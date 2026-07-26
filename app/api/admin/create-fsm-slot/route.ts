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
    const body = await req.json();
    const { date, dates, startTime, endTime, discountPercent } = body;

    // 🚀 PODPORA PRE POLE DÁTUMOV (dates) AJ PRE JEDINÝ DÁTUM (date)
    const targetDates: string[] = Array.isArray(dates) && dates.length > 0
      ? dates
      : date
      ? [date]
      : [];

    if (targetDates.length === 0 || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Vyplňte dátum (alebo obdobie) a čas od-do' },
        { status: 400 }
      );
    }

    const percentNum = parseInt(discountPercent || '0', 10);
    const summary = percentNum > 0 ? `FSM_D${percentNum}` : 'FSM';
    const createdEvents = [];

    // 🚀 PREJDEME VŠETKY DNI V POLE A PRE KAŽDÝ VYTVORÍME BLOK V GOOGLE KALENDÁRI
    for (const d of targetDates) {
      const startIso = new Date(`${d}T${startTime}:00`).toISOString();
      const endIso = new Date(`${d}T${endTime}:00`).toISOString();

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

      createdEvents.push(response.data);
    }

    return NextResponse.json({
      success: true,
      count: createdEvents.length,
      events: createdEvents,
    });
  } catch (err: any) {
    console.error('Chyba pri vytváraní FSM bloku:', err);
    return NextResponse.json(
      { error: err?.message || 'Chyba pri otváraní termínu' },
      { status: 500 }
    );
  }
}