'use client';

type Props = {
  onEnter: () => void;
  t: {
    massage: string;
    massageHoverCta: string;
  };
};

export default function LandingScreen({ onEnter, t }: Props) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#1a1a1a]">
      <button
        type="button"
        onClick={onEnter}
        className="group flex flex-col items-center justify-center gap-2 rounded-3xl px-16 py-14 bg-[#2a2a2a] hover:bg-[#8EB69B] transition-all duration-300"
      >
        <div
          className="w-32 h-32 mb-2 bg-[#7a7a7a] group-hover:bg-[#051F20] group-hover:scale-110 transition-all duration-300"
          style={{
            WebkitMask: 'url(/logo_massage.svg) no-repeat center / contain',
            mask: 'url(/logo_massage.svg) no-repeat center / contain',
          }}
        />
        <span className="relative h-[3rem] flex items-center justify-center text-[2.5rem] font-light tracking-widest uppercase text-white group-hover:text-[#051F20] transition-colors duration-300">
          <span className="opacity-100 group-hover:opacity-0 transition-opacity duration-300">{t.massage}</span>
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {t.massageHoverCta}
          </span>
        </span>
      </button>
    </div>
  );
}