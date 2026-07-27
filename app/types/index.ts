export type LangType = 'SK' | 'EN';
export type MassageType = 'Klasik' | 'VIP';
export type ContactMethod = 'phone' | 'instagram' | 'email';

export type Feature = { 
  text: string; 
  icon?: 'chili' | 'check';
};

export type PackageItem = {
  duration: number;
  badge: string;
  desc: string;
  features: Feature[];
};

export type PackagesData = {
  Klasik: PackageItem[];
  VIP: PackageItem[];
};

export interface StampRecord {
  id: string;
  price: number;
  claimed: boolean;
  created_at: string;
  claimed_at: string | null;
  removed_at: string | null;
}

export interface GiftRecord {
  id: string;
  gift_type: string;
  custom_code: string | null;
  used: boolean;
  created_at: string;
  revoked_at: string | null;
}

export interface UserBadge {
  badge_id: string;
  is_unlocked: boolean;
  unlocked_at: string | null;
  current_progress: number;
  max_progress: number;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role?: string | null;
  program_type: '5_stamps' | '10_stamps';
  referral_code: string | null;
  referred_by: string | null;
  referral_discount_status: string | null;
  is_banned?: boolean;
  birth_date?: string | null;
  stamps: StampRecord[];
  gifts: GiftRecord[];
  badges?: UserBadge[];
}

export type TimeSlot = {
  formattedTime: string;
  startIso: string;
  availableMinutes: number;
  discountPercent: number;
};

export type DiscountTheme = {
  fill: string;
  badgeText: string;
  border: string;
  borderHover: string;
  text: string;
  textAccent: string;
  glow: string;
  glowSoft: string;
  glowHover: string;
};