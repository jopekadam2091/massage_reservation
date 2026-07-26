'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from '../lib/ThemeContext';

interface QrCodeGeneratorProps {
  profileId: string;
}

export default function QrCodeGenerator({ profileId }: QrCodeGeneratorProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-4 bg-white rounded-2xl shadow-sm">
        <QRCodeSVG 
          value={profileId} 
          size={200} 
          level="M"
          fgColor={isDark ? '#0f172a' : '#000000'} 
          bgColor={isDark ? '#f8fafc' : '#ffffff'} 
        />
      </div>
    </div>
  );
}