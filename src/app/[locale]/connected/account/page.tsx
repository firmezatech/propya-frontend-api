"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Info, ArrowLeft } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useProfile } from '../../../context/ProfileContext';

import { getUserByWallet, UserType, updateUser } from "../../../../services/login-fmz-api";

import {
    getPropertyDetail, PropertyData,
} from "../../../../services/web3-api";

export default function MyAccountPage() {
    const t = useTranslations('MyAccount');
    const common = useTranslations('Common');

    const router = useRouter();
    const { profile, setCurrentProfile } = useProfile();
    const [wallet, setWallet] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [propertyId, setPropertyId] = useState<number>(1);
    const [propertyDetail, setPropertyDetail] = useState<PropertyData | null>(null);

    const [userData, setUserData] = useState<UserType | null>(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const toggleCurrentPasswordVisibility = () => {
        setShowCurrentPassword(!showCurrentPassword);
    };

    const toggleNewPasswordVisibility = () => {
        setShowNewPassword(!showNewPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleSaveChanges = async () => {
        setError(null);
        if (!userData) return;

        if (!userData.currentPassword || userData.currentPassword.trim() === '') {
            setError(t('errorCurrentPasswordRequired') || '');
            return;
        }

        try {
            const response = await updateUser(userData);
            if (response.success) {
                setMessage(t('saveSuccess'));
                // Update userData and profile context with returned user data
                if (response.data && response.data.user) {
                    setUserData(response.data.user);
                    setCurrentProfile(profile);
                } else {
                    setCurrentProfile(profile);
                }
            } else {
                setError(response.error?.description || t('saveError'));
            }
        } catch (error) {
            setError(t('saveError'));
        }
    };

    const handleBackNavigation = () => {
        router.back();
    };

    useEffect(() => {
        setError(null);
        setMessage(null);
        const storedWallet = localStorage.getItem("wallet");
        if (storedWallet && !wallet) {
            setWallet(storedWallet);
        }

        const fetchData = async () => {
            try {
                if (!wallet) return;

                const response = await getUserByWallet(wallet);

                if (!response) {
                    setMessage(common('dataNotAvailable'));
                    setUserData(null);
                } else {
                    setUserData(response);
                }

                const propertyDetails = await getPropertyDetail(propertyId);
                setPropertyDetail(propertyDetails);

            } catch (err) {
                setError(common('errorLoadingData'));
            }
        };

        if (wallet) {
            fetchData();
        }
    }, [wallet]);

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex items-center w-full gap-3 mb-4">
                <button onClick={handleBackNavigation} className="text-gray-400 button-line-transparent border border-white text-sm py-1">
                    <ArrowLeft size={28} />
                </button>
            </div>
            <h2 className="text-4xl mb-6">{t('title')}</h2>
            {userData ? (

                <div className="max-w-6xl">
                    {message ? (
                        <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
                            {message}
                        </div>
                    ) : ""}

                    {error ? (
                        <div className="mb-6 rounded-md p-4 text-sm bg-red-50 text-blue-700 border-l-4 border-red-500">
                            {error}
                        </div>
                    ) : ""}

                    <div className="flex flex-col md:flex-row gap-6 mt-6">
                        {/* Left column - Form fields */}
                        <div className="md:w-3/4 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input
                                    type="hidden"
                                    value={userData._id || ''}
                                    onChange={(e) => setUserData({ ...userData, _id: e.target.value })}
                                />
                                {/* Full Name */}
                                <div className="flex flex-col">
                                    <label className="text-gray-700 font-normal mb-2">{t('labelName')} *</label>
                                    <input
                                        type="text"
                                        className="px-4 py-3 w-full bg-gray-50 border border-gray-200 rounded-md text-sm"
                                        value={userData.name || ''}
                                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                    />
                                </div>

                                {/* Contact (WhatsApp) */}
                                <div className="flex flex-col">
                                    <label className="text-gray-700 font-normal mb-2">{t('labelPhone')} *</label>
                                    <input
                                        type="text"
                                        className="px-4 py-3 w-full bg-gray-50 border border-gray-200 rounded-md text-sm"
                                        value={userData.phone || ''}
                                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                                    />
                                </div>

                                {/* Birth Date */}
                                <div className="flex flex-col">
                                    <label className="text-gray-700 font-normal mb-2">{t('labelBirthdate')} *</label>
                                    <input
                                        type="text"
                                        className="px-4 py-3 w-full bg-gray-50 border border-gray-200 rounded-md text-sm"
                                        value={userData.birthdate || ''}
                                        onChange={(e) => setUserData({ ...userData, birthdate: e.target.value })}
                                    />
                                </div>

                                {/* Email */}
                                <div className="flex flex-col">
                                    <label className="text-gray-700 font-normal mb-2">{t('labelEmail')} *</label>
                                    <input
                                        type="email"
                                        className="px-4 py-3 w-full bg-gray-50 border border-gray-200 rounded-md text-sm"
                                        value={userData.email || ''}
                                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-gray-700 font-normal mb-2">{t('labelCurrentPassword')} * </label>
                                    <input type="password" name="fakePassword" autoComplete="new-password" className="hidden" />

                                    <div className="relative w-full">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            autoComplete="current-xx-Password"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm"
                                            value={userData.currentPassword || ''}
                                            onChange={(e) => setUserData({ ...userData, currentPassword: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="button-line-transparent absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                                            onClick={toggleCurrentPasswordVisibility}
                                        >
                                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <br />
                                {/* Password */}
                                <div className="flex flex-col">
                                    <label className="text-gray-700 font-normal mb-2">{t('labelNewPassword')}</label>
                                    <div className="relative w-full">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm"
                                            value={userData.newPassword || ''}
                                            autoComplete="off"
                                            onChange={(e) => setUserData({ ...userData, newPassword: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="button-line-transparent absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                                            onClick={toggleNewPasswordVisibility}
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-gray-700 font-normal mb-2">{t('labelConfirmPassword')}</label>
                                    <div className="relative w-full">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm"
                                            value={userData.confirmPassword || ''}
                                            autoComplete="off"
                                            onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="button-line-transparent absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                                            onClick={toggleConfirmPasswordVisibility}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={handleSaveChanges}
                                    className="bg-blue-600 text-base text-white font-bold px-16 py-4 rounded-full"
                                >
                                    {t('saveChanges')}
                                </button>
                            </div>
                        </div>

                        {/* Right column - Blockchain Information */}
                             {/* <div className="md:w-3/4 p-8 h-fit">
                                <div className="flex flex-col mb-6">
                                    <div className="flex items-center mb-3">
                                        <label className="text-gray-700 font-medium">{t('blockchainIdLabel')}</label>
                                        <div className="relative group ml-2">
                                            <Info size={16} className="text-gray-500" />
                                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                                                {t('blockchainIdTooltip')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 p-8 rounded-md text-blue-700 break-words text-sm">
                                        {userData.wallet || ''}
                                    </div>
                                </div>

                                {propertyDetail && (
                                    <div>
                                        <p className="text-gray-700 text-base">
                                            {t('transactionHistory')}
                                            <a href={propertyDetail.blockExplorerUrl} target="_blank" className="text-blue-600 hover:underline ml-1">{t('transactionHistoryLink')}</a>
                                            {t('transactionHistoryContinuation')}
                                        </p>
                                    </div>
                                )}
                            </div>  */}
                    </div>
                </div>
            ) : (
                <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
                    {message}
                </div>
            )
            }
        </div >
    );
}
