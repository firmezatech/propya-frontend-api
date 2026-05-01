'use client';

import React, { useState, useEffect } from "react";
import { useProfile } from "../../../context/ProfileContext";
import InvestorsList from "../records/InvestorsList";

export default function InvestListPage() {
  const { propertyId, currentProfile } = useProfile();
  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet && !wallet) {
      setWallet(storedWallet);
    }

    if (wallet) {
      if (!wallet) {
        setMessage("Por favor, faça o login.");
        return;
      }
    }
  }, [wallet]);
  
  return (
    <div className="container">
      <main className="mt-4 mb-6">
        <InvestorsList profile={currentProfile} propertyId={propertyId}/>
      </main>
    </div>
  );
}