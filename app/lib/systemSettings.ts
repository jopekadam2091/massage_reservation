import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

export interface SystemSettings {
  lucky_wheel_enabled: boolean;
  maintenance_message_sk: string;
  maintenance_message_en: string;
  updated_at?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  lucky_wheel_enabled: true,
  maintenance_message_sk: 'Koleso šťastia je momentálne v rekonštrukcii. Pripravujeme pre vás nové odmeny a vylepšenia. Skúste to prosím neskôr.',
  maintenance_message_en: 'The Lucky Wheel is currently under reconstruction. We are preparing new rewards and features for you. Please try again later.',
  updated_at: new Date().toISOString(),
};

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'system_settings.json');

function readFallbackSettings(): SystemSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      const dir = path.dirname(SETTINGS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
      return DEFAULT_SETTINGS;
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error reading fallback settings:', e);
    return DEFAULT_SETTINGS;
  }
}

function writeFallbackSettings(settings: SystemSettings) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing fallback settings:', e);
  }
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (!error && data) {
      return {
        lucky_wheel_enabled: data.lucky_wheel_enabled !== false,
        maintenance_message_sk: data.maintenance_message_sk || DEFAULT_SETTINGS.maintenance_message_sk,
        maintenance_message_en: data.maintenance_message_en || DEFAULT_SETTINGS.maintenance_message_en,
        updated_at: data.updated_at || new Date().toISOString(),
      };
    }
  } catch {
    // Supabase table system_settings might not exist, use file fallback
  }

  return readFallbackSettings();
}

export async function updateSystemSettings(partial: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await getSystemSettings();
  const updated: SystemSettings = {
    ...current,
    ...partial,
    updated_at: new Date().toISOString(),
  };

  // 1. Uložiť lokálne
  writeFallbackSettings(updated);

  // 2. Skúsiť uložiť do Supabase
  try {
    await supabase
      .from('system_settings')
      .upsert({
        id: 'global',
        lucky_wheel_enabled: updated.lucky_wheel_enabled,
        maintenance_message_sk: updated.maintenance_message_sk,
        maintenance_message_en: updated.maintenance_message_en,
        updated_at: updated.updated_at,
      });
  } catch (e) {
    console.warn('Could not save settings to Supabase table:', e);
  }

  return updated;
}
