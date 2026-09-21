import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ReviewItem {
  id: string;
  user_id?: string | null;
  user_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  is_anonymous: boolean;
  source: 'profile' | 'qr_code' | 'admin_manual' | 'landing_modal';
  created_at: string;
  approved_at?: string | null;
}

const REVIEWS_FILE = path.join(process.cwd(), 'data', 'reviews.json');

/**
 * Serverový Supabase klient so Service Role kľúčom,
 * ktorý má plné oprávnenia na čítanie, vkladanie, aktualizáciu aj mazanie recenzií (obchádza RLS).
 */
function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function readFallbackReviews(): ReviewItem[] {
  try {
    if (!fs.existsSync(REVIEWS_FILE)) {
      const dir = path.dirname(REVIEWS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(REVIEWS_FILE, '[]', 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(REVIEWS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading fallback reviews:', e);
    return [];
  }
}

function writeFallbackReviews(reviews: ReviewItem[]) {
  try {
    const dir = path.dirname(REVIEWS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing fallback reviews:', e);
  }
}

/**
 * Získa všetky recenzie vrátane indikátora, či je aktívna Supabase tabuľka
 */
export async function getAllReviewsWithStatus(): Promise<{ reviews: ReviewItem[]; isDbConnected: boolean }> {
  const client = getSupabaseServerClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // Ak je tabuľka v Supabase vytvorená ale prázdna, skúsime ju naplniť z počiatočného fallbacku
        if (data.length === 0) {
          const fallback = readFallbackReviews();
          if (fallback.length > 0) {
            try {
              await client.from('reviews').insert(fallback);
              return { reviews: fallback, isDbConnected: true };
            } catch (seedErr) {
              console.warn('Auto-seed reviews to Supabase failed:', seedErr);
            }
          }
          return { reviews: [], isDbConnected: true };
        }

        return { reviews: data as ReviewItem[], isDbConnected: true };
      }
    } catch (e) {
      console.warn('Supabase query reviews failed, using local file:', e);
    }
  }

  // Fallback na lokálny súbor
  const fallbackList = readFallbackReviews().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return { reviews: fallbackList, isDbConnected: false };
}

export async function getAllReviews(): Promise<ReviewItem[]> {
  const { reviews } = await getAllReviewsWithStatus();
  return reviews;
}

export async function getApprovedReviews(): Promise<ReviewItem[]> {
  const all = await getAllReviews();
  return all.filter((r) => r.status === 'approved');
}

export async function addReview(newRev: Omit<ReviewItem, 'id' | 'created_at'>): Promise<ReviewItem> {
  const item: ReviewItem = {
    ...newRev,
    id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    created_at: new Date().toISOString(),
    approved_at: newRev.status === 'approved' ? new Date().toISOString() : null,
  };

  const client = getSupabaseServerClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('reviews')
        .insert([item])
        .select()
        .maybeSingle();

      if (!error && data) {
        // Záloha do lokálneho súboru
        const all = readFallbackReviews();
        all.unshift(data as ReviewItem);
        writeFallbackReviews(all);
        return data as ReviewItem;
      }
    } catch (e) {
      console.warn('Supabase insert review failed, falling back to JSON:', e);
    }
  }

  const all = readFallbackReviews();
  all.unshift(item);
  writeFallbackReviews(all);
  return item;
}

export async function updateReviewStatus(id: string, status: 'approved' | 'rejected'): Promise<boolean> {
  const updates: Record<string, any> = { status };
  if (status === 'approved') {
    updates.approved_at = new Date().toISOString();
  }

  let dbOk = false;
  const client = getSupabaseServerClient();
  if (client) {
    try {
      const { error } = await client
        .from('reviews')
        .update(updates)
        .eq('id', id);

      if (!error) {
        dbOk = true;
      }
    } catch (e) {
      console.warn('Supabase update review status error:', e);
    }
  }

  // VŽDY aktualizujeme aj lokálny súbor reviews.json
  const all = readFallbackReviews();
  const found = all.find((r) => r.id === id);
  if (found) {
    found.status = status;
    if (status === 'approved') found.approved_at = updates.approved_at;
    writeFallbackReviews(all);
  }

  return dbOk || Boolean(found);
}

export async function deleteReview(id: string): Promise<boolean> {
  let dbOk = false;
  const client = getSupabaseServerClient();
  if (client) {
    try {
      const { error } = await client
        .from('reviews')
        .delete()
        .eq('id', id);

      if (!error) {
        dbOk = true;
      }
    } catch (e) {
      console.warn('Supabase delete review error:', e);
    }
  }

  // VŽDY vymažeme recenziu aj z lokálneho JSON súboru
  const all = readFallbackReviews();
  const filtered = all.filter((r) => r.id !== id);
  writeFallbackReviews(filtered);

  return true;
}
