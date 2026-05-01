"use client";
  
  import React from "react"; 
  import MaintenanceBaseTable from "../components/maintenance/MaintenanceBaseTable";
  
  export default function MaintenanceTable({ propertyId, onExportDataUpdate }: { propertyId: number; onExportDataUpdate?: (data: any[]) => void }) {

  return (
    <MaintenanceBaseTable isAdminView={false} propertyId={propertyId}  />
  );
}