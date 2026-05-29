'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type ProfileContextValue = {
  currentProfile: number | null;
  setCurrentProfile: (profile: number | null) => void;
  propertyId: number;
  setPropertyId: (id: number) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [currentProfile, setCurrentProfile] = useState<number | null>(null);
  const [propertyId, setPropertyId] = useState<number>(1);

  return (
    <ProfileContext.Provider value={{ currentProfile, setCurrentProfile, propertyId, setPropertyId }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
}
