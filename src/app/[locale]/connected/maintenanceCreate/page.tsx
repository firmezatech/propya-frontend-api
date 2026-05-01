"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createMaintenance } from "../../../../services/web3-api";

export default function CreateMaintenancePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string>("1");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    description: "",
    resolution: "",
    metadata: "",
    priceResolution: ""
  });

  // Formatação do preço para exibição
  const [displayPrice, setDisplayPrice] = useState("");

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) setWallet(storedWallet);
    else {
      setMessage("Por favor, faça o login para continuar.");
    }

    const handleWalletChange = () => {
      const stored = localStorage.getItem("wallet");
      setWallet(stored);
    };

    window.addEventListener("walletChanged", handleWalletChange);
    return () => window.removeEventListener("walletChanged", handleWalletChange);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para lidar com a entrada de preço
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permite apenas números e uma vírgula
    if (/^[0-9]*,?[0-9]*$/.test(value) || value === '') {
      setDisplayPrice(value);
      
      // Converte o valor para centavos (formato exigido pela API)
      let cents: string;
      
      if (value === '') {
        cents = '';
      } else if (value.includes(',')) {
        const parts = value.split(',');
        const reais = parts[0] || '0';
        // Garante que sempre teremos dois dígitos decimais
        let centavos = parts[1] || '00';
        if (centavos.length === 1) centavos += '0';
        if (centavos.length > 2) centavos = centavos.substring(0, 2);
        
        // Removendo zeros à esquerda no valor em reais
        const reaisWithoutLeadingZeros = reais === '0' ? '0' : reais.replace(/^0+/, '');
        
        cents = `${reaisWithoutLeadingZeros}${centavos}`;
      } else {
        // Se não há vírgula, assume que é um valor inteiro (ex: 80 -> 8000)
        // Removendo zeros à esquerda
        const valueWithoutLeadingZeros = value === '0' ? '0' : value.replace(/^0+/, '');
        cents = `${valueWithoutLeadingZeros}00`;
      }
      
      setFormData(prev => ({
        ...prev,
        priceResolution: cents
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setMessage("Guardando imagem...");
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', 'maintenance');
      formData.append('propertyId', propertyId);
      
      const response = await fetch('/api/uploadPinata', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Check for CID in the response structure
        const cid = data.cid;
        
        if (cid) {
          // Atualizar o formData e não uma variável inexistente (maintenanceForm)
          setFormData(prev => ({
            ...prev,
            metadata: cid // Use metadata como campo para armazenar o CID
          }));
          setImageUrl(`https://gateway.pinata.cloud/ipfs/${cid}`); // Definir URL da imagem para exibição
          setMessage("Imagem guardada com sucesso!");
        } else {
          console.error("Resposta sem hash IPFS:", data);
          setMessage("Erro no formato da resposta do upload. Hash IPFS não encontrado.");
        }
      } else {
        setMessage(`Erro: ${data.message || 'Ocorreu um erro durante o upload'}`);
      }
    } catch (error) {
      console.error("Erro ao guardar imagem:", error);
      setMessage("Erro ao guardar imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { description, resolution, metadata, priceResolution } = formData;
    
    // Verificação para todos os campos obrigatórios
    if (!propertyId || !description || !resolution) {
      setMessage("Preencha todos os campos obrigatórios");
      return;
    }
    
    // Verificação específica para imagem
    if (!metadata) {
      setMessage("É necessário enviar uma imagem");
      return;
    }
    
    // Verificação específica para preço
    if (!priceResolution || priceResolution === "0" || priceResolution === "00" || parseInt(priceResolution) === 0) {
      setMessage("O preço da resolução não pode ser zero");
      return;
    }
    
    setIsCreating(true);
    setMessage("Criando nova manutenção...");
    
    try {
      const result = await createMaintenance(
        propertyId,
        description,
        resolution,
        metadata,
        priceResolution,
        "0"
      );
            
      setMessage(`Manutenção criada com sucesso! ID: ${result.maintenanceId}`);
      
      // Redirecionar após um pequeno delay para mostrar a mensagem de sucesso
      setTimeout(() => {
        router.push('/connected/maintenancesAdmin');
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao criar manutenção:", error);
      setMessage(`Erro ao criar manutenção: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4 max-w-2xl">
      <main className="mt-8 mb-12">
        <div className="flex items-center justify-between mb-6">
          <button onClick={handleCancel} className="mb-4 border rounded button-line ml-2">
            &larr; Voltar
          </button>
          <h1 className="text-xl font-medium text-gray-800">Nova Manutenção</h1>
        </div>

        {message && (
          <div className={`mb-6 rounded-md p-4 text-sm ${
            message.includes('sucesso') 
              ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
              : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 className="font-medium text-gray-700">Detalhes da Manutenção</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <input
                id="propertyId"
                type="hidden"
                name="propertyId"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fileUpload">
                  Imagem
                </label>
                <div className="flex flex-col space-y-2">
                  <label className="cursor-pointer flex items-center justify-center w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {isUploading ? "Enviando..." : "Selecionar e enviar imagem"}
                    <input
                      id="fileUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  
                  {selectedFile && (
                    <p className="text-xs text-gray-500 truncate">
                      Arquivo: {selectedFile.name}
                    </p>
                  )}
                  
                  {imageUrl && (
                    <div className="mt-2 border border-gray-200 rounded-md p-2">
                      <p className="text-xs text-gray-500 mb-1">Prévia da imagem:</p>
                      <img 
                        src={imageUrl} 
                        alt="Prévia" 
                        className="w-full h-auto max-h-40 object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
                            
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                  Descrição
                </label>
                <input
                  id="description"
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Ex: Vazamento Lavanderia"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="resolution">
                  Resolução
                </label>
                <input
                  id="resolution"
                  type="text"
                  name="resolution"
                  value={formData.resolution}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Ex: Troca do cano"
                  required
                />
              </div>
              

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="priceDisplay">
                  Preço da Resolução (R$)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R$</span>
                  </div>
                  <input
                    id="priceDisplay"
                    type="text"
                    value={displayPrice}
                    onChange={handlePriceChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Ex: 80,00"
                    required
                  />
                </div>
                {formData.priceResolution && (
                  <p className="text-xs text-gray-500 mt-1">
                    Valor: {(parseInt(formData.priceResolution) || 0) / 100} reais
                  </p>
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  isCreating || 
                  isUploading || 
                  !wallet || 
                  !formData.metadata || 
                  !formData.priceResolution || 
                  formData.priceResolution === "0" || 
                  formData.priceResolution === "00" || 
                  parseInt(formData.priceResolution) === 0
                }
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isCreating || 
                  isUploading || 
                  !wallet || 
                  !formData.metadata || 
                  !formData.priceResolution || 
                  formData.priceResolution === "0" || 
                  formData.priceResolution === "00" || 
                  parseInt(formData.priceResolution) === 0
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isCreating ? "Criando..." : "Criar Manutenção"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}