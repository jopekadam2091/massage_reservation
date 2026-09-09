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
    const { eventId, eventIds, discountPercent, date, selectedHours } = body;

    const discountNum = parseInt(discountPercent ?? '0', 10);
    const newSummary = discountNum > 0 ? `FSM_D${discountNum}` : 'FSM';

    // 🚀 SCENÁR 1: ŠPECIFICKÉ HODINY V RÁMCI DŇA (HODINOVÉ DELENIE / MERGOVANIE FSM BLOKOV)
    if (date && Array.isArray(selectedHours) && selectedHours.length > 0) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`).toISOString();
      const endOfDay = new Date(`${date}T23:59:59.999Z`).toISOString();

      const eventsRes = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin: startOfDay,
        timeMax: endOfDay,
        singleEvents: true,
      });

      const fsmItems = (eventsRes.data.items || []).filter(
        (item) => item.id && (item.summary || '').toUpperCase().includes('FSM')
      );

      if (fsmItems.length === 0) {
        return NextResponse.json(
          { error: 'V tento deň neboli nájdené žiadne voľné FSM sloty.' },
          { status: 400 }
        );
      }

      // Rozdelenie na hodinové segmenty od 07:00 do 23:00
      type HourSlice = { hour: number; summary: string };
      const slices: HourSlice[] = [];

      for (let h = 7; h <= 23; h++) {
        const hStart = new Date(`${date}T${String(h).padStart(2, '0')}:00:00`);
        const hEnd = new Date(`${date}T${String(h + 1).padStart(2, '0')}:00:00`);

        const coveringEvent = fsmItems.find((ev) => {
          if (!ev.start?.dateTime || !ev.end?.dateTime) return false;
          const evS = new Date(ev.start.dateTime);
          const evE = new Date(ev.end.dateTime);
          return evS <= hStart && evE >= hEnd;
        });

        if (coveringEvent) {
          const hourStr = `${String(h).padStart(2, '0')}:00`;
          const isSelected = selectedHours.includes(hourStr);
          const sliceSummary = isSelected ? newSummary : (coveringEvent.summary || 'FSM');
          slices.push({ hour: h, summary: sliceSummary });
        }
      }

      if (slices.length === 0) {
        return NextResponse.json(
          { error: 'Vybrané hodiny nespadajú do žiadneho voľného FSM termínu.' },
          { status: 400 }
        );
      }

      // Zmazanie starých pokrývajúcich FSM udalostí
      for (const ev of fsmItems) {
        await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: ev.id! }).catch(() => {});
      }

      // Zlúčenie susediacich hodín s rovnakou zľavou
      const consolidatedBlocks: { startH: number; endH: number; summary: string }[] = [];
      for (const s of slices) {
        const last = consolidatedBlocks[consolidatedBlocks.length - 1];
        if (last && last.summary === s.summary && last.endH === s.hour) {
          last.endH = s.hour + 1;
        } else {
          consolidatedBlocks.push({ startH: s.hour, endH: s.hour + 1, summary: s.summary });
        }
      }

      // Vloženie nových blokov do Google Kalendára
      const created = [];
      for (const b of consolidatedBlocks) {
        const startIso = new Date(`${date}T${String(b.startH).padStart(2, '0')}:00:00`).toISOString();
        const endIso = new Date(`${date}T${String(b.endH).padStart(2, '0')}:00:00`).toISOString();

        const res = await calendar.events.insert({
          calendarId: CALENDAR_ID,
          requestBody: {
            summary: b.summary,
            description: 'Otvorený voľný čas pre rezervácie masáží',
            start: { dateTime: startIso },
            end: { dateTime: endIso },
            colorId: '8',
          },
        });
        created.push(res.data);
      }

      return NextResponse.json({
        success: true,
        updatedCount: created.length,
        events: created,
        newSummary,
      });
    }

    // 🚀 SCENÁR 2: PRIAMA AKTUALIZÁCIA KONKRÉTNYCH EVENTOV / CELÉHO DŇA
    const idsToUpdate: string[] = [];

    if (eventId) {
      idsToUpdate.push(eventId);
    } else if (Array.isArray(eventIds) && eventIds.length > 0) {
      idsToUpdate.push(...eventIds);
    } else if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`).toISOString();
      const endOfDay = new Date(`${date}T23:59:59.999Z`).toISOString();

      const eventsRes = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin: startOfDay,
        timeMax: endOfDay,
        singleEvents: true,
      });

      const items = eventsRes.data.items || [];
      items.forEach((item) => {
        if (item.id && (item.summary || '').toUpperCase().includes('FSM')) {
          idsToUpdate.push(item.id);
        }
      });
    }

    if (idsToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'Neboli nájdené žiadne FSM sloty na aktualizáciu.' },
        { status: 400 }
      );
    }

    const updated = [];
    for (const id of idsToUpdate) {
      try {
        const res = await calendar.events.patch({
          calendarId: CALENDAR_ID,
          eventId: id,
          requestBody: {
            summary: newSummary,
          },
        });
        updated.push(res.data);
      } catch (patchErr) {
        console.error(`Chyba pri aktualizácii slotu ${id}:`, patchErr);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: updated.length,
      newSummary,
      discountPercent: discountNum,
    });
  } catch (err: any) {
    console.error('Chyba v update-fsm-slot:', err);
    return NextResponse.json(
      { error: err?.message || 'Chyba pri aktualizácii zľavy na slote.' },
      { status: 500 }
    );
  }
}
