"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useProfile } from "../../../context/ProfileContext";

import GameSystem from "../components/GameSystem";
import Leaderboard from "../components/Leaderboard";
import {
  getPropertyDetail,
  PropertyData,
  getRentDetail,
  RentDetailData,
  getInvestorDetail,
  InvestorData,
} from "../../../../services/web3-api";

export default function GamificationPage() {
  const router = useRouter();
  const t = useTranslations("Gamification");
  const comm = useTranslations("Common");
  const { currentProfile } = useProfile();

  const [propertyId] = useState<number>(1);
  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [investorDetail, setInvestorDetail] = useState<InvestorData | null>(null);
  const [rentDetail, setRentDetail] = useState<RentDetailData | null>(null);
  const [propertyDetail, setPropertyDetail] = useState<PropertyData | null>(null);
  const [userProfile, setUserProfile] = useState<'renter' | 'investor'>('renter');

  useEffect(() => {
    const handleWalletChange = () => {
      const storedWallet = localStorage.getItem("wallet");
      if (storedWallet) {
        setWallet(storedWallet);
      }
    };

    window.addEventListener('walletChanged', handleWalletChange);
    handleWalletChange();

    return () => {
      window.removeEventListener('walletChanged', handleWalletChange);
    };
  }, []);

  useEffect(() => {
    setInvestorDetail(null);
    setRentDetail(null);
    setPropertyDetail(null);

    if (!wallet) {
      setMessage(comm("pleaseLogin"));
      return;
    }

    setMessage(comm("loading"));

    const fetchData = async () => {
      try {
        const propertyDetails = await getPropertyDetail(propertyId);

        if (propertyDetails) {
          setPropertyDetail(propertyDetails);
          setMessage(comm("loading"));

          try {
            const rentDetails = await getRentDetail(propertyId);
            setRentDetail(rentDetails);

            setMessage(comm("loading"));
            try {
              const investorDetails = await getInvestorDetail(propertyId, wallet);
              setInvestorDetail(investorDetails);
              
              // Determine user profile
              if (investorDetails && (investorDetails.profile === 1 || investorDetails.profile === 3)) {
                setUserProfile('investor');
              } else if (rentDetails?.renter === wallet || (investorDetails && investorDetails.profile === 2)) {
                setUserProfile('renter');
              }
              
              setMessage("");
            } catch (err) {
              // User might be a renter if not found as investor
              if (rentDetails?.renter === wallet) {
                setUserProfile('renter');
                setMessage("");
              } else {
                setMessage(err instanceof Error ? err.message : t("errorLoadingData"));
              }
            }
          } catch (err) {
            setMessage(err instanceof Error ? err.message : t("errorLoadingData"));
          }
        } else {
          setMessage(t("propertyNotFound"));
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : t("errorLoadingData"));
        setInvestorDetail(null);
        setRentDetail(null);
        setPropertyDetail(null);
      }
    };

    fetchData();
  }, [wallet]);

  if (!wallet) {
    return (
      <div className="container w-full">
        <main className="mt-4 mb-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <h1 className="text-xl font-medium text-gray-700 mb-2">
                {comm("pleaseLogin")}
              </h1>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (message) {
    return (
      <div className="container w-full">
        <main className="mt-4 mb-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <h1 className="text-xl font-medium text-gray-700 mb-2">
                {message}
              </h1>
              <div className="animate-pulse bg-gray-200 rounded-md h-4 w-32 mx-auto"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="container w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/connected/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('backToDashboard')}
          </Link>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-800">{t('pageTitle')}</h1>
          <p className="text-gray-600">{t('pageSubtitle')}</p>
        </div>
      </div>

      <main className="mb-6">
        {/* Game System */}
        <div className="mb-8">
          <GameSystem
            rentDetail={rentDetail}
            propertyDetail={propertyDetail}
            investorDetail={investorDetail}
            userAddress={wallet}
            profile={userProfile}
          />
        </div>

        {/* Leaderboard */}
        <div className="mb-8">
          <Leaderboard
            currentUserAddress={wallet}
            currentUserProfile={userProfile}
          />
        </div>

        {/* Quick Access to Challenges */}
        <div className="mb-8">
          <Link
            href="/connected/challenges"
            className="block bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 shadow-lg border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">🎯</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Desafios Semanais</h3>
                  <p className="text-gray-600">Complete desafios especiais e ganhe recompensas exclusivas!</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                      5 Desafios Ativos
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                      Recompensas Especiais
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center text-orange-600">
                <span className="text-lg font-bold mr-2">Ver Desafios</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Additional Info Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📖 {t('howItWorks')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-lg mb-2">{t('earnPoints')}</h3>
              <p className="text-gray-600 text-sm">
                {t('earnPointsDesc')}
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="font-bold text-lg mb-2">{t('unlockAchievements')}</h3>
              <p className="text-gray-600 text-sm">
                {t('unlockAchievementsDesc')}
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="text-4xl mb-3">💎</div>
              <h3 className="font-bold text-lg mb-2">{t('claimRewards')}</h3>
              <p className="text-gray-600 text-sm">
                {t('claimRewardsDesc')}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
            <h3 className="font-bold text-lg mb-2">{t('specialFeatures')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                {t('feature1')}
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                {t('feature2')}
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                {t('feature3')}
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                {t('feature4')}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 