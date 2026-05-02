"use client";

import React from 'react';
import Home from './components/Home';
import { ProfileProvider } from './../context/ProfileContext';
import { FmzPublicPageShell } from '../../components/layout';

export default function MainPage() {
  return (
    <ProfileProvider>
      <FmzPublicPageShell>
        <Home />
      </FmzPublicPageShell>
    </ProfileProvider>
  );
}
