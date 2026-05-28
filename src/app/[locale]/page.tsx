"use client";

import React from 'react';
import Home from './components/Home';
import { ProfileProvider } from './../context/ProfileContext';

export default function MainPage() {
  return (
    <ProfileProvider>
      <Home />
    </ProfileProvider>
  );
}
