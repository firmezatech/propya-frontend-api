import { useState, useEffect } from 'react';

export function useWallet() {
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    // Carrega a carteira do localStorage
    const storedWallet = localStorage.getItem('wallet');
    if (storedWallet) {
      setWallet(storedWallet);
    }

    // Adiciona listener para mudanças na carteira
    const handleWalletChange = () => {
      const stored = localStorage.getItem('wallet');
      setWallet(stored);
    };

    window.addEventListener('walletChanged', handleWalletChange);
    return () => window.removeEventListener('walletChanged', handleWalletChange);
  }, []);

  return { wallet };
} 