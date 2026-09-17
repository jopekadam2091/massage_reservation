import { NextResponse } from 'next/server';
import { getSystemSettings, updateSystemSettings } from '@/app/lib/systemSettings';

export async function GET() {
  try {
    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    console.error('Chyba načítavania nastavení adminom:', err);
    return NextResponse.json({ error: 'Chyba servera' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateSystemSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('Chyba ukladania nastavení adminom:', err);
    return NextResponse.json({ error: err?.message || 'Chyba servera' }, { status: 500 });
  }
}
