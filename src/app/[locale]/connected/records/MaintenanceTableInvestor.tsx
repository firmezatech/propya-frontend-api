"use client";
  
  import React from "react"; 
  import MaintenanceBaseTableInvestor from "../components/maintenance/MaintenanceBaseTableInvestor";
  
  export default function MaintenanceTableInvestor({ propertyId, onExportDataUpdate }: { propertyId: number; onExportDataUpdate?: (data: any[]) => void }) {

  return (
    <MaintenanceBaseTableInvestor isAdminView={false} propertyId={propertyId}  />
  );
}