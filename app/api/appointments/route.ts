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

// 2. ZÁPIS REZERVÁCIE DO KALENDÁRA + ZELENÁ FARBA + VYMAZANIE STARÉHO SLOTU (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, instagram, slot, duration, type } = body;

    if (!slot) {
      return NextResponse.json({ error: 'Chýba vybraný termín' }, { status: 400 });
    }

    // 1. Prevedieme vybraný slot na absolútny časový timestamp (odstráni chaos s pásmami)
    const targetDate = new Date(slot);
    const targetTimestamp = targetDate.getTime();
    
    // Vypočítame koniec rezervácie
    const endDate = new Date(targetTimestamp + (duration || 60) * 60000);

    // ==========================================
    // 🔥 KROK A: NEPRIESTRELNÉ VYMAZANIE STARÉHO SLOTU
    // ==========================================
    try {
      // Definujeme si časové okno pre celý daný deň, aby sme našli zástupný slot
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingEvents = await calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
      });

      // Hľadáme udalosť, ktorá má v názve "volno" a jej začiatok sa presne rovná nášmu timestampu
      const slotToDelete = existingEvents.data.items?.find((item) => {
        if (!item.start?.dateTime) return false;
        const isTargetSlot = item.summary?.toLowerCase().includes('volno');
        const itemTimestamp = new Date(item.start.dateTime).getTime();
        return isTargetSlot && itemTimestamp === targetTimestamp;
      });

      // Ak takýto slot existuje, vymažeme ho
      if (slotToDelete?.id) {
        console.log(`Úspešne mažem starý slot s ID: ${slotToDelete.id}`);
        await calendar.events.delete({
          calendarId: process.env.GOOGLE_CALENDAR_ID,
          eventId: slotToDelete.id,
        });
      }
    } catch (deleteError) {
      console.error('Chyba pri mazaní starého slotu:', deleteError);
    }

    // ==========================================
    // 📝 KROK B: ZÁPIS NOVEJ REZERVÁCIE (NA ZELENO)
    // ==========================================
    const event = {
      summary: `REZERVÁCIA: ${type} - ${name}`,
      description: `Meno: ${name}\nEmail: ${email}\nTel: ${phone}\nIG: ${instagram}\nBalíček: ${type} (${duration} min)`,
      start: { 
        dateTime: targetDate.toISOString(),
      },
      end: { 
        dateTime: endDate.toISOString(),
      },
      colorId: '10', // 🔥 Kód 10 nastaví v Google Kalendári krásnu zelenú farbu (Basil)
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event,
    });

    return NextResponse.json({ success: true, event: response.data });
  } catch (error) {
    console.error('Chyba pri kompletnom spracovaní rezervácie:', error);
    return NextResponse.json({ error: 'Chyba pri zápise do kalendára' }, { status: 500 });
  }
}
