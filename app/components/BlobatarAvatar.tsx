'use client';

import React from 'react';
import { Blobatar } from '@blobatar/react';
import { useAvatar } from '../lib/AvatarContext';
import {
  idle,
  happy,
  love,
  wink,
  smug,
  shy,
  surprised,
  thinking,
  sleepy,
  unsure,
  scared,
  sick,
  sad,
  mad,
} from 'blobatar/expression';

const RAW_EXPRESSIONS: Record<string, any> = {
  idle,
  happy,
  love,
  wink,
  smug,
  shy,
  surprised,
  thinking,
  sleepy,
  unsure,
  scared,
  sick,
  sad,
  mad,
};

// Expressions without tinting so facial expressions only change eyes/pose/mood and never override the character color
export const BLOBATAR_EXPRESSIONS: Record<string, any> = Object.fromEntries(
  Object.entries(RAW_EXPRESSIONS).map(([k, v]) => [
    k,
    v ? { ...v, tint: undefined, p: v.p ? { ...v.p, heat: 0 } : v.p } : v,
  ])
);

import {
  Smile,
  Heart,
  Sparkles,
  Flame,
  Zap,
  HelpCircle,
  Eye,
  Lightbulb,
  Moon,
  LucideIcon
} from 'lucide-react';

export interface ExpressionItem {
  id: string;
  label: string;
  labelEn: string;
  icon: LucideIcon;
}

export const AVAILABLE_EXPRESSIONS: ExpressionItem[] = [
  { id: 'happy', label: 'Šťastný', labelEn: 'Happy', icon: Smile },
  { id: 'love', label: 'Zamilovaný', labelEn: 'In love', icon: Heart },
  { id: 'wink', label: 'Žmurk', labelEn: 'Wink', icon: Sparkles },
  { id: 'idle', label: 'Zen / Kľud', labelEn: 'Calm', icon: Flame },
  { id: 'smug', label: 'Sebavedomý', labelEn: 'Smug', icon: Zap },
  { id: 'shy', label: 'Hanblivý', labelEn: 'Shy', icon: HelpCircle },
  { id: 'surprised', label: 'Prekvapený', labelEn: 'Surprised', icon: Eye },
  { id: 'thinking', label: 'Premýšľa', labelEn: 'Thinking', icon: Lightbulb },
  { id: 'sleepy', label: 'Ospalý', labelEn: 'Sleepy', icon: Moon },
];

/**
 * Calculates high-contrast eye color based on head color luminance
 */
export function getContrastEye(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith('#')) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6 && hex.length !== 3) return '#FFFFFF';
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0B0D22' : '#FFFFFF';
}

/**
 * Parses a combined string like "lotus:happy" or "zen-master" into { seed, expression }
 */
export function parseAvatarString(avatarStr?: string | null): { seed: string; expression: string } {
  if (!avatarStr || !avatarStr.trim()) {
    return { seed: 'ZenFlow', expression: 'idle' };
  }

  const clean = avatarStr.trim();
  if (clean.includes(':')) {
    const parts = clean.split(':');
    return {
      seed: parts[0] || 'ZenFlow',
      expression: parts[1] || 'idle',
    };
  }

  // Handle legacy icon names smoothly
  return {
    seed: clean,
    expression: 'idle',
  };
}

export interface BlobatarAvatarProps {
  name?: string | null;
  seed?: string | null;
  size?: number;
  animate?: 'always' | 'hover' | false;
  expression?: string;
  color?: string | null;
  hue?: number;
  tone?: number;
  background?: 'squircle' | 'circle' | 'square' | false;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  onClick?: () => void;
}

/**
 * 🎨 BlobatarAvatar - Deterministic geometric blobatars from https://blobatar.dev/
 */
export default function BlobatarAvatar({
  name,
  seed,
  size = 40,
  animate = 'hover',
  expression,
  color,
  hue,
  tone,
  background = false,
  className = '',
  style,
  title,
  onClick,
}: BlobatarAvatarProps) {
  // Optional context color lookup
  let contextColor: string | undefined;
  try {
    const ctx = useAvatar();
    contextColor = ctx?.avatarColor;
  } catch {
    // In case component is rendered outside provider
  }

  const effectiveColor = color !== undefined ? color : contextColor;
  const isAuto = !effectiveColor || effectiveColor === 'auto' || effectiveColor === 'system';

  const rawInput = seed || name || 'ZenFlow';
  const parsed = parseAvatarString(rawInput);

  const effectiveSeed = parsed.seed;
  const effectiveExpression = expression || parsed.expression || 'idle';

  const exprObj = effectiveExpression && BLOBATAR_EXPRESSIONS[effectiveExpression]
    ? BLOBATAR_EXPRESSIONS[effectiveExpression]
    : undefined;

  const effectiveAnimate = animate === 'always' || animate === 'hover' ? animate : undefined;

  // If a specific hex color is chosen, override palette to recolor head and eyes
  const palette = (!isAuto && effectiveColor && effectiveColor.startsWith('#'))
    ? { head: effectiveColor, eye: getContrastEye(effectiveColor) }
    : undefined;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none overflow-visible ${className}`}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      title={title}
      onClick={onClick}
    >
      <Blobatar
        name={effectiveSeed}
        size={size}
        animate={effectiveAnimate}
        expression={exprObj}
        palette={palette}
        hue={hue}
        tone={tone}
        background={background}
      />
    </div>
  );
}
