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

// 2. ZÁPIS REZERVÁCIE DO KALENDÁRA + VYMAZANIE STARÉHO SLOTU (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, instagram, slot, duration, type } = body;

    if (!slot) {
      return NextResponse.json({ error: 'Chýba vybraný termín' }, { status: 400 });
    }

    // 1. Očistíme textový reťazec lokálneho času (napr. "2026-07-03T16:00:00")
    const localDateTimeString = slot.slice(0, 19);
    
    // Vytvoríme pomocné dátumy pre novú rezerváciu
    const startDate = new Date(localDateTimeString + 'Z');
    const endDate = new Date(startDate.getTime() + (duration || 60) * 60000);
    const endDateTimeString = endDate.toISOString().slice(0, 19);

    // ==========================================
    // 🔥 KROK A: VYMAZANIE EXISTUJÚCEHO SLOTU "Volno na masaz"
    // ==========================================
    try {
      const dayString = localDateTimeString.slice(0, 10); // Získame iba dátum, napr. "2026-07-03"
      
      // Vyhľadáme udalosti pre celý tento deň v kalendári
      const existingEvents = await calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        timeMin: `${dayString}T00:00:00Z`,
        timeMax: `${dayString}T23:59:59Z`,
        singleEvents: true,
      });

      // Nájdeme udalosť, ktorá obsahuje text "volno" a začína presne v rovnakom čase
      const slotToDelete = existingEvents.data.items?.find((item) => {
        const isTargetSlot = item.summary?.toLowerCase().includes('volno');
        const itemLocalTime = item.start?.dateTime?.slice(0, 19); // Ostrihneme na čistý čas bez posunu
        return isTargetSlot && itemLocalTime === localDateTimeString;
      });

      // Ak sme taký slot našli, vymažeme ho z Google kalendára
      if (slotToDelete?.id) {
        console.log(`Mažem starý slot s ID: ${slotToDelete.id}`);
        await calendar.events.delete({
          calendarId: process.env.GOOGLE_CALENDAR_ID,
          eventId: slotToDelete.id,
        });
      }
    } catch (deleteError) {
      // Ak by mazanie z nejakého dôvodu zlyhalo, zalogujeme to, ale neprerušíme vytvorenie rezervácie
      console.error('Nepodarilo sa vymazať starý slot:', deleteError);
    }

    // ==========================================
    // 📝 KROK B: ZÁPIS NOVEJ REZERVÁCIE
    // ==========================================
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
    console.error('Chyba pri kompletnom spracovaní rezervácie:', error);
    return NextResponse.json({ error: 'Chyba pri zápise do kalendára' }, { status: 500 });
  }
}
