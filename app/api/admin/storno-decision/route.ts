import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendCancellationDecisionEmail } from '@/app/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { requestId, bookingRef, action } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Chýbajú údaje požiadavky' }, { status: 400 });
    }

    // Načítame detail žiadosti a e-mail klienta zo Supabase
    const { data: requestData } = await supabase
      .from('cancellation_requests')
      .select('id, booking_ref, user_id, profiles(full_name, email)')
      .eq('id', requestId)
      .maybeSingle();

    const clientEmail = (requestData as any)?.profiles?.email;
    const clientName = (requestData as any)?.profiles?.full_name || 'Klient';

    if (action === 'approve') {
      // 1. Vymažeme rezerváciu z Google Kalendára cez naše API
      try {
        await fetch(`${new URL(req.url).origin}/api/admin/cancel-appointment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: bookingRef }),
        });
      } catch (err) {
        console.error('Chyba pri mazaní z kalendára:', err);
      }

      // 2. Aktualizujeme stav žiadosti v Supabase
      await supabase
        .from('cancellation_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      // 3. Odošleme e-mail o schválení
      if (clientEmail) {
        sendCancellationDecisionEmail({
          to: clientEmail,
          name: clientName,
          bookingRef: bookingRef,
          status: 'approved',
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, message: 'Storno bolo schválené a rezervácia vymazaná!' });
    } else if (action === 'reject') {
      // Aktualizujeme stav na zamietnuté
      await supabase
        .from('cancellation_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      // Odošleme e-mail o zamietnutí
      if (clientEmail) {
        sendCancellationDecisionEmail({
          to: clientEmail,
          name: clientName,
          bookingRef: bookingRef,
          status: 'rejected',
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, message: 'Storno žiadosť bola zamietnutá.' });
    }

    return NextResponse.json({ error: 'Neplatná akcia' }, { status: 400 });
  } catch (err: any) {
    console.error('Chyba storno rozhodnutia:', err);
    return NextResponse.json({ error: err?.message || 'Chyba servera' }, { status: 500 });
  }
}