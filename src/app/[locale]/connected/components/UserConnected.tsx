"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from 'next/navigation';
import Link from "next/link";
import LanguageDropdown from "app/[locale]/components/ui/LanguageDropdown";
import { useTranslations } from 'next-intl';
import { useProfile } from '../../../context/ProfileContext';
import { clearFirmezaSession } from '../../../../services/auth/auth-storage';

// Define menu items to avoid repetition
export default function UserConnected() {
  const t = useTranslations('UserConnected');
  const common = useTranslations('Common');
  const { currentProfile, setCurrentProfile } = useProfile();

  const baseMenuItems = [
    {
      id: 'panel',
      label: t('myDashboard'),
      path: '/connected/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
          <path d="M9 21V9" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    },
    {
      id: 'contract',
      label: t('activeContract'),
      path: '/connected/activeContract',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 2H18C19.1046 2 20 2.89543 20 4V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2Z" stroke="currentColor" strokeWidth="2" />
          <path d="M8 7H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 'account',
      label: t('myAccount'),
      path: '/connected/account',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    }
  ];

  const menuItems = React.useMemo(() => {
   // console.log("currentProfile HeaderConn", currentProfile);
    if (currentProfile === 99 || currentProfile === null) {
      return baseMenuItems.filter(item => item.id !== 'contract');
    }
    return baseMenuItems;
  }, [currentProfile, baseMenuItems]);

  const [wallet, setWallet] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Load user data on component mount
  useEffect(() => {
    try {
      const storedWallet = localStorage.getItem("wallet");
      const storedName = localStorage.getItem("name");
      const storedProfile = localStorage.getItem("profile");
      if (storedWallet) setWallet(storedWallet);
      if (storedName) setName(storedName);
      if (storedProfile) setCurrentProfile(parseInt(storedProfile));
    } catch (err) {
      console.error("Error accessing localStorage:", err);
    }
  }, []);

  const handleLogout = () => {
    setWallet(null);
    setName(null);
    clearFirmezaSession();
    router.push('/');
    setShowDropdown(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setShowDropdown(false);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="flex items-center gap-4">
      <Link
        href="https://wa.me/5511964850279"
        target="_blank"
        className="text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        {common('help')}
      </Link>

      {wallet ? (
        <div className="relative flex items-center">
          {/* <LanguageDropdown/>   */}
          <button
            className="button-line-gray rounded-r-none border-r-0 flex items-center whitespace-nowrap"
            onClick={() => console.log("")}
          >
            <span>{name}</span>
            <span
              className="ml-1 cursor-pointer px-1 inline-flex items-center"
              onClick={toggleDropdown}
            >
              <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.8" d="M1 1L6 6L11 1" stroke="#666666" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>

          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute z-20 top-full right-0 mt-1 bg-white rounded shadow-lg border w-48"
            >
              {menuItems.map(item => {
                // Determine if the current menu item is active by comparing paths
                const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
                // Normalize paths to ignore locale prefix if present
                const normalizedCurrentPath = currentPath.replace(/^\/[a-z]{2}(\/|$)/, '/');
                const isActive = normalizedCurrentPath.startsWith(item.path);

                return (
                  <button
                    key={item.id}
                    className={`w-full bg-white px-4 py-4 text-left flex items-center gap-2 hover:bg-blue-50 transition-colors duration-150 ${
                      isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'
                    }`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.icon}
                    <span className={`text-sm ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}

              <button
                className="w-full bg-white text-gray-500 px-4 py-4 text-left flex items-center gap-2 hover:bg-blue-50 transition-colors duration-150"
                onClick={handleLogout}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 8V6C14 4.89543 13.1046 4 12 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H12C13.1046 20 14 19.1046 14 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M10 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 9L21 12L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm text-gray-500">{common('logout')}</span>
              </button>
            </div>
          )}
        </div>
      ) : (""
        // <button className="button-line px-3 py-2" onClick={() => router.push('/login')}>
        //   {common('login')}
        // </button>
      )}
      {error && <p className="text-red-500 text-font-inter text-xs">{error}</p>}
    </div>
  );
}
