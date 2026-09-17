import { DiscountTheme } from '@/app/types';

export const DEFAULT_DISCOUNT_THEME: DiscountTheme = {
  fill: '#06b6d4',
  badgeText: '#ffffff',
  border: 'rgba(34,211,238,0.6)',
  borderHover: '#22d3ee',
  text: '#22d3ee',
  textAccent: '#67e8f9',
  glow: 'rgba(34,211,238,0.85)',
  glowSoft: 'rgba(34,211,238,0.45)',
  glowHover: 'rgba(34,211,238,0.65)',
};

export const featureIcons: Record<string, string> = {
  chili: '🌶️',
  check: '💎',
};

export const PRICES = {
  Klasik: { 30: '30 €', 45: '40 €', 60: '45 €' },
  VIP: { 45: '65 €', 60: '70 €', 90: '90 €' }
} as const;