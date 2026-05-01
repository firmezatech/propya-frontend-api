"use client";
import React from 'react';
import Footer from "./components/Footer";
import HeaderHome from "./components/HeaderHome"
import Home from './components/Home';
import { ProfileProvider } from './../context/ProfileContext';

export default function MainPage() {
  return (
    <ProfileProvider>
      <div className="min-h-screen flex flex-col">
        <HeaderHome />
        <main className="flex-grow">
          <Home />
        </main>
        <Footer />
      </div>
    </ProfileProvider>
  );
}
