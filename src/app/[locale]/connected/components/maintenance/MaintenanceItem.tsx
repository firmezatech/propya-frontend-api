"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { MaintenanceData } from "../../../../../services/web3-api";
import { X } from 'lucide-react';

type Props = {
  maintenanceList: MaintenanceData[];
  maintenanceTotal: string | null;
  isAdminView?: boolean;
};

const MaintenanceItem: React.FC<Props> = ({ maintenanceList, maintenanceTotal, isAdminView = false }) => {
  const t = useTranslations("MaintenanceItem");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const openModal = (image: string) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage('');
  };

  return (
    <div className="mt-2">

      <div className="mt-2 space-y-2">

      {maintenanceTotal !== "" && (
        <p className="text-sm">
          <strong>{t("totalMaintenance")}:</strong>
          <span className="text-sx"> {maintenanceTotal}</span>
        </p>
      )}

        {maintenanceList.map((item) => (
          <div
            key={item.maintenanceId}
            className="p-4 border rounded bg-white shadow flex"
          >
            <div className="flex-1 pr-4">
              <p className="text-sm mb-1">
                <strong>{t("number")}:</strong> {item.maintenanceId}
              </p>
              <p className="text-sm mb-1">
                <strong>{t("problem")}:</strong> {item.descriptionItem}
              </p>
              <p className="text-sm mb-1">
                <strong>{t("resolution")}:</strong> {item.resolutionItem}
              </p>
              <p className="text-sm mb-1">
                <strong>{t("paymentDate")}:</strong> {item.nextDatePaymentRent}
              </p>
              <p className="text-sm mb-1">
                <strong>{t("date")}:</strong> {item.dateCreated}
              </p>
              <p className="text-sm mb-1">
                <strong>{t("value")}:</strong> {item.priceResolution}
               </p>
                
                {!isAdminView && (
                <p className="text-sm mb-1">
                  <strong>{t("valueCoOwner")}:</strong> {item.maintenanceAsOwner} {t.rich("ref", { percent: item.percentBuyer })}
                </p>
              )}
              {item.cancelled && (
                <p className="text-sm text-red-600 font-bold">
                  🚫 {t("cancelled")}
                  {item.cancellationReason && (
                    <span className="text-xs font-normal"> - {item.cancellationReason}</span>
                  )}
                </p>
              )}
            </div>
            {item.metadataItem && item.metadataItem.length > 0 && (
              <div className="flex-shrink-0">
                <img
                  src={item.metadataItem}
                  alt=""
                  className="max-w-md max-h-48 object-cover cursor-pointer"
                  onClick={() => openModal(item.metadataItem)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="relative">
          <button 
              onClick={closeModal} 
              className="absolute button-circle-gray top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt={t("imageEnlarged")}
              className="max-w-full max-h-screen object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceItem;
