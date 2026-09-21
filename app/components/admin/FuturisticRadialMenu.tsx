'use client';

import React from 'react';
import { 
  Clock, Trash2, Palmtree, UserPlus, LucideIcon, Calendar
} from 'lucide-react';

export type CommandToolItem = {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  color: string;
  activeBg: string;
};

export const TOP_ADD_TOOLS: CommandToolItem[] = [
  { 
    id: 'direct', 
    label: 'Pridať rezerváciu', 
    shortLabel: 'Rezervácia',
    icon: UserPlus, 
    color: '#8B5CF6',
    activeBg: 'bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#A78BFA] border-[#8B5CF6]/50 shadow-xs ring-1 ring-[#8B5CF6]/30 font-bold'
  },
  { 
    id: 'timeslot', 
    label: 'Pridať voľný slot', 
    shortLabel: 'Voľný slot',
    icon: Clock, 
    color: '#10B981',
    activeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30 font-bold'
  },
  { 
    id: 'vacation', 
    label: 'Pridať voľno', 
    shortLabel: 'Voľno',
    icon: Palmtree, 
    color: '#EAB308',
    activeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/50 shadow-xs ring-1 ring-amber-500/30 font-bold'
  },
];

export const TOP_DELETE_TOOL: CommandToolItem = {
  id: 'delete', 
  label: 'Vymazať', 
  shortLabel: 'Vymazať',
  icon: Trash2, 
  color: '#EF4444',
  activeBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/50 shadow-xs ring-1 ring-rose-500/30 font-bold'
};

const ALL_TOOLS = [...TOP_ADD_TOOLS, TOP_DELETE_TOOL];

type Props = {
  activeId: string | null;
  onSelect: (id: string) => void;
  selectedCount?: number;
  children?: React.ReactNode;
};

export default function FuturisticRadialMenu({ activeId, onSelect, selectedCount = 0, children }: Props) {
  const activeTool = ALL_TOOLS.find((i) => i.id === activeId) || null;
  const activeColor = activeTool ? activeTool.color : '#6633EE';

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-[#0B0D22] border border-[#E2E8F0] dark:border-[#2B2F49] p-2.5 sm:p-3 shadow-sm transition-all duration-300 space-y-2.5">
      
      {/* 🚀 JEDEN RIADOK: VĽAVO (REZERVÁCIA, VOĽNÝ SLOT, VOĽNO) | JEMNÁ ČIARA | VPRAVO (VYMAZAŤ) */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
        
        {/* ĽAVÁ STRANA: AKCIE PRIDÁVANIA */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
          {TOP_ADD_TOOLS.map((tool) => {
            const isActive = activeId === tool.id;
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelect(tool.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 sm:px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer select-none border shrink-0 ${
                  isActive
                    ? tool.activeBg
                    : 'bg-slate-50 dark:bg-[#010314] hover:bg-slate-100 dark:hover:bg-[#1E2238] border-[#E2E8F0] dark:border-[#2B2F49] text-[#64748B] dark:text-[#C7CAE0]/80 hover:text-[#0B0D22] dark:hover:text-white'
                }`}
                title={tool.label}
              >
                <div 
                  className="w-4 h-4 flex items-center justify-center shrink-0"
                  style={{ color: tool.color }}
                >
                  <Icon size={15} />
                </div>
                <span className="hidden sm:inline whitespace-nowrap">{tool.label}</span>
                <span className="sm:hidden whitespace-nowrap">{tool.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* JEMNÁ ZVISLÁ ODDEĽOVACIA ČIARA */}
        <div className="h-6 w-px bg-slate-200 dark:bg-[#2B2F49] mx-1 shrink-0" />

        {/* PRAVÁ STRANA: VYMAZAŤ */}
        <div className="shrink-0 flex items-center gap-2">
          {selectedCount > 0 && (
            <div className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#6633EE]/10 text-[#6633EE] dark:text-[#A78BFA] text-[11px] font-bold shrink-0">
              <Calendar size={12} />
              <span>{selectedCount} dní</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onSelect(TOP_DELETE_TOOL.id)}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 sm:px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer select-none border shrink-0 ${
              activeId === TOP_DELETE_TOOL.id
                ? TOP_DELETE_TOOL.activeBg
                : 'bg-slate-50 dark:bg-[#010314] hover:bg-rose-50 dark:hover:bg-rose-950/20 border-[#E2E8F0] dark:border-[#2B2F49] text-rose-600 dark:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800/50'
            }`}
            title={TOP_DELETE_TOOL.label}
          >
            <TOP_DELETE_TOOL.icon size={15} className="shrink-0 text-rose-500" />
            <span className="whitespace-nowrap">{TOP_DELETE_TOOL.label}</span>
          </button>
        </div>

      </div>

      {/* 📋 OTVORENÝ PANEL VYBRATÉHO NÁSTROJA (AK JE AKTÍVNY) */}
      {activeTool && children && (
        <div
          className="w-full rounded-xl p-3.5 sm:p-5 border transition-all duration-300 relative overflow-hidden bg-slate-50/50 dark:bg-[#010314]/60 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            borderColor: `${activeColor}40`,
            boxShadow: `0 8px 30px ${activeColor}15`,
          }}
        >
          {/* Jemný blur glow akcent v pravom hornom rohu panelu */}
          <div
            className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-15 pointer-events-none blur-2xl"
            style={{ background: activeColor }}
          />

          <div className="w-full relative z-10 max-h-[540px] overflow-y-auto pr-0.5 custom-scrollbar">
            {children}
          </div>
        </div>
      )}

    </div>
  );
}
