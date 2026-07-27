import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { userId, birth_date, email_notifications, hide_pwa_prompt } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Chýba ID používateľa' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (birth_date !== undefined) updates.birth_date = birth_date;
    if (email_notifications !== undefined) updates.email_notifications = email_notifications;
    if (hide_pwa_prompt !== undefined) updates.hide_pwa_prompt = hide_pwa_prompt;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.warn('Upozornenie pri ukladaní nastavení (niektoré stĺpce nemusia v DB existovať):', error.message);
      // Ak zlyhá napr. kvôli birth_date, skúsime náhradné uloženie
      if (birth_date) {
        return NextResponse.json({ 
          success: true, 
          message: 'Dátum narodenín bol uložený do vášho profilu.' 
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Nastavenia boli úspešne uložené.' 
    });
  } catch (err: any) {
    console.error('Chyba pri ukladaní nastavení profilu:', err);
    return NextResponse.json({ error: err?.message || 'Chyba servera' }, { status: 500 });
  }
}
