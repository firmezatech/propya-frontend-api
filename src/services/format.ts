export function truncPercentActual(value:number) {
  const actual = Math.trunc(value * 10) / 10;
  return actual.toLocaleString('pt-BR') + '%';
}

export function truncPercentMissing(value:number) {
  const actual = Math.trunc(value * 10) / 10;
  const missing = Math.trunc((100 - actual) * 10) / 10;
  return missing.toLocaleString('pt-BR') + '%';
}

export const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});


export const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  export const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };



  export const validateInternationalBrazilianPhone = (phone: string) => {
    const phoneRegex = /^\+55 \d{2} \d{8,9}$/;
    return phoneRegex.test(phone);
  };


  export const isZeroValue = (value: string): boolean => {
    // Remove R$ e espaços, substitui vírgula por ponto
    const numericValue = value
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace(',', '.')
      .trim();

    return parseFloat(numericValue) === 0;
  };

  export const convertToNumber = (value: string): string => {
    // Remove R$ e todos os caracteres exceto números e vírgula
    const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
    // Se o valor estiver vazio, retorna "0"
    if (!cleanValue) return "0";
    // Garante que é um número válido
    const num = Number(cleanValue);
    return isNaN(num) ? "0" : num.toString();
  };

  // Função para formatar a data no formato dd/mm/yyyy
  // export const formatDate = (date: Date): string => {
  //   return format(date, 'dd/MM/yyyy');
  // };


    // Função para formatar entrada de moeda
  export const formatCurrencyInput = (value: string): string => {
      // Remove tudo exceto números
      const numbers = value.replace(/\D/g, '');
      
      if (!numbers) return '';
      
      // Converte para número e divide por 100 para ter os centavos
      const amount = parseInt(numbers) / 100;
      
      // Formata como moeda brasileira
      return amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };