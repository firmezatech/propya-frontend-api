"use client";

import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
import { useTranslations } from "next-intl";

interface TableExportProps {
  data: any[];
  headers: string[];
  filename: string;
  title?: string;
  className?: string;
}

interface ExportOptions {
  csv: boolean;
  excel: boolean;
  pdf: boolean;
}

const TableExport: React.FC<TableExportProps> = ({
  data,
  headers,
  filename,
  title = "Exportar Dados",
  className = ""
}) => {
  const t = useTranslations("Common");
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Debug: Verificar dados recebidos
  console.log("🔍 TableExport recebeu:", {
    data: data,
    headers: headers,
    filename: filename,
    title: title,
    dataLength: data?.length || 0
  });

  // Função para limpar e formatar dados para exportação
  const cleanDataForExport = (data: any[]) => {
    return data.map(item => {
      const cleanedItem: any = {};
      headers.forEach(header => {
        // Remove HTML tags e formatação
        let value = item[header] || '';
        if (typeof value === 'string') {
          value = value.replace(/<[^>]*>/g, '').trim();
          // Remove caracteres especiais que podem causar problemas no CSV
          value = value.replace(/"/g, '""');
        }
        cleanedItem[header] = value;
      });
      return cleanedItem;
    });
  };

  // Função para exportar para CSV
  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      if (!data || data.length === 0) {
        alert('Não há dados para exportar');
        setIsExporting(false);
        setShowOptions(false);
        return;
      }
      
      const cleanedData = cleanDataForExport(data);
      
      // Criar cabeçalhos
      const csvHeaders = headers.join(',');
      
      // Criar linhas de dados
      const csvRows = cleanedData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escapar aspas duplas e envolver em aspas se contém vírgula
          return value.includes(',') || value.includes('"') || value.includes('\n') 
            ? `"${value}"` 
            : value;
        }).join(',')
      );
      
      // Combinar cabeçalhos e dados
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Adicionar BOM para UTF-8 (para caracteres especiais)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
      
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao exportar arquivo CSV');
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  // Função para exportar para Excel (formato simples)
  const exportToExcel = () => {
    setIsExporting(true);
    
    try {
      if (!data || data.length === 0) {
        alert('Não há dados para exportar');
        setIsExporting(false);
        setShowOptions(false);
        return;
      }
      
      const cleanedData = cleanDataForExport(data);
      
      // Criar conteúdo HTML para Excel
      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <meta name="ProgId" content="Excel.Sheet">
          <meta name="Generator" content="Microsoft Excel 11">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${cleanedData.map(row => 
                `<tr>${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.ms-excel;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.xls`;
      link.click();
      
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao exportar arquivo Excel');
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  // Função para exportar para PDF (versão simples)
  const exportToPDF = () => {
    setIsExporting(true);
    
    try {
      if (!data || data.length === 0) {
        alert('Não há dados para exportar');
        setIsExporting(false);
        setShowOptions(false);
        return;
      }
      
      const cleanedData = cleanDataForExport(data);
      
      // Criar conteúdo HTML para PDF
      let htmlContent = `
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Inter, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; margin-bottom: 30px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${cleanedData.map(row => 
                `<tr>${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Exportado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p>Total de registros: ${cleanedData.length}</p>
          </div>
        </body>
        </html>
      `;
      
      // Abrir em nova janela para impressão/PDF
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.title = title || 'Relatório de Exportação';
        printWindow.document.close();
        printWindow.focus();
        
        // Aguardar um pouco para o conteúdo carregar
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar arquivo PDF');
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  // Remover a condição que impede a renderização quando não há dados
  // if (!data || data.length === 0) {
  //   return null;
  // }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <Download size={16} />
        {isExporting ? 'Exportando...' : 'Exportar'}
      </button>

      {showOptions && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
          <div className="py-2">
            <button
              onClick={() => { window.location.href = "/connected/comingSoon"; }}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50"
            >
              <FileText size={16} className="text-green-600" />
              <span>Exportar CSV</span>
            </button>
            
            <button
              onClick={exportToExcel}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50"
            >
              <FileSpreadsheet size={16} className="text-green-600" />
              <span>Exportar Excel</span>
            </button>
            
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50"
            >
              <File size={16} className="text-red-600" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay para fechar o menu ao clicar fora */}
      {showOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
};

export default TableExport;
