'use client';
import { LangType } from '@/app/types';

type Props = {
  lang: LangType;
  setLang: (lang: LangType) => void;
};

export default function LanguageSwitcher({ lang, setLang }: Props) {
  return (
    <div className="absolute top-6 right-6 z-50 flex space-x-2 bg-[#0B2B26]/60 p-1 rounded-full backdrop-blur-sm border border-[#235347] font-sans">
      <button
        type="button"
        onClick={() => setLang('SK')}
        className={`px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center space-x-1 ${
          lang === 'SK' ? 'bg-[#DAF1DE] text-[#051F20] shadow' : 'text-[#8EB69B] hover:text-[#DAF1DE]'
        }`}
      >
        <span>🇸🇰</span> <span>SK</span>
      </button>
      <button
        type="button"
        onClick={() => setLang('EN')}
        className={`px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center space-x-1 ${
          lang === 'EN' ? 'bg-[#DAF1DE] text-[#051F20] shadow' : 'text-[#8EB69B] hover:text-[#DAF1DE]'
        }`}
      >
        <span>🇬🇧</span> <span>EN</span>
      </button>
    </div>
  );
}