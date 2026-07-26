'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';

interface AvatarContextType {
  avatarIcon: string;
  avatarColor: string;
  setAvatarSettings: (icon: string, color: string) => void;
  loadAvatarForUser: (userId: string) => Promise<void>;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatarIcon, setAvatarIcon] = useState<string>('User');
  const [avatarColor, setAvatarColor] = useState<string>('#10b981');

  const setAvatarSettings = (icon: string, color: string) => {
    if (icon) setAvatarIcon(icon);
    if (color) setAvatarColor(color);
  };

  const loadAvatarForUser = async (userId: string) => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_icon, avatar_color')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        if (data.avatar_icon) setAvatarIcon(data.avatar_icon);
        if (data.avatar_color) setAvatarColor(data.avatar_color);
      }
    } catch (err) {
      console.error('Chyba pri načítaní avatara v Context-e:', err);
    }
  };

  useEffect(() => {
    const initAvatar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadAvatarForUser(session.user.id);
      }
    };

    initAvatar();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadAvatarForUser(session.user.id);
      } else {
        setAvatarIcon('User');
        setAvatarColor('#10b981');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AvatarContext.Provider
      value={{
        avatarIcon,
        avatarColor,
        setAvatarSettings,
        loadAvatarForUser,
      }}
    >
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) {
    throw new Error('useAvatar musí byť použité vnútri AvatarProvider');
  }
  return ctx;
}