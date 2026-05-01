"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Upload, FileText, Check, X } from "lucide-react";
import { getInvoice, InvoiceData, updateInvoiceWithMetadata, PinataMetadata, APICache } from "../../../../../services/web3-api";
import { sendInvoiceEmail } from "../../../../../services/email-service";

export default function InvoiceUploadPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations("InvoiceUpload");
  const common = useTranslations("Common");

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const invoiceId = params.invoiceId as string;
  const propertyId = searchParams.get("propertyId");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        console.log('Fetching invoice with ID:', invoiceId);
        // Invalidate the cache before fetching
        APICache.invalidate('getInvoice');
        const invoiceData = await getInvoice(Number(invoiceId));
        console.log('Invoice data received:', invoiceData);
        
        if (invoiceData) {
          let invoice: InvoiceData;
          
          // Se retornar um array, pegar o primeiro elemento
          if (Array.isArray(invoiceData)) {
            if (invoiceData.length > 0) {
              invoice = invoiceData[0];
              console.log('Using first invoice from array:', invoice);
            } else {
              console.log('Array is empty');
              setMessage(t("invoiceNotFound"));
              return;
            }
          } else {
            // Se retornar um objeto único
            invoice = invoiceData;
            console.log('Using single invoice:', invoice);
          }
          
          setInvoice(invoice);
        } else {
          console.log('No invoice data received');
          setMessage(t("invoiceNotFound"));
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        setMessage(common("errorLoadingData"));
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId, t, common]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo (PDF)
      if (file.type !== 'application/pdf') {
        setMessage(t("onlyPdfAllowed"));
        return;
      }
      
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage(t("fileTooLarge"));
        return;
      }
      
      setSelectedFile(file);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !invoice) {
      setMessage(t("selectFileFirst"));
      return;
    }

    setIsUploading(true);
    setMessage(t("sendingFile"));

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('invoiceId', invoiceId);
      formData.append('propertyId', propertyId ? propertyId : invoice.propertyId.toString());

      console.log('Uploading file to Pinata...');
      const response = await fetch('/api/uploadPinata', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t("uploadError"));
      }

      const result = await response.json();
      console.log('Pinata upload result:', result);
      
      if (result.success) {
        // Usar a URL do gateway do Pinata
        const ipfsUrl = result.gateway_url;
        const pinataMetadata = {
          ipfsHash: result.ipfs_hash,
          gatewayUrl: result.gateway_url,
          pinataUrl: result.pinata_url,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          uploadDate: new Date().toISOString()
        };

        console.log('Pinata metadata to save:', pinataMetadata);
        setUploadedUrl(ipfsUrl);
        setMessage(t("uploadCompleted"));
        
        // Atualizar o status da invoice na API com o metadata do Pinata
        try {
          console.log('Updating invoice with metadata...');
          const updateResult = await updateInvoiceWithMetadata(invoiceId, ipfsUrl, 2, pinataMetadata);
          console.log('Update result:', updateResult);
          
          if (updateResult.success) {
            setMessage(t("uploadCompleted"));
            
            // Enviar email com o template de invoice
            try {
              console.log('Sending invoice email...');
              const emailResult = await sendInvoiceEmail({
                invoiceNumber: invoice.invoiceId.toString(),
                amount: invoice.totalInvoice,
                dueDate: invoice.dueDate,
                propertyId: invoice.propertyId,
                boletoUrl: ipfsUrl || undefined
              });

              if (emailResult.success) {
                console.log('Email sent successfully');
              } else {
                console.warn('Warning: Failed to send email:', emailResult.message);
              }
            } catch (emailError) {
              console.error('Error sending email:', emailError);
            }
          } else {
            console.warn("Warning: Failed to update invoice in API:", updateResult.message);
            setMessage(t("errorUpdatingInvoice"));
          }
        } catch (updateError) {
          console.error("Error updating invoice in API:", updateError);
          setMessage(t("errorUpdatingInvoice"));
        }
        
      } else {
        throw new Error(result.error || t("uploadError"));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(error instanceof Error ? error.message : t("uploadError"));
    } finally {
      setIsUploading(false);
    }
  };

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">{common("loading")} {invoiceId && `(Invoice ID: ${invoiceId})`}</p>
          {message && (
            <div className="mt-4">
              <p className="text-red-600 mb-4">{message}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {common("retry") || "Tentar novamente"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleBackNavigation = () => {
    router.back();
  };

  const handleFinish = () => {
    window.location.href = '/connected/invoicesAdmin';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">

        <button onClick={handleBackNavigation} className="border rounded button-line ml-2">
            {t("back")}
            </button>
&nbsp;&nbsp;

          <h1 className="text-2xl font-bold">{t("uploadTitle")} #{invoice.invoiceId}</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t("invoiceInfo")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">{t("invoiceNumber")}</span>
              <span className="ml-2 font-medium">#{invoice.invoiceId}</span>
            </div>
            <div>
              <span className="text-gray-600">{t("dueDate")}</span>
              <span className="ml-2 font-medium">{invoice.dueDate}</span>
            </div>
            <div>
              <span className="text-gray-600">{t("totalAmount")}</span>
              <span className="ml-2 font-medium">{invoice.totalInvoice}</span>
            </div>
            <div>
              <span className="text-gray-600">{t("status")}</span>
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                {t("statusCreated")}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t("uploadSection")}</h2>
          
          {!uploadedUrl ? (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  {t("selectPdfFile")}
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 inline-flex items-center"
                >
                  <Upload size={16} className="mr-2" />
                  {t("selectFileButton")}
                </label>
              </div>

              {selectedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText size={20} className="text-red-600 mr-2" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-gray-500 ml-2">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-white hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={handleBackNavigation}
                  className="px-6 py-2 border rounded-lg text-sm button"
                >
                  {common("cancel")}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className={`button px-6 py-2 rounded-lg text-white text-sm flex items-center ${
                    selectedFile && !isUploading
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t("uploading")}
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      {t("uploadButton")}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                {t("uploadSuccess")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("uploadSuccessMessage")}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">{t("ipfsUrl")}</p>
                <a
                  href={uploadedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm break-all"
                >
                  {uploadedUrl}
                </a>
              </div>
              <button
                onClick={handleFinish}
                className="bg-blue-600 text-white text-sm px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {t("backToList")}
              </button>
            </div>
          )}
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.includes('sucesso') || message.includes('Concluído')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 