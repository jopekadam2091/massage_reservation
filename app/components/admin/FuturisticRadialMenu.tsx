'use client';

import React, { useState, useEffect } from 'react';
import styles from './FuturisticRadialMenu.module.css';
import { 
  Zap, Flame, Clock, Trash2, Palmtree, UserPlus, Wand2, LucideIcon 
} from 'lucide-react';

export type RadialMenuItem = {
  id: string;
  label: string;
  angle: number;
  color: string;
  className: string;
  icon: LucideIcon;
};

type Props = {
  activeId: string | null;
  onSelect: (id: string) => void;
  selectedCount?: number;
  children?: React.ReactNode;
};

// 🌟 POLOŽKY VEJÁRA S ROZLOŽENÍM PRE ĽAVÚ STRANU
export const DEFAULT_RADIAL_ITEMS: RadialMenuItem[] = [
  { id: 'presets', label: 'Presets', angle: 330, color: '#3B82F6', className: styles.itemPresets, icon: Zap },            // Modrá
  { id: 'tags', label: 'Akcie', angle: 15, color: '#F97316', className: styles.itemTags, icon: Flame },                   // Oranžová
  { id: 'timeslot', label: 'Pridať slot', angle: 60, color: '#10B981', className: styles.itemTimeslot, icon: Clock },     // Zelená
  { id: 'delete', label: 'Zmazať', angle: 105, color: '#EF4444', className: styles.itemDelete, icon: Trash2 },            // Červená
  { id: 'vacation', label: 'Voľno', angle: 150, color: '#EAB308', className: styles.itemVacation, icon: Palmtree },       // Žltá
  { id: 'direct', label: 'Rezervácia', angle: 285, color: '#8B5CF6', className: styles.itemMore, icon: UserPlus },        // Fialová
];

export default function FuturisticRadialMenu({ activeId, onSelect, selectedCount = 0, children }: Props) {
  const [isOpen, setIsOpen] = useState(true); // Otvorené pre okamžitý prístup
  const [knobAngle, setKnobAngle] = useState(0);

  const activeItem = DEFAULT_RADIAL_ITEMS.find((i) => i.id === activeId) || null;
  const activeColor = activeItem ? activeItem.color : '#6633EE';

  // 🎯 Synchronizácia rotácie otočného gombíka pri výbere / zmene nástroja
  useEffect(() => {
    if (activeItem) {
      const targetRotation = (activeItem.angle - 270 + 360) % 360;
      setKnobAngle(targetRotation);
    } else {
      setKnobAngle(0);
    }
  }, [activeId, activeItem]);

  const toggleMenu = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && activeItem) {
      const targetRotation = (activeItem.angle - 270 + 360) % 360;
      setKnobAngle(targetRotation);
    }
  };

  const handleSelect = (id: string, angle: number) => {
    const targetRotation = (angle - 270 + 360) % 360;
    setKnobAngle(targetRotation);
    onSelect(id);
  };

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] p-4 sm:p-5 shadow-sm transition-all duration-300 min-h-[385px] lg:h-[385px] flex flex-col justify-center">
      
      {/* 🚀 HLAVNÝ RIADIACI PANEL (ĽAVÁ STRANA: KNOB, PRAVÁ STRANA: GLOW ČIARA & POD-MENU DÁTA) */}
      <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-4 sm:gap-6 relative min-h-[345px] lg:h-[345px]">
        
        {/* 🔘 1. ĽAVÁ ČASŤ: OTOČNÝ GOMBÍK S RADIÁLNYM VEJÁROM */}
        <div className="flex flex-col items-center justify-center p-2 shrink-0">
          <div
            className={`${styles.selectorContainer} ${isOpen ? styles.active : ''}`}
            style={{ 
              '--radius': '76px', 
              '--knob-angle': `${knobAngle}deg`,
              '--active-color': activeColor,
              '--active-glow': `${activeColor}88`
            } as any}
          >
            {/* CENTRÁLNY OTOČNÝ GOMBÍK S FIXNÝM BADGE A PROTI-ROTUJÚCOU IKONOU */}
            <div className="relative flex items-center justify-center">
              <div className={styles.knob} onClick={toggleMenu} title="Helper Rotary Menu">
                <div className={styles.knobIndicator} />
                <div className={styles.knobIcon}>
                  <Wand2 size={20} />
                </div>
              </div>
              {selectedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#6633EE] text-white text-[10px] font-bold flex items-center justify-center shadow-sm pointer-events-none z-30">
                  {selectedCount}
                </span>
              )}
            </div>

            {/* RADIÁLNY VEJÁR TLAČIDIEL */}
            <ul className={styles.menuList}>
              {DEFAULT_RADIAL_ITEMS.map((item) => (
                <li
                  key={item.id}
                  className={`${styles.menuItem} ${item.className} ${activeId === item.id ? styles.selectedItem : ''}`}
                  style={{ '--angle': `${item.angle}deg` } as any}
                  onClick={() => handleSelect(item.id, item.angle)}
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                  <input
                    type="radio"
                    name="futuristic-menu"
                    checked={activeId === item.id}
                    onChange={() => handleSelect(item.id, item.angle)}
                  />
                </li>
              ))}
            </ul>
          </div>
          <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#C7CAE0]/60 mt-1">
            {activeItem ? activeItem.label : 'Vyberte nástroj'}
          </span>
        </div>

        {/* ⚡ 2. SPOJOVACIA JEMNÁ GLOW ČIARA OD ZVOLENEJ IKONKY K DÁTAM */}
        {activeItem && children && (
          <div className="hidden lg:flex items-center justify-center w-8 relative shrink-0">
            <div
              className="w-full h-0.5 rounded-full transition-all duration-500"
              style={{
                background: `linear-gradient(to right, ${activeColor}, ${activeColor}88)`,
                boxShadow: `0 0 12px ${activeColor}, 0 0 4px ${activeColor}`,
              }}
            />
            {/* Svietiaci bod na spoji */}
            <span
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{ background: activeColor, boxShadow: `0 0 10px ${activeColor}` }}
            />
          </div>
        )}

        {/* 📋 3. PRAVÁ ČASŤ: DÁTOVÝ POD-PANEL PRE ZVOLENÚ IKONKU (STABILNÁ FIXNÁ VÝŠKA SO SMOOTH TRANSITION) */}
        {activeItem && children ? (
          <div
            className="flex-1 w-full min-w-0 p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative h-[345px] min-h-[345px] max-h-[345px] overflow-y-auto flex flex-col justify-between"
            style={{
              borderColor: `${activeColor}40`,
              boxShadow: `0 8px 30px ${activeColor}15`,
            }}
          >
            {/* Jemný glow akcent v rohu panelu */}
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 pointer-events-none blur-2xl"
              style={{ background: activeColor }}
            />
            <div className="w-full relative z-10">{children}</div>
          </div>
        ) : (
          <div className="flex-1 w-full min-w-0 p-6 rounded-2xl border border-dashed border-[#E2E8F0] dark:border-[#2B2F49] flex items-center justify-center text-center text-xs text-[#64748B] dark:text-[#C7CAE0]/60 h-[345px] min-h-[345px] max-h-[345px]">
            Kliknite na otočný gombík a vyberte požadovaný nástroj (Presets, Akcie, Pridať slot, Zmazať, Voľno, Rezervácia).
          </div>
        )}

      </div>
    </div>
  );
}
