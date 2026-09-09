'use client';

import React from 'react';
import { Sparkles, Clock, CalendarCheck, Check } from 'lucide-react';
import { MassageType } from '@/app/types';

interface StepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  language: 'sk' | 'en';
  selectedType?: MassageType | null;
}

export default function Stepper({ currentStep, onStepClick, language, selectedType }: StepperProps) {
  const isVip = selectedType === 'VIP';

  const steps = [
    {
      id: 1,
      title: language === 'sk' ? 'Typ masáže' : 'Massage Type',
      subtitle: language === 'sk' ? 'Výber úrovne' : 'Select Level',
      icon: Sparkles,
    },
    {
      id: 2,
      title: language === 'sk' ? 'Dĺžka & Balík' : 'Duration & Package',
      subtitle: language === 'sk' ? 'Trvanie masáže' : 'Select Duration',
      icon: Clock,
    },
    {
      id: 3,
      title: language === 'sk' ? 'Termín & Údaje' : 'Date & Details',
      subtitle: language === 'sk' ? 'Rezervácia času' : 'Book Time Slot',
      icon: CalendarCheck,
    },
  ];

  // Calculate animated progress bar percentage (0%, 50%, 100%)
  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full max-w-xl mx-auto my-6 px-2 font-sans">
      <div className="relative flex items-center justify-between">
        
        {/* 1. BACKGROUND CONNECTOR TRACK LINE */}
        <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-[#E2E8F0] dark:bg-[#2B2F49] rounded-full z-0 overflow-hidden">
          {/* ANIMATED PROGRESS FILL LINE */}
          <div 
            className={`h-full transition-all duration-500 ease-out rounded-full ${
              isVip
                ? 'bg-gradient-to-r from-[#FF5A7A] via-[#F43F5E] to-[#E11D48] shadow-[0_0_12px_rgba(255,90,122,0.8)]'
                : 'bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-[#38BDF8] shadow-[0_0_12px_rgba(2,132,199,0.8)]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 2. STEP ITEMS */}
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div 
              key={step.id} 
              className="relative z-10 flex flex-col items-center group cursor-pointer"
              onClick={() => {
                if (onStepClick && step.id < currentStep) {
                  onStepClick(step.id);
                }
              }}
            >
              {/* STEP CIRCLE INDICATOR */}
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-xs transition-all duration-300 relative ${
                  isCompleted
                    ? isVip
                      ? 'bg-[#E11D48] text-white shadow-[0_0_14px_rgba(225,29,72,0.5)] scale-100'
                      : 'bg-[#0284C7] text-white shadow-[0_0_14px_rgba(2,132,199,0.5)] scale-100'
                    : isActive
                    ? isVip
                      ? 'bg-gradient-to-b from-[#FF5A7A] to-[#E11D48] text-white shadow-[0_0_20px_rgba(255,90,122,0.7)] ring-4 ring-[#FF5A7A]/30 scale-105'
                      : 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white shadow-[0_0_20px_rgba(2,132,199,0.7)] ring-4 ring-[#0284C7]/30 scale-105'
                    : 'bg-white dark:bg-[#0B0D22] text-[#94A3B8] dark:text-[#C7CAE0]/60 border border-[#E2E8F0] dark:border-[#2B2F49]'
                }`}
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={2.5} className="animate-in zoom-in-50 duration-200" />
                ) : (
                  <StepIcon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                )}

                {/* ACTIVE STEP AMBIENT GLOW RING */}
                {isActive && (
                  <span className={`absolute inset-0 rounded-full animate-ping pointer-events-none ${
                    isVip ? 'bg-[#FF5A7A]/30' : 'bg-[#0284C7]/30'
                  }`} />
                )}
              </div>

              {/* STEP TITLE & SUBTITLE */}
              <div className="mt-2.5 text-center transition-all duration-300">
                <p 
                  className={`text-xs font-medium tracking-tight ${
                    isActive || isCompleted
                      ? 'text-[#0B0D22] dark:text-[#FFFFFF]'
                      : 'text-[#94A3B8] dark:text-[#C7CAE0]/60'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-[10px] text-[#64748B] dark:text-[#C7CAE0]/50 hidden sm:block">
                  {step.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
