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

function getBratislavaOffset(dateStr: string): string {
  try {
    const dObj = new Date(`${dateStr}T12:00:00Z`);
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Bratislava',
      timeZoneName: 'longOffset',
    });
    const parts = dtf.formatToParts(dObj);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    const match = tzPart ? tzPart.value.match(/GMT([+-]\d{2}:\d{2})/) : null;
    return match ? match[1] : '+02:00';
  } catch {
    return '+02:00';
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, eventIds, discountPercent, date, selectedHours } = body;

    const discountNum = parseInt(discountPercent ?? '0', 10);
    const newSummary = discountNum > 0 ? `FSM_D${discountNum}` : 'FSM';

    // 🚀 SCENÁR 1: PRIAMA AKTUALIZÁCIA KONKRÉTNEHO EVENTU (BLESKOVÁ, NEDEŠTRUKTÍVNA)
    if (eventId) {
      let ev: any;
      try {
        const evRes = await calendar.events.get({ calendarId: CALENDAR_ID, eventId });
        ev = evRes.data;
      } catch (getErr) {
        console.error(`Termín s ID ${eventId} nebol nájdený:`, getErr);
        return NextResponse.json({ error: 'Termín nebol nájdený v Google Kalendári.' }, { status: 404 });
      }

      if (!ev || !ev.start?.dateTime || !ev.end?.dateTime) {
        return NextResponse.json({ error: 'Neplatné časové údaje termínu.' }, { status: 400 });
      }

      const evStart = new Date(ev.start.dateTime);
      const evEnd = new Date(ev.end.dateTime);
      const durationHours = Math.round((evEnd.getTime() - evStart.getTime()) / (1000 * 60 * 60));

      const selectedH = Array.isArray(selectedHours) && selectedHours.length > 0 ? selectedHours : null;
      const isWholeEvent = !selectedH || durationHours <= 1;

      // Ak je termín 1-hodinový alebo zmena platí pre celý termín -> priamy bleskový patch
      if (isWholeEvent) {
        const patchRes = await calendar.events.patch({
          calendarId: CALENDAR_ID,
          eventId,
          requestBody: { summary: newSummary },
        });
        return NextResponse.json({
          success: true,
          updatedCount: 1,
          newSummary,
          discountPercent: discountNum,
          event: patchRes.data,
        });
      }

      // Ak je termín viac-hodinový (napr. 08:00–20:00) a meníme iba konkrétnu hodinu (napr. 08:00)
      const targetDate = date || ev.start.dateTime.slice(0, 10);
      const offset = getBratislavaOffset(targetDate);
      const startH = evStart.getHours();
      const endH = evEnd.getHours() === 0 && evEnd.getDate() !== evStart.getDate() ? 24 : evEnd.getHours();

      const slices: { hour: number; summary: string }[] = [];
      for (let h = startH; h < endH; h++) {
        const hStr = `${String(h).padStart(2, '0')}:00`;
        const isSelected = selectedH.includes(hStr);
        slices.push({
          hour: h,
          summary: isSelected ? newSummary : (ev.summary || 'FSM'),
        });
      }

      // Zlúčenie susediacich hodín s rovnakou zľavou
      const blocks: { startH: number; endH: number; summary: string }[] = [];
      for (const s of slices) {
        const last = blocks[blocks.length - 1];
        if (last && last.summary === s.summary && last.endH === s.hour) {
          last.endH = s.hour + 1;
        } else {
          blocks.push({ startH: s.hour, endH: s.hour + 1, summary: s.summary });
        }
      }

      // Prvý blok použijeme na patch pôvodného eventu (nestratí sa ani na sekundu!)
      const firstBlock = blocks[0];
      const firstStartIso = `${targetDate}T${String(firstBlock.startH).padStart(2, '0')}:00:00${offset}`;
      const firstEndIso = `${targetDate}T${String(firstBlock.endH).padStart(2, '0')}:00:00${offset}`;

      const updatedOriginal = await calendar.events.patch({
        calendarId: CALENDAR_ID,
        eventId,
        requestBody: {
          summary: firstBlock.summary,
          start: { dateTime: firstStartIso },
          end: { dateTime: firstEndIso },
        },
      });

      const createdEvents = [updatedOriginal.data];

      // Prípadné ďalšie bloky vložíme paralelne
      if (blocks.length > 1) {
        const inserts = blocks.slice(1).map((b) => {
          const bStartIso = `${targetDate}T${String(b.startH).padStart(2, '0')}:00:00${offset}`;
          const bEndIso = `${targetDate}T${String(b.endH).padStart(2, '0')}:00:00${offset}`;
          return calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: {
              summary: b.summary,
              description: 'Otvorený voľný čas pre rezervácie masáží',
              start: { dateTime: bStartIso },
              end: { dateTime: bEndIso },
              colorId: '8',
            },
          });
        });
        const insertResults = await Promise.all(inserts);
        insertResults.forEach((r) => createdEvents.push(r.data));
      }

      return NextResponse.json({
        success: true,
        updatedCount: createdEvents.length,
        newSummary,
        discountPercent: discountNum,
        events: createdEvents,
      });
    }

    // 🚀 SCENÁR 2: ŠPECIFICKÉ HODINY CEZ DROP-MODAL (date + selectedHours bez konkrétneho eventId)
    if (date && Array.isArray(selectedHours) && selectedHours.length > 0) {
      const offset = getBratislavaOffset(date);
      const timeMin = `${date}T00:00:00${offset}`;
      const timeMax = `${date}T23:59:59${offset}`;

      const eventsRes = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin,
        timeMax,
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

      type HourSlice = { hour: number; summary: string };
      const slices: HourSlice[] = [];

      for (let h = 7; h <= 23; h++) {
        const hStart = new Date(`${date}T${String(h).padStart(2, '0')}:00:00${offset}`).getTime();
        const hEnd = new Date(
          h === 23
            ? `${date}T23:59:59${offset}`
            : `${date}T${String(h + 1).padStart(2, '0')}:00:00${offset}`
        ).getTime();

        const coveringEvent = fsmItems.find((ev) => {
          if (!ev.start?.dateTime || !ev.end?.dateTime) return false;
          const evS = new Date(ev.start.dateTime).getTime();
          const evE = new Date(ev.end.dateTime).getTime();
          return evS <= hStart && evE >= (h === 23 ? hStart + 3600000 : hEnd);
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

      // Nedeštruktívna aktualizácia:
      // Najprv patchneme existujúce eventy (zostanú zachované!), prebytočné dovymažeme, chýbajúce dovložíme
      const results: any[] = [];
      const eventsToPatch = fsmItems.slice(0, consolidatedBlocks.length);
      const eventsToDelete = fsmItems.slice(consolidatedBlocks.length);
      const blocksToInsert = consolidatedBlocks.slice(eventsToPatch.length);

      const patchPromises = eventsToPatch.map((ev, idx) => {
        const b = consolidatedBlocks[idx];
        const bStart = `${date}T${String(b.startH).padStart(2, '0')}:00:00${offset}`;
        const bEnd = `${date}T${String(b.endH).padStart(2, '0')}:00:00${offset}`;
        return calendar.events.patch({
          calendarId: CALENDAR_ID,
          eventId: ev.id!,
          requestBody: {
            summary: b.summary,
            start: { dateTime: bStart },
            end: { dateTime: bEnd },
          },
        });
      });

      const insertPromises = blocksToInsert.map((b) => {
        const bStart = `${date}T${String(b.startH).padStart(2, '0')}:00:00${offset}`;
        const bEnd = `${date}T${String(b.endH).padStart(2, '0')}:00:00${offset}`;
        return calendar.events.insert({
          calendarId: CALENDAR_ID,
          requestBody: {
            summary: b.summary,
            description: 'Otvorený voľný čas pre rezervácie masáží',
            start: { dateTime: bStart },
            end: { dateTime: bEnd },
            colorId: '8',
          },
        });
      });

      const deletePromises = eventsToDelete.map((ev) =>
        calendar.events.delete({ calendarId: CALENDAR_ID, eventId: ev.id! }).catch(() => {})
      );

      const [patchRes, insertRes] = await Promise.all([
        Promise.all(patchPromises),
        Promise.all(insertPromises),
        Promise.all(deletePromises),
      ]);

      patchRes.forEach((r) => results.push(r.data));
      insertRes.forEach((r) => results.push(r.data));

      return NextResponse.json({
        success: true,
        updatedCount: results.length,
        events: results,
        newSummary,
      });
    }

    // 🚀 SCENÁR 3: HROMADNÁ AKTUALIZÁCIA VIACERÝCH ID ALEBO CELÉHO DŇA (eventIds alebo date)
    const idsToUpdate: string[] = [];

    if (Array.isArray(eventIds) && eventIds.length > 0) {
      idsToUpdate.push(...eventIds);
    } else if (date) {
      const offset = getBratislavaOffset(date);
      const timeMin = `${date}T00:00:00${offset}`;
      const timeMax = `${date}T23:59:59${offset}`;

      const eventsRes = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin,
        timeMax,
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

    // Paralelný bleskový patch
    const patchPromises = idsToUpdate.map((id) =>
      calendar.events.patch({
        calendarId: CALENDAR_ID,
        eventId: id,
        requestBody: { summary: newSummary },
      })
    );
    const updated = await Promise.all(patchPromises);

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
