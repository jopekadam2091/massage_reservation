import { NextResponse } from 'next/server';
import { getSystemSettings } from '@/app/lib/systemSettings';

export async function GET() {
  try {
    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    console.error('Chyba načítavania systémových nastavení:', err);
    return NextResponse.json({ error: 'Chyba načítavania nastavení' }, { status: 500 });
  }
}
