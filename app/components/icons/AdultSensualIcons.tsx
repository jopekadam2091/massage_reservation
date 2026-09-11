import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  fill?: string;
  strokeWidth?: number;
}

/** 🧘‍♂️ Masáž celého tela - BODY (Full Body Silhouette) */
export function FullBodySilhouetteIcon({ size = 16, className = '', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Hlava */}
      <circle cx="12" cy="3.5" r="2" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity="0.25" />
      {/* Trup a silueta tela */}
      <path
        d="M7.5 7.5C8.5 6.8 10 6.5 12 6.5s3.5.3 4.5 1c1.2 1 1.5 3 .5 5l-1 2c-.3.6-.5 1.5-.5 2.5v5a1.5 1.5 0 0 1-3 0V17h-1v5a1.5 1.5 0 0 1-3 0v-5c0-1-.2-1.9-.5-2.5l-1-2c-1-2-.7-4 .5-5z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.2"
      />
    </svg>
  );
}

/** 🍑 Terapeutická masáž prostaty - BUTT (Sensual Butt / Rear Curves) */
export function ProstateButtIcon({ size = 16, className = '', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Zadné křivky / Glutes contour */}
      <path
        d="M12 5.5V17M12 17C10.5 17 5 15.5 4 10.5C3.2 6.5 6.5 4.5 9 5.2C10.5 5.6 11.5 6.5 12 7.5C12.5 6.5 13.5 5.6 15 5.2C17.5 4.5 20.8 6.5 20 10.5C19 15.5 13.5 17 12 17Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.25"
      />
      {/* 18+ intímny stredový bod a stimulácia */}
      <path d="M12 18V21M10 20h4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="12" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** 🩲 Senzuálna masáž slabín a triesiel - BOXERKY (Boxers / Groin) */
export function BoxersGroinIcon({ size = 16, className = '', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Elastický pás boxeriek */}
      <path d="M4.5 6h15" stroke="currentColor" strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
      {/* Telo boxeriek */}
      <path
        d="M5 6v7.5c0 1.2 1 2 2.5 2h1.5l1.5-3.5h3L15 15.5h1.5c1.5 0 2.5-.8 2.5-2V6H5z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.25"
      />
      {/* Prešitie a reliéf triesiel */}
      <path d="M10.5 12L9 6M13.5 12L15 6" stroke="currentColor" strokeWidth={strokeWidth * 0.75} strokeLinecap="round" strokeDasharray="1.5 2" />
    </svg>
  );
}

/** 👄 Senzuálne pery (Lips / Kiss) */
export function LipsIcon({ size = 16, className = '', fill = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 12C4 8 8 7 12 9.5C16 7 20 8 22 12C20 14 16 14.5 12 12.5C8 14.5 4 14 2 12Z"
        fill={fill}
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12C5 17 9 18.5 12 18.5C15 18.5 19 17 22 12C18 15 14 15 12 13C10 15 6 15 2 12Z"
        fill={fill}
        fillOpacity="0.35"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12C7 13.5 10 13.5 12 13C14 13.5 17 13.5 22 12"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 🪶 Senzuálne pierko (Feather / Sensual stroke) */
export function FeatherTouchIcon({ size = 16, className = '', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8L2 22M17.5 15H9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 🔥 Intímny plameň so srdiečkom (Intimate Flame Heart) */
export function IntimateFlameIcon({ size = 16, className = '', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Mini Heart Inside */}
      <path
        d="M12 18s-2-1.2-2-2.3a1.2 1.2 0 0 1 2-.9 1.2 1.2 0 0 1 2 .9c0 1.1-2 2.3-2 2.3z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 🥂 Šampanské / Drinky (Champagne Clink) */
export function ChampagneClinkIcon({ size = 16, className = '', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M8 22h8M12 15v7M8 15h8l1-8H7l1 8zM12 7V2M9 4l6-2M15 4L9 2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bublinky */}
      <circle cx="10" cy="10" r="1" fill="currentColor" />
      <circle cx="14" cy="12" r="0.75" fill="currentColor" />
      <circle cx="11.5" cy="8" r="0.75" fill="currentColor" />
    </svg>
  );
}

/** ⚡ Vibračná pištoľ / Perkusívna stimulácia (Percussive Gun) */
export function PercussiveTherapyIcon({ size = 16, className = '', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="5" width="10" height="6" rx="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M7 11v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-8" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="17" cy="8" r="3" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M21 5l1 1M21 11l1-1M22 8h1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

/** 💧 Hrejivý intímny olej s plamienkom (Intimate Hot Oil) */
export function IntimateHotOilIcon({ size = 16, className = '', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11c-.8 1.2-1.5 2-1.5 3a1.5 1.5 0 0 0 3 0c0-1-.7-1.8-1.5-3z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 🔞 Adult 18+ Symbol */
export function Adult18BadgeIcon({ size = 16, className = '', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="currentColor"
        letterSpacing="-0.5"
      >
        18+
      </text>
    </svg>
  );
}

/** 💆‍♀️ Senzuálny dotyk / Masáž (Sensual Touch) */
export function SensualTouchIcon({ size = 16, className = '', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8M6 14a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2c0 5 4 8 9 8h2a7 7 0 0 0 7-7v-3a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="19" cy="6" r="1.5" fill="currentColor" />
    </svg>
  );
}
