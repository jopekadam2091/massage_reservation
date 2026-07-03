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

// 2. ZÁPIS REZERVÁCIE DO KALENDÁRA + ZELENÁ FARBA + VYMAZANIE SLOTU (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, instagram, slot, duration, type } = body;

    if (!slot) {
      return NextResponse.json({ error: 'Chýba vybraný termín' }, { status: 400 });
    }

    // Vytiahneme čistý lokálny čas bez ohľadu na posuny servera (napr. "2026-07-03T16:00:00")
    const localDateTimeString = slot.slice(0, 19);
    
    // Bezpečne vypočítame koniec masáže v čistom lokálnom formáte
    const dummyDate = new Date(localDateTimeString + 'Z');
    const dummyEndDate = new Date(dummyDate.getTime() + (duration || 60) * 60000);
    const endLocalDateTimeString = dummyEndDate.toISOString().slice(0, 19);

    // ==========================================
    // 🔥 KROK A: NEPRIESTRELNÉ VYMAZANIE STARÉHO SLOTU
    // ==========================================
    try {
      // Vyhľadáme udalosti v okne +/- 12 hodín okolo zvoleného času pre 100% istotu zachytenia
      const timeMinFetch = new Date(dummyDate.getTime() - 12 * 60 * 60 * 1000).toISOString();
      const timeMaxFetch = new Date(dummyDate.getTime() + 12 * 60 * 60 * 1000).toISOString();

      const existingEvents = await calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        timeMin: timeMinFetch,
        timeMax: timeMaxFetch,
        singleEvents: true,
      });

      // Nájdeme správny slot pomocou striktného prevodu na bratislavský časový text
      const slotToDelete = existingEvents.data.items?.find((item) => {
        if (!item.start?.dateTime) return false;
        
        const isTargetSlot = item.summary?.toLowerCase().includes('volno');
        
        // Prevedieme akýkoľvek čas z kalendára na čistý formát "YYYY-MM-DDTHH:mm:ss" v bratislavskom pásme
        const itemDate = new Date(item.start.dateTime);
        const itemBratislavaStr = itemDate.toLocaleString('sv-SE', { timeZone: 'Europe/Bratislava' }).replace(' ', 'T');
        
        // Porovnáme textové reťazce (napr. "2026-07-03T16:00:00" === "2026-07-03T16:00:00")
        return isTargetSlot && itemBratislavaStr.startsWith(localDateTimeString);
      });

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
    // 📝 KROK B: ZÁPIS NOVEJ REZERVÁCIE V BRATISLAVSKOM ČASE A NA ZELENO
    // ==========================================
    const event = {
      summary: `REZERVÁCIA: ${type} - ${name}`,
      description: `Meno: ${name}\nEmail: ${email}\nTel: ${phone}\nIG: ${instagram}\nBalíček: ${type} (${duration} min)`,
      start: { 
        dateTime: localDateTimeString,
        timeZone: 'Europe/Bratislava'
      },
      end: { 
        dateTime: endLocalDateTimeString,
        timeZone: 'Europe/Bratislava'
      },
      colorId: '10', // 🔥 Nastaví krásnu sýtozelenú farbu v Google Kalendári
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
