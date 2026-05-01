"use client";
  
  import React from "react"; 
  import InvoiceAllList from "../components/invoice/InvoiceList";
  
  export default function InvoiceList({ propertyId }: { propertyId: number; }) {

  return (
    <InvoiceAllList isAdminView={false} propertyId={propertyId} />
  );
}