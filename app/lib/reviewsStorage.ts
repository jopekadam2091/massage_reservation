import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

export interface ReviewItem {
  id: string;
  user_id?: string | null;
  user_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  is_anonymous: boolean;
  source: 'profile' | 'qr_code' | 'admin_manual';
  created_at: string;
}

const REVIEWS_FILE = path.join(process.cwd(), 'data', 'reviews.json');

function readFallbackReviews(): ReviewItem[] {
  try {
    if (!fs.existsSync(REVIEWS_FILE)) {
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

export async function getAllReviews(): Promise<ReviewItem[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as ReviewItem[];
    }
  } catch {
    // Supabase table does not exist or network failed, fall back
  }
  return readFallbackReviews().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
  };

  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([item])
      .select()
      .maybeSingle();

    if (!error && data) {
      return data as ReviewItem;
    }
  } catch {
    // Supabase insert failed, use file storage
  }

  const all = readFallbackReviews();
  all.unshift(item);
  writeFallbackReviews(all);
  return item;
}

export async function updateReviewStatus(id: string, status: 'approved' | 'rejected'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reviews')
      .update({ status })
      .eq('id', id);

    if (!error) return true;
  } catch {
    // fallback
  }

  const all = readFallbackReviews();
  const found = all.find((r) => r.id === id);
  if (found) {
    found.status = status;
    writeFallbackReviews(all);
    return true;
  }
  return false;
}

export async function deleteReview(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (!error) return true;
  } catch {
    // fallback
  }

  const all = readFallbackReviews();
  const filtered = all.filter((r) => r.id !== id);
  writeFallbackReviews(filtered);
  return true;
}
